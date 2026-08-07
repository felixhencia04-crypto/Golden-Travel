const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Ensure gallery_photos table exists.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n.*?console\.error\("Failed to ensure gallery_photos table exists:", e\);\n    }/s;

code = code.replace(regex, `// DDL dihapus: Migrasi akan dilakukan via npm run db:push`);
fs.writeFileSync('server.ts', code);
