const fs = require('fs');

let code = fs.readFileSync('src/pages/Kemitraan.tsx', 'utf8');

// Update imports
code = code.replace(
  /import bgKemitraanHero from '\.\.\/assets\/kemitraan-hero-bg\.webp';/g,
  "import { KEMITRAAN_BG_DATA } from '../assets/kemitraanBgData';"
);

// We need to restore bg-cover bg-center bg-fixed
code = code.replace(
  /className="relative([^"]*)bg-\[\#d6daba\] text-stone-900 border-b-4 border-\[\#D4AF37\] overflow-hidden"/g,
  'className="relative$1bg-[#d6daba] text-stone-900 bg-cover bg-center lg:bg-right-top bg-fixed border-b-4 border-[#D4AF37] overflow-hidden" style={{ backgroundImage: `url(${KEMITRAAN_BG_DATA})` }}'
);

// Remove the injected <img> container
code = code.replace(
  /\s*<div className="absolute inset-0 w-full h-full pointer-events-none z-0">\s*<img src=\{bgKemitraanHero\}[^>]*>\s*<\/div>/g,
  ''
);

fs.writeFileSync('src/pages/Kemitraan.tsx', code);
