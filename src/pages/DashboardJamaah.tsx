import { useLogo } from '../utils/logo';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LogOut, User, FileText, CreditCard, CheckCircle2,
  Clock, Upload, AlertCircle, AlertTriangle, Briefcase, Settings, Star,
  BookOpen, MapPin, LayoutDashboard, ChevronRight, ChevronLeft, Bell, 
  HelpCircle, Calendar as CalendarIcon, Download, Smartphone, X, Menu, ShieldCheck, HeartPulse, Plane, RefreshCw, Edit2, ExternalLink,
  Sparkles, Eye, FileCheck,
  Banknote, Tag, CheckCircle, Building, Users, Megaphone, Package as InventoryIcon, Scroll, Check, UserPlus, Lock,
  MessageCircle, Image as ImageIcon, Award, UserCircle, Send, MessageSquare, Video
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
import { openDataUrlInNewTab, downloadFile } from '../utils/file';
import { generateRegistrationFormPdf } from '../utils/generateRegistrationFormPdf';
import UmrahCertificate from '../components/jamaah/UmrahCertificate';

export default function DashboardJamaah() {
  const logoImg = useLogo();
  const { registration, setRegistration, packages, schedules, notifications: announcements, manifest, equipment: inventoryState, loading, user, dbUser, refreshData } = useRegistration();
  useSocket(() => refreshData(true));
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
  const paymentsList = (userConsultation as any)?.payments || [];
  const approvedDp1 = paymentsList.some((p: any) => p.paymentType === 'dp1' && p.status === 'approved');
  const approvedDp2 = paymentsList.some((p: any) => p.paymentType === 'dp2' && p.status === 'approved');
  const approvedFull = paymentsList.some((p: any) => p.paymentType === 'full' && p.status === 'approved');
  let computedPaymentStep = 'none';
  if (approvedFull) computedPaymentStep = 'lunas';
  else if (approvedDp2) computedPaymentStep = 'dp2';
  else if (approvedDp1) computedPaymentStep = 'dp1';
  const pendingPaymentStep = ((userConsultation as any)?.payments || []).find((p: any) => p.status === 'pending')?.paymentType;
  const paxCount = parseInt(registration?.adultCount || '0') + parseInt(registration?.childCount || '0') + parseInt(registration?.infantCount || '0') || 1;
  
  
  const [helpTickets, setHelpTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [showCertPreview, setShowCertPreview] = useState<any>(null);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  const fetchMemories = async () => {
    try {
      const pkgId = registration?.packageId;
      const data = await api.get(`/memories${pkgId ? `?packageId=${pkgId}` : ''}`);
      setMemories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const data = await api.get('/certificates');
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await api.get('/support/tickets');
      const tickets = Array.isArray(data) ? data : [];
      setHelpTickets(tickets);
      // Update selected ticket if it's open to refresh replies
      if (selectedTicket) {
        const updated = tickets.find((t: any) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchMemories();
    fetchCertificates();
    const interval = setInterval(() => {
      fetchTickets();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id, registration?.id]);
  
  const updateConsultation = async (data: any) => {
    try {
      await api.patch('/jamaah/registration', data);
      await refreshData(true);
      toast.success("Data berhasil diperbarui!");
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui data.");
    }
  };

  const resetAllData = async () => {
    try {
      await api.delete('/jamaah/registration');
      await refreshData(true);
      setActiveTab('dashboard');
      toast.success("Data pendaftaran berhasil direset.");
    } catch (error: any) {
      toast.error(error.message || "Gagal mereset data.");
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [packageCategory, setPackageCategory] = useState<'umroh' | 'haji'>('umroh');

  // Auto-refresh data when switching to catalog or schedules
  useEffect(() => {
    if (activeTab === 'katalog_paket' || activeTab === 'informasi_jadwal') {
      refreshData(true);
    }
  }, [activeTab]);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
  const [accountForm, setAccountForm] = useState({
    name: userConsultation?.user?.name || '',
    phone: userConsultation?.user?.phone || '',
    email: userConsultation?.user?.email || '',
    password: '',
    confirmPassword: '',
    avatarUrl: userConsultation?.user?.avatarUrl || ''
  });

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

  const currentStatus = registration?.status || 'package_selected';

  // Close sidebar on tab change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  const currentPackage = packages.find(p => p.id === userConsultation?.packageId) || 
                         packages.find(p => p.name === userConsultation?.package?.name) || 
                         packages[0];

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

  const handleSaveOrderer = () => {
    if (userConsultation) {
      updateConsultation({
        ...userConsultation,
        ...ordererForm
      });
      setIsEditingOrderer(false);
      toast.success("Data Pemesan berhasil diperbarui!");
    }
  };

  const handleSaveDraft = () => {
    if (userConsultation) {
      updateConsultation({ ...userConsultation, paxData: paxDataList });
      toast.success("Draft biodata jamaah berhasil disimpan sementara.");
    }
  };

  const handleSubmitFinal = () => {
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
      if (nextUnsubmitted === -1 && userConsultation.status === 'package_selected') {
         newStatus = 'bio_filled';
      }

      updateConsultation({ ...userConsultation, paxData: updatedPaxData, status: newStatus });
      
      if (nextUnsubmitted !== -1) {
        setActivePaxIdx(nextUnsubmitted);
        toast.success("Biodata Jamaah " + (activePaxIdx + 1) + " berhasil disubmit! Silakan lanjut ke jamaah berikutnya.");
      } else {
        setIsEditingBio(false);
        toast.success("Semua biodata jamaah berhasil disubmit secara final!");
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
    if (!paymentForm.proof) {
      toast.error("Mohon unggah bukti transfer terlebih dahulu!");
      return;
    }

    if (userConsultation) {
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

        toast.success(
          selectedPaymentMode === 'full'
            ? `Pembayaran Pelunasan Full (Rp ${Number(amountToSend).toLocaleString('id-ID')}) berhasil disubmit! Menunggu verifikasi admin.`
            : "Pembayaran berhasil disubmit! Menunggu verifikasi admin."
        );
        setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], proof: null });
        await refreshData(true);
      } catch (err: any) {
        toast.error(err.message || "Gagal submit pembayaran");
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

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      toast.error("Sesi Anda telah habis. Silakan login kembali.");
      return;
    }

    setIsUpdatingAccount(true);
    try {
      // Update name, phone and avatar via API
      await api.patch('/users/me', {
        name: accountForm.name,
        phone: accountForm.phone,
        avatarUrl: accountForm.avatarUrl
      });

      // If user provided a new password, update it in Firebase
      if (accountForm.password) {
        try {
          await updatePassword(firebaseUser, accountForm.password);
          toast.success("Kata sandi berhasil diperbarui!");
        } catch (pwError: any) {
          if (pwError.code === 'auth/requires-recent-login') {
            toast.error("Demi keamanan, sistem meminta Anda logout dan login kembali sebelum membuat sandi baru.");
            setIsUpdatingAccount(false);
            return;
          }
          throw pwError;
        }
      }

      toast.success("Profil berhasil diperbarui!");
      setAccountForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      refreshData(true);
    } catch (error: any) {
      console.error("Update account error:", error);
      toast.error(error.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      .filter((t: any) => t.status === 'approved')
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
    const approvedCount = uniqueDocs.filter((d: any) => d.status === 'approved').length;
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
    const rejectedDocs = docs.filter((d: any) => d.status === 'rejected');

    if (rejectedDocs.length > 0) {
      alerts.push({ id: 'docs-rejected', title: 'Dokumen Ditolak', desc: `${rejectedDocs.length} dokumen perlu diunggah ulang. Cek menu dokumen.`, type: 'error', completed: false });
    } else if (docCount < expectedDocs) {
      alerts.push({ id: 'docs', title: 'Upload Dokumen', desc: `${expectedDocs - docCount} dokumen lagi diperlukan untuk pengurusan visa.`, type: 'info', completed: false });
    } else {
      alerts.push({ id: 'docs', title: 'Dokumen Lengkap', desc: 'Seluruh dokumen persyaratan telah diupload.', type: 'success', completed: true });
    }

    // 4. Payments rejections
    const payments = Array.isArray(userConsultation?.payments) ? userConsultation.payments : [];
    const rejectedPayments = payments.filter((p: any) => p.status === 'rejected');
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

  const handleSaveBiodata = async () => {
    if (userConsultation) {
      const updateData: any = { ...userConsultation, paxData: paxDataList };
      if (userConsultation.status === 'package_selected') {
        updateData.status = 'bio_filled';
      }
      await updateConsultation(updateData);
      toast.success("Biodata semua jamaah berhasil disimpan!");
      setActiveTab('dokumen');
    }
  };
  const basePrice = currentPackage ? Number(currentPackage.price) * paxCount : 0;
  const approvedPaymentsSum = ((userConsultation as any)?.payments || [])
    .filter((t: any) => t.status === 'approved')
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

  const handleUploadDocument = (docName: string, paxIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      const file = e.target.files[0];
      const docKey = `${docName}_${paxIdx}`;
      
      // High capacity limit up to 100MB
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File terlalu besar! Maksimal 100MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const fileUrl = reader.result as string;
        
        // Optimistic UI update: instantly reflect document in registration state
        const newDoc = { id: `doc-${Date.now()}`, docType: docKey, fileUrl, status: 'approved', createdAt: new Date().toISOString() };
        if (registration) {
          const existingDocs = Array.isArray(registration.documents) ? registration.documents : [];
          const updatedDocs = [...existingDocs.filter((d: any) => d.docType !== docKey), newDoc];
          if (setRegistration) {
            setRegistration({ ...registration, documents: updatedDocs });
          }
        }

        toast.success(`Dokumen ${docName} untuk Jamaah ${paxIdx + 1} berhasil diunggah secara real-time!`);
        setUploadingDoc(null);

        // Background API sync
        api.post('/documents', {
           registrationId: userConsultation.id,
           docType: docKey,
           fileUrl
        }).then(() => {
          refreshData(true);
        }).catch((error: any) => {
          console.error("Background document save error:", error);
          toast.error(error.message || "Gagal menyimpan dokumen ke server");
        });
      };
      reader.onerror = () => {
        toast.error("Gagal membaca file. Pastikan file tidak rusak.");
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
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
    
    if (userConsultation?.status === 'visa_ticket_ready') idx = Math.max(idx, 7);
    return idx;
  };

  const isTabLocked = (tabId: string) => {
    const idx = getRegistrationStepIdx();
    if (tabId === 'biodata' && idx < 1) return true;
    if (tabId === 'dokumen' && idx < 2) return true;
    if (tabId === 'pembayaran' && idx < 2) return true; // DP1 is accessible once biodata is filled (idx >= 2)
    return false;
  };

  const handleTabClick = (tabId: string, paymentMode?: 'step' | 'full') => {
    if (isTabLocked(tabId)) {
      toast.error('Selesaikan tahap sebelumnya terlebih dahulu.');
      return;
    }
    setActiveTab(tabId);
    if (paymentMode) {
      setSelectedPaymentMode(paymentMode);
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
      
      {/* Floating AI Assistant (Gemini Integration Simulation) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setActiveTab('bantuan')}
          className="group relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-gray-900 to-gray-700 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 border-2 border-gold-400/50"
        >
          <div className="absolute -top-12 right-0 bg-gray-50 text-gray-900 px-4 py-2 rounded-2xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-sm font-bold">
            Tanya Asisten AI (Gemini) ✨
          </div>
          <Smartphone className="w-8 h-8 text-gold-400" />
          <div className="absolute inset-0 rounded-full bg-gold-400/20 animate-ping"></div>
        </button>
      </div>


      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#132019] text-white border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col shadow-xl
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0 relative">
          {!isCollapsed && (
             <div className="flex items-center space-x-3">
               <img src={logoImg} alt="Logo" className="h-10 w-10 rounded-full border border-white/10 shadow-sm" />
               <div className="flex flex-col">
                 <span className="font-bold text-white text-lg leading-tight">PT Golden Tour Haramain</span>
                 <span className="text-[10px] text-gold-400 font-bold uppercase tracking-wider">Portal Jamaah</span>
               </div>
             </div>
          )}
          {isCollapsed && (
             <img src={logoImg} alt="Logo" className="h-10 w-10 mx-auto rounded-full border border-white/10 shadow-sm" />
          )}
        </div>

        {/* Sidebar User Info */}
        <div className={`p-6 border-b border-white/10 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
           <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner border border-gray-700 shrink-0">
                {(userConsultation?.user?.name || 'J').charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white truncate">{userConsultation?.user?.name || 'Jamaah'}</h3>
                  <p className="text-xs text-gold-400 font-medium truncate">{userConsultation?.package?.name ? `Paket ${userConsultation.package.name}` : 'Belum Pilih Paket'}</p>
                </div>
              )}
           </div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <nav className="space-y-6">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {!isCollapsed && <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">{group.title}</h4>}
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
                        title={isCollapsed ? item.label : ''}
                        className={`w-full flex items-center py-3 rounded-xl font-medium transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
                          ((activeTab === item.id || item.subItems?.some(s => s.id === activeTab)) && !item.subItems)
                            ? 'bg-gold-500 text-gray-900 font-semibold shadow-md ' 
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className={`${!isCollapsed ? 'mr-3' : ''} ${(activeTab === item.id || item.subItems?.some(s => s.id === activeTab)) ? 'text-inherit' : 'text-slate-400'}`}>{item.icon}</span>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.subItems && (
                              <ChevronRight className={`w-4 h-4 transition-transform ${openSubMenus[item.id] ? 'rotate-90' : ''}`} />
                            )}
                          </>
                        )}
                      </button>
                      
                      {!isCollapsed && item.subItems && openSubMenus[item.id] && (
                        <div className="ml-9 space-y-1 border-l border-white/10 pl-4 animate-in slide-in-from-top-2 duration-200">
                          {item.subItems.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => handleTabClick(sub.id)}
                              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-all ${
                                activeTab === sub.id 
                                  ? 'text-gold-400 font-bold bg-white/10' 
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {sub.label}
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
             title={isCollapsed ? 'Reset Simulasi' : ''}
             className={`w-full flex items-center py-3 rounded-xl font-medium text-gold-400 hover:bg-gold-950/20 hover:text-gold-300 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
           >
             <RefreshCw className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} /> 
             {!isCollapsed && <span>Reset Simulasi</span>}
           </button>

           <button 
             onClick={handleLogout}
             title={isCollapsed ? 'Keluar Akun' : ''}
             className={`w-full flex items-center py-3 rounded-xl font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
           >
             <LogOut className={`w-5 h-5 ${!isCollapsed ? 'mr-3' : ''}`} /> 
             {!isCollapsed && <span>Keluar Akun</span>}
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
        ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
      `}>
        {/* Portal Topbar / Header (Responsive) */}
        <header className="portal-topbar">
            <div className="topbar-left">
                {/* Tombol Menu / Hamburger */}
                <button 
                  className="menu-toggle-btn" 
                  aria-label="Toggle Menu"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(!isSidebarOpen);
                    } else {
                      setIsCollapsed(!isCollapsed);
                    }
                  }}
                >
                    <Menu className="w-5 h-5" />
                </button>
                {/* Judul Halaman Dinamis */}
                <h1 className="page-title">{allMenuItems.find(m => m.id === activeTab)?.label}</h1>
            </div>
            
            <div className="topbar-right">
                <div className="user-greeting-box">
                    <span className="user-greeting">Selamat Datang, {userConsultation?.user?.name?.split(' ')[0] || 'Jamaah'}</span>
                </div>
                {/* Tombol Notifikasi */}
                <button className="notification-btn" aria-label="Notifikasi">
                    <Bell className="w-5 h-5" />
                    <span className="notif-badge"></span>
                </button>
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
                    className="px-8 py-3 bg-slate-200 text-slate-400 cursor-not-allowed rounded-xl font-bold text-sm transition-all"
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
                            Rp {Number(stat.value).toLocaleString('id-ID')}
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
                          <div className="p-4 bg-white shadow-md rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Bank Mandiri</p>
                            <p className="text-sm font-bold text-gray-900 flex items-center justify-between">
                              1090064995673
                              <button 
                                className="text-gray-600 hover:text-gray-700 p-1 transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText("1090064995673");
                                  toast.success("Nomor rekening berhasil disalin");
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              </button>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">A.N. PT. Golden Tour Haramain</p>
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
                                disabled={!paymentForm.proof}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                  !paymentForm.proof 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                    : selectedPaymentMode === 'full'
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                                      : 'bg-matcha-600 text-white hover:bg-matcha-700 shadow-black/20'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>
                                  {selectedPaymentMode === 'full' 
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
                                      ${t.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                        t.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                        'bg-yellow-100 text-yellow-700'}
                                    `}>
                                      {t.status === 'approved' ? 'Lunas/Diterima' : 
                                       t.status === 'rejected' ? 'Ditolak' : 'Menunggu Konfirmasi'}
                                    </span>
                                    {t.rejectionReason && (
                                      <p className="text-[9px] text-red-500 italic mt-1 max-w-[150px]">"{t.rejectionReason}"</p>
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
                  const filteredPackages = (packages || []).filter(pkg => {
                    const isAvail = pkg.isAvailable !== false && pkg.isAvailable !== 'false' && pkg.isAvailable !== 0;
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
                            onClick={() => refreshData(true)}
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
                    disabled
                    className="px-8 py-3 bg-slate-200 text-slate-400 cursor-not-allowed rounded-xl font-bold text-sm transition-all"
                   >
                     Mulai Unggah Dokumen
                   </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* PAX TABS FOR DOCUMENTS */}
                  {userConsultation?.paxData && userConsultation.paxData.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                      {(userConsultation?.paxData && Array.isArray(userConsultation.paxData) ? userConsultation.paxData : []).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveDocPaxIdx(i)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeDocPaxIdx === i ? 'bg-gray-200 text-gray-800 shadow-sm' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
                        >
                          Jamaah {i + 1}
                        </button>
                      ))}
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
                    const docItem = Array.isArray(userConsultation?.documents) ? userConsultation.documents.find((d: any) => d.docType === docKey) : null;
                    const isUploaded = !!docItem;
                    const docStatus = docItem?.status || 'pending';
                    const rejectionNote = docItem?.rejectionReason;
                    const fileUrl = docItem?.fileUrl;

                    return (
                      <div key={idx} className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-gray-50 text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600 rounded-xl flex items-center justify-center transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${!isUploaded ? 'bg-gray-100 text-gray-500' : 
                              docStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              docStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}
                          `}>
                            {!isUploaded ? 'Belum Diunggah' : 
                             docStatus === 'approved' ? 'Disetujui' :
                             docStatus === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                          </div>
                        </div>

                        <h4 className="font-bold text-gray-900 text-sm mb-1">{doc.label}</h4>
                        <p className="text-[11px] text-gray-400 mb-6 flex-1">{doc.desc}</p>

                        {rejectionNote && docStatus === 'rejected' && (
                          <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-[10px] text-red-600 font-bold">Alasan Penolakan:</p>
                            <p className="text-[10px] text-red-500 italic">{rejectionNote}</p>
                          </div>
                        )}

                        <div className="relative">
                          {isUploaded ? (
                            <div className="space-y-2">
                              <div className="h-32 w-full rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 relative group/preview">
                                {fileUrl?.startsWith('data:application/pdf') || fileUrl?.endsWith('.pdf') ? (
                                  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-100">
                                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-xs font-bold uppercase text-gray-500">PDF Document</span>
                                  </div>
                                ) : fileUrl?.startsWith('data:image/') || fileUrl?.startsWith('http') ? (
                                  <img src={fileUrl} className="w-full h-full object-cover object-center rounded-t-xl" alt="Preview" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-300">
                                    <ShieldCheck className="w-8 h-8 opacity-20" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                                  {(fileUrl?.startsWith('data:application/pdf') || fileUrl?.startsWith('http') || fileUrl?.startsWith('data:image/')) && (
                                    <button
                                      type="button"
                                      className="cursor-pointer bg-gold-500 hover:bg-gold-600 text-gray-900 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setPreviewFile({
                                          url: fileUrl!,
                                          type: fileUrl?.startsWith('data:application/pdf') || fileUrl?.endsWith('.pdf') ? 'pdf' : 'image',
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

              <div className="bg-gray-100 rounded-xl p-8 text-gray-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50/5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Semua Dokumen Sudah Lengkap?</h3>
                    <p className="text-slate-300 text-sm">Tim operasional kami akan memverifikasi dokumen Anda dalam waktu maksimal 1x24 jam kerja.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (userConsultation?.status === 'bio_filled') {
                        await updateConsultation({ ...userConsultation, status: 'documents_uploaded' });
                      }
                      setActiveTab('pembayaran');
                    }}
                    className="px-8 py-3 bg-gold-500 text-gray-900 rounded-xl font-bold text-sm hover:bg-gold-600 transition-all shadow-lg shadow-black/20"
                  >
                    Lanjut ke Pembayaran
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
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
                      <InventoryIcon className="w-5 h-5 mr-2 text-gold-500" /> Status Perlengkapan & Seragam
                    </h3>
                    <div className="space-y-8">
                      {(() => {
                        const status = inventoryState;
                        const items = [
                          { key: 'koper', label: 'Koper & Tas Passport', icon: '🧳' },
                          { key: 'ihram', label: 'Kain Ihram / Seragam Batik', icon: '👔' },
                          { key: 'mukena', label: 'Mukena / Buku Doa & Panduan', icon: '📖' }
                        ];
                        const completedCount = items.filter(item => status?.[item.key as keyof typeof status]).length;
                        const progressPercent = (completedCount / items.length) * 100;

                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-matcha-200 uppercase tracking-widest">Progress Distribusi</span>
                              <span className="text-sm font-bold text-gray-700">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-matcha-600 transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                              {items.map(item => {
                                const isDone = status?.[item.key as keyof typeof status];
                                return (
                                  <div key={item.key} className={`p-6 rounded-2xl border transition-all ${isDone ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="text-2xl mb-3">{item.icon}</div>
                                    <h4 className="font-bold text-sm text-gray-900 mb-1">{item.label}</h4>
                                    <p className={`text-[10px] font-bold uppercase ${isDone ? 'text-green-600' : 'text-gray-400'}`}>
                                      {isDone ? 'Sudah Diambil' : 'Menunggu Distribusi'}
                                    </p>
                                    {isDone && status?.assignee && (
                                      <p className="text-[9px] text-gray-500 mt-2 italic">Approved by: {status.assignee}</p>
                                    )}
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
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
                      <Megaphone className="w-5 h-5 mr-2 text-gold-500" /> Papan Pengumuman
                    </h3>
                    <div className="space-y-4">
                      {(announcements || []).map((ann) => (
                        <div key={ann.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden group">
                           <div className={`absolute left-0 top-0 bottom-0 w-1 ${ann.type === 'important' ? 'bg-red-500' : ann.type === 'update' ? 'bg-gold-500' : 'bg-gray-500'}`}></div>
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-gray-900">{ann.title}</h4>
                             <span className="text-[10px] text-gray-400 font-bold">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                           </div>
                           <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
                        </div>
                      ))}
                      {announcements.length === 0 && (
                        <div className="py-12 text-center text-gray-400">
                          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-bold">Belum ada pengumuman terbaru</p>
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
                      const paxDoc = myDocs.find((d: any) => d.docType === `${baseType}_pax_${pIdx}` && d.fileUrl);
                      const groupDoc = myDocs.find((d: any) => d.docType === baseType && d.fileUrl);
                      return {
                        fileUrl: paxDoc?.fileUrl || groupDoc?.fileUrl || null,
                        isGroup: !paxDoc && !!groupDoc,
                        paxDocName: paxDoc ? paxList[pIdx]?.name : (groupDoc ? 'Dokumen Rombongan (Group)' : null)
                      };
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
                                          {tDoc.fileUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewFile({ url: tDoc.fileUrl!, type: 'pdf', title: `E-Ticket - ${p.name}` })}
                                              className="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group"
                                              title={`Unduh E-Ticket ${p.name}`}
                                            >
                                              <Plane className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Tiket</span>
                                            </button>
                                          ) : (
                                            <div className="py-2.5 px-2 rounded-xl bg-slate-900/90 text-gray-400 border border-white/5 text-[11px] font-medium flex items-center justify-center gap-1 text-center opacity-60">
                                              <Plane className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                              <span className="truncate">Tiket -</span>
                                            </div>
                                          )}

                                          {/* Button Visa */}
                                          {vDoc.fileUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewFile({ url: vDoc.fileUrl!, type: 'pdf', title: `Visa - ${p.name}` })}
                                              className="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group"
                                              title={`Unduh Visa KSA ${p.name}`}
                                            >
                                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Visa</span>
                                            </button>
                                          ) : (
                                            <div className="py-2.5 px-2 rounded-xl bg-slate-900/90 text-gray-400 border border-white/5 text-[11px] font-medium flex items-center justify-center gap-1 text-center opacity-60">
                                              <ShieldCheck className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                              <span className="truncate">Visa -</span>
                                            </div>
                                          )}

                                          {/* Button Asuransi */}
                                          {aDoc.fileUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewFile({ url: aDoc.fileUrl!, type: 'pdf', title: `Asuransi - ${p.name}` })}
                                              className="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group"
                                              title={`Unduh Polis Asuransi ${p.name}`}
                                            >
                                              <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                              <span className="truncate">Polis</span>
                                            </button>
                                          ) : (
                                            <div className="py-2.5 px-2 rounded-xl bg-slate-900/90 text-gray-400 border border-white/5 text-[11px] font-medium flex items-center justify-center gap-1 text-center opacity-60">
                                              <HeartPulse className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                              <span className="truncate">Polis -</span>
                                            </div>
                                          )}
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
                                        const isLocked = !isLunas;

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
                                                  isLocked
                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                    : hasDoc
                                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                      : 'bg-gray-800/80 text-gray-400 border-gray-700'
                                                }`}>
                                                  {isLocked ? 'Kunci (Belum Lunas)' : hasDoc ? 'PDF Ready' : 'Belum Terbit'}
                                                </span>
                                              </div>

                                              {/* Description Row */}
                                              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                                {c.desc}
                                              </p>

                                              {c.doc?.isGroup && hasDoc && (
                                                <div>
                                                  <span className="text-[11px] text-gold-300 font-semibold bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20 inline-block">
                                                    👥 Menggunakan Dokumen Group
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Button Row */}
                                            <div className="w-full pt-2">
                                              <button
                                                type="button"
                                                disabled={isLocked || !hasDoc}
                                                onClick={() => {
                                                  if (c.doc?.fileUrl) {
                                                    setPreviewFile({
                                                      url: c.doc.fileUrl,
                                                      type: 'pdf',
                                                      title: `${c.title} - ${activePax.name}`
                                                    });
                                                  } else {
                                                    toast.info(`${c.title} belum diunggah oleh pihak travel.`);
                                                  }
                                                }}
                                                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
                                                  isLocked
                                                    ? 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
                                                    : hasDoc
                                                      ? 'bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer'
                                                      : 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
                                                }`}
                                              >
                                                {isLocked ? (
                                                  <span>Lunasi Tagihan Untuk Akses</span>
                                                ) : hasDoc ? (
                                                  <>
                                                    <Eye className="w-4 h-4 shrink-0" />
                                                    <span>Lihat / Unduh PDF</span>
                                                  </>
                                                ) : (
                                                  <span>Belum Diunggah Travel</span>
                                                )}
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
                                          ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' 
                                          : 'bg-gray-800/80 text-gray-300 border-gray-700'
                                      }`}>
                                        {currentPackage?.manasikPdfUrl ? 'Digital PDF Ready' : 'Belum Tersedia'}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                      Panduan praktis tata cara pelaksanaan ibadah Umrah / Haji, bacaan doa, rukun, serta sunnah ibadah lengkap di Makkah & Madinah.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={!currentPackage?.manasikPdfUrl}
                                    onClick={() => {
                                      if (currentPackage?.manasikPdfUrl) {
                                        setPreviewFile({ url: currentPackage.manasikPdfUrl, type: 'pdf', title: 'Buku Panduan Manasik' });
                                      } else {
                                        toast.info('Buku panduan manasik belum tersedia untuk paket ini.');
                                      }
                                    }}
                                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                      currentPackage?.manasikPdfUrl
                                        ? 'bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer'
                                        : 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <BookOpen className="w-4 h-4 shrink-0" />
                                    <span>{currentPackage?.manasikPdfUrl ? 'Buka & Unduh Buku Manasik (PDF)' : 'Buku Belum Tersedia'}</span>
                                  </button>
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
                                          : 'bg-gray-800/80 text-gray-300 border-gray-700'
                                      }`}>
                                        {userSchedule?.itineraryPdfUrl ? 'PDF Ready' : 'Belum Diterbitkan'}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed w-full">
                                      Rincian jadwal harian kegiatan, akomodasi hotel Makkah & Madinah, penerbangan pergi-pulang, serta agenda ziarah resmi rombongan.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={!userSchedule?.itineraryPdfUrl}
                                    onClick={() => {
                                      if (userSchedule?.itineraryPdfUrl) {
                                        setPreviewFile({ url: userSchedule.itineraryPdfUrl, type: 'pdf', title: 'Itinerary Perjalanan' });
                                      } else {
                                        toast.info('Itinerary perjalanan belum diterbitkan oleh pihak travel.');
                                      }
                                    }}
                                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                                      userSchedule?.itineraryPdfUrl
                                        ? 'bg-gradient-to-r from-gold-500 via-amber-400 to-gold-500 hover:from-gold-400 hover:to-amber-300 text-slate-950 shadow-gold-500/20 cursor-pointer'
                                        : 'bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span>{userSchedule?.itineraryPdfUrl ? 'Buka & Unduh PDF Itinerary' : 'Itinerary Belum Diterbitkan'}</span>
                                  </button>
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
              <div className="bg-gradient-to-r from-matcha-900 to-matcha-800 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-2">Assalamu'alaikum, {user?.name?.split(' ')[0] || 'Jamaah'}</h2>
                    <p className="text-matcha-100/80 text-lg max-w-xl">Semoga persiapan ibadah Anda dilancarkan oleh Allah SWT. Selesaikan langkah pendaftaran untuk memastikan keberangkatan Anda.</p>
                  </div>
                  {userConsultation && (
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[140px]">
                      <p className="text-sm text-matcha-100/70 font-medium mb-1 uppercase tracking-wider">Keberangkatan</p>
                      <p className="text-3xl font-bold text-gold-400">45 <span className="text-base font-normal text-matcha-50">Hari</span></p>
                    </div>
                  </div>
                  )}
                </div>
                
                {/* Progress Bar Section */}
                <div className="mt-10 relative z-10">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-matcha-200 uppercase tracking-widest">Progress Kelengkapan</span>
                    <span className="text-2xl font-bold text-gold-400">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              
              
              {/* Smart Alerts */}
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Progress & Status */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm flex items-center group hover:border-gray-200 transition-all">
                      <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 group-hover:scale-110 transition-transform">


                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-500 font-medium text-sm mb-1">Status Pembayaran</h4>
                        <p className="font-bold text-gray-900 text-xl">
                          {(!computedPaymentStep || computedPaymentStep === 'none') ? 'Menunggu DP 1' : 
                           computedPaymentStep === 'dp1' ? 'Menunggu DP 2' : 
                           computedPaymentStep === 'dp2' ? 'Menunggu Pelunasan' : 'Lunas'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm flex items-center group hover:border-gray-200 transition-all">
                      <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mr-5 shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-500 font-medium text-sm mb-1">Kelengkapan Dokumen</h4>
                        <p className="font-bold text-gray-900 text-xl">{(Array.isArray(userConsultation?.documents) ? userConsultation.documents.length : 0)} dari {(userConsultation?.paxData?.length || 1) * 5} Berkas</p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Stepper */}
                  <RegistrationStepper isDocumentPending={registration?.status === 'documents_uploaded'} 
                    currentStatus={registration?.status || 'package_selected'} 
                    pendingPaymentStep={pendingPaymentStep}
                    computedPaymentStep={computedPaymentStep}
                    onNavigate={(tabId, paymentMode) => handleTabClick(tabId, paymentMode)}
                    onResetPackage={handleResetPackage}
                    selectedPackageName={registration?.package?.name || ''}
                    paxCount={paxCount}
                    packagePrice={Number(currentPackage?.price || 36000000)}
                  />
                </div>

                {/* Right Column: Muthawwif Info & Support */}
                <div className="space-y-8">
                  {/* Muthawwif Profile */}
                  <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Pembimbing & Muthawwif</h3>
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Muthawwif" className="w-full h-full object-cover object-center rounded-t-xl" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Ustadz Hanan Attaki</h4>
                        <p className="text-xs text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded inline-block">Muthawwif Utama</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Smartphone className="w-4 h-4 mr-3 text-gray-600" />
                        <span>+62 812-3456-7890</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 mr-3 text-gray-600" />
                        <span>Lisensi Kemenag Aktif</span>
                      </div>
                      <button 
                      onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                      className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                         Hubungi via WhatsApp
                      </button>
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
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-xl mx-auto">
                        {accountForm.avatarUrl ? (
                          <img src={accountForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover object-center rounded-t-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <UserCircle className="w-20 h-20" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2 bg-gold-500 text-gray-900 rounded-full shadow-lg cursor-pointer hover:bg-gold-600 transition-all border-2 border-white">
                        <Edit2 className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} />
                      </label>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900">{accountForm.name}</h3>
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
                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4">Informasi Personal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all font-medium"
                          value={accountForm.name}
                          onChange={e => setAccountForm({...accountForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Nomor WhatsApp</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all font-medium"
                          value={accountForm.phone}
                          onChange={e => setAccountForm({...accountForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Alamat Email</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all font-medium"
                          value={accountForm.email}
                          onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-gray-600" /> Keamanan Akun
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi Baru</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all font-medium"
                          value={accountForm.password}
                          onChange={e => setAccountForm({...accountForm, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Konfirmasi Sandi</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all font-medium"
                          value={accountForm.confirmPassword}
                          onChange={e => setAccountForm({...accountForm, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleUpdateAccount}
                      disabled={isUpdatingAccount}
                      className={`px-10 py-4 ${isUpdatingAccount ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-slate-800'} text-gray-900 rounded-2xl font-bold transition-all shadow-xl shadow-black/20 active:scale-95 flex items-center gap-2`}
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

                          <div className="grid grid-cols-1 gap-2 w-full mt-auto">
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => openDataUrlInNewTab(cert.certificateUrl)}
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
                            
                            <button 
                              onClick={() => setShowCertPreview({
                                namaJamaah: recipientName,
                                noRegistrasi: registration?.id?.substring(0, 10).toUpperCase() || 'GT-REG-001',
                                tahunIbadah: registration?.departureDate ? new Date(registration.departureDate).getFullYear().toString() : new Date().getFullYear().toString(),
                                tanggalCetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              })}
                              className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-black rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border-2 border-gold-600 shadow-lg shadow-gold-500/30"
                            >
                              <Award className="w-4 h-4" /> PRATINJAU EKSKLUSIF
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
                  Balasan Anda akan dikirim langsung ke tim Customer Service PT Golden Tour Haramain
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
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openDataUrlInNewTab(previewFile.url);
                  }}
                  className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all border border-gray-200 text-[10px] font-black uppercase tracking-wider group"
                  title="Buka di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform text-gold-600" />
                  Buka di Tab Baru
                </button>
                <button 
                  onClick={() => setPreviewFile(null)} 
                  className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-black/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 bg-slate-50 relative overflow-auto flex items-center justify-center p-6 md:p-12 scrollbar-thin scrollbar-thumb-gray-300">
              {previewFile.type === 'pdf' ? (
                <div className="w-full h-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                  <iframe 
                    src={previewFile.url} 
                    title="PDF Preview" 
                    className="w-full h-full border-0"
                  />
                </div>
              ) : previewFile.type === 'image' ? (
                <div className="relative group max-h-full">
                   <img 
                    src={previewFile.url} 
                    alt="Doc Preview" 
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-gray-200 bg-white"
                  />
                  <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 space-y-6 py-20">
                  <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                    <ShieldCheck className="w-12 h-12 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-gray-900 uppercase tracking-widest">Preview Tidak Tersedia</p>
                    <p className="text-xs text-gray-500 mt-2">Format file tidak didukung untuk pratinjau langsung.</p>
                  </div>
                </div>
              )}
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
