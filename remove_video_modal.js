import fs from 'fs';
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

const regex = /\s*\{\/\* Fullscreen Video Modal \*\/\}\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
console.log("Success removed video modal");
