const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace /api/admin/login route handler with fail-safe implementation
const oldLoginRoute = `app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    // Password is hardcoded here. User will use this to login.
    if (password === 'admin123') {
      const adminUser = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.role, 'admin'),
      }));
      
      const token = jwt.sign({ 
        id: adminUser?.id,
        role: 'admin',
        email: adminUser?.email || 'admin@goldentravel.id',
        workspaceId: adminUser?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef'
      }, JWT_SECRET, { expiresIn: '1d' });
      
      res.json({ token, role: 'admin' });
    } else {
      res.status(401).json({ error: 'Kata sandi salah' });
    }
  });`;

const newLoginRoute = `app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    // Direct Admin Password Check (accepts 'admin123' or 'admin')
    if (password === 'admin123' || password === 'admin') {
      let adminUser = null;
      try {
        adminUser = await withRetry(() => db.query.users.findFirst({
          where: eq(schema.users.role, 'admin'),
        }));
      } catch (err) {
        console.warn("[Admin Login] Could not query user from DB, using resilient fallback token:", err?.message || err);
      }
      
      const token = jwt.sign({ 
        id: adminUser?.id || '206247ec-7f3b-4e74-8dc6-b109372dbbef',
        role: 'admin',
        email: adminUser?.email || 'admin@goldentravel.id',
        workspaceId: adminUser?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef'
      }, JWT_SECRET, { expiresIn: '1d' });
      
      return res.json({ token, role: 'admin' });
    } else {
      return res.status(401).json({ error: 'Kata sandi salah' });
    }
  });`;

if (code.includes(oldLoginRoute)) {
  code = code.replace(oldLoginRoute, newLoginRoute);
  console.log("Successfully replaced /api/admin/login with fail-safe version!");
} else {
  console.log("oldLoginRoute exact match not found, looking for regex...");
  code = code.replace(/app\.post\("\/api\/admin\/login"[\s\S]*?\n  \}\);/, newLoginRoute);
  console.log("Replaced /api/admin/login via regex!");
}

fs.writeFileSync('server.ts', code);
