import fs from 'fs';

// 1. Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(
  /app\.patch\("\/api\/payments\/:id\/verify"/,
  'app.patch("/api/admin/payments/:id/verify"'
);

// We need to also ensure reason || null is passed
serverContent = serverContent.replace(
  /\.set\(\{ status, rejectionReason: reason \}\)/,
  '.set({ status, rejectionReason: reason || null })'
);

fs.writeFileSync('server.ts', serverContent);

// 2. Fix Admin.tsx
let adminContent = fs.readFileSync('src/pages/Admin.tsx', 'utf8');
adminContent = adminContent.replace(
  /api\.patch\(`\/payments\/\$\{transactionId\}\/verify`, \{ status: 'approved' \}\)/g,
  "api.patch(`/admin/payments/${transactionId}/verify`, { status: 'approved' })"
);
adminContent = adminContent.replace(
  /api\.patch\(`\/payments\/\$\{transactionId\}\/verify`, \{ status: 'rejected', reason \}\)/g,
  "api.patch(`/admin/payments/${transactionId}/verify`, { status: 'rejected', reason })"
);
fs.writeFileSync('src/pages/Admin.tsx', adminContent);

console.log("Fixed!");
