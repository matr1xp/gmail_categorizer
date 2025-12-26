import { OAuth2Client } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { LABEL_DEFINITIONS } from '../config/labels';

export async function getUnreadMessages(auth: OAuth2Client, limit: number = 20): Promise<gmail_v1.Schema$Message[]> {
  const gmail = google.gmail({ version: 'v1', auth });
  let messages: gmail_v1.Schema$Message[] = [];
  let nextPageToken: string | undefined = undefined;

  console.log(`Fetching unread messages (limit: ${limit === -1 ? 'ALL' : limit})...`);

  do {
      // Calculate how many to fetch in this page
      const remaining = limit === -1 ? 500 : limit - messages.length;
      if (remaining <= 0) break;
      
      const maxResults = Math.min(remaining, 500); // API max is 500

      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: maxResults,
        pageToken: nextPageToken
      }) as { data: gmail_v1.Schema$ListMessagesResponse };

      const pageMessages = res.data.messages || [];
      if (pageMessages.length === 0) break;

      messages = messages.concat(pageMessages);
      nextPageToken = res.data.nextPageToken ?? undefined;
      
      console.log(`  Fetched ${messages.length} message IDs so far...`);

  } while (nextPageToken && (limit === -1 || messages.length < limit));

  console.log(`Hydrating ${messages.length} messages...`);
  
  const fullMessages: gmail_v1.Schema$Message[] = [];
  const BATCH_SIZE = 10; // Parallel requests to speed up hydration

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const chunk = messages.slice(i, i + BATCH_SIZE);
      const promises = chunk.map(msg => 
          msg.id ? gmail.users.messages.get({
             userId: 'me',
             id: msg.id,
             format: 'full'
         }).then(r => r.data).catch(e => {
             console.error(`Failed to fetch message ${msg.id}`, e);
             return null;
         }) : Promise.resolve(null)
      );
      
      const results = await Promise.all(promises);
      results.forEach(m => {
          if (m) fullMessages.push(m);
      });
      
      // distinct logging to show progress
       if ((i + BATCH_SIZE) % 50 === 0) process.stdout.write('.');
  }
  console.log('\nHydration complete.');

  return fullMessages;
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

export async function applyLabel(auth: OAuth2Client, messageId: string, labelId: string) {
    const gmail = google.gmail({ version: 'v1', auth });
    
    // We expect labelId to be passed directly now to avoid re-fetching
    // But if we want to keep signature compatible or robust, we can adjust.
    // Let's change the signature to take labelId for efficiency, 
    // since we will have the map in main().
    
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                addLabelIds: [labelId],
                // removed removeLabelIds: ['UNREAD'] to preserve unread status
            }
        });
        console.log(`Applied label ID ${labelId} to message ${messageId}`);
    } catch (error) {
        console.error(`Failed to apply label ${labelId}`, error);
    }
}

// remove unused local helper if we change the signature of applyLabel
