import { config } from 'dotenv';
config();
import { db } from './src/db';
import { users, registrations, payments, documents } from './src/db/schema';
import { eq, and, ne, gte, sql } from 'drizzle-orm';

async function test() {
  const allUsers = await db.select({
    id: users.id, name: users.name, role: users.role, workspaceId: users.workspaceId
  }).from(users);
  console.log("All Users:", allUsers);
  process.exit(0);
}
test();
