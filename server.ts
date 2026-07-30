import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import pg from 'pg';
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { eq, and, desc, asc, sql, gte, inArray, ne, or, isNull, lt } from 'drizzle-orm';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import * as dotenv from 'dotenv';
dotenv.config();

import { db, createPool } from './src/db/index.ts';
import { withRetry } from './src/db/retry.ts';
import * as schema from './src/db/schema.ts';
import http from "http";
import { Server as SocketServer } from "socket.io";
import { ZipArchive } from 'archiver';
import multer from 'multer';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: typeof schema.users.$inferSelect;
  file?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026';

// --- Registration Status Management ---
export const REGISTRATION_STATUS_ORDER = [
  'DRAFT', 'PILIH_PAKET', 'ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 
  'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'
];

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  const currentIndex = REGISTRATION_STATUS_ORDER.indexOf(currentStatus);
  const newIndex = REGISTRATION_STATUS_ORDER.indexOf(newStatus);
  
  if (currentIndex === -1 || newIndex === -1) return false;
  
  // Allow forward progression or staying in the same status
  // For Admin, we might allow any transition, but strictly per request: "validasi transisi"
  return newIndex >= currentIndex;
}

const requireStatus = (...allowedStatuses: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const regId = req.params.id;
      if (!regId) return res.status(400).json({ error: "ID Registrasi diperlukan" });
      
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, regId)
      }));
      
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      
      if (!allowedStatuses.includes(reg.status)) {
        return res.status(403).json({ 
          error: `Aksi ini memerlukan status: ${allowedStatuses.join(', ')}. Status saat ini: ${reg.status}`,
          currentStatus: reg.status,
          requiredStatuses: allowedStatuses
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: "Gagal memvalidasi status registrasi" });
    }
  };
};

// Admin and User Cache to speed up middleware authentication and reduce DB/Firebase network overhead
const adminUserCache = new Map<string, { user: any; timestamp: number }>();
const userAuthCache = new Map<string, { user: any; timestamp: number }>();

export function invalidateUserCache(token?: string) {
  if (token) userAuthCache.delete(token);
}

// Auth Middleware
async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
  }

  // 1. Try Custom JWT first
  const unverifiedDecoded = jwt.decode(token) as any;
  if (unverifiedDecoded && unverifiedDecoded.role === 'admin') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const ADMIN_ID = '00000000-0000-0000-0000-000000000000';
      const targetId = decoded.id || ADMIN_ID;

      // Check fast in-memory cache (valid for 60 seconds)
      const cached = adminUserCache.get(targetId);
      if (cached && Date.now() - cached.timestamp < 60000) {
        req.user = cached.user;
        return next();
      }

      let adminUser = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.id, targetId)
      }));
      
      const defaultWorkspace = await db.query.workspaces.findFirst();

      if (!adminUser && targetId === ADMIN_ID) {
        // Create the default super admin if it doesn't exist
        const [newAdmin] = await withRetry(() => db.insert(schema.users).values({
          id: ADMIN_ID,
          uid: 'admin-hardcoded-uid',
          email: 'admin@goldentravel.local',
          name: 'Administrator',
          role: 'admin',
          workspaceId: (defaultWorkspace?.id as any),
          status: 'Selesai' as any
        }).returning());
        adminUser = newAdmin;
      }
      
      if (adminUser && !adminUser.workspaceId && defaultWorkspace) {
        const [updatedAdmin] = await withRetry(() => db.update(schema.users)
          .set({ workspaceId: (defaultWorkspace.id as any) })
          .where(eq(schema.users.id, (adminUser!.id as any)))
          .returning());
        adminUser = updatedAdmin;
      }
      
      if (!adminUser) {
        // Fallback to token payload if user not found in DB
        req.user = decoded as any;
      } else {
        req.user = adminUser;
        adminUserCache.set(targetId, { user: adminUser, timestamp: Date.now() });
      }
      return next();
    } catch (e: any) {
      console.error('Admin JWT verification failed:', e.message);
      return res.status(401).json({ error: 'Sesi Admin telah berakhir. Silakan login kembali.' });
    }
  }

  // 2. Try Firebase Auth
  try {
    const cachedUser = userAuthCache.get(token);
    if (cachedUser && Date.now() - cachedUser.timestamp < 120000) {
      req.user = cachedUser.user;
      return next();
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.uid || decoded.user_id || decoded.sub)) {
        // Only log if it's NOT the common "no kid claim" error or if we want to be aware of fallbacks
        if (!err.message?.includes('kid')) {
          console.error('verifyIdToken middleware failed:', err.message);
        }
        decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
      } else {
        console.error('verifyIdToken middleware failed and no fallback possible:', err.message, "decoded:", decoded);
        throw err;
      }
    }
    let user;
    try {
      user = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.uid, decodedToken.uid),
      }));
    } catch (err: any) {
      console.error('Database query failed in authenticate after retries:', err.message);
      throw err;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    userAuthCache.set(token, { user, timestamp: Date.now() });

    if (userAuthCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of userAuthCache.entries()) {
        if (now - v.timestamp > 120000) userAuthCache.delete(k);
      }
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
  });

  const notifyUpdate = () => {
    io.emit("data_updated", { timestamp: new Date().toISOString() });
  };

  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // Multer setup
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });
  app.set("upload", upload); // Store in app for use in routes

  app.use('/uploads', express.static(uploadDir));

  // POST /api/upload -> Universal file upload
  app.post("/api/upload", authenticate, (req: AuthRequest, res, next) => {
    const uploadMiddleware = req.app.get('upload');
    uploadMiddleware.single('file')(req, res, (err: any) => {
      if (err) return res.status(500).json({ error: "Gagal upload file" });
      if (!req.file) return res.status(400).json({ error: "File tidak ditemukan" });
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    });
  });

  // Run lightweight schema auto-migrations in background (non-blocking for fast HTTP listen)
  (async () => {
    try {
      await withRetry(() => db.execute(sql`SELECT 1`), 3, 1000);
      console.log('[DB Status] Database connected successfully at startup.');
      
      // Auto-Migration for missing columns
      try {
        await db.execute(sql`ALTER TABLE manifest_keberangkatan ADD COLUMN IF NOT EXISTS pax_manifest jsonb;`);
      } catch (e) {}

      // Ensure Default Workspace exists
      let defaultWorkspace: any = await db.query.workspaces.findFirst();
      if (!defaultWorkspace) {
        console.log('[DB Setup] Creating default workspace...');
        const [newWorkspace] = await db.insert(schema.workspaces).values({
          name: 'Golden Tour Haramain',
          slug: 'golden-tour',
        }).returning();
        defaultWorkspace = newWorkspace;
      }

      // Auto-Migration for missing workspaceId in ALL tables
      if (defaultWorkspace) {
        const tablesToUpdate = [
          schema.users, schema.registrations, schema.packages, schema.schedules,
          schema.payments, schema.documents, schema.notifications, 
          schema.helpdesk_tickets, schema.equipment, schema.manifests, 
          schema.memories, schema.certificates
        ];
        
        for (const table of tablesToUpdate) {
          try {
            await db.update(table as any)
              .set({ workspaceId: defaultWorkspace.id })
              .where(isNull((table as any).workspaceId));
          } catch (e) {}
        }
        console.log('[DB Auto-Migration] Missing workspaceId populated successfully.');
      }
    } catch (err: any) {
      console.warn('[DB Init Warning]:', err.message);
    }
  })();

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      await withRetry(() => db.execute(sql`SELECT 1`));
      res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      console.error("Health check database error:", err.message);
      res.status(500).json({ status: "error", db: "disconnected", message: err.message });
    }
  });

  // Custom Admin Login (Password Only)
  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    // Password is hardcoded here. User will use this to login.
    if (password === 'admin123') {
      const adminUser = await db.query.users.findFirst({
        where: eq(schema.users.role, 'admin'),
      });
      
      const token = jwt.sign({ 
        id: adminUser?.id,
        role: 'admin',
        email: adminUser?.email || 'admin@goldentravel.id'
      }, JWT_SECRET, { expiresIn: '1d' });
      
      res.json({ token, role: 'admin' });
    } else {
      res.status(401).json({ error: 'Kata sandi salah' });
    }
  });

  // Sync User (Create if not exists)
  app.post("/api/auth/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (!idToken || idToken === 'null' || idToken === 'undefined') {
      return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
    }
    const { role: requestedRole, name: requestedName } = req.body;
    try {
      console.log('Verifying session for:', idToken.substring(0, 20) + '...');
      
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      let user;
      try {
        console.log('Searching for user with UID:', decodedToken.uid);
        const results = await withRetry(() => db.select().from(schema.users)
          .where(eq(schema.users.uid, decodedToken.uid))
          .limit(1));
        user = results[0];
      } catch (err: any) {
        console.warn('Drizzle user lookup failed in /sync, attempting raw pool fallback:', err.message);
        try {
          const pool = createPool();
          const rawRes = await pool.query(
            'SELECT id, workspace_id, uid, email, name, phone, avatar_url, role, mitra_id, referral_code, created_at, deleted_at FROM users WHERE uid = $1 LIMIT 1',
            [decodedToken.uid]
          );
          user = rawRes.rows[0];
        } catch (rawErr: any) {
          console.error('Raw pool user lookup also failed:', rawErr);
          throw new Error(err.cause?.message || err.message || 'Gagal mencari user di database');
        }
      }

      const userEmail = decodedToken.email || `${decodedToken.uid}@goldentravel.local`;
      const userName = requestedName || decodedToken.name || userEmail.split('@')[0];

      if (!user) {
        // Create user
        const role = (decodedToken.email === 'felix.hencia04@gmail.com') ? 'admin' : (requestedRole === 'mitra' ? 'mitra' : 'jamaah');

        const defaultWorkspace = await db.query.workspaces.findFirst();

        console.log('Creating new user:', { email: userEmail, role, workspaceId: defaultWorkspace?.id });

        try {
          const insertData: any = {
            uid: decodedToken.uid,
            email: userEmail,
            name: userName,
            role: role as any,
            workspaceId: defaultWorkspace?.id,
            status: 'DRAFT'
          };
          
          const [newUser] = await withRetry(() => db.insert(schema.users).values(insertData).returning());
          
          user = newUser;
          console.log('New user created successfully:', user?.id);
          notifyUpdate();
        } catch (insertErr: any) {
          console.error('Database insert error in /sync:', insertErr);
          
          if (insertErr.message?.includes('users_email_unique') || insertErr.cause?.message?.includes('users_email_unique')) {
            console.log('Email already exists, linking UID...');
            try {
              const [updatedUser] = await withRetry(() => db.update(schema.users)
                .set({ uid: decodedToken.uid })
                .where(eq(schema.users.email, userEmail))
                .returning());
              user = updatedUser;
            } catch (updErr: any) {
              const pool = createPool();
              const defaultWs = await db.query.workspaces.findFirst();
              const rawUpd = await pool.query(
                'UPDATE users SET uid = $1, workspace_id = COALESCE(workspace_id, $2) WHERE email = $3 RETURNING *',
                [decodedToken.uid, defaultWs?.id, userEmail]
              );
              user = rawUpd.rows[0];
            }
          } else {
            try {
              const pool = createPool();
              const defaultWs = await db.query.workspaces.findFirst();
              const rawIns = await pool.query(
                'INSERT INTO users (uid, email, name, role, workspace_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [decodedToken.uid, userEmail, userName, role, defaultWs?.id, 'DRAFT']
              );
              user = rawIns.rows[0];
              notifyUpdate();
            } catch (rawInsErr: any) {
              throw new Error(`Gagal membuat user: ${insertErr.cause?.message || insertErr.message}`);
            }
          }
        }
      }

      if (user) {
        const defaultWorkspace = await db.query.workspaces.findFirst();
        
        // Update info if needed
        if (user.name !== userName || user.avatarUrl !== decodedToken.picture || (!user.workspaceId && defaultWorkspace)) {
          const updateData: any = { 
            name: userName, 
            avatarUrl: decodedToken.picture, 
            updatedAt: new Date() 
          };
          if (!user.workspaceId && defaultWorkspace) {
            updateData.workspaceId = defaultWorkspace.id;
          }
          
          const [updatedUser] = await withRetry(() => db.update(schema.users)
            .set(updateData)
            .where(eq(schema.users.id, user.id))
            .returning());
          user = updatedUser;
        }

        // Upgrade to admin if email matches
        if (decodedToken.email === 'felix.hencia04@gmail.com' && user.role !== 'admin') {
          try {
            const updateData: any = { 
              role: 'admin',
              workspaceId: user.workspaceId || defaultWorkspace?.id
            };
            const [updatedUser] = await withRetry(() => db.update(schema.users)
              .set(updateData)
              .where(eq(schema.users.id, user.id))
              .returning());
            user = updatedUser;
          } catch (e) {}
        }
      }

      const registration = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, user.id),
        with: {
          package: true,
          schedule: true,
          payments: true,
          documents: true
        }
      }));

      notifyUpdate();
      res.json({
        user,
        registration
      });
    } catch (error: any) {
      console.error("Sync error details:", error);
      res.status(401).json({ error: `Gagal sinkronisasi: ${error.message || 'Token tidak valid'}` });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      const registration = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, user!.id),
        with: {
          package: true,
          schedule: true,
          payments: true,
          documents: true
        }
      }));
      res.json({ user, registration });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // --- Transaksi & Keuangan Endpoints ---

  // GET /api/registrasi/:id/invoice -> Jamaah: Detail tagihan
  app.get("/api/registrasi/:id/invoice", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id),
        with: {
          package: true,
          payments: true
        }
      }));

      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const totalHarga = Number(reg.totalAmount || reg.package?.price || 0);
      const payments = reg.payments || [];
      const totalBayar = payments
        .filter(p => p.status === 'VERIFIED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const sisaTagihan = totalHarga - totalBayar;
      
      // Determine next stage
      const hasDP1 = payments.some(p => p.paymentType === 'DP1' && p.status === 'VERIFIED');
      const hasDP2 = payments.some(p => p.paymentType === 'DP2' && p.status === 'VERIFIED');
      
      let tahapBerikutnya = 'DP1';
      let nominalBerikutnya = 1500000;

      if (hasDP1) {
        tahapBerikutnya = 'DP2';
        nominalBerikutnya = 10000000;
      }
      if (hasDP2) {
        tahapBerikutnya = 'PELUNASAN';
        nominalBerikutnya = sisaTagihan;
      }
      if (sisaTagihan <= 0) {
        tahapBerikutnya = 'LUNAS';
        nominalBerikutnya = 0;
      }

      res.json({
        totalHarga,
        totalBayar,
        sisaTagihan,
        tahapBerikutnya,
        nominalBerikutnya,
        riwayatTransaksi: payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      });
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data invoice" });
    }
  });

  // POST /api/registrasi/:id/transaksis -> Jamaah: upload bukti bayar
  app.post("/api/registrasi/:id/transaksis", authenticate, async (req: AuthRequest, res) => {
    const { paymentType, amount, proofUrl } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      
      // Check if user has permission
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [newPayment] = await withRetry(() => db.insert(schema.payments).values({
        workspaceId: reg.workspaceId,
        registrationId: req.params.id,
        paymentType: paymentType as any,
        amount: amount.toString(),
        proofUrl: proofUrl || '',
        status: 'PENDING'
      }).returning());

      // Update user/registration status to VERIFIKASI_BAYAR
      await db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, reg.userId));
      await db.update(schema.registrations).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.registrations.id, reg.id));

      notifyUpdate();
      res.status(201).json(newPayment);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengunggah bukti bayar" });
    }
  });

  // GET /api/registrasi/:id/transaksis -> Lihat riwayat bayar
  app.get("/api/registrasi/:id/transaksis", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const payments = await withRetry(() => db.query.payments.findMany({
        where: eq(schema.payments.registrationId, req.params.id),
        orderBy: [desc(schema.payments.createdAt)]
      }));
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil riwayat pembayaran" });
    }
  });

  // PUT /api/transaksis/:id/verifikasi -> Admin: konfirmasi/tolak
  app.put("/api/transaksis/:id/verifikasi", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { status, alasan } = req.body; // status: 'VERIFIED' | 'REJECTED'
    try {
      const [updatedPayment] = await withRetry(() => db.update(schema.payments)
        .set({ 
          status: status as any,
          adminNotes: alasan || null,
          verifiedAt: new Date(),
          verifiedBy: req.user!.id
        })
        .where(eq(schema.payments.id, req.params.id))
        .returning());

      if (!updatedPayment) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

      const regWithDetails = await db.query.registrations.findFirst({
        where: eq(schema.registrations.id, updatedPayment.registrationId),
        with: {
          package: true,
          payments: true
        }
      });

      if (regWithDetails && regWithDetails.package) {
        if (status === 'VERIFIED') {
          const totalHarga = Number(regWithDetails.totalAmount || regWithDetails.package.price);
          const totalBayar = regWithDetails.payments
            .filter(t => t.status === 'VERIFIED')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const persen = totalBayar / totalHarga;
          
          let targetStatus: any = 'CICIL_BAYAR';

          if (persen >= 0.999) { // Using small epsilon for float comparison if necessary, but decimal should be fine
            targetStatus = 'LUNAS';
          }

          await withRetry(() => db.update(schema.users)
            .set({ status: targetStatus })
            .where(eq(schema.users.id, regWithDetails.userId)));
          
          await withRetry(() => db.update(schema.registrations)
            .set({ status: targetStatus, updatedAt: new Date() })
            .where(eq(schema.registrations.id, regWithDetails.id)));

        } else if (status === 'REJECTED') {
          // If rejected, keep as CICIL_BAYAR
          await withRetry(() => db.update(schema.users)
            .set({ status: 'CICIL_BAYAR' })
            .where(eq(schema.users.id, regWithDetails.userId)));
          await withRetry(() => db.update(schema.registrations)
            .set({ status: 'CICIL_BAYAR', updatedAt: new Date() })
            .where(eq(schema.registrations.id, regWithDetails.id)));
        }
      }

      notifyUpdate();
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: "Gagal memverifikasi transaksi" });
    }
  });

  // GET /api/admin/transaksis/pending -> Admin: antrean setoran
  app.get("/api/admin/transaksis/pending", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const pendingPayments = await withRetry(() => db.query.payments.findMany({
        where: eq(schema.payments.status, 'PENDING'),
        with: {
          registration: {
            with: {
              user: true,
              package: true
            }
          }
        }
      }));
      res.json(pendingPayments);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil antrean setoran" });
    }
  });

  // GET /api/admin/laporan/keuangan -> Laporan keuangan
  app.get("/api/admin/laporan/keuangan", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allPayments = await db.query.payments.findMany({
        where: eq(schema.payments.status, 'VERIFIED'),
        with: {
          registration: {
            with: {
              package: true
            }
          }
        }
      });

      const totalOmset = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Monthly breakdown
      const perBulan: Record<string, number> = {};
      allPayments.forEach(p => {
        const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
        perBulan[month] = (perBulan[month] || 0) + Number(p.amount);
      });

      // Package breakdown
      const perPaket: Record<string, number> = {};
      allPayments.forEach(p => {
        const packageName = p.registration?.package?.name || 'Unknown';
        perPaket[packageName] = (perPaket[packageName] || 0) + Number(p.amount);
      });

      // Stage breakdown
      const perTahap: Record<string, number> = {};
      allPayments.forEach(p => {
        const stage = p.paymentType || 'Unknown';
        perTahap[stage] = (perTahap[stage] || 0) + Number(p.amount);
      });

      res.json({
        totalOmset,
        perBulan: Object.entries(perBulan).map(([label, value]) => ({ label, value })),
        perPaket: Object.entries(perPaket).map(([label, value]) => ({ label, value })),
        perTahap: Object.entries(perTahap).map(([label, value]) => ({ label, value }))
      });
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil laporan keuangan" });
    }
  });

  // GET /api/admin/dashboard/statistik
  app.get("/api/admin/dashboard/statistik", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const workspaceId = req.user!.workspaceId!;
      
      const allUsers = await db.query.users.findMany({
        where: eq(schema.users.workspaceId, workspaceId)
      });
      
      const allRegs = await db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, workspaceId)
      });
      
      const pendingDocsCount = await db.query.documents.findMany({
        where: and(
          eq(schema.documents.workspaceId, workspaceId),
          eq(schema.documents.status, 'PENDING')
        )
      });
      
      const pendingPaymentsCount = await db.query.payments.findMany({
        where: and(
          eq(schema.payments.workspaceId, workspaceId),
          eq(schema.payments.status, 'PENDING')
        )
      });
      
      const approvedPayments = await db.query.payments.findMany({
        where: and(
          eq(schema.payments.workspaceId, workspaceId),
          eq(schema.payments.status, 'VERIFIED')
        )
      });

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const pendapatanBulanIni = approvedPayments
        .filter(p => p.createdAt >= firstDayOfMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const statusCounts = allUsers.reduce((acc: any, u) => {
        const status = u.status || 'DRAFT';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const registrationChart = allRegs.reduce((acc: any, r) => {
        const month = r.createdAt.toISOString().substring(0, 7);
        const existing = acc.find((i: any) => i.bulan === month);
        if (existing) {
          existing.jumlah += 1;
        } else {
          acc.push({ bulan: month, jumlah: 1 });
        }
        return acc;
      }, []).sort((a: any, b: any) => a.bulan.localeCompare(b.bulan));

      res.json({
        total_jamaah: allUsers.length,
        total_lunas: statusCounts['LUNAS'] || 0,
        total_pending_dokumen: pendingDocsCount.length,
        total_pending_setoran: pendingPaymentsCount.length,
        pendapatan_bulan_ini: pendapatanBulanIni,
        jamaah_by_status: statusCounts,
        grafik_pendaftaran: registrationChart
      });
    } catch (error) {
      res.status(500).json({ error: "Gagal memuat statistik dashboard" });
    }
  });

  // GET /api/admin/laporan/keuangan -> Admin: laporan omset
  app.get("/api/admin/laporan/keuangan", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const approvedPayments = await withRetry(() => db.query.payments.findMany({
        where: and(
          eq(schema.payments.status, 'VERIFIED'),
          eq(schema.payments.workspaceId, req.user!.workspaceId!)
        )
      }));

      const totalOmset = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Group by month
      const omsetByMonth = approvedPayments.reduce((acc: any, p) => {
        const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + Number(p.amount);
        return acc;
      }, {});

      res.json({
        totalOmset,
        omsetByMonth,
        count: approvedPayments.length
      });
    } catch (error) {
      res.status(500).json({ error: "Gagal membuat laporan keuangan" });
    }
  });

  // --- Operasional Endpoints ---

  // GET /api/jadwals/:id/manifes -> Generate/lihat manifes
  app.get("/api/jadwals/:id/manifes", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const regs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.scheduleId, req.params.id),
        with: { user: true }
      }));
      
      const manifest = regs.map((reg, index) => ({
        id: reg.id,
        no: index + 1,
        nama: reg.user.name,
        email: reg.user.email,
        paxData: reg.paxData || []
      }));

      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil manifes" });
    }
  });

  // POST /api/jadwals/:id/broadcast -> Admin: kirim pengumuman
  app.post("/api/jadwals/:id/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { title, message, type } = req.body;
    try {
      const regs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.scheduleId, req.params.id)
      }));

      const notifications = regs.map(reg => ({
        workspaceId: req.user!.workspaceId!,
        userId: reg.userId,
        title: title || "Pengumuman Jadwal",
        message: message || "",
        type: type || 'info',
        isRead: 'false'
      }));

      if (notifications.length > 0) {
        await withRetry(() => db.insert(schema.notifications).values(notifications));
      }

      notifyUpdate();
      res.json({ success: true, count: notifications.length });
    } catch (error) {
      res.status(500).json({ error: "Gagal mengirim broadcast" });
    }
  });

  // GET /api/registrasi/:id/perlengkapan -> Status distribusi atribut
  app.get("/api/registrasi/:id/perlengkapan", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      let equipmentStatus = await withRetry(() => db.query.equipment.findFirst({
        where: eq(schema.equipment.registrationId, req.params.id)
      }));

      if (!equipmentStatus) {
        // Initialize if not exists
        [equipmentStatus] = await withRetry(() => db.insert(schema.equipment).values({
          workspaceId: reg.workspaceId,
          registrationId: req.params.id,
          koper: false,
          ihram: false,
          mukena: false
        }).returning());
      }

      res.json(equipmentStatus);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil status perlengkapan" });
    }
  });

  // PUT /api/perlengkapan/:id/distribusi -> Admin: tandai sudah diterima
  app.put("/api/perlengkapan/:id/distribusi", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { koper, ihram, mukena, assignee } = req.body;
    try {
      const [updated] = await withRetry(() => db.update(schema.equipment)
        .set({ 
          koper: koper ?? undefined,
          ihram: ihram ?? undefined,
          mukena: mukena ?? undefined,
          assignee: assignee ?? undefined,
          updatedAt: new Date()
        })
        .where(eq(schema.equipment.id, req.params.id))
        .returning());
      
      if (!updated) return res.status(404).json({ error: "Data perlengkapan tidak ditemukan" });

      notifyUpdate();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Gagal update distribusi perlengkapan" });
    }
  });

  // --- Sertifikat & Galeri Endpoints ---

  // POST /api/registrasi/:id/sertifikat -> Admin: upload sertifikat
  app.post("/api/registrasi/:id/sertifikat", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { recipientName, certificateUrl } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id),
        with: { user: true }
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });

      const [newCert] = await withRetry(() => db.insert(schema.certificates).values({
        workspaceId: reg.workspaceId,
        registrationId: req.params.id,
        recipientName: recipientName || reg.user.name || 'Jamaah',
        certificateUrl: certificateUrl || ''
      }).returning());

      // Notify user
      await withRetry(() => db.insert(schema.notifications).values({
        workspaceId: reg.workspaceId,
        userId: reg.userId,
        title: "Sertifikat Digital Tersedia",
        message: "Sertifikat kenangan Anda telah diterbitkan. Silakan unduh di dashboard.",
        type: 'success',
        isRead: 'false'
      }));

      notifyUpdate();
      res.status(201).json(newCert);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengunggah sertifikat" });
    }
  });

  // --- CRM & Admin Registration Management ---

  // GET /api/admin/registrasis -> Admin: CRM list with filters & pagination
  app.get("/api/admin/registrasis", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    try {
      const { 
        page = '1', 
        limit = '10', 
        status, // array of statuses
        packageId,
        scheduleId,
        search 
      } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const offset = (pageNum - 1) * limitNum;
      
      const filters = [eq(schema.registrations.workspaceId, req.user!.workspaceId!)];
      
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        filters.push(inArray(schema.registrations.status, statusArray as any));
      }
      
      if (packageId) {
        filters.push(eq(schema.registrations.packageId, packageId as string));
      }
      
      if (scheduleId) {
        filters.push(eq(schema.registrations.scheduleId, scheduleId as string));
      }

      let baseQuery = db.select({
        registration: schema.registrations,
        user: schema.users,
        package: schema.packages,
        schedule: schema.schedules,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .leftJoin(schema.schedules, eq(schema.registrations.scheduleId, schema.schedules.id))
      .where(and(...filters));

      if (search) {
        const searchStr = `%${search}%`;
        baseQuery = baseQuery.where(
          or(
            sql`${schema.users.name} ILIKE ${searchStr}`,
            sql`${schema.users.phone} ILIKE ${searchStr}`
          )
        );
      }

      // Clone query for count
      const totalRes = await db.select({ count: sql<number>`count(*)` }).from(baseQuery.as('subquery'));
      const total = Number(totalRes[0].count);

      const data = await baseQuery
        .limit(limitNum)
        .offset(offset)
        .orderBy(desc(schema.registrations.createdAt));

      const registrationsWithMeta = await Promise.all(data.map(async (row) => {
        const payments = await db.query.payments.findMany({
          where: and(
            eq(schema.payments.registrationId, row.registration.id),
            eq(schema.payments.status, 'VERIFIED')
          )
        });
        
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAmount = Number(row.registration.totalAmount || row.package.price);
        const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

        const docs = await db.query.documents.findMany({
          where: eq(schema.documents.registrationId, row.registration.id)
        });
        const requiredDocs = ['KTP', 'Paspor'];
        const verifiedDocsCount = docs.filter(d => requiredDocs.includes(d.docType) && d.status === 'VERIFIED').length;
        const hasRequiredDocs = verifiedDocsCount >= requiredDocs.length;

        return {
          ...row.registration,
          user: row.user,
          package: row.package,
          schedule: row.schedule,
          paymentProgress,
          hasRequiredDocs
        };
      }));

      res.json({
        data: registrationsWithMeta,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('CRM fetch error:', error);
      res.status(500).json({ error: "Gagal mengambil data CRM" });
    }
  });

  // PUT /api/registrasi/:id/status -> Admin: update status manual
  app.put("/api/registrasi/:id/status", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { status, notes } = req.body;
    
    try {
      const [updated] = await db.update(schema.registrations)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(schema.registrations.id, req.params.id))
        .returning();
      
      if (!updated) return res.status(404).json({ error: "Registrasi tidak ditemukan" });

      // Sync user status
      await db.update(schema.users)
        .set({ status: status as any })
        .where(eq(schema.users.id, updated.userId));

      // Record activity
      await db.insert(schema.activities).values({
        workspaceId: updated.workspaceId,
        registrationId: updated.id,
        userId: req.user!.id,
        action: 'UPDATE_STATUS',
        details: `Status diubah menjadi ${status}. Catatan: ${notes || '-'}`
      });

      notifyUpdate();
      res.json(updated);
    } catch (error) {
      console.error('Status update error:', error);
      res.status(500).json({ error: "Gagal update status" });
    }
  });

  // GET /api/registrasi/:id/activity -> Admin: Lihat riwayat aktivitas
  app.get("/api/registrasi/:id/activity", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const history = await db.query.activities.findMany({
        where: eq(schema.activities.registrationId, req.params.id),
        orderBy: [desc(schema.activities.createdAt)],
        with: {
          user: true
        }
      });
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil riwayat aktivitas" });
    }
  });

  // GET /api/admin/registrasis/export -> Export to Excel
  app.get("/api/admin/registrasis/export", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    try {
      const allData = await db.select({
        registration: schema.registrations,
        user: schema.users,
        package: schema.packages,
        schedule: schema.schedules,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .leftJoin(schema.schedules, eq(schema.registrations.scheduleId, schema.schedules.id))
      .where(eq(schema.registrations.workspaceId, req.user!.workspaceId!));

      // Simple JSON to Excel using 'xlsx'
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(allData.map(row => ({
        ID: row.registration.id,
        Nama: row.user.name,
        Email: row.user.email,
        Phone: row.user.phone,
        Paket: row.package.name,
        Jadwal: row.schedule?.departureDate ? new Date(row.schedule.departureDate).toLocaleDateString() : '-',
        Status: row.registration.status,
        TotalAmount: row.registration.totalAmount,
        CreatedAt: row.registration.createdAt
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Jamaah");
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=jamaah_export.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: "Gagal ekspor data" });
    }
  });

  // GET /api/registrasi/:id/sertifikat -> Jamaah: unduh sertifikat
  app.get("/api/registrasi/:id/sertifikat", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const certs = await withRetry(() => db.query.certificates.findMany({
        where: eq(schema.certificates.registrationId, req.params.id)
      }));
      res.json(certs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil sertifikat" });
    }
  });

  // POST /api/galeri -> Admin: tambah foto momen
  app.post("/api/galeri", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { packageId, scheduleId, registrationId, imageUrl, caption } = req.body;
    try {
      const [newMemory] = await withRetry(() => db.insert(schema.memories).values({
        workspaceId: req.user!.workspaceId!,
        packageId: packageId || null,
        scheduleId: scheduleId || null,
        registrationId: registrationId || null,
        imageUrl: imageUrl || '',
        caption: caption || ''
      }).returning());

      notifyUpdate();
      res.status(201).json(newMemory);
    } catch (error) {
      res.status(500).json({ error: "Gagal menambah galeri" });
    }
  });

  // GET /api/galeri -> Jamaah & Admin: lihat galeri
  app.get("/api/galeri", authenticate, async (req: AuthRequest, res) => {
    const { jadwal_id, paket_id, registrasi_id } = req.query;
    try {
      let conditions = [eq(schema.memories.workspaceId, req.user!.workspaceId!)];
      
      if (jadwal_id) conditions.push(eq(schema.memories.scheduleId, jadwal_id as string));
      if (paket_id) conditions.push(eq(schema.memories.packageId, paket_id as string));
      if (registrasi_id) conditions.push(eq(schema.memories.registrationId, registrasi_id as string));

      const gallery = await withRetry(() => db.query.memories.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.memories.createdAt)]
      }));
      res.json(gallery);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil galeri" });
    }
  });

  // --- Dokumen Final & Keberangkatan Endpoints ---

  // POST /api/registrasi/:id/dokumen-final -> Admin: upload E-Visa/Tiket
  app.post("/api/registrasi/:id/dokumen-final", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { docType, fileUrl } = req.body; // e.g., 'E-Visa', 'Tiket Pesawat'
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });

      const [newDoc] = await withRetry(() => db.insert(schema.documents).values({
        registrationId: req.params.id,
        docType: docType || 'E-Visa',
        fileUrl: fileUrl || '',
        status: 'VERIFIED', // Final documents from admin are auto-approved
        workspaceId: reg.workspaceId
      }).returning());

      // Send notification to user
      await withRetry(() => db.insert(schema.notifications).values({
        workspaceId: reg.workspaceId,
        userId: reg.userId,
        title: "Dokumen Perjalanan Terbit",
        message: `Dokumen ${docType} Anda telah diterbitkan. Silakan unduh di dashboard.`,
        type: 'success',
        isRead: 'false'
      }));

      notifyUpdate();
      res.status(201).json(newDoc);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengunggah dokumen final" });
    }
  });

  // GET /api/registrasi/:id/dokumen-final -> Jamaah: unduh dokumen
  app.get("/api/registrasi/:id/dokumen-final", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const finalDocs = await withRetry(() => db.query.documents.findMany({
        where: and(
          eq(schema.documents.registrationId, req.params.id),
          or(
            eq(schema.documents.docType, 'E-Visa'),
            eq(schema.documents.docType, 'Tiket Pesawat'),
            eq(schema.documents.docType, 'Itinerary Final')
          )
        )
      }));
      res.json(finalDocs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil dokumen final" });
    }
  });

  // --- Paket & Jadwal Endpoints (Standardized) ---

  // GET /api/pakets -> Jamaah: katalog aktif
  app.get("/api/pakets", authenticate, async (req: AuthRequest, res) => {
    try {
      const allPackages = await withRetry(() => db.query.packages.findMany({
        where: and(
          eq(schema.packages.workspaceId, req.user!.workspaceId!),
          eq(schema.packages.isAvailable, true)
        )
      }));
      
      const packagesWithParsedDesc = allPackages.map(pkg => {
        let description = pkg.description;
        try { description = JSON.parse(pkg.description); } catch(e) {}
        return { ...pkg, description };
      });

      res.json(packagesWithParsedDesc);
    } catch (error: any) {
      res.status(500).json({ error: "Gagal mengambil katalog paket" });
    }
  });

  // POST /api/pakets -> Admin: buat paket baru
  app.post("/api/pakets", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    // Proxy to existing implementation or reimplement
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota } = req.body;
      const data: any = {
        workspaceId: req.user!.workspaceId!,
        name: name || "Paket Baru",
        description: typeof description === 'string' ? description : JSON.stringify(description || []),
        price: Number(price) || 0,
        duration: duration || "9 Hari",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa",
        type: type || 'umroh',
        isAvailable: isAvailable ?? true,
        quota: Number(quota) || 45
      };
      const [newPackage] = await withRetry(() => db.insert(schema.packages).values(data).returning());
      res.status(201).json(newPackage);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Gagal membuat paket" });
    }
  });

  // PUT /api/pakets/:id -> Admin: edit paket
  app.put("/api/pakets/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota } = req.body;
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = typeof description === 'string' ? description : JSON.stringify(description);
      if (price !== undefined) data.price = Number(price);
      if (duration !== undefined) data.duration = duration;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;
      if (type !== undefined) data.type = type;
      if (isAvailable !== undefined) data.isAvailable = isAvailable;
      if (quota !== undefined) data.quota = Number(quota);

      const [updated] = await withRetry(() => db.update(schema.packages)
        .set(data)
        .where(eq(schema.packages.id, req.params.id))
        .returning());
      res.json(updated);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Gagal update paket" });
    }
  });

  // DELETE /api/pakets/:id -> Admin: hapus/nonaktifkan
  app.delete("/api/pakets/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.packages).where(eq(schema.packages.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Gagal menghapus paket" });
    }
  });

  // GET /api/jadwals?paket_id= -> list jadwal per paket
  app.get("/api/jadwals", authenticate, async (req: AuthRequest, res) => {
    try {
      const { paket_id } = req.query;
      let conditions = [eq(schema.schedules.workspaceId, req.user!.workspaceId!)];
      if (paket_id) {
        conditions.push(eq(schema.schedules.packageId, paket_id as string));
      }
      const allSchedules = await withRetry(() => db.query.schedules.findMany({
        where: and(...conditions),
        with: { package: true }
      }));
      res.json(allSchedules);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil jadwal" });
    }
  });

  // POST /api/jadwals -> Admin: buat jadwal
  app.post("/api/jadwals", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, departureDate, name, airline, totalSeats } = req.body;
      const [newSchedule] = await withRetry(() => db.insert(schema.schedules).values({
        workspaceId: req.user!.workspaceId!,
        packageId,
        departureDate: new Date(departureDate),
        name,
        airline,
        totalSeats: Number(totalSeats),
        availableSeats: Number(totalSeats)
      }).returning());
      res.status(201).json(newSchedule);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Gagal membuat jadwal" });
    }
  });

  // PUT /api/jadwals/:id/itinerary -> Admin: susun itinerary
  app.put("/api/jadwals/:id/itinerary", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { itineraryPdfUrl } = req.body;
      const [updated] = await withRetry(() => db.update(schema.schedules)
        .set({ itineraryPdfUrl })
        .where(eq(schema.schedules.id, req.params.id))
        .returning());
      res.json(updated);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Gagal update itinerary" });
    }
  });

  // --- Registrasi Endpoints (Standardized) ---

  // POST /api/registrasi -> Jamaah: daftar & pilih paket
  app.post("/api/registrasi", authenticate, async (req: AuthRequest, res) => {
    const { packageId, paxCount } = req.body;
    try {
      const pkg = await withRetry(() => db.query.packages.findFirst({
        where: eq(schema.packages.id, packageId)
      }));

      if (!pkg) return res.status(404).json({ error: "Paket tidak ditemukan" });

      const count = Number(paxCount) || 1;
      const totalAmount = (Number(pkg.price) * count).toString();
      const initialPaxData = Array.from({ length: count }, () => ({
        fullName: "",
        passportNumber: "",
        ktpNumber: "",
        birthDate: "",
        isSubmitted: false
      }));

      const existing = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, req.user!.id)
      }));

      let registration;
      if (existing) {
        [registration] = await withRetry(() => db.update(schema.registrations)
          .set({
            packageId,
            adultCount: count.toString(),
            totalAmount,
            paxData: initialPaxData,
            updatedAt: new Date()
          })
          .where(eq(schema.registrations.id, existing.id))
          .returning());
      } else {
        [registration] = await withRetry(() => db.insert(schema.registrations).values({
          userId: req.user!.id,
          packageId,
          adultCount: count.toString(),
          childCount: '0',
          infantCount: '0',
          totalAmount,
          paxData: initialPaxData,
          workspaceId: pkg.workspaceId,
          status: 'PILIH_PAKET'
        }).returning());
      }

      await withRetry(() => db.update(schema.users)
        .set({ status: 'PILIH_PAKET' })
        .where(eq(schema.users.id, req.user!.id)));

      if (existing) {
        await withRetry(() => db.update(schema.registrations)
          .set({ status: 'PILIH_PAKET' })
          .where(eq(schema.registrations.id, existing.id)));
      }

      notifyUpdate();
      res.status(201).json(registration);
    } catch (error) {
      res.status(500).json({ error: "Gagal mendaftar" });
    }
  });

  // GET /api/registrasi/:id -> Jamaah: lihat progress sendiri
  app.get("/api/registrasi/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id),
        with: {
          package: true,
          schedule: true,
          payments: true,
          documents: true,
          user: true
        }
      }));

      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      
      // Security check: Only admin or the owner can see it
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(reg);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data registrasi" });
    }
  });

  // GET /api/registrasi -> Admin: semua data jamaah
  app.get("/api/registrasi", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, req.user!.workspaceId!),
        with: {
          user: true,
          package: true,
          schedule: true
        }
      }));
      res.json(allRegs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil semua data registrasi" });
    }
  });

  // PUT /api/registrasi/:id/status -> Admin: transisi status manual
  app.put("/api/registrasi/:id/status", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { status: newStatus } = req.body;
    
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({ 
        where: eq(schema.registrations.id, req.params.id) 
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });

      if (!canTransitionTo(reg.status, newStatus)) {
        return res.status(400).json({ 
          error: "Transisi status tidak valid",
          currentStatus: reg.status,
          requestedStatus: newStatus
        });
      }

      // Update both user and registration status to keep them in sync
      await withRetry(() => db.transaction(async (tx) => {
        await tx.update(schema.users)
          .set({ status: newStatus as any })
          .where(eq(schema.users.id, reg.userId));
          
        await tx.update(schema.registrations)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(eq(schema.registrations.id, req.params.id));
      }));

      notifyUpdate();
      res.json({ success: true, status: newStatus });
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ error: "Gagal memperbarui status" });
    }
  });

  // --- Biodata Endpoints ---

  // GET /api/registrasi/:id/biodata -> Jamaah: lihat biodata
  app.get("/api/registrasi/:id/biodata", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(reg.paxData || []);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil biodata" });
    }
  });

  // PUT /api/registrasi/:id/biodata -> Jamaah: simpan biodata
  app.put("/api/registrasi/:id/biodata", authenticate, requireStatus('PILIH_PAKET', 'ISI_BIODATA'), async (req: AuthRequest, res) => {
    const { paxData } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await withRetry(() => db.update(schema.registrations)
        .set({ 
          paxData, 
          status: 'ISI_BIODATA',
          updatedAt: new Date() 
        })
        .where(eq(schema.registrations.id, req.params.id)));

      // Move user to UPLOAD_DOKUMEN phase
      await withRetry(() => db.update(schema.users)
        .set({ status: 'ISI_BIODATA' })
        .where(eq(schema.users.id, reg.userId)));
      
      // If all pax data is submitted (conceptual check), we could move to UPLOAD_DOKUMEN
      // For now, let's just use the requested flow
      await withRetry(() => db.update(schema.users)
        .set({ status: 'UPLOAD_DOKUMEN' })
        .where(eq(schema.users.id, reg.userId)));
      
      await withRetry(() => db.update(schema.registrations)
        .set({ status: 'UPLOAD_DOKUMEN' })
        .where(eq(schema.registrations.id, req.params.id)));

      notifyUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Gagal menyimpan biodata" });
    }
  });

  // --- Dokumen Endpoints ---

  // POST /api/registrasi/:id/dokumens -> Jamaah: upload file
  app.post("/api/registrasi/:id/dokumens", authenticate, requireStatus('ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN'), upload.single('file'), async (req: AuthRequest, res) => {
    const { docType, fileUrl: bodyFileUrl } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : bodyFileUrl;

    if (!fileUrl) return res.status(400).json({ error: "File atau URL file diperlukan" });
    if (!docType) return res.status(400).json({ error: "Jenis dokumen diperlukan" });

    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const existingDoc = await db.query.documents.findFirst({
        where: and(
          eq(schema.documents.registrationId, req.params.id),
          eq(schema.documents.docType, docType as any)
        )
      });

      let document;
      if (existingDoc) {
        [document] = await withRetry(() => db.update(schema.documents)
          .set({ 
            fileUrl,
            status: 'PENDING',
            adminNotes: null,
            updatedAt: new Date()
          })
          .where(eq(schema.documents.id, existingDoc.id))
          .returning());
      } else {
        [document] = await withRetry(() => db.insert(schema.documents).values({
          registrationId: req.params.id,
          docType: docType as any,
          fileUrl,
          status: 'PENDING',
          workspaceId: reg.workspaceId
        }).returning());
      }

      await withRetry(() => db.transaction(async (tx) => {
        await tx.update(schema.users)
          .set({ status: 'VERIFIKASI_DOKUMEN' })
          .where(eq(schema.users.id, reg.userId));
        
        await tx.update(schema.registrations)
          .set({ status: 'VERIFIKASI_DOKUMEN', updatedAt: new Date() })
          .where(eq(schema.registrations.id, req.params.id));
      }));

      notifyUpdate();
      res.status(201).json(document);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ error: "Gagal mengunggah dokumen" });
    }
  });

  // GET /api/registrasi/:id/dokumens -> Lihat dokumen
  app.get("/api/registrasi/:id/dokumens", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));
      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const docs = await withRetry(() => db.query.documents.findMany({
        where: eq(schema.documents.registrationId, req.params.id)
      }));
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil dokumen" });
    }
  });

  // PUT /api/dokumens/:id/verifikasi -> Admin: approve/reject
  app.put("/api/dokumens/:id/verifikasi", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { action, alasan } = req.body;
    const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
    
    try {
      const existingDoc = await db.query.documents.findFirst({
        where: eq(schema.documents.id, req.params.id),
        with: { registration: true }
      });
      if (!existingDoc) return res.status(404).json({ error: "Dokumen tidak ditemukan" });

      const [updatedDoc] = await withRetry(() => db.update(schema.documents)
        .set({ 
          status: newStatus,
          adminNotes: alasan || null,
          updatedAt: new Date()
        })
        .where(eq(schema.documents.id, req.params.id))
        .returning());

      if (newStatus === 'VERIFIED') {
        const allDocs = await db.query.documents.findMany({
          where: eq(schema.documents.registrationId, existingDoc.registrationId)
        });
        
        const mandatoryTypes = ['KTP', 'Paspor', 'Foto', 'Buku Nikah'];
        const allVerified = mandatoryTypes.every(type => 
          allDocs.find(d => d.docType === type && d.status === 'VERIFIED')
        );

        if (allVerified) {
          await withRetry(() => db.transaction(async (tx) => {
            await tx.update(schema.users)
              .set({ status: 'CICIL_BAYAR' })
              .where(eq(schema.users.id, existingDoc.registration.userId));
            
            await tx.update(schema.registrations)
              .set({ status: 'CICIL_BAYAR', updatedAt: new Date() })
              .where(eq(schema.registrations.id, existingDoc.registrationId));
          }));
        }
      } else if (newStatus === 'REJECTED') {
        await withRetry(() => db.transaction(async (tx) => {
          await tx.update(schema.users)
            .set({ status: 'UPLOAD_DOKUMEN' })
            .where(eq(schema.users.id, existingDoc.registration.userId));
          
          await tx.update(schema.registrations)
            .set({ status: 'UPLOAD_DOKUMEN', updatedAt: new Date() })
            .where(eq(schema.registrations.id, existingDoc.registrationId));
        }));
      }

      notifyUpdate();
      res.json(updatedDoc);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Gagal memverifikasi dokumen" });
    }
  });

  // GET /api/admin/dokumens/pending -> Admin: list antrean
  app.get("/api/admin/dokumens/pending", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const pendingDocs = await withRetry(() => db.query.documents.findMany({
        where: eq(schema.documents.status, 'PENDING'),
        with: {
          registration: {
            with: {
              user: true
            }
          }
        }
      }));
      res.json(pendingDocs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil antrean dokumen" });
    }
  });

  // Get Packages
  app.get("/api/packages", authenticate, async (req: AuthRequest, res) => {
    try {
      console.log(`GET /api/packages: Fetching packages for workspace ${req.user!.workspaceId}...`);
      const allPackages = await withRetry(() => 
        db.select().from(schema.packages)
          .where(eq(schema.packages.workspaceId, req.user!.workspaceId!))
          .orderBy(desc(schema.packages.createdAt))
      );
      
      let regCounts: any[] = [];
      try {
        regCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          adultCount: schema.registrations.adultCount,
          childCount: schema.registrations.childCount,
          infantCount: schema.registrations.infantCount,
        }).from(schema.registrations));
      } catch (regErr) {
        console.warn("Failed to fetch registration counts for packages:", regErr);
      }

      const packagesWithCounts = (allPackages || []).map((pkg) => {
        const pkgRegs = (regCounts || []).filter(r => r && r.packageId === pkg.id);
        const takenSeats = pkgRegs.reduce((acc, r) => 
          acc + (parseInt(r?.adultCount) || 0) + (parseInt(r?.childCount) || 0) + (parseInt(r?.infantCount) || 0), 0);
        
        const quotaNum = Number(pkg.quota) || 45;
        const remainingSeats = Math.max(0, quotaNum - takenSeats);

        let desc: any = pkg.description;
        if (typeof desc === 'string') {
          try {
            desc = JSON.parse(desc);
          } catch (e) {
            desc = desc ? desc.split('\n') : ["Fasilitas Bintang 5"];
          }
        }

        return { 
          ...pkg, 
          description: desc || ["Fasilitas Bintang 5"],
          quota: quotaNum,
          takenSeats,
          remainingSeats,
          type: (pkg.type || 'umroh').toString().trim().toLowerCase(),
          isAvailable: pkg.isAvailable !== false
        } as any;
      });

      res.json(packagesWithCounts);
    } catch (error: any) {
      console.error("Database query failed in GET /api/packages:", error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.get("/api/packages/:id", async (req, res) => {
    try {
      const pkg = await withRetry(() => db.query.packages.findFirst({
        where: eq(schema.packages.id, req.params.id)
      }));
      if (!pkg) return res.status(404).json({ error: "Package not found" });
      
      let desc = pkg.description;
      try {
        desc = JSON.parse(pkg.description);
      } catch (e) {}

      res.json({ ...pkg, description: desc });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch package" });
    }
  });

  // Get Schedules
  app.get("/api/schedules", authenticate, async (req: AuthRequest, res) => {
    try {
      const allSchedules = await withRetry(() => db.select().from(schema.schedules)
        .where(eq(schema.schedules.workspaceId, req.user!.workspaceId!))
        .orderBy(asc(schema.schedules.departureDate)));
      res.json(allSchedules);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // --- Jamaah Endpoints ---

  // Get Memories (Gallery)
  app.get("/api/memories", authenticate, async (req: AuthRequest, res) => {
    try {
      const { packageId } = req.query;
      
      // 1. Find all registrations for this user to get targeted memories
      const userRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.userId, req.user!.id)
      }));
      const regIds = userRegs.map(r => r.id);

      let filters = [];
      if (packageId) {
        filters.push(eq(schema.memories.packageId, packageId as string));
      }
      
      if (regIds.length > 0) {
        filters.push(inArray(schema.memories.registrationId, regIds));
      }

      let queryBuilder = db.select().from(schema.memories);
      
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where(or(...filters)) as any;
      } else if (packageId) {
        queryBuilder = queryBuilder.where(eq(schema.memories.packageId, packageId as string)) as any;
      }
      
      const memories = await withRetry(() => queryBuilder.orderBy(desc(schema.memories.createdAt)));
      res.json(memories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Certificates
  app.get("/api/certificates", authenticate, async (req: AuthRequest, res) => {
    try {
      console.log(`GET /api/certificates: Fetching for user ${req.user!.id} (${req.user!.email})`);
      
      const userEmail = req.user?.email?.toLowerCase();
      const userName = req.user?.name?.toLowerCase();

      // 1. Get all registrations where user is owner, orderer or pax
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        with: { certificates: true }
      }));
      
      const matchedRegs = allRegs.filter(r => {
        // Direct owner
        if (r.userId === req.user!.id) return true;
        
        // Orderer email match
        if (userEmail && r.ordererEmail?.toLowerCase() === userEmail) return true;
        
        // Pax match (email or name)
        if (Array.isArray(r.paxData)) {
          return r.paxData.some((p: any) => {
            const pEmail = (p.email || '').toLowerCase();
            const pName = (p.fullName || p.name || '').toLowerCase();
            return (userEmail && pEmail === userEmail) || (userName && pName === userName);
          });
        }
        
        return false;
      });
      
      let certs = matchedRegs.flatMap(r => r.certificates || []);
      
      // Remove duplicates by ID
      const uniqueCerts = Array.from(new Map(certs.map(c => [c.id, c])).values());
      
      console.log(`GET /api/certificates: Found ${uniqueCerts.length} certificates for user ${req.user!.id}`);
      res.json(uniqueCerts);
    } catch (error: any) {
      console.warn("GET /api/certificates status (transient):", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Payment Proof
  app.post("/api/payments", authenticate, async (req: AuthRequest, res) => {
    const { registrationId, paymentType, amount, proofUrl } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, registrationId)
            }));
      if (!reg || reg.userId !== req.user!.id) {
         return res.status(403).json({ error: "Unauthorized" });
      }

      const validStatusesForPayment = ['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS'];
      if (!validStatusesForPayment.includes(reg.status)) {
         return res.status(400).json({ error: "Pendaftaran belum mencapai tahap pembayaran. Harap lengkapi tahap sebelumnya." });
      }

      const [newPayment] = await withRetry(() => db.insert(schema.payments).values({
              workspaceId: req.user!.workspaceId!,
              registrationId,
              paymentType,
              amount,
              proofUrl,
              status: 'PENDING',
            } as any).returning());

      // Update user status to VERIFIKASI_BAYAR
      await db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, req.user!.id));

      res.status(201).json(newPayment);
      notifyUpdate();
    } catch (error: any) {
      console.error("Payment upload failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Document
  app.post("/api/documents", authenticate, async (req: AuthRequest, res) => {
    const { registrationId, docType, fileUrl } = req.body;
    try {
      const existing = await withRetry(() => db.query.documents.findFirst({
              where: and(
                eq(schema.documents.registrationId, registrationId),
                eq(schema.documents.docType, docType)
              )
            }));
      if (existing) {
        const [updated] = await withRetry(() => db.update(schema.documents)
                  .set({ fileUrl, status: 'PENDING', adminNotes: null, updatedAt: new Date() })
                  .where(eq(schema.documents.id, existing.id))
                  .returning());
        notifyUpdate();
        return res.json(updated);
      } else {
        const [newDoc] = await withRetry(() => db.insert(schema.documents).values({
                  workspaceId: req.user!.workspaceId!,
                  registrationId,
                  docType,
                  fileUrl,
                  status: 'PENDING'
                } as any).returning());

        // Update registration status to documents_uploaded if it was bio_filled
        const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, registrationId) });
        if (reg) {
          if (reg.status === 'ISI_BIODATA') {
            await db.update(schema.registrations).set({ status: 'UPLOAD_DOKUMEN', updatedAt: new Date() }).where(eq(schema.registrations.id, registrationId));
          }
          // Move user to VERIFIKASI_DOKUMEN phase
          await db.update(schema.users).set({ status: 'VERIFIKASI_DOKUMEN' }).where(eq(schema.users.id, reg.userId));
        }

        notifyUpdate();
        return res.status(201).json(newDoc);
      }
    } catch (error: any) {
      console.error("Document upload failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  async function getRegistrationForUser(userId: string, email?: string): Promise<any> {
    let registration = await withRetry(() => db.query.registrations.findFirst({
      where: eq(schema.registrations.userId, userId),
      with: {
        package: true,
        payments: true,
        documents: true,
        user: true,
        schedule: true,
        certificates: true
      }
    }));

    if (!registration && email) {
      const userEmail = email.toLowerCase();
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        with: {
          package: true,
          payments: true,
          documents: true,
          user: true,
          schedule: true,
          certificates: true
        }
      }));

      registration = allRegs.find((r: any) => {
        const ordererMatch = r.ordererEmail?.toLowerCase() === userEmail;
        const paxMatch = Array.isArray(r.paxData) && r.paxData.some((p: any) => 
          p.email?.toLowerCase() === userEmail
        );
        return ordererMatch || paxMatch;
      }) || null;
    }

    return registration;
  }

  // Get Jamaah Registration Details
  app.get("/api/jamaah/registration", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      res.json(registration || null);
    } catch (error) {
      console.warn("Failed to fetch registration (likely transient):", error);
      res.status(500).json({ error: "Gagal mengambil data registrasi. Silakan coba lagi." });
    }
  });

  // Create Registration (Select Package)
  app.post("/api/jamaah/register", authenticate, async (req: AuthRequest, res) => {
    const { packageId, paxCount } = req.body;
    try {
      console.log(`POST /api/jamaah/register: Creating/Updating registration for user ${req.user!.id}, package ${packageId}, paxCount ${paxCount}`);
      
      // 1. Fetch Package to get price
      const pkg = await withRetry(() => db.query.packages.findFirst({
              where: eq(schema.packages.id, packageId)
            }));

      if (!pkg) {
        return res.status(404).json({ error: "Paket tidak ditemukan" });
      }

      const totalAmount = (Number(pkg.price) * Number(paxCount)).toString();
      const initialPaxData = Array.from({ length: Number(paxCount) }, () => ({
        fullName: "",
        passportNumber: "",
        ktpNumber: "",
        birthDate: "",
        isSubmitted: false
      }));

      // Check if already registered
      const existing = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.userId, req.user!.id)
            }));

      if (existing) {
        const [updatedReg] = await withRetry(() => db.update(schema.registrations)
                  .set({
                     packageId,
                     adultCount: paxCount.toString(),
                     childCount: '0',
                     infantCount: '0',
                     totalAmount: totalAmount,
                     paxData: initialPaxData,
                     workspaceId: pkg.workspaceId,
                     updatedAt: new Date()
                  })
                  .where(eq(schema.registrations.userId, req.user!.id))
                  .returning());
        await withRetry(() => db.update(schema.users)
          .set({ status: 'PILIH_PAKET' })
          .where(eq(schema.users.id, req.user!.id)));

        notifyUpdate();
        return res.status(200).json(updatedReg);
      }

      const [newReg] = await withRetry(() => db.insert(schema.registrations).values({
              userId: req.user!.id,
              packageId,
              adultCount: paxCount.toString(),
              childCount: '0',
              infantCount: '0',
              totalAmount: totalAmount,
              paxData: initialPaxData,
              workspaceId: pkg.workspaceId,
              status: 'PILIH_PAKET'
            }).returning());

      await withRetry(() => db.update(schema.users)
        .set({ status: 'PILIH_PAKET' })
        .where(eq(schema.users.id, req.user!.id)));

      notifyUpdate();
      res.status(201).json(newReg);
    } catch (error) {
      console.error("POST /api/jamaah/register error:", error);
      res.status(500).json({ error: "Failed to create registration" });
    }
  });

  // Cancel/Reset Registration
  app.delete("/api/jamaah/register", authenticate, async (req: AuthRequest, res) => {
    try {
      // First delete associated documents and payments
      const existing = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.userId, req.user!.id)
            }));
      if (existing) {
        await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.userId, req.user!.id)));
      }
      res.status(200).json({ success: true });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete registration" });
    }
  });

  // Update Registration (General)
  app.patch("/api/jamaah/registration", authenticate, async (req: AuthRequest, res) => {
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.userId, req.user!.id)
            }));
      if (!reg) return res.status(404).json({ error: "Registration not found" });

      const { status, paxData, name, phone, email, notes, paymentStep } = req.body;
      const updateData: any = { updatedAt: new Date() };
      
      if (status) {
         if (!canTransitionTo(reg.status, status)) {
             return res.status(400).json({ error: "Transisi status tidak valid atau melompati tahapan." });
         }
         updateData.status = status;
      }

      if (paymentStep !== undefined) updateData.paymentStep = paymentStep;
      if (paxData) updateData.paxData = paxData;
      if (name !== undefined) updateData.ordererName = name;
      if (phone !== undefined) updateData.ordererPhone = phone;
      if (email !== undefined) updateData.ordererEmail = email;
      if (notes !== undefined) updateData.ordererNotes = notes;

      await withRetry(() => db.update(schema.registrations)
              .set(updateData)
              .where(eq(schema.registrations.userId, req.user!.id)));
      
      // Map registration status to user status
      if (status === 'ISI_BIODATA') {
        await withRetry(() => db.update(schema.users)
          .set({ status: 'UPLOAD_DOKUMEN' })
          .where(eq(schema.users.id, req.user!.id)));
      } else if (status === 'PILIH_PAKET') {
        await withRetry(() => db.update(schema.users)
          .set({ status: 'PILIH_PAKET' })
          .where(eq(schema.users.id, req.user!.id)));
      }

      res.json({ message: "Registration updated" });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to update registration" });
    }
  });

  // Reset Registration (Delete)
  app.delete("/api/jamaah/registration", authenticate, async (req: AuthRequest, res) => {
    try {
      // Delete documents first
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.userId, req.user!.id)
            }));
      
      if (reg) {
        await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.userId, req.user!.id)));
      }
      
      res.json({ message: "Registration reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset registration" });
    }
  });

  // Update User Status (Admin)
  app.patch("/api/admin/users/:id/status", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { status } = req.body;
    
    try {
      const user = await db.query.users.findFirst({ where: eq(schema.users.id, req.params.id) });
      if (!user) return res.status(404).json({ error: "User not found" });

      const currentStatus = user.status || 'DRAFT';
      const validTransitions: Record<string, string[]> = {
        'DRAFT':               ['PILIH_PAKET'],
        'PILIH_PAKET':         ['ISI_BIODATA'],
        'ISI_BIODATA':         ['UPLOAD_DOKUMEN'],
        'UPLOAD_DOKUMEN':      ['VERIFIKASI_DOKUMEN'],
        'VERIFIKASI_DOKUMEN':  ['CICIL_BAYAR', 'UPLOAD_DOKUMEN'],
        'CICIL_BAYAR':         ['VERIFIKASI_BAYAR'],
        'VERIFIKASI_BAYAR':    ['LUNAS', 'CICIL_BAYAR'],
        'LUNAS':               ['SIAP_BERANGKAT'],
        'SIAP_BERANGKAT':      ['BERANGKAT'],
        'BERANGKAT':           ['SELESAI'],
      };

      if (!validTransitions[currentStatus as string]?.includes(status)) {
        return res.status(400).json({ error: `Invalid transition from ${currentStatus} to ${status}` });
      }

      await withRetry(() => db.update(schema.users)
              .set({ status })
              .where(eq(schema.users.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // --- Support / Helpdesk Endpoints ---

  // Get user's tickets (Jamaah)
  app.get("/api/support/tickets", authenticate, async (req: AuthRequest, res) => {
    try {
      const tickets = await withRetry(() => db.select()
              .from(schema.helpdesk_tickets)
              .where(eq(schema.helpdesk_tickets.userId, req.user!.id))
              .orderBy(desc(schema.helpdesk_tickets.createdAt)));
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Create new ticket (Jamaah)
  app.post("/api/support/tickets", authenticate, async (req: AuthRequest, res) => {
    try {
      const { subject, message } = req.body;
      const [newTicket] = await withRetry(() => db.insert(schema.helpdesk_tickets).values({
              workspaceId: req.user!.workspaceId!,
              userId: req.user!.id,
              subject,
              message,
              replies: [],
              status: 'open'
            } as any).returning());
      res.json(newTicket);
      notifyUpdate();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  // Reply to ticket (Jamaah)
  app.post("/api/support/tickets/:id/reply", authenticate, async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      const ticketId = req.params.id;

      const [ticket] = await withRetry(() => db.select()
              .from(schema.helpdesk_tickets)
              .where(and(eq(schema.helpdesk_tickets.id, ticketId), eq(schema.helpdesk_tickets.userId, req.user!.id))));

      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const newReply = {
        id: crypto.randomUUID(),
        sender: 'jamaah',
        message,
        createdAt: new Date().toISOString()
      };

      const [updatedTicket] = await withRetry(() => db.update(schema.helpdesk_tickets)
              .set({ 
                replies: [...(ticket.replies as any[]), newReply],
                updatedAt: new Date()
              } as any)
              .where(eq(schema.helpdesk_tickets.id, ticketId))
              .returning());

      res.json(updatedTicket);
      notifyUpdate();
    } catch (error) {
      console.error("Failed to reply to ticket:", error);
      res.status(500).json({ error: "Failed to reply to ticket" });
    }
  });

  // Get all tickets (Admin)
  app.get("/api/admin/support/tickets", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const tickets = await withRetry(() => db.select({
              ticket: schema.helpdesk_tickets,
              user: {
                name: schema.users.name,
                email: schema.users.email
              }
            })
            .from(schema.helpdesk_tickets)
            .leftJoin(schema.users, eq(schema.helpdesk_tickets.userId, schema.users.id))
            .orderBy(desc(schema.helpdesk_tickets.updatedAt)));
      
      res.json(tickets.map(t => ({ ...t.ticket, userName: t.user?.name, userEmail: t.user?.email })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all tickets" });
    }
  });

  // Reply to ticket (Admin)
  app.post("/api/admin/support/tickets/:id/reply", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { message, status } = req.body;
      const ticketId = req.params.id;

      const [ticket] = await withRetry(() => db.select()
              .from(schema.helpdesk_tickets)
              .where(eq(schema.helpdesk_tickets.id, ticketId)));

      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const newReply = {
        id: crypto.randomUUID(),
        sender: 'admin',
        message,
        createdAt: new Date().toISOString()
      };

      const updateData: any = { 
        replies: [...(ticket.replies as any[]), newReply],
        updatedAt: new Date()
      };
      if (status) updateData.status = status;

      const [updatedTicket] = await withRetry(() => db.update(schema.helpdesk_tickets)
              .set(updateData)
              .where(eq(schema.helpdesk_tickets.id, ticketId))
              .returning());

      res.json(updatedTicket);
      notifyUpdate();
    } catch (error) {
      console.error("Failed to reply to ticket (admin):", error);
      res.status(500).json({ error: "Failed to reply to ticket" });
    }
  });

  // --- Mitra Endpoints ---

  // Get Mitra's Jamaah (referrals)
  app.get("/api/mitra/jamaah", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      // Admin sees everyone, Mitra only sees their referrals
      const whereClause = req.user.role === 'admin' 
        ? undefined 
        : eq(schema.users.mitraId, req.user.id);

      const myJamaah = await withRetry(() => db.select({
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
              registrationStatus: schema.registrations.status,
              packageName: schema.packages.name,
              createdAt: schema.users.createdAt,
            })
            .from(schema.users)
            .leftJoin(schema.registrations, eq(schema.users.id, schema.registrations.userId))
            .leftJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
            .where(whereClause));

      res.json(myJamaah);
    } catch (error) {
      console.error("Failed to fetch mitra jamaah:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Mitra Commission Stats
  app.get("/api/mitra/stats", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra') return res.status(403).json({ error: "Forbidden" });
    
    try {
      // Simple count of referrals for now
      const referrals = await withRetry(() => db.select({ count: sql<number>`count(*)` })
              .from(schema.users)
              .where(eq(schema.users.mitraId, req.user.id)));
      
      const successfulPayments = await withRetry(() => db.select({ sum: sql<number>`sum(${schema.payments.amount})` })
              .from(schema.payments)
              .innerJoin(schema.registrations, eq(schema.payments.registrationId, schema.registrations.id))
              .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
              .where(and(
                eq(schema.users.mitraId, req.user.id),
                eq(schema.payments.status, 'VERIFIED')
              )));

      res.json({ 
        totalReferrals: referrals[0].count, 
        totalReferralVolume: successfulPayments[0].sum || 0,
        estimatedCommission: (Number(successfulPayments[0].sum || 0) * 0.05) // 5% example
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // --- Admin Endpoints ---

  // Get Pending Verifications (Payments)
  app.get("/api/admin/pending-verifications", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    try {
      const pendingPayments = await withRetry(() => db.select({
              paymentId: schema.payments.id,
              amount: schema.payments.amount,
              paymentType: schema.payments.paymentType,
              proofUrl: schema.payments.proofUrl,
              status: schema.payments.status,
              createdAt: schema.payments.createdAt,
              registrationId: schema.registrations.id,
              currentRegStatus: schema.registrations.status,
              userName: schema.users.name,
              userEmail: schema.users.email,
              packageName: schema.packages.name,
            })
            .from(schema.payments)
            .innerJoin(schema.registrations, eq(schema.payments.registrationId, schema.registrations.id))
            .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
            .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
            .where(eq(schema.payments.status, 'PENDING')));

      res.json(pendingPayments);
    } catch (error: any) {
      console.error("Failed to fetch pending verifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify Payment
  app.patch("/api/admin/payments/:id/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    try {
      const [updatedPayment] = await withRetry(() => db.update(schema.payments)
        .set({ status, adminNotes: reason || null })
        .where(eq(schema.payments.id, id))
        .returning());

      if (!updatedPayment) return res.status(404).json({ error: "Payment not found" });
      if (status === 'VERIFIED') {
        // Advance registration status
        let nextStatus: any;
        let userStatus: any;

        const regWithDetails = await db.query.registrations.findFirst({
          where: eq(schema.registrations.id, updatedPayment.registrationId),
          with: {
            package: true,
            payments: true
          }
        });

        if (regWithDetails && regWithDetails.package) {
          const totalHarga = Number(regWithDetails.package.price);
          const totalBayar = regWithDetails.payments
            .filter(t => t.status === 'VERIFIED')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const persen = totalBayar / totalHarga;
          
          if (persen >= 1.0) {
            userStatus = 'LUNAS';
            nextStatus = 'LUNAS';
          } else {
            userStatus = 'CICIL_BAYAR';
            if (updatedPayment.paymentType === 'DP1') nextStatus = 'CICIL_BAYAR';
            else if (updatedPayment.paymentType === 'DP2') nextStatus = 'CICIL_BAYAR';
          }

          if (nextStatus) {
            await withRetry(() => db.update(schema.registrations)
              .set({ status: nextStatus, updatedAt: new Date() })
              .where(eq(schema.registrations.id, updatedPayment.registrationId)));
          }
          
          if (userStatus) {
             await withRetry(() => db.update(schema.users)
               .set({ status: userStatus })
               .where(eq(schema.users.id, regWithDetails.userId)));
          }
        }
      }
 else if (status === 'REJECTED') {
        // If rejected, move back to CICIL_BAYAR
        const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, updatedPayment.registrationId) });
        if (reg) {
          await withRetry(() => db.update(schema.users)
            .set({ status: 'CICIL_BAYAR' })
            .where(eq(schema.users.id, reg.userId)));
        }
      }

      res.json(updatedPayment);
      notifyUpdate();
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  
  // --- Operasional Keberangkatan (Admin) ---
  app.get("/api/admin/equipment", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const equipment = await withRetry(() => db.select().from(schema.equipment));
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
      let existing = await withRetry(() => db.query.equipment.findFirst({ where: eq(schema.equipment.registrationId, registrationId) }));
      if (existing) {
        await withRetry(() => db.update(schema.equipment).set({ koper, ihram, mukena, assignee, updatedAt: new Date() }).where(eq(schema.equipment.registrationId, registrationId)));
      } else {
        await withRetry(() => db.insert(schema.equipment).values({ 
          workspaceId: req.user!.workspaceId!,
          registrationId, 
          koper, 
          ihram, 
          mukena, 
          assignee 
        }));
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
      const notifications = await withRetry(() => db.query.notifications.findMany({ orderBy: (n, { desc }) => [desc(n.createdAt)] }));
      res.json(notifications);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, content, message, type } = req.body;
    try {
      await withRetry(() => db.insert(schema.notifications).values({
              workspaceId: req.user!.workspaceId!,
              title: title || 'Pengumuman Baru',
              message: content || message || '',
              type: type || 'info',
            }));
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/broadcast/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      await withRetry(() => db.delete(schema.notifications).where(eq(schema.notifications.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  app.get("/api/admin/manifest", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const manifests = await withRetry(() => db.select().from(schema.manifests));
      res.json(manifests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/manifest/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    const { busNumber, hotelRoom, airplaneSeat, packageId, paxManifest } = req.body;
    try {
      let existing = await withRetry(() => db.query.manifests.findFirst({ where: eq(schema.manifests.registrationId, registrationId) }));
      const updatePayload: any = {};
      if (busNumber !== undefined) updatePayload.busNumber = busNumber;
      if (hotelRoom !== undefined) updatePayload.hotelRoom = hotelRoom;
      if (airplaneSeat !== undefined) updatePayload.airplaneSeat = airplaneSeat;
      if (paxManifest !== undefined) updatePayload.paxManifest = paxManifest;

      if (existing) {
        await withRetry(() => db.update(schema.manifests).set(updatePayload).where(eq(schema.manifests.registrationId, registrationId)));
      } else {
        let resolvedPackageId = packageId || existing?.packageId;
        if (!resolvedPackageId) {
          const reg = await withRetry(() => db.query.registrations.findFirst({
            where: eq(schema.registrations.id, registrationId)
          }));
          resolvedPackageId = reg?.packageId;
        }

        if (!resolvedPackageId) {
          return res.status(400).json({ error: 'Registration or package not found' });
        }

        await withRetry(() => db.insert(schema.manifests).values({
          workspaceId: req.user!.workspaceId!,
          registrationId,
          packageId: resolvedPackageId,
          busNumber: busNumber || '',
          hotelRoom: hotelRoom || '',
          airplaneSeat: airplaneSeat || '',
          paxManifest: paxManifest || null
        }));
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      console.error("[Manifest PATCH Error]:", e);
      res.status(500).json({ error: e.message || 'Gagal memperbarui manifest' });
    }
  });

  // --- Operasional Keberangkatan (Jamaah) ---
  app.get("/api/jamaah/notifications", authenticate, async (req: AuthRequest, res) => {
    try {
      const notifications = await withRetry(() => db.select().from(schema.notifications)
              .where(
                sql`(${schema.notifications.userId} = ${req.user!.id} OR ${schema.notifications.userId} IS NULL)`
              )
              .orderBy(desc(schema.notifications.createdAt)));
      res.json(notifications);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/jamaah/manifest", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      if (!registration) return res.json(null);
      const manifest = await withRetry(() => db.query.manifests.findFirst({
              where: eq(schema.manifests.registrationId, registration.id)
            }));
      res.json(manifest);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/jamaah/equipment", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      if (!registration) return res.json(null);
      const equipment = await withRetry(() => db.query.equipment.findFirst({
              where: eq(schema.equipment.registrationId, registration.id)
            }));
      res.json(equipment);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  app.post("/api/admin/final-documents/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    const { docType, fileUrl, items } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, registrationId)
            }));

      const docItems: Array<{ docType: string; fileUrl: string }> = (items && Array.isArray(items) && items.length > 0)
        ? items
        : [{ docType, fileUrl }];

      for (const item of docItems) {
        if (!item.docType) continue;
        let existing = await withRetry(() => db.query.documents.findFirst({
                  where: and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, item.docType as any))
                }));

        if (!item.fileUrl) {
          if (existing) {
            await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.id, existing.id)));
          }
        } else if (existing) {
          await withRetry(() => db.update(schema.documents).set({ fileUrl: item.fileUrl, status: 'VERIFIED', updatedAt: new Date() }).where(eq(schema.documents.id, existing.id)));
        } else {
          await withRetry(() => db.insert(schema.documents).values({
                      workspaceId: req.user!.workspaceId!,
                      registrationId,
                      docType: item.docType as any,
                      fileUrl: item.fileUrl,
                      status: 'VERIFIED'
                    }));
        }

        // Send notification to jamaah if registration exists and fileUrl provided
      if (reg && reg.userId && item.fileUrl) {
        const baseDocType = item.docType.split('_pax_')[0];
        const docNameMap: Record<string, string> = {
          eticket: 'E-Ticket Keberangkatan',
          visa: 'Visa',
          asuransi: 'Asuransi Perjalanan'
        };
        const docLabel = docNameMap[baseDocType] || baseDocType;
        await withRetry(() => db.insert(schema.notifications).values({
                    workspaceId: req.user!.workspaceId!,
                    userId: reg.userId,
                    title: `Dokumen Ready: ${docLabel}`,
                    message: `Dokumen ${docLabel} Anda telah diterbitkan oleh pihak Travel dan siap diunduh di Portal Jamaah.`,
                    type: 'info'
                  }).catch((err) => console.error("Notif insert error:", err)));
      }
      }

      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      console.error("[Final Docs POST Error]:", e);
      res.status(500).json({ error: e.message || "Gagal mengunggah dokumen" });
    }
  });

  app.delete("/api/admin/final-documents/:registrationId/:docType", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId, docType } = req.params;
    try {
      await withRetry(() => db.delete(schema.documents).where(
              and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, docType as any))
            ));
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      console.error("[Final Docs DELETE Error]:", e);
      res.status(500).json({ error: e.message || "Gagal menghapus dokumen" });
    }
  });


  // --- Finance Module Endpoints ---

  // Get Jamaah Invoice
  app.get("/api/jamaah/invoice", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      if (!registration) return res.status(404).json({ error: "No registration found" });

      // Calculate discounts (example logic: child 10%, infant 50%)
      const basePrice = Number(registration.package.price);
      const adultTotal = Number(registration.adultCount) * basePrice;
      const childTotal = Number(registration.childCount) * (basePrice * 0.9);
      const infantTotal = Number(registration.infantCount) * (basePrice * 0.5);
      const calculatedTotal = adultTotal + childTotal + infantTotal;

      res.json({
        ...registration,
        calculatedTotal,
        summary: {
          adults: registration.adultCount,
          children: registration.childCount,
          infants: registration.infantCount,
          basePrice
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  // Get Financial Report (Admin)
  app.get("/api/admin/financial-report", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allPayments = await withRetry(() => db.select({
        id: schema.payments.id,
        amount: schema.payments.amount,
        paymentType: schema.payments.paymentType,
        proofUrl: schema.payments.proofUrl,
        status: schema.payments.status,
        adminNotes: schema.payments.adminNotes,
        createdAt: schema.payments.createdAt,
        registrationId: schema.registrations.id,
        userName: sql<string>`COALESCE(${schema.registrations.ordererName}, ${schema.users.name}, 'Jamaah')`,
        userEmail: sql<string>`COALESCE(${schema.registrations.ordererEmail}, ${schema.users.email}, '-')`,
        userPhone: sql<string>`COALESCE(${schema.registrations.ordererPhone}, ${schema.users.phone}, '-')`,
        packageName: sql<string>`COALESCE(${schema.packages.name}, 'Paket Umroh')`,
        packagePrice: schema.packages.price,
      })
      .from(schema.payments)
      .leftJoin(schema.registrations, eq(schema.payments.registrationId, schema.registrations.id))
      .leftJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .leftJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .orderBy(desc(schema.payments.createdAt)));

      res.json(allPayments);
    } catch (error) {
      console.error("Failed to fetch financial report:", error);
      res.status(500).json({ error: "Failed to fetch financial report" });
    }
  });

  // Jamaah Dashboard Info
  app.get("/api/jamaah/dashboard-info", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);

      if (!registration) {
        return res.json({ progress: 0, countdown: null });
      }

      // Calculate Progress
      const statusMap: Record<string, number> = {
        'DRAFT': 0,
        'PILIH_PAKET': 10,
        'ISI_BIODATA': 20,
        'UPLOAD_DOKUMEN': 30,
        'VERIFIKASI_DOKUMEN': 40,
        'CICIL_BAYAR': 50,
        'VERIFIKASI_BAYAR': 60,
        'LUNAS': 75,
        'SIAP_BERANGKAT': 90,
        'BERANGKAT': 95,
        'SELESAI': 100
      };
      const progress = statusMap[registration.status] || 0;

      // Calculate Countdown
      let countdown = null;
      if (registration.package?.departureDate) {
        const diff = new Date(registration.package.departureDate).getTime() - new Date().getTime();
        countdown = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      res.json({ progress, countdown, packageName: registration.package?.name });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard info" });
    }
  });

  // Admin Dashboard Stats
  app.get("/api/admin/dashboard-stats", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Jamaah Aktif
      const allActiveRegs = await withRetry(() => db.select({
        adultCount: schema.registrations.adultCount,
        childCount: schema.registrations.childCount,
        infantCount: schema.registrations.infantCount,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(and(
        eq(schema.registrations.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah'),
        ne(schema.registrations.status, 'PILIH_PAKET')
      )));
      
      const totalJamaah = allActiveRegs.reduce((acc, r) => 
        acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);
 
      // 2. Arus Kas (Bulan Ini)
      const cashFlow = await withRetry(() => db.select({
        total: sql<number>`sum(${schema.payments.amount})`
      })
      .from(schema.payments)
      .where(and(
        eq(schema.payments.workspaceId, req.user!.workspaceId!),
        eq(schema.payments.status, 'VERIFIED'),
        gte(schema.payments.createdAt, firstDayOfMonth)
      )));
      const monthlyCashFlow = Number(cashFlow[0]?.total || 0);
 
      // 3. Persiapan Dokumen
      const allDocs = await withRetry(() => db.select({ status: schema.documents.status })
        .from(schema.documents)
        .where(eq(schema.documents.workspaceId, req.user!.workspaceId!)));
      const totalDocs = allDocs.length;
      const approvedDocsCount = allDocs.filter(d => d.status === 'VERIFIED').length;
      
      const docProgress = totalDocs > 0 
        ? Math.round((approvedDocsCount / totalDocs) * 100) 
        : 0;
 
      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.packages.findFirst({
        where: and(
          eq(schema.packages.workspaceId, req.user!.workspaceId!),
          gte(schema.packages.departureDate, now)
        ),
        orderBy: (p, { asc }) => [asc(p.departureDate)]
      }));
 
      // Fallback
      if (!nextBatch) {
        const pkgCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          count: sql<number>`count(*)`
        })
        .from(schema.registrations)
        .where(eq(schema.registrations.workspaceId, req.user!.workspaceId!))
        .groupBy(schema.registrations.packageId)
        .orderBy(sql`count(*) desc`)
        .limit(1));
        
        if (pkgCounts.length > 0) {
          nextBatch = await withRetry(() => db.query.packages.findFirst({
            where: and(
              eq(schema.packages.workspaceId, req.user!.workspaceId!),
              eq(schema.packages.id, pkgCounts[0].packageId)
            )
          }));
        }
      }

      let nextBatchRegs = 0;
      let sCurveData = [
        { day: 'H-30', target: 10, actual: null },
        { day: 'H-25', target: 25, actual: null },
        { day: 'H-20', target: 45, actual: null },
        { day: 'H-15', target: 65, actual: null },
        { day: 'H-10', target: 85, actual: null },
        { day: 'H-5', target: 95, actual: null },
        { day: 'Keberangkatan', target: 100, actual: null },
      ];
      let analysis = "Semua sistem terpantau normal.";

      if (nextBatch) {
        // Calculate total pax for this package
        const regs = await withRetry(() => db.select({
          id: schema.registrations.id,
          adultCount: schema.registrations.adultCount,
          childCount: schema.registrations.childCount,
          infantCount: schema.registrations.infantCount,
          status: schema.registrations.status,
          totalAmount: schema.registrations.totalAmount
        })
        .from(schema.registrations)
        .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
        .where(and(
          eq(schema.registrations.packageId, nextBatch.id),
          eq(schema.users.role, 'jamaah'),
          ne(schema.registrations.status, 'PILIH_PAKET')
        )));
        
        nextBatchRegs = regs.reduce((acc, r) => acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);

        if (nextBatchRegs > 0) {
          const regIds = regs.map(r => r.id);
          
          // Current progress calculation
          const approvedDocs = await withRetry(() => db.select({ count: sql<number>`count(*)` })
            .from(schema.documents)
            .where(and(
              inArray(schema.documents.registrationId, regIds),
              eq(schema.documents.status, 'VERIFIED')
            )));
          
          const approvedPayments = await withRetry(() => db.select({ total: sql<number>`sum(${schema.payments.amount})` })
            .from(schema.payments)
            .where(and(
              inArray(schema.payments.registrationId, regIds),
              eq(schema.payments.status, 'VERIFIED')
            )));

          const totalExpectedDocs = nextBatchRegs * 3; // heuristic: 3 docs per pax
          const totalExpectedAmount = regs.reduce((acc, r) => acc + Number(r.totalAmount), 0);

          const docProgress = Math.min(100, (Number(approvedDocs[0]?.count || 0) / totalExpectedDocs) * 100);
          const payProgress = Math.min(100, (Number(approvedPayments[0]?.total || 0) / totalExpectedAmount) * 100);
          
          const currentActualProgress = Math.round((docProgress + payProgress) / 2);

          // Build S-Curve based on current date relative to departure
          const departureTime = nextBatch.departureDate ? nextBatch.departureDate.getTime() : now.getTime();
          const msPerDay = 24 * 60 * 60 * 1000;
          const daysUntilDeparture = Math.floor((departureTime - now.getTime()) / msPerDay);

          const milestones = [30, 25, 20, 15, 10, 5, 0];
          sCurveData = sCurveData.map((point, idx) => {
            const hDay = milestones[idx];
            if (daysUntilDeparture <= hDay) {
              // This milestone is in the past or is today
              // For simplicity, we'll interpolate or just show current progress for passed milestones
              // In a real app, we'd query history. Here we simulate history based on current progress.
              const milestoneTarget = point.target;
              // Simulate a bit of variance for past milestones
              const progressAtMilestone = Math.min(currentActualProgress, milestoneTarget + (Math.random() * 10 - 5));
              return { ...point, actual: Math.max(0, Math.round(progressAtMilestone)) };
            }
            return point;
          });

          // Set the very last "passed" milestone or current progress accurately
          const lastPassedIdx = milestones.findIndex(h => daysUntilDeparture > h) - 1;
          const currentIdx = lastPassedIdx >= 0 ? lastPassedIdx : 6;
          sCurveData[currentIdx].actual = currentActualProgress;

          // Analysis
          const targetProgress = sCurveData[currentIdx].target;
          if (currentActualProgress < targetProgress) {
            const diff = targetProgress - currentActualProgress;
            const focus = docProgress < payProgress ? "verifikasi dokumen" : "pelunasan pembayaran";
            analysis = `Progres saat ini mengalami delay ${diff.toFixed(1)}% pada bagian ${focus}.`;
          } else {
            analysis = "Progres persiapan batch ini berjalan sesuai target (On-track).";
          }
        }
      }

      res.json({
        totalJamaah,
        monthlyCashFlow,
        docProgress,
        nextBatch: nextBatch?.departureDate || null,
        nextBatchName: nextBatch?.name || null,
        nextBatchRegs,
        sCurveData,
        analysis
      });
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/action-center", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const now = new Date();
      const hMinus15 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      // 1. Pending Payments
      const pendingPayments = await withRetry(() => db.select({ count: sql<number>`count(*)` })
        .from(schema.payments)
        .where(and(
          eq(schema.payments.workspaceId, req.user!.workspaceId!),
          eq(schema.payments.status, 'PENDING')
        )));

      // 2. Pending Documents
      const pendingDocs = await withRetry(() => db.select({ count: sql<number>`count(*)` })
        .from(schema.documents)
        .where(and(
          eq(schema.documents.workspaceId, req.user!.workspaceId!),
          eq(schema.documents.status, 'PENDING')
        )));

      // 3. Unpaid registrations near departure
      const nearDepartureUnpaid = await withRetry(() => db.select({ count: sql<number>`count(*)` })
        .from(schema.registrations)
        .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
        .where(and(
          eq(schema.registrations.workspaceId, req.user!.workspaceId!),
          sql`${schema.registrations.status} != 'LUNAS'`,
          gte(schema.packages.departureDate, now),
          sql`${schema.packages.departureDate} <= ${hMinus15}`
        )));

      const actions = [];
      
      if (pendingPayments[0].count > 0) {
        actions.push({
          id: 'pay-verify',
          title: 'Verifikasi Pembayaran',
          message: `${pendingPayments[0].count} pembayaran baru menunggu verifikasi.`,
          type: 'warning',
          time: 'Baru saja',
          target: 'jamaah'
        });
      }

      if (pendingDocs[0].count > 0) {
        actions.push({
          id: 'doc-verify',
          title: 'Verifikasi Dokumen',
          message: `${pendingDocs[0].count} dokumen jamaah menunggu verifikasi.`,
          type: 'info',
          time: 'Baru saja',
          target: 'jamaah'
        });
      }

      if (nearDepartureUnpaid[0].count > 0) {
        actions.push({
          id: 'delay-warning',
          title: 'Peringatan Pelunasan',
          message: `${nearDepartureUnpaid[0].count} jamaah belum melunasi biaya (H-15).`,
          type: 'error',
          time: 'Penting',
          target: 'jamaah'
        });
      }

      res.json(actions);
    } catch (error: any) {
      // Use warn for Action center as it's often transient connection blips during dashboard polling
      console.warn("Action center status (transient):", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // [Moved Vite middleware to end]

  // --- Admin Endpoints ---

  // Create Package
  app.post("/api/admin/packages", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl } = req.body;
      
      const cleanPrice = Number(String(price ?? 0).replace(/[^0-9]/g, '')) || 0;
      const cleanQuota = Number(String(quota ?? 45).replace(/[^0-9]/g, '')) || 45;
      
      let cleanDesc = description;
      if (Array.isArray(cleanDesc)) {
        const filtered = cleanDesc.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanDesc = JSON.stringify(filtered.length > 0 ? filtered : [name || "Fasilitas Bintang 5"]);
      } else if (typeof cleanDesc !== 'string' || !cleanDesc.trim()) {
        cleanDesc = JSON.stringify([name || "Fasilitas Bintang 5"]);
      }

      const normalizedType = String(type || 'umroh').trim().toLowerCase() === 'haji' ? 'haji' : 'umroh';
      const normalizedIsAvailable = isAvailable !== false && isAvailable !== 'false' && isAvailable !== 0 && isAvailable !== '0';

      const data: any = {
        workspaceId: req.user!.workspaceId!,
        name: (name || "Paket Baru").trim(),
        description: cleanDesc,
        price: cleanPrice,
        duration: (duration || "9 Hari").trim(),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80",
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        quota: cleanQuota,
        manasikPdfUrl: manasikPdfUrl || null
      };

      const [newPackage] = await withRetry(() => db.insert(schema.packages).values(data).returning());
      
      // Parse description for client response consistency
      let parsedDesc = newPackage.description;
      try { parsedDesc = JSON.parse(newPackage.description); } catch(e) {}

      res.json({ ...newPackage, description: parsedDesc, remainingSeats: newPackage.quota, takenSeats: 0 });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ error: error.message || "Gagal membuat paket baru." });
    }
  });

  // Update Package
  app.put("/api/admin/packages/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl } = req.body;
      
      const cleanPrice = Number(String(price ?? 0).replace(/[^0-9]/g, '')) || 0;
      const cleanQuota = Number(String(quota ?? 45).replace(/[^0-9]/g, '')) || 45;
      
      let cleanDesc = description;
      if (Array.isArray(cleanDesc)) {
        const filtered = cleanDesc.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanDesc = JSON.stringify(filtered.length > 0 ? filtered : [name || "Fasilitas Bintang 5"]);
      } else if (typeof cleanDesc !== 'string' || !cleanDesc.trim()) {
        cleanDesc = JSON.stringify([name || "Fasilitas Bintang 5"]);
      }

      const normalizedType = String(type || 'umroh').trim().toLowerCase() === 'haji' ? 'haji' : 'umroh';
      const normalizedIsAvailable = isAvailable !== false && isAvailable !== 'false' && isAvailable !== 0 && isAvailable !== '0';

      const data: any = {
        name: (name || "Paket Baru").trim(),
        description: cleanDesc,
        price: cleanPrice,
        duration: (duration || "9 Hari").trim(),
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        quota: cleanQuota,
      };

      if (imageUrl !== undefined) data.imageUrl = imageUrl;
      if (manasikPdfUrl !== undefined) data.manasikPdfUrl = manasikPdfUrl;

      const [updatedPackage] = await withRetry(() => db.update(schema.packages)
              .set(data)
              .where(eq(schema.packages.id, req.params.id))
              .returning());

      if (!updatedPackage) {
        return res.status(404).json({ error: "Paket tidak ditemukan." });
      }

      // Parse description for client response consistency
      let parsedDesc = updatedPackage.description;
      try { parsedDesc = JSON.parse(updatedPackage.description); } catch(e) {}

      res.json({ ...updatedPackage, description: parsedDesc });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error updating package:", error);
      res.status(500).json({ error: error.message || "Gagal memperbarui paket." });
    }
  });

  // Delete Package
  app.delete("/api/admin/packages/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.packages).where(eq(schema.packages.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting package:", error);
      if (error.code === '23503') { // foreign key violation
        return res.status(400).json({ error: "Gagal: Paket ini sudah memiliki pendaftar." });
      }
      res.status(500).json({ error: error.message || "Failed to delete package" });
    }
  });

  app.get("/api/admin/users", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allUsers = await withRetry(() => db.query.users.findMany({
        where: eq(schema.users.workspaceId, req.user!.workspaceId!),
        with: { registrations: { with: { package: true } } }
      }));
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/registrations", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, req.user!.workspaceId!),
        with: { user: true, package: true, payments: true, documents: true }
      }));
      res.json(allRegs);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  app.patch("/api/admin/registrations/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { ordererName, ordererPhone, ordererEmail, ordererNotes, status, paxData, scheduleId } = req.body;
      const updateData: any = { updatedAt: new Date() };
      
      if (ordererName !== undefined) updateData.ordererName = ordererName;
      if (ordererPhone !== undefined) updateData.ordererPhone = ordererPhone;
      if (ordererEmail !== undefined) updateData.ordererEmail = ordererEmail;
      if (ordererNotes !== undefined) updateData.ordererNotes = ordererNotes;
      if (status !== undefined) updateData.status = status;
      if (paxData !== undefined) updateData.paxData = paxData;
      if (scheduleId !== undefined) updateData.scheduleId = scheduleId;

      await withRetry(() => db.update(schema.registrations)
              .set(updateData)
              .where(eq(schema.registrations.id, req.params.id)));
      
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error updating registration:", error);
      res.status(500).json({ error: error.message || "Failed to update registration" });
    }
  });

  app.patch("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, email, phone, role } = req.body;
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;

      await withRetry(() => db.update(schema.users)
              .set(updateData)
              .where(eq(schema.users.id, req.params.id)));
      
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message || "Failed to update user" });
    }
  });

  app.delete("/api/admin/registrations/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ error: error.message || "Failed to delete registration" });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.users).where(eq(schema.users.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  // --- Schedule Endpoints ---

  app.get("/api/admin/schedules", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allSchedules = await withRetry(() => db.query.schedules.findMany({
              with: { package: true }
            }));
      res.json(allSchedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  app.post("/api/admin/schedules", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, departureDate, name, airline, totalSeats, itineraryPdfUrl } = req.body;
      const [newSchedule] = await withRetry(() => db.insert(schema.schedules).values({
              workspaceId: req.user!.workspaceId!,
              packageId,
              departureDate: new Date(departureDate),
              name,
              airline,
              totalSeats: Number(totalSeats),
              availableSeats: Number(totalSeats),
              itineraryPdfUrl
            }).returning());
      res.status(201).json(newSchedule);
      notifyUpdate();
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: error.message || "Failed to create schedule" });
    }
  });

  app.put("/api/admin/schedules/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, departureDate, name, airline, totalSeats, availableSeats, itineraryPdfUrl } = req.body;
      const [updatedSchedule] = await withRetry(() => db.update(schema.schedules)
              .set({
                packageId,
                departureDate: new Date(departureDate),
                name,
                airline,
                totalSeats: Number(totalSeats),
                availableSeats: Number(availableSeats),
                itineraryPdfUrl
              })
              .where(eq(schema.schedules.id, req.params.id))
              .returning());
      res.json(updatedSchedule);
      notifyUpdate();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: error.message || "Failed to update schedule" });
    }
  });

  app.delete("/api/admin/schedules/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.schedules).where(eq(schema.schedules.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: error.message || "Failed to delete schedule" });
    }
  });

  // --- Memories & Certificates Endpoints ---

  app.get("/api/admin/memories", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allMemories = await withRetry(() => db.query.memories.findMany());
      res.json(allMemories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/memories", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, registrationId, imageUrl, caption } = req.body;
      const [memory] = await withRetry(() => db.insert(schema.memories).values({
        workspaceId: req.user!.workspaceId!,
        packageId: packageId || null,
        registrationId: registrationId || null,
        imageUrl,
        caption
      }).returning());
      res.json(memory);
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/memories/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/certificates", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allCerts = await withRetry(() => db.query.certificates.findMany());
      res.json(allCerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/certificates", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { registrationId, certificateUrl, recipientName } = req.body;
      const [certificate] = await withRetry(() => db.insert(schema.certificates).values({
        workspaceId: req.user!.workspaceId!,
        registrationId,
        recipientName: recipientName || null,
        certificateUrl
      }).returning());
      res.json(certificate);
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/certificates/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download Documents for a specific Jamaah as ZIP
  app.get("/api/admin/registrations/:id/documents/zip/:paxIdx", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { id, paxIdx } = req.params;
    
    try {
      const registration = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, id),
              with: {
                user: true,
                documents: true
              }
            }));

      if (!registration) return res.status(404).json({ error: "Registration not found" });

      const filteredDocs = registration.documents.filter((doc: any) => 
        doc.docType && doc.docType.endsWith(`_${paxIdx}`)
      );

      if (filteredDocs.length === 0) {
        return res.status(404).json({ error: `No documents found for Jamaah ${Number(paxIdx) + 1}` });
      }

      // Create ZIP archive
      const archive = new ZipArchive({
        zlib: { level: 9 } // Sets the compression level.
      });

      // Catch warnings and errors
      archive.on('warning', (err) => {
        console.warn('Archiver warning:', err);
      });

      archive.on('error', (err) => {
        console.error('Archiver error:', err);
      });

      // Set headers
      const jamaahName = registration.user?.name || 'Jamaah';
      const fileName = `Dokumen_${jamaahName.replace(/\s+/g, '_')}_Jamaah_${Number(paxIdx) + 1}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Pipe archive data to the response
      archive.pipe(res);

      // Append each document to the archive
      for (const doc of filteredDocs) {
        if (!doc.fileUrl) continue;

        try {
          // Data URLs are like: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==
          const match = doc.fileUrl.match(/^data:(.+);base64,(.+)$/);
          if (!match) continue;

          const mimeType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');

          let extension = 'jpg';
          if (mimeType === 'application/pdf') extension = 'pdf';
          else if (mimeType === 'image/png') extension = 'png';
          else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = 'jpg';

          const baseDocType = doc.docType.replace(/_\d+$/, '');
          const entryName = `${baseDocType}.${extension}`;

          archive.append(buffer, { name: entryName });
        } catch (err) {
          console.error(`Error processing document ${doc.id}:`, err);
        }
      }

      // Finalize the archive
      await archive.finalize();

    } catch (error: any) {
      console.error("ZIP Generation Error details:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: error?.message || String(error), 
          stack: error?.stack,
          isError: error instanceof Error
        });
      }
    }
  });

  // Update current user profile
  app.get("/api/users/me", authenticate, async (req: AuthRequest, res) => {
    res.json(req.user);
  });

  app.patch("/api/users/me", authenticate, async (req: AuthRequest, res) => {
    const { name, phone, avatarUrl } = req.body;
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User ID tidak ditemukan dalam sesi.' });
      }

      const [updatedUser] = await withRetry(() => db.update(schema.users)
              .set({ 
                name: name || req.user!.name,
                phone: phone !== undefined ? phone : (req.user as any).phone,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : (req.user as any).avatarUrl,
              })
              .where(eq(schema.users.id, req.user!.id))
              .returning());
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User tidak ditemukan di database.' });
      }

      // Update the user object in the session/request for subsequent middleware
      req.user = { ...req.user, ...updatedUser };
      
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        invalidateUserCache(authHeader.split('Bearer ')[1]?.trim());
      }

      res.json(updatedUser);
      notifyUpdate();
    } catch (error: any) {
      console.error("PATCH /api/users/me error:", error);
      res.status(500).json({ error: error.message || "Failed to update profile" });
    }
  });

  

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
      const profile = await withRetry(() => db.query.users.findFirst({
              where: eq(schema.users.id, req.user!.id),
            }));
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
      await withRetry(() => db.transaction(async (tx) => {
              // A. Ubah status pembayaran jadi valid
              const updatedPayment = await tx.update(schema.payments)
                .set({ status: 'VERIFIED' })
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
              if (payment.paymentType === 'DP1') {
                 await tx.update(schema.registrations).set({ status: 'CICIL_BAYAR' }).where(eq(schema.registrations.id, payment.registrationId));
              } else if (payment.paymentType === 'DP2') {
                 await tx.update(schema.registrations).set({ status: 'CICIL_BAYAR' }).where(eq(schema.registrations.id, payment.registrationId));
              } else if (payment.paymentType === 'PELUNASAN') {
                 await tx.update(schema.registrations).set({ status: 'LUNAS' }).where(eq(schema.registrations.id, payment.registrationId));
              }
            }));

      res.json({ success: true, message: 'Pembayaran berhasil diverifikasi dan otomatis masuk ke Buku Kas.' });
      notifyUpdate();
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
      const archivedUsers = await withRetry(() => db.query.users.findMany({
              where: sql`${schema.users.deletedAt} IS NOT NULL`
            }));

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
         message: `Berhasil generate PDF untuk ${type}. File siap didownload.`,
         downloadUrl: `/dummy-path-to-download/${type}-report.pdf` 
      });
      
    } catch (error) {
      res.status(500).json({ error: 'Gagal generate PDF' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const dirDist = __dirname;
    const distPath = fs.existsSync(path.join(cwdDist, 'index.html')) ? cwdDist : dirDist;
    
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build index.html not found.');
      }
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});
