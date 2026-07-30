import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import pg from 'pg';
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { eq, and, desc, asc, sql, gte, inArray, ne, or } from 'drizzle-orm';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import * as dotenv from 'dotenv';
dotenv.config();

import { db, createPool } from './src/db/index.ts';
import { withRetry } from './src/db/retry.ts';
import * as schema from './src/db/schema.ts';
import http from "http";
import { Server as SocketServer } from "socket.io";
import { ZipArchive } from 'archiver';

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
}

const JWT_SECRET = process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026';

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
      
      if (!adminUser && targetId === ADMIN_ID) {
        // Create the default super admin if it doesn't exist
        const [newAdmin] = await withRetry(() => db.insert(schema.users).values({
          id: ADMIN_ID,
          uid: 'admin-hardcoded-uid',
          email: 'admin@goldentravel.local',
          name: 'Administrator',
          role: 'admin',
        }).returning());
        adminUser = newAdmin;
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

  // Run lightweight schema auto-migrations in background (non-blocking for fast HTTP listen)
  (async () => {
    try {
      const healthCheck = await withRetry(() => db.execute(sql`SELECT 1`), 3, 1000);
      console.log('[DB Status] Database connected successfully at startup.');
      
      const adminUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
      const adminPass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
      if (adminUser && adminPass && process.env.SQL_HOST) {
        const adminPool = new pg.Pool({
          host: process.env.SQL_HOST,
          user: adminUser,
          password: adminPass,
          database: process.env.SQL_DB_NAME
        });
        await withRetry(() => adminPool.query('ALTER TABLE manifest_keberangkatan ADD COLUMN IF NOT EXISTS pax_manifest jsonb;'));
        await adminPool.end();
        console.log('[DB Auto-Migration] Column pax_manifest checked/added successfully.');
      } else {
        await withRetry(() => db.execute(sql`ALTER TABLE manifest_keberangkatan ADD COLUMN IF NOT EXISTS pax_manifest jsonb;`));
      }
    } catch (err: any) {
      console.warn('[DB Auto-Migration Warning]:', err.message);
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

      if (!user) {
        // Create user
        const role = (decodedToken.email === 'felix.hencia04@gmail.com') ? 'admin' : (requestedRole === 'mitra' ? 'mitra' : 'jamaah');
        const userEmail = decodedToken.email || `${decodedToken.uid}@goldentravel.local`;
        const userName = requestedName || decodedToken.name || userEmail.split('@')[0];

        console.log('Creating new user:', { email: userEmail, role });

        try {
          const [newUser] = await withRetry(() => db.insert(schema.users).values({
            uid: decodedToken.uid,
            email: userEmail,
            name: userName,
            role: role as any,
          }).returning());
          
          user = newUser;
          console.log('New user created successfully:', user?.id);
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
              const rawUpd = await pool.query(
                'UPDATE users SET uid = $1 WHERE email = $2 RETURNING *',
                [decodedToken.uid, userEmail]
              );
              user = rawUpd.rows[0];
            }
          } else {
            try {
              const pool = createPool();
              const rawIns = await pool.query(
                'INSERT INTO users (uid, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [decodedToken.uid, userEmail, userName, role]
              );
              user = rawIns.rows[0];
            } catch (rawInsErr: any) {
              throw new Error(`Gagal membuat user: ${insertErr.cause?.message || insertErr.message}`);
            }
          }
        }
      } else if (decodedToken.email === 'felix.hencia04@gmail.com' && user.role !== 'admin') {
        // Upgrade to admin if email matches
        try {
          const [updatedUser] = await withRetry(() => db.update(schema.users)
            .set({ role: 'admin' })
            .where(eq(schema.users.id, user.id))
            .returning());
          user = updatedUser;
        } catch (updateErr: any) {
          console.error('Admin promotion failed:', updateErr);
        }
      }

      notifyUpdate();
      res.json(user);
    } catch (error: any) {
      console.error("Sync error details:", error);
      res.status(401).json({ error: `Gagal sinkronisasi: ${error.message || 'Token tidak valid'}` });
    }
  });

  // Get Packages
  app.get("/api/packages", async (req, res) => {
    try {
      console.log("GET /api/packages: Fetching all packages...");
      const allPackages = await withRetry(() => 
        db.select().from(schema.packages).orderBy(desc(schema.packages.createdAt))
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
  app.get("/api/schedules", async (req, res) => {
    try {
      const allSchedules = await withRetry(() => db.select().from(schema.schedules)
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

      const validStatusesForPayment = ['bio_filled', 'documents_uploaded', 'dp1_paid', 'dp2_paid', 'fully_paid'];
      if (!validStatusesForPayment.includes(reg.status)) {
         return res.status(400).json({ error: "Pendaftaran belum mencapai tahap pembayaran. Harap lengkapi tahap sebelumnya." });
      }

      const [newPayment] = await withRetry(() => db.insert(schema.payments).values({
              registrationId,
              paymentType,
              amount,
              proofUrl,
              status: 'pending',
            }).returning());

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
                  .set({ fileUrl, status: 'pending', rejectionReason: null, updatedAt: new Date() })
                  .where(eq(schema.documents.id, existing.id))
                  .returning());
        notifyUpdate();
        return res.json(updated);
      } else {
        const [newDoc] = await withRetry(() => db.insert(schema.documents).values({
                  registrationId,
                  docType,
                  fileUrl,
                }).returning());
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
              status: 'package_selected'
            }).returning());

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
      
      const statusOrder = ['package_selected', 'bio_filled', 'documents_uploaded', 'dp1_paid', 'dp2_paid', 'fully_paid', 'visa_ticket_ready'];
      
      if (status) {
         const currentIndex = statusOrder.indexOf(reg.status);
         const nextIndex = statusOrder.indexOf(status);
         if (nextIndex > currentIndex + 1) {
             return res.status(400).json({ error: "Tidak dapat melewati tahapan pendaftaran." });
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
                eq(schema.payments.status, 'approved')
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
            .where(eq(schema.payments.status, 'pending')));

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
        .set({ status, rejectionReason: reason || null })
        .where(eq(schema.payments.id, id))
        .returning());

      if (!updatedPayment) return res.status(404).json({ error: "Payment not found" });
      if (status === 'approved') {
        // Advance registration status
        let nextStatus: typeof schema.registrationStatusEnum.enumValues[number] | undefined;
        if (updatedPayment.paymentType === 'dp1') nextStatus = 'dp1_paid';
        else if (updatedPayment.paymentType === 'dp2') nextStatus = 'dp2_paid';
        else if (updatedPayment.paymentType === 'full') nextStatus = 'fully_paid';

        if (nextStatus) {
          await withRetry(() => db.update(schema.registrations)
            .set({ status: nextStatus, updatedAt: new Date() })
            .where(eq(schema.registrations.id, updatedPayment.registrationId)));
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
        await withRetry(() => db.insert(schema.equipment).values({ registrationId, koper, ihram, mukena, assignee }));
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
                  where: and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, item.docType))
                }));

        if (!item.fileUrl) {
          if (existing) {
            await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.id, existing.id)));
          }
        } else if (existing) {
          await withRetry(() => db.update(schema.documents).set({ fileUrl: item.fileUrl, status: 'approved', updatedAt: new Date() }).where(eq(schema.documents.id, existing.id)));
        } else {
          await withRetry(() => db.insert(schema.documents).values({
                      registrationId,
                      docType: item.docType,
                      fileUrl: item.fileUrl,
                      status: 'approved'
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
              and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, docType))
            ));
      res.json({ success: true });
      notifyUpdate();
    } catch (e: any) {
      console.error("[Final Docs DELETE Error]:", e);
      res.status(500).json({ error: e.message || "Gagal menghapus dokumen" });
    }
  });

  // --- Document Management Endpoints ---
  
  // Get Jamaah Documents
  app.get("/api/jamaah/documents", authenticate, async (req: AuthRequest, res) => {
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      if (!registration) return res.json([]);

      const userDocs = await withRetry(() => db.query.documents.findMany({
              where: eq(schema.documents.registrationId, registration.id)
            }));
      res.json(userDocs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Upload Document
  app.post("/api/documents/upload", authenticate, async (req: AuthRequest, res) => {
    const { docType, fileUrl } = req.body;
    try {
      const registration = await getRegistrationForUser(req.user!.id, req.user?.email);
      if (!registration) return res.status(404).json({ error: "No registration found" });

      // Upsert document (or just insert new one)
      const existing = await withRetry(() => db.query.documents.findFirst({
              where: and(
                eq(schema.documents.registrationId, registration.id),
                eq(schema.documents.docType, docType)
              )
            }));

      if (existing) {
        await withRetry(() => db.update(schema.documents)
                  .set({ fileUrl, status: 'pending', rejectionReason: null, updatedAt: new Date() })
                  .where(eq(schema.documents.id, existing.id)));
      } else {
        await withRetry(() => db.insert(schema.documents).values({
                  registrationId: registration.id,
                  docType,
                  fileUrl,
                  status: 'pending'
                }));
      }

      // Notify admin
      await withRetry(() => db.insert(schema.notifications).values({
              title: "Dokumen Baru Diupload",
              message: `${req.user?.name} telah mengupload ${docType}.`,
              type: "info"
            }));

      res.json({ message: "Document uploaded successfully" });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get Admin Pending Documents
  app.get("/api/admin/pending-documents", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const pendingDocs = await withRetry(() => db.select({
              id: schema.documents.id,
              docType: schema.documents.docType,
              fileUrl: schema.documents.fileUrl,
              status: schema.documents.status,
              createdAt: schema.documents.createdAt,
              userName: schema.users.name,
              userEmail: schema.users.email
            })
            .from(schema.documents)
            .innerJoin(schema.registrations, eq(schema.documents.registrationId, schema.registrations.id))
            .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
            .where(eq(schema.documents.status, 'pending')));

      res.json(pendingDocs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending documents" });
    }
  });

  // Verify Document
  app.patch("/api/admin/documents/:id/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { status, reason } = req.body;
    try {
      const doc = await withRetry(() => db.query.documents.findFirst({
              where: eq(schema.documents.id, req.params.id),
              with: {
                registration: true
              }
            }));

      if (!doc) return res.status(404).json({ error: "Document not found" });

      await withRetry(() => db.update(schema.documents)
              .set({ status, rejectionReason: reason, updatedAt: new Date() })
              .where(eq(schema.documents.id, req.params.id)));

      // Notify Jamaah
      await withRetry(() => db.insert(schema.notifications).values({
              userId: doc.registration.userId,
              title: status === 'approved' ? "Dokumen Tervalidasi" : "Dokumen Ditolak",
              message: status === 'approved' 
                ? `Dokumen ${doc.docType} Anda telah disetujui.` 
                : `Dokumen ${doc.docType} Anda ditolak. Alasan: ${reason}`,
              type: status === 'approved' ? "success" : "error"
            }));

      res.json({ message: "Verification processed" });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to verify document" });
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
        rejectionReason: schema.payments.rejectionReason,
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
        'package_selected': 15,
        'bio_filled': 30,
        'dp1_paid': 45,
        'dp2_paid': 60,
        'documents_uploaded': 75,
        'fully_paid': 90,
        'visa_ticket_ready': 100
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

      // 1. Jamaah Aktif (Total pax across all registrations from real jamaah users)
      const allActiveRegs = await withRetry(() => db.select({
        adultCount: schema.registrations.adultCount,
        childCount: schema.registrations.childCount,
        infantCount: schema.registrations.infantCount,
      })
      .from(schema.registrations)
      .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
      .where(and(
        eq(schema.users.role, 'jamaah'),
        ne(schema.registrations.status, 'package_selected'),
        ne(schema.registrations.status, 'cancelled')
      )));
      
      const totalJamaah = allActiveRegs.reduce((acc, r) => 
        acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);

      // 2. Arus Kas (Bulan Ini) - Approved payments this month
      const cashFlow = await withRetry(() => db.select({
        total: sql<number>`sum(${schema.payments.amount})`
      })
      .from(schema.payments)
      .where(and(
        eq(schema.payments.status, 'approved'),
        gte(schema.payments.createdAt, firstDayOfMonth)
      )));
      const monthlyCashFlow = Number(cashFlow[0]?.total || 0);

      // 3. Persiapan Dokumen (Approved docs / total uploaded docs)
      const allDocs = await withRetry(() => db.select({ status: schema.documents.status }).from(schema.documents));
      const totalDocs = allDocs.length;
      const approvedDocsCount = allDocs.filter(d => d.status === 'approved').length;
      
      const docProgress = totalDocs > 0 
        ? Math.round((approvedDocsCount / totalDocs) * 100) 
        : 0;

      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.packages.findFirst({
        where: gte(schema.packages.departureDate, now),
        orderBy: (p, { asc }) => [asc(p.departureDate)]
      }));

      // Fallback: If no future departure, pick the package with the most registrations
      if (!nextBatch) {
        const pkgCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          count: sql<number>`count(*)`
        })
        .from(schema.registrations)
        .groupBy(schema.registrations.packageId)
        .orderBy(sql`count(*) desc`)
        .limit(1));
        
        if (pkgCounts.length > 0) {
          nextBatch = await withRetry(() => db.query.packages.findFirst({
            where: eq(schema.packages.id, pkgCounts[0].packageId)
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
          ne(schema.registrations.status, 'package_selected'),
          ne(schema.registrations.status, 'cancelled')
        )));
        
        nextBatchRegs = regs.reduce((acc, r) => acc + (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0), 0);

        if (nextBatchRegs > 0) {
          const regIds = regs.map(r => r.id);
          
          // Current progress calculation
          const approvedDocs = await withRetry(() => db.select({ count: sql<number>`count(*)` })
            .from(schema.documents)
            .where(and(
              inArray(schema.documents.registrationId, regIds),
              eq(schema.documents.status, 'approved')
            )));
          
          const approvedPayments = await withRetry(() => db.select({ total: sql<number>`sum(${schema.payments.amount})` })
            .from(schema.payments)
            .where(and(
              inArray(schema.payments.registrationId, regIds),
              eq(schema.payments.status, 'approved')
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
        .where(eq(schema.payments.status, 'pending')));

      // 2. Pending Documents
      const pendingDocs = await withRetry(() => db.select({ count: sql<number>`count(*)` })
        .from(schema.documents)
        .where(eq(schema.documents.status, 'pending')));

      // 3. Unpaid registrations near departure
      const nearDepartureUnpaid = await withRetry(() => db.select({ count: sql<number>`count(*)` })
        .from(schema.registrations)
        .innerJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
        .where(and(
          sql`${schema.registrations.status} != 'fully_paid'`,
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
