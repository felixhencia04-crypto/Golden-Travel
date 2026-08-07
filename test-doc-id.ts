import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { sql, isNotNull } from 'drizzle-orm';

async function test() {
  const docs = await db.query.documents.findMany({ 
    where: isNotNull(schema.documents.fileUrl),
    limit: 5 
  });
  for (const doc of docs) {
    console.log(doc.id, doc.docType, doc.fileUrl.substring(0, 50));
  }
}
test().then(() => process.exit(0)).catch(console.error);
