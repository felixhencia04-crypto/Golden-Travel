import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
async function test() {
  await db.query.registrations.findFirst({ where: eq(schema.registrations.id, '.') });
  console.log("OK");
}
test().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
