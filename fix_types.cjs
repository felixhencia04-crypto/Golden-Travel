const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix `const payments = await withRetry(() => query);` -> `const payments = await withRetry(async () => await query);`
code = code.replace(/const payments = await withRetry\(\(\) => query\);/g, 'const payments: any[] = await withRetry(async () => await query);');
code = code.replace(/const docs = await withRetry\(\(\) => query\);/g, 'const docs: any[] = await withRetry(async () => await query);');
code = code.replace(/const certs = await withRetry\(\(\) => query\);/g, 'const certs: any[] = await withRetry(async () => await query);');

// Fix `inArray(schema.registrations.id, regIds)` to `inArray(schema.registrations.id, regIds as string[])`
code = code.replace(/inArray\(schema.registrations.id, regIds\)/g, 'inArray(schema.registrations.id, regIds as string[])');
code = code.replace(/inArray\(schema.documents.registrationId, regIds\)/g, 'inArray(schema.documents.registrationId, regIds as string[])');
code = code.replace(/inArray\(schema.payments.registrationId, regIds\)/g, 'inArray(schema.payments.registrationId, regIds as string[])');

fs.writeFileSync('server.ts', code);
console.log("Types fixed!");
