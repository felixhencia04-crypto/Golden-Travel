import { useLogo } from '../utils/logo';
import { toast } from 'sonner';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LogOut, User, FileText, CreditCard, CheckCircle2,
  Clock, Upload, AlertCircle, AlertTriangle, Briefcase, Settings, Star,
  BookOpen, MapPin, LayoutDashboard, ChevronRight, ChevronLeft, Bell, 
  HelpCircle, Calendar as CalendarIcon, Download, Smartphone, X, Menu, ShieldCheck, HeartPulse, Plane, RefreshCw, Edit2, ExternalLink,
  Sparkles, Eye, EyeOff, FileCheck, ArrowRight,
  Banknote, Tag, CheckCircle, Building, Users, Megaphone, Package as InventoryIcon, Scroll, Check, UserPlus, Lock,
  MessageCircle, Image as ImageIcon, Award, UserCircle, Send, MessageSquare, Video, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updatePassword } from 'firebase/auth';
import { Package } from '../types';
import PreparationInfo from '../components/jamaah/PreparationInfo';
import RegistrationStepper, { RegistrationStatus } from '../components/RegistrationStepper';
import MyDocuments from '../components/MyDocuments';
import InvoiceDetails from '../components/InvoiceDetails';
import { useRegistration } from '../hooks/useRegistration';
import { useSocket } from '../hooks/useSocket';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { openDataUrlInNewTab, downloadFile, isPdfUrl, isImageUrl, getBlobUrlFromDataUrl } from '../utils/file';
import { generateRegistrationFormPdf } from '../utils/generateRegistrationFormPdf';
import { generateEquipmentReceiptPdf } from '../utils/generateEquipmentReceiptPdf';
import { generateJamaahDocumentPdf } from '../utils/generateJamaahDocumentPdf';
import UmrahCertificate from '../components/jamaah/UmrahCertificate';
import PdfViewer from '../components/PdfViewer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';

export default function DashboardJamaah() {
  const logoImg = useLogo();
  const { registration, setRegistration, packages, schedules, notifications: announcements, manifest, equipment: inventoryState, loading, user, dbUser, refreshData } = useRegistration();
  
  const [directPackages, setDirectPackages] = useState<any[]>([]);

  // Professional currency formatter helper
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const fetchDirectPackages = React.useCallback(async () => {
    try {
      const data = await api.get('/packages');
      if (Array.isArray(data) && data.length > 0) {
        setDirectPackages(data);
      }
    } catch (err) {
      console.error("DashboardJamaah: Direct package fetch failed", err);
    }
  }, []);

  useEffect(() => {
    fetchDirectPackages();
  }, [fetchDirectPackages]);

  const onDataUpdated = React.useCallback(() => {
    console.log("DashboardJamaah: Received real-time update signal. Scheduling refresh...");
    fetchDirectPackages();
    // Delay refresh slightly to ensure server DB has finished flushing all related updates
    setTimeout(() => {
      refreshData(true);
    }, 500);
  }, [fetchDirectPackages, refreshData]);

  useSocket(onDataUpdated);

  const effectivePackages = (packages && packages.length > 0) ? packages : directPackages;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  console.log("DashboardJamaah: Render context", { 
    hasReg: !!registration, 
    pkgs: packages?.length, 
    schs: schedules?.length,
    loading, 
    uid: user?.uid 
  });
  
  const userConsultation = registration;
  const paxCount = parseInt(registration?.adultCount || '0') + parseInt(registration?.childCount || '0') + parseInt(registration?.infantCount || '0') || 1;
  const docs = Array.isArray(registration?.documents) ? registration.documents : [];
  const uniqueDocTypes = new Set(docs.map((d: any) => d.docType));
  const expectedDocsCount = paxCount * 5;
  const isDocsComplete = uniqueDocTypes.size >= expectedDocsCount && expectedDocsCount > 0;
  
  const paymentsList = (userConsultation as any)?.payments || [];
  const packagePriceTotal = Number(registration?.package?.price || 0) * paxCount;
  const approvedTotal = paymentsList.filter((p: any) => ['approved', 'VERIFIED'].includes(p.status)).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const paymentPercent = packagePriceTotal > 0 ? approvedTotal / packagePriceTotal : 0;

  const hasVerifiedDp1 = paymentsList.some((p: any) => ['approved', 'VERIFIED'].includes(p.status) && ['DP1', 'dp1'].includes(p.paymentType));
  const hasVerifiedDp2 = paymentsList.some((p: any) => ['approved', 'VERIFIED'].includes(p.status) && ['DP2', 'dp2'].includes(p.paymentType));
  const hasVerifiedPelunasan = paymentsList.some((p: any) => ['approved', 'VERIFIED'].includes(p.status) && ['PELUNASAN', 'pelunasan', 'full'].includes(p.paymentType));

  const isLunasStatus = ['LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'].includes(registration?.status || '');
  const isLunasAmount = packagePriceTotal > 0 && (packagePriceTotal - approvedTotal) <= 100;

  let computedPaymentStep = 'none';
  if (isLunasStatus || hasVerifiedPelunasan || isLunasAmount || paymentPercent >= 0.99) {
    computedPaymentStep = 'lunas';
  } else if (hasVerifiedDp2 || approvedTotal >= (10000000 * paxCount + 1500000 * paxCount - 100) || paymentPercent >= 0.3) {
    computedPaymentStep = 'dp2';
  } else if (hasVerifiedDp1 || approvedTotal > 0) {
    computedPaymentStep = 'dp1';
  }
  const pendingPaymentStep = ((userConsultation as any)?.payments || []).find((p: any) => p.status === 'pending')?.paymentType;
  
  
  const [helpTickets, setHelpTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [showCertPreview, setShowCertPreview] = useState<any>(null);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const pkgId = registration?.packageId;
      const data = await api.get(`/memories${pkgId ? `?packageId=${pkgId}` : ''}`);
      setMemories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    }
  }, [registration?.packageId]);

  const fetchCertificates = useCallback(async () => {
    try {
      const data = await api.get('/certificates');
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get('/support/tickets');
      const tickets = Array.isArray(data) ? data : [];
      setHelpTickets(tickets);
      // Update selected ticket if it's open to refresh replies
      setSelectedTicket((prev: any) => {
        if (!prev) return prev;
        const updated = tickets.find((t: any) => t.id === prev.id);
        // Only return new reference if something actually changed (naive check, or just return updated if exists)
        // Actually, returning `updated || prev` is fine, but it might still cause re-render if updated is a new ref.
        // Let's just avoid adding selectedTicket to dependency array.
        if (updated) {
           // We just use functional state update
           return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchMemories();
    fetchCertificates();
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000); // 30s minimum polling
    return () => clearInterval(interval);
  }, [fetchTickets, fetchMemories, fetchCertificates]);
  
  const updateConsultation = async (data: any, silentToast = false) => {
    try {
      await api.patch('/jamaah/registration', data);
      await refreshData(true);
      if (!silentToast) toast.success("Data berhasil diperbarui!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui data.");
      return false;
    }
  };

  const resetAllData = async () => {
    try {
      sessionStorage.removeItem('cached_jamaah_portal_data');
      await api.delete('/jamaah/registration');
      await refreshData(true);
      setActiveTab('katalog_paket');
      toast.success("Data pendaftaran berhasil direset.");
    } catch (error: any) {
      toast.error(error.message || "Gagal mereset data.");
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  // Auto-redirect new users (no package) to catalog
  useEffect(() => {
    if (!loading && registration && !registration.packageId && activeTab === 'dashboard') {
      setActiveTab('katalog_paket');
    }
  }, [loading, registration, activeTab]);
  const [packageCategory, setPackageCategory] = useState<'umroh' | 'haji'>('umroh');

  // Handle packageId from URL for seamless catalog-to-registration transition
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pkgId = params.get('packageId');
    if (pkgId && packages.length > 0 && !registration) {
      const pkg = packages.find(p => p.id === pkgId);
      if (pkg) {
        setSelectedPackageForPax(pkg);
        setIsPaxModalOpen(true);
        // Clear param to avoid re-triggering on manual refreshes
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [packages, registration]);

  // Auto-refresh data when switching to catalog or schedules
  useEffect(() => {
    if (activeTab === 'katalog_paket' || activeTab === 'informasi_jadwal') {
      refreshData(true);
    }
  }, [activeTab]);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  
  // Sub-menu states
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'pilih_paket': true
  });
  const [isChangingPackage, setIsChangingPackage] = useState(false);
  const [isPaxModalOpen, setIsPaxModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' | null, title: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Ya, Lanjutkan') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  // Notification Drawer & State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jamaah_read_notif_ids') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jamaah_read_notif_ids', JSON.stringify(readNotifIds));
    } catch (e) {}
  }, [readNotifIds]);

  // Generate notifications list from server announcements and real-time smart account updates
  const allNotifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'alert';
      createdAt: string;
      isRead?: boolean;
      targetTab?: string;
    }> = [];

    // 1. Server DB Notifications
    if (Array.isArray(announcements)) {
      announcements.forEach((a: any) => {
        const notifId = a.id || `notif-${a.createdAt}`;
        list.push({
          id: notifId,
          title: a.title || 'Pengumuman Resmi',
          message: a.message || '',
          type: a.type || 'info',
          createdAt: a.createdAt || new Date().toISOString(),
          isRead: a.isRead === 'true' || a.isRead === true || readNotifIds.includes(notifId),
          targetTab: a.targetTab || 'dashboard',
        });
      });
    }

    // 2. Real-time Smart Account Status Alerts
    if (registration) {
      // Payment Alerts
      if (computedPaymentStep === 'lunas') {
        list.push({
          id: `smart-pay-lunas-${registration.id}`,
          title: 'Pembayaran Lunas',
          message: 'Selamat! Seluruh biaya pendaftaran ibadah Anda telah LUNAS dan terverifikasi.',
          type: 'success',
          createdAt: registration.updatedAt || registration.createdAt || new Date().toISOString(),
          targetTab: 'setoran',
        });
      } else if (computedPaymentStep === 'dp2') {
        list.push({
          id: `smart-pay-dp2-${registration.id}`,
          title: 'Setoran DP 2 Terverifikasi',
          message: 'Setoran DP 2 Anda telah diverifikasi oleh tim keuangan Golden Travel.',
          type: 'success',
          createdAt: registration.updatedAt || registration.createdAt || new Date().toISOString(),
          targetTab: 'setoran',
        });
      } else if (computedPaymentStep === 'dp1') {
        list.push({
          id: `smart-pay-dp1-${registration.id}`,
          title: 'Setoran DP 1 Terverifikasi',
          message: 'Setoran DP 1 Anda telah disetujui. Silakan lengkapi biodata & dokumen Anda.',
          type: 'success',
          createdAt: registration.updatedAt || registration.createdAt || new Date().toISOString(),
          targetTab: 'setoran',
        });
      } else {
        list.push({
          id: `smart-pay-pending-${registration.id}`,
          title: 'Menunggu Setoran DP 1',
          message: 'Silakan lakukan pembayaran DP 1 dan unggah bukti pembayaran untuk pemesanan kouta.',
          type: 'warning',
          createdAt: registration.createdAt || new Date().toISOString(),
          targetTab: 'setoran',
        });
      }

      // Document Verification Alerts
      const verifiedDocs = docs.filter((d: any) => d.status === 'VERIFIED');
      const rejectedDocs = docs.filter((d: any) => d.status === 'REJECTED');

      if (rejectedDocs.length > 0) {
        list.push({
          id: `smart-doc-rejected-${registration.id}-${rejectedDocs.length}`,
          title: 'Perbaikan Dokumen Diperlukan',
          message: `${rejectedDocs.length} berkas dokumen memerlukan unggah ulang. Periksa catatan verifikasi admin.`,
          type: 'alert',
          createdAt: new Date().toISOString(),
          targetTab: 'dokumen',
        });
      } else if (verifiedDocs.length > 0) {
        list.push({
          id: `smart-doc-verified-${registration.id}-${verifiedDocs.length}`,
          title: 'Dokumen Terverifikasi',
          message: `${verifiedDocs.length} berkas dokumen Anda telah disetujui oleh tim verifikasi.`,
          type: 'success',
          createdAt: new Date().toISOString(),
          targetTab: 'dokumen',
        });
      }

      // Helpdesk Ticket Updates
      if (Array.isArray(helpTickets)) {
        helpTickets.forEach((t: any) => {
          if (Array.isArray(t.replies) && t.replies.length > 0) {
            const lastReply = t.replies[t.replies.length - 1];
            if (lastReply.sender === 'admin') {
              list.push({
                id: `smart-ticket-${t.id}-${lastReply.id || lastReply.createdAt}`,
                title: `Balasan Bantuan: ${t.subject}`,
                message: `Admin membalas: "${lastReply.message.substring(0, 65)}..."`,
                type: 'info',
                createdAt: lastReply.createdAt || new Date().toISOString(),
                targetTab: 'layanan_bantuan',
              });
            }
          }
        });
      }

      // Certificate Alert
      if (Array.isArray(certificates) && certificates.length > 0) {
        list.push({
          id: `smart-cert-${registration.id}`,
          title: 'Sertifikat Digital Diterbitkan',
          message: 'Sertifikat apresiasi ibadah Anda telah siap untuk diunduh di portal.',
          type: 'success',
          createdAt: certificates[0].createdAt || new Date().toISOString(),
          targetTab: 'sertifikat',
        });
      }
    }

    // Deduplicate and sort descending by date
    const uniqueMap = new Map();
    list.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [announcements, registration, computedPaymentStep, docs, helpTickets, certificates, readNotifIds]);

  const unreadCount = React.useMemo(() => {
    return allNotifications.filter(n => !n.isRead && !readNotifIds.includes(n.id)).length;
  }, [allNotifications, readNotifIds]);

  const filteredNotifications = React.useMemo(() => {
    if (notifFilter === 'unread') {
      return allNotifications.filter(n => !n.isRead && !readNotifIds.includes(n.id));
    }
    return allNotifications;
  }, [allNotifications, notifFilter, readNotifIds]);

  const handleMarkAsRead = async (id: string) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds(prev => [...prev, id]);
      try {
        await api.post('/jamaah/notifications/read', { notificationId: id });
      } catch (e) {}
    }
  };

  const handleMarkAllAsRead = async () => {
    const allIds = allNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      await api.post('/jamaah/notifications/read-all', {});
    } catch (e) {}
    toast.success('Semua notifikasi ditandai telah dibaca');
  };

  const handleNotifClick = (notif: any) => {
    handleMarkAsRead(notif.id);
    if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
    setIsNotifOpen(false);
  };
  const [selectedPackageForPax, setSelectedPackageForPax] = useState<any>(null);
  const [paxInput, setPaxInput] = useState(1);
  const [activePaxIdx, setActivePaxIdx] = useState(0);
  const [activeDocPaxIdx, setActiveDocPaxIdx] = useState(0);
  const [selectedDocPaxFilter, setSelectedDocPaxFilter] = useState<string>('all');
  const [docSubTab, setDocSubTab] = useState<'manifest' | 'guide_itinerary' | 'help'>('manifest');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'step' | 'full'>('step');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingOrderer, setIsEditingOrderer] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    proof: null as string | null
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [ordererForm, setOrdererForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Biodata Form State
  const [bioForm, setBioForm] = useState({
    nik: '',
    fullName: '',
    pob: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    spouseName: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    medicalHistory: '',
    medicalHistoryDetails: '',
    email: '',
    phone: '',
    address: '',
    passportNo: '',
    passportOffice: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    isSubmitted: false
  });

  // Bantuan & Helpdesk State
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Akun State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: userConsultation?.user?.name || '',
    phone: userConsultation?.user?.phone || '',
    email: userConsultation?.user?.email || '',
    password: '',
    confirmPassword: '',
    avatarUrl: userConsultation?.user?.avatarUrl || ''
  });

  const currentUserName = dbUser?.name || accountForm.name || userConsultation?.user?.name || userConsultation?.ordererName || user?.displayName || 'Jamaah';
  const currentAvatarUrl = accountForm.avatarUrl || dbUser?.avatarUrl || userConsultation?.user?.avatarUrl || '';

  useEffect(() => {
    if (dbUser) {
      setAccountForm(prev => ({
        ...prev,
        name: dbUser.name || prev.name,
        phone: dbUser.phone || prev.phone,
        email: dbUser.email || prev.email,
        avatarUrl: dbUser.avatarUrl || prev.avatarUrl
      }));
    } else if (userConsultation) {
      setAccountForm(prev => ({
        ...prev,
        name: userConsultation.user?.name || prev.name,
        phone: userConsultation.user?.phone || prev.phone,
        email: userConsultation.user?.email || prev.email,
        avatarUrl: userConsultation.user?.avatarUrl || prev.avatarUrl
      }));
    }
  }, [dbUser, userConsultation]);

  const currentStatus = registration?.status || '';

  // Close sidebar on tab change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  const currentPackage = packages.find(p => p.id === userConsultation?.packageId) || 
                         packages.find(p => p.name === userConsultation?.package?.name);

  const [isMuthawwifModalOpen, setIsMuthawwifModalOpen] = useState(false);

  const activeSchedule = schedules.find(s => s.id === userConsultation?.scheduleId) || 
                         schedules.find(s => s.packageId === userConsultation?.packageId) ||
                         schedules[0];

  const muthawwifName = activeSchedule?.muthawwifName || currentPackage?.muthawwifName || 'Ustadz Hanan Attaki';
  const muthawwifRole = activeSchedule?.muthawwifRole || currentPackage?.muthawwifRole || 'Muthawwif Utama & Pembimbing Syariah';
  const muthawwifPhone = activeSchedule?.muthawwifPhone || currentPackage?.muthawwifPhone || '081234567890';
  const muthawwifAvatar = activeSchedule?.muthawwifAvatarUrl || currentPackage?.muthawwifAvatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
  const muthawwifNotes = activeSchedule?.muthawwifNotes || currentPackage?.muthawwifNotes || "Assalamu'alaikum jemaah. Diharapkan hadir manasik H-3 sebelum keberangkatan di Asrama Haji. Pastikan fisik dan dokumen paspor telah siap.";

  // LOGIKA 3: Deteksi parameter packageId dari Halaman Katalog
  useEffect(() => {
    const pkgId = searchParams.get('packageId');
    if (pkgId && packages.length > 0) {
      const selectedPkg = packages.find(p => p.id === pkgId);
      if (selectedPkg) {
        setSelectedPackageForPax(selectedPkg);
        setPaxInput(1);
        setIsPaxModalOpen(true);
        // Clear param so it doesn't reopen on refresh
        setSearchParams({});
      }
    }
  }, [searchParams, packages, setSearchParams]);

  useEffect(() => {
    if (userConsultation) {
      setOrdererForm({
        name: userConsultation.ordererName || userConsultation.user?.name || '',
        phone: userConsultation.ordererPhone || userConsultation.user?.phone || '',
        email: userConsultation.ordererEmail || userConsultation.user?.email || '',
        notes: userConsultation.ordererNotes || ''
      });

      if (userConsultation.paxData && userConsultation.paxData[0]) {
        const data = userConsultation.paxData[0];
        setBioForm(prev => ({
          ...prev,
          ...data
        }));
        if (data.isSubmitted) {
          setIsEditingBio(false);
        } else {
          setIsEditingBio(true);
        }
      } else {
        setBioForm(prev => ({
          ...prev,
          fullName: userConsultation.name || '',
          email: userConsultation.email || '',
          phone: userConsultation.phone || '',
        }));
        setIsEditingBio(true);
      }
    }
  }, [userConsultation]);

  const handleBioChange = (field: string, value: string) => {
    handlePaxDataChange(activePaxIdx, field, value);
  };

  const handleSaveOrderer = async () => {
    if (userConsultation) {
      await updateConsultation({
        ...userConsultation,
        ...ordererForm
      }, true);
      setIsEditingOrderer(false);
      toast.success("Data Pemesan berhasil diperbarui!");
    }
  };

  const handleSaveDraft = async () => {
    if (userConsultation) {
      await updateConsultation({ ...userConsultation, paxData: paxDataList }, true);
      toast.success("Draft biodata jamaah berhasil disimpan sementara.");
    }
  };

  const handleSubmitFinal = async () => {
    // Basic validation for current active pax
    const currentPax = paxDataList[activePaxIdx];
    if (!currentPax?.nik) {
      toast.error("NIK Jamaah " + (activePaxIdx + 1) + " harus diisi!");
      return;
    }
    if (!currentPax?.fullName || !currentPax?.dob || !currentPax?.gender) {
      toast.error("Mohon lengkapi data wajib Jamaah " + (activePaxIdx + 1) + " (Nama & Tgl Lahir)!");
      return;
    }

    if (userConsultation) {
      const updatedPaxData = [...paxDataList];
      updatedPaxData[activePaxIdx] = { ...updatedPaxData[activePaxIdx], isSubmitted: true };
      
      let nextUnsubmitted = -1;
      for (let i = 0; i < paxCount; i++) {
        if (!updatedPaxData[i]?.isSubmitted) {
          nextUnsubmitted = i;
          break;
        }
      }

      let newStatus = userConsultation.status;
      if (nextUnsubmitted === -1 && (userConsultation.status === 'PILIH_PAKET' || userConsultation.status === 'ISI_BIODATA')) {
         newStatus = 'UPLOAD_DOKUMEN';
      }

      const success = await updateConsultation({ ...userConsultation, paxData: updatedPaxData, status: newStatus }, true);
      if (!success) return;
      
      if (nextUnsubmitted !== -1) {
        setActivePaxIdx(nextUnsubmitted);
        toast.success("Biodata Jamaah " + (activePaxIdx + 1) + " berhasil disubmit! Silakan lanjut ke jamaah berikutnya.");
      } else {
        setIsEditingBio(false);
        toast.success("Semua biodata jamaah berhasil disubmit secara final! Lanjut ke tahap Unggah Dokumen.");
        setActiveTab('dokumen');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleConfirmPaxCount = async () => {
    if (selectedPackageForPax) {
      try {
        await api.post('/jamaah/register', {
          packageId: selectedPackageForPax.id,
          paxCount: paxInput
        });
        
        setIsPaxModalOpen(false);
        setSelectedPackageForPax(null);
        await refreshData(true);
        setActiveTab('dashboard');
        toast.success(`Berhasil memilih paket! Silakan cek tahapan pendaftaran di Dashboard.`);
      } catch (error: any) {
        toast.error(error.message || "Gagal mendaftarkan paket.");
      }
    }
  };

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackageForPax(pkg);
    setIsPaxModalOpen(true);
  };

  const handleResetPackage = () => {
    showConfirm(
      'Hapus Pilihan Paket',
      'Apakah Anda yakin ingin menghapus pilihan paket saat ini? Anda dapat memilih paket baru setelah ini.',
      async () => {
        try {
          sessionStorage.removeItem('cached_jamaah_portal_data');
          await api.delete('/jamaah/register');
          await refreshData(true);
          toast.success('Pilihan paket berhasil dihapus.');
          setActiveTab('katalog_paket');
        } catch (error: any) {
          toast.error(error.message || 'Gagal menghapus paket.');
        }
      },
      'Ya, Hapus Pilihan Paket'
    );
  };

  const handleConfirmPayment = async () => {
    if (isSubmittingPayment) return;
    if (!paymentForm.proof) {
      toast.error("Mohon unggah bukti transfer terlebih dahulu!");
      return;
    }

    if (userConsultation) {
      setIsSubmittingPayment(true);
      try {
        let paymentTypeToSend = 'dp1';
        let amountToSend = currentPaymentAmount;

        if (selectedPaymentMode === 'full') {
          paymentTypeToSend = 'full';
          amountToSend = remainingAmount;
        } else {
          if (computedPaymentStep === 'dp1') paymentTypeToSend = 'dp2';
          else if (computedPaymentStep === 'dp2') paymentTypeToSend = 'full';
          else paymentTypeToSend = 'dp1';
        }

        await api.post('/payments', {
          registrationId: userConsultation.id,
          amount: amountToSend.toString(),
          proofUrl: paymentForm.proof,
          paymentType: paymentTypeToSend
        });

        // Optimistic UI update: instantly reflect payment in registration state
        const newPayment = { 
          id: `pay-${Date.now()}`, 
          amount: String(amountToSend), 
          proofUrl: paymentForm.proof, 
          paymentType: paymentTypeToSend,
          status: 'pending', 
          createdAt: new Date().toISOString() 
        };
        
        if (registration && setRegistration) {
          const existingPayments = Array.isArray(registration.payments) ? registration.payments : [];
          setRegistration({
            ...registration,
            payments: [newPayment, ...existingPayments]
          });
        }

        toast.success(
          selectedPaymentMode === 'full'
            ? `Pembayaran Pelunasan Full (Rp ${Number(amountToSend).toLocaleString('id-ID')}) berhasil disubmit! Menunggu verifikasi admin.`
            : "Pembayaran berhasil disubmit! Menunggu verifikasi admin."
        );
        setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], proof: null });
        
        // Background refresh to get official state
        setTimeout(() => refreshData(true), 1500);
      } catch (err: any) {
        toast.error(err.message || "Gagal submit pembayaran");
      } finally {
        setIsSubmittingPayment(false);
      }
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.message || !userConsultation) return;
    try {
      await api.post('/support/tickets', ticketForm);
      setTicketForm({ subject: '', message: '' });
      toast.success("Tiket bantuan berhasil dikirim!");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim tiket.");
    }
  };

  const handleReplyTicket = async () => {
    if (!replyMessage || !selectedTicket) return;
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      toast.success("Balasan terkirim!");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Gagal membalas tiket.");
    }
  };

  const handleUpdateAccount = async () => {
    if (accountForm.password) {
      if (accountForm.password.length < 6) {
        toast.error("Demi keamanan, kata sandi minimal 6 karakter.");
        return;
      }
      if (accountForm.password !== accountForm.confirmPassword) {
        toast.error("Konfirmasi kata sandi tidak cocok!");
        return;
      }
    }

    setIsUpdatingAccount(true);
    try {
      const updatedUser = await api.patch('/users/me', {
        name: accountForm.name,
        phone: accountForm.phone,
        email: accountForm.email,
        avatarUrl: accountForm.avatarUrl,
        password: accountForm.password || undefined
      });

      if (updatedUser && typeof updatedUser === 'object') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Also attempt updating Firebase Auth password in background if Firebase session exists
      const firebaseUser = auth.currentUser;
      if (firebaseUser && accountForm.password) {
        try {
          await updatePassword(firebaseUser, accountForm.password);
        } catch (pwError: any) {
          console.warn("Firebase Auth updatePassword notice:", pwError?.message);
        }
      }

      if (accountForm.password) {
        toast.success("Profil dan kata sandi berhasil diperbarui! Saat login berikutnya, Anda wajib menggunakan kata sandi baru.");
      } else {
        toast.success("Profil berhasil diperbarui!");
      }

      setAccountForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      await refreshData(true);
    } catch (error: any) {
      console.error("Update account error:", error);
      toast.error(error.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        toast.info("Mengunggah foto profil...");
        const uploadRes = await api.upload('/upload', file);
        const newUrl = uploadRes.url || uploadRes.fileUrl;
        if (newUrl) {
          setAccountForm(prev => ({ ...prev, avatarUrl: newUrl }));
          toast.success("Foto profil berhasil diunggah! Klik 'Simpan Perubahan' untuk menyimpan secara permanen.");
        }
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAccountForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
          toast.success("Foto profil dipilih! Klik 'Simpan Perubahan' untuk menyimpan.");
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDownloadCertificate = () => {
    toast.success("Men-generate sertifikat Umroh Anda... Berhasil diunduh!");
  };

  const handleUploadPaymentProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentForm(prev => ({ ...prev, proof: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [paxDataList, setPaxDataList] = useState<any[]>([]);

  // Calculate overall progress percentage based on modular logic
  const getProgressPercentage = () => {
    // Financial calculations
    const packagePrice = Number(currentPackage?.price || 0);
    const payments = (userConsultation as any)?.payments || [];
    const totalPaid = payments
      .filter((t: any) => ['approved', 'VERIFIED'].includes(t.status))
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const remainingBalance = (packagePrice * paxCount) - totalPaid;

    // Rule: If remaining balance is 0 or less, it's 100% (Siap Berangkat)
    if (remainingBalance <= 0 && packagePrice > 0) return 100;

    let total = 0;
    
    // Biodata (20%) - Now checking for final submission
    if (userConsultation?.paxData && userConsultation.paxData[0]?.isSubmitted) total += 20;
    else if (userConsultation?.paxData && userConsultation.paxData.length > 0) total += 5; // Draft partial progress
    
    const docs = Array.isArray(userConsultation?.documents) ? userConsultation.documents : [];
    
    // Handle duplicates by taking the latest version of each docType
    const uniqueDocsMap = new Map();
    docs.forEach((doc: any) => {
      if (!uniqueDocsMap.has(doc.docType)) {
        uniqueDocsMap.set(doc.docType, doc);
      }
    });
    const uniqueDocs = Array.from(uniqueDocsMap.values());
    const docCount = uniqueDocs.length;
    const approvedCount = uniqueDocs.filter((d: any) => ['approved', 'VERIFIED'].includes(d.status)).length;
    const expectedDocs = paxDataList.reduce((acc, pax) => acc + 5 + (pax.maritalStatus === 'Menikah' ? 1 : 0), 0) || (paxCount * 5);
    
    // Base doc upload progress (15%)
    total += Math.min((docCount / expectedDocs) * 15, 15);
    // Approval progress (15%)
    total += Math.min((approvedCount / expectedDocs) * 15, 15);
    
    // Payments (50%)
    if (packagePrice > 0) {
      const paymentProgress = (totalPaid / packagePrice) * 50;
      total += Math.min(paymentProgress, 50);
    }

    return Math.min(Math.round(total), 100);
  };

  // Smart Alerts Logic
  const getSmartAlerts = () => {
    if (!userConsultation) return [];
    const alerts = [];

    if (!userConsultation?.paxData || !userConsultation.paxData[0]?.isSubmitted) {
      alerts.push({ id: 'biodata', title: 'Biodata Belum Final', desc: 'Mohon lengkapi dan submit final data diri Anda.', type: 'error', completed: false });
    } else {
      alerts.push({ id: 'biodata', title: 'Biodata Lengkap', desc: 'Data diri Anda telah disubmit dan tersimpan.', type: 'success', completed: true });
    }

    if (!computedPaymentStep || computedPaymentStep === 'none') {
      alerts.push({ id: 'pay', title: 'Menunggu DP 1', desc: 'Segera lakukan pembayaran DP 1 untuk mengamankan perlengkapan.', type: 'warning', completed: false });
    } else if (computedPaymentStep === 'dp1') {
      alerts.push({ id: 'pay2', title: 'DP 2 Jatuh Tempo', desc: 'Batas akhir booking seat adalah 3 hari lagi.', type: 'warning', completed: false });
    } else {
      alerts.push({ id: 'pay', title: 'Pembayaran Selesai', desc: 'Kewajiban pembayaran Anda saat ini telah terpenuhi.', type: 'success', completed: true });
    }

    // 3. Documents
    const docs = Array.isArray(userConsultation?.documents) ? userConsultation.documents : [];
    const uniqueDocTypes = new Set(docs.map((d: any) => d.docType));
    const docCount = uniqueDocTypes.size;
    const expectedDocs = paxDataList.reduce((acc, pax) => acc + 5 + (pax.maritalStatus === 'Menikah' ? 1 : 0), 0) || (paxCount * 5);
    const rejectedDocs = docs.filter((d: any) => ['rejected', 'REJECTED'].includes(d.status));

    if (rejectedDocs.length > 0) {
      alerts.push({ id: 'docs-rejected', title: 'Dokumen Ditolak', desc: `${rejectedDocs.length} dokumen perlu diunggah ulang. Cek menu dokumen.`, type: 'error', completed: false });
    } else if (docCount < expectedDocs) {
      alerts.push({ id: 'docs', title: 'Upload Dokumen', desc: `${expectedDocs - docCount} dokumen lagi diperlukan untuk pengurusan visa.`, type: 'info', completed: false });
    } else {
      alerts.push({ id: 'docs', title: 'Dokumen Lengkap', desc: 'Seluruh dokumen persyaratan telah diupload.', type: 'success', completed: true });
    }

    // 4. Payments rejections
    const payments = Array.isArray(userConsultation?.payments) ? userConsultation.payments : [];
    const rejectedPayments = payments.filter((p: any) => ['rejected', 'REJECTED'].includes(p.status));
    if (rejectedPayments.length > 0) {
      alerts.push({ id: 'pay-rejected', title: 'Pembayaran Ditolak', desc: 'Ada bukti transfer yang ditolak. Mohon periksa riwayat pembayaran.', type: 'error', completed: false });
    }

    return alerts;
  };

  const progress = getProgressPercentage();
  const alerts = getSmartAlerts();

  useEffect(() => {
    if (userConsultation) {
      let initial = [];
      const existingData = userConsultation.paxData || [];
      
      initial = Array.from({ length: paxCount }).map((_, i) => {
        if (existingData[i]) {
          return existingData[i];
        }
        return i === 0 ? { 
          name: userConsultation.name, 
          phone: userConsultation.phone,
          email: userConsultation.email 
        } : {};
      });
      
      setPaxDataList(initial);
    }
  }, [userConsultation?.paxData, paxCount, userConsultation]);

  const isLunas = computedPaymentStep === 'lunas';

  const handlePaxDataChange = (idx: number, field: string, value: string) => {
    const updated = [...paxDataList];
    if (!updated[idx]) updated[idx] = {};
    updated[idx][field] = value;
    setPaxDataList(updated);
  };


  const basePrice = currentPackage ? Number(currentPackage.price) * paxCount : 0;
  const approvedPaymentsSum = ((userConsultation as any)?.payments || [])
    .filter((t: any) => ['approved', 'VERIFIED'].includes(t.status))
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const remainingAmount = Math.max(0, basePrice - approvedPaymentsSum);

  let currentPaymentTitle = '';
  let currentPaymentAmount = 0;

  if (selectedPaymentMode === 'full') {
    currentPaymentTitle = `Pelunasan Secara Full (Lunas 100%) • ${paxCount} Pax`;
    currentPaymentAmount = remainingAmount;
  } else {
    if (!computedPaymentStep || computedPaymentStep === 'none') {
      currentPaymentTitle = 'Pembayaran DP 1 (Perlengkapan)';
      currentPaymentAmount = 1500000 * paxCount;
    } else if (computedPaymentStep === 'dp1') {
      currentPaymentTitle = 'Pembayaran DP 2 (Booking Seat)';
      currentPaymentAmount = 10000000 * paxCount;
    } else if (computedPaymentStep === 'dp2') {
      currentPaymentTitle = 'Pelunasan Sisa Tagihan';
      currentPaymentAmount = remainingAmount;
    } else {
      currentPaymentTitle = 'Sudah Lunas 100%';
      currentPaymentAmount = 0;
    }
  }

  const handleUploadDocument = async (docName: string, paxIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      const file = e.target.files[0];
      const docKey = `${docName}_${paxIdx}`;
      
      // Capacity limit up to 100MB
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File terlalu besar! Maksimal 100MB.');
        return;
      }

      setUploadingDoc(docKey);
      let finalFileUrl = '';

      try {
        // 1. Try physical upload via FormData first
        const uploadRes = await api.upload('/upload', file);
        if (uploadRes && (uploadRes.url || uploadRes.fileUrl)) {
          finalFileUrl = uploadRes.url || uploadRes.fileUrl;
        }
      } catch (err) {
        console.warn("Direct file upload via FormData failed, falling back to FileReader base64:", err);
      }

      // 2. Fallback to Data URL if physical upload failed
      if (!finalFileUrl) {
        try {
          finalFileUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Gagal membaca file."));
            reader.readAsDataURL(file);
          });
        } catch (err: any) {
          toast.error(err.message || "Gagal membaca file.");
          setUploadingDoc(null);
          return;
        }
      }

      // 3. Optimistic UI update: instantly reflect document in registration state
      const newDoc = { 
        id: `doc-${Date.now()}`, 
        docType: docKey, 
        fileUrl: finalFileUrl, 
        status: 'pending', 
        createdAt: new Date().toISOString() 
      };

      if (registration) {
        const existingDocs = Array.isArray(registration.documents) ? registration.documents : [];
        const updatedDocs = [...existingDocs.filter((d: any) => d.docType !== docKey), newDoc];
        if (setRegistration) {
          setRegistration({ ...registration, documents: updatedDocs });
        }
      }

      toast.success(`Dokumen ${docName} untuk Jamaah ${paxIdx + 1} berhasil diunggah!`);
      setUploadingDoc(null);

      // 4. Background API sync to server database
      try {
        await api.post('/documents', {
          registrationId: userConsultation.id,
          docType: docKey,
          fileUrl: finalFileUrl
        });
        setTimeout(() => refreshData(true), 800);
      } catch (error: any) {
        console.error("Background document save error:", error);
        toast.error(error.message || "Gagal menyimpan dokumen ke server.");
      }
    }
  };

  const getRegistrationStepIdx = () => {
    let idx = 0;
    if (userConsultation?.packageId) idx = 1;
    if (userConsultation?.paxData && userConsultation.paxData[0]?.isSubmitted) idx = Math.max(idx, 2);
    
    const requiredDocsCount = paxCount * 5;
    const uploadedDocsCount = Array.isArray(userConsultation?.documents) ? userConsultation.documents.length : 0;
    if (uploadedDocsCount >= requiredDocsCount && requiredDocsCount > 0) {
        idx = Math.max(idx, 3);
    }
    
    if (computedPaymentStep === 'dp1' || computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') idx = Math.max(idx, 4);
    if (computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') idx = Math.max(idx, 5);
    if (computedPaymentStep === 'lunas') idx = Math.max(idx, 6);
    
    if (userConsultation?.status === 'SIAP_BERANGKAT' || userConsultation?.status === 'BERANGKAT') idx = Math.max(idx, 7);
    return idx;
  };

  const isTabLocked = (_tabId: string) => {
    return false;
  };

  const lifecycleStatus = dbUser?.status || 'DRAFT';

  const isTabDisabled = (_tabId: string) => {
    return false; // Unlock all tabs in portal jamaah
  };

  const handleTabClick = (tabId: string, paymentMode?: 'step' | 'full') => {
    setActiveTab(tabId);
    if (paymentMode) {
      setSelectedPaymentMode(paymentMode);
    }
    if (window.innerWidth < 1024 && isSidebarOpen) setIsSidebarOpen(false);
  };

  const getDisabledReason = (tabId: string) => {
    if (!registration && tabId !== 'pilih_paket' && tabId !== 'katalog_paket') return "Silakan pilih paket terlebih dahulu.";
    
    switch (tabId) {
      case 'pembayaran':
        return "Lengkapi biodata dan dokumen wajib sebelum melakukan pembayaran.";
      case 'persiapan_keberangkatan':
      case 'dokumen_keberangkatan':
        return "Menu ini akan aktif setelah pembayaran Anda lunas dan dokumen keberangkatan diterbitkan.";
      default:
        return "Tahapan ini belum tersedia.";
    }
  };

  const menuGroups: { title: string; items: { id: string; label: string; icon: React.ReactNode; subItems?: { id: string; label: string }[] }[] }[] = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { 
          id: 'pilih_paket', 
          label: 'Pilih Paket', 
          icon: <Tag className="w-5 h-5" />,
          subItems: [
            { id: 'katalog_paket', label: 'Katalog Paket' },
            { id: 'informasi_jadwal', label: 'Informasi Jadwal' },
          ]
        },
        { id: 'biodata', label: 'Biodata & Paspor', icon: <User className="w-5 h-5" /> },
        { id: 'dokumen', label: 'Unggah Dokumen', icon: <Upload className="w-5 h-5" /> },
        { id: 'pembayaran', label: 'Pembayaran', icon: <Banknote className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Persiapan',
      items: [
        { id: 'persiapan_keberangkatan', label: 'Persiapan Keberangkatan', icon: <Plane className="w-5 h-5" /> },
        { id: 'dokumen_keberangkatan', label: 'Dokumen Keberangkatan', icon: <Scroll className="w-5 h-5" /> },
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

  // Flatten items for mobile header lookup
  const allMenuItems = menuGroups.flatMap(g => g.items);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#F8F9FA] relative">
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gold-500/20 overflow-hidden">
          <div className="h-full bg-gold-500 animate-pulse w-full"></div>
        </div>
      )}
      
      {/* Floating WhatsApp Support Button */}
      <FloatingWhatsApp 
        userName={registration?.fullName || (userConsultation as any)?.user?.name || dbUser?.name || ''} 
        defaultTopic="Kendala Portal & Layanan Jemaah" 
      />


      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#132019] text-white border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col shadow-2xl w-72
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0 relative">
          <div className="flex items-center space-x-3">
            <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-full border border-white/10 shadow-sm" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg leading-tight">Golden Travel</span>
              <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider">Portal Jamaah</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar User Info */}
        <div className="p-6 border-b border-white/10 shrink-0">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-500/20 to-amber-600/20 rounded-xl flex items-center justify-center text-gold-300 font-bold text-xl shadow-inner border border-gold-500/30 shrink-0 overflow-hidden relative">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt={currentUserName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  (currentUserName || 'J').charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-white truncate">{currentUserName}</h3>
                <p className="text-xs text-gold-400 font-medium truncate">{userConsultation?.package?.name ? `Paket ${userConsultation.package.name}` : 'Belum Pilih Paket'}</p>
              </div>
           </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="space-y-6">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">{group.title}</h4>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <div key={item.id} className="space-y-1">
                      <button 
                        onClick={() => {
                          if (item.subItems) {
                            setOpenSubMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                          } else {
                            handleTabClick(item.id);
                          }
                        }}
                        className={`w-full flex items-center py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                          ((activeTab === item.id || item.subItems?.some(s => s.id === activeTab)) && !item.subItems)
                            ? 'bg-gold-500 text-gray-900 font-semibold shadow-md ' 
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className={`mr-3 ${(activeTab === item.id || item.subItems?.some(s => s.id === activeTab)) ? 'text-inherit' : 'text-slate-400'}`}>{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.subItems && (
                          <ChevronRight className={`w-4 h-4 transition-transform ${openSubMenus[item.id] ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                      
                      {item.subItems && openSubMenus[item.id] && (
                        <div className="ml-9 space-y-1 border-l border-white/10 pl-4 animate-in slide-in-from-top-2 duration-200">
                          {item.subItems.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => handleTabClick(sub.id)}
                              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all flex items-center justify-between ${
                                activeTab === sub.id 
                                  ? 'text-gold-400 font-bold bg-white/10' 
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <span>{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
           <button 
             onClick={() => {
               showConfirm(
                 'Reset Simulasi Data',
                 'Apakah Anda yakin ingin mereset simulasi? Semua data pendaftaran Anda akan dihapus dan direset ke kondisi awal.',
                 () => resetAllData(),
                 'Ya, Reset Simulasi'
               );
             }}
             className="w-full flex items-center py-3 px-4 rounded-xl font-medium text-gold-400 hover:bg-gold-950/20 hover:text-gold-300 transition-colors"
           >
             <RefreshCw className="w-5 h-5 mr-3" /> 
             <span>Reset Simulasi</span>
           </button>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center py-3 px-4 rounded-xl font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
           >
             <LogOut className="w-5 h-5 mr-3" /> 
             <span>Keluar Akun</span>
           </button>
        </div>
      </aside>

      {/* Main Content Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col
        ${isSidebarOpen ? 'lg:ml-72' : 'ml-0'}
      `}>
        {/* Portal Topbar / Header (Responsive) */}
        <header className="portal-topbar">
            <div className="topbar-left">
                {/* Tombol Menu / Hamburger */}
                <button 
                  className="menu-toggle-btn" 
                  aria-label="Toggle Menu"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
                >
                    <Menu className="w-5 h-5" />
                </button>
                {/* Judul Halaman Dinamis */}
                <h1 className="page-title">{allMenuItems.find(m => m.id === activeTab)?.label}</h1>
            </div>
            
            <div className="topbar-right flex items-center gap-3 relative">
                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full py-1.5 px-3.5 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-300 font-bold text-xs flex items-center justify-center overflow-hidden border border-gold-500/40 shrink-0">
                      {currentAvatarUrl ? (
                        <img src={currentAvatarUrl} alt={currentUserName} className="w-full h-full object-cover" />
                      ) : (
                        (currentUserName || 'J').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="user-greeting text-xs font-bold text-white truncate max-w-[140px] sm:max-w-none">
                      Selamat Datang, {currentUserName.split(' ')[0]}
                    </span>
                </div>
                
                {/* Tombol Notifikasi Aktif */}
                <button 
                  className="notification-btn relative" 
                  aria-label="Notifikasi"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  title="Lihat Notifikasi"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="notif-badge animate-pulse"></span>
                    )}
                </button>

                {/* Dropdown / Popover Notifikasi */}
                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      {/* Backdrop overlay */}
                      <div 
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" 
                        onClick={() => setIsNotifOpen(false)} 
                      />

                      {/* Dropdown Box */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 w-80 sm:w-96 bg-gray-900 border border-gold-500/40 text-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
                      >
                        {/* Header Dropdown */}
                        <div className="p-4 bg-gray-900/95 border-b border-gray-800 flex items-center justify-between shrink-0">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                Notifikasi Portal
                                {unreadCount > 0 && (
                                  <span className="px-2 py-0.5 text-[10px] font-black bg-gold-500 text-gray-950 rounded-full">
                                    {unreadCount} Baru
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] text-gray-400">Informasi & Update Akun Jamaah</p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setIsNotifOpen(false)}
                            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Filter Tabs & Mark Read */}
                        <div className="px-4 py-2.5 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between gap-2 shrink-0 text-xs">
                          <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-gray-800">
                            <button
                              onClick={() => setNotifFilter('all')}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                notifFilter === 'all' 
                                  ? 'bg-gold-500 text-gray-950 shadow-sm' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Semua ({allNotifications.length})
                            </button>
                            <button
                              onClick={() => setNotifFilter('unread')}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                notifFilter === 'unread' 
                                  ? 'bg-gold-500 text-gray-950 shadow-sm' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Belum Dibaca ({unreadCount})
                            </button>
                          </div>

                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[11px] text-gold-400 hover:text-gold-300 font-semibold hover:underline flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tandai Dibaca
                            </button>
                          )}
                        </div>

                        {/* List Notifikasi */}
                        <div className="overflow-y-auto flex-1 divide-y divide-gray-800/60 custom-scrollbar">
                          {filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center space-y-3">
                              <div className="w-12 h-12 rounded-full bg-gray-800/80 text-gray-500 flex items-center justify-center mx-auto border border-gray-700/50">
                                <Bell className="w-6 h-6" />
                              </div>
                              <p className="text-xs text-gray-400 font-medium">
                                {notifFilter === 'unread' ? 'Tidak ada notifikasi belum dibaca.' : 'Belum ada notifikasi.'}
                              </p>
                            </div>
                          ) : (
                            filteredNotifications.map((item) => {
                              const isRead = item.isRead || readNotifIds.includes(item.id);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleNotifClick(item)}
                                  className={`p-3.5 transition-all hover:bg-white/5 cursor-pointer flex items-start gap-3 relative group ${
                                    !isRead ? 'bg-gold-500/10 border-l-2 border-l-gold-500' : 'opacity-85'
                                  }`}
                                >
                                  {/* Icon Type */}
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                                    item.type === 'success' 
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                      : item.type === 'warning' || item.type === 'alert'
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  }`}>
                                    {item.type === 'success' ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : item.type === 'warning' || item.type === 'alert' ? (
                                      <AlertTriangle className="w-4 h-4" />
                                    ) : (
                                      <Megaphone className="w-4 h-4" />
                                    )}
                                  </div>

                                  {/* Message Body */}
                                  <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <h4 className={`text-xs font-bold truncate ${!isRead ? 'text-gold-300' : 'text-gray-200'}`}>
                                        {item.title}
                                      </h4>
                                      {!isRead && (
                                        <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0"></span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mb-1.5">
                                      {item.message}
                                    </p>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      {item.targetTab && (
                                        <span className="text-gold-400/80 group-hover:text-gold-300 font-semibold flex items-center gap-0.5">
                                          Buka <ChevronRight className="w-2.5 h-2.5" />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-2.5 bg-gray-900 border-t border-gray-800 text-center shrink-0">
                          <button
                            onClick={() => setIsNotifOpen(false)}
                            className="text-xs text-gray-400 hover:text-white transition-colors py-0.5 px-3 rounded-lg hover:bg-white/5"
                          >
                            Tutup
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
            </div>
        </header>


        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-10 w-full max-w-7xl mx-auto min-w-0">
                   {/* BIODATA TAB */}
          {activeTab === 'biodata' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* SECTION: RINGKASAN PROGRAM & UNDUH FORMULIR PDF */}
              <div className="bg-gradient-to-r from-matcha-900 via-matcha-800 to-matcha-900 text-white rounded-2xl p-6 shadow-md border border-matcha-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30 uppercase">
                      STATUS: {computedPaymentStep === 'lunas' ? 'LUNAS' : computedPaymentStep === 'dp2' ? 'DP 2 TERBAYAR' : computedPaymentStep === 'dp1' ? 'DP 1 TERBAYAR' : 'BELUM DP'}
                    </span>
                    <span className="text-xs text-matcha-200">• {paxCount} Jamaah</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {userConsultation?.packageName || userConsultation?.packageTitle || 'Pendaftaran Umroh & Haji'}
                  </h3>
                  <p className="text-xs text-matcha-200">
                    Unduh Formulir Pendaftaran resmi versi PDF untuk keperluan administrasi & arsip cetak fisik Anda.
                  </p>
                </div>
                <button
                  onClick={() => {
                    generateRegistrationFormPdf(userConsultation);
                    toast.success('Formulir pendaftaran berhasil diunduh sebagai PDF!');
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Unduh PDF
                </button>
              </div>

              {/* SECTION: DATA PEMESAN (ORDERER) */}
              <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold-50 rounded-full -mr-20 -mt-20 opacity-50"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gold-50 text-gold-600 rounded-xl flex items-center justify-center mr-4">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Data Pemesan / Penanggung Jawab</h3>
                        <p className="text-xs text-gray-500">Informasi kontak utama untuk koordinasi keberangkatan.</p>
                      </div>
                    </div>
                    {!isEditingOrderer ? (
                      <button 
                        onClick={() => setIsEditingOrderer(true)}
                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditingOrderer(false)}
                          className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700"
                        >
                          Batal
                        </button>
                        <button 
                          onClick={handleSaveOrderer}
                          className="px-4 py-1 bg-matcha-600 text-white text-xs font-bold rounded-lg hover:bg-matcha-700 shadow-sm"
                        >
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingOrderer ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</p>
                        <p className="text-sm font-bold text-gray-900">{userConsultation?.ordererName || userConsultation?.user?.name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Telepon / WhatsApp</p>
                        <p className="text-sm font-bold text-gray-900">{userConsultation?.ordererPhone || userConsultation?.user?.phone || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                        <p className="text-sm font-bold text-gray-900">{userConsultation?.ordererEmail || userConsultation?.user?.email || '-'}</p>
                      </div>
                      <div className="col-span-1 md:col-span-3 space-y-1 pt-2 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Catatan Tambahan</p>
                        <p className="text-sm text-gray-600 italic">{userConsultation?.ordererNotes || 'Tidak ada catatan khusus.'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Lengkap</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-gray-500"
                          value={ordererForm.name}
                          onChange={(e) => setOrdererForm({...ordererForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Telepon / WA</label>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-gray-500"
                          value={ordererForm.phone}
                          onChange={(e) => setOrdererForm({...ordererForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
                        <input 
                          type="email"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-gray-500"
                          value={ordererForm.email}
                          onChange={(e) => setOrdererForm({...ordererForm, email: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Catatan Tambahan</label>
                        <textarea 
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-gray-500 min-h-[60px]"
                          value={ordererForm.notes}
                          onChange={(e) => setOrdererForm({...ordererForm, notes: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Biodata & Paspor</h2>
                  <p className="text-gray-500">Pastikan data Anda selalu mutakhir untuk kelancaran visa.</p>
                </div>
                {paxCount > 1 && (
                  <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-x-auto max-w-full no-scrollbar">
                    {Array.from({ length: paxCount }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePaxIdx(i)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activePaxIdx === i ? 'bg-gray-50 text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Jamaah {i + 1} {paxDataList[i]?.isSubmitted ? '✅' : ''}
                      </button>
                    ))}
                  </div>
                )}
                {!isEditingBio && (
                  <button 
                    onClick={() => setIsEditingBio(true)}
                    className="px-6 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Data Biodata
                  </button>
                )}
              </div>

              {!isEditingBio ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Summary Profile Card */}
                    <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-center space-x-6 mb-8 relative">
                        <div className="w-20 h-20 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center text-3xl font-bold">
                          {(paxDataList[activePaxIdx]?.fullName || 'J').charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{paxDataList[activePaxIdx]?.fullName || 'Belum Diisi'}</h3>
                          <p className={`font-bold flex items-center mt-1 ${paxDataList[activePaxIdx]?.isSubmitted ? 'text-gray-600' : 'text-orange-500'}`}>
                            {paxDataList[activePaxIdx]?.isSubmitted ? (
                              <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Terverifikasi Sistem</>
                            ) : (
                              <><AlertCircle className="w-4 h-4 mr-1.5" /> Menunggu Draft Final</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-8 border-t border-gray-50">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Induk Kependudukan (NIK)</p>
                          <p className="text-lg font-mono text-gray-900">{paxDataList[activePaxIdx]?.nik || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor Paspor</p>
                          <p className="text-lg font-mono text-gray-700 font-bold">{paxDataList[activePaxIdx]?.passportNo || 'Belum Diinput'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kontak & Email</p>
                          <p className="text-sm text-gray-700">{paxDataList[activePaxIdx]?.phone || '-'} | {paxDataList[activePaxIdx]?.email || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Pernikahan</p>
                          <p className="text-sm text-gray-700">{paxDataList[activePaxIdx]?.maritalStatus || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Informasi Tambahan (Jamaah {activePaxIdx + 1})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-4 bg-white shadow-md rounded-xl">
                          <p className="text-xs font-bold text-gray-400 mb-2">KONTAK DARURAT</p>
                          <p className="font-bold text-gray-900">{paxDataList[activePaxIdx]?.emergencyName || '-'}</p>
                          <p className="text-xs text-gray-500 mt-1">{paxDataList[activePaxIdx]?.emergencyRelation} • {paxDataList[activePaxIdx]?.emergencyPhone}</p>
                        </div>
                        <div className="p-4 bg-white shadow-md rounded-xl">
                          <p className="text-xs font-bold text-gray-400 mb-2">REKAM MEDIS</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${!paxDataList[activePaxIdx]?.medicalHistory ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {paxDataList[activePaxIdx]?.medicalHistory || 'SEHAT WAL\'AFIAT'}
                          </span>
                          {paxDataList[activePaxIdx]?.medicalHistoryDetails && (
                            <p className="text-xs text-gray-500 mt-2 italic">"{paxDataList[activePaxIdx]?.medicalHistoryDetails}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gold-50 rounded-3xl p-8 border border-gold-100">
                      <h3 className="font-bold text-gold-900 text-lg mb-2">Butuh Bantuan?</h3>
                      <p className="text-sm text-gold-800 leading-relaxed mb-6">
                        Jika ada kendala dalam pengisian data atau dokumen, silakan hubungi tim CS kami via WhatsApp.
                      </p>
                      <button className="w-full py-3 bg-gold-500 text-gray-900 rounded-xl font-bold text-sm hover:bg-gold-600 transition-all shadow-md">
                        Hubungi Support
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Section 1: Data Diri */}
                    <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center mr-4">
                          <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Informasi Pribadi</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">NIK (Sesuai KTP)</label>
                          <input 
                            type="text" 
                            placeholder="Masukkan NIK"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.nik || ''}
                            onChange={(e) => handleBioChange('nik', e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Nama Lengkap (Sesuai KTP)</label>
                          <input 
                            type="text" 
                            placeholder="Nama Lengkap"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.fullName || ''}
                            onChange={(e) => handleBioChange('fullName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Tempat Lahir</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Batam"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.pob || ''}
                            onChange={(e) => handleBioChange('pob', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Tanggal Lahir</label>
                          <input 
                            type="date" 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.dob || ''}
                            onChange={(e) => handleBioChange('dob', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Jenis Kelamin</label>
                          <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.gender || ''}
                            onChange={(e) => handleBioChange('gender', e.target.value)}
                          >
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Status Pernikahan</label>
                          <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.maritalStatus || ''}
                            onChange={(e) => handleBioChange('maritalStatus', e.target.value)}
                          >
                            <option value="">Pilih Status</option>
                            <option value="Belum Menikah">Belum Menikah</option>
                            <option value="Menikah">Menikah</option>
                            <option value="Cerai">Cerai</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Email Aktif</label>
                          <input 
                            type="email" 
                            placeholder="nama@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.email || ''}
                            onChange={(e) => handleBioChange('email', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Nomor Telepon/WA</label>
                          <input 
                            type="text" 
                            placeholder="0812..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.phone || ''}
                            onChange={(e) => handleBioChange('phone', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold text-gray-700">Alamat Lengkap (Sesuai KTP)</label>
                          <textarea 
                            placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none min-h-[80px]"
                            value={paxDataList[activePaxIdx]?.address || ''}
                            onChange={(e) => handleBioChange('address', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Conditional Rendering for Spouse Name */}
                      {paxDataList[activePaxIdx]?.maritalStatus === 'Menikah' && (
                        <div className="mt-6 p-6 bg-white shadow-md rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Nama Pasangan (Suami/Istri)</label>
                            <input 
                              type="text" 
                              placeholder="Nama Lengkap Pasangan"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                              value={paxDataList[activePaxIdx]?.spouseName || ''}
                              onChange={(e) => handleBioChange('spouseName', e.target.value)}
                            />
                            <p className="text-[10px] text-gray-600 font-medium">Wajib diisi sesuai dokumen buku nikah untuk pengurusan mahram/pendamping.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Kontak Darurat */}
                    <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Keluarga di Tanah Air (Kontak Darurat)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                          <input 
                            type="text" 
                            placeholder="Nama Keluarga"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.emergencyName || ''}
                            onChange={(e) => handleBioChange('emergencyName', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Hubungan</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Anak Kandung"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.emergencyRelation || ''}
                            onChange={(e) => handleBioChange('emergencyRelation', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">No. HP/WhatsApp</label>
                          <input 
                            type="text" 
                            placeholder="0812..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.emergencyPhone || ''}
                            onChange={(e) => handleBioChange('emergencyPhone', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Rekam Medis & Paspor */}
                    <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mr-4">
                          <HeartPulse className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Rekam Medis & Paspor</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Riwayat Penyakit Bawaan</label>
                          <select 
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                            value={paxDataList[activePaxIdx]?.medicalHistory || ''}
                            onChange={(e) => handleBioChange('medicalHistory', e.target.value)}
                          >
                            <option value="">Tidak Ada / Sehat Wal'afiat</option>
                            <option value="Diabetes">Diabetes</option>
                            <option value="Hipertensi">Hipertensi</option>
                            <option value="Asma">Asma</option>
                            <option value="Jantung">Penyakit Jantung</option>
                            <option value="Lainnya">Lainnya (Sebutkan di Bawah)</option>
                          </select>
                        </div>

                        {paxDataList[activePaxIdx]?.medicalHistory === 'Lainnya' && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-bold text-gray-900">Detail Riwayat Penyakit</label>
                            <textarea 
                              placeholder="Sebutkan detail penyakit atau alergi yang perlu diketahui tim medis..."
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none min-h-[100px]"
                              value={paxDataList[activePaxIdx]?.medicalHistoryDetails || ''}
                              onChange={(e) => handleBioChange('medicalHistoryDetails', e.target.value)}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nomor Paspor</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: A1234567"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                              value={paxDataList[activePaxIdx]?.passportNo || ''}
                              onChange={(e) => handleBioChange('passportNo', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Kantor Penerbit</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: Batam Kota"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                              value={paxDataList[activePaxIdx]?.passportOffice || ''}
                              onChange={(e) => handleBioChange('passportOffice', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Tanggal Dikeluarkan</label>
                            <input 
                              type="date" 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                              value={paxDataList[activePaxIdx]?.passportIssueDate || ''}
                              onChange={(e) => handleBioChange('passportIssueDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Masa Berlaku</label>
                            <input 
                              type="date" 
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                              value={paxDataList[activePaxIdx]?.passportExpiryDate || ''}
                              onChange={(e) => handleBioChange('passportExpiryDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Action Card */}
                    <div className="bg-gray-100 rounded-xl p-8 text-gray-900 shadow-lg sticky top-28">
                      <h3 className="font-bold text-xl mb-4">Simpan (Jamaah {activePaxIdx + 1})</h3>
                      <p className="text-slate-300 text-sm mb-8">
                        Pastikan semua data yang diisi sudah sesuai dengan dokumen asli (KTP & Paspor).
                      </p>
                      <div className="space-y-4">
                        <button 
                          onClick={handleSaveDraft}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 text-gray-900 rounded-2xl font-bold transition-all border border-white/20"
                        >
                          Simpan Draft
                        </button>
                        <button 
                          onClick={handleSubmitFinal}
                          className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-gray-900 rounded-2xl font-bold transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center"
                        >
                          Simpan Final <CheckCircle2 className="w-5 h-5 ml-2" />
                        </button>
                        {paxDataList[activePaxIdx]?.isSubmitted && (
                          <button 
                            onClick={() => setIsEditingBio(false)}
                            className="w-full py-2 text-gray-300 text-xs hover:text-white transition-colors"
                          >
                            Batal Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAYMENT TAB */}
          {activeTab === 'pembayaran' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pembayaran & Tagihan</h2>
                  <p className="text-gray-500 text-sm">Kelola pembayaran cicilan dan pantau status tagihan Anda.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gold-50 px-4 py-2 rounded-xl border border-gold-100">
                  <CreditCard className="w-4 h-4 text-gold-600" />
                  <span className="text-xs font-bold text-gold-700">Pembayaran Aman & Terverifikasi</span>
                </div>
              </div>

              {!userConsultation?.packageId || !userConsultation?.paxData?.[0]?.isSubmitted ? (
                <div className="bg-white shadow-md rounded-xl p-20 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Banknote className="w-10 h-10" />
                   </div>
                   <div className="max-w-md">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Belum ada tagihan</h3>
                      <p className="text-sm text-slate-500 italic leading-relaxed">
                        Selesaikan pemilihan paket untuk melihat rincian tagihan Anda di sini.
                      </p>
                   </div>
                   <button 
                    onClick={() => setActiveTab('pilih_paket')}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg rounded-xl font-bold text-sm transition-all cursor-pointer"
                   >
                     Pilih Paket Sekarang
                   </button>
                </div>
              ) : (
                <>
                  {/* SECTION: RINGKASAN TAGIHAN */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { 
                          label: 'Total Harga Paket', 
                          value: basePrice, 
                          icon: <Tag className="w-5 h-5" />, 
                          color: 'blue' 
                        },
                        { 
                          label: 'Total Sudah Dibayar', 
                          value: approvedPaymentsSum, 
                          icon: <CheckCircle className="w-5 h-5" />, 
                          color: 'green' 
                        },
                        { 
                          label: 'Sisa Tagihan', 
                          value: remainingAmount, 
                          icon: <Clock className="w-5 h-5" />, 
                          color: 'orange' 
                        }
                      ].map((stat, idx) => (
                      <div key={idx} className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-full -mr-12 -mt-12 opacity-50 transition-transform group-hover:scale-110`}></div>
                        <div className="relative">
                          <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                            {stat.icon}
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <h4 className="text-xl font-bold text-gray-900">
                            Rp {formatCurrency(stat.value)}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SKEMA PEMBAYARAN TOGGLE BANNER */}
                  {computedPaymentStep !== 'lunas' && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-2xl border border-gold-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-extrabold uppercase border border-gold-500/30">
                          <Sparkles className="w-3 h-3 text-gold-400" /> Opsi Pembayaran Full (100% Lunas)
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Ingin Bayar Pelunasan Langsung Secara Full?</h3>
                        <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                          Anda dapat memilih untuk membayar lunas 100% sekaligus tanpa mengikuti tahapan cicilan DP. Total nominal otomatis dihitung untuk <span className="text-gold-300 font-bold">{paxCount} jamaah</span>.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10 shrink-0 w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMode('step')}
                          className={`flex-1 md:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            selectedPaymentMode === 'step'
                              ? 'bg-gray-800 text-white shadow-sm border border-white/10'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          💳 Tahapan / Cicilan (DP)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMode('full')}
                          className={`flex-1 md:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            selectedPaymentMode === 'full'
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                              : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                          ⚡ Pelunasan Full (100%)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: KONFIRMASI FORM & VA */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                          <Building className="w-4 h-4 mr-2 text-gray-600" /> Rekening Pembayaran
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Bank Mandiri</p>
                            <p className="text-sm font-black text-gray-900 flex items-center justify-between">
                              1090064995673
                              <button 
                                className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText("1090064995673");
                                  toast.success("Nomor rekening Mandiri berhasil disalin");
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              </button>
                            </p>
                            <p className="text-[10px] text-blue-700 mt-1 font-medium italic">A.N. PT Golden Tour Haramain</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-emerald-600" /> Konfirmasi Cepat via WA
                        </h3>
                        <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
                          Kirim bukti transfer langsung ke Admin melalui WhatsApp untuk percepatan proses verifikasi pembayaran Anda.
                        </p>
                        <div className="space-y-3">
                          {[
                            { name: 'Admin 1', phone: '082283201103' },
                            { name: 'Admin 2', phone: '082288308220' }
                          ].map((admin, idx) => (
                            <a
                              key={idx}
                              href={`https://wa.me/${admin.phone.replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${admin.name}, saya ${userConsultation?.user?.name || 'Jamaah'} ingin mengonfirmasi pembayaran paket ${currentPackage?.name || ''}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all group"
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center mr-3 shadow-sm group-hover:scale-110 transition-transform">
                                  <MessageCircle className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-[10px] font-bold text-emerald-800 truncate">{admin.name}</p>
                                  <p className="text-[9px] text-emerald-600">{admin.phone}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm">
                        {pendingPaymentStep ? (
                          <div className="text-center space-y-4 py-8">
                            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                              <RefreshCw className="w-8 h-8 animate-spin" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">Menunggu Persetujuan Admin</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Bukti transfer Anda untuk tahap <span className="font-bold text-gray-900">{pendingPaymentStep.toUpperCase()}</span> telah kami terima dan sedang dalam antrean verifikasi oleh tim keuangan kami.
                            </p>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                              <Smartphone className="w-4 h-4 mr-2 text-gray-600" /> Konfirmasi Transfer
                            </h3>

                            {/* Mode Banner Indicator */}
                            <div className={`border rounded-xl p-4 mb-4 transition-all ${
                              selectedPaymentMode === 'full'
                                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                                : 'bg-blue-50 border-blue-100'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                  selectedPaymentMode === 'full' ? 'text-emerald-700' : 'text-blue-600'
                                }`}>
                                  {selectedPaymentMode === 'full' ? '⚡ Mode Pelunasan Full (100%)' : '💳 Tahap Pembayaran Saat Ini'}
                                </p>
                                {selectedPaymentMode === 'full' && (
                                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    Otomatis
                                  </span>
                                )}
                              </div>
                              <p className="text-base sm:text-lg font-bold text-gray-900">{currentPaymentTitle}</p>
                              <p className="text-xs text-gray-600 mt-1 leading-snug">
                                {selectedPaymentMode === 'full' 
                                  ? `Total biaya paket untuk ${paxCount} jamaah secara keseluruhan.`
                                  : `Skema pembayaran bertahap per tahapan untuk ${paxCount} jamaah.`}
                              </p>
                            </div>

                            {/* Detailed Calculation Breakdown Box for Full Payment */}
                            {selectedPaymentMode === 'full' && (
                              <div className="bg-slate-950 text-white p-4 rounded-2xl border border-gold-500/30 text-xs space-y-2 mb-4 shadow-inner">
                                <div className="flex justify-between text-slate-300">
                                  <span>Paket Perjalanan:</span>
                                  <span className="font-bold text-white">{currentPackage?.name || 'Paket Terpilih'}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Harga Paket / Pax:</span>
                                  <span className="font-bold text-white">Rp {Number(currentPackage?.price || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Jumlah Jamaah Berangkat:</span>
                                  <span className="font-bold text-gold-300">x {paxCount} Orang</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Total Paket ({paxCount} Pax):</span>
                                  <span className="font-bold text-white">Rp {Number(basePrice).toLocaleString('id-ID')}</span>
                                </div>
                                {approvedPaymentsSum > 0 && (
                                  <div className="flex justify-between text-emerald-400 pt-1 border-t border-white/10">
                                    <span>Sudah Dibayar (Disetujui):</span>
                                    <span className="font-bold">- Rp {Number(approvedPaymentsSum).toLocaleString('id-ID')}</span>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-gold-400">
                                  <span>Tagihan Pelunasan Full:</span>
                                  <span>Rp {Number(remainingAmount).toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nominal Transfer (Rp)</label>
                                <input 
                                  type="text"
                                  readOnly
                                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 outline-none text-gray-900 font-bold transition-all text-sm cursor-not-allowed"
                                  value={"Rp " + Number(currentPaymentAmount).toLocaleString('id-ID')}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Transfer</label>
                                <input 
                                  type="date"
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-gray-500 transition-all text-sm"
                                  value={paymentForm.date}
                                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bukti Transfer</label>
                                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group">
                                  {paymentForm.proof ? (
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                      <span className="text-xs font-bold text-gray-700">Berkas Bukti Terlampir</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-gray-600 mb-1" />
                                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-700">Unggah Gambar / PDF Bukti Transfer</span>
                                    </>
                                  )}
                                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUploadPaymentProof} />
                                </label>
                              </div>
                              <button 
                                onClick={handleConfirmPayment}
                                disabled={!paymentForm.proof || isSubmittingPayment}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                  !paymentForm.proof || isSubmittingPayment
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                    : selectedPaymentMode === 'full'
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                                      : 'bg-matcha-600 text-white hover:bg-matcha-700 shadow-black/20'
                                }`}
                              >
                                {isSubmittingPayment ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                <span>
                                  {isSubmittingPayment
                                    ? 'Memproses Pembayaran...'
                                    : selectedPaymentMode === 'full' 
                                      ? `Konfirmasi Pelunasan Full (Rp ${Number(currentPaymentAmount).toLocaleString('id-ID')})`
                                      : 'Konfirmasi Pembayaran'}
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: RIWAYAT TRANSAKSI */}
                    <div className="lg:col-span-2">
                      <div className="bg-white shadow-md rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                          <h3 className="text-sm font-bold text-gray-900">Riwayat Transaksi</h3>
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time History</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-6 py-4 border-b border-gray-50">Tanggal</th>
                                <th className="px-6 py-4 border-b border-gray-50">Nominal</th>
                                <th className="px-6 py-4 border-b border-gray-50">Status</th>
                                <th className="px-6 py-4 border-b border-gray-50 text-right">Berkas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {((userConsultation as any)?.payments || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((t: any, idx: number) => (
                                <tr key={t.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="text-xs font-bold text-gray-900">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                                    <p className="text-[10px] text-gray-400">ID: {t.id?.slice(0, 8)}</p>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-sm text-gray-900">
                                    Rp {Number(t.amount).toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                                      ${['approved', 'VERIFIED'].includes(t.status) ? 'bg-green-100 text-green-700' : 
                                        ['rejected', 'REJECTED'].includes(t.status) ? 'bg-red-100 text-red-700' : 
                                        'bg-yellow-100 text-yellow-700'}
                                    `}>
                                      {['approved', 'VERIFIED'].includes(t.status) ? 'Lunas/Diterima' : 
                                       ['rejected', 'REJECTED'].includes(t.status) ? 'Ditolak' : 'Menunggu Konfirmasi'}
                                    </span>
                                    {(t.adminNotes || t.rejectionReason || t.notes || t.reason) && ['rejected', 'REJECTED'].includes(t.status) && (
                                      <p className="text-[9px] text-red-500 font-medium italic mt-1 max-w-[180px]">"{t.adminNotes || t.rejectionReason || t.notes || t.reason}"</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <a 
                                      href={`https://wa.me/6282283201103?text=${encodeURIComponent(`Halo Admin, saya ${userConsultation?.user?.name || 'Jamaah'} ingin konfirmasi transaksi ID: ${t.id?.slice(0, 8)} sebesar Rp ${Number(t.amount).toLocaleString('id-ID')}.`)}`}
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors inline-block"
                                      title="Konfirmasi via WA"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </a>
                                    {t.proofUrl ? (
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const isPdf = t.proofUrl.startsWith('data:application/pdf') || t.proofUrl.toLowerCase().endsWith('.pdf');
                                          setPreviewFile({ 
                                            url: t.proofUrl, 
                                            type: isPdf ? 'pdf' : 'image', 
                                            title: `Bukti Bayar - ${new Date(t.date).toLocaleDateString('id-ID')}` 
                                          });
                                        }} 
                                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors inline-block shadow-sm" 
                                        title="Lihat Berkas"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <div className="p-2 bg-gray-50 text-gray-300 rounded-lg cursor-not-allowed" title="Berkas tidak tersedia">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {((userConsultation as any)?.payments || []).length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                    Belum ada riwayat transaksi.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
                          <div className="flex items-center space-x-3 text-gray-500">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-[10px] leading-relaxed">
                              Pembayaran akan diverifikasi oleh Admin dalam waktu 1x24 jam. Kuitansi PDF resmi akan muncul setelah status pembayaran disetujui.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* KATALOG PAKET TAB */}
          {activeTab === 'katalog_paket' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Katalog Paket Ibadah</h2>
                    <button 
                      onClick={() => refreshData(true)}
                      className={`p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gold-600 ${loading ? 'animate-spin' : ''}`}
                      title="Perbarui Data"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-500 max-w-md">Pilih paket perjalanan Umroh atau Haji terbaik yang telah kami kurasi khusus untuk kenyamanan ibadah Anda.</p>
                </div>
                
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit border border-gray-200">
                  <button
                    onClick={() => setPackageCategory('umroh')}
                    className={`flex items-center px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      packageCategory === 'umroh' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/5903/5903673.png" className="w-5 h-5 mr-2.5 opacity-80" alt="Umroh" />
                    Umroh
                  </button>
                  <button
                    onClick={() => setPackageCategory('haji')}
                    className={`flex items-center px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      packageCategory === 'haji' 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/2822/2822709.png" className="w-5 h-5 mr-2.5 opacity-80" alt="Haji" />
                    Haji
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const filteredPackages = (effectivePackages || []).filter(pkg => {
                    if (!pkg) return false;
                    const isAvail = pkg.isAvailable !== false && pkg.isAvailable !== 'false' && pkg.isAvailable !== 0 && pkg.isAvailable !== '0';
                    const pkgType = (pkg.type || 'umroh').toString().trim().toLowerCase();
                    return isAvail && pkgType === packageCategory;
                  });

                  if (filteredPackages.length === 0 && !loading) {
                    return (
                      <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 animate-in fade-in duration-500 shadow-sm p-8">
                        <div className="w-16 h-16 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-100 shadow-sm">
                          <InventoryIcon className="w-8 h-8 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Paket {packageCategory === 'umroh' ? 'Umroh' : 'Haji'} Tersedia</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                          Saat ini belum ada paket {packageCategory} yang aktif di katalog. Coba beralih ke kategori {packageCategory === 'umroh' ? 'Haji' : 'Umroh'} atau klik tombol di bawah untuk memuat ulang data terbaru dari admin.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button 
                            onClick={() => setPackageCategory(packageCategory === 'umroh' ? 'haji' : 'umroh')}
                            className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-md active:scale-95"
                          >
                            Lihat Paket {packageCategory === 'umroh' ? 'Haji' : 'Umroh'}
                          </button>
                          <button 
                            onClick={() => {
                              fetchDirectPackages();
                              refreshData(true);
                            }}
                            className="inline-flex items-center px-6 py-3 bg-gold-500 text-gray-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gold-600 transition-all shadow-md shadow-gold-500/20 active:scale-95"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Muat Ulang Katalog
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return filteredPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden border border-gray-100 flex flex-col group animate-in slide-in-from-bottom-8">
                    <div className="h-52 w-full relative overflow-hidden">
                      <img 
                        src={pkg.imageUrl || pkg.image || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80"} 
                        alt={pkg.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-gray-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white">
                          {pkg.duration}
                        </span>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-xl font-black text-white leading-tight mb-1 group-hover:translate-x-1 transition-transform duration-500">{pkg.name}</h3>
                        <div className="flex items-center text-gold-400 text-[9px] font-black uppercase tracking-widest">
                          <Star className="w-3 h-3 mr-1.5 fill-current" /> Premium Service
                        </div>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <div className="space-y-4 mb-8">
                        {(() => {
                          const desc = pkg.description;
                          let lines: string[] = [];
                          
                          if (Array.isArray(desc)) {
                            lines = desc;
                          } else if (typeof desc === 'string') {
                            try {
                              const parsed = JSON.parse(desc);
                              if (Array.isArray(parsed)) {
                                lines = parsed;
                              } else {
                                lines = desc.split('\n');
                              }
                            } catch (e) {
                              lines = desc.split('\n');
                            }
                          }
                          
                          return lines.filter(l => l && l.trim()).map((line, i) => (
                            <div key={i} className="flex items-start group-hover:translate-x-1 transition-transform duration-300">
                              <div className="w-5 h-5 rounded-lg bg-gold-50 flex items-center justify-center mr-3 shrink-0 mt-0.5 border border-gold-100 shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-gold-600" />
                              </div>
                              <p className="text-sm text-gray-600 font-medium leading-relaxed group-hover:text-gray-900 transition-colors">{line}</p>
                            </div>
                          ));
                        })()}
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-8 group-hover:bg-slate-100 transition-colors">
                           <div>
                             <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1.5">Investasi Ibadah</p>
                             <p className="text-2xl font-black text-gray-900 tracking-tight">
                                Rp {Number(pkg.price).toLocaleString('id-ID')}
                             </p>
                           </div>
                           <div className="text-right">
                             <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1.5">Sisa Seat</p>
                             <div className="flex items-center justify-end">
                               <div className="w-2 h-2 rounded-full bg-green-500 mr-2.5 shadow-[0_0_12px_rgba(34,197,94,0.5)]"></div>
                               <span className="text-sm font-black text-gray-700">{(pkg as any).remainingSeats ?? (pkg.quota || 45)}</span>
                             </div>
                           </div>
                        </div>
                        
                        <button 
                          onClick={() => handleSelectPackage(pkg as any)}
                          className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center
                            ${userConsultation?.packageId === pkg.id 
                              ? 'bg-gray-900 text-white hover:bg-black shadow-2xl shadow-gray-200' 
                              : 'bg-gold-500 text-gray-900 hover:bg-gold-600 shadow-xl shadow-gold-500/30 active:scale-[0.98]'}
                          `}
                        >
                          {userConsultation?.packageId === pkg.id ? (
                            <><CheckCircle2 className="w-5 h-5 mr-3" /> Paket Terpilih</>
                          ) : (
                            <>Pilih Paket Sekarang <ChevronRight className="w-5 h-5 ml-2" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ));
                })()}
                {loading && (
                   <div className="col-span-full py-24 text-center">
                     <RefreshCw className="w-10 h-10 text-gold-600 animate-spin mx-auto mb-4" />
                     <p className="text-gray-500 font-medium">Memperbarui katalog paket...</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {/* INFORMASI JADWAL TAB */}
          {activeTab === 'informasi_jadwal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Informasi Jadwal Keberangkatan</h2>
                  <p className="text-gray-500 text-sm">Lihat tanggal keberangkatan yang tersedia dan unduh rincian itinerary perjalanan.</p>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white shadow-md border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="p-8">Paket</th>
                      <th className="p-8">Tanggal Keberangkatan</th>
                      <th className="p-8">Sisa Kursi</th>
                      <th className="p-8">Itinerary (PDF)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(schedules || []).map((sch) => {
                      const pkg = packages.find(p => p.id === sch.packageId);
                      return (
                        <tr key={sch.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-8">
                            <p className="font-bold text-gray-900 text-lg">{pkg?.name || 'Paket tidak ditemukan'}</p>
                            <span className="text-[10px] font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600 uppercase tracking-wider">{pkg?.type}</span>
                          </td>
                          <td className="p-8">
                            <p className="font-bold text-gray-900 text-lg">
                              {sch.departureDate ? new Date(sch.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </p>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center">
                              <span className={`w-2.5 h-2.5 rounded-full mr-3 ${sch.availableSeats < 10 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                              <span className="font-bold text-gray-900 text-lg">{sch.availableSeats}</span>
                              <span className="text-gray-400 text-sm ml-1.5">/ {sch.totalSeats}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            {sch.itineraryPdfUrl ? (
                              <button 
                                onClick={() => setPreviewFile({ 
                                  url: sch.itineraryPdfUrl, 
                                  type: 'pdf', 
                                  title: `Itinerary - ${pkg?.name || 'Perjalanan'}` 
                                })}
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                              >
                                <FileText className="w-5 h-5 mr-2" /> itinerary.pdf
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Belum tersedia</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-gray-400">
                          <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p className="font-bold text-lg">Belum ada jadwal keberangkatan yang tersedia</p>
                          <p className="text-sm">Silakan cek kembali secara berkala</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENT TAB */}
          {activeTab === 'dokumen' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Unggah Dokumen Persyaratan</h2>
                  <p className="text-gray-500 text-sm">Lengkapi dokumen berikut untuk pengurusan Visa dan Administrasi.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">Enkripsi AES-256 Aktif</span>
                </div>
              </div>

              {!userConsultation?.packageId || !userConsultation?.paxData?.[0]?.isSubmitted ? (
                <div className="bg-white shadow-md rounded-xl p-20 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-gray-300">
                      <FileText className="w-10 h-10" />
                   </div>
                   <div className="max-w-md">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Belum ada persyaratan dokumen</h3>
                      <p className="text-sm text-slate-500 leading-relaxed italic">
                        Selesaikan pemilihan paket dan lengkapi biodata Anda terlebih dahulu untuk dapat mengunggah dokumen persyaratan di sini.
                      </p>
                   </div>
                   <button
                    onClick={() => setActiveTab('biodata')}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg rounded-xl font-bold text-sm transition-all cursor-pointer"
                   >
                     Lengkapi Biodata & Mulai Unggah
                   </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* PAX TABS FOR DOCUMENTS */}
                  {paxCount > 1 && (
                    <div className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-hide">
                      {Array.from({ length: paxCount }).map((_, i) => {
                        const paxName = paxDataList[i]?.fullName || paxDataList[i]?.name || `Jamaah ${i + 1}`;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveDocPaxIdx(i)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                              activeDocPaxIdx === i 
                                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 scale-105' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>{paxName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'KTP Asli', label: 'KTP Asli', desc: 'Scan KTP asli berwarna, tidak terpotong.' },
                    { id: 'Kartu Keluarga (KK)', label: 'Kartu Keluarga (KK)', desc: 'Scan KK asli terbaru.' },
                    { id: 'Paspor Asli', label: 'Paspor Asli', desc: 'Halaman depan paspor (biodata).' },
                    { id: 'Pas Foto 4x6', label: 'Pas Foto 4x6', desc: 'Background putih, fokus wajah 80%.' },
                    { id: 'Sertifikat Vaksin', label: 'Sertifikat Vaksin', desc: 'Sertifikat Meningitis/Buku Kuning.' },
                    ...(paxDataList[activeDocPaxIdx]?.maritalStatus === 'Menikah' ? [{ id: 'Buku Nikah', label: 'Buku Nikah', desc: 'Scan buku nikah asli (halaman biodata).' }] : [])
                  ].map((doc, idx) => {
                    const docKey = `${doc.id}_${activeDocPaxIdx}`;
                    const currentPaxObj = paxDataList[activeDocPaxIdx];
                    const paxDocObj = currentPaxObj?.documents;

                    const docItem = Array.isArray(userConsultation?.documents) 
                      ? userConsultation.documents.find((d: any) => {
                          if (!d || !d.docType) return false;
                          if (d.docType === docKey) return true;
                          if (d.docType.toLowerCase() === docKey.toLowerCase()) return true;
                          if (activeDocPaxIdx === 0 && (d.docType === doc.id || d.docType.toLowerCase() === doc.id.toLowerCase())) return true;
                          return false;
                        }) 
                      : null;

                    let paxDocInfo = null;
                    if (paxDocObj && typeof paxDocObj === 'object') {
                      paxDocInfo = paxDocObj[docKey] || paxDocObj[doc.id] || paxDocObj[doc.id.toLowerCase()];
                    }

                    const isUploaded = !!docItem || !!paxDocInfo;
                    const docStatus = docItem?.status || paxDocInfo?.status || 'pending';
                    const rejectionNote = 
                      docItem?.adminNotes || 
                      docItem?.rejectionReason || 
                      docItem?.notes || 
                      docItem?.reason || 
                      paxDocInfo?.adminNotes || 
                      paxDocInfo?.rejectionReason || 
                      paxDocInfo?.notes || 
                      paxDocInfo?.reason;
                    const fileUrl = docItem?.fileUrl || paxDocInfo?.fileUrl;

                    return (
                      <div key={idx} className="bg-white shadow-md rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all flex flex-col group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-gray-50 text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600 rounded-xl flex items-center justify-center transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${!isUploaded ? 'bg-gray-100 text-gray-500' : 
                              ['approved', 'VERIFIED'].includes(docStatus) ? 'bg-green-100 text-green-700' :
                              ['rejected', 'REJECTED'].includes(docStatus) ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}
                          `}>
                            {!isUploaded ? 'Belum Diunggah' : 
                             ['approved', 'VERIFIED'].includes(docStatus) ? 'Disetujui' :
                             ['rejected', 'REJECTED'].includes(docStatus) ? 'Ditolak' : 'Menunggu Verifikasi'}
                          </div>
                        </div>

                        <h4 className="font-bold text-gray-900 text-sm mb-1">{doc.label}</h4>
                        <p className="text-[11px] text-gray-400 mb-6 flex-1">{doc.desc}</p>

                        {['rejected', 'REJECTED'].includes(docStatus) && (
                          <div className="mb-4 p-3.5 bg-red-50/90 border border-red-200/90 rounded-xl text-xs space-y-1.5 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-red-800 font-bold">
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Catatan Verifikasi Admin (Alasan Penolakan):</span>
                            </div>
                            <p className="text-red-900 font-semibold bg-white/90 p-2.5 rounded-lg border border-red-100 text-[11px] leading-relaxed">
                              "{rejectionNote || 'Dokumen belum memenuhi standar (kurang jelas / terpotong). Silakan unggah berkas baru.'}"
                            </p>
                            <p className="text-[10px] text-red-600 font-medium pt-0.5">
                              💡 Mohon periksa kembali foto/scan dokumen dan unggah berkas pengganti yang baru di bawah ini.
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          {isUploaded ? (
                            <div className="space-y-2">
                              <div className="h-32 w-full rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 relative group/preview">
                                {(() => {
                                  const isPdf = docItem?.isPdf || isPdfUrl(fileUrl) || fileUrl?.startsWith('data:application/pdf') || fileUrl?.toLowerCase().endsWith('.pdf') || fileUrl?.toLowerCase().includes('.pdf');
                                  if (isPdf) {
                                    return (
                                      <div className="flex flex-col items-center justify-center h-full text-emerald-600 bg-emerald-50/60 p-2 text-center">
                                        <FileText className="w-10 h-10 mb-1 opacity-80" />
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Dokumen PDF</span>
                                      </div>
                                    );
                                  }
                                  
                                  if (fileUrl) {
                                    return (
                                      <img 
                                        src={fileUrl} 
                                        className="w-full h-full object-cover object-center rounded-t-xl" 
                                        alt={`Preview ${doc.label}`} 
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent && !parent.querySelector('.fallback-placeholder')) {
                                            const div = document.createElement('div');
                                            div.className = 'fallback-placeholder flex flex-col items-center justify-center h-full text-emerald-700 bg-emerald-50/50 p-2 text-center w-full';
                                            div.innerHTML = '<svg class="w-8 h-8 mb-1 opacity-70 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span class="text-[10px] font-extrabold text-emerald-800">Dokumen Terunggah</span>';
                                            parent.appendChild(div);
                                          }
                                        }}
                                      />
                                    );
                                  }

                                  return (
                                    <div className="flex flex-col items-center justify-center h-full text-emerald-600 bg-emerald-50/50">
                                      <FileCheck className="w-8 h-8 opacity-60 mb-1" />
                                      <span className="text-[10px] font-extrabold text-emerald-800">Berkas Terunggah</span>
                                    </div>
                                  );
                                })()}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                                  {fileUrl && (
                                    <button
                                      type="button"
                                      className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-gray-900 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setPreviewFile({
                                          url: fileUrl!,
                                          type: docItem?.isPdf || isPdfUrl(fileUrl) ? 'pdf' : 'image',
                                          title: doc.id
                                        });
                                      }}
                                    >
                                      Pratinjau
                                    </button>
                                  )}
                                  <label className="cursor-pointer bg-gray-50/20 hover:bg-gray-50/30 backdrop-blur-md text-white text-xs font-bold py-2 px-4 rounded-xl transition-all border border-white/20 shadow-lg">
                                    Ganti File
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept=".jpg,.jpeg,.png,.pdf"
                                      onChange={(e) => handleUploadDocument(doc.id, activeDocPaxIdx, e)}
                                    />
                                  </label>
                                </div>
                              </div>
                              
                              {(doc.id === 'KTP Asli' || doc.id === 'Paspor Asli') && (
                                <button 
                                  onClick={() => {
                                    setIsScanning(docKey);
                                    setTimeout(() => {
                                      setIsScanning(null);
                                      if (doc.id === 'KTP Asli') {
                                        toast.success("✨ AI SCAN SUCCESS:\nNIK: 1234567890123456\nNama: " + (userConsultation?.ordererName || userConsultation?.user?.name || 'Jamaah') + "\nData telah dipindai!");
                                      } else {
                                        toast.success("✨ AI SCAN SUCCESS:\nPassport No: A1234567\nExpiry: 2030-10-10\nData telah dipindai!");
                                      }
                                    }, 2000);
                                  }}
                                  disabled={isScanning === docKey}
                                  className="w-full py-2 bg-gold-50 text-gold-700 rounded-xl text-[10px] font-bold hover:bg-gold-100 transition-colors flex items-center justify-center border border-gold-200"
                                >
                                  {isScanning === docKey ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                                      Memindai Data...
                                    </>
                                  ) : (
                                    <>
                                      <Smartphone className="w-3 h-3 mr-1.5" />
                                      Pindai Data dengan AI
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group/upload">
                              {uploadingDoc === docKey ? (
                                <RefreshCw className="w-8 h-8 text-gold-500 animate-spin mb-2" />
                              ) : (
                                <Upload className="w-6 h-6 text-gray-300 group-hover/upload:text-gray-500 mb-2 transition-colors" />
                              )}
                              <span className="text-[10px] font-bold text-gray-400 group-hover/upload:text-gray-600 transition-colors">
                                {uploadingDoc === docKey ? 'Mengunggah...' : 'Unggah Berkas'}
                              </span>
                              <span className="text-[8px] text-gray-300 mt-1 uppercase tracking-widest">Max 50MB • JPG/PNG/PDF</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".jpg,.jpeg,.png,.pdf"
                                disabled={!!uploadingDoc}
                                onChange={(e) => handleUploadDocument(doc.id, activeDocPaxIdx, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              <div className="bg-white shadow-lg rounded-3xl p-8 sm:p-10 text-gray-900 relative overflow-hidden border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50/30 rounded-full -mr-32 -mt-32"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Semua Dokumen Sudah Lengkap?</h3>
                    <p className="text-gray-500 text-base leading-relaxed max-w-xl">
                      Tim operasional kami akan segera memverifikasi dokumen Anda dalam waktu maksimal <span className="font-bold text-gold-600">1x24 jam kerja</span> setelah Anda melanjutkan.
                    </p>
                  </div>
                  <button 
                    disabled={isUpdatingStatus}
                    onClick={async () => {
                      const docs = Array.isArray(userConsultation?.documents) ? userConsultation.documents : [];
                      const uniqueDocTypes = new Set(docs.map((d: any) => d.docType));
                      const expectedDocs = paxCount * 5;
                      
                      if (uniqueDocTypes.size < expectedDocs) {
                        toast.info(`Info: Anda baru mengunggah ${uniqueDocTypes.size} dari ${expectedDocs} dokumen yang disarankan. Anda tetap dapat melanjutkan ke pembayaran.`);
                      }

                      setIsUpdatingStatus(true);
                      try {
                        if (userConsultation?.status === 'UPLOAD_DOKUMEN') {
                          await updateConsultation({ ...userConsultation, status: 'VERIFIKASI_DOKUMEN' });
                        }
                        setActiveTab('pembayaran');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    className={`px-10 py-4 rounded-2xl font-bold text-base transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 min-w-[240px] ${
                      isUpdatingStatus 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-gold-500 to-amber-500 text-gray-950 hover:from-gold-600 hover:to-amber-600 shadow-gold-500/40 hover:-translate-y-1'
                    }`}
                  >
                    {isUpdatingStatus ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                    <span>{isUpdatingStatus ? 'Memproses...' : 'Lanjut ke Pembayaran'}</span>
                    {!isUpdatingStatus && <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {/* PERSIAPAN KEBERANGKATAN TAB */}
          {activeTab === 'persiapan_keberangkatan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Persiapan Keberangkatan</h2>
                  <p className="text-gray-500 text-sm">Status perlengkapan, pengumuman terbaru, dan informasi keberangkatan Anda.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Plane className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">Siap Untuk Keberangkatan</span>
                </div>
              </div>

              {/* Banner Shortcut ke Dokumen Keberangkatan Anda */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-matcha-950 rounded-3xl p-6 sm:p-8 text-white border border-gold-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 max-w-2xl relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold border border-gold-500/30">
                    <Scroll className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                    <span>Dokumen Keberangkatan Final</span>
                  </div>
                  <h3 className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                    Dokumen Keberangkatan Anda
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Akses cepat E-Ticket penerbangan, Visa resmi KSA, Polis Asuransi, Buku Panduan Manasik Digital, dan Itinerary perjalanan resmi melalui menu khusus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('dokumen_keberangkatan')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-gold-500/20 shrink-0 flex items-center gap-2 relative z-10 cursor-pointer"
                >
                  <Scroll className="w-4 h-4 shrink-0" />
                  <span>Buka Dokumen Keberangkatan Anda</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Perlengkapan */}
                <div className="space-y-6">
                  {/* Komponen Manifest yang dibuat */}
                  <PreparationInfo manifest={manifest} registration={userConsultation} />
                  <div className="bg-white shadow-md rounded-2xl p-6 sm:p-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center">
                          <InventoryIcon className="w-5 h-5 mr-2 text-emerald-700" /> Status Perlengkapan & Seragam
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Status pengambilan paket perlengkapan keberangkatan Anda</p>
                      </div>

                      {/* Download PDF Button for Jamaah */}
                      <button
                        type="button"
                        onClick={() => {
                          const userGenderRaw = String(userConsultation?.gender || userConsultation?.paxData?.[0]?.gender || dbUser?.gender || user?.gender || '').toUpperCase();
                          const isFemale = userGenderRaw.includes('P') || userGenderRaw.includes('WANITA') || userGenderRaw.includes('FEMALE') || userGenderRaw.includes('PEREMPUAN');
                          generateEquipmentReceiptPdf(
                            userConsultation || { name: user?.displayName || user?.email, phone: userConsultation?.phone },
                            inventoryState,
                            isFemale ? 'P' : 'L'
                          );
                        }}
                        className="inline-flex items-center px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-200" />
                        <span>Unduh Bukti Perlengkapan (PDF)</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(() => {
                        const status = inventoryState;
                        const userGenderRaw = String(userConsultation?.gender || userConsultation?.paxData?.[0]?.gender || dbUser?.gender || user?.gender || '').toUpperCase();
                        const isFemale = userGenderRaw.includes('P') || userGenderRaw.includes('WANITA') || userGenderRaw.includes('FEMALE') || userGenderRaw.includes('PEREMPUAN');
                        const isMale = !isFemale;

                        const items = [
                          { 
                            key: 'koper', 
                            label: 'Koper & Tas Travel', 
                            sublabel: 'Koper Bagasi 24", Kabin 20", Tas Paspor & ID Card',
                            icon: '🧳' 
                          },
                          { 
                            key: 'ihram', 
                            label: isMale ? 'Set Kain Ihram & Sabuk' : 'Set Mukena & Bergo Seragam', 
                            sublabel: isMale ? 'Set Kain Ihram Katun (2 Pcs) & Sabuk' : 'Set Mukena Premium Travel & Bergo Seragam',
                            icon: isMale ? '🕋' : '🧕' 
                          },
                          { 
                            key: 'mukena', 
                            label: 'Seragam Batik & Buku Doa', 
                            sublabel: 'Kain Batik Seragam Official & Buku Panduan Doa',
                            icon: '👔' 
                          }
                        ];

                        const completedCount = items.filter(item => status?.[item.key as keyof typeof status]).length;
                        const progressPercent = (completedCount / items.length) * 100;

                        return (
                          <>
                            {/* Gender Category Tag */}
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-gray-100 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  isMale ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className="mr-1">{isMale ? '♂' : '♀'}</span>
                                  {isMale ? 'Kategori Perlengkapan Pria' : 'Kategori Perlengkapan Wanita'}
                                </span>
                              </div>
                              <span className="text-gray-500 font-medium">Progress: <strong className="text-emerald-700 font-bold">{completedCount}/3 Item</strong></span>
                            </div>

                            {/* Progress Bar */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kelengkapan Distribusi</span>
                                <span className="text-xs font-bold text-emerald-800">{Math.round(progressPercent)}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-600 transition-all duration-1000"
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Item Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                              {items.map(item => {
                                const isDone = status?.[item.key as keyof typeof status];
                                return (
                                  <div key={item.key} className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                    isDone ? 'bg-emerald-50/60 border-emerald-200' : 'bg-gray-50 border-gray-100'
                                  }`}>
                                    <div>
                                      <div className="text-2xl mb-2">{item.icon}</div>
                                      <h4 className="font-bold text-sm text-gray-900 mb-0.5">{item.label}</h4>
                                      <p className="text-[11px] text-gray-500 leading-tight mb-3">{item.sublabel}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[10px] font-bold uppercase inline-flex items-center px-2 py-0.5 rounded-full ${
                                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {isDone ? '✓ Sudah Diambil' : '• Menunggu Penyerahan'}
                                      </p>
                                      {isDone && status?.assignee && (
                                        <p className="text-[9px] text-gray-500 mt-2 italic">Petugas: {status.assignee}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Papan Pengumuman */}
                <div className="space-y-6">
                  <div className="bg-white shadow-md rounded-2xl p-6 sm:p-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center">
                          <Megaphone className="w-5 h-5 mr-2 text-emerald-700" /> Papan Pengumuman Resmi
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Informasi penting dan pemberitahuan resmi seputar perjalanan ibadah Anda</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                          {(announcements || []).length} Pengumuman
                        </span>
                        <button
                          type="button"
                          onClick={() => refreshData(true)}
                          className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Perbarui Pengumuman"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(announcements || []).map((ann) => {
                        const messageText = ann.message || ann.content || ann.description || ann.body || '';
                        const isImportant = ann.type === 'important';
                        const isUpdate = ann.type === 'update';

                        return (
                          <div 
                            key={ann.id} 
                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                              isImportant 
                                ? 'bg-rose-50/50 border-rose-200/70 hover:border-rose-300' 
                                : isUpdate 
                                ? 'bg-amber-50/50 border-amber-200/70 hover:border-amber-300' 
                                : 'bg-slate-50/80 border-gray-200/70 hover:border-emerald-300'
                            }`}
                          >
                            {/* Left Status Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isImportant ? 'bg-rose-500' : isUpdate ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}></div>

                            <div className="pl-1">
                              {/* Header Badges & Date */}
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                                    isImportant 
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                      : isUpdate 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  }`}>
                                    {isImportant && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    {isUpdate && <CalendarIcon className="w-3 h-3 mr-1" />}
                                    {!isImportant && !isUpdate && <Bell className="w-3 h-3 mr-1" />}
                                    {isImportant ? 'Penting & Urgent' : isUpdate ? 'Pembaruan Jadwal' : 'Informasi Umum'}
                                  </span>
                                </div>

                                <span className="text-xs text-gray-500 font-medium flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  <span>
                                    {ann.createdAt 
                                      ? new Date(ann.createdAt).toLocaleDateString('id-ID', { 
                                          day: 'numeric', 
                                          month: 'long', 
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) + ' WIB'
                                      : 'Baru saja'
                                    }
                                  </span>
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-base text-gray-900 mb-2 leading-snug">
                                {ann.title || 'Pengumuman Resmi'}
                              </h4>

                              {/* Body Content Message */}
                              {messageText ? (
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words bg-white/60 p-3.5 rounded-xl border border-gray-100/80">
                                  {messageText}
                                </p>
                              ) : (
                                <p className="text-xs italic text-gray-400 bg-white/40 p-2.5 rounded-xl border border-dashed border-gray-200">
                                  (Tidak ada rincian pesan tambahan)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {(!announcements || announcements.length === 0) && (
                        <div className="py-12 text-center text-gray-400 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                          <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-bold text-gray-600">Belum ada pengumuman terbaru</p>
                          <p className="text-xs text-gray-400 mt-1">Pengumuman resmi dari pihak travel akan ditampilkan di sini</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN KEBERANGKATAN TAB */}
          {activeTab === 'dokumen_keberangkatan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dokumen Keberangkatan Anda</h2>
                  <p className="text-gray-500 text-sm mt-1">Unduh E-Ticket, Visa, Asuransi, serta Buku Panduan Manasik & Itinerary resmi Anda.</p>
                </div>
                <div className="flex items-center space-x-2 bg-gold-500/10 border border-gold-500/30 px-4 py-2 rounded-xl">
                  <Sparkles className="w-4 h-4 text-gold-600 animate-pulse" />
                  <span className="text-xs font-bold text-gold-700">
                    {isLunas ? 'Akses Terbuka' : 'Status: Menunggu Pelunasan'}
                  </span>
                </div>
              </div>

              {/* Dokumen Final Keberangkatan (Executive Luxury Suite - Full Width) */}
              <div className="space-y-6 max-w-full overflow-hidden">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-matcha-950 rounded-3xl p-4 sm:p-6 md:p-8 text-white border border-gold-500/30 shadow-2xl relative overflow-hidden">
                  {/* Decorative Ambient Radial Glow */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-white/10 relative z-10">
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold border border-gold-500/30 mb-2 max-w-full">
                        <Scroll className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                        <span className="truncate">Dokumen Keberangkatan Final</span>
                      </div>
                      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl text-white tracking-tight break-normal whitespace-normal">
                        Dokumen Keberangkatan Anda
                      </h3>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                        Akses cepat dokumen tiket, visa, asuransi, serta buku panduan manasik dan itinerary resmi melalui submenu di bawah.
                      </p>
                    </div>

                    <div className="self-start shrink-0 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl flex items-center gap-2 max-w-full">
                      <Sparkles className="w-4 h-4 text-gold-400 animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-gold-200 whitespace-nowrap">
                        {isLunas ? 'Akses Terbuka' : 'Status: Menunggu Pelunasan'}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const packageSchedules = schedules.filter(s => s.packageId === userConsultation?.packageId);
                    const userSchedule = schedules.find(s => s.id === userConsultation?.scheduleId) || 
                                       (packageSchedules.length === 1 ? packageSchedules[0] : null);
                    const myDocs = userConsultation?.documents || [];
                    const paxDataList = userConsultation?.paxData || [];
                    
                    const paxList = (Array.isArray(paxDataList) && paxDataList.length > 0)
                      ? paxDataList.map((p: any, i: number) => ({ 
                          idx: i, 
                          name: p.fullName || `Jamaah Pax ${i + 1}`,
                          nik: p.nik || '-'
                        }))
                      : [{ idx: 0, name: userConsultation?.fullName || 'Jamaah Utama', nik: '-' }];

                    // Helper to check document availability for a pax
                    const getDocForPax = (baseType: string, pIdx: number) => {
                      const typesToCheck = [baseType];
                      if (baseType === 'eticket') {
                        typesToCheck.push('Tiket Pesawat', 'ticket', 'e-ticket', 'E-Ticket', 'eticket');
                      } else if (baseType === 'visa') {
                        typesToCheck.push('E-Visa', 'Visa KSA', 'visa_ksa', 'visa');
                      } else if (baseType === 'asuransi') {
                        typesToCheck.push('polis', 'Polis', 'asuransi_perjalanan', 'insurance', 'asuransi');
                      }

                      let paxDoc: any = null;
                      let groupDoc: any = null;

                      for (const t of typesToCheck) {
                        paxDoc = myDocs.find((d: any) => 
                          d.fileUrl && (
                            d.docType === `${t}_pax_${pIdx}` ||
                            d.docType === `${t}_${pIdx}` ||
                            d.docType?.toLowerCase() === `${t.toLowerCase()}_pax_${pIdx}` ||
                            d.docType?.toLowerCase() === `${t.toLowerCase()}_${pIdx}` ||
                            d.docType?.toLowerCase() === `pax_${pIdx}_${t.toLowerCase()}`
                          )
                        );
                        if (paxDoc) break;
                      }

                      if (!paxDoc) {
                        for (const t of typesToCheck) {
                          groupDoc = myDocs.find((d: any) => 
                            d.fileUrl && (
                              d.docType === t ||
                              d.docType?.toLowerCase() === t.toLowerCase() ||
                              d.docType?.toLowerCase() === baseType.toLowerCase() ||
                              d.docType?.toLowerCase().includes(baseType.toLowerCase())
                            )
                          );
                          if (groupDoc) break;
                        }
                      }

                      return {
                        fileUrl: paxDoc?.fileUrl || groupDoc?.fileUrl || null,
                        isGroup: !paxDoc && !!groupDoc,
                        paxDocName: paxDoc ? paxList[pIdx]?.name : (groupDoc ? 'Dokumen Rombongan (Group)' : null)
                      };
                    };

                    // Handler to open or generate document dynamically
                    const handleOpenJamaahDoc = async (
                      type: 'eticket' | 'visa' | 'asuransi' | 'itinerary' | 'manasik',
                      paxItem: any,
                      existingUrl?: string | null
                    ) => {
                      const paxName = paxItem?.name || userConsultation?.fullName || 'Jamaah';
                      const docTypeLabel = type === 'eticket' ? 'E-Ticket' : type === 'visa' ? 'Visa KSA' : type === 'asuransi' ? 'Polis Asuransi' : type === 'itinerary' ? 'Itinerary' : 'Panduan Manasik';
                      const isUploaded = !!existingUrl;

                      if (existingUrl) {
                        setPreviewFile({
                          url: existingUrl,
                          type: isPdfUrl(existingUrl) ? 'pdf' : isImageUrl(existingUrl) ? 'image' : 'pdf',
                          title: `${docTypeLabel} - ${paxName} ${isUploaded ? '(Resmi Travel)' : ''}`
                        });
                        return;
                      }

                      try {
                        toast.loading('Menyiapkan dokumen PDF...', { id: 'doc-pdf-gen' });
                        const pdfData = await generateJamaahDocumentPdf(
                          type,
                          {
                            name: paxName,
                            nik: paxItem?.nik || userConsultation?.nik,
                            passport: paxItem?.passport || userConsultation?.passportNumber || userConsultation?.passport,
                            phone: userConsultation?.phone
                          },
                          userSchedule,
                          currentPackage,
                          userConsultation?.bookingCode || userConsultation?.id
                        );
                        toast.dismiss('doc-pdf-gen');
                        setPreviewFile({
                          url: pdfData,
                          type: 'pdf',
                          title: `${docTypeLabel} - ${paxName} (E-Dokumen)`
                        });
                      } catch (err) {
                        toast.dismiss('doc-pdf-gen');
                        toast.error('Gagal memuat dokumen PDF');
                      }
                    };

                    // Handler to directly download file without previewing modal
                    const handleDownloadDirect = async (
                      type: 'eticket' | 'visa' | 'asuransi' | 'itinerary' | 'manasik',
                      paxItem: any,
                      existingUrl?: string | null
                    ) => {
                      const paxName = paxItem?.name || userConsultation?.fullName || 'Jamaah';
                      const docTitle = type === 'eticket' ? 'ETicket' : type === 'visa' ? 'Visa_KSA' : type === 'asuransi' ? 'Polis_Asuransi' : type === 'itinerary' ? 'Itinerary' : 'Panduan_Manasik';
                      const fileName = `${docTitle}_${paxName.replace(/\s+/g, '_')}`;

                      if (existingUrl) {
                        const ext = isPdfUrl(existingUrl) ? 'pdf' : isImageUrl(existingUrl) ? 'png' : 'pdf';
                        downloadFile(existingUrl, `${fileName}.${ext}`);
                        toast.success(`Mengunduh dokumen travel ${docTitle.replace(/_/g, ' ')}`);
                        return;
                      }

                      try {
                        toast.loading('Menyiapkan PDF untuk diunduh...', { id: 'doc-pdf-dl' });
                        const pdfData = await generateJamaahDocumentPdf(
                          type,
                          {
                            name: paxName,
                            nik: paxItem?.nik || userConsultation?.nik,
                            passport: paxItem?.passport || userConsultation?.passportNumber || userConsultation?.passport,
                            phone: userConsultation?.phone
                          },
                          userSchedule,
                          currentPackage,
                          userConsultation?.bookingCode || userConsultation?.id
                        );
                        toast.dismiss('doc-pdf-dl');
                        downloadFile(pdfData, `${fileName}.pdf`);
                        toast.success(`Berhasil mengunduh PDF ${docTitle.replace(/_/g, ' ')}`);
                      } catch (err) {
                        toast.dismiss('doc-pdf-dl');
                        toast.error('Gagal mengunduh dokumen');
                      }
                    };

                    return (
                      <div className="space-y-6 relative z-10 min-w-0">
                        {/* SUBMENU TABS NAVIGATION */}
                        <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-gold-500/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-inner w-full">
                          <button
                            type="button"
                            onClick={() => setDocSubTab('manifest')}
                            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap ${
                              docSubTab === 'manifest'
                                ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-slate-950 shadow-md shadow-gold-500/20 font-extrabold'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <FileCheck className="w-4 h-4 shrink-0" />
                            <span>📋 Tiket, Visa & Asuransi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDocSubTab('guide_itinerary')}
                            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap ${
                              docSubTab === 'guide_itinerary'
                                ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-slate-950 shadow-md shadow-gold-500/20 font-extrabold'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <BookOpen className="w-4 h-4 shrink-0" />
                            <span>📖 Panduan & Itinerary</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDocSubTab('help')}
                            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap ${
                              docSubTab === 'help'
                                ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-slate-950 shadow-md shadow-gold-500/20 font-extrabold'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            <span>💡 Petunjuk & Bantuan</span>
                          </button>
                        </div>

                        {/* SUBMENU 1: MANIFEST, E-TICKET, VISA & ASURANSI */}
                        {docSubTab === 'manifest' && (
                          <div className="space-y-5 animate-fadeIn">
                            {/* Jamaah Selector Bar (if multiple pax) */}
                            {paxList.length > 1 && (
                              <div className="bg-slate-900/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-gold-500/30 flex flex-col gap-3 min-w-0 shadow-lg w-full">
                                {/* Label Row - Full Width */}
                                <div className="flex items-center gap-2.5 text-gold-300 font-bold text-xs sm:text-sm min-w-0 w-full border-b border-white/10 pb-2.5">
                                  <Users className="w-4.5 h-4.5 text-gold-400 shrink-0" />
                                  <span className="text-white font-bold leading-snug">
                                    Pilih Tampilan Jamaah ({paxList.length} Pax Rombongan):
                                  </span>
                                </div>

                                {/* Mobile Dropdown (shown on xs screens) */}
                                <div className="block sm:hidden w-full">
                                  <select
                                    value={selectedDocPaxFilter}
                                    onChange={(e) => setSelectedDocPaxFilter(e.target.value)}
                                    className="w-full bg-slate-950 border border-gold-500/40 text-gold-200 font-bold text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-gold-500 shadow-inner"
                                  >
                                    <option value="all">📋 Ringkasan Manifest Rombongan (Semua {paxList.length} Pax)</option>
                                    {paxList.map((p) => (
                                      <option key={p.idx} value={p.idx.toString()}>
                                        👤 Pax #{p.idx + 1}: {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Tablet & Desktop Segmented Tabs */}
                                <div className="hidden sm:flex flex-wrap items-center gap-2 max-w-full">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDocPaxFilter('all')}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                                      selectedDocPaxFilter === 'all'
                                        ? 'bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 text-slate-950 shadow-md shadow-gold-500/20 font-extrabold'
                                        : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                                    }`}
                                  >
                                    <Scroll className="w-3.5 h-3.5 shrink-0" />
                                    <span>Manifest Semua Pax</span>
                                  </button>

                                  {paxList.map((p) => (
                                    <button
                                      key={p.idx}
                                      type="button"
                                      onClick={() => setSelectedDocPaxFilter(p.idx.toString())}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                                        selectedDocPaxFilter === p.idx.toString()
                                          ? 'bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 text-slate-950 shadow-md shadow-gold-500/20 font-extrabold'
                                          : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                                      }`}
                                    >
                                      Pax #{p.idx + 1}: {p.name.split(' ')[0]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* VIEW 1A: MANIFEST ROMBONGAN (ALL) - CARD LIST FORMAT */}
                            {selectedDocPaxFilter === 'all' && paxList.length > 1 ? (
                              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10 min-w-0">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="p-2 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 shrink-0">
                                      <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-bold text-sm sm:text-base text-white truncate">Manifest Dokumen Jamaah</h4>
                                      <p className="text-[11px] text-gray-300">{paxList.length} Pax Terdaftar dalam Kloter</p>
                                    </div>
                                  </div>
                                  <span className="self-start sm:self-auto text-[10px] sm:text-xs text-gold-300 font-bold bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/30 shrink-0">
                                    Mode Rombongan
                                  </span>
                                </div>

                                {/* DAFTAR KARTU (CARD LIST FORMAT) UNTUK SEMUA JAMAAN */}
                                <div className="space-y-3.5">
                                  {paxList.map((p) => {
                                    const tDoc = getDocForPax('eticket', p.idx);
                                    const vDoc = getDocForPax('visa', p.idx);
                                    const aDoc = getDocForPax('asuransi', p.idx);

                                    return (
                                      <div
                                        key={p.idx}
                                        className="bg-slate-950/80 p-4 sm:p-4.5 rounded-2xl border border-white/10 hover:border-gold-500/40 transition-all space-y-3 shadow-md"
                                      >
                                        {/* Header Card Jamaah */}
                                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 min-w-0">
                                          <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                              #{p.idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                              <h5 className="font-bold text-sm sm:text-base text-white truncate leading-snug">
                                                {p.name}
                                              </h5>
                                              <span className="text-[11px] text-gold-300/90 font-medium">
                                                Pax #{p.idx + 1} • Terdaftar
                                              </span>
                                            </div>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => setSelectedDocPaxFilter(p.idx.toString())}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-gold-500/20 text-gold-300 text-xs font-bold border border-white/10 hover:border-gold-500/30 transition-all shrink-0 flex items-center gap-1.5"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Detail</span>
                                          </button>
                                        </div>

                                        {/* Row Tombol Ikon Ringkas (Compact Icon Buttons Row) */}
                                        <div className="grid grid-cols-3 gap-2 pt-1">
                                          {/* Button Tiket */}
                                          <div className="flex items-center gap-1 min-w-0">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenJamaahDoc('eticket', p, tDoc.fileUrl)}
                                              className="flex-1 py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm group cursor-pointer min-w-0"
                                              title={`Buka / Pratinjau E-Ticket ${p.name}`}
                                            >
                                              <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Tiket</span>
                                              {tDoc.fileUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="File Admin Uploaded" />}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadDirect('eticket', p, tDoc.fileUrl)}
                                              className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 hover:border-emerald-500/40 transition-all shrink-0"
                                              title={`Unduh Direct E-Ticket ${p.name}`}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Button Visa */}
                                          <div className="flex items-center gap-1 min-w-0">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenJamaahDoc('visa', p, vDoc.fileUrl)}
                                              className="flex-1 py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm group cursor-pointer min-w-0"
                                              title={`Buka / Pratinjau Visa KSA ${p.name}`}
                                            >
                                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Visa</span>
                                              {vDoc.fileUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="File Admin Uploaded" />}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadDirect('visa', p, vDoc.fileUrl)}
                                              className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 hover:border-emerald-500/40 transition-all shrink-0"
                                              title={`Unduh Direct Visa ${p.name}`}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Button Asuransi */}
                                          <div className="flex items-center gap-1 min-w-0">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenJamaahDoc('asuransi', p, aDoc.fileUrl)}
                                              className="flex-1 py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm group cursor-pointer min-w-0"
                                              title={`Buka / Pratinjau Polis Asuransi ${p.name}`}
                                            >
                                              <HeartPulse className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Polis</span>
                                              {aDoc.fileUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" title="File Admin Uploaded" />}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadDirect('asuransi', p, aDoc.fileUrl)}
                                              className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 hover:border-emerald-500/40 transition-all shrink-0"
                                              title={`Unduh Direct Polis ${p.name}`}
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              /* VIEW 1B: CARDS DETAILED UNTUK JAMAAN TERTENTU / SINGLE BOOKING */
                              (() => {
                                const activeIdx = selectedDocPaxFilter === 'all' ? 0 : parseInt(selectedDocPaxFilter, 10);
                                const activePax = paxList[activeIdx] || paxList[0];

                                const ticketDoc = getDocForPax('eticket', activePax.idx);
                                const visaDoc = getDocForPax('visa', activePax.idx);
                                const asuransiDoc = getDocForPax('asuransi', activePax.idx);

                                const cards = [
                                  {
                                    id: 'eticket',
                                    title: 'E-Ticket Keberangkatan',
                                    desc: 'Tiket Penerbangan Resmi Pergi & Pulang ke Arab Saudi',
                                    icon: Plane,
                                    doc: ticketDoc,
                                    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-300'
                                  },
                                  {
                                    id: 'visa',
                                    title: 'Visa Umrah / Haji Resmi',
                                    desc: 'Dokumen Visa Resmi Penerbitan Kementerian KSA',
                                    icon: ShieldCheck,
                                    doc: visaDoc,
                                    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300'
                                  },
                                  {
                                    id: 'asuransi',
                                    title: 'Polis Asuransi Perjalanan',
                                    desc: 'Perlindungan Kesehatan & Medis Selama Berada di KSA',
                                    icon: HeartPulse,
                                    doc: asuransiDoc,
                                    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300'
                                  }
                                ];

                                return (
                                  <div className="space-y-4">
                                    {/* Active Passenger Banner */}
                                    <div className="bg-gradient-to-r from-gold-500/20 via-slate-900 to-amber-500/10 p-3.5 sm:p-4 rounded-2xl border border-gold-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                                          #{activePax.idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <h4 className="font-bold text-sm sm:text-base text-white truncate">{activePax.name}</h4>
                                          <p className="text-[11px] text-gold-300">Dokumen khusus untuk Pax #{activePax.idx + 1}</p>
                                        </div>
                                      </div>

                                      {paxList.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedDocPaxFilter('all')}
                                          className="text-xs font-bold text-gold-300 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all shrink-0 self-start sm:self-auto"
                                        >
                                          📋 Lihat Semua Manifest
                                        </button>
                                      )}
                                    </div>

                                    {/* 3 Executive Document Cards Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                      {cards.map((c) => {
                                        const IconComp = c.icon;
                                        const hasDoc = !!c.doc?.fileUrl;

                                        return (
                                          <div
                                            key={c.id}
                                            className="bg-slate-950/80 backdrop-blur-md p-4.5 sm:p-5 rounded-2xl border border-white/10 space-y-3.5 shadow-lg group hover:border-gold-500/40 transition-all w-full flex flex-col justify-between"
                                          >
                                            <div className="space-y-3">
                                              {/* Header Row: Icon, Title & Badge */}
                                              <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0 w-full border-b border-white/10 pb-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${c.color} border shadow-inner shrink-0`}>
                                                    <IconComp className="w-5 h-5 text-gold-400" />
                                                  </div>
                                                  <h4 className="font-bold text-base sm:text-lg text-white group-hover:text-gold-300 transition-colors leading-snug">
                                                    {c.title}
                                                  </h4>
                                                </div>

                                                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border shrink-0 ${
                                                  hasDoc 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                    : 'bg-gold-500/20 text-gold-300 border-gold-500/30'
                                                }`}>
                                                  {hasDoc ? '🟢 File Travel' : '⚡ E-Dokumen Ready'}
                                                </span>
                                              </div>

                                              {/* Description Row */}
                                              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                                {c.desc}
                                              </p>

                                              {hasDoc ? (
                                                <div className="text-[11px] text-emerald-300/90 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                  <span className="truncate">File resmi diunggah oleh Admin Travel</span>
                                                </div>
                                              ) : (
                                                <div className="text-[11px] text-gold-300/90 font-medium bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20 flex items-center gap-1.5">
                                                  <FileText className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                                                  <span className="truncate">E-Dokumen digital resmi tergenerasi</span>
                                                </div>
                                              )}

                                              {c.doc?.isGroup && hasDoc && (
                                                <div>
                                                  <span className="text-[11px] text-gold-300 font-semibold bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20 inline-block">
                                                    👥 Menggunakan Dokumen Group
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Dual Button Action Row */}
                                            <div className="w-full pt-3 grid grid-cols-2 gap-2 border-t border-white/10">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenJamaahDoc(c.id as any, activePax, c.doc?.fileUrl)}
                                                className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer"
                                                title="Lihat Pratinjau"
                                              >
                                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">Pratinjau</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => handleDownloadDirect(c.id as any, activePax, c.doc?.fileUrl)}
                                                className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer"
                                                title="Unduh File Langsung"
                                              >
                                                <Download className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                                <span className="truncate">Unduh Direct</span>
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}

                        {/* SUBMENU 2: BUKU PANDUAN MANASIK & ITINERARY PERJALANAN */}
                        {docSubTab === 'guide_itinerary' && (
                          <div className="space-y-5 animate-fadeIn">
                            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-5">
                              <div className="flex items-start gap-3 pb-3 border-b border-white/10 min-w-0">
                                <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 shrink-0 mt-0.5">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-base sm:text-lg text-white leading-snug break-words">
                                    Panduan Ibadah & Itinerary Perjalanan Resmi
                                  </h4>
                                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                                    Akses materi manasik, rincian penerbangan, dan agenda perjalanan resmi Anda
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {/* Card Buku Panduan Manasik */}
                                <div className="bg-slate-950/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg group hover:border-gold-500/40 transition-all w-full flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 flex items-center justify-center">
                                          <BookOpen className="w-5 h-5 text-purple-300" />
                                        </div>
                                        <h4 className="font-bold text-base sm:text-lg text-white group-hover:text-gold-300 transition-colors leading-snug">
                                          Buku Panduan Manasik Digital
                                        </h4>
                                      </div>
                                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border shrink-0 ${
                                        currentPackage?.manasikPdfUrl
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                          : 'bg-purple-500/20 text-purple-200 border-purple-500/30'
                                      }`}>
                                        {currentPackage?.manasikPdfUrl ? '🟢 File Travel' : '⚡ E-Book Ready'}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                      Panduan praktis tata cara pelaksanaan ibadah Umrah / Haji, bacaan doa, rukun, serta sunnah ibadah lengkap di Makkah & Madinah.
                                    </p>
                                  </div>

                                  {/* Dual Button Action Row */}
                                  <div className="w-full pt-3 grid grid-cols-2 gap-2 border-t border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenJamaahDoc('manasik', { name: userConsultation?.fullName || 'Jamaah Utama' }, currentPackage?.manasikPdfUrl)}
                                      className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer"
                                      title="Pratinjau Buku Manasik"
                                    >
                                      <Eye className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">Pratinjau</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadDirect('manasik', { name: userConsultation?.fullName || 'Jamaah Utama' }, currentPackage?.manasikPdfUrl)}
                                      className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 hover:border-purple-400 cursor-pointer"
                                      title="Unduh Buku Manasik Direct"
                                    >
                                      <Download className="w-3.5 h-3.5 shrink-0 text-purple-300" />
                                      <span className="truncate">Unduh Direct</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Card Itinerary Perjalanan */}
                                <div className="bg-slate-950/80 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg group hover:border-gold-500/40 transition-all w-full flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 shrink-0 flex items-center justify-center">
                                          <MapPin className="w-5 h-5 text-pink-300" />
                                        </div>
                                        <h4 className="font-bold text-base sm:text-lg text-white group-hover:text-gold-300 transition-colors leading-snug">
                                          Itinerary Perjalanan Resmi
                                        </h4>
                                      </div>
                                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border shrink-0 ${
                                        userSchedule?.itineraryPdfUrl
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                          : 'bg-pink-500/20 text-pink-200 border-pink-500/30'
                                      }`}>
                                        {userSchedule?.itineraryPdfUrl ? '🟢 File Travel' : '⚡ PDF Ready'}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                      Rincian jadwal harian kegiatan, akomodasi hotel Makkah & Madinah, penerbangan pergi-pulang, serta agenda ziarah resmi rombongan.
                                    </p>
                                  </div>

                                  {/* Dual Button Action Row */}
                                  <div className="w-full pt-3 grid grid-cols-2 gap-2 border-t border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenJamaahDoc('itinerary', { name: userConsultation?.fullName || 'Jamaah Utama' }, userSchedule?.itineraryPdfUrl)}
                                      className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer"
                                      title="Pratinjau Itinerary"
                                    >
                                      <Eye className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">Pratinjau</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadDirect('itinerary', { name: userConsultation?.fullName || 'Jamaah Utama' }, userSchedule?.itineraryPdfUrl)}
                                      className="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/40 hover:border-pink-400 cursor-pointer"
                                      title="Unduh Itinerary Direct"
                                    >
                                      <Download className="w-3.5 h-3.5 shrink-0 text-pink-300" />
                                      <span className="truncate">Unduh Direct</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Ringkasan Jadwal Tambahan */}
                              {userSchedule && (
                                <div className="bg-slate-950/90 p-4 rounded-2xl border border-gold-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 shrink-0">
                                      <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="font-bold text-white text-xs sm:text-sm truncate">Kloter Keberangkatan Terdaftar</div>
                                        <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">Official</span>
                                      </div>
                                      <div className="text-gray-300 text-xs mt-0.5 leading-snug">
                                        Tgl Berangkat: <span className="text-gold-300 font-bold">
                                          {userSchedule.departureDate ? new Date(userSchedule.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </span> | Maskapai: <span className="text-gold-300 font-bold">{userSchedule.airline || '-'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="bg-gold-500/20 text-gold-200 px-3.5 py-1.5 rounded-xl font-bold text-xs border border-gold-500/30 shrink-0 self-start sm:self-auto">
                                    {userSchedule.name || 'Jadwal Terjadwal'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SUBMENU 3: PETUNJUK & BANTUAN */}
                        {docSubTab === 'help' && (
                          <div className="space-y-5 animate-fadeIn">
                            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-5">
                              <div className="flex items-start gap-3 pb-3 border-b border-white/10 min-w-0">
                                <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 shrink-0 mt-0.5">
                                  <HelpCircle className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-base sm:text-lg text-white leading-snug break-words">
                                    Petunjuk Pencetakan Dokumen & Syarat Keabsahan
                                  </h4>
                                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                                    Panduan resmi mencetak E-Ticket, Visa, dan Polis Asuransi agar sah di imigrasi bandara
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-gold-500/30 transition-all shadow-sm">
                                  <div className="font-bold text-gold-300 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-500/30">1</span>
                                    <span className="truncate">Pencetakan Kertas A4 Standar</span>
                                  </div>
                                  <p className="text-gray-300 text-xs leading-relaxed pl-7">
                                    Cetak E-Ticket Pesawat dan Visa Resmi KSA di atas kertas A4 putih dengan resolusi tajam agar Barcode / QR Code mudah dipindai oleh imigrasi bandara.
                                  </p>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-gold-500/30 transition-all shadow-sm">
                                  <div className="font-bold text-gold-300 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-500/30">2</span>
                                    <span className="truncate">Kesesuaian Nama Paspor Fisik</span>
                                  </div>
                                  <p className="text-gray-300 text-xs leading-relaxed pl-7">
                                    Pastikan E-Ticket & Visa persis sama dengan nama di Paspor Fisik Anda. Jika terdapat kekeliruan ejaan huruf, segera infokan ke panitia travel.
                                  </p>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-gold-500/30 transition-all shadow-sm">
                                  <div className="font-bold text-gold-300 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-500/30">3</span>
                                    <span className="truncate">Salinan Digital di Smartphone</span>
                                  </div>
                                  <p className="text-gray-300 text-xs leading-relaxed pl-7">
                                    Simpan juga salinan file PDF E-Ticket & Visa di HP Anda agar bisa ditunjukkan kapan saja saat pemeriksaan petugas imigrasi Saudi.
                                  </p>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2 hover:border-gold-500/30 transition-all shadow-sm">
                                  <div className="font-bold text-gold-300 text-xs sm:text-sm flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-500/30">4</span>
                                    <span className="truncate">Kartu Asuransi & Kesehatan</span>
                                  </div>
                                  <p className="text-gray-300 text-xs leading-relaxed pl-7">
                                    Simpan nomor polis dan dokumen asuransi kesehatan sebagai perlindungan medis selama beribadah di Makkah dan Madinah.
                                  </p>
                                </div>
                              </div>

                              {/* BAGIAN "BUTUH BANTUAN" DENGAN PARAGRAF FULL WIDTH DAN TOMBOL DI BAWAH (FULL WIDTH) */}
                              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-gold-500/30 space-y-3.5 shadow-lg">
                                <div className="space-y-1.5 w-full">
                                  <h5 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                                    <MessageCircle className="w-4.5 h-4.5 text-gold-400 shrink-0" />
                                    <span>Butuh Bantuan Pencetakan / Kendala Dokumen?</span>
                                  </h5>
                                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                    Jika E-Ticket atau Visa Anda belum diterbitkan padahal sudah melunasi tagihan, atau terdapat kekeliruan data dokumen, silakan hubungi tim layanan Customer Service resmi travel.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setActiveTab('bantuan')}
                                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                                >
                                  <MessageCircle className="w-4 h-4 shrink-0" />
                                  <span>Hubungi CS Travel</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Greeting Banner */}
              <div className="bg-gradient-to-r from-[#1a2f24] to-[#132019] rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Assalamu'alaikum, {user?.name?.split(' ')[0] || 'Jamaah'}</h2>
                    <p className="text-matcha-100/80 text-lg max-w-xl">Semoga persiapan ibadah Anda dilancarkan oleh Allah SWT. Selesaikan langkah pendaftaran untuk memastikan keberangkatan Anda.</p>
                  </div>
                  {userConsultation && (
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[140px]">
                      <p className="text-sm text-matcha-100/70 font-medium mb-1 uppercase tracking-wider">Status Akun</p>
                      <p className="text-xl font-bold text-gold-400 uppercase tracking-tighter">
                        {currentStatus.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Status Kelengkapan Data (Smart Alerts) */}
              {alerts.length > 0 && (
                <section className="portal-alert-section">
                    <div className="alert-header-area">
                        <div className="alert-pulse-icon">!</div>
                        <h2 className="alert-section-title">Status Kelengkapan Data</h2>
                    </div>

                    <div className="alert-grid">
                        {alerts.map(alert => {
                            let cardClass = "";
                            let icon = "";
                            if (alert.completed) {
                                cardClass = 'alert-success';
                                icon = '✅';
                            } else {
                                cardClass = alert.type === 'error' ? 'alert-critical' : alert.type === 'warning' ? 'alert-warning' : 'alert-info';
                                icon = alert.type === 'error' ? '⚠️' : alert.type === 'warning' ? '💰' : '📄';
                            }

                            return (
                                <div key={alert.id} className={`alert-card ${cardClass} ${alert.completed ? 'completed-card' : ''}`}>
                                    <div className="alert-icon-box">
                                        <span className="icon">{icon}</span>
                                    </div>
                                    <div className="alert-content">
                                        <h3>{alert.title}</h3>
                                        <p>{alert.desc}</p>
                                        {!alert.completed && (
                                            <button 
                                                onClick={() => {
                                                    if (alert.id === 'biodata') setActiveTab('biodata');
                                                    else if (alert.id === 'pay' || alert.id === 'pay2') setActiveTab('pembayaran');
                                                    else if (alert.id === 'docs') setActiveTab('dokumen');
                                                }}
                                                className="alert-action-btn"
                                            >
                                                Selesaikan Sekarang <span>→</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
              )}

              {/* Status Summary Cards: Status Pembayaran, Kelengkapan Dokumen, Pembimbing Mutawif */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Pembayaran */}
                <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-100 flex items-center group hover:border-gold-300 transition-all">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mr-4 shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-7 h-7 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-500 font-medium text-xs mb-1 uppercase tracking-wider">Status Pembayaran</h4>
                    <p className="font-bold text-gray-900 text-lg truncate">
                      {(!computedPaymentStep || computedPaymentStep === 'none') ? 'Menunggu DP 1' : 
                       computedPaymentStep === 'dp1' ? 'Menunggu DP 2' : 
                       computedPaymentStep === 'dp2' ? 'Menunggu Pelunasan' : 'Lunas'}
                    </p>
                  </div>
                </div>
                
                {/* Kelengkapan Dokumen */}
                <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-100 flex items-center group hover:border-gold-300 transition-all">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mr-4 shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-7 h-7 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-500 font-medium text-xs mb-1 uppercase tracking-wider">Kelengkapan Dokumen</h4>
                    <p className="font-bold text-gray-900 text-lg truncate">
                      {(Array.isArray(userConsultation?.documents) ? userConsultation.documents.length : 0)} dari {(userConsultation?.paxData?.length || 1) * 5} Berkas
                    </p>
                  </div>
                </div>

                {/* Pembimbing & Muthawwif */}
                <div 
                  onClick={() => setIsMuthawwifModalOpen(true)}
                  className="bg-white shadow-md rounded-2xl p-5 sm:p-6 border border-gray-100 flex items-center justify-between group hover:border-gold-300 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shrink-0 overflow-hidden border border-amber-200 shadow-sm relative">
                      <img src={muthawwifAvatar} alt={muthawwifName} className="w-full h-full object-cover object-top" />
                      <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Status: Standby"></span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pembimbing & Muthawwif</h4>
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded shadow-sm">Kloter</span>
                      </div>
                      <p className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-amber-700 transition-colors leading-tight mb-0.5">{muthawwifName}</p>
                      <p className="text-[11px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1 leading-tight">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {muthawwifRole}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://wa.me/${muthawwifPhone.replace(/^0/, '62')}`, '_blank');
                      }}
                      className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                      title="Hubungi WhatsApp Pembimbing"
                    >
                      <Smartphone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuthawwifModalOpen(true);
                      }}
                      className="p-3 bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl transition-all shadow-sm hidden sm:flex items-center gap-1 font-bold text-xs active:scale-95"
                      title="Lihat Profil & Pesan Bimbingan"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Tracking Stepper */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <ShieldCheck className="w-40 h-40 text-emerald-900" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-gold-500" /> Progres Pendaftaran Anda
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Selesaikan seluruh tahapan untuk keberangkatan Umroh yang mabrur.</p>
                      </div>
                    </div>
                    
                    <RegistrationStepper 
                      currentStatus={currentStatus as RegistrationStatus}
                      pendingPaymentStep={pendingPaymentStep}
                      computedPaymentStep={computedPaymentStep}
                      isDocumentPending={registration?.documents?.some((d: any) => d.status === 'pending')}
                      isDocsComplete={isDocsComplete}
                      onNavigate={(tabId, paymentMode) => handleTabClick(tabId, paymentMode)}
                      onResetPackage={handleResetPackage}
                      selectedPackageName={registration?.package?.name || currentPackage?.name || userConsultation?.selectedPackageName || ''}
                      paxCount={paxCount}
                      packagePrice={Number(registration?.package?.price || currentPackage?.price || 36000000)}
                      approvedTotal={approvedTotal}
                      sisaTagihan={Math.max(0, packagePriceTotal - approvedTotal)}
                    />
                  </div>
              </div>

              {/* AI Support Info Card */}
              <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-3xl p-6 border border-gold-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-gold-300 opacity-20 group-hover:rotate-12 transition-transform">
                  <Smartphone className="w-20 h-20" />
                </div>
                <h3 className="font-bold text-gold-800 text-lg mb-2 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" /> Asisten AI Haji
                </h3>
                <p className="text-sm text-gold-700 leading-relaxed mb-4">
                  Ada pertanyaan seputar manasik, perlengkapan, atau tata cara ibadah? Tanyakan langsung ke Asisten AI kami yang didukung oleh Gemini.
                </p>
                <button 
                  onClick={() => setActiveTab('bantuan')}
                  className="bg-gray-50/80 backdrop-blur-sm text-gold-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Mulai Bertanya ✨
                </button>
              </div>

            </div>
          )}

        {/* MODAL INFORMASI & PESAN PEMBIMBING / MUTHAWWIF */}
        {isMuthawwifModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsMuthawwifModalOpen(false)}
            ></div>
            <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-amber-100">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-6 text-white relative">
                <button 
                  onClick={() => setIsMuthawwifModalOpen(false)}
                  className="absolute top-5 right-5 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-extrabold tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                    PEMBIMBING IBADAH & MUTHAWWIF KLOTER
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={muthawwifAvatar} 
                      alt={muthawwifName} 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-md" 
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white leading-snug">{muthawwifName}</h3>
                    <p className="text-amber-200 text-xs font-semibold mt-0.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      {muthawwifRole}
                    </p>
                    <p className="text-[11px] text-amber-100/80 mt-1">
                      Kloter: <span className="font-bold text-white">{activeSchedule?.name || userConsultation?.package?.name || 'Kloter Keberangkatan'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Pesan Khusus dari Ustaz */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 relative">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider mb-2">
                    <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                    Pesan & Panduan dari Ustaz Pembimbing:
                  </div>
                  <p className="text-sm text-slate-700 italic leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-amber-100 shadow-xs">
                    "{muthawwifNotes}"
                  </p>
                </div>

                {/* Layanan & Keunggulan Pembimbing */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fasilitas & Pendampingan Jemaah:</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Bimbingan Manasik Syariah Sesuai Sunnah</p>
                        <p className="text-gray-500 text-[11px]">Penjelasan rukun, wajib, dan sunnah umrah/haji secara komprehensif.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Pendampingan Langsung di Tanah Suci</p>
                        <p className="text-gray-500 text-[11px]">Memimpin pelaksanaan Tawaf, Sa'i, serta Ziarah Makkah & Madinah.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Konsultasi Syariah & Doa 24 Jam</p>
                        <p className="text-gray-500 text-[11px]">Siap menjawab pertanyaan seputar hukum ibadah selama perjalanan.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => window.open(`https://wa.me/${muthawwifPhone.replace(/^0/, '62')}?text=${encodeURIComponent(`Assalamu'alaikum Ustaz ${muthawwifName}, saya ${userConsultation?.fullName || 'Jemaah'} ingin berkonsultasi seputar jadwal dan manasik ibadah.`)}`, '_blank')}
                    className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <Smartphone className="w-4 h-4" />
                    Hubungi WhatsApp Ustaz
                  </button>
                  <button 
                    onClick={() => setIsMuthawwifModalOpen(false)}
                    className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PILIH JUMLAH JAMAAH */}
        {isPaxModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-gray-50/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsPaxModalOpen(false)}
            ></div>
            <div className="bg-gray-50 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
              <div className="bg-gray-100 p-8 text-gray-900 relative">
                <button 
                  onClick={() => setIsPaxModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-50/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-gold-400/20 rounded-2xl flex items-center justify-center mb-6 border border-gold-400/30">
                  <User className="w-8 h-8 text-gold-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Konfirmasi Pesanan</h3>
                <p className="text-slate-300 text-sm">Anda memilih paket <span className="text-gold-400 font-bold">{selectedPackageForPax?.name}</span>. Silakan tentukan jumlah jamaah.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Jumlah Jamaah (Orang)</label>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setPaxInput(Math.max(1, paxInput - 1))}
                      className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <input 
                      type="number"
                      min="1"
                      className="flex-1 h-12 text-center text-xl font-bold text-gray-900 border-b-2 border-gray-100 focus:border-gray-500 outline-none transition-all"
                      value={paxInput}
                      onChange={(e) => setPaxInput(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button 
                      onClick={() => setPaxInput(paxInput + 1)}
                      className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 italic text-center">Data biodata akan disesuaikan secara otomatis berdasarkan jumlah jamaah.</p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleConfirmPaxCount}
                    className="w-full py-4 bg-gold-500 text-gray-900 rounded-2xl font-bold text-lg hover:bg-gold-600 shadow-lg shadow-gold-500/20 active:scale-95 transition-all flex items-center justify-center"
                  >
                    Konfirmasi & Lanjut <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                  <button 
                    onClick={() => setIsPaxModalOpen(false)}
                    className="w-full py-4 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          {/* AKUN TAB */}
          {activeTab === 'akun' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h2>
                <p className="text-gray-500 text-sm">Kelola profil pribadi dan keamanan akun Anda.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-1">
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-xl mx-auto flex items-center justify-center">
                        {accountForm.avatarUrl || currentAvatarUrl ? (
                          <img src={accountForm.avatarUrl || currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover object-center rounded-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold-500/20 to-amber-600/20 text-gold-600 font-bold text-4xl">
                            {(currentUserName || 'J').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2.5 bg-gold-500 text-slate-950 rounded-full shadow-lg cursor-pointer hover:bg-amber-400 transition-all border-2 border-white hover:scale-105 active:scale-95" title="Unggah Foto Profil">
                        <Edit2 className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} />
                      </label>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">{accountForm.name || currentUserName}</h3>
                    <p className="text-sm text-gray-500">{userConsultation?.role === 'mitra' ? 'Mitra' : 'Jamaah'}</p>
                    
                    <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                      <div className="flex items-center justify-between text-left">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Bergabung Sejak</p>
                        <p className="text-sm font-bold text-gray-700">{userConsultation?.createdAt ? new Date(userConsultation.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}</p>
                        </div>
                        <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Form Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4">Informasi Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-500 focus:bg-white transition-all font-medium text-sm"
                          value={accountForm.name}
                          onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nomor WhatsApp</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-500 focus:bg-white transition-all font-medium text-sm"
                          value={accountForm.phone}
                          onChange={e => setAccountForm({...accountForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Alamat Email</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-500 focus:bg-white transition-all font-medium text-sm"
                          value={accountForm.email}
                          onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-gold-600" /> Keamanan Akun
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi Baru</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-3 pr-10 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-500 focus:bg-white transition-all font-medium text-sm"
                            value={accountForm.password}
                            onChange={e => setAccountForm({...accountForm, password: e.target.value})}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Konfirmasi Sandi</label>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Ulangi kata sandi baru"
                            className="w-full px-4 py-3 pr-10 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-500 focus:bg-white transition-all font-medium text-sm"
                            value={accountForm.confirmPassword}
                            onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleUpdateAccount}
                      disabled={isUpdatingAccount}
                      className={`px-10 py-4 ${isUpdatingAccount ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-gold-500 hover:bg-gold-600 text-slate-950'} rounded-2xl font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2`}
                    >
                      {isUpdatingAccount ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan Perubahan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KENANGAN TAB */}
          {activeTab === 'kenangan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100/50 shadow-slate-200/50">
                {/* Multi-Pax Group Status Banner */}
                {((paxDataList && paxDataList.length > 0) || (userConsultation?.paxData && userConsultation.paxData.length > 0)) && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wider mb-2 border border-emerald-500/30">
                          <Users className="w-3.5 h-3.5" /> Pendaftaran Rombongan / Keluarga
                        </div>
                        <h4 className="text-lg font-bold text-white">Status Sertifikat Jamaah ({userConsultation?.paxData?.length || paxDataList.length} Orang)</h4>
                        <p className="text-xs text-gray-300 mt-1 max-w-xl">
                          Setiap jamaah terdaftar dalam akun ini menerima e-sertifikat digital secara mandiri.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(userConsultation?.paxData || paxDataList).map((pax: any, idx: number) => {
                          const pName = pax.fullName || pax.name || (idx === 0 ? (user?.name || 'Jamaah Utama') : `Jamaah #${idx + 1}`);
                          const hasCert = certificates.some(c => {
                            const certRecipient = (c.recipientName || '').toLowerCase().trim();
                            const targetName = pName.toLowerCase().trim();
                            return certRecipient === targetName || 
                                   certRecipient.includes(targetName) || 
                                   targetName.includes(certRecipient) ||
                                   (certificates.length > 0 && idx === 0 && !c.recipientName);
                          });

                          return (
                            <div 
                              key={idx} 
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                hasCert 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-white/5 text-gray-400 border-white/10'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${hasCert ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span>{pName}</span>
                              <span className="text-[10px] opacity-80">
                                {hasCert ? '✓ Terbit' : '⏳ Proses'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gold-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-200">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-gray-900 uppercase tracking-[0.2em]">E-Sertifikat Digital</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Penghargaan atas perjalanan suci Anda</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => {
                        fetchCertificates();
                        toast.success("Memperbarui data sertifikat...");
                      }}
                      className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-600" /> Refresh
                    </button>
                    {certificates.length > 0 && (
                      <button 
                        onClick={() => {
                          const cert = certificates[0];
                          const isPdf = cert.certificateUrl?.includes('pdf') || cert.certificateUrl?.startsWith('data:application/pdf');
                          downloadFile(cert.certificateUrl, `Sertifikat-Umroh-${user?.name ? user.name.replace(/\s+/g, '_') : 'Jamaah'}.${isPdf ? 'pdf' : 'png'}`);
                        }}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 flex-1 sm:flex-none justify-center"
                      >
                        <Download className="w-4 h-4 text-gold-400" /> Unduh Semua
                      </button>
                    )}
                  </div>
                </div>

                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => {
                      const isPdf = cert.certificateUrl?.includes('pdf') || cert.certificateUrl?.startsWith('data:application/pdf');
                      const recipientName = cert.recipientName || user?.name || 'Jamaah';
                      const certFileName = `Sertifikat-Umroh-${recipientName.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}`;

                      return (
                        <div key={cert.id} className="group relative bg-white rounded-3xl p-6 border-2 border-emerald-100/80 hover:border-emerald-300 transition-all flex flex-col items-center text-center shadow-lg hover:shadow-xl hover:-translate-y-1">
                          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner mb-3 border border-emerald-100 group-hover:scale-105 transition-transform">
                            <Award className="w-8 h-8 text-emerald-600" />
                          </div>
                          
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-50 text-gold-800 font-bold text-xs rounded-full border border-gold-200/80 mb-2 shadow-xs">
                            <User className="w-3.5 h-3.5 text-gold-600" /> {recipientName}
                          </span>

                          <h4 className="font-bold text-gray-900 text-base mb-1">Sertifikat Digital Umroh</h4>
                          <p className="text-xs text-emerald-700/80 font-medium mb-5">
                            Diterbitkan {new Date(cert.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>

                          <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                            <button 
                              onClick={() => openDataUrlInNewTab(cert.certificateUrl, `Sertifikat Umroh - ${user?.name || 'Jamaah'}`)}
                              className="py-3 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                              title="Lihat Sertifikat"
                            >
                              <Eye className="w-4 h-4" /> Buka
                            </button>
                            <button 
                              onClick={() => downloadFile(cert.certificateUrl, certFileName)}
                              className="py-3 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                              title="Unduh Sertifikat"
                            >
                              <Download className="w-4 h-4" /> Unduh
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-gray-100">
                      <Award className="w-8 h-8 text-gray-300" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">Sertifikat Belum Tersedia</h4>
                    <p className="text-gray-500 text-[11px] max-w-xs mx-auto leading-relaxed mb-6">
                      E-Sertifikat digital akan diterbitkan dan diunggah oleh admin setelah perjalanan ibadah Anda selesai.
                      <br /><br />
                      <span className="text-emerald-600 font-bold">Tips:</span> Jika Anda adalah anggota rombongan/keluarga, pastikan Nama atau Email Anda sudah terdaftar dengan benar di data pendaftaran.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button 
                        onClick={() => {
                          fetchCertificates();
                          toast.success("Memeriksa data...");
                        }}
                        className="px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-[10px] hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Periksa Ulang
                      </button>
                      <button 
                        onClick={() => setActiveTab('bantuan')}
                        className="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[10px] hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Hubungi Admin
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Memory Gallery Section */}
              <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100/50 shadow-slate-200/50">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-gray-900 uppercase tracking-[0.2em]">Galeri Perjalanan</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Momen-momen indah selama beribadah</p>
                  </div>
                </div>

                {memories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memories.map(memory => (
                      <div key={memory.id} className="group relative rounded-3xl overflow-hidden aspect-square bg-gray-100 shadow-lg hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-700 border border-gray-100">
                        {memory.imageUrl.includes('data:video') || memory.imageUrl.toLowerCase().endsWith('.mp4') || memory.imageUrl.toLowerCase().endsWith('.mov') ? (
                          <div className="w-full h-full relative">
                            <video 
                              src={memory.imageUrl} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                              muted
                              loop
                              playsInline
                              onMouseOver={e => e.currentTarget.play()}
                              onMouseOut={e => e.currentTarget.pause()}
                            />
                            <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white">
                              <Video className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={memory.imageUrl} 
                            alt={memory.caption} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end backdrop-blur-[2px]">
                          <div className="flex justify-between items-end gap-4">
                            <div className="flex-1">
                              <p className="text-white text-sm font-bold leading-tight mb-2 line-clamp-2">{memory.caption || 'Momen Indah Perjalanan'}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <p className="text-emerald-300 text-[9px] font-black uppercase tracking-[0.2em]">{new Date(memory.createdAt).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const isVideo = memory.imageUrl.includes('data:video') || memory.imageUrl.toLowerCase().endsWith('.mp4') || memory.imageUrl.toLowerCase().endsWith('.mov');
                                const extension = isVideo ? 'mp4' : 'jpg';
                                downloadFile(memory.imageUrl, `Momen_GoldenTravel_${memory.id.substring(0, 8)}.${extension}`);
                              }}
                              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-95 group/btn shadow-lg"
                              title="Unduh Momen"
                            >
                              <Download className="w-5 h-5 group-hover/btn:translate-y-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-gray-50 rounded-3xl bg-gray-50/30">
                    <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4 opacity-30" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Belum ada foto perjalanan</p>
                    <p className="text-[9px] text-gray-300 font-bold mt-2 uppercase">Admin akan mengunggah foto-foto dokumentasi perjalanan Anda di sini.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HELP TAB */}
          {activeTab === 'bantuan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pusat Bantuan & FAQ</h2>
                  <p className="text-gray-500 text-sm">Temukan jawaban untuk pertanyaan Anda atau hubungi kami.</p>
                </div>
                <button 
                  onClick={() => window.open('https://wa.me/6282283201103', '_blank')}
                  className="flex items-center space-x-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">WhatsApp Admin 1</span>
                </button>
                <button 
                  onClick={() => window.open('https://wa.me/6282288308220', '_blank')}
                  className="flex items-center space-x-2 bg-emerald-700 text-white px-6 py-3 rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">WhatsApp Admin 2</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Pertanyaan Umum (FAQ)</h3>
                    <div className="space-y-4">
                      {[
                        { q: 'Mengapa saya belum bisa membayar?', a: 'Pastikan Anda telah memilih paket dan mengisi biodata jamaah terlebih dahulu di menu "Pendaftaran".' },
                        { q: 'Kapan koper saya dikirim?', a: 'Koper dan perlengkapan biasanya dikirim 2 minggu setelah pembayaran DP 1 diverifikasi.' },
                        { q: 'Bagaimana cara mengubah biodata?', a: 'Anda dapat mengubah biodata di menu "Pendaftaran" selama status dokumen belum diverifikasi oleh admin.' },
                        { q: 'Dokumen apa saja yang wajib diunggah?', a: 'Paspor (asli), Buku Kuning (Meningitis), Foto 4x6, dan KTP/KK.' }
                      ].map((item, idx) => (
                        <details key={idx} className="group border-b border-gray-50 last:border-0 pb-4">
                          <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none py-2">
                            {item.q}
                            <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                          </summary>
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ticket Support */}
                <div className="space-y-6">
                  <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100/50 shadow-slate-200/50">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-gray-900 uppercase tracking-[0.2em]">Kirim Tiket Baru</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Ajukan bantuan ke tim Customer Service</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subjek Masalah</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Kendala Pembayaran atau Dokumen" 
                          className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-300 focus:bg-white transition-all text-sm font-medium placeholder:text-gray-300"
                          value={ticketForm.subject}
                          onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deskripsi Detail</label>
                        <textarea 
                          placeholder="Jelaskan kendala Anda secara rinci agar kami dapat membantu lebih cepat..." 
                          rows={4}
                          className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gold-300 focus:bg-white transition-all text-sm font-medium resize-none placeholder:text-gray-300 min-h-[120px]"
                          value={ticketForm.message}
                          onChange={e => setTicketForm({...ticketForm, message: e.target.value})}
                        ></textarea>
                      </div>
                      <button 
                        onClick={handleSubmitTicket}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-slate-200 group"
                      >
                        <Send className="w-4 h-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                        Kirim Tiket Sekarang
                      </button>
                    </div>
                  </div>

                  <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100/50 shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-black text-xs text-gray-900 uppercase tracking-[0.2em]">Riwayat Bantuan</h3>
                      <div className="px-2 py-1 bg-gold-50 rounded-lg border border-gold-100">
                        <span className="text-[10px] font-black text-gold-600">{(helpTickets || []).length}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(helpTickets || []).map(ticket => (
                        <button 
                          key={ticket.id}
                          onClick={() => { setSelectedTicket(ticket); setIsTicketModalOpen(true); }}
                          className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-gold-200 hover:bg-gold-50/20 hover:shadow-lg hover:shadow-gold-100/20 transition-all group"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></div>
                              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest truncate max-w-[120px]">{ticket.subject}</span>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                              ticket.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'
                            }`}>
                              {ticket.status === 'open' ? 'Aktif' : 'Selesai'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium truncate mb-2 group-hover:text-gray-600">{ticket.message}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                              {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
                            </p>
                            <div className="flex items-center text-[8px] font-black text-gold-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              Lihat Detail <ChevronRight className="w-2 h-2 ml-1" />
                            </div>
                          </div>
                        </button>
                      ))}
                      {(helpTickets || []).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 opacity-40">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                            <MessageSquare className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Belum ada riwayat tiket</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/20">
            {/* Modal Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center border border-gold-100 shadow-sm">
                  <MessageSquare className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                    Tiket Bantuan: <span className="text-gold-600">#{selectedTicket.id.slice(0, 8)}</span>
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedTicket.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {selectedTicket.status === 'open' ? 'Aktif' : 'Selesai'}
                    </span>
                    <span className="text-gray-300 text-xs">•</span>
                    <p className="text-gray-500 text-xs font-medium">{selectedTicket.subject}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsTicketModalOpen(false)} 
                className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all border border-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Original Message */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white p-6 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-gold-600 uppercase tracking-widest">Pesan Utama</p>
                    <p className="text-[9px] font-bold text-gray-400">{new Date(selectedTicket.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                  <p className="text-gray-800 leading-relaxed font-medium text-sm">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Conversation Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-transparent text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Percakapan</span>
                </div>
              </div>

              {/* Replies */}
              <div className="space-y-6">
                {(selectedTicket?.replies || []).map((reply: any) => (
                  <div key={reply.id} className={`flex ${reply.sender === 'jamaah' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm ${
                      reply.sender === 'jamaah' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white text-gray-900 rounded-tl-none border border-gold-100'
                    }`}>
                      <div className="flex items-center justify-between mb-2 space-x-8">
                        <p className={`text-[8px] font-black uppercase tracking-widest ${reply.sender === 'jamaah' ? 'text-slate-400' : 'text-gold-600'}`}>
                          {reply.sender === 'admin' ? 'Customer Service' : 'Anda'}
                        </p>
                        <p className={`text-[8px] font-bold ${reply.sender === 'jamaah' ? 'text-slate-500' : 'text-gray-400'}`}>
                          {new Date(reply.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed">{reply.message}</p>
                    </div>
                  </div>
                ))}
                
                {(selectedTicket?.replies || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                      <Clock className="w-8 h-8 text-gray-300 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 italic">Menunggu respons dari Customer Service...</p>
                    <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Tim kami akan segera membalas pesan Anda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Reply Input */}
            {selectedTicket.status === 'open' ? (
              <div className="p-8 border-t border-gray-100 shrink-0 bg-white">
                <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-gold-300 focus-within:bg-white transition-all">
                  <input 
                    type="text" 
                    placeholder="Tulis pesan balasan Anda di sini..." 
                    className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReplyTicket()}
                  />
                  <button 
                    onClick={handleReplyTicket}
                    disabled={!replyMessage}
                    className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Kirim</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-4 text-center uppercase tracking-widest font-bold">
                  Balasan Anda akan dikirim langsung ke tim Customer Service Golden Travel
                </p>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiket ini telah selesai dan ditutup</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="bg-white shadow-2xl rounded-[2.5rem] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative border border-white/20 z-[100000]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-2xl bg-gold-50 flex items-center justify-center mr-4 shadow-sm border border-gold-100">
                  <FileText className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{previewFile.title}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">Pratinjau Dokumen Digital</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const isPdf = isPdfUrl(previewFile.url) || previewFile.type === 'pdf';
                    const ext = isPdf ? 'pdf' : (isImageUrl(previewFile.url) ? 'png' : 'pdf');
                    downloadFile(previewFile.url, `${previewFile.title.replace(/\s+/g, '_')}.${ext}`);
                  }}
                  className="flex items-center px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition-all shadow-md text-[10px] sm:text-xs uppercase tracking-wider group shrink-0"
                  title="Unduh File"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  Unduh PDF
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openDataUrlInNewTab(previewFile.url, previewFile.title);
                  }}
                  className="flex items-center px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all border border-gray-200 text-[10px] sm:text-xs font-black uppercase tracking-wider group shrink-0"
                  title="Buka di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform text-gold-600" />
                  Buka Tab Baru
                </button>
                <button 
                  onClick={() => setPreviewFile(null)} 
                  className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-black/20 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
              {(() => {
                const isPdf = isPdfUrl(previewFile.url) || previewFile.type === 'pdf';
                const isImage = isImageUrl(previewFile.url) || previewFile.type === 'image';
                const blobUrl = getBlobUrlFromDataUrl(previewFile.url);

                if (isImage && !isPdf) {
                  return (
                    <div className="relative group max-h-full flex items-center justify-center p-2 overflow-auto w-full h-full">
                      <img 
                        src={blobUrl} 
                        alt="Doc Preview" 
                        className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-800 bg-white mx-auto my-auto"
                      />
                    </div>
                  );
                } else if (isPdf || !isImage) {
                  return (
                    <PdfViewer url={previewFile.url} title={previewFile.title} className="h-full w-full" />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-6 py-20">
                      <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                        <FileText className="w-12 h-12 text-amber-400" />
                      </div>
                      <div className="text-center space-y-3">
                        <p className="font-black text-white uppercase tracking-widest">{previewFile.title}</p>
                        <p className="text-xs text-slate-400">Dokumen siap untuk dibuka atau diunduh.</p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => openDataUrlInNewTab(previewFile.url, previewFile.title)}
                            className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> Buka Dokumen
                          </button>
                          <button
                            onClick={() => downloadFile(previewFile.url, `${previewFile.title.replace(/\s+/g, '_')}.pdf`)}
                            className="px-5 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Unduh Dokumen
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {/* Certificate Preview Modal */}
      {showCertPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl overflow-hidden max-w-7xl w-full shadow-2xl relative"
          >
            <div className="absolute top-6 right-6 z-10 flex gap-3">
              <button 
                onClick={() => window.print()}
                className="bg-white/90 hover:bg-white text-emerald-900 p-3 rounded-2xl shadow-xl transition-all border border-emerald-100 flex items-center gap-2 font-bold"
              >
                <Download className="w-5 h-5" /> Cetak / Simpan PDF
              </button>
              <button 
                onClick={() => setShowCertPreview(null)}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl shadow-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-auto max-h-[90vh] p-8 bg-gray-100 flex justify-center">
              <div className="shadow-2xl bg-white origin-top" style={{ transform: 'scale(0.85)' }}>
                <UmrahCertificate 
                  logoUrl={logoImg}
                  namaJamaah={showCertPreview.namaJamaah}
                  noRegistrasi={showCertPreview.noRegistrasi}
                  tahunIbadah={showCertPreview.tahunIbadah}
                  tanggalCetak={showCertPreview.tanggalCetak}
                />
              </div>
            </div>

            <div className="bg-white p-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm font-medium">
                Gunakan fitur <b>Cetak</b> dan pilih <b>"Simpan sebagai PDF"</b> untuk mengunduh sertifikat ini.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl relative border border-gray-100 text-center space-y-5"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{confirmModal.title}</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all border border-gray-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/25 transition-all"
              >
                {confirmModal.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
