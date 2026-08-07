import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';
async function test() {
  try {
    const res = await db.query.equipment.findMany({ limit: 1 });
    console.log(res);
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Cause:", err.cause);
  }
}
test().then(() => process.exit(0)).catch(() => process.exit(1));
