import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.packages.findFirst({
        where: and(
          eq(schema.packages.workspaceId, req.user!.workspaceId!),
          gte(schema.packages.departureDate, now)
        ),
        orderBy: (p, { asc }) => [asc(p.departureDate)]
      }));`;

const replacementStr = `      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.schedules.findFirst({
        where: and(
          eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          gte(schema.schedules.departureDate, now)
        ),
        orderBy: (s, { asc }) => [asc(s.departureDate)],
        with: { package: true }
      })) as any;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success Batch Terdekat 3');
} else {
  console.log('Target string Batch Terdekat 3 not found');
}
