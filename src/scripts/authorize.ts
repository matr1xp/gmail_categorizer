import { getAuthUrl, authorizeManual } from '../services/auth';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    const url = await getAuthUrl();
    console.log('Authorize this app by visiting this url:');
    console.log(url);
    
    rl.question('Enter the code from that page here: ', async (code) => {
      try {
        await authorizeManual(code);
        console.log('Authentication successful! Token saved to token.json');
        process.exit(0);
      } catch (err) {
        console.error('Error retrieving access token', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Error generating auth URL:', error);
    process.exit(1);
  }
}

main();
