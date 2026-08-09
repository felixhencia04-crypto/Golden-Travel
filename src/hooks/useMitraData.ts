import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { mitraRealtimeService } from '../services/mitraRealtimeService';
import { setActiveMitraInfo, getScopedKey, filterJamaahForCurrentMitra, mergeJamaahObjects } from '../utils/mitraStorage';

export function useMitraData() {
  const [jamaahList, setJamaahList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mitraStatus, setMitraStatus] = useState<string | null>(null);

  const lastRefreshRef = useRef<number>(0);

  const refreshData = useCallback(async (silent = false, force = false) => {
    const now = Date.now();
    if (!force && silent && now - lastRefreshRef.current < 5000) {
      console.log("[Mitra] Skipping silent refresh - throttled");
      return;
    }
    lastRefreshRef.current = now;

    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('mitra_token') || localStorage.getItem('jamaah_token') || localStorage.getItem('admin_token');
      if (!token && !auth.currentUser) {
        setLoading(false);
        return null;
      }

      const [statusRes, jamaah, s, p, me] = await Promise.all([
        mitraRealtimeService.fetchMitraStatus().catch(() => null),
        api.get('/mitra/jamaah/list').catch(() => api.get('/mitra/jamaah').catch(() => [])),
        api.get('/mitra/stats').catch(() => null),
        api.get('/mitra/profile').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);

      const combinedMap = new Map<string, any>();

      const addOrMergeJamaah = (item: any) => {
        if (!item) return;
        const name = (item.userName || item.namaLengkap || item.fullName || item.name || '').trim();
        if (!name || name.startsWith('Jamaah #')) return;

        let existingKey: string | null = null;
        for (const [k, v] of combinedMap.entries()) {
          const vName = (v.userName || v.namaLengkap || v.fullName || v.name || '').trim();
          if ((item.id && v.id === item.id) || (vName && name && vName.toLowerCase() === name.toLowerCase())) {
            existingKey = k;
            break;
          }
        }

        if (existingKey) {
          const existing = combinedMap.get(existingKey);
          combinedMap.set(existingKey, mergeJamaahObjects(existing, item));
        } else {
          const newKey = item.id || name.toLowerCase();
          combinedMap.set(newKey, item);
        }
      };

      if (Array.isArray(jamaah)) {
        jamaah.forEach(addOrMergeJamaah);
      }

      // Merge with scoped local storage items if any exist
      try {
        const scopedKey = getScopedKey('mitra_saved_pax_list');
        const savedPaxStr = localStorage.getItem(scopedKey);
        if (savedPaxStr) {
          const savedPax = JSON.parse(savedPaxStr);
          if (Array.isArray(savedPax)) {
            savedPax.forEach(addOrMergeJamaah);
          }
        }

        const centralDbStr = localStorage.getItem('mitra_jamaah_database');
        if (centralDbStr) {
          const filteredCentral = filterJamaahForCurrentMitra(JSON.parse(centralDbStr));
          filteredCentral.forEach(addOrMergeJamaah);
        }
      } catch (e) {}

      const combinedJamaah = Array.from(combinedMap.values());

      setJamaahList(combinedJamaah);
      setStats(s);
      
      const hasActualKycData = !!(p && (p.nik || p.alamatLengkap || p.noRekening || p.npwp));
      setProfile(p || null);
      if (me?.user) {
        setDbUser(me.user);
        setActiveMitraInfo({
          id: me.user.id,
          email: me.user.email,
          name: me.user.name || p?.namaLengkap || p?.fullName
        });
      } else if (p) {
        setActiveMitraInfo({
          id: p.userId || p.id,
          email: p.email,
          name: p.namaLengkap || p.fullName
        });
      } else if (auth.currentUser) {
        setActiveMitraInfo({
          id: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          name: auth.currentUser.displayName || ''
        });
      }
      
      let effectiveStatus = statusRes?.status || statusRes?.statusAkun || me?.mitraStatus;
      
      // Determine strict hierarchy based on mitra verification status
      if (effectiveStatus === 'active') {
        effectiveStatus = 'active';
      } else if (effectiveStatus === 'rejected') {
        effectiveStatus = 'rejected';
      } else if (effectiveStatus === 'pending_verification' || hasActualKycData) {
        effectiveStatus = 'pending_verification';
      } else {
        effectiveStatus = 'incomplete_profile';
      }

      setMitraStatus(effectiveStatus);
      return effectiveStatus;
    } catch (error: any) {
      console.error("Failed to fetch mitra data", error);
      if (error.message?.includes('Sesi') || error.message?.includes('login')) {
        auth.signOut();
        localStorage.removeItem('mitra_token');
        window.location.href = '/mitra/login';
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeRealtime: (() => void) | null = null;
    let interval: any;

    const token = localStorage.getItem('mitra_token') || localStorage.getItem('jamaah_token') || localStorage.getItem('admin_token');

    // Initial load for direct JWT token users
    if (token) {
      refreshData();
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      const currentToken = localStorage.getItem('mitra_token') || localStorage.getItem('jamaah_token') || localStorage.getItem('admin_token');
      
      if (firebaseUser || currentToken) {
        await refreshData(true);

        if (!interval) {
          interval = setInterval(() => {
            refreshData(true);
          }, 30000);
        }

        if (!unsubscribeRealtime) {
          unsubscribeRealtime = mitraRealtimeService.subscribeToVerificationEvents(({ status }) => {
            console.log('[Realtime] Verification status updated:', status);
            setMitraStatus(status);
            refreshData(true);
          });
        }
      } else {
        setJamaahList([]);
        setStats(null);
        setLoading(false);
      }
    });

    const handleFocus = () => {
      const currentToken = localStorage.getItem('mitra_token') || localStorage.getItem('jamaah_token');
      if (auth.currentUser || currentToken) {
        refreshData(true);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeAuth();
      if (interval) clearInterval(interval);
      if (unsubscribeRealtime) unsubscribeRealtime();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return { jamaahList, stats, profile, dbUser, mitraStatus, setMitraStatus, loading, user, refreshData };
}

