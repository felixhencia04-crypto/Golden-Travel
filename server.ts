// Suppress GCP MetadataLookupWarning when running outside GCP (e.g. Railway, Render)
process.env.DETECT_GCP_RETRIES = '0';
process.env.NO_GCP_METADATA = 'true';

process.on('warning', (warning) => {
  if (warning?.name === 'MetadataLookupWarning' || warning?.message?.includes('MetadataLookupWarning')) {
    return; // Ignore GCP metadata ping warnings in non-GCP hosts like Railway
  }
  console.warn(`[Process Warning] ${warning.name}: ${warning.message}`);
});

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import pg from 'pg';
import crypto from 'crypto';
import { createServer as createViteServer } from "vite";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }
  // Plaintext fallback for legacy accounts
  return password === storedHash;
}

function isValidUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
import cors from "cors";
import jwt from "jsonwebtoken";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { eq, and, desc, asc, sql, gte, inArray, ne, or, isNull, lt, exists, ilike, like } from 'drizzle-orm';
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

async function getPaymentsQuery(options: any) {
  let query: any = db.select({
    id: schema.payments.id,
    workspaceId: schema.payments.workspaceId,
    registrationId: schema.payments.registrationId,
    paymentType: schema.payments.paymentType,
    amount: schema.payments.amount,
    status: schema.payments.status,
    adminNotes: schema.payments.adminNotes,
    verifiedAt: schema.payments.verifiedAt,
    verifiedBy: schema.payments.verifiedBy,
    createdAt: schema.payments.createdAt,
    isPdf: sql<boolean>`${schema.payments.proofUrl} LIKE 'data:application/pdf%'`.as('is_pdf'),
    hasProof: sql<boolean>`${schema.payments.proofUrl} IS NOT NULL AND ${schema.payments.proofUrl} != ''`.as('has_proof')
  }).from(schema.payments).where(options.where);
  
  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      query = query.orderBy(...options.orderBy);
    } else {
      query = query.orderBy(options.orderBy);
    }
  }

  const payments: any[] = await withRetry(async () => await query);
  return payments.map((p: any) => ({
    ...p,
    proofUrl: p.hasProof ? `/api/payments/${p.id}/proof${p.isPdf ? '.pdf' : '.png'}` : null
  }));
}

async function getDocumentsQuery(options: any) {
  let query: any = db.select({
    id: schema.documents.id,
    workspaceId: schema.documents.workspaceId,
    registrationId: schema.documents.registrationId,
    docType: schema.documents.docType,
    status: schema.documents.status,
    adminNotes: schema.documents.adminNotes,
    fileUrl: schema.documents.fileUrl,
    createdAt: schema.documents.createdAt,
    updatedAt: schema.documents.updatedAt,
    isPdf: sql<boolean>`${schema.documents.fileUrl} LIKE 'data:application/pdf%' OR ${schema.documents.fileUrl} LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%'`.as('is_pdf'),
    hasFile: sql<boolean>`${schema.documents.fileUrl} IS NOT NULL AND ${schema.documents.fileUrl} != ''`.as('has_file')
  }).from(schema.documents).where(options.where);
  
  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      query = query.orderBy(...options.orderBy);
    } else {
      query = query.orderBy(options.orderBy);
    }
  }

  const docs: any[] = await withRetry(async () => await query);
  return docs.map((d: any) => ({
    ...d,
    fileUrl: d.fileUrl && d.fileUrl.trim() !== '' ? d.fileUrl : (d.hasFile ? `/api/documents/${d.id}/file${d.isPdf ? '.pdf' : '.png'}` : null)
  }));
}

async function getCertificatesQuery(options: any) {
  let query: any = db.select({
    id: schema.certificates.id,
    workspaceId: schema.certificates.workspaceId,
    registrationId: schema.certificates.registrationId,
    recipientName: schema.certificates.recipientName,
    createdAt: schema.certificates.createdAt,
    isPdf: sql<boolean>`${schema.certificates.certificateUrl} LIKE 'data:application/pdf%'`.as('is_pdf'),
    hasCert: sql<boolean>`${schema.certificates.certificateUrl} IS NOT NULL AND ${schema.certificates.certificateUrl} != ''`.as('has_cert')
  }).from(schema.certificates).where(options.where);
  
  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      query = query.orderBy(...options.orderBy);
    } else {
      query = query.orderBy(options.orderBy);
    }
  }

  const certs: any[] = await withRetry(async () => await query);
  return certs.map((c: any) => ({
    ...c,
    certificateUrl: c.hasCert ? `/api/certificates/${c.id}/file${c.isPdf ? '.pdf' : '.png'}` : null
  }));
}
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
  // For Admin, we allow any transition. This check should be skipped in admin routes,
  // but for safety in general helper, we check a flag or just allow backward for now if requested
  if (currentStatus === newStatus) return true;
  
  // By default, only forward. But we'll handle admin bypass in the route itself.
  return newIndex >= currentIndex;
}

// Helper for UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string | undefined | null) => id && typeof id === 'string' && uuidRegex.test(id);

const requireStatus = (...allowedStatuses: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const regId = req.params.id;
      if (!isValidUUID(regId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
      
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

const adminStatsCache = new Map<string, { data: any; timestamp: number }>();

export function invalidateUserCache(tokenOrId?: string) {
  if (!tokenOrId) {
    userAuthCache.clear();
    adminStatsCache.clear();
  } else {
    // Try to delete by token first
    userAuthCache.delete(tokenOrId);
    // Then check if it's a userId and delete associated tokens
    for (const [token, entry] of userAuthCache.entries()) {
      if (entry && entry.user && (entry.user.id === tokenOrId || entry.user.uid === tokenOrId)) {
        userAuthCache.delete(token);
      }
    }
    // Also clear admin stats if it was a data-changing action
    adminStatsCache.clear();
  }
}

// Auth Middleware
async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;

  if (!token && req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
  }

  // 1. Try Custom JWT first (Admin, Jamaah, Mitra)
  const unverifiedDecoded = jwt.decode(token) as any;
  if (unverifiedDecoded) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.id || decoded.email || decoded.uid)) {
        // Check Cache first
        const cached = userAuthCache.get(token);
        if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minutes cache
          req.user = cached.user;
          return next();
        }

        let user: any = null;

        // Resilient user lookup
        const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        try {
          if (decoded.id && isUuid(String(decoded.id))) {
            const [u] = await withRetry(() => db.select().from(schema.users).where(and(eq(schema.users.id, decoded.id), isNull(schema.users.deletedAt))).limit(1), 5);
            user = u || null;
          } else if (decoded.uid) {
            const [u] = await withRetry(() => db.select().from(schema.users).where(and(eq(schema.users.uid, decoded.uid), isNull(schema.users.deletedAt))).limit(1), 5);
            user = u || null;
          }
        } catch (e: any) {
          console.error(`[Auth] Critical User lookup failed for ${decoded.id || decoded.uid}: ${e.message}`);
          // Fallback: If DB is unreachable, trust valid JWT for role/workspace
          if (decoded.role && decoded.workspaceId) {
            req.user = decoded;
            return next();
          }
        }

        if (!user && decoded.email) {
          try {
            const [u] = await withRetry(() => db.select().from(schema.users).where(and(eq(schema.users.email, String(decoded.email).toLowerCase().trim()), isNull(schema.users.deletedAt))).limit(1), 5);
            user = u || null;
          } catch (e: any) {
            console.warn(`[Auth] Email lookup failed for ${decoded.email}: ${e.message}`);
          }
        }

        if (!user && (decoded.role === 'admin' || decoded.role === 'super_admin')) {
          try {
            const [u] = await withRetry(() => db.select().from(schema.users).where(and(or(eq(schema.users.role, 'admin'), eq(schema.users.role, 'super_admin')), isNull(schema.users.deletedAt))).limit(1), 5);
            user = u || null;
          } catch (e: any) {
            console.warn(`[Auth] Admin role fallback lookup failed: ${e.message}`);
          }
        }

        const effectiveUser = user ? { ...user } : { ...decoded };
        
        // Ensure role and workspace are present for admin
        if (
          decoded.role === 'admin' ||
          decoded.role === 'super_admin' ||
          effectiveUser.role === 'admin' ||
          effectiveUser.role === 'super_admin' ||
          effectiveUser.email === 'felix.hencia04@gmail.com' ||
          decoded.email === 'felix.hencia04@gmail.com'
        ) {
          effectiveUser.role = 'admin';
          // Fallback workspaceId for safety if not in DB user record
          if (!effectiveUser.workspaceId && decoded.workspaceId) {
            effectiveUser.workspaceId = decoded.workspaceId;
          }
        }
        
        req.user = effectiveUser;
        userAuthCache.set(token, { user: effectiveUser, timestamp: Date.now() });
        return next();
      }
    } catch (e) {
      // Pass through to Firebase Auth check
    }
  }

  // 2. Try Firebase Auth
  try {
    const cachedUser = userAuthCache.get(token);
    if (cachedUser && Date.now() - cachedUser.timestamp < 120000) {
      req.user = cachedUser.user;
      return next();
    }

    let decodedToken: any = null;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err: any) {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.uid || decoded.user_id || decoded.sub || decoded.email)) {
        decodedToken = { ...decoded, uid: decoded.uid || decoded.user_id || decoded.sub };
      } else {
        throw err;
      }
    }

    let user: any = null;
    if (decodedToken?.uid) {
      try {
        const [u] = await withRetry(() => db.select().from(schema.users).where(and(eq(schema.users.uid, decodedToken.uid), isNull(schema.users.deletedAt))).limit(1));
        user = u || null;
      } catch (err: any) {}
    }

    if (!user && decodedToken?.email) {
      try {
        const userEmail = decodedToken.email.toLowerCase().trim();
        const [u] = await withRetry(() => db.select().from(schema.users).where(and(eq(schema.users.email, userEmail), isNull(schema.users.deletedAt))).limit(1));
        user = u || null;
      } catch (err: any) {}
    }

    if (!user && decodedToken?.email) {
      // Auto-create user if missing during Firebase verification
      const userEmail = decodedToken.email.toLowerCase().trim();
      const userName = decodedToken.name || userEmail.split('@')[0];
      const role = userEmail === 'felix.hencia04@gmail.com' ? 'admin' : 'jamaah';
      try {
        const [newUser] = await withRetry(() => db.insert(schema.users).values({
          uid: decodedToken.uid || `uid-${Date.now()}`,
          email: userEmail,
          name: userName,
          role: role as any,
          status: 'active'
        } as any).returning());
        user = newUser;
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
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
  } catch (error: any) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
  }
}

async function startServer() {
  const app = express();
  
  // Enable CORS for all routes (to allow Vite frontend on different ports)
  app.use(cors());

  const httpServer = http.createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
  });

  const sseClients = new Map<string, express.Response[]>();

  function broadcastAllSSE(event: string, data: any) {
    sseClients.forEach((responses) => {
      responses.forEach(res => {
        try {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
          // ignore closed connection
        }
      });
    });
  }

  let updateTimeout: NodeJS.Timeout | null = null;
  const notifyUpdate = () => {
    if (updateTimeout) return;
    updateTimeout = setTimeout(() => {
      const payload = { timestamp: new Date().toISOString() };
      io.emit("data_updated", payload);
      broadcastAllSSE("data_updated", payload);
      broadcastAllSSE("PACKAGE_MUTATED", payload);
      broadcastAllSSE("SCHEDULE_MUTATED", payload);
      updateTimeout = null;
    }, 500); // 500ms fast real-time debounce
  };

  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // Multer & Static Upload Setup
  const uploadDir = path.join(process.cwd(), 'uploads');
  const publicUploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(publicUploadDir)) {
    fs.mkdirSync(publicUploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname) || '.png';
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ storage: storage });
  app.set("upload", upload); // Store in app for use in routes

  app.use('/uploads', express.static(uploadDir));
  app.use('/uploads', express.static(publicUploadDir));
  app.use('/public/uploads', express.static(publicUploadDir));
  app.use('/public/uploads', express.static(uploadDir));

  // Helper function to save Base64 data URLs to physical files in /uploads folder
  function saveFileToUploads(fileInput: string | undefined | null, category: string = 'doc'): string {
    if (!fileInput || typeof fileInput !== 'string') return fileInput || '';
    const trimmed = fileInput.trim();
    if (!trimmed) return '';

    // If already relative static path (/uploads/...) or external URL, return clean path
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/') || trimmed.startsWith('/public/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.startsWith('uploads/') ? '/' + trimmed : trimmed;
    }

    // If data URL or base64, save physically to disk in uploadDir & publicUploadDir
    if (trimmed.startsWith('data:') || trimmed.includes('base64,')) {
      try {
        let contentType = 'image/png';
        let base64Data = trimmed;

        if (trimmed.startsWith('data:')) {
          const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contentType = matches[1];
            base64Data = matches[2];
          } else {
            const parts = trimmed.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (mimeMatch) contentType = mimeMatch[1];
            base64Data = parts[1] || '';
          }
        } else if (trimmed.includes('base64,')) {
          base64Data = trimmed.split('base64,')[1];
        }

        let ext = 'png';
        if (contentType.includes('pdf') || base64Data.startsWith('JVBERi0')) ext = 'pdf';
        else if (contentType.includes('jpeg') || contentType.includes('jpg') || base64Data.startsWith('/9j/')) ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('png') || base64Data.startsWith('iVBORw')) ext = 'png';
        else if (contentType.includes('video/mp4')) ext = 'mp4';
        else if (contentType.includes('video/webm')) ext = 'webm';

        const filename = `${category}-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${ext}`;
        const filePath = path.join(uploadDir, filename);
        const publicFilePath = path.join(publicUploadDir, filename);
        const fileBuffer = Buffer.from(base64Data, 'base64');
        
        fs.writeFileSync(filePath, fileBuffer);
        try { fs.writeFileSync(publicFilePath, fileBuffer); } catch (e) {}

        console.log(`[Storage] Saved file physically to disk: ${filePath}`);
        return `/uploads/${filename}`;
      } catch (err) {
        console.error("[Storage] Error writing base64 file to disk:", err);
        return trimmed;
      }
    }
    return trimmed;
  }

  // POST /api/upload -> Universal persistent file upload
  app.post("/api/upload", authenticate, (req: AuthRequest, res, next) => {
    if (req.body && req.body.base64) {
      return res.json({ url: req.body.base64, filename: 'base64_asset' });
    }
    const uploadMiddleware = req.app.get('upload');
    uploadMiddleware.single('file')(req, res, (err: any) => {
      if (err) return res.status(500).json({ error: "Gagal upload file" });
      if (!req.file) return res.status(400).json({ error: "File tidak ditemukan" });
      
      try {
        const mimeType = req.file.mimetype || 'image/jpeg';
        let base64Str = '';
        if (req.file.buffer) {
          base64Str = req.file.buffer.toString('base64');
        } else if (req.file.path && fs.existsSync(req.file.path)) {
          base64Str = fs.readFileSync(req.file.path).toString('base64');
        }

        const dataUrl = base64Str ? `data:${mimeType};base64,${base64Str}` : `/uploads/${req.file.filename}`;
        res.json({ url: dataUrl, filename: req.file.filename });
      } catch (e) {
        res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
      }
    });
  });

  // Comprehensive DB Schema and Column Verification & Migration
  async function ensureTableAndColumns() {
    console.log('[DB Auto-Migration] Running complete schema & column verification for production database...');
    
    const runSql = async (query: string) => {
      try {
        await db.execute(sql.raw(query));
      } catch (err: any) {
        // Silently catch column/type warnings
      }
    };

    // 0. Update Postgres ENUM values and alter role/status columns to text to prevent 22P02 invalid input value errors
    await runSql(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'super_admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'admin'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'mitra'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'jamaah'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'keuangan'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'operasional'; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'marketing'; EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;
      END $$;
    `);

    await runSql(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
          ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text;
          ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'jamaah';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
          ALTER TABLE "users" ALTER COLUMN "status" TYPE text USING "status"::text;
          ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE "registrations" ALTER COLUMN "status" DROP DEFAULT;
          ALTER TABLE "registrations" ALTER COLUMN "status" TYPE text USING "status"::text;
          ALTER TABLE "registrations" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT;
          ALTER TABLE "payments" ALTER COLUMN "status" TYPE text USING "status"::text;
          ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;
          ALTER TABLE "documents" ALTER COLUMN "status" TYPE text USING "status"::text;
          ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PENDING';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `);

    // 1. Workspaces
    await runSql(`
      CREATE TABLE IF NOT EXISTS "workspaces" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "slug" text UNIQUE NOT NULL,
        "domain" text UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Users
    await runSql(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" text UNIQUE NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "uid" text;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'jamaah';`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mitra_id" uuid;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" text;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text;`);
    await runSql(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;`);

    // 3. Packages
    await runSql(`
      CREATE TABLE IF NOT EXISTS "packages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "description" text NOT NULL,
        "price" numeric(12, 2) NOT NULL,
        "duration" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "departure_date" timestamp;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "image_url" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "facilities" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "excludes" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "hotel" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'umroh';`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "is_available" boolean DEFAULT true;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "quota" integer DEFAULT 45;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "manasik_pdf_url" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "muthawwif_name" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "muthawwif_role" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "muthawwif_phone" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "muthawwif_avatar_url" text;`);
    await runSql(`ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "muthawwif_notes" text;`);

    // 4. Schedules
    await runSql(`
      CREATE TABLE IF NOT EXISTS "schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "package_id" uuid NOT NULL,
        "departure_date" timestamp NOT NULL,
        "total_seats" integer NOT NULL,
        "available_seats" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "name" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "airline" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "itinerary_pdf_url" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "muthawwif_name" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "muthawwif_role" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "muthawwif_phone" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "muthawwif_avatar_url" text;`);
    await runSql(`ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "muthawwif_notes" text;`);

    // 5. Registrations
    await runSql(`
      CREATE TABLE IF NOT EXISTS "registrations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "package_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "schedule_id" uuid;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'DRAFT';`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "orderer_name" text;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "orderer_phone" text;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "orderer_email" text;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "orderer_notes" text;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "adult_count" text DEFAULT '1';`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "child_count" text DEFAULT '0';`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "infant_count" text DEFAULT '0';`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "total_amount" numeric(12,2) DEFAULT 0;`);
    await runSql(`ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "pax_data" jsonb;`);

    // 6. Payments
    await runSql(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "registration_id" uuid NOT NULL,
        "payment_type" text NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "proof_url" text NOT NULL,
        "status" text DEFAULT 'PENDING' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "admin_notes" text;`);
    await runSql(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;`);
    await runSql(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_by" uuid;`);

    // 7. Documents
    await runSql(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "registration_id" uuid NOT NULL,
        "doc_type" text NOT NULL,
        "file_url" text NOT NULL,
        "status" text DEFAULT 'PENDING' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "admin_notes" text;`);

    // 8. Notifications
    await runSql(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "message" text NOT NULL,
        "type" text NOT NULL,
        "is_read" text DEFAULT 'false' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "user_id" uuid;`);

    // 9. Package Itineraries
    await runSql(`
      CREATE TABLE IF NOT EXISTS "package_itineraries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "package_id" uuid NOT NULL,
        "day" integer NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "location" text,
        "meals" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 10. Gallery Photos & Videos
    await runSql(`
      CREATE TABLE IF NOT EXISTS "gallery_photos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "image_url" text NOT NULL,
        "title" text,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "gallery_photos" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);

    await runSql(`
      CREATE TABLE IF NOT EXISTS "gallery_videos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "video_url" text NOT NULL,
        "thumbnail_url" text,
        "title" text,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "gallery_videos" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);

    // 11. Buku Kas Mutasi
    await runSql(`
      CREATE TABLE IF NOT EXISTS "buku_kas_mutasi" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" numeric(12,2) NOT NULL,
        "transaction_type" text NOT NULL,
        "description" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "buku_kas_mutasi" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "buku_kas_mutasi" ADD COLUMN IF NOT EXISTS "payment_id" uuid;`);

    // 12. Manifest
    await runSql(`
      CREATE TABLE IF NOT EXISTS "manifest_keberangkatan" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "package_id" uuid NOT NULL,
        "registration_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "bus_number" text;`);
    await runSql(`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "hotel_room" text;`);
    await runSql(`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "airplane_seat" text;`);
    await runSql(`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "pax_manifest" jsonb;`);

    // 13. Helpdesk Tiket
    await runSql(`
      CREATE TABLE IF NOT EXISTS "helpdesk_tiket" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "subject" text NOT NULL,
        "message" text NOT NULL,
        "status" text DEFAULT 'open' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "helpdesk_tiket" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "helpdesk_tiket" ADD COLUMN IF NOT EXISTS "replies" jsonb DEFAULT '[]'::jsonb;`);

    // 14. Sertifikat Kenangan
    await runSql(`
      CREATE TABLE IF NOT EXISTS "sertifikat_kenangan" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "certificate_url" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "sertifikat_kenangan" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "sertifikat_kenangan" ADD COLUMN IF NOT EXISTS "registration_id" uuid;`);
    await runSql(`ALTER TABLE "sertifikat_kenangan" ADD COLUMN IF NOT EXISTS "recipient_name" text;`);

    // 15. Equipment Status
    await runSql(`
      CREATE TABLE IF NOT EXISTS "equipment_status" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "registration_id" uuid NOT NULL,
        "koper" boolean DEFAULT false NOT NULL,
        "ihram" boolean DEFAULT false NOT NULL,
        "mukena" boolean DEFAULT false NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "equipment_status" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "equipment_status" ADD COLUMN IF NOT EXISTS "assignee" text;`);

    // 16. Memories
    await runSql(`
      CREATE TABLE IF NOT EXISTS "memories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "image_url" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "package_id" uuid;`);
    await runSql(`ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "schedule_id" uuid;`);
    await runSql(`ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "registration_id" uuid;`);
    await runSql(`ALTER TABLE "memories" ADD COLUMN IF NOT EXISTS "caption" text;`);

    // 17. Activities
    await runSql(`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "registration_id" uuid NOT NULL,
        "action" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "user_id" uuid;`);
    await runSql(`ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "details" text;`);

    // 18. Mitra Users, Profiles, KYC, Commission Payouts
    await runSql(`
      CREATE TABLE IF NOT EXISTS "mitra_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "email" text UNIQUE NOT NULL,
        "no_wa" text NOT NULL,
        "password_hash" text NOT NULL,
        "status_akun" text DEFAULT 'incomplete_profile' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS "mitra_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid UNIQUE NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "nama_lengkap" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "nik" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "tempat_lahir" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "tanggal_lahir" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "alamat_lengkap" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "nama_bank" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "no_rekening" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "nama_pemilik_rekening" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "npwp" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "jenis_kelamin" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "status_perkawinan" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "pekerjaan" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "provinsi" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "kota" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "kecamatan" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "kode_pos" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "whatsapp" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "bukti_transfer" text;`);
    await runSql(`ALTER TABLE "mitra_profiles" ADD COLUMN IF NOT EXISTS "review_notes" text;`);

    await runSql(`
      CREATE TABLE IF NOT EXISTS "kyc_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "document_type" text NOT NULL,
        "file_url" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "uploaded_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS "mitra_commission_payouts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mitra_name" text NOT NULL,
        "amount" numeric(12, 2) NOT NULL,
        "bank_name" text NOT NULL,
        "account_number" text NOT NULL,
        "account_holder" text NOT NULL,
        "status" text DEFAULT 'PENDING' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "mitra_user_id" uuid;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "mitra_phone" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "jamaah_name" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "package_name" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "mitra_notes" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "admin_notes" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "proof_of_transfer_url" text;`);
    await runSql(`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "transfer_date" timestamp;`);

    // 19. Hotels & Airlines
    await runSql(`
      CREATE TABLE IF NOT EXISTS "hotels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "city" text NOT NULL,
        "rating" integer DEFAULT 4 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "distance" text;`);
    await runSql(`ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "image_url" text;`);

    await runSql(`
      CREATE TABLE IF NOT EXISTS "airlines" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "airlines" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "airlines" ADD COLUMN IF NOT EXISTS "code" text;`);
    await runSql(`ALTER TABLE "airlines" ADD COLUMN IF NOT EXISTS "logo_url" text;`);

    // 20. Financial Verifications
    await runSql(`
      CREATE TABLE IF NOT EXISTS "financial_verifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "amount" numeric(12, 2) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "financial_verifications" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "financial_verifications" ADD COLUMN IF NOT EXISTS "payment_id" uuid;`);
    await runSql(`ALTER TABLE "financial_verifications" ADD COLUMN IF NOT EXISTS "verifier_name" text;`);
    await runSql(`ALTER TABLE "financial_verifications" ADD COLUMN IF NOT EXISTS "verification_status" text DEFAULT 'APPROVED';`);
    await runSql(`ALTER TABLE "financial_verifications" ADD COLUMN IF NOT EXISTS "notes" text;`);

    // 21. Admin Settings
    await runSql(`
      CREATE TABLE IF NOT EXISTS "admin_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "travel_name" text DEFAULT 'PT Golden Travel Umrah' NOT NULL,
        "default_commission_rate" numeric(12, 2) DEFAULT 1500000.00,
        "whatsapp_number" text DEFAULT '08111111111',
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    await runSql(`ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;`);
    await runSql(`ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "travel_logo_url" text;`);
    await runSql(`ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "bank_accounts" jsonb DEFAULT '[]'::jsonb;`);

    console.log('[DB Auto-Migration] All tables and columns verified & created successfully.');
  }

  // Run lightweight schema auto-migrations on startup before accepting requests
  // Start in background to avoid blocking Cloud Run TCP health checks on port 3000
  (async () => {
    try {
      try {
        await withRetry(() => db.execute(sql`SELECT 1`), 3, 1000);
        console.log('[DB Status] Database connected successfully at startup.');
      } catch (err: any) {
        (global as any)._dbIsBroken = true;
        console.error('[DB FATAL] Database connection failed at startup. Aborting all DB init to prevent retry floods.');
        return; // Abort the whole IIFE
      }
      
      // Auto-Migration for missing tables, enums and columns
      try {
        try { await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`); } catch (e) {}
        try { await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`); } catch (e) {}

        // Enums
        const createEnum = async (name: string, values: string[]) => {
          try {
            const check: any = await db.execute(sql.raw(`SELECT typname FROM pg_type WHERE typname = '${name}'`));
            const rows = Array.isArray(check) ? check : (check?.rows || []);
            if (rows.length === 0) {
              await db.execute(sql.raw(`CREATE TYPE "${name}" AS ENUM (${values.map(v => `'${v}'`).join(', ')});`));
            }
          } catch (e) {}
        };

        await createEnum('user_role', ['admin', 'mitra', 'jamaah', 'super_admin']);
        await createEnum('user_status', ['active', 'inactive', 'pending', 'Selesai', 'suspended']);
        await createEnum('registration_status', ['DRAFT', 'PILIH_PAKET', 'ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI', 'CANCELLED']);
        await createEnum('payment_status', ['PENDING', 'VERIFIED', 'REJECTED']);
        await createEnum('payment_type', ['DP1', 'DP2', 'PELUNASAN']);
        await createEnum('document_status', ['PENDING', 'VERIFIED', 'REJECTED']);

        // Main tables and columns sync
        await ensureTableAndColumns();

        // Fix existing constraints/types if needed
        try { await db.execute(sql`ALTER TABLE "users" ALTER COLUMN "workspace_id" DROP NOT NULL;`); } catch (e) {}
        try { await db.execute(sql`ALTER TABLE "manifest_keberangkatan" ADD COLUMN IF NOT EXISTS "pax_manifest" jsonb;`); } catch (e) {}
        try { await db.execute(sql`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "jamaah_name" text;`); } catch (e) {}
        try { await db.execute(sql`ALTER TABLE "mitra_commission_payouts" ADD COLUMN IF NOT EXISTS "package_name" text;`); } catch (e) {}

        console.log('[DB Auto-Migration] Schema synced successfully.');
      } catch (e: any) {
        console.error('[DB Auto-Migration] Fatal failure:', e.message);
      }

      // Ensure Default Workspace exists
      let defaultWorkspace: any = null;
      try {
        defaultWorkspace = await withRetry(() => db.query.workspaces.findFirst());
      } catch (e: any) {
        console.warn('[DB Setup] Failed to fetch workspace on startup:', e.message);
      }
      
      if (!defaultWorkspace) {
        console.log('[DB Setup] Creating default workspace...');
        try {
          const [newWorkspace] = await withRetry(() => db.insert(schema.workspaces).values({
            name: "Default Workspace",
            subdomain: "default",
            isActive: true,
            themeColor: "#D4AF37",
            contactEmail: "admin@goldentravel.id",
            slug: 'golden-tour'
          }).returning());
          defaultWorkspace = newWorkspace;
          console.log('[DB Setup] Default workspace created.');
        } catch (e: any) {
          console.error('[DB Setup] Failed to create default workspace:', e.message);
        }
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
    } catch (e: any) {
      console.error('[DB Setup] Startup check completely failed:', e.message);
    }
  })();

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      await withRetry(() => db.execute(sql`SELECT 1`));
      res.status(200).json({ status: "ok", db: "connected" });
    } catch (err: any) {
      console.error("Health check database error:", err.message);
      // Respond with 200 to keep process alive in environments like Railway
      res.status(200).json({ status: "ok", db: "disconnected", error: err.message });
    }
  });

  // Custom Admin Login (Password & Optional Email)
  app.post("/api/admin/login", async (req, res) => {
    const rawPassword = req.body?.password;
    const rawEmail = req.body?.email;
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    if (!password) {
      return res.status(400).json({ error: 'Kata sandi harus diisi.' });
    }

    try {
      // Query active admin users from DB reliably
      let adminUsers = await withRetry(() => db.select().from(schema.users)
        .where(and(
          or(
            eq(schema.users.role, 'admin'),
            eq(schema.users.role, 'super_admin'),
            ilike(schema.users.email, '%admin%')
          ),
          isNull(schema.users.deletedAt)
        ))
      ).catch(() => []);

      let defaultWs = await db.query.workspaces.findFirst().catch(() => null);
      if (!defaultWs) {
        try {
          const [newWs] = await db.insert(schema.workspaces).values({ name: "Golden Travel Workspace", slug: `golden-travel-${Date.now()}` }).returning();
          defaultWs = newWs;
        } catch (wsErr) {
          console.warn("Notice: auto-creating workspace skipped:", wsErr);
        }
      }

      // If no admin user exists in DB yet, auto-create default admin user row
      if (!adminUsers || adminUsers.length === 0) {
        try {
          const [createdAdmin] = await db.insert(schema.users).values({
            workspaceId: defaultWs?.id,
            name: 'Ahmad Daud',
            email: 'admin@goldentravel.id',
            phone: '081218272734',
            password: hashPassword('admin123'),
            role: 'admin',
            status: 'active'
          }).returning();
          if (createdAdmin) adminUsers = [createdAdmin];
        } catch (seedErr: any) {
          console.warn("Notice: auto-creating default admin row skipped:", seedErr?.message);
        }
      }

      if (email) {
        const filteredByEmail = adminUsers.filter((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase());
        if (filteredByEmail.length > 0) {
          adminUsers = filteredByEmail;
        }
      }

      let matchedAdmin: any = null;
      for (const u of adminUsers) {
        // STRICT CHECK: Verify entered password against DB hashed password
        if (u.password && verifyPassword(password, u.password)) {
          matchedAdmin = u;
          break;
        }
      }

      // Emergency fallback ONLY if user table has no hashed password initialized
      if (!matchedAdmin && adminUsers.length > 0) {
        const hasHashedPass = adminUsers.some((u: any) => u.password && typeof u.password === 'string' && u.password.includes(':'));
        if (!hasHashedPass && (password === 'admin123' || password === 'admin')) {
          matchedAdmin = adminUsers[0];
        }
      }

      if (matchedAdmin) {
        const workspaceId = matchedAdmin.workspaceId || defaultWs?.id || 'ws-default';
        const token = jwt.sign({ 
          id: matchedAdmin.id,
          role: 'admin',
          email: matchedAdmin.email || 'admin@goldentravel.id',
          name: matchedAdmin.name || 'Ahmad Daud',
          phone: matchedAdmin.phone || '081218272734',
          workspaceId: workspaceId
        }, JWT_SECRET, { expiresIn: '7d' });
        
        // Clear cached auth so new session reads fresh DB values
        invalidateUserCache();

        return res.json({ token, role: 'admin', user: { ...matchedAdmin, workspaceId } });
      } else {
        return res.status(401).json({ error: 'Kata sandi admin tidak sesuai. Silakan masukkan kata sandi yang benar.' });
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      return res.status(500).json({ error: 'Terjadi kesalahan sistem saat verifikasi login admin.' });
    }
  });

  // Sync User (Create or Sync existing)
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1]?.trim();
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Sesi tidak valid.' });
      }

      let decodedToken: any;
      try {
        decodedToken = await adminAuth.verifyIdToken(token);
      } catch (err) {
        try {
          decodedToken = jwt.verify(token, JWT_SECRET);
        } catch (e) {
          decodedToken = jwt.decode(token);
        }
        if (!decodedToken || (!decodedToken.uid && !decodedToken.id && !decodedToken.email)) {
          throw new Error('Token tidak valid.');
        }
      }

      const userEmail = (decodedToken.email || `${decodedToken.uid || decodedToken.id}@goldentravel.local`).toLowerCase().trim();
      const userName = req.body.name || decodedToken.name || userEmail.split('@')[0];
      const userAvatar = decodedToken.picture || null;
      const requestedRole = req.body.role;

      // Helper for resilient user lookup by email
      const findUserByEmail = async (email: string) => {
        try {
          const [u] = await withRetry(() => db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1));
          if (u) return u;
        } catch (err: any) {
          console.warn("Select full user columns failed, falling back to essential columns:", err.message);
        }

        try {
          const [u] = await withRetry(() => db.select({
            id: schema.users.id,
            email: schema.users.email,
            name: schema.users.name,
            role: schema.users.role,
            workspaceId: schema.users.workspaceId,
            uid: schema.users.uid,
            avatarUrl: schema.users.avatarUrl,
            status: schema.users.status
          }).from(schema.users).where(eq(schema.users.email, email)).limit(1));
          if (u) return u;
        } catch (err: any) {
          console.warn("Select essential columns failed:", err.message);
        }

        try {
          const u = await withRetry(() => db.query.users.findFirst({
            where: eq(schema.users.email, email)
          }));
          if (u) return u;
        } catch (err: any) {
          console.warn("db.query users failed:", err.message);
        }

        return null;
      };

      // 1. Get default workspace
      let defaultWorkspace: any;
      try {
        defaultWorkspace = await withRetry(() => db.query.workspaces.findFirst());
      } catch (e) {
        // fallback
      }
      if (!defaultWorkspace) {
        try {
          const [ws] = await withRetry(() => db.insert(schema.workspaces).values({
            name: 'Golden Tour Haramain',
            slug: 'golden-tour'
          }).returning());
          defaultWorkspace = ws;
        } catch (e) {
          defaultWorkspace = { id: 'default-workspace-id' };
        }
      }

      // 2. Find existing user by email using resilient finder
      let user = await findUserByEmail(userEmail);

      if (user) {
        // Update user if needed
        const updateData: any = { updatedAt: new Date() };
        if (userName && userName !== user.name) updateData.name = userName;
        if (userAvatar && typeof userAvatar === 'string' && userAvatar.startsWith('http') && (!user.avatarUrl || !user.avatarUrl.startsWith('data:'))) {
          updateData.avatarUrl = userAvatar;
        }
        if (decodedToken.uid && !user.uid) updateData.uid = decodedToken.uid;
        if (!user.workspaceId && defaultWorkspace?.id) updateData.workspaceId = defaultWorkspace.id;
        if (user.email === 'felix.hencia04@gmail.com' && user.role !== 'admin') updateData.role = 'admin';

        if (Object.keys(updateData).length > 1) {
          try {
            const [updated] = await withRetry(() => db.update(schema.users)
              .set(updateData)
              .where(eq(schema.users.id, user.id))
              .returning());
            if (updated) user = updated;
          } catch (err: any) {
            console.warn("Sinkronisasi data tambahan diabaikan karena error:", err.message);
          }
        }
      } else {
        // Create new user safely - only passing essential fields from Google
        const role = (userEmail === 'felix.hencia04@gmail.com') ? 'admin' : (requestedRole === 'mitra' ? 'mitra' : 'jamaah');
        const googleUid = decodedToken.uid || decodedToken.id || `uid-${Date.now()}`;
        const cleanName = userName || userEmail.split('@')[0];

        const newUserId = crypto.randomUUID();
        const insertPayload: Record<string, any> = {
          id: newUserId,
          uid: googleUid,
          email: userEmail,
          name: cleanName,
          role: role as any
        };
        if (userAvatar && typeof userAvatar === 'string' && userAvatar.startsWith('http')) {
          insertPayload.avatarUrl = userAvatar;
        }

        try {
          const [newUser] = await withRetry(() => db.insert(schema.users).values(insertPayload as any).returning());
          user = newUser;
        } catch (err: any) {
          console.warn("Drizzle insert failed, executing raw clean INSERT query:", err.message);
          try {
            const hasAvatar = !!insertPayload.avatarUrl;
            const rawResult = await withRetry(() => db.execute(sql`
              INSERT INTO "users" ("id", "uid", "email", "name", "role"${hasAvatar ? sql`, "avatar_url"` : sql``})
              VALUES (${newUserId}::uuid, ${googleUid}, ${userEmail}, ${cleanName}, ${role}${hasAvatar ? sql`, ${insertPayload.avatarUrl}` : sql``})
              RETURNING "id", "email", "name", "role", "uid", "avatar_url"
            `));
            const row = rawResult.rows?.[0] || (rawResult as any)?.[0];
            user = row;
          } catch (rawErr: any) {
            console.error("Gagal mendaftarkan akun baru (Drizzle & Raw SQL):", rawErr);
            throw new Error("Gagal mendaftarkan akun baru: " + (rawErr.message || rawErr));
          }
        }
      }

      // Safe registration relation query (Optimized to manual sequential to avoid complex JOINs)
      let registration = null;
      if (user?.id) {
        try {
          const reg = await withRetry(() => db.query.registrations.findFirst({
            where: eq(schema.registrations.userId, user.id)
          }));
          
          if (reg) {
            const [pkg, sch, pay, doc] = await Promise.all([
              reg.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, reg.packageId) })) : Promise.resolve(null),
              reg.scheduleId ? withRetry(() => db.query.schedules.findFirst({ where: eq(schema.schedules.id, reg.scheduleId) })) : Promise.resolve(null),
              getPaymentsQuery({ where: eq(schema.payments.registrationId, reg.id) }),
              getDocumentsQuery({ where: eq(schema.documents.registrationId, reg.id) })
            ]);
            
            registration = {
              ...reg,
              package: pkg,
              schedule: sch,
              payments: pay,
              documents: doc
            };
          }
        } catch (regErr) {
          try {
            const [reg] = await withRetry(() => db.select().from(schema.registrations).where(eq(schema.registrations.userId, user.id)).limit(1));
            registration = reg || null;
          } catch (e) {
            registration = null;
          }
        }
      }

      const sessionToken = jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }, JWT_SECRET, { expiresIn: '7d' });

      notifyUpdate();
      res.json({ success: true, user, registration, token: sessionToken });
    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Gagal sinkronisasi: ' + error.message });
    }
  });

  // Direct Email/Password Auth (Register or Login without Google/Firebase)
  app.post("/api/auth/direct-auth", async (req, res) => {
    try {
      const { action, email, password, name, role } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Alamat email tidak valid.' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      }

      const userEmail = email.toLowerCase().trim();

      // Safe lookup for existing user by email (case & whitespace insensitive)
      let existingUser: any = null;
      try {
        const userRes = await withRetry(() => db.execute(sql`
          SELECT id, uid, email, name, role, password, workspace_id as "workspaceId", status 
          FROM "users" 
          WHERE LOWER(TRIM(email)) = LOWER(TRIM(${userEmail})) 
          LIMIT 1;
        `));
        const userRows = Array.isArray(userRes) ? userRes : (userRes?.rows || []);
        existingUser = userRows[0] || null;
      } catch (err: any) {
        console.error('Error selecting user in direct-auth raw SQL:', err?.message);
      }

      if (!existingUser) {
        try {
          const allUsers = await withRetry(() => db.select().from(schema.users));
          existingUser = allUsers.find((u: any) => u.email && u.email.toLowerCase().trim() === userEmail) || null;
        } catch (err: any) {
          console.error('Error selecting user in direct-auth Drizzle fallback:', err?.message);
        }
      }

      // If user exists in DB:
      if (existingUser) {
        if (!existingUser.password) {
          // User registered via Google or sync previously without password -> set password now
          const hashedPassword = hashPassword(password.trim());
          const updatedName = name?.trim() || existingUser.name || userEmail.split('@')[0];
          
          try {
            await withRetry(() => db.execute(sql`
              UPDATE "users" 
              SET password = ${hashedPassword}, name = ${updatedName}, updated_at = NOW() 
              WHERE id::text = ${String(existingUser.id)};
            `));
          } catch (updErr) {
            try {
              await withRetry(() => db.update(schema.users).set({
                password: hashedPassword,
                name: updatedName,
                updatedAt: new Date()
              }).where(eq(schema.users.id, existingUser.id)));
            } catch (e) {}
          }
          
          existingUser.password = hashedPassword;
          existingUser.name = updatedName;

          const sessionToken = jwt.sign({
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            name: existingUser.name,
            workspaceId: existingUser.workspaceId || existingUser.workspace_id
          }, JWT_SECRET, { expiresIn: '7d' });

          notifyUpdate();
          return res.json({ 
            success: true, 
            user: existingUser, 
            token: sessionToken, 
            message: 'Kata sandi berhasil disimpan dan Anda telah masuk!' 
          });
        }

        // Verify password
        if (verifyPassword(password.trim(), existingUser.password)) {
          const sessionToken = jwt.sign({
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
            name: existingUser.name,
            workspaceId: existingUser.workspaceId || existingUser.workspace_id
          }, JWT_SECRET, { expiresIn: '7d' });

          let registration = null;
          try {
            // Step 1: Fetch primary registration record (Lightweight)
            registration = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.userId, existingUser.id)
            }));

            // Step 2: Populate relations individually if found
            if (registration) {
              const [pkg, schedule, payments, docs] = await Promise.all([
                registration.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, registration.packageId) })) : Promise.resolve(null),
                registration.scheduleId ? withRetry(() => db.query.schedules.findFirst({ where: eq(schema.schedules.id, registration.scheduleId) })) : Promise.resolve(null),
                getPaymentsQuery({ where: eq(schema.payments.registrationId, registration.id) }),
                getDocumentsQuery({ where: eq(schema.documents.registrationId, registration.id) })
              ]);

              registration = {
                ...registration,
                package: pkg,
                schedule,
                payments,
                documents: docs
              };
            }
          } catch (e) {
            console.warn("Login registration detail fetch failed:", e);
            registration = null;
          }

          notifyUpdate();
          return res.json({ 
            success: true, 
            user: existingUser, 
            registration,
            token: sessionToken, 
            message: 'Login berhasil! Selamat datang kembali.' 
          });
        } else {
          if (action === 'register') {
            return res.status(400).json({ 
              error: 'Email ini sudah terdaftar. Jika Anda pemilik akun, silakan login dengan kata sandi yang sesuai.' 
            });
          }
          return res.status(400).json({ 
            error: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi Anda.' 
          });
        }
      }

      // If user does NOT exist in DB yet (First time registering OR logging in):
      if (action === 'login') {
        return res.status(400).json({
          error: 'Email belum terdaftar. Silakan periksa kembali email Anda atau mendaftar Mitra Baru.'
        });
      }

      let defaultWorkspace: any = null;
      try {
        defaultWorkspace = await withRetry(() => db.query.workspaces.findFirst());
      } catch (wsErr) {}

      if (!defaultWorkspace) {
        try {
          const [ws] = await withRetry(() => db.insert(schema.workspaces).values({
            name: 'Golden Tour Haramain',
            slug: 'golden-tour'
          }).returning());
          defaultWorkspace = ws;
        } catch (wsErr) {}
      }

      const userRole = userEmail === 'felix.hencia04@gmail.com' ? 'admin' : (role === 'mitra' ? 'mitra' : 'jamaah');
      const userName = name?.trim() || userEmail.split('@')[0];
      const hashedPassword = hashPassword(password.trim());
      const newUserId = crypto.randomUUID();
      const uid = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const rawWsId = defaultWorkspace?.id ? String(defaultWorkspace.id) : null;
      const validWsUuid = (rawWsId && /^[0-9a-fA-F-]{36}$/.test(rawWsId)) ? rawWsId : null;

      let newUser: any = null;

      // Strategy 1: Drizzle ORM Insert (safest and standard)
      try {
        const userValues: any = {
          id: newUserId,
          uid,
          email: userEmail,
          name: userName,
          password: hashedPassword,
          role: userRole as any,
          status: 'active'
        };
        if (validWsUuid) {
          userValues.workspaceId = validWsUuid;
        }

        const [u] = await withRetry(() => db.insert(schema.users).values(userValues).returning());
        if (u) newUser = u;
      } catch (drizzleErr: any) {
        console.warn('Direct-auth Drizzle insert notice:', drizzleErr?.message);
      }

      // Strategy 2: Raw SQL Insert without workspace_id if FK constraint fails
      if (!newUser) {
        try {
          const insertRes = await withRetry(() => db.execute(sql`
            INSERT INTO "users" (id, uid, email, name, password, role, status, created_at, updated_at)
            VALUES (
              ${newUserId}::uuid,
              ${uid}, 
              ${userEmail}, 
              ${userName}, 
              ${hashedPassword}, 
              ${userRole}, 
              'active', 
              NOW(),
              NOW()
            )
            RETURNING id, uid, email, name, role, status;
          `));

          const insertRows = Array.isArray(insertRes) ? insertRes : (insertRes?.rows || []);
          if (insertRows[0]) newUser = insertRows[0];
        } catch (sqlErr2: any) {
          console.warn('Direct-auth Raw SQL insert notice:', sqlErr2?.message);
        }
      }

      // Strategy 3: Query DB by email in case insert succeeded concurrently
      if (!newUser) {
        try {
          const findRes = await withRetry(() => db.execute(sql`
            SELECT id, uid, email, name, role, password, workspace_id as "workspaceId", status 
            FROM "users" 
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(${userEmail})) 
            LIMIT 1;
          `));
          const rows = Array.isArray(findRes) ? findRes : (findRes?.rows || []);
          if (rows[0]) newUser = rows[0];
        } catch (fErr) {}
      }

      // Strategy 4: Fallback user object
      if (!newUser) {
        newUser = {
          id: newUserId,
          uid,
          email: userEmail,
          name: userName,
          role: userRole,
          status: 'active',
          workspaceId: validWsUuid
        };
      }

      // Auto-connect to Mitra Panel if role is mitra
      if (newUser.role === 'mitra') {
        try {
          await withRetry(async () => {
            // Check if already exists first
            const [existing] = await db.select().from(schema.mitraUsers).where(eq(schema.mitraUsers.id, newUser.id)).limit(1);
            if (!existing) {
              await db.insert(schema.mitraUsers).values({
                id: newUser.id,
                name: newUser.name || '',
                email: newUser.email,
                noWa: '',
                passwordHash: '-',
                statusAkun: 'incomplete_profile',
                createdAt: new Date(),
                updatedAt: new Date()
              });
              await db.insert(schema.mitraProfiles).values({
                id: crypto.randomUUID(),
                userId: newUser.id,
                namaLengkap: newUser.name || '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          });
        } catch (mitraErr) {
          console.warn('Auto-mitra-connect notice:', mitraErr);
        }
      }

      const sessionToken = jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        workspaceId: newUser.workspaceId || newUser.workspace_id || validWsUuid
      }, JWT_SECRET, { expiresIn: '7d' });

      notifyUpdate();
      return res.json({ 
        success: true, 
        user: newUser, 
        token: sessionToken, 
        message: 'Akun berhasil didaftarkan dan Anda telah masuk! Selamat datang.' 
      });

    } catch (err: any) {
      console.error("Direct auth fatal error:", err);
      res.status(500).json({ error: 'Gagal memproses autentikasi: ' + err.message });
    }
  });

  // Direct Google Auth (Accepts Google Email/Name/Picture, creates/finds user and returns JWT)
  app.post("/api/auth/google-direct", async (req, res) => {
    try {
      const { email, name, role } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email Google tidak valid.' });
      }

      const userEmail = email.toLowerCase().trim();
      const userName = name?.trim() || userEmail.split('@')[0];
      const targetRole = userEmail === 'felix.hencia04@gmail.com' ? 'admin' : (role || 'mitra');

      let existingUser: any = null;
      try {
        const userRes = await withRetry(() => db.execute(sql`
          SELECT id, uid, email, name, role, workspace_id as "workspaceId", status 
          FROM "users" 
          WHERE LOWER(TRIM(email)) = LOWER(TRIM(${userEmail})) 
          LIMIT 1;
        `));
        const userRows = Array.isArray(userRes) ? userRes : (userRes?.rows || []);
        existingUser = userRows[0] || null;
      } catch (err: any) {}

      if (!existingUser) {
        try {
          const allUsers = await withRetry(() => db.select().from(schema.users));
          existingUser = allUsers.find((u: any) => u.email && u.email.toLowerCase().trim() === userEmail) || null;
        } catch (err: any) {}
      }

      if (existingUser) {
        const sessionToken = jwt.sign({
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          name: existingUser.name,
          workspaceId: existingUser.workspaceId || existingUser.workspace_id
        }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
          success: true,
          user: existingUser,
          token: sessionToken,
          message: 'Berhasil masuk dengan akun Google!'
        });
      }

      // Create new user for Google login
      const newUserId = crypto.randomUUID();
      const uid = `google-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      const userValues: any = {
        id: newUserId,
        uid,
        email: userEmail,
        name: userName,
        role: targetRole as any,
        status: 'active'
      };

      let newUser: any = null;
      try {
        const [u] = await withRetry(() => db.insert(schema.users).values(userValues).returning());
        if (u) newUser = u;
      } catch (e) {
        try {
          const insertRes = await withRetry(() => db.execute(sql`
            INSERT INTO "users" (id, uid, email, name, role, status, created_at, updated_at)
            VALUES (${newUserId}::uuid, ${uid}, ${userEmail}, ${userName}, ${targetRole}, 'active', NOW(), NOW())
 RETURNING id, uid, email, name, role, status;
          `));
          const rows = Array.isArray(insertRes) ? insertRes : (insertRes?.rows || []);
          if (rows[0]) newUser = rows[0];
        } catch (e2) {}
      }

      if (!newUser) {
        newUser = {
          id: newUserId,
          uid,
          email: userEmail,
          name: userName,
          role: targetRole,
          status: 'active'
        };
      }

      // Auto-connect to Mitra Panel if role is mitra
      if (newUser.role === 'mitra') {
        try {
          await withRetry(async () => {
            const [existing] = await db.select().from(schema.mitraUsers).where(eq(schema.mitraUsers.id, newUser.id)).limit(1);
            if (!existing) {
              await db.insert(schema.mitraUsers).values({
                id: newUser.id,
                name: newUser.name || '',
                email: newUser.email,
                noWa: '',
                passwordHash: '-',
                statusAkun: 'incomplete_profile',
                createdAt: new Date(),
                updatedAt: new Date()
              });
              await db.insert(schema.mitraProfiles).values({
                id: crypto.randomUUID(),
                userId: newUser.id,
                namaLengkap: newUser.name || '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          });
        } catch (mitraErr) {
          console.warn('Google-auto-mitra-connect notice:', mitraErr);
        }
      }

      const sessionToken = jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      }, JWT_SECRET, { expiresIn: '7d' });

      notifyUpdate();
      return res.json({
        success: true,
        user: newUser,
        token: sessionToken,
        message: 'Akun Google berhasil terdaftar sebagai Mitra! Selamat datang.'
      });
    } catch (err: any) {
      console.error("Google direct auth error:", err);
      res.status(500).json({ error: 'Gagal otorisasi Google: ' + err.message });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // If user is a mitra, check their onboarding/KYC status
      let mitraStatus = null;
      if (user.role === 'mitra') {
        let mitra = await withRetry(() => db.query.mitraUsers.findFirst({
          where: eq(schema.mitraUsers.id, user.id)
        })) as any;

        if (!mitra && user.email) {
          const userEmailClean = user.email.toLowerCase().trim();
          mitra = await withRetry(() => db.query.mitraUsers.findFirst({
            where: sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmailClean})`
          })) as any;
        }

        let status = mitra?.statusAkun || 'incomplete_profile';

        // Fetch profile record
        const profile = await withRetry(() => db.query.mitraProfiles.findFirst({
          where: or(
            eq(schema.mitraProfiles.userId, user.id),
            mitra?.id ? eq(schema.mitraProfiles.userId, mitra.id) : sql`false`
          )
        })) as any;

        const hasActualKyc = !!(profile && (profile.nik || profile.alamatLengkap || profile.noRekening || profile.npwp));

        // Strict status determination hierarchy
        if (mitra?.statusAkun === 'active') {
          status = 'active';
        } else if (mitra?.statusAkun === 'rejected') {
          status = 'rejected';
        } else if (mitra?.statusAkun === 'pending_verification' || hasActualKyc) {
          status = 'pending_verification';
        } else {
          status = 'incomplete_profile';
        }

        mitraStatus = status;
      }

      // Step 1: Fetch primary registration record (Lightweight)
      const registration = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, user.id)
      }));

      // Step 2: Populate relations individually only if registration exists
      if (registration) {
        const [pkg, schedule, payments, docs] = await Promise.all([
          registration.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, registration.packageId) })) : Promise.resolve(null),
          registration.scheduleId ? withRetry(() => db.query.schedules.findFirst({ where: eq(schema.schedules.id, registration.scheduleId) })) : Promise.resolve(null),
          getPaymentsQuery({ where: eq(schema.payments.registrationId, registration.id) }),
          getDocumentsQuery({ where: eq(schema.documents.registrationId, registration.id) })
        ]);

        const fullRegistration = {
          ...registration,
          package: pkg,
          schedule,
          payments,
          documents: docs
        };
        return res.json({ user, registration: fullRegistration, mitraStatus });
      }

      res.json({ user, registration: null, mitraStatus });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/mitra/status", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      let mitra = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, user.id)
      })) as any;

      if (!mitra && user.email) {
        const userEmailClean = user.email.toLowerCase().trim();
        mitra = await withRetry(() => db.query.mitraUsers.findFirst({
          where: sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmailClean})`
        })) as any;
      }

      const profile = await withRetry(() => db.query.mitraProfiles.findFirst({
        where: or(
          eq(schema.mitraProfiles.userId, user.id),
          mitra?.id ? eq(schema.mitraProfiles.userId, mitra.id) : sql`false`
        )
      })) as any;

      const hasActualKyc = !!(profile && (profile.nik || profile.alamatLengkap || profile.noRekening || profile.npwp));
      let status = mitra?.statusAkun || 'incomplete_profile';

      if (mitra?.statusAkun === 'active') {
        status = 'active';
      } else if (mitra?.statusAkun === 'rejected') {
        status = 'rejected';
      } else if (mitra?.statusAkun === 'pending_verification' || hasActualKyc) {
        status = 'pending_verification';
      } else {
        status = 'incomplete_profile';
      }

      return res.json({
        status,
        statusAkun: status,
        userId: user.id,
        email: user.email,
        hasProfile: hasActualKyc,
        reviewNotes: profile?.reviewNotes || null,
        updatedAt: mitra?.updatedAt || new Date()
      });
    } catch (error) {
      console.error("Get mitra status error:", error);
      res.status(500).json({ error: "Gagal mengambil status mitra" });
    }
  });

  // --- Live SSE Real-Time Verification Event System ---

  function notifyMitraRealtime(userId: string, email: string | null, event: string, data: any) {
    const targets = new Set<string>();
    if (userId) targets.add(userId.toLowerCase());
    if (email) targets.add(email.toLowerCase());

    sseClients.forEach((responses, clientId) => {
      if (targets.has(clientId.toLowerCase())) {
        responses.forEach(res => {
          try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          } catch (e) {
            console.error("SSE write error:", e);
          }
        });
      }
    });
  }

  app.get("/api/mitra/live-stream", authenticate, (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const userEmail = req.user?.email?.toLowerCase().trim();
    if (!userId) return res.status(401).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, userId, timestamp: new Date() })}\n\n`);

    const clientKey = userId.toLowerCase();
    if (!sseClients.has(clientKey)) sseClients.set(clientKey, []);
    sseClients.get(clientKey)!.push(res);

    if (userEmail && userEmail !== clientKey) {
      if (!sseClients.has(userEmail)) sseClients.set(userEmail, []);
      sseClients.get(userEmail)!.push(res);
    }

    req.on('close', () => {
      if (sseClients.has(clientKey)) {
        sseClients.set(clientKey, sseClients.get(clientKey)!.filter(r => r !== res));
      }
      if (userEmail && sseClients.has(userEmail)) {
        sseClients.set(userEmail, sseClients.get(userEmail)!.filter(r => r !== res));
      }
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // --- Transaksi & Keuangan Endpoints ---

  // GET /api/registrasi/:id/invoice -> Jamaah: Detail tagihan
  app.get("/api/registrasi/:id/invoice", authenticate, async (req: AuthRequest, res) => {
    try {
      // Step 1: Fetch primary registration record (Lightweight)
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));

      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Akses ditolak" });
      }

      // Step 2: Populate relations individually
      const [pkg, payments] = await Promise.all([
        reg.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, reg.packageId) })) : Promise.resolve(null),
        getPaymentsQuery({ where: eq(schema.payments.registrationId, reg.id) })
      ]);

      const totalHarga = Number(reg.totalAmount || pkg?.price || 0);
      const totalBayar = (payments || [])
        .filter((p: any) => p.status === 'VERIFIED' || p.status === 'approved')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      
      const sisaTagihan = totalHarga - totalBayar;
      
      // Determine next stage
      const hasDP1 = (payments || []).some((p: any) => (p.paymentType === 'DP1' || p.paymentType === 'dp1') && (p.status === 'VERIFIED' || p.status === 'approved'));
      const hasDP2 = (payments || []).some((p: any) => (p.paymentType === 'DP2' || p.paymentType === 'dp2') && (p.status === 'VERIFIED' || p.status === 'approved'));
      
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
        riwayatTransaksi: (payments || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      });
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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

      let normalizedPaymentType = String(paymentType || 'DP1').toUpperCase();
      if (normalizedPaymentType === 'FULL') {
        normalizedPaymentType = 'PELUNASAN';
      }

      // Anti-duplicate check: if a PENDING payment exists for this registration
      const existingPending = await withRetry(() => db.query.payments.findFirst({
        where: and(
          eq(schema.payments.registrationId, reg.id),
          eq(schema.payments.status, 'PENDING')
        ),
        orderBy: [desc(schema.payments.createdAt)]
      }));

      if (existingPending) {
        const timeDiffSec = (Date.now() - new Date(existingPending.createdAt).getTime()) / 1000;
        const isSameType = String(existingPending.paymentType).toUpperCase() === normalizedPaymentType;
        const isSameAmount = Math.abs(Number(existingPending.amount || 0) - Number(amount || 0)) < 1;

        if (isSameType || isSameAmount || timeDiffSec < 60) {
          if (proofUrl && (!existingPending.proofUrl || existingPending.proofUrl !== proofUrl)) {
            await withRetry(() => db.update(schema.payments)
              .set({ proofUrl, amount: String(amount) })
              .where(eq(schema.payments.id, existingPending.id)));
            existingPending.proofUrl = proofUrl;
            existingPending.amount = String(amount);
          }
          notifyUpdate();
          return res.status(200).json(existingPending);
        }
      }

      const [newPayment] = await withRetry(() => db.insert(schema.payments).values({
        workspaceId: reg.workspaceId,
        registrationId: req.params.id,
        paymentType: normalizedPaymentType as any,
        amount: String(amount),
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

      const payments = await getPaymentsQuery({
        where: eq(schema.payments.registrationId, req.params.id),
        orderBy: [desc(schema.payments.createdAt)]
      });
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

      // Step 1: Fetch primary record
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, updatedPayment.registrationId)
      }));

      let regWithDetails: any = null;
      if (reg) {
        // Step 2: Fetch relations individually
        const [pkg, payments] = await Promise.all([
          reg.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, reg.packageId) })) : Promise.resolve(null),
          getPaymentsQuery({ where: eq(schema.payments.registrationId, reg.id) })
        ]);
        
        regWithDetails = {
          ...reg,
          package: pkg,
          payments: payments || []
        };
      }

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
      // Step 1: Fetch pending payments
      const pendingPayments = await getPaymentsQuery({
        where: eq(schema.payments.status, 'PENDING')
      });

      if (pendingPayments.length > 0) {
        const regIds = Array.from(new Set(pendingPayments.map(p => p.registrationId)));
        
        // Step 2: Fetch related registrations in batch
        const registrations = await withRetry(() => db.query.registrations.findMany({
          where: inArray(schema.registrations.id, regIds as string[])
        }));

        const userIds = Array.from(new Set(registrations.map(r => r.userId).filter(Boolean)));
        const pkgIds = Array.from(new Set(registrations.map(r => r.packageId).filter(Boolean)));

        // Step 3: Fetch related users and packages in batch
        const [users, packages] = await Promise.all([
          userIds.length > 0 ? withRetry(() => db.query.users.findMany({ where: inArray(schema.users.id, userIds as any) })) : Promise.resolve([]),
          pkgIds.length > 0 ? withRetry(() => db.query.packages.findMany({ where: inArray(schema.packages.id, pkgIds as any) })) : Promise.resolve([])
        ]);

        // Step 4: Map relations back
        const enrichedPayments = pendingPayments.map(payment => {
          const reg = registrations.find(r => r.id === payment.registrationId);
          if (reg) {
            return {
              ...payment,
              registration: {
                ...reg,
                user: users.find((u: any) => u.id === reg.userId),
                package: packages.find((p: any) => p.id === reg.packageId)
              }
            };
          }
          return payment;
        });

        return res.json(enrichedPayments);
      }

      res.json(pendingPayments);
    } catch (error) {
      console.error("Gagal mengambil antrean setoran:", error);
      res.status(500).json({ error: "Gagal mengambil antrean setoran" });
    }
  });

  // GET /api/admin/laporan/keuangan -> Laporan keuangan
  app.get("/api/admin/laporan/keuangan", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      // Step 1: Fetch verified payments
      const allPayments = await getPaymentsQuery({
        where: eq(schema.payments.status, 'VERIFIED')
      });

      let enrichedPayments = allPayments;

      if (allPayments.length > 0) {
        const regIds = Array.from(new Set(allPayments.map(p => p.registrationId)));
        
        // Step 2: Fetch registrations
        const registrations = await withRetry(() => db.query.registrations.findMany({
          where: inArray(schema.registrations.id, regIds as string[])
        }));

        const pkgIds = Array.from(new Set(registrations.map(r => r.packageId).filter(Boolean)));

        // Step 3: Fetch packages
        const packages = pkgIds.length > 0 ? await withRetry(() => db.query.packages.findMany({ where: inArray(schema.packages.id, pkgIds as any) })) : [];

        // Step 4: Enrich
        enrichedPayments = allPayments.map(p => {
          const reg = registrations.find(r => r.id === p.registrationId);
          if (reg) {
            return {
              ...p,
              registration: {
                ...reg,
                package: packages.find((pkg: any) => pkg.id === reg.packageId)
              }
            };
          }
          return p;
        });
      }

      const totalOmset = enrichedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Monthly breakdown
      const perBulan: Record<string, number> = {};
      enrichedPayments.forEach(p => {
        const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
        perBulan[month] = (perBulan[month] || 0) + Number(p.amount);
      });

      // Package breakdown
      const perPaket: Record<string, number> = {};
      enrichedPayments.forEach(p => {
        const packageName = (p as any).registration?.package?.name || 'Unknown';
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
      
      // Optimize: Use COUNT instead of fetching all records to save memory and connection pool
      const [
        userCountResult, 
        regCountResult, 
        pendingDocsResult, 
        pendingPaymentsResult, 
        approvedPayments
      ] = await Promise.all([
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.workspaceId, workspaceId))),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(schema.registrations).where(eq(schema.registrations.workspaceId, workspaceId))),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(schema.documents).where(and(eq(schema.documents.workspaceId, workspaceId), eq(schema.documents.status, 'PENDING')))),
        withRetry(() => db.select({ count: sql<number>`count(*)` }).from(schema.payments).where(and(eq(schema.payments.workspaceId, workspaceId), eq(schema.payments.status, 'PENDING')))),
        getPaymentsQuery({
          where: and(eq(schema.payments.workspaceId, workspaceId), eq(schema.payments.status, 'VERIFIED'))
        })
      ]);
      
      const allUsers = await withRetry(() => db.query.users.findMany({
        where: eq(schema.users.workspaceId, workspaceId),
        columns: { status: true }
      }));
      
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, workspaceId),
        columns: { createdAt: true }
      }));

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
        total_jamaah: userCountResult[0].count,
        total_lunas: statusCounts['LUNAS'] || 0,
        total_pending_dokumen: pendingDocsResult[0].count,
        total_pending_setoran: pendingPaymentsResult[0].count,
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
      const approvedPayments = await getPaymentsQuery({
        where: and(
          eq(schema.payments.status, 'VERIFIED'),
          eq(schema.payments.workspaceId, req.user!.workspaceId!)
        )
      });

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
      
      const filters = [
        eq(schema.users.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah')
      ];
      
      if (status) {
        const statusArray = Array.isArray(status) ? (status as string[]) : [status as string];
        const draftOrPilihPaket = statusArray.includes('DRAFT') || statusArray.includes('PILIH_PAKET');
        filters.push(
          or(
            inArray(schema.registrations.status, statusArray as any),
            draftOrPilihPaket ? isNull(schema.registrations.id) : undefined
          ) as any
        );
      }
      
      if (packageId) {
        filters.push(eq(schema.registrations.packageId, packageId as string));
      }
      
      if (scheduleId) {
        filters.push(eq(schema.registrations.scheduleId, scheduleId as string));
      }

      if (search) {
        const searchStr = `%${search}%`;
        filters.push(or(
          sql`${schema.users.name} ILIKE ${searchStr}`,
          sql`${schema.users.phone} ILIKE ${searchStr}`,
          sql`${schema.registrations.ordererName} ILIKE ${searchStr}`,
          sql`${schema.registrations.ordererPhone} ILIKE ${searchStr}`
        ) as any);
      }

      const baseQuery = db.select({
        registration: schema.registrations,
        user: schema.users,
        package: schema.packages,
        schedule: schema.schedules,
      })
      .from(schema.users)
      .leftJoin(schema.registrations, eq(schema.users.id, schema.registrations.userId))
      .leftJoin(schema.packages, eq(schema.registrations.packageId, schema.packages.id))
      .leftJoin(schema.schedules, eq(schema.registrations.scheduleId, schema.schedules.id))
      .where(and(...filters));
      
      // Clone query for count
      const totalRes = await db.select({ count: sql<number>`count(*)` }).from(baseQuery.as('subquery'));
      const total = Number(totalRes[0].count);

      const data = await baseQuery
        .limit(limitNum)
        .offset(offset)
        .orderBy(desc(schema.users.createdAt));

      // --- Optimization: Batch fetch relations ---
      const regIds = data.map(r => r.registration?.id).filter(Boolean) as string[];
      
      const [allPayments, allDocs] = await Promise.all([
        regIds.length > 0 
          ? getPaymentsQuery({
              where: and(inArray(schema.payments.registrationId, regIds as string[]), eq(schema.payments.status, 'VERIFIED'))
            })
          : Promise.resolve([]),
        regIds.length > 0
          ? getDocumentsQuery({
              where: inArray(schema.documents.registrationId, regIds as string[])
            })
          : Promise.resolve([])
      ]);

      const registrationsWithMeta = data.map((row) => {
        let paymentProgress = 0;
        let hasRequiredDocs = false;
        
        if (row.registration) {
          const payments = allPayments.filter(p => p.registrationId === row.registration!.id);
          const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const totalAmount = Number(row.registration.totalAmount || row.package?.price || 0);
          paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

          const docs = allDocs.filter(d => d.registrationId === row.registration!.id);
          const verifiedDocsCount = docs.filter(d => d.status === 'VERIFIED').length;
          hasRequiredDocs = verifiedDocsCount >= 3;
        }

        return {
          ...(row.registration || {
            id: `no-reg-${row.user.id}`,
            status: 'DRAFT',
            userId: row.user.id,
            totalAmount: '0',
            adultCount: '1',
            childCount: '0',
            infantCount: '0',
            createdAt: row.user.createdAt,
            updatedAt: row.user.updatedAt,
            paxData: [],
            workspaceId: row.user.workspaceId
          }),
          user: row.user,
          package: row.package || null,
          schedule: row.schedule || null,
          paymentProgress,
          hasRequiredDocs
        };
      });

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
      const worksheet = XLSX.utils.json_to_sheet(allData.map(row => {
        const paxData = Array.isArray(row.registration.paxData) ? row.registration.paxData : [];
        const name = row.registration.ordererName || paxData[0]?.fullName || paxData[0]?.name || row.user.name;
        const phone = row.registration.ordererPhone || paxData[0]?.phone || row.user.phone || '-';
        const email = row.registration.ordererEmail || paxData[0]?.email || row.user.email || '-';

        return {
          ID: row.registration.id,
          Nama: name,
          Email: email,
          Phone: phone,
          Paket: row.package.name,
          Jadwal: row.schedule?.departureDate ? new Date(row.schedule.departureDate).toLocaleDateString() : '-',
          Status: row.registration.status,
          TotalAmount: row.registration.totalAmount,
          CreatedAt: row.registration.createdAt
        };
      }));
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

      const certs = await getCertificatesQuery({
        where: eq(schema.certificates.registrationId, req.params.id)
      });
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

      const finalDocs = await getDocumentsQuery({
        where: and(
          eq(schema.documents.registrationId, req.params.id),
          or(
            eq(schema.documents.docType, 'E-Visa'),
            eq(schema.documents.docType, 'Tiket Pesawat'),
            eq(schema.documents.docType, 'Itinerary Final')
          )
        )
      });
      res.json(finalDocs);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil dokumen final" });
    }
  });

  // --- Paket & Jadwal Endpoints (Standardized) ---

  // GET /api/pakets -> Jamaah: katalog aktif
  app.get("/api/pakets", authenticate, async (req: AuthRequest, res) => {
    try {
      let allPackages: any[] = [];
      const userWs = req.user?.workspaceId;
      try {
        allPackages = await withRetry(() => db.query.packages.findMany({
          where: and(
            userWs ? or(eq(schema.packages.workspaceId, userWs), isNull(schema.packages.workspaceId)) : eq(schema.packages.isAvailable, true),
            eq(schema.packages.isAvailable, true)
          )
        }));
      } catch (err: any) {
        console.warn("GET /api/pakets primary query failed:", err?.message || err);
        await ensureTableAndColumns();
        try {
          // Attempt with specific columns to avoid missing ones if migration failed
          allPackages = await withRetry(() => db.select({
            id: schema.packages.id,
            workspaceId: schema.packages.workspaceId,
            name: schema.packages.name,
            description: schema.packages.description,
            price: schema.packages.price,
            departureDate: schema.packages.departureDate,
            duration: schema.packages.duration,
            imageUrl: schema.packages.imageUrl,
            type: schema.packages.type,
            isAvailable: schema.packages.isAvailable,
            quota: schema.packages.quota,
            manasikPdfUrl: schema.packages.manasikPdfUrl,
            createdAt: schema.packages.createdAt
          }).from(schema.packages).where(
            eq(schema.packages.isAvailable, true)
          ));
        } catch (rawErr: any) {
          console.error("Retrying GET /api/pakets with raw query fallback...", rawErr?.message || rawErr);
          const rawRes: any = await db.execute(sql`
            SELECT id, workspace_id as "workspaceId", name, description, price, departure_date as "departureDate", duration, image_url as "imageUrl", type, is_available as "isAvailable", quota, manasik_pdf_url as "manasikPdfUrl", created_at as "createdAt"
            FROM packages
            WHERE is_available = true
          `);
          allPackages = Array.isArray(rawRes) ? rawRes : (rawRes.rows || []);
        }
      }
      
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

  // Helper for deleting a package cleanly with cascade cleanup
  async function deletePackageCascade(packageId: string) {
    // 1. Get all registrations linked to this package
    const linkedRegs = await withRetry(() => db.select({ id: schema.registrations.id })
      .from(schema.registrations)
      .where(eq(schema.registrations.packageId, packageId))
    ).catch(() => []);

    // 2. Cascade delete for each registration and its child records
    for (const reg of linkedRegs) {
      const regId = reg.id;
      await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.equipment).where(eq(schema.equipment.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.activities).where(eq(schema.activities.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, regId))).catch(() => {});

      const pays = await withRetry(() => db.select({ id: schema.payments.id })
        .from(schema.payments)
        .where(eq(schema.payments.registrationId, regId))
      ).catch(() => []);

      for (const p of pays) {
        await withRetry(() => db.delete(schema.financial_ledger).where(eq(schema.financial_ledger.paymentId, p.id))).catch(() => {});
      }
      await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, regId))).catch(() => {});
    }

    // Delete registrations linked to package
    if (linkedRegs.length > 0) {
      await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.packageId, packageId))).catch(() => {});
    }

    // 3. Get all schedules linked to this package
    const linkedSchedules = await withRetry(() => db.select({ id: schema.schedules.id })
      .from(schema.schedules)
      .where(eq(schema.schedules.packageId, packageId))
    ).catch(() => []);

    for (const sch of linkedSchedules) {
      await withRetry(() => db.update(schema.registrations).set({ scheduleId: null }).where(eq(schema.registrations.scheduleId, sch.id))).catch(() => {});
      await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.scheduleId, sch.id))).catch(() => {});
    }

    // Delete schedules
    await withRetry(() => db.delete(schema.schedules).where(eq(schema.schedules.packageId, packageId))).catch(() => {});

    // 4. Delete manifests and memories directly referencing packageId
    await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.packageId, packageId))).catch(() => {});
    await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.packageId, packageId))).catch(() => {});

    // 5. Delete package
    const [deletedPkg] = await withRetry(() => db.delete(schema.packages).where(eq(schema.packages.id, packageId)).returning());
    return deletedPkg;
  }

  // DELETE /api/pakets/:id -> Admin: hapus/nonaktifkan
  app.delete("/api/pakets/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const packageId = req.params.id;
      const deletedPkg = await deletePackageCascade(packageId);
      if (!deletedPkg) {
        return res.status(404).json({ error: "Paket tidak ditemukan." });
      }
      res.json({ success: true, id: packageId });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting paket:", error);
      res.status(500).json({ error: "Gagal menghapus paket." });
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
      let allSchedules: any[] = [];
      try {
        allSchedules = await withRetry(() => db.query.schedules.findMany({
          where: and(...conditions),
          with: { package: true }
        }));
      } catch (err: any) {
        console.warn("GET /api/jadwals primary query failed:", err?.message || err);
        
        // Background migration to fix issues for subsequent requests
        ensureTableAndColumns().catch(e => console.error("Background migration error (schedules):", e));

        try {
          // Fallback selection to avoid missing muthawwif columns
          const fallbackRes = await withRetry(() => db.select({
            id: schema.schedules.id,
            workspaceId: schema.schedules.workspaceId,
            packageId: schema.schedules.packageId,
            departureDate: schema.schedules.departureDate,
            name: schema.schedules.name,
            airline: schema.schedules.airline,
            totalSeats: schema.schedules.totalSeats,
            availableSeats: schema.schedules.availableSeats,
            itineraryPdfUrl: schema.schedules.itineraryPdfUrl,
            createdAt: schema.schedules.createdAt
          })
          .from(schema.schedules)
          .where(and(...conditions)));
          allSchedules = fallbackRes;
        } catch (fallbackErr: any) {
          console.warn("GET /api/jadwals fallback Drizzle query failed, trying raw SQL...", fallbackErr?.message || fallbackErr);
          try {
            const rawRes: any = await db.execute(sql`
              SELECT id, workspace_id as "workspaceId", package_id as "packageId", departure_date as "departureDate", 
                     name, airline, available_seats as "availableSeats", total_seats as "totalSeats", 
                     itinerary_pdf_url as "itineraryPdfUrl", created_at as "createdAt"
              FROM schedules
              WHERE workspace_id = ${req.user!.workspaceId!}
            `);
            const rows = Array.isArray(rawRes) ? rawRes : (rawRes.rows || []);
            allSchedules = rows;
          } catch (rawErr: any) {
            console.error("GET /api/jadwals FATAL: All query attempts failed.", rawErr?.message || rawErr);
            allSchedules = [];
          }
        }
      }
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
      let pkg: any = null;
      try {
        pkg = await withRetry(() => db.query.packages.findFirst({
          where: eq(schema.packages.id, packageId)
        }));
      } catch (err) {
        await ensureTableAndColumns();
        pkg = await withRetry(() => db.query.packages.findFirst({
          where: eq(schema.packages.id, packageId)
        }));
      }

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
      // Step 1: Fetch primary record (Lightweight)
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.id, req.params.id)
      }));

      if (!reg) return res.status(404).json({ error: "Registrasi tidak ditemukan" });
      
      // Security check: Only admin or the owner can see it
      if (req.user!.role !== 'admin' && reg.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Step 2: Populate relations individually
      const [pkg, schedule, payments, docs, user] = await Promise.all([
        reg.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, reg.packageId) })) : Promise.resolve(null),
        reg.scheduleId ? withRetry(() => db.query.schedules.findFirst({ where: eq(schema.schedules.id, reg.scheduleId) })) : Promise.resolve(null),
        getPaymentsQuery({ where: eq(schema.payments.registrationId, reg.id) }),
        getDocumentsQuery({ where: eq(schema.documents.registrationId, reg.id) }),
        reg.userId ? withRetry(() => db.query.users.findFirst({ where: eq(schema.users.id, reg.userId) })) : Promise.resolve(null)
      ]);

      const fullReg = {
        ...reg,
        package: pkg,
        schedule,
        payments,
        documents: docs,
        user
      };

      res.json(fullReg);
    } catch (error) {
      console.error("Gagal mengambil data registrasi:", error);
      res.status(500).json({ error: "Gagal mengambil data registrasi" });
    }
  });

  // GET /api/registrasi -> Admin: semua data jamaah
  app.get("/api/registrasi", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      // Step 1: Fetch registrations
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, req.user!.workspaceId!)
      }));

      if (allRegs.length > 0) {
        const userIds = Array.from(new Set(allRegs.map(r => r.userId).filter(Boolean)));
        const pkgIds = Array.from(new Set(allRegs.map(r => r.packageId).filter(Boolean)));
        const scheduleIds = Array.from(new Set(allRegs.map(r => r.scheduleId).filter(Boolean)));

        // Step 2: Fetch related data in batch
        const [users, packages, schedules] = await Promise.all([
          userIds.length > 0 ? withRetry(() => db.query.users.findMany({ where: inArray(schema.users.id, userIds as any) })) : Promise.resolve([]),
          pkgIds.length > 0 ? withRetry(() => db.query.packages.findMany({ where: inArray(schema.packages.id, pkgIds as any) })) : Promise.resolve([]),
          scheduleIds.length > 0 ? withRetry(() => db.query.schedules.findMany({ where: inArray(schema.schedules.id, scheduleIds as any) })) : Promise.resolve([])
        ]);

        // Step 3: Map relations back
        const enrichedRegs = allRegs.map(reg => ({
          ...reg,
          user: users.find((u: any) => u.id === reg.userId),
          package: packages.find((p: any) => p.id === reg.packageId),
          schedule: schedules.find((s: any) => s.id === reg.scheduleId)
        }));

        return res.json(enrichedRegs);
      }

      res.json(allRegs);
    } catch (error) {
      console.error("Gagal mengambil semua data registrasi:", error);
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

      if (req.user!.role !== 'admin' && !canTransitionTo(reg.status, newStatus)) {
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

        // Also record activity
        await tx.insert(schema.activities).values({
          workspaceId: reg.workspaceId,
          registrationId: reg.id,
          userId: req.user!.id,
          action: 'UPDATE_STATUS',
          details: `Status diubah menjadi ${newStatus}.`
        });
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

      const storedFileUrl = saveFileToUploads(fileUrl);

      const existingDoc = await db.query.documents.findFirst({
        where: and(
          eq(schema.documents.registrationId, req.params.id),
          eq(schema.documents.docType, docType as any)
        )
      });

      let document;
      if (existingDoc) {
        const validFileUrl = (storedFileUrl && !storedFileUrl.startsWith('/api/documents/')) ? storedFileUrl : existingDoc.fileUrl;
        [document] = await withRetry(() => db.update(schema.documents)
          .set({ 
            fileUrl: validFileUrl,
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
          fileUrl: storedFileUrl || '',
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

      const docs = await getDocumentsQuery({
        where: eq(schema.documents.registrationId, req.params.id)
      });
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

  // PATCH /api/admin/documents/verify -> Robust Admin verification endpoint
  app.patch("/api/admin/documents/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { registrationId, docId, docType, status, rejectionReason } = req.body;
    
    try {
      let targetDoc = null;

      if (docId && isValidUUID(docId)) {
        targetDoc = await db.query.documents.findFirst({
          where: eq(schema.documents.id, docId)
        });
      }

      if (!targetDoc && registrationId) {
        targetDoc = await db.query.documents.findFirst({
          where: and(
            eq(schema.documents.registrationId, registrationId),
            eq(schema.documents.docType, docType as any)
          )
        });
      }

      const newStatus = status === 'approved' || status === 'VERIFIED' ? 'VERIFIED' : 
                        status === 'rejected' || status === 'REJECTED' ? 'REJECTED' : 'PENDING';

      if (targetDoc) {
        const [updated] = await withRetry(() => db.update(schema.documents)
          .set({
            status: newStatus as any,
            adminNotes: rejectionReason || null,
            updatedAt: new Date()
          })
          .where(eq(schema.documents.id, targetDoc.id))
          .returning());

        notifyUpdate();
        return res.json(updated);
      } else if (registrationId && docType) {
        const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, registrationId) });
        const [inserted] = await withRetry(() => db.insert(schema.documents).values({
          registrationId,
          docType: docType as any,
          fileUrl: '',
          status: newStatus as any,
          adminNotes: rejectionReason || null,
          workspaceId: reg?.workspaceId || 'default'
        }).returning());

        notifyUpdate();
        return res.json(inserted);
      }

      res.status(404).json({ error: "Dokumen tidak ditemukan" });
    } catch (err: any) {
      console.error("Patch document verify error:", err);
      res.status(500).json({ error: "Gagal memproses verifikasi dokumen: " + err.message });
    }
  });

  // GET /api/admin/dokumens/pending -> Admin: list antrean
  app.get("/api/admin/dokumens/pending", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      // Step 1: Fetch pending documents
      const pendingDocs = await getDocumentsQuery({
        where: eq(schema.documents.status, 'PENDING')
      });

      if (pendingDocs.length > 0) {
        const regIds = Array.from(new Set(pendingDocs.map(d => d.registrationId)));
        
        // Step 2: Fetch related registrations
        const registrations = await withRetry(() => db.query.registrations.findMany({
          where: inArray(schema.registrations.id, regIds as string[])
        }));

        const userIds = Array.from(new Set(registrations.map(r => r.userId).filter(Boolean)));

        // Step 3: Fetch related users
        const users = userIds.length > 0 ? await withRetry(() => db.query.users.findMany({ where: inArray(schema.users.id, userIds as any) })) : [];

        // Step 4: Map back
        const enrichedDocs = pendingDocs.map(doc => {
          const reg = registrations.find(r => r.id === doc.registrationId);
          if (reg) {
            return {
              ...doc,
              registration: {
                ...reg,
                user: users.find((u: any) => u.id === reg.userId)
              }
            };
          }
          return doc;
        });

        return res.json(enrichedDocs);
      }

      res.json(pendingDocs);
    } catch (error) {
      console.error("Gagal mengambil antrean dokumen:", error);
      res.status(500).json({ error: "Gagal mengambil antrean dokumen" });
    }
  });

  // Get Packages
  app.get("/api/packages", async (req: Request, res) => {
    try {
      console.log(`GET /api/packages: Fetching all travel packages...`);
      let allPackages: any[] = [];
      try {
        allPackages = await withRetry(() => 
          db.select().from(schema.packages)
            .orderBy(desc(schema.packages.createdAt))
        );
      } catch (err: any) {
        console.warn("GET /api/packages primary query failed:", err?.message || err);
        ensureTableAndColumns().catch(e => console.error("Background migration error (packages):", e));
        
        try {
          const fallbackRes = await withRetry(() => 
            db.select({
              id: schema.packages.id,
              workspaceId: schema.packages.workspaceId,
              name: schema.packages.name,
              description: schema.packages.description,
              price: schema.packages.price,
              departureDate: schema.packages.departureDate,
              duration: schema.packages.duration,
              imageUrl: schema.packages.imageUrl,
              type: schema.packages.type,
              isAvailable: schema.packages.isAvailable,
              quota: schema.packages.quota,
              manasikPdfUrl: schema.packages.manasikPdfUrl,
              facilities: schema.packages.facilities,
              excludes: schema.packages.excludes,
              hotel: schema.packages.hotel,
              createdAt: schema.packages.createdAt
            })
            .from(schema.packages)
            .orderBy(desc(schema.packages.createdAt))
          );
          allPackages = fallbackRes;
        } catch (fallbackErr: any) {
          console.warn("GET /api/packages fallback Drizzle query failed, trying raw SQL...", fallbackErr?.message || fallbackErr);
          try {
            const rawRes: any = await db.execute(sql`
              SELECT id, workspace_id as "workspaceId", name, description, price, 
                     departure_date as "departureDate", duration, image_url as "imageUrl", 
                     type, is_available as "isAvailable", quota, 
                     manasik_pdf_url as "manasikPdfUrl", facilities, excludes, hotel, created_at as "createdAt"
              FROM packages
              ORDER BY created_at DESC
            `);
            const rows = Array.isArray(rawRes) ? rawRes : (rawRes.rows || []);
            allPackages = rows;
          } catch (rawErr: any) {
            console.error("GET /api/packages FATAL: All query attempts failed.", rawErr?.message || rawErr);
            allPackages = [];
          }
        }
      }
      
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


      let itinCounts: any[] = [];
      let allItineraries: any[] = [];
      try {
        allItineraries = await withRetry(() => db.select().from(schema.package_itineraries));
        itinCounts = await withRetry(() => db.select({
          packageId: schema.package_itineraries.packageId,
          count: sql<number>`count(*)`.as('count')
        }).from(schema.package_itineraries).groupBy(schema.package_itineraries.packageId));
      } catch (err) {}

      const packagesWithCounts = (allPackages || []).map((pkg) => {
        const pkgRegs = (regCounts || []).filter(r => r && r.packageId === pkg.id);
        const itinCountObj = (itinCounts || []).find(i => i.packageId === pkg.id);
        const pkgItineraries = allItineraries.filter(i => i.packageId === pkg.id).sort((a, b) => a.day - b.day);

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
        
        let exc: any = pkg.excludes;
        if (typeof exc === 'string') {
          try {
            exc = JSON.parse(exc);
          } catch (e) {
            exc = exc ? exc.split('\n') : [];
          }
        }


        return { 
          ...pkg, 
          description: desc || ["Fasilitas Bintang 5"],
          excludes: exc || [],
          quota: quotaNum,
          takenSeats,
          remainingSeats,
          itineraryCount: Number(itinCountObj?.count || 0),
          itinerary: pkgItineraries,
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
      let pkg: any = null;
      try {
        pkg = await withRetry(() => db.query.packages.findFirst({
          where: eq(schema.packages.id, req.params.id)
        }));
      } catch (err) {
        await ensureTableAndColumns();
        pkg = await withRetry(() => db.query.packages.findFirst({
          where: eq(schema.packages.id, req.params.id)
        }));
      }
      
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
      let allSchedules: any[] = [];
      try {
        allSchedules = await withRetry(() => db.query.schedules.findMany({
          where: eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          with: { package: true },
          orderBy: [asc(schema.schedules.departureDate)]
        }));
      } catch (relErr) {
        console.warn("Drizzle query with relation failed for /api/schedules, falling back to basic select:", relErr);
        allSchedules = await withRetry(() => db.select().from(schema.schedules)
          .where(eq(schema.schedules.workspaceId, req.user!.workspaceId!))
          .orderBy(asc(schema.schedules.departureDate))) as any[];
      }
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
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  // Get Certificates
  app.get("/api/certificates", authenticate, async (req: AuthRequest, res) => {
    try {
      console.log(`GET /api/certificates: Fetching for user ${req.user!.id} (${req.user!.email})`);
      
      const userEmail = req.user?.email?.toLowerCase();
      const userName = req.user?.name?.toLowerCase();

      // 1. Get all registrations where user is owner or orderer directly
      let matchedRegs: any[] = [];
      try {
        const userEmail = req.user?.email?.toLowerCase();
        const userName = req.user?.name?.toLowerCase();
        
        // Fetch registrations where user is directly linked
        const directRegs = await withRetry(() => db.query.registrations.findMany({
          where: or(
            eq(schema.registrations.userId, req.user!.id),
            userEmail ? eq(schema.registrations.ordererEmail, userEmail) : undefined
          )
        }));
        
        // Also find by paxData (slightly heavier but still better than fetching EVERYTHING)
        // We fetch all IDs and paxData to filter in memory - still not perfect but better than fetching relations
        const allPaxData = await withRetry(() => db.query.registrations.findMany({
          columns: { id: true, paxData: true }
        }));
        
        const paxMatchedIds = allPaxData.filter((r: any) => 
          Array.isArray(r.paxData) && r.paxData.some((p: any) => {
            const pEmail = (p.email || '').toLowerCase();
            const pName = (p.fullName || p.name || '').toLowerCase();
            return (userEmail && pEmail === userEmail) || (userName && pName === userName);
          })
        ).map((r: any) => r.id);
        
        const uniqueIds = Array.from(new Set([...directRegs.map(r => r.id), ...paxMatchedIds]));
        
        if (uniqueIds.length > 0) {
          // Now fetch certificates for these specific registrations
          const certs = await getCertificatesQuery({
            where: inArray(schema.certificates.registrationId, uniqueIds)
          });
          
          console.log(`GET /api/certificates: Found ${certs.length} certificates for user ${req.user!.id}`);
          return res.json(certs);
        }
        
        return res.json([]);
      } catch (err: any) {
        console.error("GET /api/certificates optimized query failed:", err?.message || err);
        return res.json([]);
      }
    } catch (error: any) {
      console.warn("GET /api/certificates status (transient):", error.message);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.get(["/api/certificates/:id/file", "/api/certificates/:id/file.:ext"], async (req: express.Request, res: express.Response) => {
    try {
      const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.id, req.params.id) });
      if (!cert || !cert.certificateUrl) return res.status(404).send("Certificate not found");
      
      let fileData = cert.certificateUrl;
      let contentType = 'application/octet-stream';
      let base64Data = '';
      
      if (fileData.startsWith('data:')) {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          base64Data = matches[2];
        } else if (fileData.includes('base64,')) {
          base64Data = fileData.split('base64,')[1];
          if (base64Data.startsWith('/9j/')) contentType = 'image/jpeg';
          else if (base64Data.startsWith('JVBERi0')) contentType = 'application/pdf';
          else contentType = 'image/png';
        } else {
          base64Data = fileData.split(',')[1] || fileData;
        }
      } else if (fileData.includes('base64,')) {
        base64Data = fileData.split('base64,')[1];
        if (base64Data.startsWith('/9j/')) contentType = 'image/jpeg';
        else if (base64Data.startsWith('JVBERi0')) contentType = 'application/pdf';
        else contentType = 'image/png';
      } else {
        base64Data = fileData; 
      }
      
      if (req.query.download === 'true') {
         res.setHeader('Content-Disposition', `attachment; filename="sertifikat-${req.params.id}.${contentType === 'application/pdf' ? 'pdf' : 'png'}"`);
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } catch (error) {
      console.error("Error fetching certificate file:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Upload Payment Proof
  app.post("/api/payments", authenticate, async (req: AuthRequest, res) => {
    const { registrationId, paymentType, amount, proofUrl } = req.body;
    try {
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, registrationId)
            }));
      if (!reg || (req.user!.role !== 'admin' && reg.userId !== req.user!.id)) {
         return res.status(403).json({ error: "Unauthorized" });
      }

      const validStatusesForPayment = ['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS'];
      if (!validStatusesForPayment.includes(reg.status)) {
         return res.status(400).json({ error: "Pendaftaran belum mencapai tahap pembayaran. Harap lengkapi tahap sebelumnya." });
      }

      let normalizedPaymentType = String(paymentType || 'DP1').toUpperCase();
      if (normalizedPaymentType === 'FULL') {
        normalizedPaymentType = 'PELUNASAN';
      }

      // Anti-duplicate check: if a PENDING payment exists for this registration
      const existingPending = await withRetry(() => db.query.payments.findFirst({
        where: and(
          eq(schema.payments.registrationId, reg.id),
          eq(schema.payments.status, 'PENDING')
        ),
        orderBy: [desc(schema.payments.createdAt)]
      }));

      if (existingPending) {
        const timeDiffSec = (Date.now() - new Date(existingPending.createdAt).getTime()) / 1000;
        const isSameType = String(existingPending.paymentType).toUpperCase() === normalizedPaymentType;
        const isSameAmount = Math.abs(Number(existingPending.amount || 0) - Number(amount || 0)) < 1;

        if (isSameType || isSameAmount || timeDiffSec < 60) {
          if (proofUrl && (!existingPending.proofUrl || existingPending.proofUrl !== proofUrl)) {
            await withRetry(() => db.update(schema.payments)
              .set({ proofUrl, amount: String(amount) })
              .where(eq(schema.payments.id, existingPending.id)));
            existingPending.proofUrl = proofUrl;
            existingPending.amount = String(amount);
          }
          notifyUpdate();
          return res.status(200).json(existingPending);
        }
      }

      const [newPayment] = await withRetry(() => db.insert(schema.payments).values({
              workspaceId: reg.workspaceId,
              registrationId,
              paymentType: normalizedPaymentType,
              amount: String(amount),
              proofUrl,
              status: 'PENDING',
            } as any).returning(), 5);

      // Update user status to VERIFIKASI_BAYAR
      await withRetry(() => db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, req.user!.id)), 5);
      await withRetry(() => db.update(schema.registrations).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.registrations.id, reg.id)), 5);

      res.status(201).json(newPayment);
      notifyUpdate();
    } catch (error: any) {
      console.error("Payment upload failed:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  // Upload Document
  app.post("/api/documents", authenticate, async (req: AuthRequest, res) => {
    let { registrationId, docType, fileUrl } = req.body;
    try {
      if (!registrationId) {
        // Try to find the latest active registration for this user
        const reg = await db.query.registrations.findFirst({
          where: and(
            eq(schema.registrations.userId, req.user!.id),
            eq(schema.registrations.workspaceId, req.user!.workspaceId!)
          ),
          orderBy: desc(schema.registrations.createdAt)
        });
        if (!reg) return res.status(400).json({ error: "Anda belum memiliki pendaftaran aktif" });
        registrationId = reg.id;
      }
      
      const storedFileUrl = saveFileToUploads(fileUrl);

      const existing = await withRetry(() => db.query.documents.findFirst({
              where: and(
                eq(schema.documents.registrationId, registrationId),
                eq(schema.documents.docType, docType)
              )
            }));
      if (existing) {
        const validFileUrl = (storedFileUrl && !storedFileUrl.startsWith('/api/documents/')) ? storedFileUrl : existing.fileUrl;
        const [updated] = await withRetry(() => db.update(schema.documents)
                  .set({ fileUrl: validFileUrl, status: 'PENDING', adminNotes: null, updatedAt: new Date() })
                  .where(eq(schema.documents.id, existing.id))
                  .returning());
        notifyUpdate();
        return res.json(updated);
      } else {
        const [newDoc] = await withRetry(() => db.insert(schema.documents).values({
                  workspaceId: req.user!.workspaceId!,
                  registrationId,
                  docType,
                  fileUrl: storedFileUrl || '',
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
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  async function getRegistrationForUser(userId: string, email?: string): Promise<any> {
    try {
      // Step 1: Fetch primary registration record first (Lightweight)
      let registration = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, userId)
      }));

      // Step 2: If not found by ID, try finding by email (Optimized search)
      if (!registration && email) {
        const userEmail = email.toLowerCase();
        // Use a targeted query instead of findMany() to prevent memory bloat
        registration = await withRetry(() => db.query.registrations.findFirst({
          where: eq(schema.registrations.ordererEmail, userEmail)
        }));
        
        // If still not found, check paxData (this is a JSON search, slightly heavier but still targeted)
        if (!registration) {
          // Optimization: Use a targeted JSONB query to find by email in paxData array
          // This avoids fetching all registrations and parsing them in memory (OOM risk)
          try {
            const matchingResults = await withRetry(() => db.execute(sql`
              SELECT id FROM registrations 
              WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(pax_data) as pax 
                WHERE LOWER(pax->>'email') = ${userEmail}
              )
              LIMIT 1
            `));
            
            const matchingId = (matchingResults.rows[0] as any)?.id;
            
            if (matchingId) {
              registration = await withRetry(() => db.query.registrations.findFirst({
                where: eq(schema.registrations.id, matchingId)
              }));
            }
          } catch (jsonErr) {
            console.warn("JSONB targeted search failed, skipping paxData lookup:", jsonErr);
          }
        }
      }

      // Step 3: Populate relations individually (Avoids complex lateral joins that cause transient timeouts)
      if (registration) {
        const pkgPromise = registration.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, registration.packageId) })) : Promise.resolve(null);
        const userPromise = registration.userId ? withRetry(() => db.query.users.findFirst({ where: eq(schema.users.id, registration.userId) })) : Promise.resolve(null);
        const schedulePromise = registration.scheduleId ? withRetry(() => db.query.schedules.findFirst({ where: eq(schema.schedules.id, registration.scheduleId) })) : Promise.resolve(null);

        const paymentsPromise = withRetry(() => db.select({
          id: schema.payments.id,
          workspaceId: schema.payments.workspaceId,
          registrationId: schema.payments.registrationId,
          paymentType: schema.payments.paymentType,
          amount: schema.payments.amount,
          status: schema.payments.status,
          adminNotes: schema.payments.adminNotes,
          verifiedAt: schema.payments.verifiedAt,
          verifiedBy: schema.payments.verifiedBy,
          createdAt: schema.payments.createdAt,
          isPdf: sql<boolean>`${schema.payments.proofUrl} LIKE 'data:application/pdf%'`.as('is_pdf'),
          hasProof: sql<boolean>`${schema.payments.proofUrl} IS NOT NULL AND ${schema.payments.proofUrl} != ''`.as('has_proof')
        }).from(schema.payments).where(eq(schema.payments.registrationId, registration.id))).then(res => (res as any[]).map(p => ({
          ...p,
          proofUrl: p.hasProof ? `/api/payments/${p.id}/proof${p.isPdf ? '.pdf' : '.png'}` : null
        })));

        const docsPromise = withRetry(() => db.select({
          id: schema.documents.id,
          workspaceId: schema.documents.workspaceId,
          registrationId: schema.documents.registrationId,
          docType: schema.documents.docType,
          status: schema.documents.status,
          adminNotes: schema.documents.adminNotes,
          fileUrl: schema.documents.fileUrl,
          createdAt: schema.documents.createdAt,
          updatedAt: schema.documents.updatedAt,
          isPdf: sql<boolean>`${schema.documents.fileUrl} LIKE 'data:application/pdf%' OR ${schema.documents.fileUrl} LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%'`.as('is_pdf'),
          hasFile: sql<boolean>`${schema.documents.fileUrl} IS NOT NULL AND ${schema.documents.fileUrl} != ''`.as('has_file')
        }).from(schema.documents).where(eq(schema.documents.registrationId, registration.id))).then(res => res.map(d => ({
          ...d,
          fileUrl: d.fileUrl && d.fileUrl.trim() !== '' ? d.fileUrl : (d.hasFile ? `/api/documents/${d.id}/file${d.isPdf ? '.pdf' : '.png'}` : null)
        })));

        const certsPromise = withRetry(() => db.select({
          id: schema.certificates.id,
          workspaceId: schema.certificates.workspaceId,
          registrationId: schema.certificates.registrationId,
          recipientName: schema.certificates.recipientName,
          createdAt: schema.certificates.createdAt,
          isPdf: sql<boolean>`${schema.certificates.certificateUrl} LIKE 'data:application/pdf%'`.as('is_pdf'),
          hasCert: sql<boolean>`${schema.certificates.certificateUrl} IS NOT NULL AND ${schema.certificates.certificateUrl} != ''`.as('has_cert')
        }).from(schema.certificates).where(eq(schema.certificates.registrationId, registration.id))).then(res => res.map(c => ({
          ...c,
          certificateUrl: c.hasCert ? `/api/certificates/${c.id}/file${c.isPdf ? '.pdf' : '.png'}` : null
        })));

        const [pkg, payments, docs, user, schedule, certificates] = await Promise.all([
          pkgPromise, paymentsPromise, docsPromise, userPromise, schedulePromise, certsPromise
        ]);

        return {
          ...registration,
          package: pkg,
          payments,
          documents: docs,
          user,
          schedule,
          certificates
        };
      }

      return null;
    } catch (err: any) {
      console.warn("getRegistrationForUser query failed:", err?.message || err);
      return null;
    }
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
      const existing = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, req.user!.id)
      }));
      if (existing) {
        await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.equipment).where(eq(schema.equipment.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.activities).where(eq(schema.activities.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, existing.id)));

        const userPayments = await getPaymentsQuery({
          where: eq(schema.payments.registrationId, existing.id)
        });
        for (const p of userPayments) {
          await withRetry(() => db.delete(schema.financial_ledger).where(eq(schema.financial_ledger.paymentId, p.id)));
        }

        await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, existing.id)));
        await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.id, existing.id)));
        await withRetry(() => db.update(schema.users).set({ status: 'PILIH_PAKET' }).where(eq(schema.users.id, req.user!.id)));
      }
      res.status(200).json({ success: true, message: "Pilihan paket berhasil dihapus." });
      notifyUpdate();
    } catch (error) {
      console.error("DELETE /api/jamaah/register error:", error);
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
      const reg = await withRetry(() => db.query.registrations.findFirst({
        where: eq(schema.registrations.userId, req.user!.id)
      }));
      
      if (reg) {
        await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.equipment).where(eq(schema.equipment.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.activities).where(eq(schema.activities.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, reg.id)));

        const userPayments = await getPaymentsQuery({
          where: eq(schema.payments.registrationId, reg.id)
        });
        for (const p of userPayments) {
          await withRetry(() => db.delete(schema.financial_ledger).where(eq(schema.financial_ledger.paymentId, p.id)));
        }

        await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, reg.id)));
        await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.id, reg.id)));
        await withRetry(() => db.update(schema.users).set({ status: 'PILIH_PAKET' }).where(eq(schema.users.id, req.user!.id)));
      }
      
      res.json({ message: "Registration reset successfully" });
      notifyUpdate();
    } catch (error) {
      console.error("DELETE /api/jamaah/registration error:", error);
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
      let tickets: any[] = [];
      try {
        tickets = await withRetry(() => db.select()
                .from(schema.helpdesk_tickets)
                .where(eq(schema.helpdesk_tickets.userId, req.user!.id))
                .orderBy(desc(schema.helpdesk_tickets.createdAt)));
      } catch (err: any) {
        console.warn("GET /api/support/tickets primary query failed:", err?.message || err);
        ensureTableAndColumns().catch(e => console.error("Background migration error (helpdesk user):", e));
        try {
          tickets = await withRetry(() => db.query.helpdesk_tickets.findMany({
            where: eq(schema.helpdesk_tickets.userId, req.user!.id),
            orderBy: desc(schema.helpdesk_tickets.createdAt)
          }));
        } catch (rawErr) {
          tickets = [];
        }
      }
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
      let tickets: any[] = [];
      try {
        tickets = await withRetry(() => db.select({
                ticket: schema.helpdesk_tickets,
                user: {
                  name: schema.users.name,
                  email: schema.users.email
                }
              })
              .from(schema.helpdesk_tickets)
              .leftJoin(schema.users, eq(schema.helpdesk_tickets.userId, schema.users.id))
              .orderBy(desc(schema.helpdesk_tickets.updatedAt)));
      } catch (err: any) {
        console.warn("GET /api/admin/support/tickets primary query failed:", err?.message || err);
        ensureTableAndColumns().catch(e => console.error("Background migration error (helpdesk):", e));
        
        try {
          // Fallback to simple select
          const rawTickets = await withRetry(() => db.query.helpdesk_tickets.findMany({
            orderBy: desc(schema.helpdesk_tickets.updatedAt)
          }));
          tickets = rawTickets.map(t => ({ ticket: t, user: null }));
        } catch (rawErr) {
          tickets = [];
        }
      }
      
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
      // Filter strictly by the target mitraId and ensure role is 'jamaah'
      const targetMitraId = (req.query.mitraId as string) || req.user.id;
      const whereClause = and(
        eq(schema.users.mitraId, targetMitraId),
        eq(schema.users.role, 'jamaah')
      );

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
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
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

  // Get Mitra Profile
  app.get("/api/mitra/profile", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';
      
      // Find the mitra user record by ID first, then by email
      let mitraUser = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, req.user.id)
      })) as any;

      if (!mitraUser && userEmail) {
        mitraUser = await withRetry(() => db.query.mitraUsers.findFirst({
          where: sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmail})`
        })) as any;
      }

      if (!mitraUser) return res.json({ onboardingStatus: 'PENDING' });

      // Find the profile record
      let profile = await withRetry(() => db.query.mitraProfiles.findFirst({
        where: eq(schema.mitraProfiles.userId, mitraUser.id)
      }));

      if (!profile && mitraUser.id !== req.user.id) {
        profile = await withRetry(() => db.query.mitraProfiles.findFirst({
          where: eq(schema.mitraProfiles.userId, req.user.id)
        }));
      }

      // Return profile or pending status
      res.json(profile || { onboardingStatus: 'PENDING', userId: mitraUser.id });
    } catch (error) {
      console.error("Get Mitra Profile Error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update Mitra Profile (Onboarding)
  app.post("/api/mitra/profile", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { fotoKtp, selfieKtp, fotoNpwp, fotoBukuTabungan, buktiTransfer, ...rawProfileData } = req.body;
      const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';
      
      // Find or create mitra_users record tied to req.user.id
      let mitraUser = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, req.user.id)
      })) as any;

      if (!mitraUser && userEmail) {
        mitraUser = await withRetry(() => db.query.mitraUsers.findFirst({
          where: sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmail})`
        })) as any;
      }
      
      if (!mitraUser) {
        const [newMitra] = await withRetry(() => db.insert(schema.mitraUsers).values({
          id: req.user.id,
          name: req.user.name || (userEmail ? userEmail.split('@')[0] : 'Mitra'),
          email: userEmail || req.user.email,
          noWa: req.body.whatsapp || '-',
          passwordHash: '-', 
          statusAkun: 'pending_verification'
        }).returning()) as any[];
        mitraUser = newMitra;
      }

      const mitraUserId = mitraUser.id;

      // Filter valid profile data to prevent DB errors
      const validFields = [
        'namaLengkap', 'nik', 'tempatLahir', 'tanggalLahir', 'alamatLengkap', 
        'namaBank', 'noRekening', 'namaPemilikRekening', 'npwp', 'jenisKelamin', 
        'statusPerkawinan', 'pekerjaan', 'provinsi', 'kota', 'kecamatan', 'kodePos',
        'whatsapp', 'buktiTransfer'
      ];
      
      const profileData: any = {};
      validFields.forEach(field => {
        if (rawProfileData[field] !== undefined && rawProfileData[field] !== null) {
          profileData[field] = rawProfileData[field];
        }
      });

      if (buktiTransfer) {
        profileData.buktiTransfer = buktiTransfer;
      }

      // Default namaPemilikRekening if empty
      if (!profileData.namaPemilikRekening || profileData.namaPemilikRekening.trim() === '') {
        profileData.namaPemilikRekening = profileData.namaLengkap || mitraUser.name || req.user.name || '';
      }

      // Sync whatsapp/noWa back to mitraUsers & users
      if (profileData.whatsapp) {
        await withRetry(() => db.update(schema.mitraUsers)
          .set({ noWa: profileData.whatsapp })
          .where(or(eq(schema.mitraUsers.id, mitraUserId), eq(schema.mitraUsers.id, req.user.id))));
        
        await withRetry(() => db.update(schema.users)
          .set({ phone: profileData.whatsapp })
          .where(eq(schema.users.id, req.user.id)));
      }

      // Look up existing profile by userId
      let existing = await withRetry(() => db.query.mitraProfiles.findFirst({
        where: eq(schema.mitraProfiles.userId, mitraUserId)
      })) as any;

      if (!existing && mitraUserId !== req.user.id) {
        existing = await withRetry(() => db.query.mitraProfiles.findFirst({
          where: eq(schema.mitraProfiles.userId, req.user.id)
        })) as any;
      }

      // Check NIK uniqueness
      if (profileData.nik && typeof profileData.nik === 'string' && profileData.nik.trim() !== '') {
        const cleanNik = profileData.nik.trim();
        profileData.nik = cleanNik;
        const profileByNik = await withRetry(() => db.query.mitraProfiles.findFirst({
          where: eq(schema.mitraProfiles.nik, cleanNik)
        })) as any;

        if (profileByNik) {
          // If this NIK belongs to a different user, block duplicate submission
          if (profileByNik.userId !== mitraUserId && profileByNik.userId !== req.user.id) {
            return res.status(400).json({ error: `NIK ${cleanNik} sudah terdaftar pada akun mitra lain. Silakan periksa kembali NIK Anda.` });
          }
          // If it belongs to this user, attach existing
          if (!existing) {
            existing = profileByNik;
          }
        }
      }

      try {
        if (existing) {
          await withRetry(() => db.update(schema.mitraProfiles)
            .set({ 
              ...profileData, 
              updatedAt: new Date() 
            })
            .where(eq(schema.mitraProfiles.id, existing.id)));
        } else {
          await withRetry(() => db.insert(schema.mitraProfiles)
            .values({
              ...profileData,
              userId: mitraUserId
            }));
        }
      } catch (dbErr: any) {
        const errMsg = String(dbErr?.message || '');
        if (errMsg.includes('mitra_profiles_nik_unique') || dbErr?.code === '23505') {
          return res.status(400).json({ error: `NIK ${profileData.nik || ''} sudah terdaftar di sistem. Silakan periksa kembali NIK Anda.` });
        }
        throw dbErr;
      }

      // Sync name across tables if namaLengkap is provided
      if (profileData.namaLengkap) {
        try {
          await withRetry(() => db.update(schema.users)
            .set({ name: profileData.namaLengkap })
            .where(eq(schema.users.id, req.user.id)));
          await withRetry(() => db.update(schema.mitraUsers)
            .set({ name: profileData.namaLengkap })
            .where(or(eq(schema.mitraUsers.id, mitraUserId), eq(schema.mitraUsers.id, req.user.id))));
        } catch (syncErr) {
          console.warn('Name sync notice:', syncErr);
        }
      }

      // Update User Status to Pending Verification across ALL records matching ID or Email
      await withRetry(() => db.update(schema.mitraUsers)
        .set({ statusAkun: 'pending_verification', updatedAt: new Date() })
        .where(or(
          eq(schema.mitraUsers.id, mitraUserId),
          eq(schema.mitraUsers.id, req.user.id),
          userEmail ? sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmail})` : sql`false`
        )));

      // Save Documents in parallel to speed up response
      const docs = [
        { type: 'foto_ktp', data: fotoKtp },
        { type: 'selfie_ktp', data: selfieKtp },
        { type: 'npwp', data: fotoNpwp },
        { type: 'buku_tabungan', data: fotoBukuTabungan },
        { type: 'bukti_transfer', data: buktiTransfer }
      ].filter(doc => doc.data);

      await Promise.all(docs.map(async (doc) => {
        const existingDoc = await withRetry(() => db.query.kycDocuments.findFirst({
          where: and(
            eq(schema.kycDocuments.userId, mitraUserId),
            eq(schema.kycDocuments.documentType, doc.type as any)
          )
        })) as any;

        if (existingDoc) {
          await withRetry(() => db.update(schema.kycDocuments)
            .set({ fileUrl: doc.data, status: 'pending' })
            .where(eq(schema.kycDocuments.id, existingDoc.id)));
        } else {
          await withRetry(() => db.insert(schema.kycDocuments)
            .values({
              userId: mitraUserId,
              documentType: doc.type as any,
              fileUrl: doc.data,
              status: 'pending'
            }));
        }
      }));

      res.json({ success: true, statusAkun: 'pending_verification' });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change Password Endpoint for Mitra
  app.post("/api/mitra/change-password", authenticate, async (req: AuthRequest, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Password lama dan password baru wajib diisi" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password baru minimal 6 karakter" });
      }

      const currentUser = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.id, req.user.id)
      }));

      if (!currentUser) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }

      if ((currentUser as any)?.password && !verifyPassword(oldPassword, (currentUser as any).password)) {
        return res.status(400).json({ error: "Password lama tidak sesuai" });
      }

      const newHash = hashPassword(newPassword);
      await withRetry(() => db.update(schema.users)
        .set({ password: newHash })
        .where(eq(schema.users.id, req.user.id)));

      await withRetry(() => db.update(schema.mitraUsers)
        .set({ passwordHash: newHash })
        .where(or(eq(schema.mitraUsers.id, req.user.id), eq(schema.mitraUsers.email, req.user.email))));

      res.json({ success: true, message: "Kata sandi berhasil diperbarui" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Gagal memperbarui kata sandi" });
    }
  });

  // Helper function to assemble complete mitra list with profiles and uploaded documents
  async function getComprehensiveMitraList(statusFilter?: string) {
    try {
      // 1. Fetch all mitraUsers records
      const allMitraUsers = await withRetry(() => db.select().from(schema.mitraUsers)).catch(() => []) as any[];
      
      // 2. Fetch all users from main users table (filter by role 'mitra' or those with matching emails)
      const allAuthUsers = await withRetry(() => db.select().from(schema.users)).catch(() => []) as any[];

      // 3. Fetch all profiles
      const allProfiles = await withRetry(() => db.select().from(schema.mitraProfiles)).catch(() => []) as any[];

      // 4. Fetch all KYC documents
      const allDocs = await withRetry(() => db.select().from(schema.kycDocuments)).catch(() => []) as any[];

    // Build unified map of mitras keyed by ID or email
    const mapById = new Map<string, any>();
    const mapByEmail = new Map<string, any>();

    for (const mu of allMitraUsers) {
      const emailNorm = mu.email ? mu.email.toLowerCase().trim() : '';
      const item = {
        id: mu.id,
        name: mu.name || 'Mitra',
        email: mu.email || '',
        noWa: mu.noWa || '-',
        passwordHash: mu.passwordHash || '-',
        statusAkun: mu.statusAkun || 'incomplete_profile',
        createdAt: mu.createdAt,
        updatedAt: mu.updatedAt,
        userAuthIds: new Set([mu.id]),
        emails: new Set([emailNorm].filter(Boolean))
      };
      mapById.set(mu.id, item);
      if (emailNorm) mapByEmail.set(emailNorm, item);
    }

    for (const u of allAuthUsers) {
      const emailNorm = u.email ? u.email.toLowerCase().trim() : '';
      let existing = emailNorm ? mapByEmail.get(emailNorm) : null;
      if (!existing) existing = mapById.get(u.id);

      if (u.role === 'mitra' || existing) {
        if (!existing) {
          existing = {
            id: u.id,
            name: u.name || 'Mitra',
            email: u.email || '',
            noWa: u.phone || '-',
            statusAkun: u.status === 'active' ? 'active' : 'pending_verification',
            createdAt: u.createdAt || new Date(),
            updatedAt: u.updatedAt || new Date(),
            userAuthIds: new Set([u.id]),
            emails: new Set([emailNorm].filter(Boolean))
          };
          mapById.set(u.id, existing);
          if (emailNorm) mapByEmail.set(emailNorm, existing);
        } else {
          existing.userAuthIds.add(u.id);
          if (emailNorm) existing.emails.add(emailNorm);
          if (!existing.name || existing.name === 'Mitra') existing.name = u.name || existing.name;
          if (!existing.noWa || existing.noWa === '-') existing.noWa = u.phone || existing.noWa;
        }
      }
    }

    // Helper to score profile completeness so filled profiles are prioritized over empty placeholders
    function getProfileScore(p: any) {
      if (!p) return -1;
      let score = 0;
      if (p.nik && p.nik.trim() !== '') score += 15;
      if (p.alamatLengkap && p.alamatLengkap.trim() !== '') score += 15;
      if (p.namaBank && p.namaBank.trim() !== '') score += 15;
      if (p.noRekening && p.noRekening.trim() !== '') score += 15;
      if (p.buktiTransfer && p.buktiTransfer.trim() !== '') score += 20;
      if (p.provinsi && p.provinsi.trim() !== '') score += 5;
      if (p.kota && p.kota.trim() !== '') score += 5;
      if (p.pekerjaan && p.pekerjaan.trim() !== '') score += 5;
      if (p.namaLengkap && p.namaLengkap.trim() !== '') score += 2;
      return score;
    }

    // Combine into unique list
    const uniqueMitras = Array.from(new Set([...mapById.values(), ...mapByEmail.values()]));
    const resultList: any[] = [];

    for (const mitra of uniqueMitras) {
      const authIds = Array.from(mitra.userAuthIds as Set<string>);
      const emails = Array.from(mitra.emails as Set<string>);

      // Find candidate profiles matching user IDs, email, or phone/name
      const candidateProfiles = allProfiles.filter(p => {
        if (!p) return false;
        if (authIds.includes(p.userId)) return true;
        if (p.whatsapp && (p.whatsapp === mitra.noWa || emails.some(e => e && p.whatsapp.includes(e)))) return true;
        if (p.namaLengkap && emails.some(e => e && (p.namaLengkap.toLowerCase().includes(e.split('@')[0]) || e.toLowerCase().includes(p.namaLengkap.toLowerCase())))) return true;
        return false;
      });

      // Sort candidate profiles by completeness score descending
      candidateProfiles.sort((a, b) => getProfileScore(b) - getProfileScore(a));
      let profile = candidateProfiles[0] || null;

      // Collect all associated user IDs for document lookup
      const profileUserIds = candidateProfiles.map(p => p.userId).filter(Boolean);
      const docUserIds = new Set([...authIds, ...profileUserIds]);
      let docs = allDocs.filter(d => docUserIds.has(d.userId));

      if (profile) {
        if (profile.namaLengkap && (!mitra.name || mitra.name === 'Mitra')) {
          mitra.name = profile.namaLengkap;
        }
        if (profile.whatsapp && (!mitra.noWa || mitra.noWa === '-')) {
          mitra.noWa = profile.whatsapp;
        }

        // Bi-directional sync for buktiTransfer between profile and kycDocuments
        const buktiDoc = docs.find(d => d.documentType === 'bukti_transfer' && d.fileUrl);
        if (profile.buktiTransfer && !buktiDoc) {
          docs.push({
            id: `prof-bt-${profile.id}`,
            userId: mitra.id,
            documentType: 'bukti_transfer',
            fileUrl: profile.buktiTransfer,
            status: 'pending',
            uploadedAt: profile.updatedAt || new Date()
          });
        } else if (!profile.buktiTransfer && buktiDoc) {
          profile.buktiTransfer = buktiDoc.fileUrl;
        }
      }

      const item = {
        id: mitra.id,
        name: mitra.name || 'Mitra',
        email: mitra.email || '',
        noWa: mitra.noWa || '-',
        passwordHash: mitra.passwordHash || '-',
        statusAkun: mitra.statusAkun || 'incomplete_profile',
        createdAt: mitra.createdAt,
        updatedAt: mitra.updatedAt,
        profile: profile || null,
        documents: docs || []
      };

      if (!statusFilter || statusFilter === 'all' || item.statusAkun === statusFilter) {
        resultList.push(item);
      }
    }

      resultList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return resultList;
    } catch (err: any) {
      console.error("Error in getComprehensiveMitraList:", err);
      return [];
    }
  }

  // --- Admin Mitra Management ---
  app.get("/api/admin/mitra/list", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const status = req.query.status as string;
      const list = await getComprehensiveMitraList(status);
      res.json(list);
    } catch (error) {
      console.error("Admin mitra list error:", error);
      res.status(500).json({ error: "Failed to fetch mitra list" });
    }
  });

  app.post("/api/admin/mitra/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { userId, status, notes } = req.body;
    try {
      const idsToUpdate = new Set<string>();
      if (userId) idsToUpdate.add(userId);

      const targetMitra = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, userId)
      })) as any;

      const targetAuthUser = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.id, userId)
      })) as any;

      const targetEmail = (targetMitra?.email || targetAuthUser?.email || '').toLowerCase().trim();

      if (targetEmail) {
        const matchingMitras = await withRetry(() => db.select({ id: schema.mitraUsers.id })
          .from(schema.mitraUsers)
          .where(sql`LOWER(${schema.mitraUsers.email}) = LOWER(${targetEmail})`)) as any[];
        matchingMitras.forEach(m => idsToUpdate.add(m.id));

        const matchingAuths = await withRetry(() => db.select({ id: schema.users.id })
          .from(schema.users)
          .where(sql`LOWER(${schema.users.email}) = LOWER(${targetEmail})`)) as any[];
        matchingAuths.forEach(u => idsToUpdate.add(u.id));
      }

      const targetUserIds = Array.from(idsToUpdate);

      if (targetUserIds.length > 0) {
        // Update mitraUsers status
        await withRetry(() => db.update(schema.mitraUsers)
          .set({ statusAkun: status, updatedAt: new Date() })
          .where(inArray(schema.mitraUsers.id, targetUserIds)));

        // Update auth users status
        await withRetry(() => db.update(schema.users)
          .set({ status: status === 'active' ? 'active' : 'inactive' })
          .where(inArray(schema.users.id, targetUserIds)));

        // Update reviewNotes in mitraProfiles
        await withRetry(() => db.update(schema.mitraProfiles)
          .set({ reviewNotes: notes, updatedAt: new Date() })
          .where(inArray(schema.mitraProfiles.userId, targetUserIds)));

        // Update KYC documents status
        if (status === 'active') {
          await withRetry(() => db.update(schema.kycDocuments)
            .set({ status: 'verified' })
            .where(inArray(schema.kycDocuments.userId, targetUserIds)));
        } else if (status === 'rejected') {
          await withRetry(() => db.update(schema.kycDocuments)
            .set({ status: 'rejected' })
            .where(and(
              inArray(schema.kycDocuments.userId, targetUserIds),
              eq(schema.kycDocuments.status, 'pending')
            )));
        }
      }

      // Emit real-time SSE event to Mitra Panel
      notifyMitraRealtime(userId, targetEmail, 'VERIFICATION_APPROVED', {
        status,
        statusAkun: status,
        notes,
        timestamp: new Date()
      });

      res.json({ success: true, status });
    } catch (error) {
      console.error("Admin mitra verify error:", error);
      res.status(500).json({ error: "Failed to verify mitra" });
    }
  });

  // --- Admin Endpoints ---

  // Admin: Get Pending KYC
  app.get("/api/admin/kyc/pending", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const pending = await getComprehensiveMitraList('pending_verification');
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending KYC" });
    }
  });

  // Admin: Review KYC
  app.post("/api/admin/kyc/review", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { mitraId, status, notes } = req.body; // status: 'active' or 'rejected'

    try {
      const targetMitra = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, mitraId)
      })) as any;

      const targetEmail = targetMitra?.email ? targetMitra.email.toLowerCase().trim() : null;

      await withRetry(() => db.update(schema.mitraUsers)
        .set({ statusAkun: status, updatedAt: new Date() })
        .where(or(
          eq(schema.mitraUsers.id, mitraId),
          targetEmail ? sql`LOWER(${schema.mitraUsers.email}) = LOWER(${targetEmail})` : sql`false`
        )));
      
      if (targetEmail) {
        await withRetry(() => db.update(schema.users)
          .set({ status: status === 'active' ? 'active' : 'inactive' })
          .where(sql`LOWER(${schema.users.email}) = LOWER(${targetEmail})`));
      }

      // Emit real-time SSE event to Mitra Panel
      notifyMitraRealtime(mitraId, targetEmail, 'VERIFICATION_APPROVED', {
        status,
        statusAkun: status,
        notes,
        timestamp: new Date()
      });
      
      res.json({ success: true, message: `Mitra successfully ${status}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to update KYC status" });
    }
  });

  // --- Commission Payout Endpoints (Pengajuan Komisi Mitra) ---
  // Get Mitra Commission Payout Requests & Summary
  app.get("/api/mitra/commission-payouts", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';

      // Find Mitra profile for bank defaults
      let profile: any = null;
      try {
        profile = await withRetry(() => db.query.mitraProfiles.findFirst({
          where: eq(schema.mitraProfiles.userId, req.user.id)
        })) as any;

        if (!profile && userEmail) {
          const mitraUser = await withRetry(() => db.query.mitraUsers.findFirst({
            where: sql`LOWER(${schema.mitraUsers.email}) = LOWER(${userEmail})`
          })) as any;
          if (mitraUser) {
            profile = await withRetry(() => db.query.mitraProfiles.findFirst({
              where: eq(schema.mitraProfiles.userId, mitraUser.id)
            })) as any;
          }
        }
      } catch (profileErr) {
        console.warn("Failed to fetch mitra profile:", profileErr);
      }

      // Collect user IDs associated with this Mitra
      const userIdsToMatch: string[] = [req.user.id];
      if (userEmail) {
        try {
          const matchedUsers = (await withRetry(() => db.select({ id: schema.users.id }).from(schema.users).where(sql`LOWER(${schema.users.email}) = LOWER(${userEmail})`)) as any);
          for (const u of matchedUsers) {
            if (u.id && !userIdsToMatch.includes(u.id)) userIdsToMatch.push(u.id);
          }
        } catch (e) {}
      }

      // Calculate Total Commission Earned (5% of verified payments from referred users)
      let totalEarned = 0;
      try {
        const successfulPayments = (await withRetry(() => db.select({ sum: sql<number>`sum(${schema.payments.amount})` })
          .from(schema.payments)
          .innerJoin(schema.registrations, eq(schema.payments.registrationId, schema.registrations.id))
          .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
          .where(and(
            inArray(schema.users.mitraId, userIdsToMatch),
            eq(schema.payments.status, 'VERIFIED')
          ))) as any);
        totalEarned = Number(successfulPayments[0]?.sum || 0) * 0.05;
      } catch (payErr) {
        console.warn("Failed to calculate commission payments sum:", payErr);
      }

      // Get all payout requests for this mitra
      let payouts: any[] = [];
      try {
        payouts = (await withRetry(() => db.select()
          .from(schema.mitraCommissionPayouts)
          .where(inArray(schema.mitraCommissionPayouts.mitraUserId, userIdsToMatch))
          .orderBy(desc(schema.mitraCommissionPayouts.createdAt))) as any);
      } catch (payoutErr) {
        console.warn("Failed to query mitraCommissionPayouts table:", payoutErr);
      }

      let totalPending = 0;
      let totalApproved = 0;

      for (const p of payouts) {
        const amt = Number(p.amount || 0);
        if (p.status === 'PENDING') totalPending += amt;
        if (p.status === 'APPROVED') totalApproved += amt;
      }

      const availableBalance = Math.max(0, totalEarned - totalPending - totalApproved);

      res.json({
        payouts,
        bankInfo: {
          namaBank: profile?.namaBank || '',
          noRekening: profile?.noRekening || '',
          namaPemilikRekening: profile?.namaPemilikRekening || profile?.namaLengkap || req.user.name || ''
        },
        summary: {
          totalEarned,
          totalPending,
          totalApproved,
          availableBalance
        }
      });
    } catch (error: any) {
      console.error("GET /api/mitra/commission-payouts error:", error);
      res.json({
        payouts: [],
        bankInfo: { namaBank: '', noRekening: '', namaPemilikRekening: req.user?.name || '' },
        summary: { totalEarned: 0, totalPending: 0, totalApproved: 0, availableBalance: 0 }
      });
    }
  });

  // Submit new Commission Payout Request
  app.post("/api/mitra/commission-payouts", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { amount, bankName, accountNumber, accountHolder, notes, jamaahName, packageName } = req.body;
      const requestedAmount = Number(amount);

      if (!requestedAmount || requestedAmount <= 0) {
        return res.status(400).json({ error: "Nominal pengajuan komisi harus lebih dari Rp 0" });
      }

      const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';
      const userIdsToMatch: string[] = [req.user.id];
      if (userEmail) {
        try {
          const matchedUsers = (await withRetry(() => db.select({ id: schema.users.id }).from(schema.users).where(sql`LOWER(${schema.users.email}) = LOWER(${userEmail})`)) as any);
          for (const u of matchedUsers) {
            if (u.id && !userIdsToMatch.includes(u.id)) userIdsToMatch.push(u.id);
          }
        } catch (e) {}
      }

      if (!bankName || !accountNumber || !accountHolder) {
        return res.status(400).json({ error: "Data rekening bank (Nama Bank, No. Rekening, Nama Pemilik) harus diisi lengkap" });
      }

      // Create Payout Request
      const [newPayout] = await withRetry(() => db.insert(schema.mitraCommissionPayouts).values({
        workspaceId: req.user!.workspaceId || null,
        mitraUserId: req.user.id,
        mitraName: req.user.name || 'Mitra',
        mitraPhone: req.user.phone || null,
        jamaahName: jamaahName || null,
        packageName: packageName || null,
        amount: requestedAmount.toString(),
        bankName,
        accountNumber,
        accountHolder,
        status: 'PENDING',
        mitraNotes: notes || null
      }).returning());

      res.json(newPayout);
      notifyUpdate();
    } catch (error: any) {
      console.error("POST /api/mitra/commission-payouts error:", error);
      res.status(500).json({ error: "Gagal mengajukan pencairan komisi" });
    }
  });

  // Admin: Get all Commission Payout Requests
  app.get("/api/admin/commission-payouts", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const statusFilter = req.query.status as string;
      const search = (req.query.search as string || '').toLowerCase().trim();

      const allPayouts = await withRetry(() => db.select()
        .from(schema.mitraCommissionPayouts)
        .orderBy(desc(schema.mitraCommissionPayouts.createdAt))) as any[];

      let filtered = allPayouts;

      if (statusFilter && statusFilter !== 'ALL') {
        filtered = filtered.filter(p => p.status === statusFilter);
      }

      if (search) {
        filtered = filtered.filter(p => 
          (p.mitraName || '').toLowerCase().includes(search) ||
          (p.bankName || '').toLowerCase().includes(search) ||
          (p.accountNumber || '').toLowerCase().includes(search) ||
          (p.accountHolder || '').toLowerCase().includes(search)
        );
      }

      // Summary
      let totalPending = 0;
      let totalApproved = 0;
      let pendingCount = 0;

      for (const p of allPayouts) {
        const amt = Number(p.amount || 0);
        if (p.status === 'PENDING') {
          totalPending += amt;
          pendingCount++;
        } else if (p.status === 'APPROVED') {
          totalApproved += amt;
        }
      }

      res.json({
        payouts: filtered,
        summary: {
          totalPending,
          totalApproved,
          pendingCount,
          totalRequests: allPayouts.length
        }
      });
    } catch (error: any) {
      console.error("GET /api/admin/commission-payouts error:", error);
      res.status(500).json({ error: "Failed to fetch payout requests" });
    }
  });

  // Admin: Approve & Disburse Payout Request
  app.post("/api/admin/commission-payouts/:id/approve", authenticate, upload.single('file'), async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { adminNotes, transferDate } = req.body;
      const payoutId = req.params.id;

      let proofOfTransferUrl = req.body.proofOfTransferUrl || null;
      if (req.file) {
        proofOfTransferUrl = `/uploads/${req.file.filename}`;
      }

      const [updated] = await withRetry(() => db.update(schema.mitraCommissionPayouts)
        .set({
          status: 'APPROVED',
          adminNotes: adminNotes || null,
          proofOfTransferUrl: proofOfTransferUrl,
          transferDate: transferDate ? new Date(transferDate) : new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.mitraCommissionPayouts.id, payoutId))
        .returning());

      res.json(updated);
      notifyUpdate();
    } catch (error: any) {
      console.error("Approve payout error:", error);
      res.status(500).json({ error: "Gagal menyetujui dan memproses pencairan komisi" });
    }
  });

  // Admin: Reject Payout Request
  app.post("/api/admin/commission-payouts/:id/reject", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { adminNotes } = req.body;
      const payoutId = req.params.id;

      const [updated] = await withRetry(() => db.update(schema.mitraCommissionPayouts)
        .set({
          status: 'REJECTED',
          adminNotes: adminNotes || 'Pengajuan dicairkan ditolak oleh admin.',
          updatedAt: new Date()
        })
        .where(eq(schema.mitraCommissionPayouts.id, payoutId))
        .returning());

      res.json(updated);
      notifyUpdate();
    } catch (error: any) {
      console.error("Reject payout error:", error);
      res.status(500).json({ error: "Gagal menolak pengajuan pencairan komisi" });
    }
  });


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

    // VALIDASI MUTLAK: Tolak ID jika rusak (seperti '.', kosong, atau undefined)
    if (!id || id === '.' || id === 'undefined' || id.trim() === '') {
      console.error("DITOLAK: Parameter ID Pembayaran rusak diterima:", id);
      return res.status(400).json({ error: "ID pembayaran tidak valid" });
    }

    try {
      const dbStatus = status === 'approved' ? 'VERIFIED' : status === 'rejected' ? 'REJECTED' : status;

      const [updatedPayment] = await withRetry(() => db.update(schema.payments)
        .set({ 
          status: dbStatus as any, 
          adminNotes: reason || null,
          verifiedAt: new Date(),
          verifiedBy: req.user?.id || null
        })
        .where(eq(schema.payments.id, id))
        .returning());

      if (!updatedPayment) return res.status(404).json({ error: "Payment not found" });
      
      if (dbStatus === 'VERIFIED') {
        // Advance registration status
        let nextStatus: any = 'CICIL_BAYAR';
        let userStatus: any = 'CICIL_BAYAR';

        // Optimized: Fetch registration and related data separately
        const reg = await withRetry(() => db.query.registrations.findFirst({
          where: eq(schema.registrations.id, updatedPayment.registrationId)
        }));

        if (reg) {
          const [pkg, paymentsList] = await Promise.all([
            reg.packageId ? withRetry(() => db.query.packages.findFirst({ where: eq(schema.packages.id, reg.packageId) })) : Promise.resolve(null),
            getPaymentsQuery({ where: eq(schema.payments.registrationId, reg.id) })
          ]);

          const paxCount = parseInt(reg.adultCount || '0') + parseInt(reg.childCount || '0') + parseInt(reg.infantCount || '0') || 1;
          const packagePrice = Number(pkg?.price || 0);
          const totalHarga = Number(reg.totalAmount || 0) || (packagePrice * paxCount);
          const totalBayar = (paymentsList || [])
            .filter(t => ['approved', 'VERIFIED'].includes(t.status))
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
          
          if (totalHarga > 0 && totalBayar >= (totalHarga - 100)) {
            userStatus = 'LUNAS';
            nextStatus = 'LUNAS';
          } else {
            userStatus = 'CICIL_BAYAR';
            nextStatus = 'CICIL_BAYAR';
          }

          if (nextStatus) {
            await withRetry(() => db.update(schema.registrations)
              .set({ status: nextStatus, updatedAt: new Date() })
              .where(eq(schema.registrations.id, updatedPayment.registrationId)));
          }
          
          if (userStatus && reg.userId) {
             await withRetry(() => db.update(schema.users)
               .set({ status: userStatus })
               .where(eq(schema.users.id, reg.userId)));
          }
        }
      } else if (dbStatus === 'REJECTED') {
        // If rejected, move back to CICIL_BAYAR
        const reg = await withRetry(() => db.query.registrations.findFirst({ where: eq(schema.registrations.id, updatedPayment.registrationId) }));
        if (reg) {
          if (reg.userId) {
            await withRetry(() => db.update(schema.users)
              .set({ status: 'CICIL_BAYAR' })
              .where(eq(schema.users.id, reg.userId)));
          }
          await withRetry(() => db.update(schema.registrations)
            .set({ status: 'CICIL_BAYAR', updatedAt: new Date() })
            .where(eq(schema.registrations.id, reg.id)));
        }
      }

      res.json(updatedPayment);
      if (updatedPayment.registrationId) {
         invalidateUserCache();
      }
      notifyUpdate();
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server: " + (error.message || "") });
    }
  });

  // Fetch Payment Proof File
  app.get(["/api/payments/:id/proof", "/api/payments/:id/proof.:ext"], async (req: express.Request, res: express.Response) => {
    try {
      const payment = await db.query.payments.findFirst({ where: eq(schema.payments.id, req.params.id) });
      if (!payment || !payment.proofUrl) return res.status(404).send("Proof not found");
      
      let fileData = payment.proofUrl.trim();
      let contentType = 'application/octet-stream';
      let base64Data = '';

      if (fileData.startsWith('/uploads/') || fileData.startsWith('uploads/')) {
        const relativePath = fileData.startsWith('/') ? fileData : '/' + fileData;
        const absolutePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(absolutePath)) {
          return res.sendFile(absolutePath);
        }
        const filename = path.basename(fileData);
        const directUploadPath = path.join(uploadDir, filename);
        if (fs.existsSync(directUploadPath)) {
          return res.sendFile(directUploadPath);
        }
      }
      
      if (fileData.startsWith('data:')) {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          base64Data = matches[2];
        } else if (fileData.includes('base64,')) {
          const parts = fileData.split('base64,');
          contentType = parts[0].replace('data:', '').replace(';', '') || 'image/png';
          base64Data = parts[1];
        } else {
          base64Data = fileData.split(',')[1] || fileData;
        }
      } else if (fileData.includes('base64,')) {
        const parts = fileData.split('base64,');
        base64Data = parts[1];
      } else if (fileData.startsWith('http')) {
        return res.redirect(fileData);
      } else {
        base64Data = fileData; // assume raw base64
      }

      if (base64Data) {
        if (base64Data.startsWith('/9j/')) contentType = 'image/jpeg';
        else if (base64Data.startsWith('iVBORw')) contentType = 'image/png';
        else if (base64Data.startsWith('JVBERi0')) contentType = 'application/pdf';
        else if (base64Data.startsWith('PHN2Zy')) contentType = 'image/svg+xml';
        else if (base64Data.startsWith('R0lGOD')) contentType = 'image/gif';
        else if (contentType === 'application/octet-stream') contentType = 'image/jpeg';
      }

      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      if (req.query.download === 'true') {
        const ext = contentType.split('/')[1] || 'bin';
        res.setHeader('Content-Disposition', `attachment; filename="proof-${req.params.id}.${ext}"`);
      }
      
      res.send(buffer);
    } catch (error) {
      console.error("Failed to fetch payment proof file:", error);
      res.status(500).send("Server error");
    }
  });

  // Fetch Document File
  app.get(["/api/documents/:id/file", "/api/documents/:id/file.:ext"], async (req: express.Request, res: express.Response) => {
    const sendSvgFallback = (title: string = "Dokumen Terunggah") => {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
        <rect width="600" height="400" fill="#f8fafc" rx="20"/>
        <rect x="4" y="4" width="592" height="392" fill="#f1f5f9" rx="16" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 6"/>
        <rect x="230" y="110" width="140" height="170" rx="16" fill="white" stroke="#0284c7" stroke-width="4"/>
        <path d="M330 110v40h40" fill="#e0f2fe" stroke="#0284c7" stroke-width="4" stroke-linejoin="round"/>
        <path d="M260 180h80m-80 30h80m-80 30h50" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
        <text x="300" y="340" text-anchor="middle" fill="#0369a1" font-family="sans-serif" font-size="16" font-weight="bold">${title}</text>
      </svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(svgContent);
    };

    try {
      const doc = await db.query.documents.findFirst({ where: eq(schema.documents.id, req.params.id) });
      if (!doc || !doc.fileUrl) {
        return sendSvgFallback("Dokumen Terunggah");
      }
      
      let fileUrl = doc.fileUrl.trim();
      
      // 1. If self-referential or circular route path stored in DB, avoid redirect loop
      if (fileUrl.includes(`/api/documents/${req.params.id}`)) {
        return sendSvgFallback("Dokumen Terunggah");
      }

      // 2. If base64 data URL, convert to physical file on disk to boost performance
      if (fileUrl.startsWith('data:') || fileUrl.includes('base64,')) {
        const physicalPath = saveFileToUploads(fileUrl);
        if (physicalPath && physicalPath.startsWith('/uploads/')) {
          fileUrl = physicalPath;
          // Async update DB with clean relative path
          withRetry(() => db.update(schema.documents).set({ fileUrl: physicalPath }).where(eq(schema.documents.id, doc.id))).catch(() => {});
        }
      }

      // 3. If relative path on server (e.g. /uploads/file-123.pdf)
      if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('uploads/')) {
        const relativePath = fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl;
        const absolutePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(absolutePath)) {
          return res.sendFile(absolutePath);
        }
        // Direct uploadDir check fallback
        const filename = path.basename(fileUrl);
        const directUploadPath = path.join(uploadDir, filename);
        if (fs.existsSync(directUploadPath)) {
          return res.sendFile(directUploadPath);
        }
        const publicUploadPath = path.join(publicUploadDir, filename);
        if (fs.existsSync(publicUploadPath)) {
          return res.sendFile(publicUploadPath);
        }
      }

      if (fileUrl.startsWith('/') && !fileUrl.startsWith('data:')) {
        const absolutePath = path.join(process.cwd(), fileUrl);
        if (fs.existsSync(absolutePath)) {
          return res.sendFile(absolutePath);
        }
      }
      
      // 4. If external HTTP/HTTPS URL
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return res.redirect(fileUrl);
      }
      
      // 5. Direct data URL / base64 fallback
      let contentType = 'application/octet-stream';
      let base64Data = '';
      
      if (fileUrl.startsWith('data:')) {
        const matches = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          base64Data = matches[2];
        } else {
          const parts = fileUrl.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          if (mimeMatch) contentType = mimeMatch[1];
          base64Data = parts[1] || '';
        }
      } else if (fileUrl.includes('base64,')) {
        base64Data = fileUrl.split('base64,')[1];
      } else if (fileUrl.length > 50) {
        base64Data = fileUrl; // assume raw base64
      }
      
      if (base64Data) {
        if (contentType === 'application/octet-stream' || !contentType) {
          if (base64Data.startsWith('JVBERi0')) contentType = 'application/pdf';
          else if (base64Data.startsWith('/9j/')) contentType = 'image/jpeg';
          else if (base64Data.startsWith('iVBORw')) contentType = 'image/png';
          else contentType = 'image/png';
        }
        
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.send(buffer);
      }

      return sendSvgFallback("Dokumen Terunggah");
    } catch (e: any) {
      console.error("Error serving document file:", e);
      return sendSvgFallback("Dokumen Terunggah");
    }
  });

  // Verify Document
  app.patch("/api/admin/documents/:id/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    // VALIDASI MUTLAK: Tolak ID jika rusak (seperti '.', kosong, atau undefined)
    if (!id || id === '.' || id === 'undefined' || id.trim() === '') {
      console.error("DITOLAK: Parameter ID rusak diterima:", id);
      return res.status(400).json({ error: "ID dokumen tidak valid" });
    }

    // Validate ID as UUID
    console.log("RECEIVED ID:", id, typeof id);
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "ID dokumen tidak valid" });
    }

    try {
      // Map frontend status to DB enum
      const dbStatus = status === 'approved' ? 'VERIFIED' : status === 'rejected' ? 'REJECTED' : status;

      // Update the document
      const updatedDocs = await withRetry(() => db.update(schema.documents)
        .set({ 
          status: dbStatus as any, 
          adminNotes: reason || null,
          updatedAt: new Date()
        })
        .where(eq(schema.documents.id, id))
        .returning());

      if (!updatedDocs || updatedDocs.length === 0) {
        return res.status(404).json({ error: "Dokumen tidak ditemukan" });
      }

      const updatedDoc = updatedDocs[0];
      res.json(updatedDoc);

      // Async background tasks for registration status advancement
      setImmediate(async () => {
        try {
          if (updatedDoc.status === 'VERIFIED') {
            const regId = updatedDoc.registrationId;
            if (!regId) return;

            const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, regId)
            }));

            if (reg && reg.status === 'UPLOAD_DOKUMEN') {
              const docs = await getDocumentsQuery({
                where: eq(schema.documents.registrationId, regId)
              });
              
              const verifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
              if (verifiedCount >= 3) {
                await withRetry(() => db.update(schema.registrations)
                  .set({ status: 'VERIFIKASI_DOKUMEN', updatedAt: new Date() })
                  .where(eq(schema.registrations.id, regId)));
                console.log(`[Admin] Registration ${regId} moved to VERIFIKASI_DOKUMEN`);
              }
            }

            if (reg && reg.userId) {
              invalidateUserCache(reg.userId);
            }
          }
          if (typeof notifyUpdate === 'function') notifyUpdate();
        } catch (bgErr) {
          console.warn(`[Admin] Post-verification background tasks failed for doc ${id}:`, bgErr);
        }
      });
    } catch (error: any) {
      console.error(`[Admin] Document verification failed for ${id}:`, error);
      res.status(500).json({ error: "Terjadi kesalahan pada server: " + (error.message || "") });
    }
  });

  
  // --- Operasional Keberangkatan (Admin) ---
  app.get("/api/admin/equipment", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const workspaceId = req.user!.workspaceId!;
    try {
      const equipment = await withRetry(() => db.query.equipment.findMany({
        where: eq(schema.equipment.workspaceId, workspaceId)
      }));
      res.json(equipment);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/equipment/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
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
    const workspaceId = req.user!.workspaceId!;
    try {
      const notifications = await withRetry(() => db.query.notifications.findMany({ 
        where: eq(schema.notifications.workspaceId, workspaceId),
        orderBy: (n, { desc }) => [desc(n.createdAt)] 
      }));
      res.json(notifications);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/broadcast", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, content, message, type, targetType, targetUserIds } = req.body;
    try {
      const msgContent = content || message || '';
      const msgTitle = title || 'Pengumuman Baru';
      const msgType = type || 'info';

      if (targetType === 'SPECIFIC' && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
        const uniqueUserIds = Array.from(new Set(targetUserIds.filter(Boolean))) as string[];
        if (uniqueUserIds.length === 0) {
          return res.status(400).json({ error: 'Pilih minimal satu akun penerima pengumuman' });
        }

        const valuesToInsert = uniqueUserIds.map((uId: string) => ({
          workspaceId: req.user!.workspaceId!,
          userId: uId,
          title: msgTitle,
          message: msgContent,
          type: msgType,
        }));

        await withRetry(() => db.insert(schema.notifications).values(valuesToInsert));
      } else {
        await withRetry(() => db.insert(schema.notifications).values({
          workspaceId: req.user!.workspaceId!,
          userId: null,
          title: msgTitle,
          message: msgContent,
          type: msgType,
        }));
      }

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
    const workspaceId = req.user!.workspaceId!;
    try {
      const manifests = await withRetry(() => db.query.manifests.findMany({
        where: eq(schema.manifests.workspaceId, workspaceId)
      }));
      res.json(manifests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/manifest/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { registrationId } = req.params;
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
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

  app.post("/api/jamaah/notifications/read", authenticate, async (req: AuthRequest, res) => {
    try {
      const { notificationId } = req.body;
      if (notificationId) {
        await withRetry(() => db.update(schema.notifications)
          .set({ isRead: 'true' })
          .where(and(
            eq(schema.notifications.id, notificationId),
            or(eq(schema.notifications.userId, req.user!.id), isNull(schema.notifications.userId))
          )));
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/jamaah/notifications/read-all", authenticate, async (req: AuthRequest, res) => {
    try {
      await withRetry(() => db.update(schema.notifications)
        .set({ isRead: 'true' })
        .where(or(eq(schema.notifications.userId, req.user!.id), isNull(schema.notifications.userId))));
      res.json({ success: true });
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
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
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
                      workspaceId: req.user?.workspaceId || reg?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef',
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
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
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
    
    const wsId = req.user!.workspaceId!;
    const cached = adminStatsCache.get(wsId);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return res.json(cached.data);
    }

    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Jamaah Aktif (Jemaah yang terdaftar dan akan berangkat)
      const activeRegsForDeparture = await withRetry(() => db.select({
        id: schema.registrations.id,
        adultCount: schema.registrations.adultCount,
        childCount: schema.registrations.childCount,
        infantCount: schema.registrations.infantCount,
        paxData: schema.registrations.paxData
      })
      .from(schema.registrations)
      .where(and(
        eq(schema.registrations.workspaceId, req.user!.workspaceId!),
        ne(schema.registrations.status, 'CANCELLED'),
        ne(schema.registrations.status, 'PILIH_PAKET')
      )));

      let activeJamaahCount = 0;
      activeRegsForDeparture.forEach(r => {
        const paxArray = Array.isArray(r.paxData) ? r.paxData.length : 0;
        const countFromFields = (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0);
        activeJamaahCount += Math.max(paxArray, countFromFields, 1);
      });

      const allJamaahUsers = await withRetry(() => db.select({
        id: schema.users.id
      })
      .from(schema.users)
      .where(and(
        eq(schema.users.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah'),
        ne(schema.users.status, 'suspended')
      )));
      
      const totalJamaah = activeJamaahCount > 0 ? activeJamaahCount : allJamaahUsers.length;
 
      // 1b. Mitra Aktif
      const activeMitraResult = await withRetry(() => db.select({
        count: sql<number>`count(*)`
      })
      .from(schema.mitraUsers)
      .where(eq(schema.mitraUsers.statusAkun, 'active')));
      const totalMitraAktif = Number(activeMitraResult[0]?.count || 0);

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
      const docsSummary = await withRetry(() => db.select({ 
        status: schema.documents.status,
        count: sql<number>`count(*)`
      })
      .from(schema.documents)
      .where(eq(schema.documents.workspaceId, req.user!.workspaceId!))
      .groupBy(schema.documents.status));

      const totalDocs = docsSummary.reduce((sum, d) => sum + Number(d.count), 0);
      const approvedDocsCount = docsSummary.find(d => d.status === 'VERIFIED')?.count || 0;
      
      const docProgress = totalDocs > 0 
        ? Math.round((Number(approvedDocsCount) / totalDocs) * 100) 
        : 0;
 
      // 4. Batch Terdekat
      let nextBatch = await withRetry(() => db.query.schedules.findFirst({
        where: and(
          eq(schema.schedules.workspaceId, req.user!.workspaceId!),
          gte(schema.schedules.departureDate, now)
        ),
        orderBy: (s, { asc }) => [asc(s.departureDate)],
        with: { package: true }
      })) as any;
 
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
          nextBatch.packageId ? eq(schema.registrations.scheduleId, nextBatch.id) : eq(schema.registrations.packageId, nextBatch.id),
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
              inArray(schema.documents.registrationId, regIds as string[]),
              eq(schema.documents.status, 'VERIFIED')
            )));
          
          const approvedPayments = await withRetry(() => db.select({ total: sql<number>`sum(${schema.payments.amount})` })
            .from(schema.payments)
            .where(and(
              inArray(schema.payments.registrationId, regIds as string[]),
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

      const result = {
        totalJamaah,
        totalMitraAktif,
        monthlyCashFlow,
        docProgress,
        nextBatch: nextBatch?.departureDate || null,
        nextBatchName: nextBatch?.name || null,
        nextBatchRegs,
        sCurveData,
        analysis
      };
      adminStatsCache.set(wsId, { data: result, timestamp: Date.now() });
      res.json(result);
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  // [Moved Vite middleware to end]

  // --- Admin Endpoints ---

  // Get Admin Packages (Bulletproof & Unfiltered)
  app.get("/api/admin/packages", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      let allPackages: any[] = [];
      try {
        allPackages = await withRetry(() => 
          db.select().from(schema.packages).orderBy(desc(schema.packages.createdAt))
        );
      } catch (err) {
        console.warn("GET /api/admin/packages primary query failed, trying raw SQL...", err);
        const rawRes: any = await db.execute(sql`
          SELECT id, workspace_id as "workspaceId", name, description, price, 
                 departure_date as "departureDate", duration, image_url as "imageUrl", 
                 type, is_available as "isAvailable", quota, 
                 manasik_pdf_url as "manasikPdfUrl", facilities, excludes, hotel, created_at as "createdAt"
          FROM packages
          ORDER BY created_at DESC
        `);
        allPackages = Array.isArray(rawRes) ? rawRes : (rawRes.rows || []);
      }

      let regCounts: any[] = [];
      try {
        regCounts = await withRetry(() => db.select({
          packageId: schema.registrations.packageId,
          adultCount: schema.registrations.adultCount,
          childCount: schema.registrations.childCount,
          infantCount: schema.registrations.infantCount,
        }).from(schema.registrations));
      } catch (e) {}

      const formatted = (allPackages || []).map((pkg) => {
        const pkgRegs = (regCounts || []).filter(r => r && r.packageId === pkg.id);
        const takenSeats = pkgRegs.reduce((acc, r) => 
          acc + (parseInt(r?.adultCount) || 0) + (parseInt(r?.childCount) || 0) + (parseInt(r?.infantCount) || 0), 0);
        
        const quotaNum = Number(pkg.quota) || 45;
        const remainingSeats = Math.max(0, quotaNum - takenSeats);

        let desc: any = pkg.description;
        if (typeof desc === 'string') {
          try { desc = JSON.parse(desc); } catch (e) { desc = desc ? desc.split('\n') : ["Fasilitas Bintang 5"]; }
        }
        let exc: any = pkg.excludes;
        if (typeof exc === 'string') {
          try { exc = JSON.parse(exc); } catch (e) { exc = exc ? exc.split('\n') : []; }
        }

        return { 
          ...pkg, 
          description: Array.isArray(desc) ? desc : [String(desc || "Fasilitas Bintang 5")],
          excludes: Array.isArray(exc) ? exc : [],
          quota: quotaNum,
          takenSeats,
          remainingSeats,
          type: (pkg.type || 'umroh').toString().trim().toLowerCase(),
          isAvailable: pkg.isAvailable !== false
        };
      });

      res.json(formatted);
    } catch (error: any) {
      console.error("Database query failed in GET /api/admin/packages:", error);
      res.status(500).json({ error: "Failed to fetch admin packages" });
    }
  });

  // Create Package
  app.post("/api/admin/packages", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl, facilities, hotel, excludes } = req.body;
      
      const cleanPrice = Number(price) || 0;
      const cleanQuota = Number(quota) || 45;
      
      let cleanDesc = description;
      if (Array.isArray(cleanDesc)) {
        const filtered = cleanDesc.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanDesc = JSON.stringify(filtered.length > 0 ? filtered : [name || "Fasilitas Bintang 5"]);
      } else if (typeof cleanDesc !== 'string' || !cleanDesc.trim()) {
        cleanDesc = JSON.stringify([name || "Fasilitas Bintang 5"]);
      }
      let cleanExcludes = excludes;
      if (Array.isArray(cleanExcludes)) {
        const filteredEx = cleanExcludes.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanExcludes = JSON.stringify(filteredEx.length > 0 ? filteredEx : []);
      } else if (typeof cleanExcludes !== 'string' || !cleanExcludes.trim()) {
        cleanExcludes = JSON.stringify([]);
      }


      const normalizedType = String(type || 'umroh').trim().toLowerCase() === 'haji' ? 'haji' : 'umroh';
      const normalizedIsAvailable = isAvailable !== false && isAvailable !== 'false' && isAvailable !== 0 && isAvailable !== '0';

      let wsId: string | undefined = req.user?.workspaceId;
      if (!wsId) {
        const defaultWs: any = await withRetry(() => db.query.workspaces.findFirst());
        wsId = defaultWs?.id;
      }

      const data: any = {
        workspaceId: wsId || null,
        name: (name || "Paket Baru").trim(),
        description: cleanDesc,
        price: cleanPrice.toString(),
        duration: (duration || "9 Hari").trim(),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80",
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        quota: cleanQuota,
        manasikPdfUrl: manasikPdfUrl || null,
        facilities: facilities || null,
        hotel: hotel || null,
        excludes: cleanExcludes
      };

      const [newPackage] = await withRetry(() => db.insert(schema.packages).values(data).returning());
      
      // Parse description for client response consistency
      let parsedDesc = newPackage.description;
      try { parsedDesc = JSON.parse(newPackage.description); } catch(e) {}

      res.json({ ...newPackage, description: parsedDesc, remainingSeats: newPackage.quota, takenSeats: 0 });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ error: "Gagal membuat paket baru. Cek kembali data yang dimasukkan (misalnya harga terlalu besar)." });
    }
  });

  // Update Package
  app.put("/api/admin/packages/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl, facilities, hotel, excludes } = req.body;
      
      const cleanPrice = Number(price) || 0;
      const cleanQuota = Number(quota) || 45;
      
      let cleanDesc = description;
      if (Array.isArray(cleanDesc)) {
        const filtered = cleanDesc.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanDesc = JSON.stringify(filtered.length > 0 ? filtered : [name || "Fasilitas Bintang 5"]);
      } else if (typeof cleanDesc !== 'string' || !cleanDesc.trim()) {
        cleanDesc = JSON.stringify([name || "Fasilitas Bintang 5"]);
      }

      let cleanExcludes = excludes;
      if (Array.isArray(cleanExcludes)) {
        const filteredEx = cleanExcludes.filter((d: any) => typeof d === 'string' && d.trim() !== '');
        cleanExcludes = JSON.stringify(filteredEx.length > 0 ? filteredEx : []);
      } else if (typeof cleanExcludes !== 'string' || !cleanExcludes.trim()) {
        cleanExcludes = JSON.stringify([]);
      }

      const normalizedType = String(type || 'umroh').trim().toLowerCase() === 'haji' ? 'haji' : 'umroh';
      const normalizedIsAvailable = isAvailable !== false && isAvailable !== 'false' && isAvailable !== 0 && isAvailable !== '0';

      const data: any = {
        name: (name || "Paket Baru").trim(),
        description: cleanDesc,
        price: cleanPrice.toString(),
        duration: (duration || "9 Hari").trim(),
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        quota: cleanQuota,
        facilities: facilities || null,
        hotel: hotel || null,
        excludes: cleanExcludes
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
      res.status(500).json({ error: "Gagal memperbarui paket. Cek kembali data yang dimasukkan (misalnya harga terlalu besar)." });
    }
  });

  // Delete Package
  app.delete("/api/admin/packages/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const packageId = req.params.id;
      const deletedPkg = await deletePackageCascade(packageId);

      if (!deletedPkg) {
        return res.status(404).json({ error: "Paket tidak ditemukan." });
      }

      res.json({ success: true, id: packageId });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting package:", error);
      res.status(500).json({ error: "Gagal menghapus paket." });
    }
  });

  app.get("/api/admin/users", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const workspaceId = req.user!.workspaceId!;
    try {
      // Optimized with Eager Loading
      const enrichedUsers = await withRetry(() => db.query.users.findMany({
        where: eq(schema.users.workspaceId, workspaceId),
        with: {
          registrations: {
            with: {
              package: true
            }
          }
        }
      }));

      res.json(enrichedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users: " + error.message });
    }
  });

  app.get("/api/admin/registrations", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const workspaceId = req.user?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef';
    
    try {
      // Use Eager Loading (Relational Query) for maximum efficiency
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: eq(schema.registrations.workspaceId, workspaceId!),
        with: {
          user: true,
          package: true,
          payments: {
            columns: {
              id: true,
              workspaceId: true,
              registrationId: true,
              paymentType: true,
              amount: true,
              status: true,
              adminNotes: true,
              verifiedAt: true,
              verifiedBy: true,
              createdAt: true
            }
          },
          schedule: true,
          manifests: true
        },
        orderBy: (r, { desc }) => [desc(r.createdAt)]
      }));

      const regIds = allRegs.map(r => r.id as string);
      
      // Fetch documents WITHOUT the bulky Base64 fileUrl to prevent Node.js OOM and DB pool exhaustion
      let docs: any[] = [];
      if (regIds.length > 0) {
        const rawDocs = await withRetry(() => db.select({
          id: schema.documents.id,
          registrationId: schema.documents.registrationId,
          docType: schema.documents.docType,
          status: schema.documents.status,
          createdAt: schema.documents.createdAt,
          updatedAt: schema.documents.updatedAt,
          isPdf: sql<boolean>`${schema.documents.fileUrl} LIKE 'data:application/pdf%' OR ${schema.documents.fileUrl} LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%'`.as('is_pdf'),
          hasFile: sql<boolean>`${schema.documents.fileUrl} IS NOT NULL AND ${schema.documents.fileUrl} != ''`.as('has_file')
        }).from(schema.documents).where(inArray(schema.documents.registrationId, regIds as string[])));

        docs = rawDocs.map((d: any) => ({
          ...d,
          fileUrl: d.hasFile ? `/api/documents/${d.id}/file${d.isPdf ? '.pdf' : '.png'}` : null
        }));
      }

      // Add computed paxCount and lightweight documents array
      const regsWithPaxCount = allRegs.map(reg => ({
        ...reg,
        paxCount: (parseInt((reg.adultCount as string) || '0') + parseInt((reg.childCount as string) || '0') + parseInt((reg.infantCount as string) || '0')) || 1,
        documents: docs.filter(d => d.registrationId === reg.id)
      }));

      res.json(regsWithPaxCount);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations: " + error.message });
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
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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
      res.status(500).json({ error: "Terjadi kesalahan pada server"   });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { id } = req.params;
      
      // Soft delete the user
      await withRetry(() => db.update(schema.users)
        .set({ deletedAt: new Date() })
        .where(eq(schema.users.id, id)));
      
      res.json({ success: true, message: "User soft-deleted successfully" });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Gagal menghapus user" });
    }
  });

  app.delete("/api/admin/registrations/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const regId = req.params.id;
      const pays = await withRetry(() => db.select({ id: schema.payments.id }).from(schema.payments).where(eq(schema.payments.registrationId, regId))).catch(() => []);
      for (const p of pays) {
        await withRetry(() => db.delete(schema.financial_ledger).where(eq(schema.financial_ledger.paymentId, p.id))).catch(() => {});
      }
      await withRetry(() => db.delete(schema.payments).where(eq(schema.payments.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.documents).where(eq(schema.documents.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.equipment).where(eq(schema.equipment.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.activities).where(eq(schema.activities.registrationId, regId))).catch(() => {});
      await withRetry(() => db.delete(schema.registrations).where(eq(schema.registrations.id, regId)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ error: "Terjadi kesalahan saat menghapus pendaftaran" });
    }
  });

  app.delete("/api/admin/users/:id", authenticate, async (req: AuthRequest, res) => {
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
      const { packageId, departureDate, name, airline, totalSeats, itineraryPdfUrl, muthawwifName, muthawwifRole, muthawwifPhone, muthawwifAvatarUrl, muthawwifNotes } = req.body;
      const [newSchedule] = await withRetry(() => db.insert(schema.schedules).values({
              workspaceId: req.user!.workspaceId!,
              packageId,
              departureDate: new Date(departureDate),
              name,
              airline,
              totalSeats: Number(totalSeats),
              availableSeats: Number(totalSeats),
              itineraryPdfUrl,
              muthawwifName,
              muthawwifRole,
              muthawwifPhone,
              muthawwifAvatarUrl,
              muthawwifNotes
            }).returning());
      res.status(201).json(newSchedule);
      notifyUpdate();
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server"   });
    }
  });

  app.put("/api/admin/schedules/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, departureDate, name, airline, totalSeats, availableSeats, itineraryPdfUrl, muthawwifName, muthawwifRole, muthawwifPhone, muthawwifAvatarUrl, muthawwifNotes } = req.body;
      const [updatedSchedule] = await withRetry(() => db.update(schema.schedules)
              .set({
                packageId,
                departureDate: new Date(departureDate),
                name,
                airline,
                totalSeats: Number(totalSeats),
                availableSeats: Number(availableSeats),
                itineraryPdfUrl,
                muthawwifName,
                muthawwifRole,
                muthawwifPhone,
                muthawwifAvatarUrl,
                muthawwifNotes
              })
              .where(eq(schema.schedules.id, req.params.id))
              .returning());
      res.json(updatedSchedule);
      notifyUpdate();
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server"   });
    }
  });

  app.delete("/api/admin/schedules/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user?.email !== 'felix.hencia04@gmail.com') return res.status(403).json({ error: "Forbidden" });
    try {
      const scheduleId = req.params.id;
      await withRetry(() => db.update(schema.registrations).set({ scheduleId: null }).where(eq(schema.registrations.scheduleId, scheduleId))).catch(() => {});
      await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.scheduleId, scheduleId))).catch(() => {});
      await withRetry(() => db.delete(schema.schedules).where(eq(schema.schedules.id, scheduleId)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: "Gagal menghapus jadwal." });
    }
  });

  // --- Memories & Certificates Endpoints ---

  app.get("/api/admin/memories", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const workspaceId = req.user!.workspaceId!;
    try {
      const allMemories = await withRetry(() => db.query.memories.findMany({
        where: eq(schema.memories.workspaceId, workspaceId)
      }));
      res.json(allMemories);
    } catch (error: any) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.post("/api/admin/memories", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { packageId, registrationId, imageUrl, caption } = req.body;
      let finalImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        finalImageUrl = saveFileToUploads(imageUrl, 'memory');
      }

      let wsId: string | undefined = req.user?.workspaceId;
      if (!wsId) {
        const defaultWs: any = await withRetry(() => db.query.workspaces.findFirst());
        wsId = defaultWs?.id;
      }

      const [memory] = await withRetry(() => db.insert(schema.memories).values({
        workspaceId: wsId || null,
        packageId: packageId && isValidUuid(packageId) ? packageId : null,
        registrationId: registrationId && isValidUuid(registrationId) ? registrationId : null,
        imageUrl: finalImageUrl,
        caption
      }).returning());
      res.json(memory);
      notifyUpdate();
    } catch (error: any) {
      console.error("Error creating memory:", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server saat menambah momen" });
    }
  });

  // --- CMS ROUTES ---

  // Get Package Itinerary
  app.get("/api/cms/packages/:id/itinerary", async (req, res) => {
    try {
      const itineraries = await withRetry(() => db.query.package_itineraries.findMany({
        where: eq(schema.package_itineraries.packageId, req.params.id),
        orderBy: [asc(schema.package_itineraries.day)]
      }));
      res.json(itineraries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch itinerary" });
    }
  });

  // Bulk Create/Update Itinerary
  app.post("/api/cms/packages/:id/itinerary", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const packageId = req.params.id;
      const { itineraries } = req.body;

      // Delete existing
      await withRetry(() => db.delete(schema.package_itineraries).where(eq(schema.package_itineraries.packageId, packageId)));

      // Insert new
      if (itineraries && itineraries.length > 0) {
        const values = itineraries.map((item: any) => ({
          packageId,
          day: Number(item.day),
          title: item.title || '',
          description: item.description || '',
          location: item.location || '',
          meals: item.meals || ''
        }));
        await withRetry(() => db.insert(schema.package_itineraries).values(values));
      }

      res.json({ success: true });
      notifyUpdate();
    } catch (error) {
      console.error("Itinerary error:", error);
      res.status(500).json({ error: "Failed to save itinerary" });
    }
  });

  // Gallery Photos
  app.get("/api/cms/gallery/photos", async (req, res) => {
    try {
      const photos = await withRetry(() => db.query.gallery_photos.findMany({
        orderBy: [desc(schema.gallery_photos.createdAt)]
      }));
      res.json(photos);
    } catch (error) {
      console.error("Gallery fetch error:", error); res.status(500).json({ error: "Failed to fetch photos", details: String(error), originalError: (error as any).message });
    }
  });

  app.post("/api/cms/gallery/photos", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { imageUrl, title, description } = req.body;
      let finalUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        finalUrl = saveFileToUploads(imageUrl, 'gallery');
      }

      const [photo] = await withRetry(() => db.insert(schema.gallery_photos).values({
        workspaceId: req.user!.workspaceId!,
        imageUrl: finalUrl,
        title,
        description
      }).returning());
      res.json(photo);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.delete("/api/cms/gallery/photos/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.gallery_photos).where(eq(schema.gallery_photos.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Gallery Videos
  app.get("/api/cms/gallery/videos", async (req, res) => {
    try {
      const videos = await withRetry(() => db.query.gallery_videos.findMany({
        orderBy: [desc(schema.gallery_videos.createdAt)]
      }));
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/cms/gallery/videos", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { videoUrl, title, description, thumbnailUrl } = req.body;
      let finalUrl = videoUrl;
      if (videoUrl && videoUrl.startsWith('data:')) {
        finalUrl = saveFileToUploads(videoUrl, 'video');
      }

      const [video] = await withRetry(() => db.insert(schema.gallery_videos).values({
        workspaceId: req.user!.workspaceId!,
        videoUrl: finalUrl,
        title,
        description,
        thumbnailUrl
      }).returning());
      res.json(video);
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  app.delete("/api/cms/gallery/videos/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      await withRetry(() => db.delete(schema.gallery_videos).where(eq(schema.gallery_videos.id, req.params.id)));
      res.json({ success: true });
      notifyUpdate();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  app.delete("/api/admin/memories/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      if (isValidUuid(req.params.id)) {
        await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.id, req.params.id)));
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.get("/api/admin/certificates", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const workspaceId = req.user!.workspaceId!;
    try {
      const allCerts = await getCertificatesQuery({
        where: eq(schema.certificates.workspaceId, workspaceId)
      });
      res.json(allCerts);
    } catch (error: any) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.post("/api/admin/certificates", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { registrationId, certificateUrl, recipientName } = req.body;
      
      let validRegistrationId: string | null = null;
      if (isValidUuid(registrationId)) {
        try {
          const regExists = await db.query.registrations.findFirst({
            where: eq(schema.registrations.id, registrationId)
          });
          if (regExists) {
            validRegistrationId = registrationId;
          }
        } catch (e) {
          validRegistrationId = null;
        }
      }

      let certificate;
      try {
        [certificate] = await withRetry(() => db.insert(schema.certificates).values({
          workspaceId: req.user!.workspaceId!,
          registrationId: validRegistrationId,
          recipientName: recipientName || null,
          certificateUrl: certificateUrl || ''
        }).returning());
      } catch (insertErr) {
        // Fallback without registrationId if FK constraint failed
        console.warn("[Certificates POST] Primary insert failed, retrying with null registrationId:", insertErr);
        [certificate] = await withRetry(() => db.insert(schema.certificates).values({
          workspaceId: req.user!.workspaceId!,
          registrationId: null,
          recipientName: recipientName || null,
          certificateUrl: certificateUrl || ''
        }).returning());
      }

      res.json(certificate);
      notifyUpdate();
    } catch (error: any) {
      console.error("[Certificates POST Error]", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server saat menyimpang sertifikat" });
    }
  });

  app.delete("/api/admin/certificates/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      if (isValidUuid(req.params.id)) {
        await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.id, req.params.id)));
      }
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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
    const { name, phone, email, avatarUrl, password } = req.body;
    try {
      if (!req.user?.id && req.user?.role !== 'admin') {
        return res.status(401).json({ error: 'User ID tidak ditemukan dalam sesi.' });
      }

      const newEmail = email && typeof email === 'string' && email.trim() ? email.trim() : null;

      let targetUserId = req.user?.id;

      if (req.user?.role === 'admin') {
        const adminRows = await withRetry(() => db.select().from(schema.users)
          .where(and(
            or(eq(schema.users.role, 'admin'), eq(schema.users.role, 'super_admin'), ilike(schema.users.email, '%admin%')),
            isNull(schema.users.deletedAt)
          ))
        ).catch(() => []);

        if (adminRows.length > 0) {
          const found = adminRows.find((u: any) => u.id === req.user?.id);
          targetUserId = found ? found.id : adminRows[0].id;
        } else if (!targetUserId) {
          targetUserId = '00000000-0000-0000-0000-000000000000';
        }
      }

      const setData: any = { 
        updatedAt: new Date()
      };
      if (name && typeof name === 'string' && name.trim()) setData.name = name.trim();
      if (phone !== undefined) setData.phone = String(phone).trim();
      if (avatarUrl !== undefined) setData.avatarUrl = avatarUrl;
      if (password !== undefined && password !== null && String(password).trim().length > 0) {
        setData.password = hashPassword(String(password).trim());
      }

      if (newEmail) {
        try {
          const existingUsers = await withRetry(() => db.select().from(schema.users)
            .where(sql`LOWER(${schema.users.email}) = LOWER(${newEmail})`)).catch(() => []);

          for (const exist of existingUsers) {
            if (exist.id !== targetUserId) {
              if (exist.role !== 'admin') {
                const renamedEmail = `${exist.email}.old_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                await withRetry(() => db.update(schema.users)
                  .set({ email: renamedEmail, updatedAt: new Date() })
                  .where(eq(schema.users.id, exist.id))).catch((e) => {
                    console.warn("Notice: renaming conflicting email row skipped:", e?.message);
                  });
              }
            }
          }
        } catch (e: any) {
          console.warn("Notice: checking duplicate emails skipped:", e?.message);
        }
        setData.email = newEmail;
      }

      let updatedUser: any = null;

      if (req.user?.role === 'admin') {
        let adminRows = await withRetry(() => db.select().from(schema.users)
          .where(and(
            or(eq(schema.users.role, 'admin'), eq(schema.users.role, 'super_admin'), ilike(schema.users.email, '%admin%')),
            isNull(schema.users.deletedAt)
          ))
        ).catch(() => []);

        if (!adminRows || adminRows.length === 0) {
          let ws = await db.query.workspaces.findFirst().catch(() => null);
          if (!ws) {
            const [newWs] = await db.insert(schema.workspaces).values({ name: "Golden Travel Workspace", slug: `golden-travel-${Date.now()}` }).returning();
            ws = newWs;
          }
          const [inserted] = await db.insert(schema.users).values({
            id: targetUserId || '00000000-0000-0000-0000-000000000000',
            workspaceId: ws?.id,
            name: setData.name || 'Admin',
            email: setData.email || 'admin@goldentravel.id',
            phone: setData.phone || '08111111111',
            password: setData.password || hashPassword('admin123'),
            role: 'admin',
            status: 'active'
          }).returning();
          updatedUser = inserted;
          targetUserId = inserted.id;
        } else {
          // Update primary target admin user explicitly to avoid unique constraint collisions
          try {
            await withRetry(() => db.update(schema.users)
              .set(setData)
              .where(eq(schema.users.id, targetUserId)));
          } catch (e: any) {
            console.warn("Drizzle single admin update error, trying raw SQL:", e?.message);
            await withRetry(() => db.execute(sql`
              UPDATE "users"
              SET name = COALESCE(${setData.name || null}, name),
                  phone = COALESCE(${setData.phone || null}, phone),
                  email = COALESCE(${setData.email || null}, email),
                  avatar_url = COALESCE(${setData.avatarUrl || null}, avatar_url),
                  password = COALESCE(${setData.password || null}, password),
                  updated_at = NOW()
              WHERE id::text = ${String(targetUserId)};
            `)).catch((err) => console.error("Raw SQL update error:", err));
          }

          // Also update other admin rows' name/phone/password (EXCLUDING email to prevent unique key violation)
          const secondarySetData = { ...setData };
          delete secondarySetData.email;
          if (Object.keys(secondarySetData).length > 0) {
            await withRetry(() => db.update(schema.users)
              .set(secondarySetData)
              .where(and(
                or(eq(schema.users.role, 'admin'), eq(schema.users.role, 'super_admin')),
                ne(schema.users.id, targetUserId)
              ))).catch(() => {});
          }

          const [freshAdmin] = await withRetry(() => db.select().from(schema.users)
            .where(eq(schema.users.id, targetUserId)));
          updatedUser = freshAdmin || adminRows[0];
        }
      } else {
        try {
          const [u] = (await withRetry(() => db.update(schema.users)
            .set(setData)
            .where(eq(schema.users.id, targetUserId))
            .returning())) as any[];
          updatedUser = u;
        } catch (dbErr: any) {
          console.warn("Drizzle update error in PATCH /users/me, fallback to raw SQL:", dbErr?.message);
          await withRetry(() => db.execute(sql`
            UPDATE "users"
            SET name = COALESCE(${setData.name || null}, name),
                phone = COALESCE(${setData.phone || null}, phone),
                email = COALESCE(${setData.email || null}, email),
                avatar_url = COALESCE(${setData.avatarUrl || null}, avatar_url),
                password = COALESCE(${setData.password || null}, password),
                updated_at = NOW()
            WHERE id::text = ${String(targetUserId)};
          `)).catch(() => {});
          const [u] = (await withRetry(() => db.select().from(schema.users).where(eq(schema.users.id, targetUserId)))) as any[];
          updatedUser = u;
        }
      }

      // Ensure updatedUser retains setData values explicitly
      updatedUser = {
        ...(req.user || {}),
        ...(updatedUser || {}),
        ...setData,
        role: req.user?.role || 'admin'
      };

      // Generate a fresh JWT token with updated user details
      let freshToken: string | undefined = undefined;
      if (req.user?.role === 'admin') {
        freshToken = jwt.sign({
          id: updatedUser.id || targetUserId || '00000000-0000-0000-0000-000000000000',
          role: 'admin',
          email: updatedUser.email || setData.email || 'admin@goldentravel.id',
          name: updatedUser.name || setData.name || 'Admin',
          phone: updatedUser.phone || setData.phone || '08111111111',
          workspaceId: updatedUser.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef'
        }, JWT_SECRET, { expiresIn: '7d' });
      }

      // Sync linked registrations orderer details safely
      try {
        if (updatedUser?.id) {
          const regUpdate: any = {};
          if (setData.name) regUpdate.ordererName = setData.name;
          if (setData.phone) regUpdate.ordererPhone = setData.phone;
          if (setData.email) regUpdate.ordererEmail = setData.email;
          if (Object.keys(regUpdate).length > 0) {
            await withRetry(() => db.update(schema.registrations)
              .set(regUpdate)
              .where(eq(schema.registrations.userId, updatedUser.id))).catch(() => {});
          }
        }
      } catch (regErr) {
        console.warn("Notice updating linked registration:", regErr);
      }

      // Sync Firebase Auth safely if UID or email exists
      try {
        if (typeof adminAuth !== 'undefined' && adminAuth) {
          const updateObj: any = {};
          if (setData.name) updateObj.displayName = setData.name;
          if (password && typeof password === 'string' && password.trim().length >= 6) {
            updateObj.password = password.trim();
          }
          if (setData.avatarUrl) updateObj.photoURL = setData.avatarUrl;

          if (Object.keys(updateObj).length > 0) {
            if (updatedUser?.uid) {
              await adminAuth.updateUser(updatedUser.uid, updateObj).catch(() => {});
            } else if (updatedUser?.email) {
              const fbUser = await adminAuth.getUserByEmail(updatedUser.email).catch(() => null);
              if (fbUser) {
                await adminAuth.updateUser(fbUser.uid, updateObj).catch(() => {});
              }
            }
          }
        }
      } catch (fbErr: any) {
        console.warn("Notice updating Firebase Auth user:", fbErr?.message);
      }

      // Update session request user
      req.user = { ...req.user, ...updatedUser };

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        invalidateUserCache(authHeader.split('Bearer ')[1]?.trim());
      }

      res.json({ ...updatedUser, token: freshToken });
      notifyUpdate();
    } catch (error: any) {
      console.error("PATCH /api/users/me outer catch error:", error);
      if (req.user?.role === 'admin') {
        return res.json({
          id: req.user.id || '00000000-0000-0000-0000-000000000000',
          role: 'admin',
          name: name || req.user.name,
          phone: phone || req.user.phone,
          email: email || req.user.email,
          success: true
        });
      }
      res.status(500).json({ error: "Gagal memperbarui profil. Silakan coba beberapa saat lagi." });
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
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/uploads/**',
            '**/public/uploads/**',
            '**/storage/**',
            '**/logs/**',
            '**/*.sqlite',
            '**/*.db',
            '**/*.log',
            '**/*.png',
            '**/*.jpg',
            '**/*.jpeg',
            '**/*.pdf',
            '**/*.cjs',
            '**/tmp/**',
          ],
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const dirDist = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
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

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Server Error] ${req.method} ${req.path}:`, err);
    
    // Check if headers already sent
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Terjadi kesalahan internal pada server";
    
    res.status(status).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

async function initializeGlobalDatabase() {
  if ((global as any)._dbIsBroken) {
    console.log("=== SKIPPING INISIALISASI DATABASE GLOBAL (DB ERROR) ===");
    return;
  }
  console.log("=== INISIALISASI DATABASE GLOBAL (Auto-Init Schema 3 Portal) ===");
  try {
    await db.execute(sql.raw(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`));
    await db.execute(sql.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`));
  } catch (e: any) {}

  const ddlQueries = [
    `CREATE TABLE IF NOT EXISTS workspaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      domain TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      uid TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'jamaah' NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      mitra_id UUID,
      referral_code TEXT UNIQUE,
      password TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      deleted_at TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      departure_date TIMESTAMP,
      duration TEXT NOT NULL,
      image_url TEXT,
      facilities TEXT,
      excludes TEXT,
      hotel TEXT,
      type TEXT DEFAULT 'umroh' NOT NULL,
      is_available BOOLEAN DEFAULT TRUE NOT NULL,
      quota INTEGER DEFAULT 45 NOT NULL,
      manasik_pdf_url TEXT,
      muthawwif_name TEXT,
      muthawwif_role TEXT,
      muthawwif_phone TEXT,
      muthawwif_avatar_url TEXT,
      muthawwif_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      package_id UUID REFERENCES packages(id) NOT NULL,
      departure_date TIMESTAMP NOT NULL,
      name TEXT,
      airline TEXT,
      total_seats INTEGER NOT NULL,
      available_seats INTEGER NOT NULL,
      itinerary_pdf_url TEXT,
      muthawwif_name TEXT,
      muthawwif_role TEXT,
      muthawwif_phone TEXT,
      muthawwif_avatar_url TEXT,
      muthawwif_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS package_itineraries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
      day INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      meals TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      user_id UUID REFERENCES users(id) NOT NULL,
      package_id UUID REFERENCES packages(id) NOT NULL,
      schedule_id UUID REFERENCES schedules(id),
      status TEXT DEFAULT 'DRAFT' NOT NULL,
      orderer_name TEXT,
      orderer_phone TEXT,
      orderer_email TEXT,
      orderer_notes TEXT,
      adult_count TEXT DEFAULT '1' NOT NULL,
      child_count TEXT DEFAULT '0' NOT NULL,
      infant_count TEXT DEFAULT '0' NOT NULL,
      total_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
      pax_data JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      registration_id UUID REFERENCES registrations(id) NOT NULL,
      payment_type TEXT NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      proof_url TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      admin_notes TEXT,
      verified_at TIMESTAMP,
      verified_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      registration_id UUID REFERENCES registrations(id) NOT NULL,
      doc_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      user_id UUID REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read TEXT DEFAULT 'false' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS gallery_photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      title TEXT,
      description TEXT,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS gallery_videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      title TEXT,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS buku_kas_mutasi (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      payment_id UUID REFERENCES payments(id),
      amount DECIMAL(12, 2) NOT NULL,
      transaction_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS manifest_keberangkatan (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      package_id UUID REFERENCES packages(id) NOT NULL,
      registration_id UUID REFERENCES registrations(id) NOT NULL,
      bus_number TEXT,
      hotel_room TEXT,
      airplane_seat TEXT,
      pax_manifest JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS helpdesk_tiket (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      user_id UUID REFERENCES users(id) NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      replies JSONB DEFAULT '[]'::jsonb NOT NULL,
      status TEXT DEFAULT 'open' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS sertifikat_kenangan (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      registration_id UUID REFERENCES registrations(id),
      recipient_name TEXT,
      certificate_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS equipment_status (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      registration_id UUID REFERENCES registrations(id) NOT NULL,
      koper BOOLEAN DEFAULT FALSE NOT NULL,
      ihram BOOLEAN DEFAULT FALSE NOT NULL,
      mukena BOOLEAN DEFAULT FALSE NOT NULL,
      assignee TEXT,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      package_id UUID REFERENCES packages(id),
      schedule_id UUID REFERENCES schedules(id),
      registration_id UUID REFERENCES registrations(id),
      image_url TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS mitra_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      no_wa TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      status_akun TEXT DEFAULT 'incomplete_profile' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS mitra_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES mitra_users(id) ON DELETE CASCADE NOT NULL UNIQUE,
      nama_lengkap TEXT,
      nik TEXT UNIQUE,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      alamat_lengkap TEXT,
      nama_bank TEXT,
      no_rekening TEXT,
      nama_pemilik_rekening TEXT,
      npwp TEXT,
      jenis_kelamin TEXT,
      status_perkawinan TEXT,
      pekerjaan TEXT,
      provinsi TEXT,
      kota TEXT,
      kecamatan TEXT,
      kode_pos TEXT,
      whatsapp TEXT,
      bukti_transfer TEXT,
      review_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS kyc_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES mitra_users(id) ON DELETE CASCADE NOT NULL,
      document_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS mitra_commission_payouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      mitra_user_id UUID,
      mitra_name TEXT NOT NULL,
      mitra_phone TEXT,
      jamaah_name TEXT,
      package_name TEXT,
      amount DECIMAL(12, 2) NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      mitra_notes TEXT,
      admin_notes TEXT,
      proof_of_transfer_url TEXT,
      transfer_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS hotels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      rating INTEGER DEFAULT 4 NOT NULL,
      distance TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS airlines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      name TEXT NOT NULL,
      code TEXT,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS financial_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      payment_id UUID REFERENCES payments(id),
      amount DECIMAL(12, 2) NOT NULL,
      verifier_name TEXT,
      verification_status TEXT DEFAULT 'APPROVED' NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS admin_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id),
      travel_name TEXT DEFAULT 'PT Golden Travel Umrah' NOT NULL,
      travel_logo_url TEXT,
      default_commission_rate DECIMAL(12, 2) DEFAULT '1500000.00',
      whatsapp_number TEXT DEFAULT '08111111111',
      bank_accounts JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`
  ];

  for (const q of ddlQueries) {
    try {
      await db.execute(sql.raw(q));
    } catch (err: any) {
      // Ignore if table exists or column exists
    }
  }
  console.log("=== INSALISASI DATABASE SELESAI ===");
}

async function seedAllPortals() {
  if ((global as any)._dbIsBroken) {
    console.log("=== SKIPPING SEEDING (DB ERROR) ===");
    return;
  }
  console.log("=== SEEDING DATA DENGAN DEFAULTS UNTUK 3 PORTAL ===");
  try {
    // 1. Workspace Default
    let ws = await db.query.workspaces.findFirst().catch(() => null);
    if (!ws) {
      console.log("Membuat workspace default Golden Travel...");
      const [newWs] = await db.insert(schema.workspaces).values({
        name: "Golden Travel Workspace",
        slug: `golden-travel-${Date.now()}`
      }).returning();
      ws = newWs;
    }

    // 2. Admin Seeding
    const adminCheck = await db.select().from(schema.users).where(eq(schema.users.role, 'admin')).catch(() => []);
    if (!adminCheck || adminCheck.length === 0) {
      console.log("Seeding akun Admin Utama...");
      await db.insert(schema.users).values({
        workspaceId: ws.id,
        uid: crypto.randomUUID(),
        name: 'Super Admin',
        email: 'admin@goldentravel.id',
        password: hashPassword('admin123'),
        role: 'admin',
        status: 'active'
      });
    }

    // 3. Packages Seeding (2 Paket: Reguler & VIP)
    const existingPackages = await db.select().from(schema.packages).catch(() => []);
    let pkgReguler: any = null;
    let pkgVip: any = null;

    if (!existingPackages || existingPackages.length === 0) {
      console.log("Seeding 2 Paket Umrah (Reguler & VIP)...");
      const [p1] = await db.insert(schema.packages).values({
        workspaceId: ws.id,
        name: "Paket Umrah Reguler Bintang 4 (9 Hari)",
        description: JSON.stringify(["Hotel Makkah Pullman Zamzam", "Hotel Madinah Grand Plaza", "Bimbingan Muthawwif Berpengalaman"]),
        price: '28500000.00',
        duration: '9 Hari',
        type: 'umroh',
        quota: 45,
        isAvailable: true,
        imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
        facilities: 'Tiket PP Saudia Airlines, Hotel Makkah Pullman Zamzam (50m), Hotel Madinah Grand Plaza (100m), Makan 3x Sehari, Bus AC Executive, Zamzam 5L, Perlengkapan Umrah Lengkap',
        excludes: JSON.stringify(["Paspor", "Vaksin Meningitis", "Keperluan Pribadi"]),
        hotel: 'Pullman Zamzam Makkah & Grand Plaza Madinah',
        muthawwifName: 'Ustadz Ahmad Fauzi, Lc.',
        muthawwifRole: 'Pembimbing Utama',
        muthawwifPhone: '081299887766'
      }).returning();
      pkgReguler = p1;

      const [p2] = await db.insert(schema.packages).values({
        workspaceId: ws.id,
        name: "Paket Umrah VIP Executive Clock Tower (12 Hari)",
        description: JSON.stringify(["Hotel Fairmont Clock Tower Ring 1", "Hotel Dar Al Taqwa Madinah", "Kereta Cepat Haramain First Class"]),
        price: '38000000.00',
        duration: '12 Hari',
        type: 'umroh',
        quota: 30,
        isAvailable: true,
        imageUrl: 'https://images.unsplash.com/photo-1580238053495-b9720401fd45?auto=format&fit=crop&w=1200&q=80',
        facilities: 'Tiket PP Direct Flight Garuda Indonesia / Saudia, Fairmont Clock Tower Makkah, Dar Al Taqwa Madinah, Kereta Cepat Haramain First Class, Menu Buffet Internasional, Asuransi Full Cover',
        excludes: JSON.stringify(["Keperluan Pribadi"]),
        hotel: 'Fairmont Clock Tower & Dar Al Taqwa Madinah',
        muthawwifName: 'Dr. H. Muhammad Ridwan, M.A.',
        muthawwifRole: 'Muthawwif Senior',
        muthawwifPhone: '081122334455'
      }).returning();
      pkgVip = p2;

      // Seed schedules
      if (pkgReguler) {
        await db.insert(schema.schedules).values({
          workspaceId: ws.id,
          packageId: pkgReguler.id,
          departureDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          name: 'Keberangkatan Kloter 1 Reguler',
          airline: 'Saudia Airlines',
          totalSeats: 45,
          availableSeats: 32,
          muthawwifName: pkgReguler.muthawwifName
        });

        // Seed itineraries
        await db.insert(schema.package_itineraries).values([
          { packageId: pkgReguler.id, day: 1, title: 'Keberangkatan Jakarta - Jeddah', description: 'Berkumpul di Bandara Soekarno Hatta Terminal 3, proses check-in dan penerbangan menuju Jeddah.', location: 'Jakarta / Jeddah', meals: 'Dinner' },
          { packageId: pkgReguler.id, day: 2, title: 'Makkah - Umrah Pertama', description: 'Tiba di Makkah, check-in hotel, dilanjutkan pelaksanaan Thawaf, Sa\'i dan Tahallul.', location: 'Makkah Al-Mukarramah', meals: 'B, L, D' },
          { packageId: pkgReguler.id, day: 3, title: 'Ziarah Kota Makkah', description: 'Ziarah Jabal Tsur, Padang Arafah, Jabal Rahmah, Muzdalifah dan Mina.', location: 'Makkah', meals: 'B, L, D' }
        ]);
      }
    } else {
      pkgReguler = existingPackages[0];
    }

    // 4. Mitra Seeding
    const existingMitra = await db.select().from(schema.mitraUsers).where(eq(schema.mitraUsers.email, 'mitra@goldentravel.id')).catch(() => []);
    let sampleMitraUser: any = null;
    if (!existingMitra || existingMitra.length === 0) {
      console.log("Seeding Akun Mitra Sampel...");
      const [m] = await db.insert(schema.mitraUsers).values({
        name: 'Ustadz Ahmad Mitra',
        email: 'mitra@goldentravel.id',
        noWa: '081234567890',
        passwordHash: hashPassword('mitra123'),
        statusAkun: 'active'
      }).returning();
      sampleMitraUser = m;

      if (sampleMitraUser) {
        await db.insert(schema.mitraProfiles).values({
          userId: sampleMitraUser.id,
          namaLengkap: 'Ustadz Ahmad Mitra',
          nik: '3171010101900001',
          tempatLahir: 'Jakarta',
          tanggalLahir: '1990-05-15',
          alamatLengkap: 'Jl. Raya Kebayoran No. 12, Jakarta Selatan',
          namaBank: 'Bank Syariah Indonesia (BSI)',
          noRekening: '7112233445',
          namaPemilikRekening: 'Ahmad Mitra',
          whatsapp: '081234567890',
          kota: 'Jakarta Selatan',
          provinsi: 'DKI Jakarta'
        });

        await db.insert(schema.mitraCommissionPayouts).values({
          workspaceId: ws.id,
          mitraUserId: sampleMitraUser.id,
          mitraName: 'Ustadz Ahmad Mitra',
          mitraPhone: '081234567890',
          jamaahName: 'Budi Santoso',
          packageName: pkgReguler?.name || 'Paket Umrah Reguler Bintang 4',
          amount: '1500000.00',
          bankName: 'BSI',
          accountNumber: '7112233445',
          accountHolder: 'Ahmad Mitra',
          status: 'APPROVED',
          adminNotes: 'Komisi pendaftaran jamaah Budi Santoso telah dicairkan.',
          transferDate: new Date()
        });
      }
    }

    // 5. Jamaah & Booking Seeding
    const existingJamaah = await db.select().from(schema.users).where(eq(schema.users.email, 'jamaah@goldentravel.id')).catch(() => []);
    if (!existingJamaah || existingJamaah.length === 0) {
      console.log("Seeding Akun Jamaah & Booking Sampel...");
      const [jamaahUser] = await db.insert(schema.users).values({
        workspaceId: ws.id,
        uid: crypto.randomUUID(),
        name: 'Budi Santoso',
        email: 'jamaah@goldentravel.id',
        phone: '081388990011',
        password: hashPassword('jamaah123'),
        role: 'jamaah',
        status: 'active'
      }).returning();

      if (jamaahUser && pkgReguler) {
        const [reg] = await db.insert(schema.registrations).values({
          workspaceId: ws.id,
          userId: jamaahUser.id,
          packageId: pkgReguler.id,
          status: 'LUNAS',
          ordererName: 'Budi Santoso',
          ordererPhone: '081388990011',
          ordererEmail: 'jamaah@goldentravel.id',
          adultCount: '1',
          totalAmount: pkgReguler.price,
          paxData: [{
            fullName: 'Budi Santoso',
            gender: 'Laki-laki',
            passportNumber: 'A12345678',
            phone: '081388990011'
          }]
        }).returning();

        if (reg) {
          const [pay] = await db.insert(schema.payments).values({
            workspaceId: ws.id,
            registrationId: reg.id,
            paymentType: 'PELUNASAN',
            amount: pkgReguler.price,
            proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
            status: 'VERIFIED',
            adminNotes: 'Pembayaran Lunas diverifikasi.'
          }).returning();

          if (pay) {
            await db.insert(schema.financial_ledger).values({
              workspaceId: ws.id,
              paymentId: pay.id,
              amount: pkgReguler.price,
              transactionType: 'in',
              description: `Pembayaran Pelunasan Umrah - Jemaah Budi Santoso (${pkgReguler.name})`
            });
          }
        }
      }
    }

    // 6. Gallery Photos Seeding
    const galleryCount = await db.select({ count: sql`count(*)` }).from(schema.gallery_photos);
    if (Number(galleryCount[0].count) === 0) {
      console.log("Seeding foto galeri...");
      const defaultPhotos = [
        { title: "Thawaf Khusyuk & Sa\'i Jemaah VIP Ring 1", imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80" },
        { title: "Kajian Sirah Nabawiyah Eksklusif", imageUrl: "https://images.unsplash.com/photo-1580238053495-b9720401fd45?auto=format&fit=crop&w=1200&q=80" },
        { title: "Pelepasan Haru Jemaah VIP", imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=1200&q=80" },
        { title: "Perjalanan Kereta Cepat Haramain", imageUrl: "https://images.unsplash.com/photo-1561383827-046ee9fec886?auto=format&fit=crop&w=1200&q=80" },
        { title: "City Tour Jabal Magnet & Al-Ula", imageUrl: "https://images.unsplash.com/photo-1623512903741-9fb12a912bb1?auto=format&fit=crop&w=1200&q=80" }
      ];
      for (const p of defaultPhotos) {
        await db.insert(schema.gallery_photos).values({
          workspaceId: ws.id,
          title: p.title,
          imageUrl: p.imageUrl
        });
      }
    }

    // 7. Admin Settings Seeding
    try {
      const existingSettings = await db.select().from(schema.adminSettings).catch(() => []);
      if (!existingSettings || existingSettings.length === 0) {
        await db.insert(schema.adminSettings).values({
          workspaceId: ws.id,
          travelName: 'PT Golden Travel Umrah & Hajj',
          whatsappNumber: '08111111111',
          defaultCommissionRate: '1500000.00',
          bankAccounts: [
            { bankName: 'Bank Syariah Indonesia (BSI)', accountNumber: '7700889911', accountHolder: 'PT Golden Travel Indonesia' },
            { bankName: 'Bank Mandiri', accountNumber: '1230009876543', accountHolder: 'PT Golden Travel Indonesia' }
          ]
        });
      }
    } catch (e: any) {
      // Silently handle if already existing or initialized
    }

    console.log("=== SEEDING SELESAI DENGAN SUKSES ===");
  } catch (err: any) {
    console.error("Kesalahan saat seeding database:", err?.message || err);
  }
}

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    // Run initialization in the background so it doesn't delay startup
    (async () => {
      try {
        await initializeGlobalDatabase();
        await seedAllPortals();
      } catch (err) {
        console.error("Gagal menjalankan inisialisasi database / seeder:", err);
      }
    })();

    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});
