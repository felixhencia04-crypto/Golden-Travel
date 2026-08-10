import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allRegs = await db.query.registrations.findMany();
  for (const reg of allRegs) {
    const paxCount = Array.isArray(reg.paxData) ? reg.paxData.length : 0;
    console.log(`Reg ID: ${reg.id}, User ID: ${reg.userId}, PaxCount: ${paxCount}`);
    if (paxCount >= 4) {
      console.log('FOUR OR MORE PAX:', JSON.stringify(reg.paxData, null, 2));
    }
  }
}
run().then(() => process.exit(0));
