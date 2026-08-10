import { db } from './src/db';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== SEARCH FOR APRIL ===");
  const regs = await db.query.registrations.findMany();
  for (const reg of regs) {
    console.log(`Reg ID: ${reg.id}, Orderer: ${reg.ordererName}`);
    if (reg.paxData) {
      console.log('Pax Data:', JSON.stringify(reg.paxData, null, 2));
    }
  }

  // Also query users
  const users = await db.query.users.findMany();
  for (const u of users) {
    if (u.name?.toLowerCase().includes('april') || u.email?.toLowerCase().includes('april')) {
      console.log(`Found User: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    }
  }
}

run().then(() => process.exit(0));
