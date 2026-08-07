import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const regexToReplace = /let desc: any = pkg\.description;\n\s*if \(typeof desc === 'string'\) \{\n\s*try \{\n\s*desc = JSON\.parse\(desc\);\n\s*\} catch \(e\) \{\n\s*desc = desc \? desc\.split\('\\n'\) : \["Fasilitas Bintang 5"\];\n\s*\}\n\s*\}/;

const newCode = `let desc: any = pkg.description;
        if (typeof desc === 'string') {
          try {
            desc = JSON.parse(desc);
          } catch (e) {
            desc = desc ? desc.split('\\n') : ["Fasilitas Bintang 5"];
          }
        }
        
        let exc: any = pkg.excludes;
        if (typeof exc === 'string') {
          try {
            exc = JSON.parse(exc);
          } catch (e) {
            exc = exc ? exc.split('\\n') : [];
          }
        }
`;

if (regexToReplace.test(code)) {
  code = code.replace(regexToReplace, newCode);
  code = code.replace(/description: desc || \["Fasilitas Bintang 5"\],/, 'description: desc || ["Fasilitas Bintang 5"],\n          excludes: exc || [],');
  fs.writeFileSync('server.ts', code);
  console.log("Success");
} else {
  console.log("Regex not found");
}
