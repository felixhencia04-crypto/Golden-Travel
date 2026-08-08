const fs = require('fs');

let code = fs.readFileSync('src/db/migrate.ts', 'utf8');

code = code.replace("password: hashPassword('admin')", "password: hashPassword('admin123')");

fs.writeFileSync('src/db/migrate.ts', code);
