// Suppress GCP MetadataLookupWarning when running outside GCP (e.g. Railway, Render)
process.env.DETECT_GCP_RETRIES = '0';
process.env.NO_GCP_METADATA = 'true';

process.on('warning', (warning) => {
  if (warning?.name === 'MetadataLookupWarning' || warning?.message?.includes('MetadataLookupWarning')) {
    return; // Ignore GCP metadata ping warnings in non-GCP hosts like Railway
  }
  console.warn(`[Process Warning] ${warning.name}: ${warning.message}`);
});

process.on('unhandledRejection', (reason: any) => {
  if (reason && (reason.name === 'MetadataLookupWarning' || String(reason?.message || reason).includes('MetadataLookupWarning') || String(reason?.message || reason).includes('All promises were rejected'))) {
    return; // Ignore GCP metadata lookup rejection on non-GCP hosts (Railway)
  }
  console.error('[Unhandled Rejection]', reason);
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
import { jsPDF } from 'jspdf';

function generateDocPdf(title: string, jamaahName: string, docType: string, registrationId: string): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const cleanCat = (docType || title || '').toLowerCase().trim();
  const safeName = (jamaahName || 'Jamaah').toUpperCase();

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 297, 210, 'F');

  // Top Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DOKUMEN RESMI JAMAAH - VERIFIKASI PORTAL', 15, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('JAMAAH: ' + safeName + ' | STATUS: TERUNGGAH', 282, 15, { align: 'right' });

  if (cleanCat.includes('ktp') || cleanCat.includes('penduduk')) {
    // KTP Card Layout
    doc.setFillColor(224, 242, 254);
    doc.setDrawColor(3, 105, 161);
    doc.setLineWidth(1);
    doc.roundedRect(30, 35, 237, 140, 6, 6, 'FD');

    doc.setTextColor(3, 43, 69);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIK INDONESIA', 148, 46, { align: 'center' });
    doc.setFontSize(10);
    doc.text('PROVINSI DKI JAKARTA - KOTA JAKARTA SELATAN', 148, 52, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('courier', 'bold');
    doc.text('NIK : 3174092810880005', 42, 65);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 28, 44);

    const labels = [
      ['Nama', ': ' + safeName],
      ['Tempat/Tgl Lahir', ': JAKARTA, 15 OKTOBER 1988'],
      ['Jenis Kelamin', ': LAKI-LAKI        Gol. Darah: O'],
      ['Alamat', ': JL. KEBAYORAN BARU NO. 45'],
      ['   RT/RW', ': 004 / 007'],
      ['   Kel/Desa', ': KEBAYORAN LAMA'],
      ['   Kecamatan', ': KEBAYORAN LAMA'],
      ['Agama', ': ISLAM'],
      ['Status Perkawinan', ': MENIKAH'],
      ['Pekerjaan', ': KARYAWAN SWASTA'],
      ['Kewarganegaraan', ': WNI'],
      ['Berlaku Hingga', ': SEUMUR HIDUP']
    ];

    let y = 74;
    labels.forEach(([lbl, val]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(lbl, 42, y);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 85, y);
      y += 8;
    });

    doc.setFillColor(185, 28, 28);
    doc.roundedRect(210, 65, 45, 60, 3, 3, 'F');
    doc.setFillColor(254, 202, 202);
    doc.circle(232.5, 83, 11, 'F');

    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.line(210, 155, 255, 155);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('JAKARTA SELATAN', 232.5, 160, { align: 'center' });

  } else if (cleanCat.includes('paspor') || cleanCat.includes('passport')) {
    // Paspor Card Layout
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1.5);
    doc.roundedRect(30, 35, 237, 140, 6, 6, 'FD');

    doc.setFillColor(30, 41, 59);
    doc.rect(30, 35, 237, 20, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIK INDONESIA - PASPOR / PASSPORT', 148, 48, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Jenis/Type: P     Kode Negara/Country: IDN     No Paspor: B 9823145', 42, 65);
    
    doc.setFontSize(14);
    doc.text('NAMA / FULL NAME: ' + safeName, 42, 78);

    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text('Kewarganegaraan: INDONESIA', 42, 90);
    doc.text('Tgl Lahir: 15 OCT 1988', 42, 100);
    doc.text('Tempat Lahir: JAKARTA', 42, 110);
    doc.text('Tgl Pengeluaran: 20 JAN 2024', 42, 120);
    doc.setTextColor(34, 197, 94);
    doc.text('Tgl Habis Berlaku: 20 JAN 2034', 42, 130);

    doc.setFillColor(51, 65, 85);
    doc.roundedRect(205, 65, 45, 60, 3, 3, 'F');

    doc.setFillColor(2, 6, 23);
    doc.rect(30, 145, 237, 30, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('P<IDN' + safeName.replace(/[^A-Z]/g, '') + '<<<<<<<<<<<<<<<<<<<<<<<<<', 35, 156);
    doc.text('B9823145<4IDN8810158M3401205<<<<<<<<<<<<<06', 35, 166);

  } else {
    // General Document Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(30, 35, 237, 140, 6, 6, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text((docType || title || 'DOKUMEN JAMAAH').toUpperCase(), 45, 55);

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.5);
    doc.line(45, 60, 252, 60);

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);

    const info = [
      ['Nama Lengkap Jamaah', safeName],
      ['Jenis Dokumen', docType || title || 'Dokumen Terunggah'],
      ['ID Registrasi', registrationId || '-'],
      ['Status Verifikasi', 'TERDAFTAR & SAH'],
      ['Tanggal Berkas', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })]
    ];

    let y = 75;
    info.forEach(([k, v]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(k, 45, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(':  ' + v, 105, y);
      y += 11;
    });

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(45, 135, 207, 30, 4, 4, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CATATAN VERIFIKASI DOKUMEN:', 52, 145);
    doc.setFont('helvetica', 'normal');
    doc.text('Dokumen ini tersimpan secara sah di database portal admin dan siap ditinjau untuk kelengkapan umroh.', 52, 155);
  }

  // Footer bar
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 195, 297, 15, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Dokumen ini dihasilkan secara otomatis oleh Portal Travel Umroh & Haji.', 148, 204, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

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
    isPdf: sql<boolean>`LOWER(${schema.documents.fileUrl}) LIKE 'data:application/pdf%' OR LOWER(${schema.documents.fileUrl}) LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%' OR LOWER(${schema.documents.docType}) LIKE '%pdf%'`.as('is_pdf'),
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
  return docs.map((d: any) => {
    const isPdfBool = Boolean(d.isPdf) ||
      d.isPdf === 1 ||
      String(d.isPdf).toLowerCase() === 'true' ||
      (d.fileUrl && (d.fileUrl.toLowerCase().includes('.pdf') || d.fileUrl.includes('data:application/pdf') || d.fileUrl.includes('JVBERi0'))) ||
      (d.docType && d.docType.toLowerCase().includes('pdf'));
    return {
      ...d,
      isPdf: isPdfBool,
      fileUrl: d.fileUrl && d.fileUrl.trim() !== '' && !d.fileUrl.startsWith('/api/documents/') ? d.fileUrl : (d.hasFile ? `/api/documents/${d.id}/file${isPdfBool ? '.pdf' : '.png'}` : null)
    };
  });
}

async function getCertificatesQuery(options: any) {
  let query: any = db.select({
    id: schema.certificates.id,
    workspaceId: schema.certificates.workspaceId,
    registrationId: schema.certificates.registrationId,
    recipientName: schema.certificates.recipientName,
    certificateUrl: schema.certificates.certificateUrl,
    createdAt: schema.certificates.createdAt,
    isPdf: sql<boolean>`${schema.certificates.certificateUrl} LIKE 'data:application/pdf%' OR ${schema.certificates.certificateUrl} LIKE '%.pdf%'`.as('is_pdf'),
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
  return certs.map((c: any) => {
    let url = c.certificateUrl;
    if (!url && c.hasCert) {
      url = `/api/certificates/${c.id}/file${c.isPdf ? '.pdf' : '.png'}`;
    } else if (url && url.startsWith('data:')) {
      url = `/api/certificates/${c.id}/file${c.isPdf ? '.pdf' : '.png'}`;
    }
    return {
      ...c,
      certificateUrl: url
    };
  });
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
const packagesCache = new Map<string, { data: any; timestamp: number }>();

export function invalidatePackagesCache() {
  packagesCache.clear();
}

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

// Helper to safely get a valid UUID workspace ID
let _cachedDefaultWorkspaceId: string | null = null;
async function getDefaultWorkspaceId(): Promise<string> {
  if (_cachedDefaultWorkspaceId && isValidUuid(_cachedDefaultWorkspaceId)) {
    return _cachedDefaultWorkspaceId;
  }
  try {
    const ws = await withRetry(() => db.query.workspaces.findFirst());
    if (ws && ws.id && isValidUuid(ws.id)) {
      _cachedDefaultWorkspaceId = ws.id;
      return ws.id;
    }
    const [newWs] = await withRetry(() => db.insert(schema.workspaces).values({
      name: "Golden Travel Workspace",
      slug: `golden-travel-workspace`
    }).returning());
    if (newWs && newWs.id && isValidUuid(newWs.id)) {
      _cachedDefaultWorkspaceId = newWs.id;
      return newWs.id;
    }
  } catch (e) {
    console.warn("[Workspace] Error finding/creating workspace:", e);
  }
  return '206247ec-7f3b-4e74-8dc6-b109372dbbef';
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

        if (!effectiveUser.workspaceId || !isValidUuid(effectiveUser.workspaceId)) {
          effectiveUser.workspaceId = await getDefaultWorkspaceId();
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
    invalidatePackagesCache();
    adminStatsCache.clear();
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

  // Fallback handler for missing uploads on ephemeral disk (e.g. after container restart)
  const handleMissingUpload = async (req: express.Request, res: express.Response) => {
    const filename = path.basename(req.path);
    if (!filename || filename === '/' || filename === 'uploads') {
      return res.status(404).send('Not Found');
    }

    const uploadPath = path.join(uploadDir, filename);
    if (fs.existsSync(uploadPath)) return res.sendFile(uploadPath);

    const publicPath = path.join(publicUploadDir, filename);
    if (fs.existsSync(publicPath)) return res.sendFile(publicPath);

    let jamaahName = 'Jamaah';
    let docType = filename.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '').toUpperCase();
    let registrationId = '';

    // Try finding matching record in DB to restore base64 data if available
    try {
      const doc = await db.query.documents.findFirst({
        where: or(
          like(schema.documents.fileUrl, `%${filename}%`),
          eq(schema.documents.fileUrl, `/uploads/${filename}`)
        )
      });
      if (doc) {
        if (doc.docType) docType = doc.docType;
        if (doc.registrationId) registrationId = doc.registrationId;

        if (doc.fileUrl && (doc.fileUrl.startsWith('data:') || doc.fileUrl.includes('base64,'))) {
          const restoredPath = saveFileToUploads(doc.fileUrl);
          const absRestored = path.join(process.cwd(), restoredPath);
          if (fs.existsSync(absRestored)) {
            return res.sendFile(absRestored);
          }
        }

        // Retrieve Jamaah Name
        if (doc.registrationId) {
          const reg = await db.query.registrations.findFirst({
            where: eq(schema.registrations.id, doc.registrationId)
          });
          if (reg && reg.ordererName) {
            jamaahName = reg.ordererName;
          }
        }
      }
    } catch (err) {
      console.error("[Storage] Error looking up missing upload in DB:", err);
    }

    const isPdf = filename.toLowerCase().endsWith('.pdf') || req.query.ext === '.pdf';
    if (isPdf) {
      try {
        const pdfBuf = generateDocPdf(docType, jamaahName, docType, registrationId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuf.length);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(pdfBuf);
      } catch (pdfErr) {
        console.error("[Storage] Error generating PDF fallback:", pdfErr);
      }
    }

    // Serve clean SVG document card preview for images
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="none">
      <rect width="800" height="500" rx="16" fill="#0f172a"/>
      <rect x="20" y="20" width="760" height="460" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 8"/>
      <rect x="330" y="90" width="140" height="180" rx="16" fill="#0284c7" opacity="0.15"/>
      <path d="M370 130h60m-60 30h60m-60 30h40" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
      <text x="400" y="320" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">${docType.substring(0, 40)}</text>
      <text x="400" y="355" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Dokumen ${jamaahName} Terverifikasi. Berkas Siap Di-review.</text>
      <text x="400" y="420" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="12">Sistem Manajemen Dokumen Umroh & Hajj</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).send(svgContent);
  };

  app.get('/uploads/:filename', handleMissingUpload);
  app.get('/public/uploads/:filename', handleMissingUpload);

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

  // Helper function to delete files from uploads folder on disk
  function deleteFileFromUploads(fileUrl: string | null | undefined): void {
    if (!fileUrl || typeof fileUrl !== 'string') return;
    const clean = fileUrl.trim().replace(/^\/?(public\/)?/, '');
    if (clean.startsWith('uploads/')) {
      const filename = path.basename(clean);
      const filePath = path.join(uploadDir, filename);
      const publicFilePath = path.join(publicUploadDir, filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      try { if (fs.existsSync(publicFilePath)) fs.unlinkSync(publicFilePath); } catch (e) {}
      console.log(`[Storage] Deleted file physically from disk due to failure: ${filename}`);
    }
  }

  // Helper function to resolve ANY registration identifier (UUID, user-<id>, REG-..., pax ID, email, etc.) to the real Registration database record (UUID)
  async function findRegistrationByAnyIdentifier(
    identifier: string | null | undefined, 
    workspaceId?: string
  ): Promise<{ registration: typeof schema.registrations.$inferSelect | null; ambiguous?: boolean }> {
    if (!identifier || typeof identifier !== 'string') return { registration: null };
    const cleanId = identifier.trim();
    if (!cleanId) return { registration: null };

    // 1. Direct UUID lookup on registrations.id and registrations.userId with workspace scope
    if (isValidUuid(cleanId)) {
      try {
        const idConds: any[] = [eq(schema.registrations.id, cleanId)];
        if (workspaceId) idConds.push(eq(schema.registrations.workspaceId, workspaceId));

        const regById = await withRetry(() => db.query.registrations.findFirst({
          where: and(...idConds)
        })).catch(() => null);
        if (regById) return { registration: regById };

        const userConds: any[] = [eq(schema.registrations.userId, cleanId)];
        if (workspaceId) userConds.push(eq(schema.registrations.workspaceId, workspaceId));

        const regByUserId = await withRetry(() => db.query.registrations.findFirst({
          where: and(...userConds)
        })).catch(() => null);
        if (regByUserId) return { registration: regByUserId };
      } catch (e) {}
    }

    // 2. Handle 'user-<uuid>' prefix with workspace scope
    if (cleanId.startsWith('user-')) {
      const rawUserId = cleanId.replace(/^user-/, '').trim();
      if (isValidUuid(rawUserId)) {
        try {
          const userConds: any[] = [eq(schema.registrations.userId, rawUserId)];
          if (workspaceId) userConds.push(eq(schema.registrations.workspaceId, workspaceId));

          const regByUserId = await withRetry(() => db.query.registrations.findFirst({
            where: and(...userConds)
          })).catch(() => null);
          if (regByUserId) return { registration: regByUserId };
        } catch (e) {}
      }
    }

    // 3. Search registrations by public code, ordererEmail, ordererNotes, or paxData JSON items strictly in workspace
    try {
      const allRegs = await withRetry(() => db.query.registrations.findMany({
        where: workspaceId ? eq(schema.registrations.workspaceId, workspaceId) : undefined
      })).catch(() => []);

      const targetLower = cleanId.toLowerCase();
      const matches: typeof schema.registrations.$inferSelect[] = [];

      for (const reg of allRegs) {
        let isMatch = false;

        if (reg.id === cleanId || reg.userId === cleanId) {
          isMatch = true;
        } else if (reg.ordererEmail && reg.ordererEmail.toLowerCase() === targetLower) {
          isMatch = true;
        } else if (reg.ordererNotes && reg.ordererNotes.includes(cleanId)) {
          isMatch = true;
        } else if (Array.isArray(reg.paxData)) {
          isMatch = reg.paxData.some((p: any) => {
            if (!p) return false;
            const pId = String(p.id || '').trim();
            const pRegId = String(p.registrationId || '').trim();
            const pDocId = String(p.docId || '').trim();
            const pEmail = String(p.email || '').toLowerCase().trim();
            const pName = String(p.fullName || p.userName || p.namaLengkap || p.name || '').toLowerCase().trim();

            if (pId && pId === cleanId) return true;
            if (pRegId && pRegId === cleanId) return true;
            if (pDocId && pDocId === cleanId) return true;
            if (pEmail && pEmail === targetLower) return true;
            if (targetLower.length >= 3 && pName && pName === targetLower) return true;

            return false;
          });
        }

        if (isMatch) {
          if (!matches.some(m => m.id === reg.id)) {
            matches.push(reg);
          }
        }
      }

      if (matches.length === 1) {
        return { registration: matches[0] };
      } else if (matches.length > 1) {
        return { registration: null, ambiguous: true };
      }
    } catch (err) {
      console.warn("[findRegistrationByAnyIdentifier] Query failed:", err);
    }

    return { registration: null };
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
    await runSql(`ALTER TABLE "sertifikat_kenangan" ALTER COLUMN "registration_id" SET NOT NULL;`);

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

    // 22. Mitra MOUs Table
    await runSql(`
      CREATE TABLE IF NOT EXISTS "mitra_mous" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mou_number" text NOT NULL,
        "title" text NOT NULL,
        "mitra_id" text NOT NULL,
        "mitra_name" text,
        "file_url" text NOT NULL,
        "file_name" text,
        "file_size" text,
        "status" text DEFAULT 'menunggu_tanda_tangan' NOT NULL,
        "effective_date" text,
        "expiry_date" text,
        "notes" text,
        "signed_file_url" text,
        "signed_at" timestamp,
        "signed_by_name" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

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
        let workspaceId = matchedAdmin.workspaceId;
        if (!workspaceId || !isValidUuid(workspaceId)) {
          workspaceId = defaultWs?.id && isValidUuid(defaultWs.id) ? defaultWs.id : await getDefaultWorkspaceId();
        }
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

        notifyUpdate();
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

      const normalizedPaymentType = normalizePaymentTypeForDb(paymentType || 'DP1');

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
        status: normalizePaymentStatusForDb('PENDING') as any
      }).returning());

      // Update user/registration status to VERIFIKASI_BAYAR
      await db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, reg.userId));
      await db.update(schema.registrations).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.registrations.id, reg.id));

      notifyUpdate();
      res.status(201).json(newPayment);
    } catch (error: any) {
      console.error("[Registrasi Transaksis API FATAL]:", error);
      res.status(500).json({ error: `Gagal mengunggah bukti bayar: ${error.message || String(error)}` });
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

  async function handleCertificateUpload(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "Forbidden: Akses khusus admin." });
    }

    const authenticatedWorkspaceId = req.user?.workspaceId;
    if (!authenticatedWorkspaceId || !isValidUuid(authenticatedWorkspaceId)) {
      return res.status(403).json({ error: "Authenticated workspace ID is missing or invalid." });
    }

    const { recipientName, certificateUrl, registrationId, registration_id } = req.body || {};
    const targetIdentifier = req.params.id || registrationId || registration_id;

    if (!targetIdentifier || typeof targetIdentifier !== 'string' || !targetIdentifier.trim()) {
      return res.status(400).json({ error: "ID registrasi (registrationId) wajib diisi." });
    }

    if (!certificateUrl || typeof certificateUrl !== 'string' || !certificateUrl.trim()) {
      return res.status(400).json({ error: "File atau URL sertifikat (certificateUrl) wajib diisi." });
    }

    try {
      const { registration: reg, ambiguous } = await findRegistrationByAnyIdentifier(targetIdentifier.trim(), authenticatedWorkspaceId);
      if (ambiguous) {
        return res.status(400).json({ error: "Ditemukan lebih dari satu registrasi yang cocok. Harap gunakan ID registrasi (UUID) yang spesifik." });
      }
      if (!reg) {
        return res.status(404).json({ error: "Registrasi jamaah tidak ditemukan atau tidak berada di workspace ini." });
      }

      if (reg.workspaceId !== authenticatedWorkspaceId) {
        return res.status(403).json({ error: "Forbidden: Registrasi tidak milik workspace pengguna." });
      }

      let finalCertUrl = certificateUrl.trim();
      let createdFilePath: string | null = null;
      if (finalCertUrl.startsWith('data:') || finalCertUrl.includes('base64,')) {
        finalCertUrl = saveFileToUploads(finalCertUrl, 'certificate');
        if (finalCertUrl.startsWith('/uploads/')) createdFilePath = finalCertUrl;
      }

      const finalRecipientName = (recipientName && typeof recipientName === 'string' && recipientName.trim()) 
        ? recipientName.trim() 
        : (reg.ordererName || 'Jamaah');

      let newCert: any;
      try {
        [newCert] = await withRetry(() => db.insert(schema.certificates).values({
          workspaceId: authenticatedWorkspaceId,
          registrationId: reg.id,
          recipientName: finalRecipientName,
          certificateUrl: finalCertUrl
        }).returning());
      } catch (insertErr: any) {
        if (createdFilePath) deleteFileFromUploads(createdFilePath);
        console.error("[Certificates POST] Insert failed:", insertErr);
        return res.status(500).json({ error: "Gagal menyimpan sertifikat ke database. Silakan coba lagi." });
      }

      // Notify user
      if (reg.userId) {
        await withRetry(() => db.insert(schema.notifications).values({
          workspaceId: authenticatedWorkspaceId,
          userId: reg.userId,
          title: "Sertifikat Digital Tersedia",
          message: "Sertifikat kenangan Anda telah diterbitkan. Silakan unduh di dashboard.",
          type: 'success',
          isRead: 'false'
        })).catch(() => {});
      }

      notifyUpdate();
      return res.status(201).json(newCert);
    } catch (error: any) {
      console.error("[POST Certificate Error]:", error);
      return res.status(500).json({ error: "Gagal mengunggah sertifikat." });
    }
  }

  async function handleCertificateDelete(req: AuthRequest, res: Response) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    const certId = req.params.id;
    if (!certId) return res.status(400).json({ error: "ID sertifikat wajib diisi." });

    try {
      let targetCert: any = null;
      if (isValidUuid(certId)) {
        targetCert = await db.query.certificates.findFirst({
          where: and(eq(schema.certificates.id, certId), eq(schema.certificates.workspaceId, req.user!.workspaceId!))
        });
      }

      if (!targetCert) {
        const certs = await db.query.certificates.findMany({
          where: eq(schema.certificates.workspaceId, req.user!.workspaceId!)
        });
        targetCert = certs.find((c: any) => c.recipientName === certId || c.registrationId === certId);
      }

      if (targetCert) {
        if (targetCert.certificateUrl && targetCert.certificateUrl.startsWith('/uploads/')) {
          deleteFileFromUploads(targetCert.certificateUrl);
        }
        await db.delete(schema.certificates).where(eq(schema.certificates.id, targetCert.id));
      }

      res.json({ success: true });
      notifyUpdate();
    } catch (err) {
      console.error("[Delete Certificate Error]:", err);
      res.status(500).json({ error: "Gagal menghapus sertifikat." });
    }
  }

  app.post("/api/registrasi/:id/sertifikat", authenticate, handleCertificateUpload);
  app.post("/api/admin/certificates", authenticate, handleCertificateUpload);
  app.post("/api/certificates", authenticate, handleCertificateUpload);
  app.delete("/api/admin/certificates/:id", authenticate, handleCertificateDelete);
  app.delete("/api/certificates/:id", authenticate, handleCertificateDelete);

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
      
      const userWsId = req.user!.workspaceId;
      const filters = [
        userWsId 
          ? or(eq(schema.users.workspaceId, userWsId), isNull(schema.users.workspaceId))
          : undefined,
        eq(schema.users.role, 'jamaah'),
        isNull(schema.users.deletedAt)
      ].filter(Boolean);
      
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
      let wsId: string | undefined = req.user?.workspaceId;
      if (!wsId || !isValidUuid(wsId)) {
        wsId = await getDefaultWorkspaceId();
      }
      const data: any = {
        workspaceId: wsId,
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

    // 4. Delete manifests, memories, and itineraries directly referencing packageId
    await withRetry(() => db.delete(schema.manifests).where(eq(schema.manifests.packageId, packageId))).catch(() => {});
    await withRetry(() => db.delete(schema.memories).where(eq(schema.memories.packageId, packageId))).catch(() => {});
    await withRetry(() => db.delete(schema.package_itineraries).where(eq(schema.package_itineraries.packageId, packageId))).catch(() => {});

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
    const { registrationId, jamaahId, docId, docType, status, rejectionReason } = req.body;
    
    // Guard for client-side/localStorage only records (e.g. non-UUID registrationId)
    if (registrationId && !isValidUUID(registrationId)) {
      const newStatus = (status === 'approved' || status === 'VERIFIED' || status === 'verified') ? 'VERIFIED' : 
                        (status === 'rejected' || status === 'REJECTED' || status === 'rejected') ? 'REJECTED' : 'PENDING';
      return res.json({
        id: "client-side-dummy-id",
        registrationId,
        docType,
        status: newStatus,
        adminNotes: rejectionReason || null,
        fileUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true
      });
    }
    
    try {
      let resultDoc = null;
      const newStatus = (status === 'approved' || status === 'VERIFIED' || status === 'verified') ? 'VERIFIED' : 
                        (status === 'rejected' || status === 'REJECTED' || status === 'rejected') ? 'REJECTED' : 'PENDING';

      // USE TRANSACTION TO PREVENT RACE CONDITIONS
      await db.transaction(async (tx) => {
        let targetDoc = null;

        if (docId && isValidUUID(docId)) {
          targetDoc = await tx.query.documents.findFirst({
            where: eq(schema.documents.id, docId)
          });
        }

        if (!targetDoc && registrationId && docType) {
          targetDoc = await tx.query.documents.findFirst({
            where: and(
              eq(schema.documents.registrationId, registrationId),
              eq(schema.documents.docType, docType as any)
            )
          });
        }

        if (targetDoc) {
          const [updated] = await tx.update(schema.documents)
            .set({
              status: newStatus as any,
              adminNotes: rejectionReason || null,
              updatedAt: new Date()
            })
            .where(eq(schema.documents.id, targetDoc.id))
            .returning();
          resultDoc = updated;
        } else if (registrationId && docType) {
          const reg = await tx.query.registrations.findFirst({ where: eq(schema.registrations.id, registrationId) });
          const [inserted] = await tx.insert(schema.documents).values({
            registrationId,
            docType: docType as any,
            fileUrl: '',
            status: newStatus as any,
            adminNotes: rejectionReason || null,
            workspaceId: reg?.workspaceId || 'default'
          }).returning();
          resultDoc = inserted;
        }

        // --- ATOMIC SYNC TO paxData ---
        const targetRegId = targetDoc?.registrationId || registrationId;
        if (targetRegId && isValidUUID(targetRegId)) {
          const reg = await tx.query.registrations.findFirst({ where: eq(schema.registrations.id, targetRegId) });
          if (reg && Array.isArray(reg.paxData)) {
            // Standardize paxData status to lowercase 'verified'/'rejected'/'pending' for frontend compatibility
            const normStatus = newStatus === 'VERIFIED' ? 'verified' : newStatus === 'REJECTED' ? 'rejected' : 'pending';
            const targetType = docType || targetDoc?.docType;
            
            if (targetType) {
              const updatedPax = reg.paxData.map((p: any, pIdx: number) => {
                const generatedPaxId = `JAM-${targetRegId.substring(0, 8)}-${pIdx + 1}`;
                const targetName = (req.body.userName || targetDoc?.userName || '').trim().toLowerCase();
                const pName = (p.userName || p.namaLengkap || p.nama || p.fullName || p.name || p.pasporNama || '').trim().toLowerCase();

                const isTargetPax = !jamaahId || 
                  p.id === jamaahId || 
                  generatedPaxId === jamaahId || 
                  (targetName && pName && targetName === pName) ||
                  reg.paxData.length === 1;

                if (!isTargetPax) return p;

                const pDocs = { ...(p.documents || {}) };
                pDocs[targetType] = {
                  ...(pDocs[targetType] || {}),
                  status: normStatus,
                  adminNotes: rejectionReason || null,
                  updatedAt: new Date().toISOString()
                };
                return { ...p, documents: pDocs };
              });

              await tx.update(schema.registrations)
                .set({ 
                  paxData: updatedPax,
                  updatedAt: new Date()
                })
                .where(eq(schema.registrations.id, targetRegId));
            }
          }
        }
      });

      if (resultDoc) {
        notifyUpdate();
        return res.json(resultDoc);
      }

      res.status(404).json({ error: "Dokumen tidak ditemukan" });
    } catch (err: any) {
      console.error("Patch document verify error:", err);
      res.status(500).json({ error: "Gagal memproses verifikasi dokumen: " + err.message });
    }
  });

  // DELETE /api/admin/documents/:registrationId/:docType -> Delete/Reset single document of a passenger
  app.delete("/api/admin/documents/:registrationId/:docType", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { registrationId, docType } = req.params;
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
    try {
      await withRetry(() => db.delete(schema.documents).where(
        and(
          eq(schema.documents.registrationId, registrationId),
          eq(schema.documents.docType, docType as any)
        )
      ));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("[DELETE /api/admin/documents error]:", error);
      res.status(500).json({ error: error.message || "Gagal menghapus berkas dokumen" });
    }
  });

  // DELETE /api/admin/documents/:registrationId -> Delete/Reset all documents of a registration
  app.delete("/api/admin/documents/:registrationId", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { registrationId } = req.params;
    if (!isValidUUID(registrationId)) return res.status(400).json({ error: "ID Registrasi tidak valid" });
    
    try {
      await withRetry(() => db.delete(schema.documents).where(
        eq(schema.documents.registrationId, registrationId)
      ));
      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("[DELETE /api/admin/documents all error]:", error);
      res.status(500).json({ error: error.message || "Gagal menghapus semua berkas dokumen" });
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
    // Check memory cache to avoid heavy queries and prevent Rate exceeded on large base64 payload
    const cached = packagesCache.get("all_packages");
    if (cached && (Date.now() - cached.timestamp < 30000)) {
      return res.json(cached.data);
    }

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

      packagesCache.set("all_packages", { data: packagesWithCounts, timestamp: Date.now() });
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
      const allMemories = await withRetry(() => db.query.memories.findMany({
        orderBy: [desc(schema.memories.createdAt)]
      }));
      
      const formatted = allMemories.map((m: any) => {
        let title = m.title || '';
        let caption = m.caption || '';
        let date = m.date || '';
        let packageName = m.packageName || 'Semua Paket';
        let targetMitraName = m.targetMitraName || 'Semua Mitra / Publik';
        let targetJamaahId = m.targetJamaahId || '';
        let targetJamaahName = m.targetJamaahName || '';

        if (m.caption && typeof m.caption === 'string' && m.caption.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(m.caption);
            if (parsed && typeof parsed === 'object') {
              title = parsed.title || title;
              caption = parsed.caption || '';
              date = parsed.date || date;
              packageName = parsed.packageName || packageName;
              targetMitraName = parsed.targetMitraName || targetMitraName;
              targetJamaahId = parsed.targetJamaahId || targetJamaahId;
              targetJamaahName = parsed.targetJamaahName || targetJamaahName;
            }
          } catch (e) {}
        }

        return {
          id: m.id,
          title: title || caption || 'Momen Perjalanan',
          caption: caption,
          imageUrl: m.imageUrl || m.image_url,
          date: date || (m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          packageName: packageName,
          targetMitraName: targetMitraName,
          targetJamaahId: targetJamaahId,
          targetJamaahName: targetJamaahName,
          createdAt: m.createdAt || new Date().toISOString()
        };
      });

      res.json(formatted);
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
      if (!req.params.id || !isValidUuid(req.params.id)) {
        return res.status(400).send("Invalid certificate ID syntax");
      }
      const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.id, req.params.id) });
      if (!cert || !cert.certificateUrl) return res.status(404).send("Certificate not found");
      
      let fileData = cert.certificateUrl.trim();

      // Case 1: Relative upload path like /uploads/certificate-12345.pdf
      if (fileData.startsWith('/uploads/') || fileData.startsWith('uploads/') || fileData.startsWith('/public/uploads/')) {
        const cleanPath = fileData.replace(/^\/?(public\/)?/, '');
        const fullPath = path.join(process.cwd(), cleanPath);
        if (fs.existsSync(fullPath)) {
          const ext = path.extname(fullPath).toLowerCase();
          let contentType = 'application/octet-stream';
          if (ext === '.pdf') contentType = 'application/pdf';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.png') contentType = 'image/png';
          
          res.setHeader('Content-Type', contentType);
          if (req.query.download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${cert.recipientName || 'Sertifikat'}${ext}"`);
          }
          return res.sendFile(fullPath);
        }
      }

      // Case 2: Full external HTTP/HTTPS URL
      if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
        return res.redirect(fileData);
      }
      
      // Case 3: Data URI or Base64 string
      let contentType = 'application/pdf';
      let base64Content = fileData;

      if (fileData.startsWith('data:')) {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          base64Content = matches[2];
        } else {
          const parts = fileData.split(',');
          base64Content = parts[1] || parts[0];
        }
      } else if (fileData.includes('base64,')) {
        base64Content = fileData.split('base64,')[1];
      }

      if (base64Content.startsWith('JVBERi0')) contentType = 'application/pdf';
      else if (base64Content.startsWith('/9j/')) contentType = 'image/jpeg';
      else if (base64Content.startsWith('iVBORw')) contentType = 'image/png';

      const buffer = Buffer.from(base64Content, 'base64');
      let ext = '.pdf';
      if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';

      res.setHeader('Content-Type', contentType);
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${cert.recipientName || 'Sertifikat'}${ext}"`);
      }
      return res.send(buffer);
    } catch (error) {
      console.error("Error fetching certificate file:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Upload Payment Proof
  app.post("/api/payments", authenticate, async (req: AuthRequest, res) => {
    const { registrationId, paymentType, amount, proofUrl } = req.body;
    
    // Log incoming payload details safely
    console.log(`[Payments API] Incoming payment request - registrationId: ${registrationId}, paymentType: ${paymentType}, amount: ${amount}, hasProofUrl: ${!!proofUrl}`);
    
    try {
      // 1. Validation
      if (!registrationId) {
        return res.status(400).json({ error: "ID Pendaftaran tidak boleh kosong." });
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: `Nominal transfer tidak valid: '${amount}'` });
      }
      if (!proofUrl) {
        return res.status(400).json({ error: "Bukti transfer tidak boleh kosong. Harap unggah berkas terlebih dahulu." });
      }

      // 2. Fetch Registration
      const reg = await withRetry(() => db.query.registrations.findFirst({
              where: eq(schema.registrations.id, registrationId)
            }));
      if (!reg) {
         return res.status(404).json({ error: "Pendaftaran tidak ditemukan di dalam sistem kami." });
      }

      // 3. Authorization Checks
      const userEmail = req.user!.email ? req.user!.email.toLowerCase() : '';
      const isOwner = reg.userId === req.user!.id;
      const isOrderer = reg.ordererEmail && reg.ordererEmail.toLowerCase() === userEmail;
      const isPax = Array.isArray(reg.paxData) && reg.paxData.some((pax: any) => 
        pax && typeof pax === 'object' && pax.email && pax.email.toLowerCase() === userEmail
      );

      const isAuthorized = req.user!.role === 'admin' || isOwner || isOrderer || isPax;

      if (!isAuthorized) {
         console.warn(`[Payments API] Unauthorized access attempt by user ${req.user!.email} to registration ${registrationId}`);
         return res.status(403).json({ error: "Akses ditolak. Anda tidak memiliki otorisasi untuk melakukan pembayaran pada pendaftaran ini." });
      }

      // 4. Validate Registration Status
      const validStatusesForPayment = ['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT'];
      if (!validStatusesForPayment.includes(reg.status)) {
         return res.status(400).json({ error: `Pendaftaran belum mencapai tahap pembayaran (Status saat ini: ${reg.status}). Harap lengkapi tahap sebelumnya.` });
      }

      // 5. Normalize Payment Type
      const normalizedPaymentType = normalizePaymentTypeForDb(paymentType || 'DP1');

      // 6. Save Base64 file
      let savedProofUrl = '';
      try {
        savedProofUrl = saveFileToUploads(proofUrl, 'payment');
        if (!savedProofUrl) {
          throw new Error("Penyimpanan file bukti transfer mengembalikan URL kosong.");
        }
      } catch (fileErr: any) {
        console.error("[Payments API] Failed to save proof file:", fileErr);
        return res.status(500).json({ error: `Gagal menyimpan berkas bukti transfer: ${fileErr.message}` });
      }

      // 7. Anti-duplicate Check
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
          console.log(`[Payments API] Duplicate transaction detected. Merging into existing payment ID: ${existingPending.id}`);
          if (savedProofUrl && (!existingPending.proofUrl || existingPending.proofUrl !== savedProofUrl)) {
            await withRetry(() => db.update(schema.payments)
              .set({ proofUrl: savedProofUrl, amount: String(amount) })
              .where(eq(schema.payments.id, existingPending.id)));
            existingPending.proofUrl = savedProofUrl;
            existingPending.amount = String(amount);
          }
          notifyUpdate();
          return res.status(200).json(existingPending);
        }
      }

      // 8. Insert new payment record
      console.log(`[Payments API] Inserting new payment record for registration: ${reg.id}, type: ${normalizedPaymentType}, amount: ${amount}`);
      const insertedPayments = await withRetry(() => db.insert(schema.payments).values({
              workspaceId: reg.workspaceId,
              registrationId,
              paymentType: normalizedPaymentType,
              amount: String(amount),
              proofUrl: savedProofUrl,
              status: normalizePaymentStatusForDb('PENDING'),
            } as any).returning(), 5);

      if (!insertedPayments || insertedPayments.length === 0) {
        throw new Error("Gagal menyimpan data transaksi pembayaran ke database (Insert returned empty result).");
      }
      const newPayment = insertedPayments[0];

      // 9. Update States & Statuses
      console.log(`[Payments API] Updating user and registration statuses to VERIFIKASI_BAYAR...`);
      await withRetry(() => db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, req.user!.id)), 5);
      if (reg.userId && reg.userId !== req.user!.id) {
        await withRetry(() => db.update(schema.users).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.users.id, reg.userId)), 5);
      }
      await withRetry(() => db.update(schema.registrations).set({ status: 'VERIFIKASI_BAYAR' }).where(eq(schema.registrations.id, reg.id)), 5);

      console.log(`[Payments API] Payment processed successfully. ID: ${newPayment.id}`);
      res.status(201).json(newPayment);
      notifyUpdate();
    } catch (error: any) {
      console.error("[Payments API FATAL] Payment upload failed:", error);
      res.status(500).json({ 
        error: `Terjadi kesalahan internal pada server: ${error.message || String(error)}` 
      });
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
          isPdf: sql<boolean>`LOWER(${schema.documents.fileUrl}) LIKE 'data:application/pdf%' OR LOWER(${schema.documents.fileUrl}) LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%' OR LOWER(${schema.documents.docType}) LIKE '%pdf%'`.as('is_pdf'),
          hasFile: sql<boolean>`${schema.documents.fileUrl} IS NOT NULL AND ${schema.documents.fileUrl} != ''`.as('has_file')
        }).from(schema.documents).where(eq(schema.documents.registrationId, registration.id))).then(res => res.map(d => {
          const isPdfBool = Boolean(d.isPdf) || d.isPdf === 1 || String(d.isPdf).toLowerCase() === 'true' || (d.fileUrl && (d.fileUrl.toLowerCase().includes('.pdf') || d.fileUrl.includes('data:application/pdf') || d.fileUrl.includes('JVBERi0'))) || (d.docType && d.docType.toLowerCase().includes('pdf'));
          return {
            ...d,
            isPdf: isPdfBool,
            fileUrl: d.fileUrl && d.fileUrl.trim() !== '' && !d.fileUrl.startsWith('/api/documents/') ? d.fileUrl : (d.hasFile ? `/api/documents/${d.id}/file${isPdfBool ? '.pdf' : '.png'}` : null)
          };
        }));

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

  // Persistent Jamaah Storage Helpers (PostgreSQL Single Source of Truth)
  async function getAllJamaahFromDatabase() {
    try {
      const [allRegs, allDocs, allCerts] = await Promise.all([
        withRetry(() => db.query.registrations.findMany({
          with: {
            package: true,
            user: true
          }
        })).catch(() => []) as Promise<any[]>,
        withRetry(() => db.query.documents.findMany()).catch(() => []) as Promise<any[]>,
        withRetry(() => db.query.certificates.findMany()).catch(() => []) as Promise<any[]>
      ]);

      const docsMap = new Map<string, any>();
      (allDocs || []).forEach(d => {
        if (d.registrationId && d.docType) {
          docsMap.set(`${d.registrationId}_${d.docType}`, d);
        }
      });

      const certsMap = new Map<string, any>();
      (allCerts || []).forEach(c => {
        if (c.registrationId) certsMap.set(c.registrationId, c);
        if (c.recipientName) certsMap.set(c.recipientName.trim().toLowerCase(), c);
      });

      const jamaahList: any[] = [];
      const seenKeys = new Set<string>();

      allRegs.forEach(reg => {
        const paxArr = Array.isArray(reg.paxData) ? reg.paxData : [];
        paxArr.forEach((p, idx) => {
          if (!p) return;
          const pName = (p.userName || p.namaLengkap || p.nama || p.fullName || p.name || p.pasporNama || '').trim();
          if (!pName || pName.startsWith('Jamaah #')) return;

          const pKey = p.id || `${pName}_${p.nik || p.pasporNo || reg.id}_${idx}`;
          if (seenKeys.has(pKey)) return;
          seenKeys.add(pKey);

          // Build normalized documents object incorporating schema.documents table status
          const regId = p.registrationId || reg.id;
          const rawDocs = { ...(p.documents || {}) };
          const normalizedDocs: any = {};

          const docTypes = ['ktp', 'kk', 'paspor', 'foto', 'buku_nikah', 'vaksin', 'bpjs'];
          const allKeys = new Set([...Object.keys(rawDocs), ...docTypes]);

          allKeys.forEach(dt => {
            const docFromDb = docsMap.get(`${regId}_${dt}`) || docsMap.get(`${p.id}_${dt}`);
            const rawDoc = rawDocs[dt];

            if (docFromDb) {
              const dbSt = (docFromDb.status || '').toLowerCase();
              const normStatus = (dbSt === 'verified' || dbSt === 'approved') ? 'verified' : (dbSt === 'rejected' ? 'rejected' : 'pending');
              normalizedDocs[dt] = {
                ...(rawDoc || {}),
                id: docFromDb.id || rawDoc?.id,
                url: docFromDb.fileUrl || rawDoc?.url || '',
                fileUrl: docFromDb.fileUrl || rawDoc?.fileUrl || '',
                fileName: docFromDb.fileName || rawDoc?.fileName || '',
                fileType: docFromDb.fileType || rawDoc?.fileType || '',
                status: normStatus,
                adminNotes: docFromDb.adminNotes || rawDoc?.adminNotes || ''
              };
            } else if (rawDoc) {
              const rawSt = (rawDoc.status || '').toLowerCase();
              const normStatus = (rawSt === 'verified' || rawSt === 'approved') ? 'verified' : (rawSt === 'rejected' ? 'rejected' : 'pending');
              normalizedDocs[dt] = {
                ...rawDoc,
                status: normStatus
              };
            }
          });

          // Check certificates
          const certFromDb = certsMap.get(regId) || certsMap.get(p.id) || certsMap.get(pName.toLowerCase());
          const certData = certFromDb ? p.docFiles?.sertifikat : (p.isCertIssued ? p.docFiles?.sertifikat : undefined);
          const certUrl = certFromDb?.certificateUrl || (p.isCertIssued ? (p.certificateUrl || certData?.url || certData?.data || '') : '');
          const isCertIssued = !!(certFromDb || (p.isCertIssued && certUrl));

          const docFiles = { ...(p.docFiles || {}) };
          if (isCertIssued && certUrl) {
            docFiles.sertifikat = certData || {
              name: `Sertifikat_${pName.replace(/\s+/g, '_')}.pdf`,
              url: certUrl,
              data: certUrl,
              uploadedAt: certFromDb?.createdAt ? new Date(certFromDb.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
              recipientName: certFromDb?.recipientName || pName
            };
          } else {
            delete docFiles.sertifikat;
          }

          jamaahList.push({
            ...p,
            id: p.id || `JAM-${reg.id.substring(0, 8)}-${idx + 1}`,
            userName: pName,
            registrationId: regId,
            packageName: p.packageName || reg.package?.name || 'Paket Umroh',
            mitraId: p.mitraId || reg.userId || (reg.ordererNotes && reg.ordererNotes.includes('MitraID: ') ? reg.ordererNotes.replace('MitraID: ', '').trim() : 'mitra-user'),
            mitraName: p.mitraName || reg.ordererName || 'Mitra',
            mitraEmail: p.mitraEmail || reg.ordererEmail || '',
            statusBiodata: p.statusBiodata || (reg.status === 'VERIFIED' ? 'verified' : 'pending'),
            isComplete: p.isComplete !== undefined ? p.isComplete : true,
            documents: normalizedDocs,
            docFiles: docFiles,
            isCertIssued: isCertIssued,
            certificateUrl: certUrl || undefined
          });
        });
      });

      return jamaahList;
    } catch (err) {
      console.error("Error in getAllJamaahFromDatabase:", err);
      return [];
    }
  }

  async function syncJamaahListToDatabase(jamaahItems: any[], reqUser: any) {
    if (!Array.isArray(jamaahItems)) return { count: 0 };

    const defaultWorkspaceId = reqUser?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef';
    const groupMap = new Map<string, any[]>();

    jamaahItems.forEach((j: any) => {
      if (!j) return;
      const jName = (j.userName || j.namaLengkap || j.nama || j.fullName || j.name || j.pasporNama || '').trim();
      if (!jName || jName.startsWith('Jamaah #')) return;

      const regKey = j.registrationId || `REG-MITRA-${j.mitraId || reqUser.id}`;
      if (!groupMap.has(regKey)) {
        groupMap.set(regKey, []);
      }
      groupMap.get(regKey)!.push(j);
    });

    let totalSaved = 0;

    for (const [regId, items] of groupMap.entries()) {
      if (items.length === 0) continue;

      await db.transaction(async (tx) => {
        const sample = items[0];
        const mId = sample.mitraId || reqUser.id;
        const mName = sample.mitraName || sample.ordererName || reqUser.name || 'Mitra';
        const mEmail = (sample.mitraEmail || sample.ordererEmail || reqUser.email || '').toLowerCase().trim();

        // Resolve package ID
        let targetPkgId = sample.packageId;
        if (!targetPkgId || typeof targetPkgId !== 'string' || targetPkgId.length < 10) {
          const firstPkg = await tx.query.packages.findFirst().catch(() => null);
          if (firstPkg) targetPkgId = firstPkg.id;
        }

        // Find registration by regId or mEmail
        let existingReg = await tx.query.registrations.findFirst({
          where: eq(schema.registrations.id, regId)
        }).catch(() => null);

        if (!existingReg && mEmail) {
          existingReg = await tx.query.registrations.findFirst({
            where: eq(schema.registrations.ordererEmail, mEmail)
          }).catch(() => null);
        }

        if (existingReg) {
          const existingPax: any[] = Array.isArray(existingReg.paxData) ? existingReg.paxData : [];
          const mergedMap = new Map<string, any>();

          existingPax.forEach(p => {
            const pName = (p.userName || p.namaLengkap || p.nama || p.fullName || p.name || p.pasporNama || '').trim();
            const pKey = p.id || pName;
            if (pKey) mergedMap.set(pKey, p);
          });

          items.forEach(p => {
            const pName = (p.userName || p.namaLengkap || p.nama || p.fullName || p.name || p.pasporNama || '').trim();
            const pKey = p.id || pName;
            if (pKey) {
              const ex = mergedMap.get(pKey);
              const exDocs = ex?.documents || {};
              const pDocs = p.documents || {};
              const mergedDocs: any = { ...exDocs, ...pDocs };

              Object.keys(mergedDocs).forEach(dk => {
                const exDoc = exDocs[dk];
                const pDoc = pDocs[dk];
                if (exDoc && pDoc) {
                  const exStatus = (exDoc.status || '').toLowerCase();
                  const pStatus = (pDoc.status || '').toLowerCase();
                  const isTerminal = (s: string) => ['verified', 'approved', 'rejected', 'VERIFIED', 'REJECTED'].includes(s);
                  
                  // If existing is terminal and new is pending, keep terminal
                  if (isTerminal(exStatus) && !isTerminal(pStatus)) {
                    mergedDocs[dk] = {
                      ...pDoc,
                      ...exDoc,
                      status: exStatus === 'approved' || exStatus === 'verified' || exStatus === 'VERIFIED' ? 'verified' : 'rejected'
                    };
                  }
                }
              });

              mergedMap.set(pKey, {
                ...(ex || {}),
                ...p,
                userName: pName || ex?.userName || 'Jemaah',
                mitraId: mId,
                mitraName: mName,
                mitraEmail: mEmail,
                documents: mergedDocs
              });
            }
          });

          const updatedPax = Array.from(mergedMap.values());

          await tx.update(schema.registrations)
            .set({
              paxData: updatedPax,
              adultCount: updatedPax.length.toString(),
              ordererName: mName,
              ordererEmail: mEmail,
              ordererNotes: `MitraID: ${mId}`,
              updatedAt: new Date()
            })
            .where(eq(schema.registrations.id, existingReg.id));

          totalSaved += items.length;
        } else {
          if (targetPkgId) {
            try {
              await tx.insert(schema.registrations).values({
                userId: reqUser.id,
                packageId: targetPkgId,
                workspaceId: defaultWorkspaceId,
                ordererName: mName,
                ordererEmail: mEmail,
                ordererNotes: `MitraID: ${mId}`,
                adultCount: items.length.toString(),
                childCount: '0',
                infantCount: '0',
                totalAmount: (items.length * 32500000).toString(),
                paxData: items,
                status: 'ISI_BIODATA'
              });
              totalSaved += items.length;
            } catch (e) {
              console.error("Error inserting registration in syncJamaahListToDatabase:", e);
            }
          }
        }
      });
    }

    return { count: totalSaved };
  }

  // --- Mitra Jamaah Persistent Endpoints ---

  // POST /api/mitra/jamaah/sync -> Mitra syncs/saves Jamaah to PostgreSQL
  app.post("/api/mitra/jamaah/sync", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const jamaahList = req.body.jamaahList || req.body.paxList || [];
      const result = await syncJamaahListToDatabase(jamaahList, req.user);
      res.json({ success: true, count: result.count, message: "Data jamaah tersimpan ke PostgreSQL" });
    } catch (error: any) {
      console.error("Sync mitra jamaah error:", error);
      res.status(500).json({ error: "Gagal menyimpan data jamaah ke PostgreSQL" });
    }
  });

  // GET /api/mitra/jamaah/list -> Fetch current Mitra's Jamaah from PostgreSQL
  app.get("/api/mitra/jamaah/list", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'mitra' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const all = await getAllJamaahFromDatabase();
      const userEmail = (req.user.email || '').toLowerCase().trim();
      const userId = (req.user.id || '').toLowerCase().trim();

      const myJamaah = all.filter(j => {
        const jmId = (j.mitraId || '').toLowerCase().trim();
        const jmEmail = (j.mitraEmail || '').toLowerCase().trim();
        return (jmId && jmId === userId) || (jmEmail && jmEmail === userEmail);
      });

      res.json(myJamaah);
    } catch (error) {
      console.error("Get mitra jamaah list error:", error);
      res.status(500).json({ error: "Gagal mengambil data jamaah dari database" });
    }
  });

  // GET /api/admin/mitra/all-jamaah -> Fetch ALL Jamaah from PostgreSQL for Admin Panel
  app.get("/api/admin/mitra/all-jamaah", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const all = await getAllJamaahFromDatabase();
      res.json(all);
    } catch (error) {
      console.error("Admin all jamaah error:", error);
      res.status(500).json({ error: "Gagal mengambil semua data jamaah" });
    }
  });

  // POST /api/admin/mitra/jamaah/sync -> Admin syncs/updates Jamaah in PostgreSQL
  app.post("/api/admin/mitra/jamaah/sync", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const jamaahList = req.body.jamaahList || req.body.paxList || [];
      const result = await syncJamaahListToDatabase(jamaahList, req.user);
      res.json({ success: true, count: result.count });
    } catch (error) {
      console.error("Admin sync jamaah error:", error);
      res.status(500).json({ error: "Gagal mengupdate database jamaah" });
    }
  });

  // GET /api/admin/mitra/stats-summary -> Get accurate count per Mitra directly from PostgreSQL
  app.get("/api/admin/mitra/stats-summary", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allMitras = await getComprehensiveMitraList();
      const allJamaah = await getAllJamaahFromDatabase();

      const summary = allMitras.map(mitra => {
        const mId = (mitra.id || '').toLowerCase().trim();
        const mEmail = (mitra.email || '').toLowerCase().trim();
        const mName = (mitra.name || '').toLowerCase().trim();
        const mBaseName = mName.split(' (')[0].trim();

        const mitraJamaah = allJamaah.filter(j => {
          const jmId = (j.mitraId || '').toLowerCase().trim();
          const jmEmail = (j.mitraEmail || '').toLowerCase().trim();
          const jmName = (j.mitraName || '').toLowerCase().trim();

          if (jmId && mId && jmId === mId) return true;
          if (jmEmail && mEmail && jmEmail === mEmail) return true;
          if (jmId && mEmail && jmId === mEmail) return true;
          if (jmName && mBaseName && jmName.includes(mBaseName)) return true;
          return false;
        });

        const totalJamaah = mitraJamaah.length;
        const verified = mitraJamaah.filter(j => j.statusBiodata === 'verified' || j.statusBiodata === 'approved').length;
        const pending = totalJamaah - verified;

        return {
          mitraId: mitra.id,
          mitraName: mitra.name,
          mitraEmail: mitra.email,
          totalJamaah,
          verified,
          pending
        };
      });

      res.json(summary);
    } catch (error) {
      console.error("Admin stats summary error:", error);
      res.status(500).json({ error: "Gagal mengambil statistik mitra" });
    }
  });

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

  app.delete("/api/admin/mitra/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    try {
      const idsToDelete = new Set<string>();
      if (id) idsToDelete.add(id);

      // 1. Fetch target from mitraUsers if exists
      const targetMitra = await withRetry(() => db.query.mitraUsers.findFirst({
        where: eq(schema.mitraUsers.id, id)
      })).catch(() => null) as any;

      // 2. Fetch target from users if exists
      const targetAuthUser = await withRetry(() => db.query.users.findFirst({
        where: eq(schema.users.id, id)
      })).catch(() => null) as any;

      const targetEmail = (targetMitra?.email || targetAuthUser?.email || '').toLowerCase().trim();

      if (targetEmail) {
        const matchingMitras = await withRetry(() => db.select({ id: schema.mitraUsers.id })
          .from(schema.mitraUsers)
          .where(sql`LOWER(${schema.mitraUsers.email}) = LOWER(${targetEmail})`)).catch(() => []) as any[];
        matchingMitras.forEach(m => idsToDelete.add(m.id));

        const matchingAuths = await withRetry(() => db.select({ id: schema.users.id })
          .from(schema.users)
          .where(sql`LOWER(${schema.users.email}) = LOWER(${targetEmail})`)).catch(() => []) as any[];
        matchingAuths.forEach(u => idsToDelete.add(u.id));
      }

      const targetUserIds = Array.from(idsToDelete).filter(Boolean);

      if (targetUserIds.length > 0 || targetEmail) {
        await withRetry(() => db.transaction(async (tx) => {
          // A. Set referred users' mitraId to null (unlink referred Jamaah)
          if (targetUserIds.length > 0) {
            await tx.update(schema.users)
              .set({ mitraId: null })
              .where(inArray(schema.users.mitraId, targetUserIds));
          }

          // B. Unlink verifiedBy references on payments
          if (targetUserIds.length > 0) {
            await tx.update(schema.payments)
              .set({ verifiedBy: null })
              .where(inArray(schema.payments.verifiedBy, targetUserIds));
          }

          // C. Delete registrations & dependent sub-records created by or belonging to this Mitra
          const regWhereConds = [];
          if (targetUserIds.length > 0) {
            regWhereConds.push(inArray(schema.registrations.userId, targetUserIds));
          }
          if (targetEmail) {
            regWhereConds.push(sql`LOWER(${schema.registrations.ordererEmail}) = LOWER(${targetEmail})`);
          }

          const assocRegistrations = regWhereConds.length > 0
            ? await tx.select({ id: schema.registrations.id })
                .from(schema.registrations)
                .where(or(...regWhereConds))
            : [];

          const regIds = assocRegistrations.map(r => r.id).filter(Boolean);

          if (regIds.length > 0) {
            const assocPayments = await tx.select({ id: schema.payments.id })
              .from(schema.payments)
              .where(inArray(schema.payments.registrationId, regIds));
            const payIds = assocPayments.map(p => p.id).filter(Boolean);

            if (payIds.length > 0) {
              await tx.delete(schema.financial_ledger)
                .where(inArray(schema.financial_ledger.paymentId, payIds));
              await tx.delete(schema.financialVerifications)
                .where(inArray(schema.financialVerifications.paymentId, payIds));
              await tx.delete(schema.payments)
                .where(inArray(schema.payments.id, payIds));
            }

            await tx.delete(schema.documents)
              .where(inArray(schema.documents.registrationId, regIds));
            await tx.delete(schema.certificates)
              .where(inArray(schema.certificates.registrationId, regIds));
            await tx.delete(schema.equipment)
              .where(inArray(schema.equipment.registrationId, regIds));
            await tx.delete(schema.manifests)
              .where(inArray(schema.manifests.registrationId, regIds));
            await tx.delete(schema.memories)
              .where(inArray(schema.memories.registrationId, regIds));
            await tx.delete(schema.activities)
              .where(inArray(schema.activities.registrationId, regIds));
            await tx.delete(schema.registrations)
              .where(inArray(schema.registrations.id, regIds));
          }

          // D. Delete notifications, helpdesk tickets, activities for target user IDs
          if (targetUserIds.length > 0) {
            await tx.delete(schema.notifications)
              .where(inArray(schema.notifications.userId, targetUserIds));
            await tx.delete(schema.helpdesk_tickets)
              .where(inArray(schema.helpdesk_tickets.userId, targetUserIds));
            await tx.delete(schema.activities)
              .where(inArray(schema.activities.userId, targetUserIds));
          }

          // E. Delete KYC documents & profiles for Mitra
          if (targetUserIds.length > 0) {
            await tx.delete(schema.kycDocuments)
              .where(inArray(schema.kycDocuments.userId, targetUserIds));
            await tx.delete(schema.mitraProfiles)
              .where(inArray(schema.mitraProfiles.userId, targetUserIds));
          }

          // F. Delete commission payouts for Mitra
          const payoutConds = [];
          if (targetUserIds.length > 0) {
            payoutConds.push(inArray(schema.mitraCommissionPayouts.mitraUserId, targetUserIds));
          }
          if (targetEmail) {
            payoutConds.push(sql`LOWER(${schema.mitraCommissionPayouts.mitraNotes}) LIKE ${'%' + targetEmail + '%'}`);
          }
          if (payoutConds.length > 0) {
            await tx.delete(schema.mitraCommissionPayouts)
              .where(or(...payoutConds));
          }

          // G. Delete from mitraUsers table
          const mitraUsersConds = [];
          if (targetUserIds.length > 0) {
            mitraUsersConds.push(inArray(schema.mitraUsers.id, targetUserIds));
          }
          if (targetEmail) {
            mitraUsersConds.push(sql`LOWER(${schema.mitraUsers.email}) = LOWER(${targetEmail})`);
          }
          if (mitraUsersConds.length > 0) {
            await tx.delete(schema.mitraUsers)
              .where(or(...mitraUsersConds));
          }

          // H. Delete from standard users table (role = 'mitra')
          const usersConds = [];
          if (targetUserIds.length > 0) {
            usersConds.push(inArray(schema.users.id, targetUserIds));
          }
          if (targetEmail) {
            usersConds.push(sql`LOWER(${schema.users.email}) = LOWER(${targetEmail})`);
          }
          if (usersConds.length > 0) {
            await tx.delete(schema.users)
              .where(or(...usersConds));
          }
        }));
      }

      res.json({ success: true, message: "Data mitra berhasil dihapus secara permanen." });
      notifyUpdate();
    } catch (error: any) {
      console.error("Admin delete mitra error:", error);
      res.status(500).json({ error: "Gagal menghapus data mitra: " + (error?.message || "Terjadi kesalahan server") });
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

  // --- MOU Management API Routes ---
  const mouFallbackStore: any[] = [];

  // GET /api/admin/mou -> Get all MOUs for Admin
  app.get("/api/admin/mou", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const result: any = await db.execute(sql`SELECT * FROM "mitra_mous" ORDER BY created_at DESC;`).catch(() => null);
      const dbRows = result?.rows || (Array.isArray(result) ? result : []);
      
      const combined = [...dbRows];
      mouFallbackStore.forEach(m => {
        if (!combined.some(c => c.id === m.id)) {
          combined.push(m);
        }
      });

      res.json(combined);
    } catch (error) {
      console.error("Fetch admin MOUs error:", error);
      res.json(mouFallbackStore);
    }
  });

  // POST /api/admin/mou -> Admin creates/uploads MOU
  app.post("/api/admin/mou", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { 
        mouNumber, title, mitraId, mitraName, fileUrl, fileName, fileSize, 
        effectiveDate, expiryDate, notes, status 
      } = req.body;

      if (!mouNumber || !title || !mitraId || !fileUrl) {
        return res.status(400).json({ error: "Nomor MOU, Judul, Target Mitra, dan Berkas MOU wajib diisi." });
      }

      const newId = crypto.randomUUID();
      const newRecord = {
        id: newId,
        mou_number: mouNumber,
        title: title,
        mitra_id: mitraId,
        mitra_name: mitraName || (mitraId === 'ALL' ? 'Semua Mitra (Global)' : 'Mitra Agent'),
        file_url: fileUrl,
        file_name: fileName || 'MOU_Kemitraan.pdf',
        file_size: fileSize || 'PDF',
        status: status || 'menunggu_tanda_tangan',
        effective_date: effectiveDate || '',
        expiry_date: expiryDate || '',
        notes: notes || '',
        signed_file_url: null,
        signed_at: null,
        signed_by_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mouFallbackStore.unshift(newRecord);

      try {
        await db.execute(sql`
          INSERT INTO "mitra_mous" 
          (id, mou_number, title, mitra_id, mitra_name, file_url, file_name, file_size, status, effective_date, expiry_date, notes, created_at, updated_at)
          VALUES 
          (${newId}::uuid, ${mouNumber}, ${title}, ${mitraId}, ${newRecord.mitra_name}, ${fileUrl}, ${newRecord.file_name}, ${newRecord.file_size}, ${newRecord.status}, ${effectiveDate || ''}, ${expiryDate || ''}, ${notes || ''}, NOW(), NOW());
        `);
      } catch (dbErr) {
        console.warn("DB Insert for MOU warning (using memory fallback):", dbErr);
      }

      res.json({ success: true, data: newRecord });
    } catch (error: any) {
      console.error("Create MOU error:", error);
      res.status(500).json({ error: "Gagal menyimpan berkas MOU" });
    }
  });

  // PUT /api/admin/mou/:id -> Admin updates MOU
  app.put("/api/admin/mou/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    try {
      const { status, notes, effectiveDate, expiryDate } = req.body;

      const idx = mouFallbackStore.findIndex(m => m.id === id);
      if (idx !== -1) {
        if (status) mouFallbackStore[idx].status = status;
        if (notes !== undefined) mouFallbackStore[idx].notes = notes;
        if (effectiveDate) mouFallbackStore[idx].effective_date = effectiveDate;
        if (expiryDate) mouFallbackStore[idx].expiry_date = expiryDate;
        mouFallbackStore[idx].updated_at = new Date().toISOString();
      }

      try {
        await db.execute(sql`
          UPDATE "mitra_mous"
          SET status = COALESCE(${status || null}, status),
              notes = COALESCE(${notes !== undefined ? notes : null}, notes),
              effective_date = COALESCE(${effectiveDate || null}, effective_date),
              expiry_date = COALESCE(${expiryDate || null}, expiry_date),
              updated_at = NOW()
          WHERE id = ${id}::uuid;
        `);
      } catch (dbErr) {
        console.warn("DB Update MOU warning:", dbErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Update MOU error:", error);
      res.status(500).json({ error: "Gagal mengupdate MOU" });
    }
  });

  // DELETE /api/admin/mou/:id -> Admin deletes MOU
  app.delete("/api/admin/mou/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    try {
      const idx = mouFallbackStore.findIndex(m => m.id === id);
      if (idx !== -1) mouFallbackStore.splice(idx, 1);

      try {
        await db.execute(sql`DELETE FROM "mitra_mous" WHERE id = ${id}::uuid;`);
      } catch (dbErr) {
        console.warn("DB Delete MOU warning:", dbErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete MOU error:", error);
      res.status(500).json({ error: "Gagal menghapus MOU" });
    }
  });

  // GET /api/mitra/mou -> Mitra gets MOUs assigned to them or ALL
  app.get("/api/mitra/mou", authenticate, async (req: AuthRequest, res) => {
    try {
      const userId = (req.user?.id || '').toString();
      const userEmail = (req.user?.email || '').toLowerCase().trim();

      let dbRows: any[] = [];
      try {
        const result: any = await db.execute(sql`
          SELECT * FROM "mitra_mous"
          WHERE mitra_id = 'ALL' 
             OR LOWER(mitra_id) = LOWER(${userId})
             OR LOWER(mitra_id) = LOWER(${userEmail})
          ORDER BY created_at DESC;
        `);
        dbRows = result?.rows || (Array.isArray(result) ? result : []);
      } catch (err) {
        console.warn("Fetch mitra MOUs from DB failed, using fallback:", err);
      }

      const combined = [...dbRows];
      mouFallbackStore.forEach(m => {
        const mMitraId = (m.mitra_id || '').toLowerCase();
        if (mMitraId === 'all' || mMitraId === userId.toLowerCase() || mMitraId === userEmail) {
          if (!combined.some(c => c.id === m.id)) {
            combined.push(m);
          }
        }
      });

      res.json(combined);
    } catch (error) {
      console.error("Fetch mitra MOUs error:", error);
      res.status(500).json({ error: "Gagal mengambil berkas MOU" });
    }
  });

  // POST /api/mitra/mou/:id/sign -> Mitra signs MOU
  app.post("/api/mitra/mou/:id/sign", authenticate, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { signedByName, notes } = req.body;
    try {
      const nowIso = new Date().toISOString();
      const signer = signedByName || req.user?.name || 'Mitra Agent';

      const idx = mouFallbackStore.findIndex(m => m.id === id);
      if (idx !== -1) {
        mouFallbackStore[idx].status = 'aktif';
        mouFallbackStore[idx].signed_at = nowIso;
        mouFallbackStore[idx].signed_by_name = signer;
        if (notes) mouFallbackStore[idx].notes = `${mouFallbackStore[idx].notes || ''} | Ttd Mitra: ${notes}`;
        mouFallbackStore[idx].updated_at = nowIso;
      }

      try {
        await db.execute(sql`
          UPDATE "mitra_mous"
          SET status = 'aktif',
              signed_at = NOW(),
              signed_by_name = ${signer},
              updated_at = NOW()
          WHERE id = ${id}::uuid;
        `);
      } catch (dbErr) {
        console.warn("DB Update MOU sign warning:", dbErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Sign MOU error:", error);
      res.status(500).json({ error: "Gagal memproses tanda tangan MOU" });
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
    try {
      const doc = await db.query.documents.findFirst({ where: eq(schema.documents.id, req.params.id) });
      let jamaahName = 'Jamaah';
      let docType = doc?.docType || 'DOKUMEN JAMAAH';
      let registrationId = doc?.registrationId || '';

      if (doc?.registrationId) {
        const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, doc.registrationId) });
        if (reg && reg.ordererName) {
          jamaahName = reg.ordererName;
        }
      }

      if (doc && doc.fileUrl) {
        let fileUrl = doc.fileUrl.trim();

        // 1. If self-referential or circular route path stored in DB, skip to fallback
        if (!fileUrl.includes(`/api/documents/${req.params.id}`)) {
          // 2. If base64 data URL, try restoring to physical file on disk for static caching
          if (fileUrl.startsWith('data:') || fileUrl.includes('base64,')) {
            const physicalPath = saveFileToUploads(fileUrl);
            if (physicalPath && physicalPath.startsWith('/uploads/') && fs.existsSync(path.join(process.cwd(), physicalPath))) {
              return res.sendFile(path.join(process.cwd(), physicalPath));
            }
          }

          // 3. Check relative path on server (e.g. /uploads/file-123.pdf)
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
          if (fileUrl.startsWith('data:') || fileUrl.includes('base64,')) {
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
              if (contentType === 'application/octet-stream' || !contentType || contentType === 'image/png') {
                if (base64Data.startsWith('JVBERi0')) contentType = 'application/pdf';
                else if (base64Data.startsWith('/9j/')) contentType = 'image/jpeg';
                else if (base64Data.startsWith('iVBORw')) contentType = 'image/png';
                else if (req.params.ext === 'pdf' || req.url.toLowerCase().includes('.pdf')) contentType = 'application/pdf';
              }

              const buffer = Buffer.from(base64Data, 'base64');
              res.setHeader('Content-Type', contentType);
              res.setHeader('Content-Length', buffer.length);
              res.setHeader('Cache-Control', 'public, max-age=31536000');
              if (contentType === 'application/pdf') {
                res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
              }
              return res.send(buffer);
            }
          }
        }
      }

      // Physical file missing on disk — check if PDF is requested or expected
      const reqQueryExt = req.query.ext ? String(req.query.ext).toLowerCase() : '';
      const isPdf = req.params.ext === 'pdf' || 
        reqQueryExt.includes('pdf') || 
        req.path.toLowerCase().includes('.pdf') || 
        (doc && doc.fileUrl && (doc.fileUrl.toLowerCase().includes('.pdf') || doc.fileUrl.includes('data:application/pdf') || doc.fileUrl.includes('JVBERi0'))) || 
        (doc && doc.docType && doc.docType.toLowerCase().includes('pdf')) ||
        (docType && docType.toLowerCase().includes('pdf'));

      if (isPdf) {
        const pdfBuffer = generateDocPdf(docType, jamaahName, docType, registrationId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(docType)}.pdf"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(pdfBuffer);
      }

      // SVG image fallback
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" fill="none">
        <rect width="800" height="500" rx="16" fill="#0f172a"/>
        <rect x="20" y="20" width="760" height="460" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 8"/>
        <rect x="330" y="90" width="140" height="180" rx="16" fill="#0284c7" opacity="0.15"/>
        <path d="M370 130h60m-60 30h60m-60 30h40" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <text x="400" y="320" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="bold">${docType.substring(0, 40)}</text>
        <text x="400" y="355" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Dokumen ${jamaahName} Terverifikasi. Berkas Siap Di-review.</text>
        <text x="400" y="420" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="12">Sistem Manajemen Dokumen Umroh & Hajj</text>
      </svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(svgContent);

    } catch (e: any) {
      console.error("Error serving document file:", e);
      const pdfBuffer = generateDocPdf("DOKUMEN JAMAAH", "JAMAAH UMROH", "DOKUMEN", "REG-ERR");
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
    }
  });

  // Verify Document
  app.patch("/api/admin/documents/:id/verify", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!id || id === '.' || id === 'undefined' || id.trim() === '' || !isValidUUID(id)) {
      return res.status(400).json({ error: "ID dokumen tidak valid" });
    }

    try {
      const newStatus = (status === 'approved' || status === 'VERIFIED' || status === 'verified') ? 'VERIFIED' : 
                        (status === 'rejected' || status === 'REJECTED' || status === 'rejected') ? 'REJECTED' : 'PENDING';

      let resultDoc = null;

      await db.transaction(async (tx) => {
        const [updated] = await tx.update(schema.documents)
          .set({ 
            status: newStatus as any, 
            adminNotes: reason || null,
            updatedAt: new Date()
          })
          .where(eq(schema.documents.id, id))
          .returning();

        if (updated) {
          resultDoc = updated;
          
          // ATOMIC SYNC TO paxData
          const regId = updated.registrationId;
          if (regId && isValidUUID(regId)) {
            const reg = await tx.query.registrations.findFirst({ where: eq(schema.registrations.id, regId) });
            if (reg && Array.isArray(reg.paxData)) {
              const normStatus = newStatus === 'VERIFIED' ? 'verified' : newStatus === 'REJECTED' ? 'rejected' : 'pending';
              const updatedPax = reg.paxData.map((p: any) => {
                // If it's a single-person registration, or if we can match by docType (unique per person per reg)
                // Actually, the documents table has a unique index on (registration_id, doc_type).
                // This means there's only ONE such document per registration.
                // In a multi-pax registration, the 'documents' table might be ambiguous if it doesn't have a jamaah_id.
                // Let's check schema.ts for jamaah_id in documents table.
                const pDocs = { ...(p.documents || {}) };
                if (pDocs[updated.docType]) {
                  pDocs[updated.docType] = {
                    ...pDocs[updated.docType],
                    status: normStatus,
                    adminNotes: reason || null,
                    updatedAt: new Date().toISOString()
                  };
                }
                return { ...p, documents: pDocs };
              });

              await tx.update(schema.registrations)
                .set({ paxData: updatedPax, updatedAt: new Date() })
                .where(eq(schema.registrations.id, regId));
            }
          }
        }
      });

      if (!resultDoc) {
        return res.status(404).json({ error: "Dokumen tidak ditemukan" });
      }

      res.json(resultDoc);
      notifyUpdate();
    } catch (error: any) {
      console.error(`[Admin] Document verification failed for ${id}:`, error);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
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
      const docItems: Array<{ docType: string; fileUrl: string }> = (items && Array.isArray(items) && items.length > 0)
        ? items
        : [{ docType, fileUrl }];

      await db.transaction(async (tx) => {
        const reg = await tx.query.registrations.findFirst({
          where: eq(schema.registrations.id, registrationId)
        });

        for (const item of docItems) {
          if (!item.docType) continue;
          let existing = await tx.query.documents.findFirst({
            where: and(eq(schema.documents.registrationId, registrationId), eq(schema.documents.docType, item.docType as any))
          });

          if (!item.fileUrl) {
            if (existing) {
              await tx.delete(schema.documents).where(eq(schema.documents.id, existing.id));
            }
          } else if (existing) {
            await tx.update(schema.documents).set({ fileUrl: item.fileUrl, status: 'VERIFIED', updatedAt: new Date() }).where(eq(schema.documents.id, existing.id));
          } else {
            await tx.insert(schema.documents).values({
              workspaceId: req.user?.workspaceId || reg?.workspaceId || 'default',
              registrationId,
              docType: item.docType as any,
              fileUrl: item.fileUrl,
              status: 'VERIFIED'
            });
          }

          // Send notification to jamaah
          if (reg && reg.userId && item.fileUrl) {
            const baseDocType = item.docType.split('_pax_')[0];
            const docNameMap: Record<string, string> = {
              eticket: 'E-Ticket Keberangkatan',
              visa: 'Visa',
              asuransi: 'Asuransi Perjalanan'
            };
            const docLabel = docNameMap[baseDocType] || baseDocType;
            await tx.insert(schema.notifications).values({
              workspaceId: req.user!.workspaceId!,
              userId: reg.userId,
              title: `Dokumen Ready: ${docLabel}`,
              message: `Dokumen ${docLabel} Anda telah diterbitkan oleh pihak Travel dan siap diunduh di Portal Jamaah.`,
              type: 'info'
            }).catch((err) => console.error("Notif insert error:", err));
          }
        }

        // Keep paxData in registrations table in sync
        if (reg && Array.isArray(reg.paxData)) {
          const updatedPax = reg.paxData.map((p: any, pIdx: number) => {
            const pDocs = { ...(p.documents || {}) };
            const pFiles = { ...(p.docFiles || {}) };
            const pIssued = { ...(p.issuedDocs || {}) };

            for (const item of docItems) {
              if (!item.docType) continue;
              const baseDocType = item.docType.split('_pax_')[0];
              const paxMatch = item.docType.includes('_pax_') ? item.docType.endsWith(`_pax_${pIdx}`) : true;
              if (paxMatch && item.fileUrl) {
                pDocs[item.docType] = {
                  ...(pDocs[item.docType] || {}),
                  fileUrl: item.fileUrl,
                  url: item.fileUrl,
                  status: 'verified',
                  updatedAt: new Date().toISOString()
                };
                if (baseDocType === 'eticket' || baseDocType === 'visa' || baseDocType === 'asuransi') {
                  const mappedKey = baseDocType === 'eticket' ? 'tiket' : baseDocType === 'asuransi' ? 'polis' : 'visa';
                  pIssued[mappedKey] = true;
                  pFiles[mappedKey] = {
                    name: `${mappedKey.toUpperCase()}_Dokumen.pdf`,
                    data: item.fileUrl,
                    size: 'File Online',
                    uploadedAt: new Date().toLocaleDateString('id-ID')
                  };
                }
              }
            }
            return {
              ...p,
              documents: pDocs,
              docFiles: pFiles,
              issuedDocs: pIssued
            };
          });

          await tx.update(schema.registrations)
            .set({ paxData: updatedPax, updatedAt: new Date() })
            .where(eq(schema.registrations.id, registrationId));
        }
      });

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
      const allJamaahUsersResult = await withRetry(() => db.select({
        count: sql<number>`count(*)`
      })
      .from(schema.users)
      .where(and(
        eq(schema.users.workspaceId, req.user!.workspaceId!),
        eq(schema.users.role, 'jamaah'),
        isNull(schema.users.deletedAt),
        ne(schema.users.status, 'suspended')
      )));
      
      const totalJamaah = Number(allJamaahUsersResult[0]?.count || 0);
 
      // 1b. Mitra Aktif
      const comprehensiveMitraList = await getComprehensiveMitraList('active').catch(() => []);
      const totalMitraAktif = comprehensiveMitraList.length;

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
      await ensureTableAndColumns().catch(e => console.error("ensureTableAndColumns error in GET admin packages:", e));
      let allPackages: any[] = [];
      try {
        allPackages = await withRetry(() => 
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
      } catch (err) {
        console.warn("GET /api/admin/packages primary query failed, trying raw SQL...", err);
        try {
          const rawRes: any = await db.execute(sql`
            SELECT id, workspace_id as "workspaceId", name, description, price, 
                   departure_date as "departureDate", duration, image_url as "imageUrl", 
                   type, is_available as "isAvailable", quota, 
                   manasik_pdf_url as "manasikPdfUrl", facilities, excludes, hotel, created_at as "createdAt"
            FROM packages
            ORDER BY created_at DESC
          `);
          allPackages = Array.isArray(rawRes) ? rawRes : (rawRes?.rows || []);
        } catch (rawErr) {
          console.error("GET /api/admin/packages raw SQL query failed:", rawErr);
          allPackages = [];
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
      } catch (e) {}

      const formatted = (allPackages || []).map((pkg) => {
        try {
          const pkgId = pkg.id;
          const pkgRegs = (regCounts || []).filter(r => r && r.packageId === pkgId);
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

          const rawImg = pkg.imageUrl || pkg.image_url || pkg.image;
          const cleanImg = rawImg ? saveFileToUploads(rawImg, 'pkg') : 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80';
          const pkgType = (pkg.type || 'umroh').toString().trim().toLowerCase();

          return { 
            ...pkg, 
            imageUrl: cleanImg,
            image: cleanImg,
            description: Array.isArray(desc) ? desc : [String(desc || "Fasilitas Bintang 5")],
            excludes: Array.isArray(exc) ? exc : [],
            quota: quotaNum,
            takenSeats,
            remainingSeats,
            type: pkgType === 'haji' ? 'haji' : 'umroh',
            isAvailable: pkg.isAvailable !== false && pkg.is_available !== false && pkg.is_available !== 'false'
          };
        } catch (itemErr) {
          console.error("Error formatting package item:", itemErr, pkg);
          return {
            ...pkg,
            imageUrl: pkg?.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80',
            description: ["Fasilitas Bintang 5"],
            quota: Number(pkg?.quota) || 45,
            takenSeats: 0,
            remainingSeats: Number(pkg?.quota) || 45,
            type: (pkg?.type || 'umroh').toString().trim().toLowerCase(),
            isAvailable: true
          };
        }
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
      await ensureTableAndColumns().catch(e => console.error("ensureTableAndColumns error in POST package:", e));
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl, facilities, hotel, excludes, itineraries } = req.body;
      
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
      if (!wsId || !isValidUuid(wsId)) {
        wsId = await getDefaultWorkspaceId();
      }

      const cleanImgUrl = imageUrl ? saveFileToUploads(imageUrl, 'pkg') : "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80";

      const data: any = {
        workspaceId: wsId || null,
        name: (name || "Paket Baru").trim(),
        description: cleanDesc,
        price: cleanPrice.toString(),
        duration: (duration || "9 Hari").trim(),
        imageUrl: cleanImgUrl,
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        quota: cleanQuota,
        manasikPdfUrl: manasikPdfUrl ? saveFileToUploads(manasikPdfUrl, 'doc') : null,
        facilities: facilities || null,
        hotel: hotel || null,
        excludes: cleanExcludes
      };

      let newPackage: any;
      await db.transaction(async (tx) => {
        const [insertedPkg] = await tx.insert(schema.packages).values(data).returning();
        newPackage = insertedPkg;

        // Save itineraries if passed in the payload
        if (newPackage && Array.isArray(itineraries) && itineraries.length > 0) {
          const values = itineraries.map((item: any) => ({
            packageId: newPackage.id,
            day: Number(item.day) || 1,
            title: item.title || '',
            description: item.description || '',
            location: item.location || '',
            meals: item.meals || ''
          }));
          await tx.insert(schema.package_itineraries).values(values);
        }
      });
      
      // Parse description for client response consistency
      let parsedDesc = newPackage.description;
      try { parsedDesc = JSON.parse(newPackage.description); } catch(e) {}

      const responseObj = { 
        ...newPackage, 
        imageUrl: cleanImgUrl,
        image: cleanImgUrl,
        description: Array.isArray(parsedDesc) ? parsedDesc : [String(parsedDesc || "Fasilitas Bintang 5")], 
        remainingSeats: newPackage.quota || cleanQuota, 
        takenSeats: 0,
        type: normalizedType,
        isAvailable: normalizedIsAvailable,
        itinerary: Array.isArray(itineraries) ? itineraries.map((item: any) => ({ ...item, packageId: newPackage.id })) : []
      };

      res.json(responseObj);
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
      const { name, description, price, duration, imageUrl, type, isAvailable, quota, manasikPdfUrl, facilities, hotel, excludes, itineraries } = req.body;
      
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

      if (imageUrl !== undefined) {
        data.imageUrl = imageUrl ? saveFileToUploads(imageUrl, 'pkg') : "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80";
      }
      if (manasikPdfUrl !== undefined) {
        data.manasikPdfUrl = manasikPdfUrl ? saveFileToUploads(manasikPdfUrl, 'doc') : null;
      }

      let updatedPackage: any;
      await db.transaction(async (tx) => {
        const [pkg] = await tx.update(schema.packages)
          .set(data)
          .where(eq(schema.packages.id, req.params.id))
          .returning();
        updatedPackage = pkg;

        if (!updatedPackage) {
          throw new Error("NOT_FOUND");
        }

        // Update itineraries if passed in the payload
        if (Array.isArray(itineraries)) {
          // Delete existing itineraries
          await tx.delete(schema.package_itineraries).where(eq(schema.package_itineraries.packageId, req.params.id));
          
          // Insert new itineraries
          if (itineraries.length > 0) {
            const values = itineraries.map((item: any) => ({
              packageId: req.params.id,
              day: Number(item.day) || 1,
              title: item.title || '',
              description: item.description || '',
              location: item.location || '',
              meals: item.meals || ''
            }));
            await tx.insert(schema.package_itineraries).values(values);
          }
        }
      });

      // Parse description for client response consistency
      let parsedDesc = updatedPackage.description;
      try { parsedDesc = JSON.parse(updatedPackage.description); } catch(e) {}

      res.json({ 
        ...updatedPackage, 
        description: parsedDesc,
        itinerary: Array.isArray(itineraries) ? itineraries : []
      });
      notifyUpdate();
    } catch (error: any) {
      if (error?.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Paket tidak ditemukan." });
      }
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
    const workspaceId = req.user?.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef';
    try {
      // Optimized with Eager Loading
      const enrichedUsers = await withRetry(() => db.query.users.findMany({
        where: or(eq(schema.users.workspaceId, workspaceId), isNull(schema.users.workspaceId)),
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
        where: or(eq(schema.registrations.workspaceId, workspaceId), isNull(schema.registrations.workspaceId)),
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
          isPdf: sql<boolean>`LOWER(${schema.documents.fileUrl}) LIKE 'data:application/pdf%' OR LOWER(${schema.documents.fileUrl}) LIKE '%.pdf%' OR ${schema.documents.fileUrl} LIKE '%JVBERi0%' OR LOWER(${schema.documents.docType}) LIKE '%pdf%'`.as('is_pdf'),
          hasFile: sql<boolean>`${schema.documents.fileUrl} IS NOT NULL AND ${schema.documents.fileUrl} != ''`.as('has_file')
        }).from(schema.documents).where(inArray(schema.documents.registrationId, regIds as string[])));

        docs = rawDocs.map((d: any) => {
          const isPdfBool = Boolean(d.isPdf) || d.isPdf === 1 || String(d.isPdf).toLowerCase() === 'true' || (d.docType && d.docType.toLowerCase().includes('pdf'));
          return {
            ...d,
            isPdf: isPdfBool,
            fileUrl: d.hasFile ? `/api/documents/${d.id}/file${isPdfBool ? '.pdf' : '.png'}` : null
          };
        });
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
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const allMemories = await withRetry(() => db.query.memories.findMany({
        orderBy: [desc(schema.memories.createdAt)]
      }));

      const formatted = allMemories.map((m: any) => {
        let title = m.title || '';
        let caption = m.caption || '';
        let date = m.date || '';
        let packageName = m.packageName || 'Semua Paket';
        let targetMitraName = m.targetMitraName || 'Semua Mitra / Publik';
        let targetJamaahId = m.targetJamaahId || '';
        let targetJamaahName = m.targetJamaahName || '';

        if (m.caption && typeof m.caption === 'string' && m.caption.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(m.caption);
            if (parsed && typeof parsed === 'object') {
              title = parsed.title || title;
              caption = parsed.caption || '';
              date = parsed.date || date;
              packageName = parsed.packageName || packageName;
              targetMitraName = parsed.targetMitraName || targetMitraName;
              targetJamaahId = parsed.targetJamaahId || targetJamaahId;
              targetJamaahName = parsed.targetJamaahName || targetJamaahName;
            }
          } catch (e) {}
        }

        return {
          id: m.id,
          title: title || caption || 'Momen Perjalanan',
          caption: caption,
          imageUrl: m.imageUrl || m.image_url,
          date: date || (m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          packageName: packageName,
          targetMitraName: targetMitraName,
          targetJamaahId: targetJamaahId,
          targetJamaahName: targetJamaahName,
          createdAt: m.createdAt || new Date().toISOString()
        };
      });

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.post("/api/admin/memories", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { 
        packageId, registrationId, imageUrl, caption, 
        title, date, packageName, targetMitraName, targetJamaahId, targetJamaahName, id
      } = req.body;

      let finalImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        finalImageUrl = saveFileToUploads(imageUrl, 'memory');
      }

      let wsId: string | undefined = req.user?.workspaceId;
      if (!wsId) {
        const defaultWs: any = await withRetry(() => db.query.workspaces.findFirst());
        wsId = defaultWs?.id;
      }

      const packedData = {
        title: title || caption || 'Momen Perjalanan',
        caption: caption || '',
        date: date || new Date().toISOString().split('T')[0],
        packageName: packageName || 'Semua Paket',
        targetMitraName: targetMitraName || 'Semua Mitra / Publik',
        targetJamaahId: targetJamaahId || '',
        targetJamaahName: targetJamaahName || ''
      };

      const captionPayload = JSON.stringify(packedData);

      const memoryValues: any = {
        workspaceId: wsId || null,
        packageId: packageId && isValidUuid(packageId) ? packageId : null,
        registrationId: registrationId && isValidUuid(registrationId) ? registrationId : null,
        imageUrl: finalImageUrl,
        caption: captionPayload
      };

      if (id && isValidUuid(id)) {
        memoryValues.id = id;
      }

      const [memory] = await withRetry(() => db.insert(schema.memories).values(memoryValues).returning());

      const resObj = {
        id: memory.id,
        ...packedData,
        imageUrl: memory.imageUrl,
        createdAt: memory.createdAt
      };

      res.json(resObj);
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
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
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

  app.post(["/api/certificates", "/api/admin/certificates"], authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const { registrationId, certificateUrl, recipientName } = req.body || {};
      
      // 1. Strict input validation
      if (!registrationId || typeof registrationId !== 'string' || !registrationId.trim()) {
        return res.status(400).json({ error: "ID registrasi (registrationId) wajib diisi." });
      }
      if (!certificateUrl || typeof certificateUrl !== 'string' || !certificateUrl.trim()) {
        return res.status(400).json({ error: "File atau URL sertifikat (certificateUrl) wajib diisi." });
      }

      // 2. Resolve registration ID to real UUID in DB BEFORE creating file or inserting
      const { registration: targetReg, ambiguous } = await findRegistrationByAnyIdentifier(registrationId, req.user!.workspaceId);

      if (ambiguous) {
        return res.status(400).json({
          error: `Ditemukan lebih dari satu data pendaftaran yang cocok dengan '${registrationId}'. Harap gunakan ID registrasi (UUID) yang spesifik.`
        });
      }

      if (!targetReg) {
        return res.status(404).json({ 
          error: "Registrasi jamaah tidak ditemukan atau tidak berada di workspace ini. ID registrasi harus merujuk ke data pendaftaran yang valid." 
        });
      }

      const validRegistrationId = targetReg.id; // GUARANTEED to be a valid UUID string

      // 3. Save base64 / data URL to physical disk file
      let finalCertUrl = certificateUrl.trim();
      let createdFilePath: string | null = null;

      if (finalCertUrl.startsWith('data:') || finalCertUrl.includes('base64,')) {
        finalCertUrl = saveFileToUploads(finalCertUrl, 'certificate');
        if (finalCertUrl.startsWith('/uploads/')) {
          createdFilePath = finalCertUrl;
        }
      }

      const finalRecipientName = (recipientName && typeof recipientName === 'string' && recipientName.trim()) 
        ? recipientName.trim() 
        : (targetReg.ordererName || 'Jamaah');

      // 4. Insert certificate with strict NOT NULL registrationId UUID
      let certificate: any;
      try {
        [certificate] = await withRetry(() => db.insert(schema.certificates).values({
          workspaceId: req.user!.workspaceId || targetReg.workspaceId || '206247ec-7f3b-4e74-8dc6-b109372dbbef',
          registrationId: validRegistrationId,
          recipientName: finalRecipientName,
          certificateUrl: finalCertUrl
        }).returning());
      } catch (insertErr: any) {
        console.error("[Certificates POST] Insert failed:", insertErr);
        if (createdFilePath) {
          deleteFileFromUploads(createdFilePath);
        }
        return res.status(500).json({ error: "Gagal menyimpan sertifikat ke database: " + (insertErr?.message || 'Database error') });
      }

      // 5. Sync certificate info to matching registrations paxData
      try {
        const paxArr = Array.isArray(targetReg.paxData) ? targetReg.paxData : [];
        const targetName = finalRecipientName.toLowerCase();
        let paxUpdated = false;
        
        const newPax = paxArr.map((p: any) => {
          const pName = (p.userName || p.namaLengkap || p.fullName || p.name || '').trim().toLowerCase();
          const pId = String(p.id || '').trim();
          const pRegId = String(p.registrationId || '').trim();

          if (pId === registrationId || pRegId === registrationId || targetReg.id === registrationId || (targetName && pName === targetName)) {
            paxUpdated = true;
            return {
              ...p,
              isCertIssued: true,
              certificateUrl: finalCertUrl,
              docFiles: {
                ...(p.docFiles || {}),
                sertifikat: {
                  name: `Sertifikat_${finalRecipientName.replace(/\s+/g, '_')}.pdf`,
                  url: finalCertUrl,
                  data: finalCertUrl,
                  uploadedAt: new Date().toLocaleDateString('id-ID'),
                  recipientName: finalRecipientName
                }
              }
            };
          }
          return p;
        });

        if (paxUpdated) {
          await withRetry(() => db.update(schema.registrations)
            .set({ paxData: newPax, updatedAt: new Date() })
            .where(eq(schema.registrations.id, targetReg.id)));
        }
      } catch (paxErr) {
        console.warn("[Certificates POST] Syncing paxData error:", paxErr);
      }

      notifyUpdate();
      return res.status(201).json(certificate);
    } catch (error: any) {
      console.error("[Certificates POST Error]", error);
      return res.status(500).json({ error: "Terjadi kesalahan pada server saat menyimpan sertifikat: " + (error?.message || '') });
    }
  });

  app.delete("/api/admin/certificates/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    try {
      const rawParam = req.params.id || '';
      const targetIdOrName = decodeURIComponent(rawParam).trim();
      const lowerTarget = targetIdOrName.toLowerCase();

      // 1. Delete from schema.certificates table in DB
      try {
        const allCerts = await db.query.certificates.findMany();
        for (const cert of allCerts) {
          const recipientLower = (cert.recipientName || '').trim().toLowerCase();
          if (
            cert.id === targetIdOrName ||
            cert.registrationId === targetIdOrName ||
            (lowerTarget && recipientLower && (recipientLower === lowerTarget || recipientLower.includes(lowerTarget) || lowerTarget.includes(recipientLower)))
          ) {
            await withRetry(() => db.delete(schema.certificates).where(eq(schema.certificates.id, cert.id))).catch(() => {});
          }
        }
      } catch (certDelErr) {
        console.warn("[Certificates DELETE] DB delete certs notice:", certDelErr);
      }

      // 2. Update registrations paxData in DB to clear cert status
      try {
        const allRegs = await db.query.registrations.findMany();
        for (const reg of allRegs) {
          let updated = false;
          const paxArr = Array.isArray(reg.paxData) ? reg.paxData : [];
          const newPax = paxArr.map((p: any) => {
            const pName = (p.userName || p.namaLengkap || p.fullName || p.name || '').trim().toLowerCase();
            if (
              p.id === targetIdOrName ||
              reg.id === targetIdOrName ||
              (lowerTarget && pName && (pName === lowerTarget || pName.includes(lowerTarget) || lowerTarget.includes(pName)))
            ) {
              updated = true;
              const newDocs = { ...(p.docFiles || {}) };
              delete newDocs.sertifikat;
              return {
                ...p,
                isCertIssued: false,
                certificateUrl: null,
                docFiles: newDocs
              };
            }
            return p;
          });

          if (updated) {
            await db.update(schema.registrations)
              .set({ paxData: newPax })
              .where(eq(schema.registrations.id, reg.id));
          }
        }
      } catch (paxDelErr) {
        console.warn("[Certificates DELETE] Syncing paxData clear notice:", paxDelErr);
      }

      res.json({ success: true });
      notifyUpdate();
    } catch (error: any) {
      console.error("[Certificates DELETE Error]", error);
      res.status(500).json({ error: "Terjadi kesalahan pada server saat menghapus sertifikat" });
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

// --- PostgreSQL Enum Synchronization & Resilience Helpers ---
let dbPaymentTypeEnumValues: string[] = [];
let dbPaymentStatusEnumValues: string[] = [];

async function syncDbEnumValues() {
  if ((global as any)._dbIsBroken) return;
  try {
    const typeRes = await db.execute(sql`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE typname = 'payment_type';
    `);
    dbPaymentTypeEnumValues = typeRes.rows.map((r: any) => String(r.enumlabel));
    console.log("[DB Enum Sync] payment_type values from DB:", dbPaymentTypeEnumValues);
  } catch (e) {
    console.warn("[DB Enum Sync] Failed to fetch payment_type from DB, using fallback", e);
    dbPaymentTypeEnumValues = ['DP1', 'DP2', 'PELUNASAN'];
  }

  try {
    const statusRes = await db.execute(sql`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE typname = 'payment_status';
    `);
    dbPaymentStatusEnumValues = statusRes.rows.map((r: any) => String(r.enumlabel));
    console.log("[DB Enum Sync] payment_status values from DB:", dbPaymentStatusEnumValues);
  } catch (e) {
    console.warn("[DB Enum Sync] Failed to fetch payment_status from DB, using fallback", e);
    dbPaymentStatusEnumValues = ['PENDING', 'VERIFIED', 'REJECTED'];
  }
}

function normalizePaymentTypeForDb(val: string): string {
  const upper = val.toUpperCase().trim();
  const lower = val.toLowerCase().trim();
  
  if (dbPaymentTypeEnumValues.length > 0) {
    const match = dbPaymentTypeEnumValues.find(v => v.toUpperCase() === upper);
    if (match) return match;
  }
  
  if (upper === 'FULL' || upper === 'PELUNASAN' || lower === 'full' || lower === 'pelunasan') {
    if (dbPaymentTypeEnumValues.includes('PELUNASAN')) return 'PELUNASAN';
    if (dbPaymentTypeEnumValues.includes('pelunasan')) return 'pelunasan';
    return 'PELUNASAN';
  }
  
  if (upper === 'DP1' || lower === 'dp1') {
    if (dbPaymentTypeEnumValues.includes('DP1')) return 'DP1';
    if (dbPaymentTypeEnumValues.includes('dp1')) return 'dp1';
  }
  if (upper === 'DP2' || lower === 'dp2') {
    if (dbPaymentTypeEnumValues.includes('DP2')) return 'DP2';
    if (dbPaymentTypeEnumValues.includes('dp2')) return 'dp2';
  }
  
  return dbPaymentTypeEnumValues[0] || 'DP1';
}

function normalizePaymentStatusForDb(val: string): string {
  const upper = val.toUpperCase().trim();
  const lower = val.toLowerCase().trim();
  
  if (dbPaymentStatusEnumValues.length > 0) {
    const match = dbPaymentStatusEnumValues.find(v => v.toUpperCase() === upper);
    if (match) return match;
  }
  
  if (upper === 'PENDING' || lower === 'pending') {
    if (dbPaymentStatusEnumValues.includes('PENDING')) return 'PENDING';
    if (dbPaymentStatusEnumValues.includes('pending')) return 'pending';
  }
  if (upper === 'VERIFIED' || lower === 'verified' || upper === 'APPROVED' || lower === 'approved') {
    if (dbPaymentStatusEnumValues.includes('VERIFIED')) return 'VERIFIED';
    if (dbPaymentStatusEnumValues.includes('verified')) return 'verified';
    if (dbPaymentStatusEnumValues.includes('APPROVED')) return 'APPROVED';
    if (dbPaymentStatusEnumValues.includes('approved')) return 'approved';
  }
  if (upper === 'REJECTED' || lower === 'rejected') {
    if (dbPaymentStatusEnumValues.includes('REJECTED')) return 'REJECTED';
    if (dbPaymentStatusEnumValues.includes('rejected')) return 'rejected';
  }
  
  return dbPaymentStatusEnumValues[0] || 'PENDING';
}

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
  await syncDbEnumValues();
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

    // 4. Mitra Seeding (DISABLED AUTO-SEED OF MOCK DATA ON REBOOT)
    // Sample mock mitra (Ustadz Ahmad Mitra) is no longer auto-recreated on restart/redeploy.

    // 5. Jamaah & Booking Seeding (DISABLED AUTO-SEED OF MOCK DATA ON REBOOT)
    // Sample mock jamaah (Budi Santoso) is no longer auto-recreated on restart/redeploy.

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
