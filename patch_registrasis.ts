import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const filters = [eq(schema.registrations.workspaceId, req.user!.workspaceId!)];
      
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        filters.push(inArray(schema.registrations.status, statusArray as any));
      }
      
      if (packageId) {
        filters.push(eq(schema.registrations.packageId, packageId as string));
      }
      
      if (scheduleId) {
        filters.push(eq(schema.registrations.scheduleId, scheduleId as string));
      }

      if (search) {
        const searchStr = \`%\${search}%\`;
        filters.push(or(
          sql\`\${schema.users.name} ILIKE \${searchStr}\`,
          sql\`\${schema.users.phone} ILIKE \${searchStr}\`
        ) as any);
      }

      const baseQuery = db.select({
        registration: schema.registrations,
        user: schema.users,
        package: schema.packages,
        schedule: schema.schedules,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .leftJoin(schema.schedules, eq(schema.registrations.scheduleId, schema.schedules.id))
      .where(and(...filters));

      // Clone query for count
      const totalRes = await db.select({ count: sql<number>\`count(*)\` }).from(baseQuery.as('subquery'));
      const total = Number(totalRes[0].count);

      const data = await baseQuery
        .limit(limitNum)
        .offset(offset)
        .orderBy(desc(schema.registrations.createdAt));

      const registrationsWithMeta = await Promise.all(data.map(async (row) => {
        const payments = await db.query.payments.findMany({
          where: and(
            eq(schema.payments.registrationId, row.registration.id),
            eq(schema.payments.status, 'VERIFIED')
          )
        });
        
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAmount = Number(row.registration.totalAmount || row.package.price);
        const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

        const docs = await db.query.documents.findMany({
          where: eq(schema.documents.registrationId, row.registration.id)
        });
        const requiredDocs = ['KTP', 'Paspor'];
        const verifiedDocsCount = docs.filter(d => requiredDocs.includes(d.docType) && d.status === 'VERIFIED').length;
        const hasRequiredDocs = verifiedDocsCount >= requiredDocs.length;

        return {
          ...row.registration,
          user: row.user,
          package: row.package,
          schedule: row.schedule,
          paymentProgress,
          hasRequiredDocs
        };
      }));`;

const replacementStr = `      const filters = [
        eq(schema.users.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah')
      ];
      
      if (status) {
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
      }
      
      if (packageId) {
        filters.push(eq(schema.registrations.packageId, packageId as string));
      }
      
      if (scheduleId) {
        filters.push(eq(schema.registrations.scheduleId, scheduleId as string));
      }

      if (search) {
        const searchStr = \`%\${search}%\`;
        filters.push(or(
          sql\`\${schema.users.name} ILIKE \${searchStr}\`,
          sql\`\${schema.users.phone} ILIKE \${searchStr}\`
        ) as any);
      }

      const baseQuery = db.select({
        registration: schema.registrations,
        user: schema.users,
        package: schema.packages,
        schedule: schema.schedules,
      })
      .from(schema.users)
      .leftJoin(schema.registrations, eq(schema.users.id, schema.registrations.userId))
      .leftJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .leftJoin(schema.schedules, eq(schema.registrations.scheduleId, schema.schedules.id))
      .where(and(...filters));
      
      // Clone query for count
      const totalRes = await db.select({ count: sql<number>\`count(*)\` }).from(baseQuery.as('subquery'));
      const total = Number(totalRes[0].count);

      const data = await baseQuery
        .limit(limitNum)
        .offset(offset)
        .orderBy(desc(schema.users.createdAt));

      const registrationsWithMeta = await Promise.all(data.map(async (row) => {
        let paymentProgress = 0;
        let hasRequiredDocs = false;
        
        if (row.registration) {
          const payments = await db.query.payments.findMany({
            where: and(
              eq(schema.payments.registrationId, row.registration.id),
              eq(schema.payments.status, 'VERIFIED')
            )
          });
          
          const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const totalAmount = Number(row.registration.totalAmount || row.package?.price || 0);
          paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

          const docs = await db.query.documents.findMany({
            where: eq(schema.documents.registrationId, row.registration.id)
          });
          const requiredDocs = ['KTP', 'Paspor'];
          const verifiedDocsCount = docs.filter(d => requiredDocs.includes(d.docType) && d.status === 'VERIFIED').length;
          hasRequiredDocs = verifiedDocsCount >= requiredDocs.length;
        }

        return {
          ...(row.registration || {
            id: \`no-reg-\${row.user.id}\`,
            status: row.user.status || 'DRAFT',
            userId: row.user.id,
            totalAmount: '0',
            adultCount: '1',
            childCount: '0',
            infantCount: '0',
            createdAt: row.user.createdAt,
            updatedAt: row.user.updatedAt,
            paxData: [],
            workspaceId: row.user.workspaceId
          }),
          user: row.user,
          package: row.package || null,
          schedule: row.schedule || null,
          paymentProgress,
          hasRequiredDocs
        };
      }));`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
