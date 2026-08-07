import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function test() {
  try {
    const res: any = await db.execute(sql.raw("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'equipment_status' AND column_name = 'ihram'"));
    console.log("res:", res);
    console.log("res.rows:", res.rows);
  } catch (err: any) {
    console.error("Error:", err);
  }
}
test().then(() => process.exit(0)).catch(() => process.exit(1));
