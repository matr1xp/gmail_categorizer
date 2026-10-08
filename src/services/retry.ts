// Shared retry with exponential backoff for Gmail and Gemini API calls

const MAX_ATTEMPTS = 6;
const MAX_DELAY_MS = 60_000;

// Thrown when a daily quota is used up; retrying won't help until it resets
export class QuotaExhaustedError extends Error {}

function errorStatus(error: any): number | undefined {
    const status = error?.status ?? error?.response?.status ?? error?.code;
    return typeof status === 'number' ? status : undefined;
}

function isDailyQuota(error: any): boolean {
    return /PerDay/i.test(String(error?.message ?? ''));
}

function isRetryable(error: any): boolean {
    const status = errorStatus(error);
    if (status === 429 || (status !== undefined && status >= 500)) return true;
    // Gmail reports per-minute rate limits as 403
    return status === 403 && /rate ?limit|quota exceeded/i.test(String(error?.message ?? ''));
}

export function shortError(error: any): string {
    const status = errorStatus(error);
    const message = String(error?.message ?? error).split('\n')[0].slice(0, 200);
    return status ? `[${status}] ${message}` : message;
}

export async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (isDailyQuota(error)) throw new QuotaExhaustedError(shortError(error));
            if (!isRetryable(error) || attempt >= MAX_ATTEMPTS) throw error;

            const delay = Math.min(2 ** attempt * 1000, MAX_DELAY_MS) + Math.random() * 1000;
            console.warn(`  ${label}: ${shortError(error)} - retrying in ${Math.round(delay / 1000)}s (attempt ${attempt}/${MAX_ATTEMPTS - 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
