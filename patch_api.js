import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('src/lib/api.ts', 'utf8');

const newGetHeaders = `
async function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    headers['Authorization'] = \`Bearer \${adminToken}\`;
    return headers;
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = \`Bearer \${token}\`;
  }

  return headers;
}
`;

content = content.replace(/async function getHeaders\(\) \{[\s\S]*?return headers;\n\}/, newGetHeaders.trim());

writeFileSync('src/lib/api.ts', content);
