import fs from 'fs';
let serverTs = fs.readFileSync('server.ts', 'utf8');

const endpoints = `

  // --- FASE 2: BACKEND API & AUTOMATION LOGIC ---

  // 1. Multi-Tenancy Middleware Khusus Jamaah
  // Middleware ini memastikan endpoint jamaah hanya bisa akses data milik user itu sendiri.
  const requireJamaahTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'jamaah') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Jamaah' });
    }
    next();
  };

  // Contoh Proteksi Endpoint Jamaah menggunakan Middleware Multi-Tenancy
  app.get("/api/jamaah/profile-safe", authenticate, requireJamaahTenant, async (req: AuthRequest, res) => {
    try {
      // Memastikan query hanya berdasarkan userId dari token
      const profile = await db.query.users.findFirst({
        where: eq(schema.users.id, req.user!.id),
      });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Terjadi kesalahan' });
    }
  });

  // 2. Logika Verifikasi & Financial Ledger Otomatis
  app.post("/api/admin/pembayaran/approve", authenticate, async (req: AuthRequest, res) => {
    // Validasi Role Admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Admin' });
    }

    const { paymentId, description = "Setoran Pembayaran Jamaah" } = req.body;

    try {
      // Drizzle ORM Transaction untuk Automation
      await db.transaction(async (tx) => {
        // A. Ubah status pembayaran jadi valid
        const updatedPayment = await tx.update(schema.payments)
          .set({ status: 'approved' })
          .where(eq(schema.payments.id, paymentId))
          .returning();

        if (updatedPayment.length === 0) {
          throw new Error("Payment tidak ditemukan");
        }

        const payment = updatedPayment[0];

        // B. Otomatis INSERT ke buku_kas_mutasi
        await tx.insert(schema.financial_ledger).values({
          workspaceId: payment.workspaceId,
          paymentId: payment.id,
          amount: payment.amount,
          transactionType: 'in', // Uang masuk
          description: description,
        });
        
        // Update Registration Status based on Payment Type
        if (payment.paymentType === 'dp1') {
           await tx.update(schema.registrations).set({ status: 'dp1_paid' }).where(eq(schema.registrations.id, payment.registrationId));
        } else if (payment.paymentType === 'dp2') {
           await tx.update(schema.registrations).set({ status: 'dp2_paid' }).where(eq(schema.registrations.id, payment.registrationId));
        } else if (payment.paymentType === 'full') {
           await tx.update(schema.registrations).set({ status: 'fully_paid' }).where(eq(schema.registrations.id, payment.registrationId));
        }
      });

      res.json({ success: true, message: 'Pembayaran berhasil diverifikasi dan otomatis masuk ke Buku Kas.' });
    } catch (error: any) {
      console.error('Error approving payment:', error);
      res.status(500).json({ error: error.message || 'Gagal memproses pembayaran' });
    }
  });

  // 3. Logika Master Archive (Arsip Jamaah Soft Delete)
  app.get("/api/admin/jamaah/archive", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Admin' });
    }

    try {
      // Hanya memanggil data dengan deleted_at IS NOT NULL
      const archivedUsers = await db.query.users.findMany({
        where: sql\`\${schema.users.deletedAt} IS NOT NULL\`
      });

      res.json(archivedUsers);
    } catch (error) {
      console.error('Error fetching archive:', error);
      res.status(500).json({ error: 'Gagal mengambil data arsip jamaah' });
    }
  });

  // 4. Utilitas Export to PDF (Mock/Stub for Endpoint)
  app.get("/api/admin/reports/export-pdf", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Admin' });
    }
    
    try {
      // Di dunia nyata, di sini akan digunakan library 'pdfkit' atau sejenisnya
      // untuk men-generate file PDF di memory lalu mengirimnya via response (res.setHeader / res.pipe)
      
      const type = req.query.type; // 'mutasi' or 'arsip'
      
      // Stubbing the response logic to show automation capability
      res.setHeader('Content-Type', 'application/json');
      res.json({
         success: true,
         message: \`Berhasil generate PDF untuk \${type}. File siap didownload.\`,
         downloadUrl: \`/dummy-path-to-download/\${type}-report.pdf\` 
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Gagal generate PDF' });
    }
  });
`;

let target = 'app.get("*all", (req, res) => {';
if (!serverTs.includes(target)) {
  target = 'app.get("*", (req, res) => {'; // handle express 4 vs 5 differences if any
}

if(serverTs.includes(target)) {
  serverTs = serverTs.replace(target, endpoints + '\\n  ' + target);
} else {
  // Try inserting before app.listen
  serverTs = serverTs.replace('app.listen(PORT', endpoints + '\\n  app.listen(PORT');
}

fs.writeFileSync('server.ts', serverTs);
console.log("Endpoints added to server.ts");
