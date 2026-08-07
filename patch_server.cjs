const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
      let itinCounts: any[] = [];
      let allItineraries: any[] = [];
      try {
        allItineraries = await withRetry(() => db.select().from(schema.package_itineraries));
        itinCounts = await withRetry(() => db.select({
          packageId: schema.package_itineraries.packageId,
          count: sql<number>\`count(*)\`.as('count')
        }).from(schema.package_itineraries).groupBy(schema.package_itineraries.packageId));
      } catch (err) {}

      const packagesWithCounts = (allPackages || []).map((pkg) => {
        const pkgRegs = (regCounts || []).filter(r => r && r.packageId === pkg.id);
        const itinCountObj = (itinCounts || []).find(i => i.packageId === pkg.id);
        const pkgItineraries = allItineraries.filter(i => i.packageId === pkg.id).sort((a, b) => a.day - b.day);
`;

code = code.replace(
  /      let itinCounts: any\[\] = \[\];\n      try {\n        itinCounts = await withRetry\(\(\) => db\.select\({\n          packageId: schema\.package_itineraries\.packageId,\n          count: sql<number>`count\(\*\)`\.as\('count'\)\n        }\)\.from\(schema\.package_itineraries\)\.groupBy\(schema\.package_itineraries\.packageId\)\);\n      } catch \(err\) {}\n\n      const packagesWithCounts = \(allPackages \|\| \[\]\)\.map\(\(pkg\) => {\n        const pkgRegs = \(regCounts \|\| \[\]\)\.filter\(r => r && r\.packageId === pkg\.id\);\n        const itinCountObj = \(itinCounts \|\| \[\]\)\.find\(i => i\.packageId === pkg\.id\);/g,
  replacement
);

code = code.replace(
  "itineraryCount: Number(itinCountObj?.count || 0),",
  "itineraryCount: Number(itinCountObj?.count || 0),\n          itinerary: pkgItineraries,"
);

fs.writeFileSync('server.ts', code);
