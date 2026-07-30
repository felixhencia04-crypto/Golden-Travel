import React, { useState } from 'react';
import { Sidebar } from '../../components/jamaah/Sidebar';
import { Dashboard } from './Dashboard';
import { PilihPaket } from './PilihPaket';
import { Pembayaran } from './Pembayaran';
import { MenuGuard } from '../../components/MenuGuard';
import { useRegistrasi } from '../../hooks/useRegistrasi';
import { Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function PortalJamaah() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { dbUser, loading } = useRegistrasi();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pilih_paket':
        return (
          <MenuGuard allowedStatuses={['DRAFT']}>
            <PilihPaket />
          </MenuGuard>
        );
      case 'biodata':
        return (
          <MenuGuard allowedStatuses={['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI']}>
            <div className="p-10 text-center text-gray-500">Halaman Biodata & Paspor (Tahap Pengembangan)</div>
          </MenuGuard>
        );
      case 'dokumen':
        return (
          <MenuGuard allowedStatuses={['UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN']}>
            <div className="p-10 text-center text-gray-500">Halaman Unggah Dokumen (Tahap Pengembangan)</div>
          </MenuGuard>
        );
      case 'pembayaran':
        return (
          <MenuGuard allowedStatuses={['CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI']}>
            <Pembayaran />
          </MenuGuard>
        );
      default:
        return <div className="p-10 text-center text-gray-500">Halaman {activeTab} segera hadir.</div>;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block h-screen sticky top-0 z-50">
        <Sidebar 
          activeTab={activeTab} 
          onTabClick={setActiveTab} 
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-72 z-[70] lg:hidden"
            >
              <Sidebar 
                activeTab={activeTab} 
                onTabClick={(id) => { setActiveTab(id); setIsSidebarOpen(false); }} 
                isCollapsed={false}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:p-2 lg:block text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">
              {activeTab.replace(/_/g, ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{dbUser?.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{dbUser?.role}</p>
             </div>
             <button 
               onClick={handleLogout}
               className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm shadow-red-100/50"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
