import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const allRegs = await db.query.registrations.findMany();
  let updated = 0;
  for (const reg of allRegs) {
    if (Array.isArray(reg.paxData) && reg.paxData.length > 0) {
      const existingPaxRaw = reg.paxData;
      const existingPax: any[] = [];
      let hadDuplicates = false;
      existingPaxRaw.forEach((raw: any) => {
         const rawName = (raw.userName || raw.namaLengkap || raw.nama || raw.fullName || raw.name || raw.pasporNama || '').trim();
         const duplicateIdx = existingPax.findIndex(ex => {
           const exName = (ex.userName || ex.namaLengkap || ex.nama || ex.fullName || ex.name || ex.pasporNama || '').trim();
           return exName && rawName && exName.toLowerCase() === rawName.toLowerCase();
         });
         
         if (duplicateIdx >= 0) {
            hadDuplicates = true;
            const ex = existingPax[duplicateIdx];
            existingPax[duplicateIdx] = { ...ex, ...raw, documents: { ...(ex.documents || {}), ...(raw.documents || {}) } };
         } else {
            existingPax.push(raw);
         }
      });
      if (hadDuplicates) {
        await db.update(schema.registrations).set({ paxData: existingPax, adultCount: existingPax.length.toString() }).where(eq(schema.registrations.id, reg.id));
        updated++;
      }
    }
  }
  console.log(`Deduplicated paxData for ${updated} registrations.`);
}
run().then(() => process.exit(0));
