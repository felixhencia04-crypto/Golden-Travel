import { withRetry } from './src/db/retry.ts';
async function test() {
  let attempts = 0;
  await withRetry(async () => {
    attempts++;
    if (attempts === 1) {
      const err: any = new Error("DrizzleQueryError: Failed query: select ...");
      err.cause = new Error("Connection terminated unexpectedly");
      throw err;
    }
    console.log("Success on attempt", attempts);
  });
}
test().catch(console.error);
