import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const normalizedType = String(type || 'umroh').trim().toLowerCase() === 'haji' ? 'haji' : 'umroh';
      const normalizedIsAvailable = isAvailable !== false && isAvailable !== 'false' && isAvailable !== 0 && isAvailable !== '0';

      const data: any = {`;

const insertStr = `      let cleanExcludes = excludes;
      if (Array.isArray(cleanExcludes)) {
        const filteredEx = cleanExcludes.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanExcludes = JSON.stringify(filteredEx.length > 0 ? filteredEx : []);
      } else if (typeof cleanExcludes !== 'string' || !cleanExcludes.trim()) {
        cleanExcludes = JSON.stringify([]);
      }

`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, insertStr + targetStr);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed PUT");
} else {
  console.log("Not found PUT target");
}
