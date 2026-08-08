const fs = require('fs');

let code = fs.readFileSync('src/db/migrate.ts', 'utf8');

const hashFunc = `
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return \`\${salt}:\${hash}\`;
}
`;

code = code.replace("password: 'admin', // Atau sesuai request", "password: hashPassword('admin'), // Password 'admin' yang di-hash");
code = code.replace("const runMigration = async () => {", hashFunc + "\nconst runMigration = async () => {");

fs.writeFileSync('src/db/migrate.ts', code);
