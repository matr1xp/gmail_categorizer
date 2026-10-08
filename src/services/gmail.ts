import { OAuth2Client } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { LABEL_DEFINITIONS } from '../config/labels';
import { withRetry, shortError, QuotaExhaustedError } from './retry';

// All received mail; sent messages and drafts are not categorized
const MESSAGE_QUERY = '-in:sent -in:drafts';

export interface FetchStats {
  scanned: number;
  skipped: number;
  failed: number;
}

// Yields up to `limit` messages (-1 = all) that don't carry any category label yet.
// Messages are streamed batch by batch so labels get applied while paging continues,
// and already-categorized messages don't count toward the limit.
// Only Subject, snippet and labelIds are fetched (format: 'metadata') to keep memory flat.
export async function* uncategorizedMessages(
  auth: OAuth2Client,
  categoryLabelIds: Set<string>,
  limit: number,
  stats: FetchStats
): AsyncGenerator<gmail_v1.Schema$Message> {
  const gmail = google.gmail({ version: 'v1', auth });
  let yielded = 0;
  let nextPageToken: string | undefined = undefined;
  const BATCH_SIZE = 10; // Parallel requests to speed up hydration
  const isDone = () => limit !== -1 && yielded >= limit;

  console.log(`Fetching uncategorized messages (limit: ${limit === -1 ? 'ALL' : limit})...`);

  do {
      const pageToken = nextPageToken;
      const res = await withRetry('List messages', () => gmail.users.messages.list({
        userId: 'me',
        q: MESSAGE_QUERY,
        maxResults: 500, // API max is 500
        pageToken
      })) as { data: gmail_v1.Schema$ListMessagesResponse };

      const pageMessages = res.data.messages || [];
      if (pageMessages.length === 0) break;
      nextPageToken = res.data.nextPageToken ?? undefined;

      for (let i = 0; i < pageMessages.length && !isDone(); i += BATCH_SIZE) {
          const chunk = pageMessages.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(chunk.map(msg =>
              msg.id ? withRetry(`Fetch ${msg.id}`, () => gmail.users.messages.get({
                 userId: 'me',
                 id: msg.id!,
                 format: 'metadata',
                 metadataHeaders: ['Subject']
             })).then(r => r.data).catch(e => {
                 if (e instanceof QuotaExhaustedError) throw e;
                 console.error(`Failed to fetch message ${msg.id}: ${shortError(e)}`);
                 stats.failed++;
                 return null;
             }) : Promise.resolve(null)
          ));

          for (const m of results) {
              if (!m || isDone()) continue;
              stats.scanned++;
              if ((m.labelIds || []).some(id => categoryLabelIds.has(id))) {
                  stats.skipped++;
              } else {
                  yielded++;
                  yield m;
              }
          }
      }

      console.log(`  Scanned ${stats.scanned} messages (${stats.skipped} already categorized, ${stats.failed} failed)...`);

  } while (nextPageToken && !isDone());
}

export async function ensureLabelsExist(auth: OAuth2Client): Promise<Record<string, string>> {
  const gmail = google.gmail({ version: 'v1', auth });
  
  // 1. List existing labels
  let res = await gmail.users.labels.list({ userId: 'me' });
  let existingLabels = res.data.labels || [];
  let existingNames = new Set(existingLabels.map(l => l.name));
  const labelMap: Record<string, string> = {};

  // Populate map with existing relevant labels
  existingLabels.forEach(l => {
      if (l.name && l.id && l.name in LABEL_DEFINITIONS) {
          labelMap[l.name] = l.id;
      }
  });

  console.log('Checking labels...');

  // 2. Create missing labels
  for (const labelName of Object.keys(LABEL_DEFINITIONS)) {
      if (!existingNames.has(labelName)) {
          console.log(`Creating label: ${labelName}`);
          try {
            const createRes = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                }
            });
            if (createRes.data.id) {
                labelMap[labelName] = createRes.data.id;
            }
          } catch (e) {
              console.error(`Failed to create label ${labelName}`, e);
          }
      }
  }
  return labelMap;
}

// Returns whether the label was applied
export async function applyLabel(auth: OAuth2Client, messageId: string, labelId: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        await withRetry(`Label ${messageId}`, () => gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                addLabelIds: [labelId],
                // removed removeLabelIds: ['UNREAD'] to preserve unread status
            }
        }));
        return true;
    } catch (error) {
        if (error instanceof QuotaExhaustedError) throw error;
        console.error(`Failed to apply label ${labelId} to ${messageId}: ${shortError(error)}`);
        return false;
    }
}

// remove unused local helper if we change the signature of applyLabel
