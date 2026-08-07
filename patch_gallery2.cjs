const fs = require('fs');
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

code = code.replace("export const items: GalleryItem[]", "export const GALLERY_ITEMS: GalleryItem[]");
code = code.replace("useState<GalleryItem[]>(items)", "useState<GalleryItem[]>(GALLERY_ITEMS)");

fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
