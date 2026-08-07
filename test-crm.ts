import { config } from 'dotenv';
config();
import { db } from './src/db';
import { users, registrations } from './src/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

async function test() {
  const allUsers = await db.select().from(users).where(eq(users.role, 'jamaah')).limit(5);
  console.log("All Jamaah Users (Limit 5):", allUsers.map(u => ({ id: u.id, name: u.name, status: u.status })));
  
  const query = db.select({
      registration: registrations,
      user: users,
  })
  .from(users)
  .leftJoin(registrations, eq(users.id, registrations.userId))
  .where(eq(users.role, 'jamaah'));
  
  const result = await query.limit(5);
  console.log("\nCRM Output (Limit 5):");
  result.forEach(r => {
      console.log(`User: ${r.user.name}, RegStatus: ${r.registration?.status}, UserStatus: ${r.user.status}`);
  });
  process.exit(0);
}
test();
