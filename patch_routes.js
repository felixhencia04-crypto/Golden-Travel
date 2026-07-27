import fs from 'fs';

const filePath = 'src/components/AnimatedRoutes.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Insert import if not present
if (!content.includes('import KatalogPaket')) {
  content = content.replace(
    "import Blog from '../pages/Blog';",
    "import Blog from '../pages/Blog';\nimport KatalogPaket from '../pages/KatalogPaket';"
  );
}

// Insert route if not present
if (!content.includes('path="/katalog"')) {
  content = content.replace(
    '<Route path="/blog" element={<AnimatedPage><Blog /></AnimatedPage>} />',
    '<Route path="/blog" element={<AnimatedPage><Blog /></AnimatedPage>} />\n        <Route path="/katalog" element={<AnimatedPage><KatalogPaket /></AnimatedPage>} />'
  );
}

fs.writeFileSync(filePath, content);
