const fs = require('fs');

let code = fs.readFileSync('src/pages/Kemitraan.tsx', 'utf8');

// The line to replace:
// style={{ backgroundImage: `url(${bgKemitraanHero})` }}

// We want to remove bg-cover bg-center lg:bg-right-top bg-fixed from className
code = code.replace(/bg-cover bg-center lg:bg-right-top bg-fixed /g, '');
code = code.replace(/ bg-cover bg-center lg:bg-right-top bg-fixed/g, '');

// We want to replace the style line and inject the img tag
code = code.replace(
  /style=\{\{ backgroundImage: `url\(\$\{bgKemitraanHero\}\)` \}\}\s*>\s*/g,
  `>\n        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">\n          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" />\n        </div>\n        `
);

fs.writeFileSync('src/pages/Kemitraan.tsx', code);
