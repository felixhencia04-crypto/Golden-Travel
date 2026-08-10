import { db } from './src/db';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== SCANNING REGISTRATIONS ===");
  const regs = await db.query.registrations.findMany();
  console.log("Total registrations:", regs.length);
  for (const reg of regs) {
    console.log(`Reg ID: ${reg.id}, Status: ${reg.status}, Orderer: ${reg.ordererName}`);
    if (reg.paxData) {
      console.log("Pax count:", reg.paxData.length);
      console.log(JSON.stringify(reg.paxData, null, 2));
    }
  }

  console.log("=== SCANNING USERS ===");
  const users = await db.query.users.findMany();
  console.log("Total users:", users.length);
  for (const u of users) {
    console.log(`User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  }
}

run().then(() => process.exit(0));
