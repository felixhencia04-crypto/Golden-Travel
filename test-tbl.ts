import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function test() {
  try {
    const res: any = await db.execute(sql.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment_status'"));
    console.log("table res:", res.rows);
  } catch (err: any) {
    console.error("Error:", err);
  }
}
test().then(() => process.exit(0)).catch(() => process.exit(1));
