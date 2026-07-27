import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  "const decodedToken = await adminAuth.verifyIdToken(idToken);",
  "console.log('Verifying token in /sync:', idToken.substring(0, 50));\n      const decodedToken = await adminAuth.verifyIdToken(idToken);"
);
fs.writeFileSync('server.ts', content);
