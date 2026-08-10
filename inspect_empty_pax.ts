import { db } from './src/db';

async function run() {
  const allRegs = await db.query.registrations.findMany();
  for (const reg of allRegs) {
    if (Array.isArray(reg.paxData) && reg.paxData.length > 0) {
      const emptyCount = reg.paxData.filter((p: any) => !(p.userName || p.namaLengkap || p.nama || p.fullName || p.name || p.pasporNama || '').trim()).length;
      console.log(`Registration ${reg.id} has ${emptyCount} empty pax out of ${reg.paxData.length}.`);
    }
  }
}
run().then(() => process.exit(0));
