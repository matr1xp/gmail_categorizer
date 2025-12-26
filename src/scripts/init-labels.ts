import { authenticate } from '../services/auth';
import { ensureLabelsExist } from '../services/gmail';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    try {
        console.log("Authenticating...");
        const auth = await authenticate();
        console.log("Ensuring labels exist...");
        await ensureLabelsExist(auth);
        console.log("Done.");
    } catch (e) {
        console.error(e);
    }
}

main();
