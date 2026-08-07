import fs from 'fs';
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

const regex = /\s*\{\/\* Featured Video Showcase Banner \*\/\}\s*<div className="relative rounded-3xl overflow-hidden[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Lightbox Photo \/ Detail Modal \*\/\}/g;

if (regex.test(code)) {
    code = code.replace(regex, '\n      </div>\n\n      {/* Lightbox Photo / Detail Modal */}');
    fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
    console.log("Success removed banner");
} else {
    console.log("Regex not found banner");
}
