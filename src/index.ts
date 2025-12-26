import dotenv from 'dotenv';
import { authenticate } from './services/auth';
import { getUnreadMessages, ensureLabelsExist, applyLabel } from './services/gmail';
import { categorizeEmail } from './services/categorizer';

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

    console.log('Fetching unread messages...');
    const messages = await getUnreadMessages(auth, limit);
    console.log(`\nFound ${messages.length} unread messages to process.`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const msg of messages) {
        if (!msg.id) continue;

        // Check if already categorized
        const msgLabels = msg.labelIds || [];
        const hasCategory = msgLabels.some(id => categoryLabelIds.has(id));
        
        const headers = msg.payload?.headers;
        const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
        
        if (hasCategory) {
            // console.log(`Skipping (Already Categorized): ${subject}`);
            skippedCount++;
            continue;
        }

        const snippet = msg.snippet || '';

        console.log(`Processing: ${subject}`);

        const category = await categorizeEmail(subject, snippet);
        
        if (category && labelMap[category]) {
            console.log(`  -> Category: ${category}`);
            await applyLabel(auth, msg.id, labelMap[category]);
            processedCount++;
        } else if (category && !labelMap[category]) {
             console.error(`  -> Category ${category} found but no Label ID mapped.`);
        } else {
            console.log(`  -> Could not categorize (API Key missing or error)`);
        }
    }
    
    console.log('\nBatch processing complete.');
    console.log(`Processed: ${processedCount}`);
    console.log(`Skipped (Already categorized): ${skippedCount}`);
    console.log(`Total Scanned: ${messages.length}`);

  } catch (error) {
    console.error('Error in main execution:', error);
  }
}

main();
