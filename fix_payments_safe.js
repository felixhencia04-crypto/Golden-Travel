import fs from 'fs';
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  /      if \(status === 'approved'\) \{/g,
  `      if (!updatedPayment) return res.status(404).json({ error: "Payment not found" });\n      if (status === 'approved') {`
);

fs.writeFileSync('server.ts', serverContent);
console.log("Safe check added!");
