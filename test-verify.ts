import { db } from './src/db/index.ts';
import jwt from 'jsonwebtoken';

async function test() {
  const docs = await db.query.documents.findMany({ limit: 1 });
  if (docs.length === 0) return console.log("No docs");
  const doc = docs[0];
  console.log("Found doc:", doc.id);
  
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.role, 'admin') });
  const token = jwt.sign({ id: user!.id, role: 'admin' }, process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026');
  
  const res = await fetch(`http://localhost:3000/api/admin/documents/${doc.id}/verify`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'VERIFIED' })
  });
  
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
test().then(() => process.exit(0)).catch(console.error);
