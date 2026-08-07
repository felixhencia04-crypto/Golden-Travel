const fs = require('fs');
let code = fs.readFileSync('src/components/PaketUmrahShowcase.tsx', 'utf8');

code = code.replace(
  "itinerary: []",
  "itinerary: p.itinerary || []"
);

fs.writeFileSync('src/components/PaketUmrahShowcase.tsx', code);
