import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function test() {
  try {
    const res = await db.execute(sql.raw('ALTER TABLE "equipment_status" ADD COLUMN "ihram" boolean;'));
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Error:", err);
  }
}
test().then(() => process.exit(0)).catch(() => process.exit(1));
