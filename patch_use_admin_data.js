import { readFileSync, writeFileSync } from 'fs';

const content = `
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useAdminData() {
  const [users, setUsers] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/registrations')
      ]);
      setUsers(u);
      setRegistrations(r);
      setCurrentUser({ role: 'admin' });
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      refreshData();
    } else {
      setUsers([]);
      setRegistrations([]);
      setLoading(false);
    }
  }, []);

  return { users, registrations, loading, currentUser, refreshData };
}
`;

writeFileSync('src/hooks/useAdminData.ts', content.trim());
