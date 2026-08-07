import fs from 'fs';
let code = fs.readFileSync('src/components/PaketHajiShowcase.tsx', 'utf8');

const regex1 = /<div className="flex items-baseline gap-2">\s*<span className="font-serif text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-\[#F3E5AB\] via-\[#D4AF37\] to-\[#B8860B\] bg-clip-text text-transparent">\s*USD \{pkg\.priceUsd\?\.toLocaleString\('en-US'\)\}\s*<\/span>\s*<span className="text-stone-300 text-xs">\/ pax<\/span>\s*<\/div>\s*<div className="text-xs text-stone-300 font-medium">\s*Est\. Rp \{pkg\.priceIdrApprox\} <span className="text-\[10px\] text-stone-400">\(Kurs 15\.800\)<\/span>\s*<\/div>/g;

const new1 = `<div className="flex items-baseline gap-2">
                          <span className="font-serif text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
                            Rp {pkg.priceIdrApprox}
                          </span>
                          <span className="text-stone-300 text-xs">/ pax</span>
                        </div>`;

code = code.replace(regex1, new1);

const regex2 = /USD \{selectedPackage\.priceUsd\?\.toLocaleString\('en-US'\)\} <span className="text-xs font-sans text-stone-300 font-normal">\(Est\. Rp \{selectedPackage\.priceIdrApprox\}\)<\/span>/g;

const new2 = `Rp {selectedPackage.priceIdrApprox}`;

code = code.replace(regex2, new2);

// update DEFAULT_HAJI_PACKAGES USD to Rp
code = code.replace(/USD 5\.000/g, 'Rp 50.000.000');
code = code.replace(/USD 4\.000/g, 'Rp 40.000.000');
code = code.replace(/USD 1,875/g, 'Rp 30.000.000');

fs.writeFileSync('src/components/PaketHajiShowcase.tsx', code);
console.log("Success Haji USD fix");
