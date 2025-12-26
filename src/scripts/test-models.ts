import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function main() {
  try {
      // There isn't a direct listModels on genAI instance in some versions, 
      // but let's try the model manager if exposed or just try a standard model like 'gemini-pro' again with correct error handling.
      // Actually, the error message said: "Call ListModels to see the list of available models"
      // attempting to use the lower level API if possible or just try a few known ones.
      
      // Since the SDK wraps the API, let's try to just hit the REST API to see what's up if SDK fails, 
      // but let's try to use the model 'gemini-1.0-pro' which is the older stable one.
      
      console.log("Testing model access...");
      
      const modelsToTest = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];
      
      for (const m of modelsToTest) {
          try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${m} works. Response: ${result.response.text()}`);
            break; // Found one
          } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.log(`FAILED: ${m}. Error: ${msg}`);
          }
      }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
