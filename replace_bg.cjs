const fs = require('fs');
let code = fs.readFileSync('src/pages/Kemitraan.tsx', 'utf8');

// Add import
if (!code.includes('import bgKemitraanHero')) {
    code = code.replace(
        "import { HEADER_BG_DATA } from '../assets/headerBgData';",
        "import { HEADER_BG_DATA } from '../assets/headerBgData';\nimport bgKemitraanHero from '../assets/kemitraan-hero-bg.webp';"
    );
}

// Replace string paths with imported variable
code = code.replace(/<img src="\/images\/bg-mitra\.png"/g, '<img src={bgKemitraanHero}');
code = code.replace(/<img src="\/images\/bg-mitra\.webp"/g, '<img src={bgKemitraanHero}');

fs.writeFileSync('src/pages/Kemitraan.tsx', code);
