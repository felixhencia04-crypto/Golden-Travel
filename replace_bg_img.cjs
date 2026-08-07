const fs = require('fs');
let code = fs.readFileSync('src/pages/Kemitraan.tsx', 'utf8');

// 1. Remove import
code = code.replace(/import bgKemitraanHero from "\.\.\/assets\/bg-mitra\.png";\n/g, '');
code = code.replace(/import bgKemitraanHero from '\.\.\/assets\/bg-mitra\.png';\n/g, '');

// 2. Replace img src
code = code.replace(
  /<img src=\{bgKemitraanHero\} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" \/>/g,
  '<img src="/images/bg-mitra.png" alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchpriority="high" />'
);

fs.writeFileSync('src/pages/Kemitraan.tsx', code);
