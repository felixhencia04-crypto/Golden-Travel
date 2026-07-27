export async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 300): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = String(err?.message || '');
      const causeMessage = String(err?.cause?.message || err?.cause || '');
      const causeCode = String(err?.cause?.code || err?.code || '');
      const fullError = `${errorMessage} ${causeMessage} ${causeCode} ${JSON.stringify(err?.cause || {})}`.toLowerCase();
      
      const isRetryable = 
        errorMessage.startsWith('Failed query:') ||
        fullError.includes('terminated unexpectedly') || 
        fullError.includes('connection terminated') ||
        fullError.includes('socket has been closed') ||
        fullError.includes('econnreset') ||
        fullError.includes('read econnreset') ||
        fullError.includes('client was closed') ||
        fullError.includes('connection is closed') ||
        fullError.includes('database connection error') ||
        fullError.includes('failed to connect') ||
        fullError.includes('connection timeout') ||
        fullError.includes('timeout') ||
        causeCode === '57P01' ||
        causeCode === 'ECONNRESET';

      if (isRetryable && i < retries - 1) {
        const currentDelay = delay * (i + 1);
        console.warn(`[DB RETRY] Database query error detected. Attempt ${i + 1}/${retries}. Retrying in ${currentDelay}ms. Error: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, currentDelay)); 
        continue;
      }
      console.error(`[DB ERROR] Error encountered after retries or non-retryable: ${errorMessage}`, err);
      throw err;
    }
  }
  throw lastError;
}
