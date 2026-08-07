import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // 1. Jamaah Aktif
      const allActiveRegs = await withRetry(() => db.select({
        adultCount: schema.registrations.adultCount,
        childCount: schema.registrations.childCount,
        infantCount: schema.registrations.infantCount,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(and(
        eq(schema.registrations.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah'),
        ne(schema.registrations.status, 'PILIH_PAKET')
      )));
      
      const totalJamaah = allActiveRegs.reduce((acc, r) => 
        acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);`;

const replacementStr = `      // 1. Jamaah Aktif
      const allJamaahUsers = await withRetry(() => db.select({
        id: schema.users.id
      })
      .from(schema.users)
      .where(and(
        eq(schema.users.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah'),
        ne(schema.users.status, 'suspended')
      )));
      
      const totalJamaah = allJamaahUsers.length;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success Jamaah Aktif');
} else {
  console.log('Target string Jamaah Aktif not found');
}
