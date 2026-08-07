import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        filters.push(
          or(
            inArray(schema.registrations.status, statusArray as any),
            and(
              isNull(schema.registrations.id),
              inArray(schema.users.status, statusArray as any)
            )
          ) as any
        );
      }`;

const replacementStr = `      if (status) {
        const statusArray = Array.isArray(status) ? (status as string[]) : [status as string];
        const draftOrPilihPaket = statusArray.includes('DRAFT') || statusArray.includes('PILIH_PAKET');
        filters.push(
          or(
            inArray(schema.registrations.status, statusArray as any),
            draftOrPilihPaket ? isNull(schema.registrations.id) : undefined
          ) as any
        );
      }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
