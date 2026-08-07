const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/inArray\(schema\.registrations\.id, regIds as string\[\]\)/g, 'inArray(schema.registrations.id, regIds as any[])');
code = code.replace(/inArray\(schema\.users\.id, userIds as any\)/g, 'inArray(schema.users.id, userIds as any[])');
code = code.replace(/inArray\(schema\.packages\.id, pkgIds as any\)/g, 'inArray(schema.packages.id, pkgIds as any[])');
fs.writeFileSync('server.ts', code);
