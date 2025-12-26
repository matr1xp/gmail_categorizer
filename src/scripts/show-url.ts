import { getAuthUrl } from '../services/auth';

async function main() {
  try {
    const url = await getAuthUrl();
    console.log(url);
  } catch (error) {
    console.error('Error generating auth URL:', error);
  }
}

main();
