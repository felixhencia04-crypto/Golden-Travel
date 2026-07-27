import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// fix middleware
content = content.replace(
  "if (decoded && decoded.uid) {\n        decodedToken = decoded;",
  "if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {\n        decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };"
);

// fix sync
content = content.replace(
  "if (decoded && decoded.uid) {\n          console.log('Using decoded unverified token due to missing kid claim');\n          decodedToken = decoded;",
  "if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {\n          console.log('Using decoded unverified token due to missing kid claim');\n          decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };"
);

fs.writeFileSync('server.ts', content);
