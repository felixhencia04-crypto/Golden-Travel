import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { sql, inArray } from 'drizzle-orm';
async function test() {
  const regs = await db.query.registrations.findMany({ limit: 1 });
  const regIds = regs.map(r => r.id);
  const docs = await db.select({
    id: schema.documents.id,
    registrationId: schema.documents.registrationId,
    docType: schema.documents.docType,
    status: schema.documents.status,
    isPdf: sql<boolean>`${schema.documents.fileUrl} LIKE 'data:application/pdf%'`.as('is_pdf')
  }).from(schema.documents).where(inArray(schema.documents.registrationId, regIds));
  console.log(docs);
}
test().then(() => process.exit(0)).catch(console.error);
