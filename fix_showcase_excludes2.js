import fs from 'fs';

function fixShowcase(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const badRegex = /excludes: Array\.isArray\(p\.excludes\) \? p\.excludes : \(typeof p\.excludes === 'string' \? JSON\.parse\(p\.excludes \|\| '\[\]'\) : \['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi'\]\),/g;
  
  const goodRegex = `excludes: (() => {
                  try {
                    return Array.isArray(p.excludes) ? p.excludes : (typeof p.excludes === 'string' ? JSON.parse(p.excludes || '[]') : ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi']);
                  } catch(e) {
                    return ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi'];
                  }
                })(),`;
                
  if (badRegex.test(code)) {
    code = code.replace(badRegex, goodRegex);
    fs.writeFileSync(file, code);
    console.log(`Success ${file}`);
  }
}

fixShowcase('src/components/PaketUmrahShowcase.tsx');
fixShowcase('src/components/PaketHajiShowcase.tsx');
