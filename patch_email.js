import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  "email: decodedToken.email!,",
  "email: decodedToken.email || `${decodedToken.uid}@goldentravel.local`,"
);
content = content.replace(
  "name: decodedToken.name || decodedToken.email!.split('@')[0],",
  "name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),"
);
fs.writeFileSync('server.ts', content);
