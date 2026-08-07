import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/manasikPdfUrl,\n\s+facilities,\n\s+hotel\n/g, 'manasikPdfUrl,\n        facilities,\n        hotel,\n        excludes\n');

fs.writeFileSync('server.ts', code);
