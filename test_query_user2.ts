import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("Testing db.query.users.findFirst...");
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'fidinvoice@gmail.com')
    });
    console.log("Found user:", user?.id, user?.email, user?.name);
  } catch (err: any) {
    console.error("EXACT ERROR STACK:");
    console.error(err);
  }
}

main().then(() => process.exit(0));
