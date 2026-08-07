import { config } from 'dotenv';
config();
import { db } from './src/db';
import { registrations } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const id = "d6bb2c49-a352-41bc-849c-bb70f3530f21";
    const res = await db.query.registrations.findMany({
      where: eq(registrations.packageId, id),
      limit: 1
    });
    console.log("Success:", res);
  } catch (e: any) {
    console.error("Error Object:", e);
    console.error("Error Message:", e.message);
    if (e.cause) console.error("Cause:", e.cause);
    if (e.code) console.error("Code:", e.code);
  } finally {
    process.exit(0);
  }
}
test();
