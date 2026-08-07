import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogo } from '../utils/logo';
import { toast } from 'sonner';
import { 
  LayoutDashboard, Users, Luggage, CalendarDays, Wallet, FileText, 
  LogOut, Bell, Menu, Plane, Target, TrendingUp, ArrowRight, 
  UserCheck, Sparkles, Crown, Award, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Clock, ChevronRight, ChevronDown,
  MoreVertical, Download, Printer, Share2, Mail, Phone,
  AlertCircle, PieChart, BarChart2, RefreshCcw, ShieldCheck, UserPlus,
  Tag, Search, Star, RefreshCw, ExternalLink, MessageCircle, X, Calendar, Info,
  Image as ImageIcon, Settings, Lock, Receipt
} from 'lucide-react';
import { useMitraData } from '../hooks/useMitraData';
import MitraOnboardingForm from '../components/MitraOnboardingForm';
import { api } from '../lib/api';
import { mitraRealtimeService } from '../services/mitraRealtimeService';
import { getScopedKey, filterJamaahForCurrentMitra } from '../utils/mitraStorage';
import MitraJamaahBiodata from '../components/mitra/MitraJamaahBiodata';
import MitraJamaahDokumen from '../components/mitra/MitraJamaahDokumen';
import MitraPembayaran from '../components/mitra/MitraPembayaran';
import MitraPersiapanKeberangkatan from '../components/mitra/MitraPersiapanKeberangkatan';
import MitraDokumenKeberangkatan from '../components/mitra/MitraDokumenKeberangkatan';
import MitraKenangan from '../components/mitra/MitraKenangan';
import MitraSertifikat from '../components/mitra/MitraSertifikat';
import MitraPengajuanKomisi from '../components/mitra/MitraPengajuanKomisi';
import MitraPengaturanAkun from '../components/mitra/MitraPengaturanAkun';
import MitraInfoKomisi from '../components/mitra/MitraInfoKomisi';

type DashboardTab = 'info_komisi' | 'dashboard' | 'registration' | 'verification' | 'pilih_paket' | 'katalog_paket' | 'informasi_jadwal' | 'daftar_jamaah_biodata' | 'daftar_jamaah_dokumen' | 'pembayaran' | 'persiapan_keberangkatan' | 'dokumen_keberangkatan' | 'kenangan' | 'sertifikat' | 'pengajuan_komisi' | 'pengaturan_akun';

const PulseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

function MetricCard({ label, value, icon: Icon, color, badge, progress }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="glass-card p-6 rounded-3xl group bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-400/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} border transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors[color]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</h4>
        <div className="text-2xl font-black text-slate-900">{value}</div>
      </div>
      {typeof progress === 'number' && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>Progress Target</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardMitra() {
  const logoImg = useLogo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const { jamaahList, stats, profile, dbUser, mitraStatus, loading, user, refreshData } = useMitraData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPilihPaketOpen, setIsPilihPaketOpen] = useState(true);
  const [isCalonJamaahOpen, setIsCalonJamaahOpen] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  // Notification Popover & State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const scopedKey = getScopedKey('read_notification_ids');
      const saved = localStorage.getItem(scopedKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Unified Candidate Jamaah calculation for active logged in Mitra
  const combinedJamaahList = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    if (Array.isArray(jamaahList)) {
      jamaahList.forEach((j: any) => {
        const id = j.id || j.registrationId || j.nik;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          list.push({
            id: id,
            userName: j.userName || j.name || j.namaLengkap || 'Jamaah',
            packageName: j.packageName || j.package?.name || 'Paket Ibadah',
            totalAmount: Number(j.totalAmount || j.price || j.packagePrice || j.package?.price || 0),
            status: j.status || j.registrationStatus || 'registered',
            createdAt: j.createdAt || Date.now()
          });
        }
      });
    }

    try {
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const savedPaxStr = localStorage.getItem(scopedKey);
      if (savedPaxStr) {
        const savedPax = JSON.parse(savedPaxStr);
        if (Array.isArray(savedPax)) {
          savedPax.forEach((j: any) => {
            const id = j.id || j.nik || `${j.userName}_${j.paxNo}`;
            if (id && !seenIds.has(id) && (j.userName || j.nik)) {
              seenIds.add(id);
              list.push({
                id: id,
                userName: j.userName || j.name || 'Jamaah',
                packageName: j.packageName || j.package?.name || 'Paket Ibadah',
                totalAmount: Number(j.totalAmount || j.packagePrice || j.price || 0),
                status: j.status || j.registrationStatus || 'registered',
                createdAt: j.createdAt || Date.now()
              });
            }
          });
        }
      }
    } catch (e) {}

    try {
      const centralDbStr = localStorage.getItem('mitra_jamaah_database');
      if (centralDbStr) {
        const centralDb = JSON.parse(centralDbStr);
        if (Array.isArray(centralDb)) {
          const filtered = filterJamaahForCurrentMitra(centralDb);
          filtered.forEach((j: any) => {
            const id = j.id || j.nik || j.registrationId;
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              list.push({
                id: id,
                userName: j.userName || j.name || j.namaLengkap || 'Jamaah',
                packageName: j.packageName || j.package?.name || 'Paket Ibadah',
                totalAmount: Number(j.totalAmount || j.packagePrice || j.price || 0),
                status: j.status || j.registrationStatus || 'registered',
                createdAt: j.createdAt || Date.now()
              });
            }
          });
        }
      }
    } catch (e) {}

    return list;
  }, [jamaahList]);

  // Real KPI Metrics derived from real data
  const totalJamaahCount = combinedJamaahList.length || stats?.totalReferrals || 0;
  
  const jamaahAktifCount = useMemo(() => {
    if (combinedJamaahList.length > 0) {
      return combinedJamaahList.filter((j: any) => {
        const st = String(j.status || '').toLowerCase();
        return !['departed', 'selesai', 'berangkat', 'batal', 'cancelled'].includes(st);
      }).length;
    }
    return stats?.totalReferrals || (mitraStatus === 'active' ? 1 : 0);
  }, [combinedJamaahList, stats, mitraStatus]);

  const keberangkatanCount = useMemo(() => {
    return combinedJamaahList.filter((j: any) => {
      const st = String(j.status || '').toLowerCase();
      return ['departed', 'selesai', 'berangkat'].includes(st);
    }).length;
  }, [combinedJamaahList]);

  const targetProgress = Math.min(100, Math.round((totalJamaahCount / 50) * 100));

  // Real Total Sales Value
  const realTotalSales = useMemo(() => {
    const sum = combinedJamaahList.reduce((acc, j) => acc + Number(j.totalAmount || 0), 0);
    return sum > 0 ? sum : Number(stats?.totalReferralVolume || 0);
  }, [combinedJamaahList, stats]);

  // Real Recent Activities Feed
  const recentActivities = useMemo(() => {
    const list: any[] = [];

    combinedJamaahList.forEach((j: any, i: number) => {
      const st = (j.status || 'registered').toLowerCase();
      let statusLabel = 'Terdaftar';
      let statusColor = 'text-amber-700 bg-amber-50 border border-amber-200';

      if (['lunas', 'verified', 'verifikasi', 'dp'].includes(st)) {
        statusLabel = 'Terverifikasi';
        statusColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      } else if (['berangkat', 'departed', 'selesai'].includes(st)) {
        statusLabel = 'Keberangkatan';
        statusColor = 'text-blue-700 bg-blue-50 border border-blue-200';
      }

      list.push({
        id: `act-jam-${j.id || i}`,
        title: 'Pendaftaran Jamaah Baru',
        subtitle: `${j.packageName} - ${j.userName}`,
        statusLabel: statusLabel,
        statusColor: statusColor,
        timestamp: j.createdAt ? new Date(j.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Baru saja',
        icon: UserCheck
      });
    });

    if (mitraStatus === 'active') {
      list.unshift({
        id: 'act-mitra-verif',
        title: 'Verifikasi Kemitraan Resmikan',
        subtitle: 'Akun Mitra Resmi Terverifikasi Admin Golden Travel',
        statusLabel: 'Aktif Terverifikasi',
        statusColor: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
        timestamp: 'Hari Ini',
        icon: ShieldCheck
      });
    } else if (mitraStatus === 'pending_verification') {
      list.unshift({
        id: 'act-mitra-pending',
        title: 'Pengajuan Kemitraan',
        subtitle: 'Data profil mitra sedang dalam peninjauan admin',
        statusLabel: 'Ditinjau Admin',
        statusColor: 'text-amber-700 bg-amber-50 border border-amber-200',
        timestamp: 'Hari Ini',
        icon: Clock
      });
    }

    return list.slice(0, 5);
  }, [combinedJamaahList, mitraStatus]);

  // Real Notifications List & Unread counter
  const notificationsList = useMemo(() => {
    const items: any[] = [];

    if (mitraStatus === 'active') {
      items.push({
        id: 'notif-status-active',
        title: 'Persetujuan Verifikasi Kemitraan',
        message: 'Selamat! Akun kemitraan Anda telah disetujui oleh Tim Admin Golden Travel. Anda resmi terverifikasi.',
        type: 'success',
        category: 'Persetujuan Admin',
        timestamp: 'Baru saja',
        tab: 'verification' as DashboardTab
      });
    } else if (mitraStatus === 'pending_verification') {
      items.push({
        id: 'notif-status-pending',
        title: 'Konfirmasi Peninjauan Admin',
        message: 'Pendaftaran kemitraan Anda telah diterima dan sedang ditinjau oleh tim verifikasi admin.',
        type: 'warning',
        category: 'Permintaan Konfirmasi',
        timestamp: 'Dalam Proses',
        tab: 'verification' as DashboardTab
      });
    } else if (mitraStatus === 'rejected') {
      items.push({
        id: 'notif-status-rejected',
        title: 'Permintaan Perbaikan Data',
        message: 'Admin meminta perbaikan data profil kemitraan Anda. Silakan periksa kembali data biodata.',
        type: 'danger',
        category: 'Permintaan Perbaikan',
        timestamp: 'Tindakan Diperlukan',
        tab: 'registration' as DashboardTab
      });
    }

    combinedJamaahList.forEach((j: any, i: number) => {
      items.push({
        id: `notif-jamaah-${j.id || i}`,
        title: `Pendaftaran Jamaah: ${j.userName}`,
        message: `Jamaah ${j.userName} terdaftar untuk paket ${j.packageName}. Status: ${j.status || 'Terdaftar'}.`,
        type: 'info',
        category: 'Penyimpanan Jamaah',
        timestamp: j.createdAt ? new Date(j.createdAt).toLocaleDateString('id-ID') : 'Terbaru',
        tab: 'daftar_jamaah_biodata' as DashboardTab
      });
    });

    items.push({
      id: 'notif-system-schedule',
      title: 'Pembaruan Jadwal & Brosur Paket',
      message: 'Tim Admin telah memperbarui informasi jadwal keberangkatan dan paket Umroh/Haji terbaru.',
      type: 'system',
      category: 'Pembaruan Admin',
      timestamp: 'Hari Ini',
      tab: 'informasi_jadwal' as DashboardTab
    });

    return items;
  }, [mitraStatus, combinedJamaahList]);

  const unreadCount = useMemo(() => {
    return notificationsList.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [notificationsList, readNotifIds]);

  const markNotifAsRead = (id: string) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        const scopedKey = getScopedKey('read_notification_ids');
        localStorage.setItem(scopedKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const markAllNotifsAsRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      const scopedKey = getScopedKey('read_notification_ids');
      localStorage.setItem(scopedKey, JSON.stringify(allIds));
    } catch (e) {}
    toast.success('Semua notifikasi telah ditandai dibaca.');
  };

  // Real-time package and schedule data connected to Admin Portal
  const [packages, setPackages] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageCategory, setPackageCategory] = useState<'umroh' | 'haji'>('umroh');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<any | null>(null);

  // Package & Pax Selection State
  const [selectedPackageForBooking, setSelectedPackageForBooking] = useState<any | null>(null);

  const handleOpenSelectPackageModal = (pkg: any) => {
    setSelectedPackageForBooking(pkg);
  };

  const handleConfirmPackageSelection = () => {
    if (!selectedPackageForBooking) return;
    
    const bookingData = {
      package: selectedPackageForBooking,
      paxCount: 1, // Forced to 1 as requested
      departureDate: '-', // Removed date selection as requested
      registrationId: `REG-${Date.now()}`,
      timestamp: Date.now()
    };
    localStorage.setItem('selected_mitra_package', JSON.stringify(bookingData));
    
    toast.success(`Paket ${selectedPackageForBooking.name} dipilih!`);
    setSelectedPackageForBooking(null);
    setActiveTab('daftar_jamaah_biodata');
  };

  const fetchPackagesAndSchedules = async (isSilent = false) => {
    if (!isSilent) setLoadingPackages(true);
    try {
      const [pkgData, schData] = await Promise.all([
        api.get('/packages').catch((e) => { console.warn("Failed fetching packages:", e); return null; }),
        api.get('/schedules').catch((e) => { console.warn("Failed fetching schedules:", e); return null; })
      ]);
      if (Array.isArray(pkgData)) setPackages(pkgData);
      if (Array.isArray(schData)) setSchedules(schData);
    } catch (err) {
      console.error('Error fetching packages or schedules:', err);
    } finally {
      if (!isSilent) setLoadingPackages(false);
    }
  };

  useEffect(() => {
    // Initial fetch with spinner
    fetchPackagesAndSchedules(false);

    // 1. Subscribe to SSE Server Real-Time Events
    const unsubscribeSSE = mitraRealtimeService.subscribeToRealtimeEvents((event) => {
      if (['data_updated', 'PACKAGE_MUTATED', 'SCHEDULE_MUTATED', 'VERIFICATION_APPROVED'].includes(event)) {
        fetchPackagesAndSchedules(true);
      }
    });

    // 2. High-frequency 3-second background polling timer for instant synchronization
    const pollInterval = setInterval(() => {
      fetchPackagesAndSchedules(true);
    }, 3000);

    // 3. Window focus and cross-tab storage event listener
    const handleFocus = () => fetchPackagesAndSchedules(true);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mitra_catalog_mutated' || e.key === 'admin_packages_updated') {
        fetchPackagesAndSchedules(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleFocus);

    // 4. BroadcastChannel for instant cross-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mitra_catalog_realtime');
      bc.onmessage = () => {
        fetchPackagesAndSchedules(true);
      };
    } catch (e) {
      // BroadcastChannel not supported in ancient browser
    }

    return () => {
      unsubscribeSSE();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleFocus);
      if (bc) bc.close();
    };
  }, []);

  const isVerified = mitraStatus === 'active';

  const handleTabClick = (tab: DashboardTab) => {
    const restrictedTabs: DashboardTab[] = [
      'pilih_paket', 'katalog_paket', 'informasi_jadwal',
      'daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran',
      'persiapan_keberangkatan', 'dokumen_keberangkatan',
      'kenangan', 'sertifikat', 'pengajuan_komisi'
    ];

    if (!isVerified && restrictedTabs.includes(tab)) {
      if (mitraStatus === 'pending_verification') {
        toast.error('Akun Anda masih dalam proses peninjauan Admin. Menu ini akan terbuka otomatis setelah disetujui.', {
          duration: 4000
        });
        setActiveTab('verification');
      } else {
        toast.error('Silakan lengkapi profil Anda terlebih dahulu untuk mengajukan verifikasi ke Admin.', {
          duration: 4000
        });
        setActiveTab('registration');
      }
      return;
    }

    setActiveTab(tab);
  };

  // Restricted tab guard
  useEffect(() => {
    if (!loading && mitraStatus && mitraStatus !== 'active') {
      const restrictedTabs: DashboardTab[] = [
        'pilih_paket', 'katalog_paket', 'informasi_jadwal',
        'daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran',
        'persiapan_keberangkatan', 'dokumen_keberangkatan',
        'kenangan', 'sertifikat', 'pengajuan_komisi'
      ];
      if (restrictedTabs.includes(activeTab)) {
        if (mitraStatus === 'pending_verification') {
          toast.error('Akses Dibatasi: Akun Anda belum terverifikasi oleh Admin.');
          setActiveTab('verification');
        } else {
          toast.error('Akses Dibatasi: Silakan lengkapi profil Anda terlebih dahulu.');
          setActiveTab('registration');
        }
      }
    }
  }, [loading, mitraStatus, activeTab]);

  useEffect(() => {
    if (prevStatusRef.current !== null && prevStatusRef.current !== 'active' && mitraStatus === 'active') {
      toast.success('🎉 SELAMAT! Data Pendaftaran Anda telah terverifikasi oleh Admin. Status akun Anda kini AKTIF!', {
        duration: 8000
      });
    }
    prevStatusRef.current = mitraStatus;
  }, [mitraStatus]);

  const handleFormSubmitted = async () => {
    await refreshData();
    setActiveTab('verification');
    toast.success('Pendaftaran berhasil dikirim! Status akun Anda sekarang berada pada Tahap 02: Peninjauan Admin.');
  };

  const handleShareWA = (pkg: any) => {
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nSalam dari Perwakilan Resmi Golden Travel!\n\nBerikut rincian *${pkg.name}* (${(pkg.type || 'Umroh').toUpperCase()}):\n✨ *Durasi:* ${pkg.duration || '-'}\n💰 *Investasi Ibadah:* Rp ${Number(pkg.price || 0).toLocaleString('id-ID')}\n\nUntuk informasi pendaftaran & konsultasi jadwal, silakan hubungi kami. Terimakasih!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRegisterJemaahHelp = (pkg: any) => {
    const text = `Assalamu'alaikum Admin, saya Mitra *${dbUser?.name || profile?.namaLengkap || 'Mitra'}* (ID: ${(dbUser?.id || '').substring(0, 8)})\ningin membantu pendaftaran calon jemaah untuk paket:\n📌 *${pkg.name}*\nMohon informasi ketersediaan kuota & prosedur pendaftarannya. Terima kasih!`;
    const adminPhone = '6282283201103';
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans animate-pulse">
        <div className="w-72 bg-white border-r border-slate-200 p-6 space-y-6 hidden lg:block">
          <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
          <div className="space-y-3 pt-6">
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
        <div className="flex-1 p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 rounded-lg w-64"></div>
              <div className="h-4 bg-slate-100 rounded-lg w-96"></div>
            </div>
            <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
          </div>
          <div className="h-36 bg-slate-200 rounded-[2rem]"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'info_komisi': return 'Informasi Fee & Skema Komisi Mitra';
      case 'dashboard': return 'Dashboard';
      case 'pilih_paket':
      case 'katalog_paket': return 'Katalog Paket Ibadah';
      case 'informasi_jadwal': return 'Informasi Jadwal Keberangkatan';
      case 'daftar_jamaah_biodata': return 'Daftar Calon Jamaah - Biodata & Paspor';
      case 'daftar_jamaah_dokumen': return 'Daftar Calon Jamaah - Unggah Dokumen';
      case 'pembayaran': return 'Pembayaran Calon Jamaah';
      case 'persiapan_keberangkatan': return 'Persiapan Keberangkatan';
      case 'dokumen_keberangkatan': return 'Dokumen Keberangkatan';
      case 'kenangan': return 'Momen Kenangan Perjalanan';
      case 'sertifikat': return 'Sertifikat Digital Jamaah';
      case 'pengajuan_komisi': return 'Pengajuan Pencairan Komisi';
      case 'pengaturan_akun': return 'Pengaturan Akun Mitra';
      case 'registration': return 'Lengkapi Profil';
      case 'verification': return 'Status Verifikasi';
      default: return 'Mitra Panel';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        .sidebar-item-active {
          background: linear-gradient(135deg, #064E3B 0%, #022C22 100%);
          color: #FFFFFF !important;
          box-shadow: 0 6px 20px -4px rgba(6, 78, 59, 0.4);
          border-left: 4px solid #F59E0B;
        }
        
        .glass-card {
          transition: all 0.3s ease;
        }
      `}} />

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen 
            ? 'w-72 opacity-100 border-r border-slate-200 translate-x-0' 
            : 'w-0 opacity-0 border-r-0 -translate-x-full pointer-events-none overflow-hidden'
        } bg-white transition-all duration-300 flex flex-col z-40 fixed lg:relative h-screen shrink-0`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-900 p-1.5 shadow-lg shadow-emerald-900/20 shrink-0">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          {isSidebarOpen && (
            <div className="font-playfair font-bold text-emerald-900 text-lg tracking-tight truncate">MITRA PANEL</div>
          )}
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {isSidebarOpen && (
            <div className="px-4 mb-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Navigasi Utama</div>
            </div>
          )}
          
          <button
            onClick={() => handleTabClick('info_komisi')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'info_komisi' 
                ? 'sidebar-item-active' 
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <Award className={`w-5 h-5 shrink-0 ${activeTab === 'info_komisi' ? 'text-amber-300' : 'text-emerald-700'}`} />
            {isSidebarOpen && <span className="truncate">Informasi Komisi</span>}
          </button>

          <button
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'dashboard' 
                ? 'sidebar-item-active' 
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-amber-300' : 'text-emerald-700'}`} />
            {isSidebarOpen && <span className="truncate">Dashboard</span>}
          </button>

          <button
            onClick={() => handleTabClick('registration')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'registration' 
                ? 'sidebar-item-active' 
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <FileText className={`w-5 h-5 shrink-0 ${activeTab === 'registration' ? 'text-amber-300' : 'text-emerald-700'}`} />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Lengkapi Profil</span>
                {mitraStatus === 'incomplete_profile' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                )}
              </div>
            )}
          </button>

          <button
            onClick={() => handleTabClick('verification')}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'verification' 
                ? 'sidebar-item-active' 
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <UserCheck className={`w-5 h-5 shrink-0 ${activeTab === 'verification' ? 'text-amber-300' : 'text-emerald-700'}`} />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Status Verifikasi</span>
                {!isVerified && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                    {mitraStatus === 'pending_verification' ? 'Ditinjau' : 'Belum'}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Accordion Group: Pilih Paket */}
          <div>
            <button
              onClick={() => {
                if (!isVerified) {
                  handleTabClick('katalog_paket');
                } else {
                  setIsPilihPaketOpen(!isPilihPaketOpen);
                  if (activeTab !== 'katalog_paket' && activeTab !== 'informasi_jadwal') {
                    handleTabClick('katalog_paket');
                  }
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                (activeTab === 'katalog_paket' || activeTab === 'informasi_jadwal' || activeTab === 'pilih_paket')
                  ? 'text-white bg-emerald-900 shadow-md border-l-4 border-amber-400'
                  : !isVerified
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                <Tag className={`w-5 h-5 shrink-0 ${(activeTab === 'katalog_paket' || activeTab === 'informasi_jadwal' || activeTab === 'pilih_paket') ? 'text-amber-300' : (!isVerified ? 'text-slate-400' : 'text-emerald-700')}`} />
                {isSidebarOpen && <span className="truncate">Pilih Paket</span>}
              </div>
              {isSidebarOpen && (
                <div className="flex items-center gap-1.5">
                  {!isVerified && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <ChevronDown className={`w-4 h-4 ${(activeTab === 'katalog_paket' || activeTab === 'informasi_jadwal' || activeTab === 'pilih_paket') ? 'text-amber-300' : 'text-slate-400'} transition-transform duration-200 ${isPilihPaketOpen ? 'rotate-180' : ''}`} />
                </div>
              )}
            </button>

            {/* Sub-items */}
            {isPilihPaketOpen && isSidebarOpen && (
              <div className="ml-8 mt-1 space-y-1 pl-3 border-l-2 border-emerald-200">
                <button
                  onClick={() => handleTabClick('katalog_paket')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'katalog_paket' || activeTab === 'pilih_paket'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Katalog Paket
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {(activeTab === 'katalog_paket' || activeTab === 'pilih_paket') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('informasi_jadwal')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'informasi_jadwal'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Informasi Jadwal
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'informasi_jadwal' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Accordion Group: Daftar Calon Jamaah */}
          <div>
            <button
              onClick={() => {
                if (!isVerified) {
                  handleTabClick('daftar_jamaah_biodata');
                } else {
                  setIsCalonJamaahOpen(!isCalonJamaahOpen);
                  if (!['daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran', 'persiapan_keberangkatan', 'dokumen_keberangkatan'].includes(activeTab)) {
                    handleTabClick('daftar_jamaah_biodata');
                  }
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                ['daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran', 'persiapan_keberangkatan', 'dokumen_keberangkatan'].includes(activeTab)
                  ? 'text-white bg-emerald-900 shadow-md border-l-4 border-amber-400'
                  : !isVerified
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                <Users className={`w-5 h-5 shrink-0 ${['daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran', 'persiapan_keberangkatan', 'dokumen_keberangkatan'].includes(activeTab) ? 'text-amber-300' : (!isVerified ? 'text-slate-400' : 'text-emerald-700')}`} />
                {isSidebarOpen && <span className="truncate">Daftar Calon Jamaah</span>}
              </div>
              {isSidebarOpen && (
                <div className="flex items-center gap-1.5">
                  {!isVerified && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <ChevronDown className={`w-4 h-4 ${['daftar_jamaah_biodata', 'daftar_jamaah_dokumen', 'pembayaran', 'persiapan_keberangkatan', 'dokumen_keberangkatan'].includes(activeTab) ? 'text-amber-300' : 'text-slate-400'} transition-transform duration-200 ${isCalonJamaahOpen ? 'rotate-180' : ''}`} />
                </div>
              )}
            </button>

            {/* Sub-items */}
            {isCalonJamaahOpen && isSidebarOpen && (
              <div className="ml-8 mt-1 space-y-1 pl-3 border-l-2 border-emerald-200">
                <button
                  onClick={() => handleTabClick('daftar_jamaah_biodata')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'daftar_jamaah_biodata'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Biodata & Paspor
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'daftar_jamaah_biodata' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('daftar_jamaah_dokumen')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'daftar_jamaah_dokumen'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Unggah Dokumen
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'daftar_jamaah_dokumen' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('pembayaran')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'pembayaran'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Pembayaran
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'pembayaran' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('persiapan_keberangkatan')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'persiapan_keberangkatan'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Persiapan Keberangkatan
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'persiapan_keberangkatan' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('dokumen_keberangkatan')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'dokumen_keberangkatan'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Dokumen Keberangkatan
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'dokumen_keberangkatan' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('kenangan')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'kenangan'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Kenangan Perjalanan
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'kenangan' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
                <button
                  onClick={() => handleTabClick('sertifikat')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'sertifikat'
                      ? 'bg-emerald-800 text-white shadow-md border-l-2 border-amber-300'
                      : !isVerified
                      ? 'text-slate-400 hover:bg-slate-50'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Sertifikat Digital
                    {!isVerified && <Lock className="w-3 h-3 text-slate-400" />}
                  </span>
                  {activeTab === 'sertifikat' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Standalone Section: Kenangan & Sertifikat */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              onClick={() => handleTabClick('kenangan')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'kenangan'
                  ? 'sidebar-item-active'
                  : !isVerified
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                <ImageIcon className={`w-5 h-5 shrink-0 ${activeTab === 'kenangan' ? 'text-amber-300' : (!isVerified ? 'text-slate-400' : 'text-emerald-700')}`} />
                {isSidebarOpen && <span className="truncate">Kenangan</span>}
              </div>
              {isSidebarOpen && !isVerified && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            <button
              onClick={() => handleTabClick('sertifikat')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'sertifikat'
                  ? 'sidebar-item-active'
                  : !isVerified
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                <Award className={`w-5 h-5 shrink-0 ${activeTab === 'sertifikat' ? 'text-amber-300' : (!isVerified ? 'text-slate-400' : 'text-emerald-700')}`} />
                {isSidebarOpen && <span className="truncate">Sertifikat</span>}
              </div>
              {isSidebarOpen && !isVerified && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            <button
              onClick={() => handleTabClick('pengajuan_komisi')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'pengajuan_komisi' 
                  ? 'sidebar-item-active' 
                  : !isVerified
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-4 truncate">
                <Wallet className={`w-5 h-5 shrink-0 ${activeTab === 'pengajuan_komisi' ? 'text-amber-300' : (!isVerified ? 'text-slate-400' : 'text-emerald-700')}`} />
                {isSidebarOpen && <span className="truncate">Pengajuan Komisi</span>}
              </div>
              {isSidebarOpen && !isVerified && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            <button
              onClick={() => handleTabClick('pengaturan_akun')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === 'pengaturan_akun' 
                  ? 'sidebar-item-active' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <Settings className={`w-5 h-5 shrink-0 ${activeTab === 'pengaturan_akun' ? 'text-amber-300' : 'text-emerald-700'}`} />
              {isSidebarOpen && <span className="truncate">Pengaturan Akun</span>}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className={`p-4 rounded-2xl border transition-all duration-500 ${
            mitraStatus === 'active' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' 
              : mitraStatus === 'pending_verification'
              ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
              : mitraStatus === 'rejected'
              ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          } ${!isSidebarOpen && 'hidden'}`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                mitraStatus === 'active' 
                  ? 'bg-emerald-500 animate-ping' 
                  : mitraStatus === 'pending_verification'
                  ? 'bg-amber-500 animate-pulse'
                  : mitraStatus === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}></div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                mitraStatus === 'active' 
                  ? 'text-emerald-800' 
                  : mitraStatus === 'pending_verification'
                  ? 'text-amber-800'
                  : mitraStatus === 'rejected'
                  ? 'text-red-800'
                  : 'text-slate-500'
              }`}>
                STATUS: {
                  mitraStatus === 'active' 
                    ? 'TERVERIFIKASI' 
                    : (mitraStatus === 'pending_verification' 
                      ? 'MENUNGGU' 
                      : (mitraStatus === 'rejected' ? 'DITOLAK' : 'MENUNGGU PROFIL'))
                }
              </span>
            </div>
            <div className="text-sm font-bold truncate">{dbUser?.name || profile?.namaLengkap || 'Agen Perwakilan'}</div>
            <div className="text-[11px] opacity-75 font-medium">ID: {(dbUser?.id || '00000000').substring(0, 8)}</div>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('mitra_token');
              navigate('/mitra/login');
            }}
            className="w-full mt-4 flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Keluar Panel</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Content Area */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold font-playfair text-slate-800">
              {getHeaderTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border ${
              mitraStatus === 'active' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : mitraStatus === 'pending_verification'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : mitraStatus === 'rejected'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                mitraStatus === 'active' 
                  ? 'bg-emerald-500 animate-ping' 
                  : mitraStatus === 'pending_verification'
                  ? 'bg-amber-500 animate-pulse'
                  : mitraStatus === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              }`}></div>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {mitraStatus === 'active' 
                  ? 'MITRA TERVERIFIKASI' 
                  : mitraStatus === 'pending_verification' 
                  ? 'PENINJAUAN AKUN' 
                  : mitraStatus === 'rejected'
                  ? 'PERBAIKAN PROFIL'
                  : 'PROFIL BELUM LENGKAP'}
              </span>
            </div>

            {/* Interactive Notification Bell Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-900 transition-all shadow-xs active:scale-95 flex items-center justify-center"
                title="Notifikasi Kemitraan"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotificationOpen(false)} 
                  />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-playfair font-bold text-sm text-white leading-tight">Notifikasi Kemitraan</h4>
                          <p className="text-[10px] text-emerald-200/80 font-medium">{unreadCount} belum dibaca</p>
                        </div>
                      </div>
                      <button
                        onClick={markAllNotifsAsRead}
                        className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline transition-colors"
                      >
                        Tandai Semua Dibaca
                      </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                      {notificationsList.length > 0 ? (
                        notificationsList.map((notif) => {
                          const isRead = readNotifIds.includes(notif.id);
                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotifAsRead(notif.id);
                                setIsNotificationOpen(false);
                                if (notif.tab) handleTabClick(notif.tab as DashboardTab);
                              }}
                              className={`p-4 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-50 ${
                                !isRead ? 'bg-amber-50/40' : 'bg-white'
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                notif.type === 'success' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : notif.type === 'warning'
                                  ? 'bg-amber-100 text-amber-700'
                                  : notif.type === 'danger'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {notif.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                                 notif.type === 'warning' ? <Clock className="w-4 h-4" /> :
                                 notif.type === 'danger' ? <AlertCircle className="w-4 h-4" /> :
                                 <Info className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{notif.title}</span>
                                  {!isRead && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 leading-snug">{notif.message}</p>
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
                                  <span className="uppercase tracking-wider text-emerald-700">{notif.category}</span>
                                  <span>{notif.timestamp}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-500">Tidak ada notifikasi saat ini</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-xs font-bold text-slate-600 hover:text-emerald-900"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {activeTab === 'dashboard' && (
              <>
                {mitraStatus === 'active' ? (
                  <div className="p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-900/10 border border-emerald-700/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">Akun Kemitraan: RESMI TERVERIFIKASI</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase border border-emerald-400/30">Tahap 03 Selesai</span>
                        </div>
                        <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                          Selamat! Akun Anda telah disetujui oleh Tim Admin. Anda resmi terverifikasi dan siap mengelola jemaah serta menikmati komisi kemitraan.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('verification')}
                      className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-all shadow-md shrink-0 active:scale-95"
                    >
                      Cek Status Verifikasi
                    </button>
                  </div>
                ) : (
                   <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        {mitraStatus === 'pending_verification' ? (
                          <Clock className="w-6 h-6 animate-spin-slow" />
                        ) : (
                          <AlertCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">
                          {mitraStatus === 'pending_verification' ? 'Tahap 02: Peninjauan Admin Berlangsung' : 'Tahap 01: Profil Belum Lengkap'}
                        </h4>
                        <p className="text-xs text-amber-700 font-medium">
                          {mitraStatus === 'pending_verification' 
                            ? 'Data pendaftaran Anda telah berhasil disimpan dan sedang ditinjau oleh Admin.' 
                            : 'Lengkapi biodata dan dokumen untuk mengajukan status verifikasi kemitraan Anda.'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab(mitraStatus === 'pending_verification' ? 'verification' : 'registration')}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 shrink-0"
                    >
                      {mitraStatus === 'pending_verification' ? 'Cek Status Verifikasi' : 'Lengkapi Profil Now'}
                    </button>
                   </div>
                )}

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-playfair font-bold text-slate-900">Ringkasan Performa</h2>
                    <p className="text-slate-500 font-medium">Selamat datang kembali, {dbUser?.name?.split(' ')[0] || 'Partner'}.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                    <span>Update Terakhir: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard 
                    label="Total Jamaah" 
                    value={totalJamaahCount} 
                    icon={Users} 
                    color="blue"
                  />
                  <MetricCard 
                    label="Jamaah Aktif" 
                    value={jamaahAktifCount} 
                    icon={PulseIcon} 
                    color="amber"
                    badge="Proses"
                  />
                  <MetricCard 
                    label="Keberangkatan" 
                    value={keberangkatanCount} 
                    icon={Plane} 
                    color="emerald"
                    badge="Selesai"
                  />
                  <MetricCard 
                    label="Target Tahunan" 
                    value={`${totalJamaahCount} / 50 Pax`} 
                    icon={Target} 
                    color="purple"
                    progress={targetProgress}
                  />
                </div>

                {/* Financial Insights - Total Penjualan Mitra */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Wallet className="w-48 h-48 text-emerald-900" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Penjualan Mitra (Data Riil)</h3>
                          <p className="text-xs font-bold text-emerald-700">Akumulasi Transaksi & Pendaftaran Jemaah Valid</p>
                        </div>
                      </div>
                      <div className="text-4xl sm:text-5xl font-playfair font-bold text-slate-900">
                        Rp {realTotalSales.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="w-full sm:w-auto p-4 rounded-2xl bg-emerald-900 text-white space-y-1.5 shadow-md border border-emerald-800">
                      <div className="text-[10px] font-black text-emerald-200 uppercase tracking-wider">Estimasi Komisi Hak Mitra (5%)</div>
                      <div className="text-xl font-bold font-playfair text-amber-300">
                        Rp {Math.round(realTotalSales * 0.05).toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-emerald-100/80 font-medium">Berdasarkan total volume transaksi valid terdaftar</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions / Activity Feed */}
                <div className="glass-card bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-playfair font-bold text-slate-900">Aktivitas Terakhir</h3>
                      <p className="text-xs text-slate-500 font-medium">Riwayat pendaftaran jamaah dan pembaruan status kemitraan secara riil.</p>
                    </div>
                    <button 
                      onClick={() => handleTabClick('daftar_jamaah_biodata')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                    >
                      Kelola Jamaah <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((act) => {
                        const IconComponent = act.icon || UserCheck;
                        return (
                          <div 
                            key={act.id} 
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 transition-all border border-slate-100 hover:border-slate-200 group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-800 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                              <IconComponent className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate">{act.title}</div>
                              <div className="text-xs text-slate-500 truncate mt-0.5">{act.subtitle}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${act.statusColor}`}>
                                {act.statusLabel}
                              </span>
                              <div className="text-[10px] text-slate-400 font-medium mt-1">{act.timestamp}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700">Belum Ada Aktivitas Pendaftaran</p>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                            Aktivitas pendaftaran calon jamaah baru dan konfirmasi transaksi Anda akan muncul secara otomatis di sini.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('katalog_paket')}
                          className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 transition-all inline-flex items-center gap-1.5 shadow-xs"
                        >
                          Pilih Paket & Daftarkan Jamaah <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'verification' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-playfair font-bold text-slate-900">Status Verifikasi Akun</h2>
                    <p className="text-slate-500 font-medium">Lacak proses peninjauan akun kemitraan Anda secara real-time.</p>
                  </div>
                  <button 
                    onClick={refreshData}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Perbarui Status
                  </button>
                </div>

                {/* Status Timeline */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-100 -translate-y-1/2 hidden md:block">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                        style={{ width: mitraStatus === 'active' ? '100%' : (mitraStatus === 'pending_verification' ? '66%' : ((profile && profile.nik) ? '33%' : '0%')) }}
                      />
                    </div>

                    {[
                      { 
                        step: 1, 
                        label: 'Profil & Legal', 
                        subLabel: (profile && profile.nik) || mitraStatus !== 'incomplete_profile' ? 'Data Terisi' : 'Belum Diisi',
                        status: (profile && profile.nik) || mitraStatus !== 'incomplete_profile' ? 'completed' : 'current',
                        icon: FileText,
                        tabTarget: 'registration' as DashboardTab
                      },
                      { 
                        step: 2, 
                        label: 'Resi Pendaftaran', 
                        subLabel: (profile && profile.buktiTransfer) || mitraStatus !== 'incomplete_profile' ? 'Resi Terunggah' : 'Belum Upload',
                        status: (profile && profile.buktiTransfer) || mitraStatus !== 'incomplete_profile' ? 'completed' : ((profile && profile.nik) ? 'current' : 'pending'),
                        icon: Receipt,
                        tabTarget: 'registration' as DashboardTab
                      },
                      { 
                        step: 3, 
                        label: 'Peninjauan Admin', 
                        subLabel: mitraStatus === 'pending_verification' ? 'Sedang Ditinjau' : (mitraStatus === 'active' ? 'Disetujui' : 'Menunggu Resi'),
                        status: mitraStatus === 'pending_verification' ? 'current' : (mitraStatus === 'active' ? 'completed' : 'pending'),
                        icon: Clock,
                        tabTarget: 'verification' as DashboardTab
                      },
                      { 
                        step: 4, 
                        label: mitraStatus === 'rejected' ? 'Ditolak' : 'Verifikasi Selesai', 
                        subLabel: mitraStatus === 'active' ? 'Akun Aktif' : (mitraStatus === 'rejected' ? 'Perlu Perbaikan' : 'Menunggu Review'),
                        status: (mitraStatus === 'active' || mitraStatus === 'rejected') ? 'completed' : 'pending',
                        icon: mitraStatus === 'rejected' ? XCircle : CheckCircle2,
                        isError: mitraStatus === 'rejected',
                        tabTarget: (mitraStatus === 'active' ? 'dashboard' : 'verification') as DashboardTab
                      }
                    ].map((step, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveTab(step.tabTarget)}
                        className="relative z-10 flex flex-col items-center gap-4 bg-white px-6 group/step cursor-pointer hover:scale-105 transition-all duration-300 focus:outline-none"
                      >
                        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center border-2 transition-all duration-500 ${
                          step.status === 'completed' 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-200 rotate-3 group-hover/step:rotate-0' 
                            : step.status === 'current'
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-200 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-300 group-hover/step:border-slate-400 group-hover/step:text-slate-500'
                        } ${step.isError && step.status === 'completed' ? 'bg-red-500 border-red-500 shadow-red-200' : ''}`}>
                          <step.icon className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${step.status === 'pending' ? 'text-slate-300' : 'text-slate-900'}`}>TAHAP 0{step.step}</div>
                          <div className={`text-sm font-black ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>{step.label}</div>
                          <div className={`text-[10px] font-bold mt-1 px-2.5 py-0.5 rounded-full inline-block ${
                            step.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : step.status === 'current'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {step.subLabel}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Decorative background shape */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Status Detail Card */}
                  <div className="lg:col-span-8 space-y-8">
                    {mitraStatus === 'pending_verification' && (
                      <div className="p-10 bg-amber-50 border border-amber-200 rounded-[2.5rem] space-y-6 shadow-xl shadow-amber-900/5">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                            <Clock className="w-8 h-8 animate-spin-slow" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-playfair font-black text-amber-900">Menunggu Verifikasi</h3>
                            <p className="text-amber-700 font-medium">Tim legal kami sedang memproses data yang Anda kirimkan.</p>
                          </div>
                        </div>
                        <div className="bg-white/50 p-6 rounded-3xl border border-amber-200/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Estimasi Selesai</span>
                            <span className="text-xs font-black text-amber-900">24 Jam Kerja</span>
                          </div>
                          <div className="h-2.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 animate-pulse w-[65%]"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mitraStatus === 'rejected' && (
                      <div className="p-10 bg-red-50 border border-red-200 rounded-[2.5rem] space-y-6 shadow-xl shadow-red-900/5">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-playfair font-black text-red-900">Perbaikan Diperlukan</h3>
                            <p className="text-red-700 font-medium">Mohon maaf, pendaftaran Anda ditangguhkan sementara.</p>
                          </div>
                        </div>
                        <div className="p-8 bg-white rounded-3xl border border-red-100 shadow-inner">
                          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Catatan Admin:
                          </div>
                          <p className="text-sm text-red-900 font-bold leading-relaxed italic">"{profile?.reviewNotes || 'Dokumen kurang jelas atau data tidak sesuai dengan kartu identitas.'}"</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('registration')}
                          className="w-full py-5 rounded-[1.5rem] bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0"
                        >
                          <RefreshCcw className="w-5 h-5" />
                          Perbarui Data Sekarang
                        </button>
                      </div>
                    )}

                    {mitraStatus === 'active' && (
                      <div className="p-8 sm:p-10 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-[2.5rem] space-y-8 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                              <ShieldCheck className="w-9 h-9" />
                            </div>
                            <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-400/30 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                TAHAP 03: VERIFIKASI SELESAI
                              </div>
                              <h3 className="text-2xl sm:text-3xl font-playfair font-black text-white">🎉 Akun Anda Telah Terverifikasi!</h3>
                              <p className="text-emerald-100/90 font-medium text-sm mt-1">
                                Selamat! Data pendaftaran dan dokumen identitas Anda telah disetujui oleh Tim Admin. Status kemitraan Anda secara resmi telah AKTIF.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
                            <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">KODE PERWAKILAN</div>
                            <div className="text-lg font-black text-white">MIT-{(dbUser?.id || '00000000').substring(0, 8).toUpperCase()}</div>
                          </div>
                          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
                            <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">STATUS LISENSI</div>
                            <div className="text-lg font-black text-white flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> RESMI & AKTIF
                            </div>
                          </div>
                          <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
                            <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">TANGGAL VERIFIKASI</div>
                            <div className="text-lg font-black text-white">{new Date(profile?.updatedAt || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-2">
                          <button 
                            onClick={() => setActiveTab('dashboard')}
                            className="flex-1 py-4 px-6 rounded-2xl bg-white text-emerald-950 font-black text-sm hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-98"
                          >
                            <LayoutDashboard className="w-5 h-5 text-emerald-800" />
                            Masuk Ke Dashboard Utama
                          </button>
                          <button 
                            onClick={() => setActiveTab('registration')}
                            className="py-4 px-6 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-sm border border-emerald-400/30 transition-all flex items-center justify-center gap-3"
                          >
                            <FileText className="w-5 h-5" />
                            Lihat Biodata Pendaftaran
                          </button>
                        </div>
                      </div>
                    )}

                    {mitraStatus === 'incomplete_profile' && (
                      <div className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <UserPlus className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-playfair font-black text-slate-900">Profil Belum Lengkap</h3>
                            <p className="text-slate-500 font-medium">Mohon lengkapi profil Anda untuk memulai proses verifikasi.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('registration')}
                          className="w-full py-5 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                        >
                          <FileText className="w-5 h-5" />
                          Lengkapi Profil Sekarang
                        </button>
                      </div>
                    )}

                    {/* Summary of Submitted Data */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-playfair font-bold text-slate-900 flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-xl">
                            <FileText className="w-5 h-5 text-emerald-600" />
                          </div>
                          Ringkasan Data Terkirim
                        </h3>
                        {profile && (profile.nik || profile.namaLengkap) && (
                          <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            Data Saved
                          </div>
                        )}
                      </div>

                      {profile && (profile.nik || profile.namaLengkap) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                          <div className="space-y-1 group">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Nama Lengkap (Sesuai KTP)</div>
                            <div className="text-base font-bold text-slate-900 border-b border-slate-50 pb-2">{profile.namaLengkap || dbUser?.name || '-'}</div>
                          </div>
                          <div className="space-y-1 group">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">NIK / Nomor Identitas</div>
                            <div className="text-base font-bold text-slate-900 border-b border-slate-50 pb-2 tracking-widest">{profile.nik || '-'}</div>
                          </div>
                          <div className="space-y-1 group">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Nomor WhatsApp</div>
                            <div className="text-base font-bold text-slate-900 border-b border-slate-50 pb-2">{profile.whatsapp || dbUser?.noWa || dbUser?.phone || '-'}</div>
                          </div>
                          <div className="space-y-1 group">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Domisili</div>
                            <div className="text-base font-bold text-slate-900 border-b border-slate-50 pb-2">
                              {profile.kota ? `${profile.kota}, ${profile.provinsi}` : (profile.alamatLengkap || '-')}
                            </div>
                          </div>
                          <div className="space-y-1 group sm:col-span-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Informasi Rekening Bank</div>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              {profile.namaBank && <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black italic">{profile.namaBank}</div>}
                              <div className="text-base font-bold text-slate-900 tracking-widest">{profile.noRekening || '-'}</div>
                              <div className="text-xs font-medium text-slate-400 ml-2">a.n {profile.namaPemilikRekening || profile.namaLengkap || '-'}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-6 border-2 border-dashed border-slate-100 rounded-3xl">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                            <FileText className="w-10 h-10" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-lg font-playfair font-black text-slate-600">Ringkasan Masih Kosong</p>
                            <p className="text-sm font-medium text-slate-400">Data Anda akan muncul di sini setelah formulir pendaftaran dikirimkan.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden shadow-2xl shadow-slate-900/20">
                      <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Phone className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-playfair font-bold">Layanan Bantuan</h4>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">Tim kami tersedia Senin - Jumat (09:00 - 17:00) untuk membantu proses verifikasi Anda.</p>
                        </div>
                        <a 
                          href="https://wa.me/6282283201103" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                        >
                          WhatsApp Support
                        </a>
                      </div>
                      {/* Decorative pattern */}
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    </div>

                    <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-6">
                      <h4 className="font-playfair font-black text-slate-900 text-lg">Keuntungan Mitra</h4>
                      <div className="space-y-4">
                        {[
                          { title: 'Komisi Menarik', desc: 'Dapatkan bagi hasil kompetitif setiap jamaah.' },
                          { title: 'Dashboard Real-time', desc: 'Pantau jamaah & komisi secara transparan.' },
                          { title: 'Materi Pemasaran', desc: 'Akses brosur & konten digital eksklusif.' }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <div>
                              <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-0.5">{item.title}</div>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'registration' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-3xl font-playfair font-bold text-slate-900">Pendaftaran & KYC</h2>
                  <p className="text-slate-500 font-medium">Lengkapi biodata dan dokumen pendukung untuk verifikasi akun perwakilan resmi.</p>
                </div>

                {mitraStatus === 'pending_verification' ? (
                  <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center space-y-8 shadow-xl">
                    <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500 relative">
                      <Clock className="w-12 h-12 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-playfair font-black text-slate-900">Verifikasi Sedang Diproses</h3>
                      <p className="text-slate-500 font-medium max-w-md mx-auto">Data Anda telah kami terima dan sedang dalam antrean verifikasi oleh tim admin.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl text-sm text-slate-600">
                      Anda akan menerima notifikasi status akun Anda dalam 1x24 jam kerja.
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-xl">
                     {mitraStatus === 'rejected' && (
                        <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                            <XCircle className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-black text-red-900 text-sm uppercase tracking-wider">Revisi Diperlukan</h3>
                            <p className="text-red-700 text-xs font-medium">Data pendaftaran Anda ditangguhkan karena alasan berikut:</p>
                            {profile?.reviewNotes && (
                              <div className="mt-2 p-3 bg-white/50 rounded-xl border border-red-200 text-xs font-bold text-red-900 italic">
                                " {profile.reviewNotes} "
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    <MitraOnboardingForm onComplete={handleFormSubmitted} />
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'katalog_paket' || activeTab === 'pilih_paket') && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-2">
                      <Tag className="w-3 h-3 text-emerald-600" /> TERKONEKSI ADMIN PORTAL
                    </div>
                    <h2 className="text-3xl font-playfair font-bold text-slate-900">Katalog Paket Ibadah</h2>
                    <p className="text-slate-500 font-medium">Pilih & pelajari paket perjalanan Umroh & Haji terkini yang telah dikurasi khusus untuk dibagikan kepada calon jemaah.</p>
                  </div>
                  <button 
                    onClick={fetchPackagesAndSchedules}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingPackages ? 'animate-spin' : ''}`} />
                    Perbarui Data
                  </button>
                </div>

                {/* Sub-header Filter & Search */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Category Switcher Matching Portal Jemaah */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
                    <button
                      onClick={() => setPackageCategory('umroh')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        packageCategory === 'umroh'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <img src="https://cdn-icons-png.flaticon.com/512/5903/5903673.png" className="w-4 h-4 opacity-80" alt="Umroh" />
                      Umroh
                    </button>
                    <button
                      onClick={() => setPackageCategory('haji')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        packageCategory === 'haji'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <img src="https://cdn-icons-png.flaticon.com/512/2822/2822709.png" className="w-4 h-4 opacity-80" alt="Haji" />
                      Haji
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari paket atau fasilitas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Packages List Grid */}
                {loadingPackages ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 h-96 animate-pulse space-y-4">
                        <div className="h-48 bg-slate-200 rounded-2xl"></div>
                        <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const parseDesc = (desc: any): string[] => {
                      if (!desc) return [];
                      if (Array.isArray(desc)) return desc.map(s => String(s).trim()).filter(Boolean);
                      if (typeof desc === 'string') {
                        try {
                          const parsed = JSON.parse(desc);
                          if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
                        } catch (e) {
                          // Not JSON
                        }
                        return desc.split('\n').map(s => s.trim()).filter(Boolean);
                      }
                      return [];
                    };

                    const filteredPkgs = packages.filter((pkg) => {
                      const matchesCategory = (pkg.type || 'umroh').toLowerCase() === packageCategory;
                      const matchesSearch = !searchQuery || 
                        pkg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    if (filteredPkgs.length === 0) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center space-y-4 shadow-sm">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                            <Tag className="w-8 h-8 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-playfair font-bold text-slate-800">Belum Ada Paket Untuk Kategori {packageCategory === 'umroh' ? 'Umroh' : 'Haji'}</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                            Paket perjalanan yang ditambahkan melalui Portal Admin akan muncul di katalog ini secara otomatis.
                          </p>
                          <button
                            onClick={fetchPackagesAndSchedules}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-md"
                          >
                            <RefreshCw className="w-4 h-4" /> Refresh Data Admin
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPkgs.map((pkg) => {
                          const descLines = parseDesc(pkg.description);
                          const displayImg = pkg.imageUrl || pkg.image || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80";

                          return (
                            <div 
                              key={pkg.id || pkg.name}
                              className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-500 flex flex-col group animate-in slide-in-from-bottom-6"
                            >
                              {/* Image Banner Header */}
                              <div className="h-52 w-full relative overflow-hidden bg-slate-900">
                                <img 
                                  src={displayImg} 
                                  alt={pkg.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                                
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                  <span className="px-3.5 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md border border-white">
                                    {pkg.duration || '9 Hari'}
                                  </span>
                                  {pkg.starRating && (
                                    <span className="px-3 py-1.5 bg-emerald-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md border border-amber-400/20 flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {pkg.starRating} Bintang
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-4 left-5 right-5">
                                  <h3 className="text-xl font-playfair font-bold text-white leading-tight mb-1 group-hover:translate-x-1 transition-transform duration-300">
                                    {pkg.name}
                                  </h3>
                                  <div className="flex items-center text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                    <Star className="w-3 h-3 mr-1.5 fill-current" /> Premium Service
                                  </div>
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-6 flex flex-col flex-1">
                                {/* Feature / Bullet Points */}
                                <div className="space-y-3 mb-6 flex-1">
                                  {descLines.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">Layanan paket perjalanan lengkap dengan akomodasi terbaik.</p>
                                  ) : (
                                    descLines.slice(0, 5).map((line, i) => (
                                      <div key={i} className="flex items-start group-hover:translate-x-1 transition-transform duration-300">
                                        <div className="w-4 h-4 rounded-md bg-emerald-50 flex items-center justify-center mr-2.5 shrink-0 mt-0.5 border border-emerald-100 shadow-sm">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">{line}</p>
                                      </div>
                                    ))
                                  )}

                                  {/* Hotel Highlights if present */}
                                  {(pkg.makkahHotel || pkg.madinahHotel) && (
                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700">
                                      {pkg.makkahHotel && (
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                          Makkah: {pkg.makkahHotel}
                                        </span>
                                      )}
                                      {pkg.madinahHotel && (
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/60 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          Madinah: {pkg.madinahHotel}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Price & Seat Box */}
                                <div className="mt-auto">
                                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5 group-hover:bg-slate-100/80 transition-colors">
                                    <div>
                                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Investasi Ibadah</p>
                                      <p className="text-xl font-black text-slate-900 tracking-tight">
                                        Rp {Number(pkg.price || 0).toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Sisa Seat</p>
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                        <span className="text-xs font-black text-slate-800">
                                          {pkg.availableSeats ?? pkg.seats ?? pkg.remainingSeats ?? pkg.quota ?? 30} Seat
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons for Partner */}
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => handleOpenSelectPackageModal(pkg)}
                                      className="w-full py-3.5 rounded-2xl bg-emerald-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/10 active:scale-[0.98]"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                      Pilih Paket Ini
                                    </button>

                                     <div className="flex gap-2">
                                       {pkg.itineraryPdf && (
                                         <button
                                           onClick={() => setPreviewPdf({ url: pkg.itineraryPdf, title: pkg.name })}
                                           className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200/80"
                                           title="Lihat PDF Itinerary"
                                         >
                                           <FileText className="w-3.5 h-3.5 text-emerald-600" /> Lihat PDF Itinerary
                                         </button>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {activeTab === 'informasi_jadwal' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-2">
                      <Calendar className="w-3 h-3 text-emerald-600" /> SINKRONISASI REAL-TIME
                    </div>
                    <h2 className="text-3xl font-playfair font-bold text-slate-900">Informasi Jadwal Keberangkatan</h2>
                    <p className="text-slate-500 font-medium">Jadwal resmi keberangkatan rombongan Umroh & Haji terintegrasi secara langsung dengan sistem Admin.</p>
                  </div>
                  <button 
                    onClick={fetchPackagesAndSchedules}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingPackages ? 'animate-spin' : ''}`} />
                    Perbarui Jadwal
                  </button>
                </div>

                {/* Schedule Table / Cards */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-playfair font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-emerald-600" />
                      Daftar Keberangkatan Terdekat
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Total: {schedules.length} Jadwal Terdaftar</span>
                  </div>

                  {loadingPackages ? (
                    <div className="py-12 text-center text-slate-400 animate-pulse">Memuat jadwal keberangkatan...</div>
                  ) : schedules.length === 0 ? (
                    <div className="py-16 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                        <CalendarDays className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-playfair font-bold text-slate-700 text-base">Belum Ada Jadwal Keberangkatan Baru</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Jadwal yang diinputkan oleh Admin di Portal Admin akan otomatis disinkronkan ke halaman ini.
                        </p>
                      </div>
                      <button
                        onClick={fetchPackagesAndSchedules}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all inline-flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh Jadwal
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="pb-4 px-4">Paket Perjalanan</th>
                            <th className="pb-4 px-4">Tanggal Keberangkatan</th>
                            <th className="pb-4 px-4">Sisa Kuota / Total</th>
                            <th className="pb-4 px-4">Itinerary</th>
                            <th className="pb-4 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                          {schedules.map((sch, i) => {
                            const linkedPkg = packages.find((p: any) => p.id === sch.packageId);
                            const pkgName = sch.package?.name || linkedPkg?.name || sch.name || sch.packageName || sch.title || 'Paket Perjalanan';
                            const rawType = sch.package?.type || linkedPkg?.type || sch.type || sch.category || 'umroh';
                            const pkgType = String(rawType).toUpperCase();
                            const pdfUrl = sch.itineraryPdfUrl || sch.itineraryPdf || sch.package?.manasikPdfUrl || linkedPkg?.manasikPdfUrl;
                            const airline = sch.airline || sch.package?.airline;

                            return (
                              <tr key={sch.id || i} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="py-4 px-4">
                                  <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-900 transition-colors">
                                    {pkgName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                      pkgType.includes('HAJI') 
                                        ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    }`}>
                                      {pkgType}
                                    </span>
                                    {airline && (
                                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                        <Plane className="w-3 h-3 text-emerald-600" /> {airline}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                                    {sch.departureDate ? new Date(sch.departureDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Segera Ditentukan'}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                                    {sch.availableSeats ?? sch.seats ?? 30} / {sch.totalSeats ?? sch.quota ?? 45} Seat
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  {pdfUrl ? (
                                    <button
                                      onClick={() => setPreviewPdf({ url: pdfUrl, title: `Itinerary - ${pkgName}` })}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 transition-all shadow-sm active:scale-95"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                      Lihat PDF Itinerary
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedScheduleDetail({ ...sch, pkgName, pkgType, pdfUrl, linkedPkg })}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-all active:scale-95"
                                    >
                                      <Info className="w-3.5 h-3.5 text-slate-500" />
                                      Detail Program
                                    </button>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <button
                                    onClick={() => setSelectedScheduleDetail({ ...sch, pkgName, pkgType, pdfUrl, linkedPkg })}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-900 text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                                  >
                                    <Info className="w-3.5 h-3.5 text-amber-400" />
                                    Rincian Jadwal
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DAFTAR CALON JAMAAH - BIODATA & PASPOR */}
            {activeTab === 'daftar_jamaah_biodata' && (
              <MitraJamaahBiodata jamaahList={jamaahList} onRefresh={() => refreshData(true)} />
            )}

            {/* TAB: DAFTAR CALON JAMAAH - UNGGAH DOKUMEN */}
            {activeTab === 'daftar_jamaah_dokumen' && (
              <MitraJamaahDokumen jamaahList={jamaahList} onRefresh={() => refreshData(true)} />
            )}

            {/* TAB: PEMBAYARAN */}
            {activeTab === 'pembayaran' && (
              <MitraPembayaran jamaahList={jamaahList} onRefresh={() => refreshData(true)} />
            )}

            {/* TAB: PERSIAPAN KEBERANGKATAN */}
            {activeTab === 'persiapan_keberangkatan' && (
              <MitraPersiapanKeberangkatan jamaahList={jamaahList} onRefresh={() => refreshData(true)} />
            )}

            {/* TAB: DOKUMEN KEBERANGKATAN */}
            {activeTab === 'dokumen_keberangkatan' && (
              <MitraDokumenKeberangkatan jamaahList={jamaahList} onRefresh={() => refreshData(true)} />
            )}

            {/* TAB: KENANGAN */}
            {activeTab === 'kenangan' && (
              <MitraKenangan jamaahList={jamaahList} />
            )}

            {/* TAB: SERTIFIKAT */}
            {activeTab === 'sertifikat' && (
              <MitraSertifikat jamaahList={jamaahList} />
            )}

            {/* TAB: PENGAJUAN KOMISI */}
            {activeTab === 'pengajuan_komisi' && (
              <MitraPengajuanKomisi />
            )}

            {/* TAB: INFORMASI KOMISI MITRA */}
            {activeTab === 'info_komisi' && (
              <MitraInfoKomisi />
            )}

            {/* TAB: PENGATURAN AKUN MITRA */}
            {activeTab === 'pengaturan_akun' && (
              <MitraPengaturanAkun 
                profile={profile} 
                dbUser={dbUser} 
                mitraStatus={mitraStatus} 
                refreshData={refreshData} 
              />
            )}

          </div>
        </div>
      </main>

      {/* Package & Pax Count Selection Modal */}
      {selectedPackageForBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative shrink-0">
              <button
                onClick={() => setSelectedPackageForBooking(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" /> Tahap 1: Pilih Paket & Pax
              </div>
              <h3 className="text-xl font-playfair font-bold text-white">Konfirmasi Pendaftaran Jamaah</h3>
              <p className="text-xs text-emerald-100/80 mt-1">
                Pilih jumlah calon jemaah yang akan diberangkatkan pada paket ini.
              </p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
              {/* Selected Package Details Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
                  <Luggage className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Paket Ibadah Terpilih</div>
                  <h4 className="text-base font-bold text-slate-900 truncate">{selectedPackageForBooking.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                    <span>Durasi: <strong>{selectedPackageForBooking.duration || '9 Hari'}</strong></span>
                    <span>•</span>
                    <span>Investasi: <strong className="text-emerald-800">Rp {Number(selectedPackageForBooking.price || 0).toLocaleString('id-ID')} / pax</strong></span>
                  </div>
                </div>
              </div>

              {/* Information Summary */}
              <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-3xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">Informasi Pendaftaran</h4>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      Pendaftaran akan diproses untuk <strong>1 orang jamaah</strong>. 
                      Mitra dapat menginput data jamaah lainnya secara bertahap setelah pendaftaran ini selesai.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/60 border border-amber-100 rounded-2xl">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight mb-1">Jumlah Jamaah</p>
                    <p className="text-sm font-black text-slate-900">1 Orang</p>
                  </div>
                  <div className="p-3 bg-white/60 border border-amber-100 rounded-2xl">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight mb-1">Tipe Registrasi</p>
                    <p className="text-sm font-black text-slate-900">Perorangan</p>
                  </div>
                </div>
              </div>

              {/* Estimated Total Calculation */}
              <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Perkiraan Biaya (1 Pax)</p>
                  <p className="text-sm font-black text-emerald-950">
                    Rp {Number(selectedPackageForBooking.price || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Modal Actions - Sticky Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center gap-3 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedPackageForBooking(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPackageSelection}
                className="flex-2 py-3 px-5 rounded-2xl bg-emerald-900 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                Lanjutkan Pengisian Biodata
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Detail & Itinerary Modal */}
      {selectedScheduleDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-emerald-700/60 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-1">
                    {selectedScheduleDetail.pkgType || 'PAKET PERJALANAN'}
                  </div>
                  <h3 className="font-playfair font-bold text-white text-lg leading-tight">
                    {selectedScheduleDetail.pkgName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedScheduleDetail(null)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700">
              {/* Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Keberangkatan</p>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {selectedScheduleDetail.departureDate 
                      ? new Date(selectedScheduleDetail.departureDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Segera Ditentukan'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Maskapai Flight</p>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Plane className="w-4 h-4 text-emerald-600" />
                    {selectedScheduleDetail.airline || selectedScheduleDetail.package?.airline || 'Saudia / Garuda Indonesia'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sisa Kuota Kursi</p>
                  <p className="font-bold text-emerald-700 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    {selectedScheduleDetail.availableSeats ?? selectedScheduleDetail.seats ?? 30} Seat Tersedia (Total {selectedScheduleDetail.totalSeats ?? 45})
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Durasi Perjalanan</p>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {selectedScheduleDetail.package?.duration || selectedScheduleDetail.linkedPkg?.duration || '9 - 12 Hari'}
                  </p>
                </div>
              </div>

              {/* Muthawwif & Price */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Investasi Ibadah / Pax</p>
                  <p className="text-xl font-black text-amber-950">
                    Rp {Number(selectedScheduleDetail.package?.price || selectedScheduleDetail.linkedPkg?.price || selectedScheduleDetail.price || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                {(selectedScheduleDetail.muthawwifName || selectedScheduleDetail.package?.muthawwifName) && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Muthawwif / Pembimbing</p>
                    <p className="text-xs font-bold text-amber-900">
                      {selectedScheduleDetail.muthawwifName || selectedScheduleDetail.package?.muthawwifName}
                    </p>
                  </div>
                )}
              </div>

              {/* Rincian Itinerary / Program */}
              <div className="space-y-2">
                <h4 className="font-playfair font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Rincian Program & Itinerary
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedScheduleDetail.package?.description || selectedScheduleDetail.linkedPkg?.description || selectedScheduleDetail.description || 'Program perjalanan ibadah resmi terintegrasi dengan akomodasi hotel bintang 4/5 dekat Masjidil Haram/Nabawi, konsumsi makanan Indonesia 3x sehari, bimbingan manasik komprehensif, dan pendampingan Muthawwif berpengalaman.'}
                </div>
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedScheduleDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-all"
              >
                Tutup
              </button>
              
              <div className="flex items-center gap-2">
                {selectedScheduleDetail.pdfUrl && (
                  <button
                    onClick={() => {
                      const url = selectedScheduleDetail.pdfUrl;
                      const title = `Itinerary - ${selectedScheduleDetail.pkgName}`;
                      setSelectedScheduleDetail(null);
                      setPreviewPdf({ url, title });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200 transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" /> Buka PDF Itinerary
                  </button>
                )}
                <button
                  onClick={() => {
                    const pkgToBook = selectedScheduleDetail.package || selectedScheduleDetail.linkedPkg;
                    setSelectedScheduleDetail(null);
                    if (pkgToBook) {
                      handleOpenSelectPackageModal(pkgToBook);
                    } else {
                      setActiveTab('katalog_paket');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  Pilih Paket Ini <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal Preview */}
      {previewPdf && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-slate-900 text-base">{previewPdf.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Dokumen Itinerary Resmi Paket</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdf.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh PDF
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-2 sm:p-4">
              <iframe
                src={previewPdf.url}
                title="Itinerary Preview"
                className="w-full h-full rounded-2xl border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
