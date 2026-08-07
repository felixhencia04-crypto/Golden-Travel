import { db } from './src/db/index.ts';
async function test() {
  const payments = await db.query.payments.findMany({ limit: 5 });
  for (const pay of payments) {
     console.log(pay.id, "proof length:", pay.proofUrl?.length || 0);
  }
}
test().then(() => process.exit(0)).catch(console.error);
