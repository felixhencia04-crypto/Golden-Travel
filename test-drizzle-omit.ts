import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
async function test() {
  const pays = await db.query.payments.findMany({ 
    limit: 1,
    columns: {
      proofUrl: false
    }
  });
  console.log(pays);
}
test().then(() => process.exit(0)).catch(console.error);
