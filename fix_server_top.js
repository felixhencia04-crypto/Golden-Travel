import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

if (code.startsWith('description: desc')) {
  const importIndex = code.indexOf('import express');
  code = code.substring(importIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed top");
}
