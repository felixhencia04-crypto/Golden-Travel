import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function test() {
  console.log('Querying...');
  const res = await db.execute(sql`SELECT 1`);
  console.log('Result:', res.rows);
  console.log('Waiting 5s...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('Querying again...');
  const res2 = await db.execute(sql`SELECT 1`);
  console.log('Result2:', res2.rows);
  
  if (global._postgresPool) {
    await global._postgresPool.end();
  }
}
test().catch(console.error);
