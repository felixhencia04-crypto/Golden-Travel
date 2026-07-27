import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useAdminData() {
  const [users, setUsers] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [actionCenter, setActionCenter] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [broadcast, setBroadcast] = useState<any[]>([]);
  const [manifest, setManifest] = useState<any[]>([]);

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [u, r, p, s, ds, ac, eqData, brData, mnData, me] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/registrations'),
        api.get('/packages'),
        api.get('/admin/schedules'),
        api.get('/admin/dashboard-stats'),
        api.get('/admin/action-center'),
        api.get('/admin/equipment').catch(() => []),
        api.get('/admin/broadcast').catch(() => []),
        api.get('/admin/manifest').catch(() => []),
        api.get('/users/me').catch(() => ({ role: 'admin' }))
      ]);
      setUsers(u);
      setRegistrations(r);
      setPackages(p);
      setSchedules(s);
      setDashboardStats(ds);
      setActionCenter(ac);
      setEquipment(eqData || []);
      setBroadcast(brData || []);
      setManifest(mnData || []);
      setCurrentUser(me);
      return { users: u, registrations: r, packages: p, schedules: s, dashboardStats: ds, actionCenter: ac, equipment: eqData, broadcast: brData, manifest: mnData };
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      setCurrentUser(null);
      if (error.message?.includes('Sesi') || error.message?.includes('login') || error.message?.includes('Akses ditolak')) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
      throw error;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      refreshData();
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

  return { users, registrations, packages, schedules, dashboardStats, actionCenter, equipment, broadcast, manifest, loading, currentUser, refreshData };
}
