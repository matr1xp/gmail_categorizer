import { GoogleGenerativeAI } from '@google/generative-ai';
import { LABEL_DEFINITIONS, LabelName } from '../config/labels';
import { withRetry, shortError, QuotaExhaustedError } from './retry';
import dotenv from 'dotenv';
dotenv.config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Override with GEMINI_MODEL in .env when Google retires a model
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

export async function categorizeEmail(subject: string, snippet: string): Promise<LabelName | null> {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const labelsDesc = Object.entries(LABEL_DEFINITIONS)
        .map(([name, desc]) => `- ${name}: ${desc}`)
        .join('\n');

    const prompt = `
You are an intelligent email assistant. Categorize the following email into exactly one of these categories:

${labelsDesc}

Email Subject: "${subject}"
Email Snippet: "${snippet}"

Reply ONLY with the exact category name. If none fit perfectly, choose 'System Notification' or 'Personal' as a fallback, or whichever is closest.
    `.trim();

    try {
        const result = await withRetry('Gemini', () => model.generateContent(prompt));
        const response = await result.response;
        const text = response.text().trim();

        // Validate that the returned text is a valid label
        if (text in LABEL_DEFINITIONS) {
            return text as LabelName;
        } else {
            console.warn(`LLM returned invalid label: ${text}`);
            // Simple fallback logic or retry potentially
            // For now, check if the text *contains* a label or match loosely
            const found = Object.keys(LABEL_DEFINITIONS).find(k => text.includes(k));
            if (found) return found as LabelName;
            
            return 'System Notification';
        }
    } catch (error) {
        // A used-up daily quota fails every remaining email, so stop the run
        if (error instanceof QuotaExhaustedError) throw error;
        console.error(`Error in categorization: ${shortError(error)}`);
        return null;
    }
}
