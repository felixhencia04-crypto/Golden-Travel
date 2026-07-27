const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  // --- Operasional Keberangkatan (Admin) ---
  app.get("/api/admin/equipment", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const equipment = await db.select().from(schema.equipment);
      res.json(equipment);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/equipment/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    const { koper, ihram, mukena, assignee } = req.body;
    try {
      let existing = await db.query.equipment.findFirst({ where: eq(schema.equipment.registrationId, registrationId) });
      if (existing) {
        await db.update(schema.equipment).set({ koper, ihram, mukena, assignee, updatedAt: new Date() }).where(eq(schema.equipment.registrationId, registrationId));
      } else {
        await db.insert(schema.equipment).values({ registrationId, koper, ihram, mukena, assignee });
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const notifications = await db.query.notifications.findMany({ orderBy: (n, { desc }) => [desc(n.createdAt)] });
      res.json(notifications);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, content, type } = req.body;
    try {
      await db.insert(schema.notifications).values({
        title,
        message: content,
        type: type || 'info',
        // userId is null for broadcast to all
      });
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/manifest", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const manifests = await db.select().from(schema.manifests);
      res.json(manifests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/manifest/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    const { busNumber, hotelRoom, airplaneSeat, packageId } = req.body;
    try {
      let existing = await db.query.manifests.findFirst({ where: eq(schema.manifests.registrationId, registrationId) });
      if (existing) {
        await db.update(schema.manifests).set({ busNumber, hotelRoom, airplaneSeat }).where(eq(schema.manifests.registrationId, registrationId));
      } else {
        await db.insert(schema.manifests).values({ registrationId, packageId, busNumber, hotelRoom, airplaneSeat });
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Operasional Keberangkatan (Jamaah) ---
  app.get("/api/jamaah/notifications", authenticate, async (req: AuthRequest, res) => {
    try {
      const notifications = await db.select().from(schema.notifications)
        .where(
          sql\`(\${schema.notifications.userId} = \${req.user!.id} OR \${schema.notifications.userId} IS NULL)\`
        )
        .orderBy(desc(schema.notifications.createdAt));
      res.json(notifications);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/jamaah/manifest", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, req.user!.id)
      });
      if (!registration) return res.json(null);
      const manifest = await db.query.manifests.findFirst({
        where: eq(schema.manifests.registrationId, registration.id)
      });
      res.json(manifest);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/jamaah/equipment", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, req.user!.id)
      });
      if (!registration) return res.json(null);
      const equipment = await db.query.equipment.findFirst({
        where: eq(schema.equipment.registrationId, registration.id)
      });
      res.json(equipment);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(/\/\/ --- Document Management Endpoints ---/, endpoints + '\n  // --- Document Management Endpoints ---');
fs.writeFileSync('server.ts', code);
console.log("Endpoints added!");
