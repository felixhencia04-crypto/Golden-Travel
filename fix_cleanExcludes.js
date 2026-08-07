import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const doubleRegex = /let cleanExcludes = excludes;[\s\S]*?cleanExcludes = JSON\.stringify\(\[\]\);\s*\}\s*let cleanExcludes = excludes;/g;

code = code.replace(doubleRegex, 'let cleanExcludes = excludes;');
fs.writeFileSync('server.ts', code);
console.log("Success");
