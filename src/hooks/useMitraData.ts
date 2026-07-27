import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useMitraData() {
  const [jamaahList, setJamaahList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [jamaah, s] = await Promise.all([
        api.get('/mitra/jamaah'),
        api.get('/mitra/stats')
      ]);
      setJamaahList(jamaah);
      setStats(s);
    } catch (error) {
      console.error("Failed to fetch mitra data", error);
      if (error.message?.includes('Sesi') || error.message?.includes('login')) {
        auth.signOut();
        window.location.href = '/mitra/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        refreshData();
      } else {
        setJamaahList([]);
        setStats(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { jamaahList, stats, loading, user, refreshData };
}
