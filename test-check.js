import { execSync } from 'child_process';
const out = execSync(`curl -s http://localhost:3000/api/health`).toString();
console.log(out);
