import fs from 'fs';

function fixShowcase(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const regex = /excludes: \['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi'\],/g;
  
  if (regex.test(code)) {
    code = code.replace(regex, "excludes: Array.isArray(p.excludes) ? p.excludes : (typeof p.excludes === 'string' ? JSON.parse(p.excludes || '[]') : ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi']),");
    fs.writeFileSync(file, code);
    console.log(`Success ${file}`);
  } else {
    // If not found, it might be already modified or different
    code = code.replace(/excludes: \[\],/g, "excludes: Array.isArray(p.excludes) ? p.excludes : (typeof p.excludes === 'string' ? JSON.parse(p.excludes || '[]') : ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi']),");
    fs.writeFileSync(file, code);
    console.log(`Tried alternate replace ${file}`);
  }
}

fixShowcase('src/components/PaketUmrahShowcase.tsx');
fixShowcase('src/components/PaketHajiShowcase.tsx');
