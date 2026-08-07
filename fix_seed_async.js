import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('httpServer.listen(Number(PORT), "0.0.0.0", () => {', 'httpServer.listen(Number(PORT), "0.0.0.0", async () => {');

fs.writeFileSync('server.ts', code);
console.log("Success fix async");
