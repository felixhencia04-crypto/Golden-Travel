import { db } from './src/db/index.js';
import { schema } from './src/db/schema.js';

async function main() {
  try {
    const p = await db.query.payments.findMany();
    console.log(p.map(x => ({ id: x.id, urlLength: x.proofUrl?.length, prefix: x.proofUrl?.substring(0, 30) })));
  } catch (e) {
    console.error(e);
  }
}
main();
