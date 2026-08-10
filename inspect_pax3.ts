import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const reg = await db.query.registrations.findFirst({
     where: eq(schema.registrations.id, 'f7a32cec-b14e-48ed-8c98-a9d9c2d4ab05')
  });
  console.log(JSON.stringify(reg?.paxData, null, 2));
}
run().then(() => process.exit(0));
