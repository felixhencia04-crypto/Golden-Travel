import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allRegs = await db.query.registrations.findMany();
  for (const reg of allRegs) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, reg.userId) });
    console.log(`Reg ID: ${reg.id}, User Role: ${user?.role}, User Name: ${user?.name}`);
  }
}
run().then(() => process.exit(0));
