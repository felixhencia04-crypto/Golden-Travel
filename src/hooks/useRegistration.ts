import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const JAMAAH_CACHE_KEY = 'cached_jamaah_portal_data';

function getJamaahCache() {
  try {
    const raw = sessionStorage.getItem(JAMAAH_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse jamaah cache', e);
  }
  return null;
}

export function useRegistration() {
  const cache = getJamaahCache();

  const [registration, setRegistration] = useState<any>(cache?.registration || null);
  const [packages, setPackages] = useState<any[]>(cache?.packages || []);
  const [schedules, setSchedules] = useState<any[]>(cache?.schedules || []);
  const [notifications, setNotifications] = useState<any[]>(cache?.notifications || []);
  const [manifest, setManifest] = useState<any>(cache?.manifest || null);
  const [equipment, setEquipment] = useState<any>(cache?.equipment || null);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(cache?.dbUser || null);

  const refreshData = async (silent = false) => {
    if (!silent && !cache) setLoading(true);
    try {
      const results = await Promise.all([
        api.get('/jamaah/registration').catch((err) => {
          console.error("refreshData: Registration fetch failed", err);
          if (err.message?.includes('Sesi') || err.message?.includes('login')) {
            auth.signOut().catch(() => {});
            localStorage.removeItem('jamaah_token');
            sessionStorage.removeItem(JAMAAH_CACHE_KEY);
            window.location.href = '/login';
          }
          return { __error: true };
        }),
        api.get('/packages').catch((err) => {
          console.error("refreshData: Packages fetch failed", err);
          return { __error: true };
        }),
        api.get('/schedules').catch((err) => {
          console.error("refreshData: Schedules fetch failed", err);
          return { __error: true };
        }),
        api.get('/jamaah/notifications').catch(() => ({ __error: true })),
        api.get('/jamaah/manifest').catch(() => ({ __error: true })),
        api.get('/jamaah/equipment').catch(() => ({ __error: true })),
        api.get('/users/me').catch(() => ({ __error: true }))
      ]);

      const [reg, pkgs, schs, notifData, manifestData, equipData, me] = results;

      if (reg !== undefined && !(reg as any)?.__error) setRegistration(reg);
      if (pkgs !== undefined && !(pkgs as any)?.__error) setPackages(Array.isArray(pkgs) ? pkgs : []);
      if (schs !== undefined && !(schs as any)?.__error) setSchedules(Array.isArray(schs) ? schs : []);
      if (notifData !== undefined && !(notifData as any)?.__error) setNotifications(Array.isArray(notifData) ? notifData : []);
      if (manifestData !== undefined && !(manifestData as any)?.__error) setManifest(manifestData);
      if (equipData !== undefined && !(equipData as any)?.__error) setEquipment(equipData);
      if (me !== undefined && !(me as any)?.__error) setDbUser(me);

      const cached = getJamaahCache() || {};
      sessionStorage.setItem(JAMAAH_CACHE_KEY, JSON.stringify({
        registration: reg !== undefined && !(reg as any)?.__error ? reg : cached.registration,
        packages: pkgs !== undefined && !(pkgs as any)?.__error ? pkgs : cached.packages,
        schedules: schs !== undefined && !(schs as any)?.__error ? schs : cached.schedules,
        notifications: notifData !== undefined && !(notifData as any)?.__error ? notifData : cached.notifications,
        manifest: manifestData !== undefined && !(manifestData as any)?.__error ? manifestData : cached.manifest,
        equipment: equipData !== undefined && !(equipData as any)?.__error ? equipData : cached.equipment,
        dbUser: me !== undefined && !(me as any)?.__error ? me : cached.dbUser
      }));
    } catch (error) {
      console.error("refreshData: Critical error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasJamaahToken = !!localStorage.getItem('jamaah_token');

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser || localStorage.getItem('jamaah_token')) {
        refreshData(true);
      } else {
        setRegistration(null);
        setSchedules([]);
        setDbUser(null);
        setLoading(false);
        sessionStorage.removeItem(JAMAAH_CACHE_KEY);
      }
    });

    if (hasJamaahToken) {
      refreshData(true);
    }

    return () => unsubscribe();
  }, []);

  return { registration, setRegistration, packages, schedules, notifications, manifest, equipment, loading, user, dbUser, refreshData };
}
