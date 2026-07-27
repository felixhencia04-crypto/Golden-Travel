export async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err.message || '';
      const causeMessage = err.cause?.message || '';
      const fullError = (errorMessage + " " + causeMessage).toLowerCase();
      
      const isRetryable = 
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
        fullError.includes('timeout');

      if (isRetryable) {
        const currentDelay = delay * (i + 1);
        // Only warn if we've failed more than once to reduce noise in the console for transient blips
        if (i > 0) {
          console.warn(`[DB RETRY] Database connection error detected. Attempt ${i + 1}/${retries}. Waiting ${currentDelay}ms. Error: ${errorMessage}`);
        }
        await new Promise(resolve => setTimeout(resolve, currentDelay)); 
        continue;
      }
      console.error(`[DB ERROR] Non-retryable error encountered: ${errorMessage}`, err);
      throw err;
    }
  }
  console.error(`[DB FATAL] Failed after ${retries} retries. Last error:`, lastError);
  throw lastError;
}
