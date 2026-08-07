import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  app.delete("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.users).where(eq(schema.users.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server"   });
    }
  });`;

const replacementStr = `  app.delete("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const userId = req.params.id;
      const regs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.userId, userId)
      }));
      
      await withRetry(() => db.transaction(async (tx) => {
        for (const r of regs) {
          const pays = await tx.select().from(schema.payments).where(eq(schema.payments.registrationId, r.id));
          for (const p of pays) {
            await tx.delete(schema.financial_ledger).where(eq(schema.financial_ledger.paymentId, p.id));
          }
          await tx.delete(schema.payments).where(eq(schema.payments.registrationId, r.id));
          await tx.delete(schema.documents).where(eq(schema.documents.registrationId, r.id));
          await tx.delete(schema.certificates).where(eq(schema.certificates.registrationId, r.id));
          await tx.delete(schema.equipment).where(eq(schema.equipment.registrationId, r.id));
          await tx.delete(schema.manifests).where(eq(schema.manifests.registrationId, r.id));
          await tx.delete(schema.memories).where(eq(schema.memories.registrationId, r.id));
          await tx.delete(schema.activities).where(eq(schema.activities.registrationId, r.id));
          await tx.delete(schema.registrations).where(eq(schema.registrations.id, r.id));
        }
        await tx.delete(schema.notifications).where(eq(schema.notifications.userId, userId));
        await tx.delete(schema.helpdesk_tickets).where(eq(schema.helpdesk_tickets.userId, userId));
        await tx.delete(schema.users).where(eq(schema.users.id, userId));
      }));
      
      res.json({ success: true, message: "User deleted successfully" });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('server.ts', content);
  console.log('Success');
} else {
  console.log('Target string not found');
}
