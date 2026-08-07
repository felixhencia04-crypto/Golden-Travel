import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.packages.findFirst({
        where: and(
          eq(schema.packages.workspaceId, req.user!.workspaceId!),
          gte(schema.packages.departureDate, now)
        ),
        orderBy: (p, { asc }) => [asc(p.departureDate)]
      }));

      // Fallback
      if (!nextBatch) {
        const pkgCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          count: sql<number>\`count(*)\`
        })
        .from(schema.registrations)
        .where(eq(schema.registrations.workspaceId, req.user!.workspaceId!))
        .groupBy(schema.registrations.packageId)
        .orderBy(sql\`count(*) desc\`)
        .limit(1));
        
        if (pkgCounts.length > 0) {
          nextBatch = await withRetry(() => db.query.packages.findFirst({
            where: and(
              eq(schema.packages.workspaceId, req.user!.workspaceId!),
              eq(schema.packages.id, pkgCounts[0].packageId)
            )
          }));
        }
      }

      let nextBatchRegs = 0;
      let sCurveData = [`;

const replacementStr = `      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.schedules.findFirst({
        where: and(
          eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          gte(schema.schedules.departureDate, now)
        ),
        orderBy: (s, { asc }) => [asc(s.departureDate)],
        with: { package: true }
      }));

      // Fallback
      if (!nextBatch) {
        const pkgCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          count: sql<number>\`count(*)\`
        })
        .from(schema.registrations)
        .where(eq(schema.registrations.workspaceId, req.user!.workspaceId!))
        .groupBy(schema.registrations.packageId)
        .orderBy(sql\`count(*) desc\`)
        .limit(1));
        
        if (pkgCounts.length > 0) {
          const fbPkg = await withRetry(() => db.query.packages.findFirst({
            where: and(
              eq(schema.packages.workspaceId, req.user!.workspaceId!),
              eq(schema.packages.id, pkgCounts[0].packageId)
            )
          }));
          if (fbPkg) {
            nextBatch = {
              id: fbPkg.id,
              workspaceId: fbPkg.workspaceId,
              packageId: fbPkg.id,
              departureDate: fbPkg.departureDate || now,
              name: fbPkg.name,
              airline: null,
              totalSeats: 0,
              availableSeats: 0,
              itineraryPdfUrl: null,
              createdAt: fbPkg.createdAt,
              package: fbPkg
            } as any;
          }
        }
      }

      let nextBatchRegs = 0;
      let sCurveData = [`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success Batch Terdekat 2');
} else {
  console.log('Target string Batch Terdekat 2 not found');
}
