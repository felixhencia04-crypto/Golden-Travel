const fs = require('fs');

const pkgPath = 'package.json';
const pkgStr = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgStr);

pkg.scripts['db:migrate:prod'] = 'tsx src/db/migrate.ts';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Script db:migrate:prod added to package.json');
