import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.schedules.findFirst({
        where: and(
          eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          gte(schema.schedules.departureDate, now)
        ),
        orderBy: (s, { asc }) => [asc(s.departureDate)],
        with: { package: true }
      })) as any;

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
      let sCurveData = [
        { day: 'H-30', target: 10, actual: null },
        { day: 'H-25', target: 25, actual: null },
        { day: 'H-20', target: 45, actual: null },
        { day: 'H-15', target: 65, actual: null },
        { day: 'H-10', target: 85, actual: null },
        { day: 'H-5', target: 95, actual: null },
        { day: 'Keberangkatan', target: 100, actual: null },
      ];
      let analysis = "Semua sistem terpantau normal.";

      if (nextBatch) {
        // Calculate total pax for this package
        const regs = await withRetry(() => db.select({
          id: schema.registrations.id,
          adultCount: schema.registrations.adultCount,
          childCount: schema.registrations.childCount,
          infantCount: schema.registrations.infantCount,
          status: schema.registrations.status,
          totalAmount: schema.registrations.totalAmount
        })
        .from(schema.registrations)
        .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
        .where(and(
          eq(schema.registrations.packageId, nextBatch.id),
          eq(schema.users.role, 'jamaah'),
          ne(schema.registrations.status, 'PILIH_PAKET')
        )));
        
        nextBatchRegs = regs.reduce((acc, r) => acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);`;

const replacementStr = `      // 4. Batch Terdekat
      let isSchedule = true;
      let nextBatch = await withRetry(() => db.query.schedules.findFirst({
        where: and(
          eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          gte(schema.schedules.departureDate, now)
        ),
        orderBy: (s, { asc }) => [asc(s.departureDate)],
        with: { package: true }
      })) as any;

      // Fallback
      if (!nextBatch) {
        isSchedule = false;
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
      let sCurveData = [
        { day: 'H-30', target: 10, actual: null },
        { day: 'H-25', target: 25, actual: null },
        { day: 'H-20', target: 45, actual: null },
        { day: 'H-15', target: 65, actual: null },
        { day: 'H-10', target: 85, actual: null },
        { day: 'H-5', target: 95, actual: null },
        { day: 'Keberangkatan', target: 100, actual: null },
      ];
      let analysis = "Semua sistem terpantau normal.";

      if (nextBatch) {
        // Calculate total pax for this package
        const regs = await withRetry(() => db.select({
          id: schema.registrations.id,
          adultCount: schema.registrations.adultCount,
          childCount: schema.registrations.childCount,
          infantCount: schema.registrations.infantCount,
          status: schema.registrations.status,
          totalAmount: schema.registrations.totalAmount
        })
        .from(schema.registrations)
        .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
        .where(and(
          isSchedule ? eq(schema.registrations.scheduleId, nextBatch.id) : eq(schema.registrations.packageId, nextBatch.id),
          eq(schema.users.role, 'jamaah'),
          ne(schema.registrations.status, 'PILIH_PAKET')
        )));
        
        nextBatchRegs = regs.reduce((acc, r) => acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success Batch Terdekat 4');
} else {
  console.log('Target string Batch Terdekat 4 not found');
}
