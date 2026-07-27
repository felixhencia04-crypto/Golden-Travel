const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/admin\/broadcast", authenticate, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/;
const replace = `app.post("/api/admin/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, content, type } = req.body;
    try {
      await db.insert(schema.notifications).values({
        title,
        message: content,
        type: type || 'info',
      });
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/broadcast/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      await db.delete(schema.notifications).where(eq(schema.notifications.id, req.params.id));
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`;

code = code.replace(regex, replace);
fs.writeFileSync('server.ts', code);
console.log("Broadcast Delete added");
