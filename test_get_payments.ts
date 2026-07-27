import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';

async function main() {
  const p = await db.query.payments.findMany();
  console.log(p.map(x => x.id));
}
main();
