import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function run() {
  const data = await db.select({
        registration: schema.registrations,
        user: schema.users,
      })
      .from(schema.users)
      .leftJoin(schema.registrations, eq(schema.users.id, schema.registrations.userId));
  
  console.log(`Found ${data.length} total rows.`);
  const userCounts = new Map();
  for (const row of data) {
    userCounts.set(row.user.id, (userCounts.get(row.user.id) || 0) + 1);
  }
  for (const [userId, count] of userCounts.entries()) {
    if (count > 1) {
      console.log(`User ${userId} appears ${count} times!`);
    }
  }
}
run().then(() => process.exit(0));
