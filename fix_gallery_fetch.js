import fs from 'fs';
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

const regex = /if \(data\.length > 0\) \{\s*const mapped = data\.map\(\(p: any\) => \(\{\s*id: p\.id,\s*title: p\.title \|\| 'Momen Keberangkatan',\s*category: 'keberangkatan',\s*categoryLabel: 'Galeri',\s*imageUrl: p\.imageUrl,\s*location: 'Bandara \/ Hotel \/ Tanah Suci',\s*hijriDate: '',\s*gregorianDate: p\.createdAt \? new Date\(p\.createdAt\)\.toLocaleDateString\('id-ID', \{month: 'long', year: 'numeric'\}\) : '',\s*batchName: 'Jemaah',\s*jemaahCount: 45,\s*description: p\.description \|\| '',\s*likesCount: Math\.floor\(Math\.random\(\) \* 500\) \+ 100\s*\}\)\);\s*setItems\(mapped\);\s*\}/g;

const newCode = `const mapped = data.map((p: any) => ({
                id: p.id,
                title: p.title || 'Momen Keberangkatan',
                category: 'keberangkatan',
                categoryLabel: 'Galeri',
                imageUrl: p.imageUrl,
                location: 'Bandara / Hotel / Tanah Suci',
                hijriDate: '',
                gregorianDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'}) : '',
                batchName: 'Jemaah',
                jemaahCount: 45,
                description: p.description || '',
                likesCount: Math.floor(Math.random() * 500) + 100
             }));
             setItems(mapped);`;

if (regex.test(code)) {
  code = code.replace(regex, newCode);
  fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
  console.log("Success fix fetch");
} else {
  console.log("Regex not found");
}
