import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `description: desc || ["Fasilitas Bintang 5"],`;
if (code.includes(targetStr)) {
  code = code.replace(targetStr, `description: desc || ["Fasilitas Bintang 5"],
          excludes: exc || [],`);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed return");
} else {
  console.log("target string not found");
}
