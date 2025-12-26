import { authorizeManual } from '../services/auth';

const code = process.argv[2];

if (!code) {
  console.error('Please provide the auth code as the first argument.');
  process.exit(1);
}

async function main() {
  try {
    await authorizeManual(code);
    console.log('Authentication successful! Token saved to token.json');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    process.exit(1);
  }
}

main();
