export async function withRetry<T = any>(fn: () => Promise<T>, retries = 5, delay = 500): Promise<T> {
  if ((global as any)._dbIsBroken) {
    throw new Error("Database connection is broken. Aborting query to prevent retry flood.");
  }

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || String(err);
      const cause = err?.cause || err?.originalError || (err as any)?.driverError;
      const causeMessage = cause instanceof Error ? cause.message : String(cause || '');
      const causeCode = (cause as any)?.code || err?.code || '';
      const fullError = `${errorMessage} ${causeMessage} ${causeCode}`.toLowerCase();
      
      const isNonRetryable = 
        fullError.includes('does not exist') ||
        fullError.includes('syntax error') ||
        fullError.includes('duplicate key') ||
        fullError.includes('unique constraint') ||
        fullError.includes('violates null constraint') ||
        fullError.includes('violates foreign key') ||
        fullError.includes('invalid input syntax') ||
        fullError.includes('cannot cast') ||
        causeCode === '42703' ||
        causeCode === '42P01' ||
        causeCode === '23505' ||
        causeCode === '23502' ||
        causeCode === '23503' ||
        causeCode === '22P02' ||
        causeCode === '22003';

      // Treat ANY unknown error as retryable if it's not a clear SQL syntax/constraint error
      const isRetryable = !isNonRetryable;

      if (isRetryable && i < retries - 1) {
        // Use exponential backoff with jitter, capped at 5000ms
        const baseDelay = delay * Math.pow(2, i);
        const jitter = Math.random() * 200;
        const currentDelay = Math.min(5000, baseDelay + jitter);
        
        // Only log transient errors at attempt 2 or higher to reduce log noise for harmless connection drops
        if (i >= 1) {
           console.warn(`[DB] Transient error (Attempt ${i + 1}/${retries}), retrying in ${Math.round(currentDelay)}ms. Error: ${errorMessage}. Code: ${causeCode}`);
        }
        await new Promise(resolve => setTimeout(resolve, currentDelay)); 
        continue;
      }

      console.error(`[DB FATAL] Query failed after ${retries} attempts: ${errorMessage}. Cause: ${causeMessage}. Code: ${causeCode}`);
      throw err;
    }
  }
  throw lastError;
}
