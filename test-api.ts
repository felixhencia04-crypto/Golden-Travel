import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
async function test() {
  const docs = await db.query.documents.findMany({ limit: 1 });
  console.log(docs);
}
test().then(() => process.exit(0)).catch(console.error);
