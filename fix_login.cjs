const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const oldLogin = `  // Custom Admin Login (Password Only)
  app.post("/api/admin/login", async (req, res) => {
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

const newLogin = `  // Custom Admin Login (Password Only)
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    // Password is hardcoded here. User will use this to login.
    if (password === 'admin123') {
      try {
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
      } catch (err: any) {
        console.error("Admin login error:", err);
        res.status(500).json({ error: "Gagal login: Pastikan database sudah ter-sync (migration). Error: " + err.message });
      }
    } else {
      res.status(401).json({ error: 'Kata sandi salah' });
    }
  });`;

code = code.replace(oldLogin, newLogin);
fs.writeFileSync('server.ts', code);
