import dotenv from 'dotenv';
import { authenticate } from './services/auth';
import { uncategorizedMessages, ensureLabelsExist, applyLabel, FetchStats } from './services/gmail';
import { categorizeEmail } from './services/categorizer';
import { QuotaExhaustedError } from './services/retry';

dotenv.config();

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  let limit = 20; // default
  
  if (args.includes('--all')) {
      limit = -1;
  } else {
      const limitIdx = args.indexOf('--limit');
      if (limitIdx !== -1 && args[limitIdx + 1]) {
          limit = parseInt(args[limitIdx + 1], 10);
      }
  }

  console.log(`Gmail Categorizer Agent Starting... (Mode: ${limit === -1 ? 'ALL' : limit})`);
  
  try {
    const auth = await authenticate();
    console.log('Authentication successful');

    // Ensure labels exist first and get the map
    const labelMap = await ensureLabelsExist(auth);
    const categoryLabelIds = new Set(Object.values(labelMap));

    // Messages stream in batch by batch; already-categorized ones are filtered out while fetching
    const stats: FetchStats = { scanned: 0, skipped: 0, failed: 0 };
    let processedCount = 0;
    let uncategorizedCount = 0;

    try {
      for await (const msg of uncategorizedMessages(auth, categoryLabelIds, limit, stats)) {
          if (!msg.id) continue;

          const headers = msg.payload?.headers;
          const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';

          const snippet = msg.snippet || '';

          console.log(`Processing: ${subject}`);

          const category = await categorizeEmail(subject, snippet);

          if (category && labelMap[category]) {
              console.log(`  -> Category: ${category}`);
              if (await applyLabel(auth, msg.id, labelMap[category])) processedCount++;
          } else if (category && !labelMap[category]) {
               console.error(`  -> Category ${category} found but no Label ID mapped.`);
          } else {
              console.log(`  -> Could not categorize (API Key missing or error)`);
              uncategorizedCount++;
          }
      }
      console.log('\nBatch processing complete.');
    } catch (error) {
      if (!(error instanceof QuotaExhaustedError)) throw error;
      console.error(`\nStopped: daily API quota used up. Rerun after it resets to continue.\n  ${error.message}`);
    } finally {
      console.log(`Processed: ${processedCount}`);
      console.log(`Could not categorize: ${uncategorizedCount}`);
      console.log(`Failed to fetch: ${stats.failed}`);
      console.log(`Skipped (Already categorized): ${stats.skipped}`);
      console.log(`Total Scanned: ${stats.scanned}`);
    }

  } catch (error) {
    console.error('Error in main execution:', error);
  }
}

main();
