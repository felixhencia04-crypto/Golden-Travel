import fs from 'fs';
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /const \[updatedPayment\] = await db\.update\(schema\.payments\)/,
  'const [updatedPayment] = await withRetry(() => db.update(schema.payments)'
);
serverContent = serverContent.replace(
  /\.where\(eq\(schema\.payments\.id, id\)\)\n\s*\.returning\(\);/,
  '.where(eq(schema.payments.id, id))\n        .returning());'
);

serverContent = serverContent.replace(
  /await db\.update\(schema\.registrations\)\n\s*\.set\(\{ status: nextStatus, updatedAt: new Date\(\) \}\)\n\s*\.where\(eq\(schema\.registrations\.id, updatedPayment\.registrationId\)\);/,
  'await withRetry(() => db.update(schema.registrations)\n            .set({ status: nextStatus, updatedAt: new Date() })\n            .where(eq(schema.registrations.id, updatedPayment.registrationId)));'
);

fs.writeFileSync('server.ts', serverContent);
console.log("Updated server.ts with retries for verification");
