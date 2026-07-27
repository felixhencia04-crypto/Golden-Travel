import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useRegistration() {
  const [registration, setRegistration] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [manifest, setManifest] = useState<any>(null);
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    console.log(`refreshData (silent=${silent}): Fetching registration, packages & schedules...`);
    try {
      const [reg, pkgs, schs, notifData, manifestData, equipData, me] = await Promise.all([
        api.get('/jamaah/registration').catch((err) => {
          console.error("refreshData: Registration fetch failed", err);
          if (err.message?.includes('Sesi') || err.message?.includes('login')) {
            auth.signOut();
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
      setRegistration(reg);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
      setSchedules(Array.isArray(schs) ? schs : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setManifest(manifestData);
      setEquipment(equipData);
      setDbUser(me);
    } catch (error) {
      console.error("refreshData: Critical error", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        refreshData();
      } else {
        setRegistration(null);
        setSchedules([]);
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { registration, packages, schedules, notifications, manifest, equipment, loading, user, dbUser, refreshData };
}
