/**
 * Utility for isolated storage and data filtering per Mitra.
 * Ensures each Mitra only sees their own candidate jamaah and saved session data.
 */

export interface MitraInfo {
  id: string;
  email: string;
  name: string;
}

export function getActiveMitraInfo(): MitraInfo {
  try {
    let id = localStorage.getItem('current_mitra_id') || '';
    let email = localStorage.getItem('current_mitra_email') || '';
    let name = localStorage.getItem('current_mitra_name') || '';

    const profStr = localStorage.getItem('mitra_profile');
    if (profStr) {
      try {
        const p = JSON.parse(profStr);
        if (p) {
          id = id || p.userId || p.id || p.email || '';
          email = email || p.email || '';
          name = name || p.fullName || p.namaLengkap || p.name || '';
        }
      } catch (e) {}
    }

    const userStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u) {
          id = id || u.id || u.email || '';
          email = email || u.email || '';
          name = name || u.fullName || u.namaLengkap || u.name || u.email || '';
        }
      } catch (e) {}
    }

    if (id || email || name) {
      return { id: id || email, email, name };
    }
  } catch (e) {}

  return { id: '', email: '', name: '' };
}

export function setActiveMitraInfo(info: { id?: string; email?: string; name?: string }) {
  if (info.id) localStorage.setItem('current_mitra_id', info.id);
  if (info.email) localStorage.setItem('current_mitra_email', info.email);
  if (info.name) localStorage.setItem('current_mitra_name', info.name);
}

export function clearActiveMitraSession() {
  localStorage.removeItem('current_mitra_id');
  localStorage.removeItem('current_mitra_email');
  localStorage.removeItem('current_mitra_name');
}

/**
 * Safely set localStorage items without crashing on QuotaExceededError.
 * Automatically cleans large base64 data strings if quota limit is reached.
 */
export function safeSetLocalStorage(key: string, value: any): void {
  try {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringified);
  } catch (err: any) {
    console.warn(`[safeSetLocalStorage] Storage quota exceeded for key "${key}". Cleaning large data URLs...`, err);
    try {
      if (typeof value === 'object' && value !== null) {
        const cleaned = JSON.parse(JSON.stringify(value, (k, v) => {
          if (typeof v === 'string' && v.startsWith('data:') && v.length > 500) {
            return ''; // Strip heavy base64 to preserve core data structure
          }
          return v;
        }));
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
    } catch (cleanErr) {
      console.error(`[safeSetLocalStorage] Failed to save cleaned data for "${key}":`, cleanErr);
    }
  }
}

/**
 * Get a storage key scoped to the active logged-in Mitra
 */
export function getScopedKey(baseKey: string, customId?: string): string {
  const info = getActiveMitraInfo();
  const mId = customId || info.id || info.email;
  if (!mId) return baseKey;
  const safeId = mId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_${safeId}`;
}

/**
 * Filter an array of candidate jamaah (e.g. from central database)
 * to only include items belonging to the active logged-in Mitra.
 */
export function filterJamaahForCurrentMitra(jamaahArray: any[], customMitraInfo?: Partial<MitraInfo>): any[] {
  if (!Array.isArray(jamaahArray)) return [];
  
  const active = getActiveMitraInfo();
  const searchId = (customMitraInfo?.id || active.id || '').toLowerCase().trim();
  const searchEmail = (customMitraInfo?.email || active.email || '').toLowerCase().trim();
  const searchName = (customMitraInfo?.name || active.name || '').toLowerCase().trim();

  // If no logged in mitra identity exists at all, return empty array for safety
  if (!searchId && !searchEmail && !searchName) {
    return [];
  }

  return jamaahArray.filter((item: any) => {
    if (!item) return false;
    const jMitraId = (item.mitraId || '').toLowerCase().trim();
    const jMitraEmail = (item.mitraEmail || '').toLowerCase().trim();
    const jMitraName = (item.mitraName || item.ordererName || item.createdByName || '').toLowerCase().trim();

    // Direct ID match
    if (searchId && jMitraId && jMitraId === searchId) return true;
    // Direct Email match
    if (searchEmail && jMitraEmail && jMitraEmail === searchEmail) return true;
    // Direct Name match
    if (searchName && jMitraName) {
      if (searchName === jMitraName) return true;
      if (searchName.length >= 3 && (searchName.includes(jMitraName) || jMitraName.includes(searchName))) return true;
    }

    return false;
  });
}

/**
 * Merge two jamaah object versions, preserving certificate status and URLs
 */
export function mergeJamaahObjects(target: any, source: any): any {
  if (!target) return source;
  if (!source) return target;

  // Let DB (target) take precedence over local storage (source) for root attributes
  const merged = { ...source, ...target };

  // Explicitly merge the documents sub-object and respect verification/terminal statuses
  const targetDocs = target.documents || {};
  const sourceDocs = source.documents || {};
  const mergedDocs = { ...sourceDocs, ...targetDocs };

  Object.keys(mergedDocs).forEach(dk => {
    const tDoc = targetDocs[dk];
    const sDoc = sourceDocs[dk];
    if (tDoc && sDoc) {
      const tStatus = (tDoc.status || '').toLowerCase();
      const sStatus = (sDoc.status || '').toLowerCase();
      const isTerminal = (st: string) => ['verified', 'approved', 'rejected'].includes(st);
      
      if (isTerminal(tStatus) && !isTerminal(sStatus)) {
        mergedDocs[dk] = {
          ...sDoc,
          ...tDoc,
          status: tDoc.status
        };
      }
    }
  });
  merged.documents = mergedDocs;

  const mergedDocFiles = {
    ...(source.docFiles || {}),
    ...(target.docFiles || {})
  };

  // Merge certificate status cleanly
  // A certificate is issued if either target (DB) or source (local) has isCertIssued === true OR has a valid certificate URL
  const certData = target.docFiles?.sertifikat || source.docFiles?.sertifikat;
  const certUrl = target.certificateUrl || source.certificateUrl || certData?.url || certData?.data || '';
  
  const isIssued = !!(
    target.isCertIssued === true || 
    source.isCertIssued === true || 
    (certUrl && certUrl !== '')
  );

  if (isIssued && certUrl) {
    merged.isCertIssued = true;
    merged.certificateUrl = certUrl;
    const recipientName = certData?.recipientName || target.fullName || target.userName || source.fullName || source.userName || 'Jemaah';
    mergedDocFiles.sertifikat = certData || {
      name: `Sertifikat_${recipientName.replace(/\s+/g, '_')}.pdf`,
      url: certUrl,
      data: certUrl,
      uploadedAt: certData?.uploadedAt || new Date().toLocaleDateString('id-ID'),
      recipientName: recipientName
    };
  } else {
    merged.isCertIssued = false;
    delete merged.certificateUrl;
    delete mergedDocFiles.sertifikat;
  }

  merged.docFiles = mergedDocFiles;
  return merged;
}

