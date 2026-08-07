import { config } from 'dotenv';
config();
import { db } from './src/db';
import { users, registrations, payments, documents } from './src/db/schema';
import { eq, and, ne, gte, sql } from 'drizzle-orm';

async function test() {
  const allActiveRegs = await db.select({
    adultCount: registrations.adultCount,
    childCount: registrations.childCount,
    infantCount: registrations.infantCount,
  })
  .from(registrations)
  .innerJoin(users, eq(registrations.userId, users.id))
  .where(and(
    eq(users.role, 'jamaah')
  ));
  console.log("Active Regs:", allActiveRegs);
  
  const allUsers = await db.select().from(users).where(eq(users.role, 'jamaah'));
  console.log("All Jamaah Users:", allUsers.length);
  process.exit(0);
}
test();
