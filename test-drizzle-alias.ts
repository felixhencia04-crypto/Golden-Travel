import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { sql, inArray } from 'drizzle-orm';
async function test() {
  const regIds = ['52f8c61e-ce29-4804-96ae-a5a993bde987'];
  const docs = await db.select({
      id: schema.documents.id,
      isPdf: sql<boolean>`${schema.documents.fileUrl} LIKE 'data:application/pdf%'`.as('is_pdf')
  }).from(schema.documents).where(inArray(schema.documents.registrationId, regIds));
  console.log(docs);
}
test().then(() => process.exit(0)).catch(console.error);
