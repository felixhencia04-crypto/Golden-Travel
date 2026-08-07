import { db } from './src/db/index.ts';

async function test() {
  const regs = await db.query.registrations.findMany({
    with: { documents: true },
    limit: 1
  });
  if (regs.length > 0 && regs[0].documents) {
    console.log("Documents:", JSON.stringify(regs[0].documents, null, 2));
  } else {
    console.log("No docs");
  }
}
test().then(() => process.exit(0)).catch(console.error);
