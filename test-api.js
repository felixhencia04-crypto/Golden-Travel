import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
const token = jwt.sign({ uid: 'test-123', email: 'test@example.com', name: 'Test User' }, 'secret');
const out = execSync(`curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{}' http://localhost:3000/api/auth/sync`).toString();
console.log(out);
