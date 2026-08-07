const fs = require('fs');
let code = fs.readFileSync('src/components/PaketHajiShowcase.tsx', 'utf8');

code = code.replace(
  "price: Number(p.price) || 0,",
  "price: Number(p.price) || 0,\n                priceUsd: Math.round((Number(p.price) || 0) / 16000),\n                priceIdrApprox: (Number(p.price) || 0).toLocaleString('id-ID'),\n                waitingTime: 'Langsung Berangkat',\n                visaType: 'Visa Haji Mujamalah',\n                isPopular: false,\n                isBestSeller: false,"
);

fs.writeFileSync('src/components/PaketHajiShowcase.tsx', code);
