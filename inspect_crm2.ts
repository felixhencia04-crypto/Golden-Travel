import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function run() {
  const data = await db.select({
        registration: schema.registrations,
        user: schema.users,
      })
      .from(schema.users)
      .leftJoin(schema.registrations, eq(schema.users.id, schema.registrations.userId))
      .where(eq(schema.users.role, 'jamaah'));
      
  console.log(`Found ${data.length} CRM rows (including deleted).`);
  for (const row of data) {
    const paxCount = row.registration?.paxData?.length || 0;
    console.log(`User: ${row.user.name}, Reg: ${row.registration?.id || 'none'}, PaxCount: ${paxCount}, Deleted: ${row.user.deletedAt !== null}`);
  }
}
run().then(() => process.exit(0));
