import fs from 'fs';
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

const regex = /\s*\{\/\* Video Player Modal \*\/\}\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>/g;
code = code.replace(regex, '');

code = code.replace(/const \[isVideoModalOpen, setIsVideoModalOpen\] = useState<boolean>\(false\);\n/g, '');

fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
console.log("Success removed video modal 2");
