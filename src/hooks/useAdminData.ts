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
  const [loading, setLoading] = useState<boolean>(!cache);
  const [currentUser, setCurrentUser] = useState<any>(cache?.currentUser || null);

  const [dashboardStats, setDashboardStats] = useState<any>(cache?.dashboardStats || null);
  const [actionCenter, setActionCenter] = useState<any[]>(cache?.actionCenter || []);
  const [equipment, setEquipment] = useState<any[]>(cache?.equipment || []);
  const [broadcast, setBroadcast] = useState<any[]>(cache?.broadcast || []);
  const [manifest, setManifest] = useState<any[]>(cache?.manifest || []);

  const [lastRefresh, setLastRefresh] = useState<number>(0);

  const refreshData = React.useCallback(async (silent = false, force = false) => {
    // Throttle refresh calls to at most once every 5 seconds unless forced
    const now = Date.now();
    if (!force && silent && now - lastRefresh < 5000) {
      console.log("[Admin] Skipping silent refresh - throttled");
      return;
    }
    
    setLastRefresh(now);
    
    // If we already have cache, keep silent true by default for zero visual lag
    if (!silent && !cache) setLoading(true);

    try {
      // Chunk requests to prevent rate limit (HTTP 429) and db connection pool exhaustion
      const chunk1 = await Promise.all([
        api.get('/admin/users').catch((e) => { console.warn("Admin users fetch error:", e?.message); return { __error: true }; }),
        api.get('/admin/registrations').catch((e) => { console.warn("Admin registrations fetch error:", e?.message); return { __error: true }; }),
        api.get('/packages').catch((e) => { console.warn("Packages fetch error:", e?.message); return { __error: true }; }),
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
      sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
        users: u !== undefined && !(u as any)?.__error ? u : cached.users,
        registrations: r !== undefined && !(r as any)?.__error ? r : cached.registrations,
        packages: p !== undefined && !(p as any)?.__error ? p : cached.packages,
        schedules: s !== undefined && !(s as any)?.__error ? s : cached.schedules,
        dashboardStats: ds !== undefined && !(ds as any)?.__error ? ds : cached.dashboardStats,
        actionCenter: ac !== undefined && !(ac as any)?.__error ? ac : cached.actionCenter,
        equipment: eqData !== undefined && !(eqData as any)?.__error ? eqData : cached.equipment,
        broadcast: brData !== undefined && !(brData as any)?.__error ? brData : cached.broadcast,
        manifest: mnData !== undefined && !(mnData as any)?.__error ? mnData : cached.manifest,
        currentUser: me !== undefined && !(me as any)?.__error ? me : cached.currentUser
      }));

      return { 
        users: u !== undefined && !(u as any)?.__error ? u : cached.users,
        registrations: r !== undefined && !(r as any)?.__error ? r : cached.registrations,
        packages: p !== undefined && !(p as any)?.__error ? p : cached.packages,
        schedules: s !== undefined && !(s as any)?.__error ? s : cached.schedules
      };
    } catch (error: any) {
      console.error("Failed to fetch admin data", error);
      setCurrentUser(null);
      if (error?.message?.includes('Sesi') || error?.message?.includes('login') || error?.message?.includes('Akses ditolak')) {
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem(ADMIN_CACHE_KEY);
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  }, [cache, lastRefresh]);

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

  return { users, setUsers, registrations, setRegistrations, packages, setPackages, schedules, setSchedules, dashboardStats, actionCenter, equipment, broadcast, manifest, loading, currentUser, refreshData };
}
