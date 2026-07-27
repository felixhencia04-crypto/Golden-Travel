const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ --- Document Management Endpoints ---/;

const newEndpoint = `
  app.post("/api/admin/final-documents/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    const { docType, fileUrl } = req.body;
    try {
      let existing = await db.query.documents.findFirst({
        where: and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, docType))
      });
      if (existing) {
        await db.update(schema.documents).set({ fileUrl, status: 'approved' }).where(eq(schema.documents.id, existing.id));
      } else {
        await db.insert(schema.documents).values({
          registrationId,
          docType,
          fileUrl,
          status: 'approved'
        });
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Document Management Endpoints ---`;

code = code.replace(regex, newEndpoint);
fs.writeFileSync('server.ts', code);
console.log("Upload endpoint added");
