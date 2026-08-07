import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { sql } from 'drizzle-orm';
async function test() {
  const regs = await db.query.registrations.findMany({ limit: 5 });
  for (const reg of regs) {
     const str = JSON.stringify(reg.paxData);
     console.log(reg.id, "length:", str.length);
     if (str.length > 50000) {
        console.log("HUGE PAXDATA FOUND!", str.substring(0, 100));
     }
  }
}
test().then(() => process.exit(0)).catch(console.error);
