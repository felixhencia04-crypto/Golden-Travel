import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
async function test() {
  const q = db.query.users.findMany({
    where: eq(schema.users.role, undefined as any)
  }).toSQL();
  console.log(q);
}
test().then(() => process.exit(0)).catch(console.error);
