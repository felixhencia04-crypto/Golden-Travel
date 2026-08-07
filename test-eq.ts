import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
import * as schema from './src/db/schema.ts';
async function test() {
  try {
    const res = await db.query.equipment.findMany();
    console.log("res:", res);
  } catch (err: any) {
    console.error("Error:", err);
  }
}
test().then(() => process.exit(0)).catch(() => process.exit(1));
