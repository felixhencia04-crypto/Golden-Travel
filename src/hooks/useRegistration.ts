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
      const [reg, pkgs, schs, notifData, manifestData, equipData, me] = await Promise.all([
        api.get('/jamaah/registration').catch((err) => {
          console.error("refreshData: Registration fetch failed", err);
          if (err.message?.includes('Sesi') || err.message?.includes('login')) {
            auth.signOut();
            sessionStorage.removeItem(JAMAAH_CACHE_KEY);
            window.location.href = '/login';
          }
          return null;
        }),
        api.get('/packages').catch((err) => {
          console.error("refreshData: Packages fetch failed", err);
          return [];
        }),
        api.get('/schedules').catch((err) => {
          console.error("refreshData: Schedules fetch failed", err);
          return [];
        }),
        api.get('/jamaah/notifications').catch(() => []),
        api.get('/jamaah/manifest').catch(() => null),
        api.get('/jamaah/equipment').catch(() => null),
        api.get('/users/me').catch(() => null)
      ]);

      let freshPkgs = Array.isArray(pkgs) && pkgs.length > 0 ? pkgs : packages;
      if ((!freshPkgs || freshPkgs.length === 0) && Array.isArray(pkgs)) {
        freshPkgs = pkgs;
      }
      const freshSchs = Array.isArray(schs) ? schs : [];
      const freshNotifs = Array.isArray(notifData) ? notifData : [];

      setRegistration(reg);
      if (freshPkgs && freshPkgs.length > 0) {
        setPackages(freshPkgs);
      } else if (Array.isArray(pkgs)) {
        setPackages(pkgs);
      }
      setSchedules(freshSchs);
      setNotifications(freshNotifs);
      setManifest(manifestData);
      setEquipment(equipData);
      setDbUser(me);

      sessionStorage.setItem(JAMAAH_CACHE_KEY, JSON.stringify({
        registration: reg,
        packages: freshPkgs,
        schedules: freshSchs,
        notifications: freshNotifs,
        manifest: manifestData,
        equipment: equipData,
        dbUser: me
      }));
    } catch (error) {
      console.error("refreshData: Critical error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        refreshData(true);
      } else {
        setRegistration(null);
        setSchedules([]);
        setDbUser(null);
        setLoading(false);
        sessionStorage.removeItem(JAMAAH_CACHE_KEY);
      }
    });

    return () => unsubscribe();
  }, []);

  return { registration, setRegistration, packages, schedules, notifications, manifest, equipment, loading, user, dbUser, refreshData };
}
