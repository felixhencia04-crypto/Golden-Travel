const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  `} catch (e) {`,
  `} catch (e: any) {
    console.error('jwt.verify failed:', e.message);`
);
fs.writeFileSync('server.ts', code);
