const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');
code = code.replace(
`  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user && !endpoint.includes('/admin/login')) {
    const token = await user.getIdToken();
    headers['Authorization'] = \`Bearer \${token}\`;
    return headers;
  }
`,
`  const adminToken = localStorage.getItem('admin_token');
  if (endpoint.startsWith('/admin') && adminToken) {
    headers['Authorization'] = \`Bearer \${adminToken}\`;
    return headers;
  }

  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user && !endpoint.includes('/admin/login')) {
    const token = await user.getIdToken();
    headers['Authorization'] = \`Bearer \${token}\`;
    return headers;
  }
`
);
fs.writeFileSync('src/lib/api.ts', code);
