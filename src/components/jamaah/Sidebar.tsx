import React from 'react';
import { 
  LayoutDashboard, Tag, User, Upload, Banknote, Plane, Scroll, MessageCircle, Award, UserCircle, Lock, ChevronRight
} from 'lucide-react';
import { useRegistrasi } from '../../hooks/useRegistrasi';
import { RegistrationStatus } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabClick: (tabId: string) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabClick, isCollapsed }) => {
  const { dbUser } = useRegistrasi();
  const currentStatus: RegistrationStatus = dbUser?.status || 'DRAFT';

  const isTabDisabled = (tabId: string) => {
    if (tabId === 'dashboard' || tabId === 'akun' || tabId === 'bantuan') return false;
    
    switch (tabId) {
      case 'pilih_paket': return currentStatus !== 'DRAFT';
      case 'biodata': return !['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'].includes(currentStatus);
      case 'dokumen': return !['UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN'].includes(currentStatus);
      case 'pembayaran': return !['CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'].includes(currentStatus);
      case 'persiapan': return !['SIAP_BERANGKAT', 'BERANGKAT'].includes(currentStatus);
      case 'dokumen_berangkat': return !['SIAP_BERANGKAT', 'BERANGKAT'].includes(currentStatus);
      case 'kenangan': return currentStatus !== 'SELESAI';
      default: return false;
    }
  };

  const menuGroups = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'pilih_paket', label: 'Pilih Paket', icon: <Tag className="w-5 h-5" /> },
        { id: 'biodata', label: 'Biodata & Paspor', icon: <User className="w-5 h-5" /> },
        { id: 'dokumen', label: 'Unggah Dokumen', icon: <Upload className="w-5 h-5" /> },
        { id: 'pembayaran', label: 'Pembayaran', icon: <Banknote className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Persiapan',
      items: [
        { id: 'persiapan', label: 'Persiapan Keberangkatan', icon: <Plane className="w-5 h-5" /> },
        { id: 'dokumen_berangkat', label: 'Dokumen Keberangkatan', icon: <Scroll className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Layanan',
      items: [
        { id: 'bantuan', label: 'Pusat Bantuan', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'kenangan', label: 'Kenangan & Sertifikat', icon: <Award className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { id: 'akun', label: 'Pengaturan Akun', icon: <UserCircle className="w-5 h-5" /> },
      ]
    }
  ];

  return (
    <aside className={`bg-[#132019] text-white transition-all duration-300 flex flex-col h-screen sticky top-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center shrink-0">
          <span className="text-black font-bold text-xl">G</span>
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">Golden Travel</h1>
            <p className="text-[10px] text-gold-400 font-bold uppercase">Portal Jamaah</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {!isCollapsed && <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-4">{group.title}</h3>}
            <div className="space-y-1">
              {group.items.map(item => {
                const disabled = isTabDisabled(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !disabled && onTabClick(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-gold-500 text-black font-bold' 
                        : disabled 
                          ? 'text-gray-600 cursor-not-allowed opacity-50' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && disabled && <span className="ml-2 text-xs">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};
