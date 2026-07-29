import { useState, useEffect } from 'react';
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

  const refreshData = async (silent = false) => {
    // If we already have cache, keep silent true by default for zero visual lag
    if (!silent && !cache) setLoading(true);
    try {
      const [u, r, p, s, ds, ac, eqData, brData, mnData, me] = await Promise.all([
        api.get('/admin/users').catch((e) => { console.warn("Admin users fetch error:", e?.message); return []; }),
        api.get('/admin/registrations').catch((e) => { console.warn("Admin registrations fetch error:", e?.message); return []; }),
        api.get('/packages').catch((e) => { console.warn("Packages fetch error:", e?.message); return []; }),
        api.get('/admin/schedules').catch((e) => { console.warn("Schedules fetch error:", e?.message); return []; }),
        api.get('/admin/dashboard-stats').catch((e) => { console.warn("Stats fetch error:", e?.message); return null; }),
        api.get('/admin/action-center').catch((e) => { console.warn("Action center fetch error:", e?.message); return []; }),
        api.get('/admin/equipment').catch(() => []),
        api.get('/admin/broadcast').catch(() => []),
        api.get('/admin/manifest').catch(() => []),
        api.get('/users/me').catch(() => ({ role: 'admin' }))
      ]);

      const freshUsers = u || [];
      const freshRegs = r || [];
      const freshPkgs = p || [];
      const freshSchedules = s || [];
      const freshActionCenter = ac || [];
      const freshEquipment = eqData || [];
      const freshBroadcast = brData || [];
      const freshManifest = mnData || [];

      setUsers(freshUsers);
      setRegistrations(freshRegs);
      setPackages(freshPkgs);
      setSchedules(freshSchedules);
      setDashboardStats(ds);
      setActionCenter(freshActionCenter);
      setEquipment(freshEquipment);
      setBroadcast(freshBroadcast);
      setManifest(freshManifest);
      setCurrentUser(me);

      // Save to sessionStorage for instant next render
      sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
        users: freshUsers,
        registrations: freshRegs,
        packages: freshPkgs,
        schedules: freshSchedules,
        dashboardStats: ds,
        actionCenter: freshActionCenter,
        equipment: freshEquipment,
        broadcast: freshBroadcast,
        manifest: freshManifest,
        currentUser: me
      }));

      return { users: freshUsers, registrations: freshRegs, packages: freshPkgs, schedules: freshSchedules, dashboardStats: ds, actionCenter: freshActionCenter, equipment: freshEquipment, broadcast: freshBroadcast, manifest: freshManifest };
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
  };

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
