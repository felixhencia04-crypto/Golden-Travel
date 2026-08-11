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
      
      const extractInfo = (e: any): { text: string; code: string } => {
        if (!e) return { text: '', code: '' };
        let text = typeof e === 'string' ? e : (e.message || '');
        if (e.detail) text += ' ' + e.detail;
        if (e.hint) text += ' ' + e.hint;
        let code = e.code || e.sqlState || '';
        if (e.cause) {
          const sub = extractInfo(e.cause);
          text += ' ' + sub.text;
          if (!code && sub.code) code = sub.code;
        }
        if (e.driverError) {
          const sub = extractInfo(e.driverError);
          text += ' ' + sub.text;
          if (!code && sub.code) code = sub.code;
        }
        if (e.originalError) {
          const sub = extractInfo(e.originalError);
          text += ' ' + sub.text;
          if (!code && sub.code) code = sub.code;
        }
        return { text, code };
      };

      const { text: fullErrorText, code: causeCode } = extractInfo(err);
      const fullError = fullErrorText.toLowerCase();

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

      const isRetryable = !isNonRetryable;

      if (isRetryable && i < retries - 1) {
        const baseDelay = delay * Math.pow(2, i);
        const jitter = Math.random() * 200;
        const currentDelay = Math.min(5000, baseDelay + jitter);
        
        if (i >= 1) {
           console.warn(`[DB] Transient error (Attempt ${i + 1}/${retries}), retrying in ${Math.round(currentDelay)}ms. Error: ${errorMessage}. Code: ${causeCode}`);
        }
        await new Promise(resolve => setTimeout(resolve, currentDelay)); 
        continue;
      }

      console.error(`[DB FATAL] Query failed after ${retries} attempts: ${errorMessage}. Code: ${causeCode}`);
      throw err;
    }
  }
  throw lastError;
}
