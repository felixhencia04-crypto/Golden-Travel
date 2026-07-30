import React from 'react';
import { RegistrationStatus } from '../types';
import { useRegistration } from '../hooks/useRegistration';

interface MenuGuardProps {
  allowedStatuses: RegistrationStatus[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const MenuGuard: React.FC<MenuGuardProps> = ({ allowedStatuses, children, fallback }) => {
  const { dbUser, loading } = useRegistration();

  if (loading) return <div>Loading...</div>;

  const currentStatus = dbUser?.status || 'DRAFT';

  const isAllowed = allowedStatuses.includes(currentStatus);

  if (!isAllowed) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Belum tersedia di tahap ini</h3>
        <p className="text-gray-600">
          Menu ini akan terbuka secara otomatis setelah Anda menyelesaikan tahap sebelumnya: 
          <span className="font-semibold text-blue-600 ml-1">{currentStatus.replace(/_/g, ' ')}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
