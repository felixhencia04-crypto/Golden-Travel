import { db } from './src/db/index.ts';
async function test() {
  try {
    const users = await db.query.users.findMany();
    console.log("Users:", users.length);
  } catch (err: any) {
    console.error("Error:", err);
    console.error("Message:", err.message);
    console.error("Cause:", err.cause);
  }
  process.exit(0);
}
test();
