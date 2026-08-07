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
    const id = localStorage.getItem('current_mitra_id') || '';
    const email = localStorage.getItem('current_mitra_email') || '';
    const name = localStorage.getItem('current_mitra_name') || '';

    if (id || email) {
      return { id: id || email, email, name };
    }

    const profStr = localStorage.getItem('mitra_profile');
    if (profStr) {
      const p = JSON.parse(profStr);
      if (p.userId || p.id || p.email) {
        return {
          id: p.userId || p.id || p.email || '',
          email: p.email || '',
          name: p.fullName || p.namaLengkap || p.name || ''
        };
      }
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
    const jMitraName = (item.mitraName || item.ordererName || '').toLowerCase().trim();

    // Direct ID match
    if (searchId && jMitraId && jMitraId === searchId) return true;
    // Direct Email match
    if (searchEmail && jMitraEmail && jMitraEmail === searchEmail) return true;
    // Direct Name match
    if (searchName && jMitraName && searchName.length > 2 && jMitraName === searchName) return true;

    return false;
  });
}
