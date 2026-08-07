import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// The logic for description:
/*
      let cleanDesc = description;
      if (Array.isArray(cleanDesc)) {
        const filtered = cleanDesc.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanDesc = JSON.stringify(filtered.length > 0 ? filtered : [name || "Fasilitas Bintang 5"]);
      } else if (typeof cleanDesc !== 'string' || !cleanDesc.trim()) {
        cleanDesc = JSON.stringify([name || "Fasilitas Bintang 5"]);
      }
*/

const descLogic = /let cleanDesc = description;[^]*?cleanDesc = JSON\.stringify\(\[name \|\| "Fasilitas Bintang 5"\]\);\s*\}/g;

let matches = code.match(descLogic);
if (matches) {
  matches.forEach(match => {
    const excludesLogic = `
      let cleanExcludes = excludes;
      if (Array.isArray(cleanExcludes)) {
        const filteredEx = cleanExcludes.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanExcludes = JSON.stringify(filteredEx.length > 0 ? filteredEx : []);
      } else if (typeof cleanExcludes !== 'string' || !cleanExcludes.trim()) {
        cleanExcludes = JSON.stringify([]);
      }
`;
    code = code.replace(match, match + excludesLogic);
  });
}

code = code.replace(/excludes: excludes \|\| null/g, 'excludes: cleanExcludes');

fs.writeFileSync('server.ts', code);
console.log("Success");
