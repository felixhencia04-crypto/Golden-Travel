const fs = require('fs');

let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['start'] = 'node dist/server.cjs';
pkg.scripts['start:prod'] = 'npx drizzle-kit push --config=src/db/drizzle.config.ts --force && node dist/server.cjs';
pkg.scripts['railway:migrate'] = 'npx drizzle-kit push --config=src/db/drizzle.config.ts --force';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
