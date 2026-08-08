import React, { useState, useEffect } from 'react';
import { api, getAdminToken } from '../lib/api';

const ADMIN_CACHE_KEY = 'cached_admin_portal_data';

function getAdminCache() {
  try {
    const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse admin cache', e);
  }
  return null;
}

export function useAdminData() {
  const cache = getAdminCache();

  const [users, setUsers] = useState<any[]>(cache?.users || []);
  const [registrations, setRegistrations] = useState<any[]>(cache?.registrations || []);
  const [packages, setPackages] = useState<any[]>(cache?.packages || []);
  const [schedules, setSchedules] = useState<any[]>(cache?.schedules || []);
  const lastRefreshRef = React.useRef<number>(0);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [currentUser, setCurrentUser] = useState<any>(cache?.currentUser || null);

  const [dashboardStats, setDashboardStats] = useState<any>(cache?.dashboardStats || null);
  const [actionCenter, setActionCenter] = useState<any[]>(cache?.actionCenter || []);
  const [equipment, setEquipment] = useState<any[]>(cache?.equipment || []);
  const [broadcast, setBroadcast] = useState<any[]>(cache?.broadcast || []);
  const [manifest, setManifest] = useState<any[]>(cache?.manifest || []);

  const refreshData = React.useCallback(async (silent = false, force = false) => {
    // Throttle refresh calls to at most once every 5 seconds unless forced
    const now = Date.now();
    if (!force && silent && now - lastRefreshRef.current < 5000) {
      console.log("[Admin] Skipping silent refresh - throttled");
      return;
    }
    
    lastRefreshRef.current = now;
    
    // If we already have cache, keep silent true by default for zero visual lag
    if (!silent && !cache) setLoading(true);

    try {
      // Fetch admin packages with fallback
      const fetchPackages = async () => {
        try {
          const res = await api.get('/admin/packages');
          if (Array.isArray(res)) return res;
        } catch (e) {
          console.warn("Failed to fetch /admin/packages:", e);
        }
        try {
          const res2 = await api.get('/packages');
          if (Array.isArray(res2)) return res2;
        } catch (e) {
          console.warn("Failed to fetch /packages fallback:", e);
        }
        return { __error: true };
      };

      // Chunk requests to prevent rate limit (HTTP 429) and db connection pool exhaustion
      const chunk1 = await Promise.all([
        api.get('/admin/users').catch((e) => { console.warn("Admin users fetch error:", e?.message); return { __error: true }; }),
        api.get('/admin/registrations').catch((e) => { console.warn("Admin registrations fetch error:", e?.message); return { __error: true }; }),
        fetchPackages(),
      ]);
      const chunk2 = await Promise.all([
        api.get('/admin/schedules').catch((e) => { console.warn("Schedules fetch error:", e?.message); return { __error: true }; }),
        api.get('/admin/dashboard-stats').catch((e) => { console.warn("Stats fetch error:", e?.message); return { __error: true }; }),
        api.get('/admin/action-center').catch((e) => { console.warn("Action center fetch error:", e?.message); return { __error: true }; }),
      ]);
      const chunk3 = await Promise.all([
        api.get('/admin/equipment').catch(() => ({ __error: true })),
        api.get('/admin/broadcast').catch(() => ({ __error: true })),
        api.get('/admin/manifest').catch(() => ({ __error: true })),
        api.get('/users/me').catch(() => ({ __error: true }))
      ]);

      const [u, r, p] = chunk1;
      const [s, ds, ac] = chunk2;
      const [eqData, brData, mnData, me] = chunk3;

      if (u !== undefined && !(u as any)?.__error) setUsers(Array.isArray(u) ? u : []);
      if (r !== undefined && !(r as any)?.__error) setRegistrations(Array.isArray(r) ? r : []);
      if (p !== undefined && !(p as any)?.__error) setPackages(Array.isArray(p) ? p : []);
      if (s !== undefined && !(s as any)?.__error) setSchedules(Array.isArray(s) ? s : []);
      if (ds !== undefined && !(ds as any)?.__error) setDashboardStats(ds);
      if (ac !== undefined && !(ac as any)?.__error) setActionCenter(Array.isArray(ac) ? ac : []);
      if (eqData !== undefined && !(eqData as any)?.__error) setEquipment(Array.isArray(eqData) ? eqData : []);
      if (brData !== undefined && !(brData as any)?.__error) setBroadcast(Array.isArray(brData) ? brData : []);
      if (mnData !== undefined && !(mnData as any)?.__error) setManifest(Array.isArray(mnData) ? mnData : []);
      if (me !== undefined && !(me as any)?.__error) setCurrentUser(me);

      const cached = getAdminCache() || {};
      const sanitizeList = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        return list.map(item => {
          if (!item || typeof item !== 'object') return item;
          const copy = { ...item };
          if (typeof copy.imageUrl === 'string' && copy.imageUrl.startsWith('data:image')) {
            copy.imageUrl = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80';
          }
          if (typeof copy.image === 'string' && copy.image.startsWith('data:image')) {
            copy.image = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80';
          }
          if (typeof copy.avatarUrl === 'string' && copy.avatarUrl.startsWith('data:image')) {
            copy.avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80';
          }
          return copy;
        });
      };

      try {
        sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
          users: sanitizeList(u !== undefined && !(u as any)?.__error ? u : cached.users),
          registrations: sanitizeList(r !== undefined && !(r as any)?.__error ? r : cached.registrations),
          packages: sanitizeList(p !== undefined && !(p as any)?.__error ? p : cached.packages),
          schedules: sanitizeList(s !== undefined && !(s as any)?.__error ? s : cached.schedules),
          dashboardStats: ds !== undefined && !(ds as any)?.__error ? ds : cached.dashboardStats,
          actionCenter: ac !== undefined && !(ac as any)?.__error ? ac : cached.actionCenter,
          equipment: eqData !== undefined && !(eqData as any)?.__error ? eqData : cached.equipment,
          broadcast: brData !== undefined && !(brData as any)?.__error ? brData : cached.broadcast,
          manifest: mnData !== undefined && !(mnData as any)?.__error ? mnData : cached.manifest,
          currentUser: me !== undefined && !(me as any)?.__error ? me : cached.currentUser
        }));
      } catch (cacheErr) {
        console.warn("Notice: sessionStorage write skipped (QuotaExceeded):", cacheErr);
      }

      return { 
        users: u !== undefined && !(u as any)?.__error ? u : cached.users,
        registrations: r !== undefined && !(r as any)?.__error ? r : cached.registrations,
        packages: p !== undefined && !(p as any)?.__error ? p : cached.packages,
        schedules: s !== undefined && !(s as any)?.__error ? s : cached.schedules
      };
    } catch (error: any) {
      console.error("Failed to fetch admin data", error);
      if (error?.message?.includes('Sesi') || error?.message?.includes('login') || error?.message?.includes('Akses ditolak')) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem(ADMIN_CACHE_KEY);
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const adminToken = getAdminToken();
    if (adminToken) {
      // Fast background fetch without blocking UI
      refreshData(true).catch(err => {
        console.error("refreshData error:", err);
        setLoading(false);
      });
    } else {
      setUsers([]);
      setRegistrations([]);
      setPackages([]);
      setSchedules([]);
      setDashboardStats(null);
      setActionCenter([]);
      setLoading(false);
    }
  }, []);

  return { users, setUsers, registrations, setRegistrations, packages, setPackages, schedules, setSchedules, dashboardStats, actionCenter, equipment, broadcast, manifest, loading, currentUser, setCurrentUser, refreshData };
}
