import { db } from './src/db';

async function run() {
  const allRegs = await db.query.registrations.findMany();
  for (const reg of allRegs) {
    if (Array.isArray(reg.paxData) && reg.paxData.length > 1) {
      console.log(`Registration ${reg.id} has ${reg.paxData.length} pax.`);
      console.log(JSON.stringify(reg.paxData, null, 2));
      break;
    }
  }
}
run().then(() => process.exit(0));
