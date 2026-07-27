import fs from 'fs';
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

content = content.replace(
  /transaction\.date \? new Date\(transaction\.date\)/g,
  'transaction.createdAt ? new Date(transaction.createdAt)'
);

content = content.replace(
  /b\.date\)\.getTime\(\) - new Date\(a\.date\)/g,
  'b.createdAt).getTime() - new Date(a.createdAt)'
);

fs.writeFileSync('src/pages/Admin.tsx', content);
