import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        .where(and(
          eq(schema.registrations.packageId, nextBatch.id),
          eq(schema.users.role, 'jamaah'),
          ne(schema.registrations.status, 'PILIH_PAKET')
        )));`;

const replacementStr = `        .where(and(
          nextBatch.packageId ? eq(schema.registrations.scheduleId, nextBatch.id) : eq(schema.registrations.packageId, nextBatch.id),
          eq(schema.users.role, 'jamaah'),
          ne(schema.registrations.status, 'PILIH_PAKET')
        )));`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success Small Patch');
} else {
  console.log('Target string Small Patch not found');
}
