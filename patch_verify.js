import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Modify the first one to handle reason
content = content.replace(
  /const { status } = req\.body; \/\/ 'approved' or 'rejected'/,
  `const { status, reason } = req.body;`
);

content = content.replace(
  /\.set\(\{ status \}\)/,
  `.set({ status, rejectionReason: reason })`
);

// Remove the second one
content = content.replace(
  /app\.patch\("\/api\/payments\/:id\/verify", authenticate, async \(req: AuthRequest, res\) => \{\n    if \(req\.user!\.role !== 'admin'\) return res\.status\(403\)\.json\(\{ error: "Forbidden" \}\);\n    const \{ id \} = req\.params;\n    const \{ status, reason \} = req\.body;\n    try \{\n      await db\.update\(schema\.payments\)\n        \.set\(\{ status, rejectionReason: reason \}\)\n        \.where\(eq\(schema\.payments\.id, id\)\);\n      \n      \/\/ If approved, maybe update registration status\?\n      \/\/ For simplicity, we just verify the payment here\n      \n      res\.json\(\{ success: true \}\);\n      notifyUpdate\(\);\n    \} catch \(error\) \{\n      res\.status\(500\)\.json\(\{ error: "Failed to verify payment" \}\);\n    \}\n  \}\);/,
  ''
);

fs.writeFileSync('server.ts', content);
