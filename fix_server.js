import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/facilities: schema.packages.facilities, excludes,/g, 'facilities: schema.packages.facilities,\n              excludes: schema.packages.excludes,');
code = code.replace(/facilities, excludes, hotel, excludes } = req.body;/g, 'facilities, hotel, excludes } = req.body;');
code = code.replace(/hotel, excludes: schema.packages.excludes,/g, 'hotel,\n              excludes: schema.packages.excludes,');

fs.writeFileSync('server.ts', code);
