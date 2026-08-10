import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allUsers = await db.query.users.findMany({ where: eq(schema.users.role, 'jamaah') });
  for (const u of allUsers) {
    console.log(`User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
  }
}
run().then(() => process.exit(0));
