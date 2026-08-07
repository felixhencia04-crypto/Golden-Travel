import fs from 'fs';
let code = fs.readFileSync('src/pages/Kemitraan.tsx', 'utf8');

// The class we want to replace
const targetClass = 'bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden';
const newClass = 'bg-[#d6daba] text-stone-900 bg-cover bg-center lg:bg-right-top bg-fixed border-b-4 border-[#D4AF37] overflow-hidden';

code = code.replace(new RegExp(targetClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newClass);

// We need to inject style={{ backgroundImage: 'url("/slide-kemitraan.png")' }} into the sections
code = code.replace(/className="relative (.*?) bg-\[#d6daba\] text-stone-900 bg-cover bg-center lg:bg-right-top bg-fixed border-b-4 border-\[#D4AF37\] overflow-hidden"\s*>/g, 
  'className="relative $1 bg-[#d6daba] text-stone-900 bg-cover bg-center lg:bg-right-top bg-fixed border-b-4 border-[#D4AF37] overflow-hidden"\n        style={{ backgroundImage: \'url("/slide-kemitraan.png")\' }}\n      >');

fs.writeFileSync('src/pages/Kemitraan.tsx', code);
console.log("Success fix kemitraan bg 2");
