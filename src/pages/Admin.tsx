import { useLogo } from '../utils/logo';
import { toast } from 'sonner';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { updateLogo } from '../utils/logo';
import type { Package } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import VerificationManagement from '../components/VerificationManagement';
import FinancialReport from '../components/FinancialReport';
import ManifestPaxModal from '../components/admin/ManifestPaxModal';
import FinalDocumentUploadModal from '../components/admin/FinalDocumentUploadModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateRegistrationFormPdf } from '../utils/generateRegistrationFormPdf';
import { generateJamaahRecapPdf, generateDepartureManifestPdf } from '../utils/generateJamaahRecapPdf';
import { generateJamaahBiodataPdf } from '../utils/generateJamaahBiodataPdf';
import { generateProofPdf } from '../utils/generateProofPdf';
import EquipmentManagement from '../components/admin/EquipmentManagement';
import BroadcastManager from '../components/admin/BroadcastManager';
import { useAdminData } from '../hooks/useAdminData';
import CMSManager from '../components/admin/CMSManager';
import { useSocket } from '../hooks/useSocket';
import { api, getAdminToken } from '../lib/api';
import { auth } from '../lib/firebase';
import { openDataUrlInNewTab, downloadFile, isPdfUrl, isImageUrl, getBlobUrlFromDataUrl } from '../utils/file';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CRMTable } from '../components/admin/CRMTable';
import { RekapKeberangkatan } from '../components/admin/RekapKeberangkatan';
import PdfViewer from '../components/PdfViewer';
import { getDocPreviewDataUrl } from '../utils/docPreviewGenerator';

import { 
  LayoutDashboard, Database, Briefcase, Calendar as CalendarIcon, Users, 
  CreditCard, Globe, Image as ImageIcon, FileText, Tag, Star, 
  ShieldCheck, Download, UsersRound, Settings, BarChart3, LogOut, User, Building, Plane, Bus, UserCheck, FileSpreadsheet,
  Plus, Edit2, Trash2, Search, Filter, MoreVertical, CheckCircle, CheckCircle2, X, MapPin, Printer, Smartphone,
  Banknote, Bell, History, Clock, AlertCircle, ChevronRight, ChevronDown, Megaphone, Package as InventoryIcon, Package as PackageIcon, Scroll, Check, UserPlus,
  MessageCircle, Award, UserCircle, Send, MessageSquare, Eye, RefreshCw, AlertTriangle, ExternalLink, FileCheck, Video, Upload, UploadCloud,
  LifeBuoy, Inbox, ShieldAlert, MousePointer2, Lock, BookOpen, Book, Menu, RotateCcw, Maximize2, ZoomIn, Wallet, Luggage
 } from 'lucide-react';
import { updatePassword } from 'firebase/auth';

import AdminKYCPanel from '../components/AdminKYCPanel';
import AdminMitraManager from '../components/AdminMitraManager';
import AdminMitraJamaahManager from '../components/admin/AdminMitraJamaahManager';
import AdminMitraSertifikatKenangan from '../components/admin/AdminMitraSertifikatKenangan';
import AdminMitraPencairanKomisi from '../components/admin/AdminMitraPencairanKomisi';

export const matchDocumentCategory = (docTypeStr: string | null | undefined, catId: string, paxIdx: number = 0): boolean => {
  if (!docTypeStr || !catId) return false;
  const dt = String(docTypeStr).toLowerCase().trim();
  const targetCat = catId.toLowerCase().trim();

  const matchIdx = dt.match(/_(\d+)$/);
  const docPaxIdx = matchIdx ? parseInt(matchIdx[1], 10) : null;

  if (docPaxIdx !== null) {
    if (docPaxIdx !== paxIdx) return false;
  } else if (paxIdx !== 0) {
    return false;
  }

  const cleanDt = dt.replace(/_\d+$/, '').trim();

  if (targetCat.includes('ktp')) {
    return ['ktp', 'ktp asli', 'ktp_asli', 'ktpasli', 'kartu tanda penduduk'].includes(cleanDt);
  }
  if (targetCat.includes('paspor') || targetCat.includes('passport')) {
    return ['passport', 'paspor', 'paspor asli', 'paspor_asli', 'pasporasli'].includes(cleanDt);
  }
  if (targetCat.includes('kk') || targetCat.includes('keluarga')) {
    return ['kk', 'kartu keluarga', 'kartu_keluarga', 'kartukeluarga', 'kartu keluarga (kk)'].includes(cleanDt);
  }
  if (targetCat.includes('foto') || targetCat.includes('photo')) {
    return ['foto', 'pas foto', 'pas_foto', 'pas foto 4x6', 'foto 4x6', 'pasfoto', 'photo', 'pas foto 4 x 6'].includes(cleanDt);
  }
  if (targetCat.includes('vaksin') || targetCat.includes('vaccine')) {
    return ['vaccine', 'vaksin', 'sertifikat vaksin', 'sertifikat_vaksin', 'sertifikatvaksin'].includes(cleanDt);
  }
  if (targetCat.includes('nikah')) {
    return ['buku_nikah', 'buku nikah', 'nikah', 'bukunikah'].includes(cleanDt);
  }

  return cleanDt === targetCat;
};

export default function Admin() {
  const logoImg = useLogo();
  const { users, registrations, setRegistrations, packages, setPackages, schedules, dashboardStats, actionCenter, equipment: inventory, broadcast: announcements, manifest, loading, currentUser, setCurrentUser, refreshData } = useAdminData();
  const onDataUpdated = React.useCallback(() => {
    console.log("Admin: Received real-time update signal.");
    refreshData(true);
  }, [refreshData]);

  useSocket(onDataUpdated);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin/login');
    }
  }, [navigate]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [finalDocModal, setFinalDocModal] = useState<{
    isOpen: boolean;
    registrationId: string;
    jamaahName: string;
    packageName?: string;
    docType: 'eticket' | 'visa' | 'asuransi';
    paxData?: any[];
    paxCount?: number;
    documents?: any[];
    existingDocUrl?: string;
  }>({
    isOpen: false,
    registrationId: '',
    jamaahName: '',
    packageName: '',
    docType: 'eticket',
    paxData: [],
    paxCount: 1,
    documents: [],
    existingDocUrl: ''
  });
  
  const handleLogout = async () => {
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("cached_admin_portal_data");
    await auth.signOut();
    navigate('/admin/login');
  };

  const getConsultations = (uList: any[], rList: any[]) => {
    if (!Array.isArray(uList) || !Array.isArray(rList)) return [];
    return uList
      .filter(u => u && u.role === 'jamaah')
      .flatMap(u => {
        const uEmail = u.email?.toLowerCase();
        const userRegs = rList.filter(r => 
          r.userId === u.id || 
          (uEmail && r.ordererEmail?.toLowerCase() === uEmail) ||
          (uEmail && Array.isArray(r.paxData) && r.paxData.some((p: any) => p.email?.toLowerCase() === uEmail))
        );
        if (userRegs.length === 0) {
          return [{
            id: `user-${u.id}`,
            userId: u.id,
            user: u,
            name: u.name,
            email: u.email,
            accountEmail: u.email,
            phone: u.phone,
            status: u.status || 'DRAFT',
            packageName: 'Belum Memilih Paket',
            paymentStep: 'none',
            paxData: [],
            createdAt: u.createdAt
          }];
        }
        return userRegs.map(r => {
          const paxCount = (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0);
          const paxData = Array.isArray(r.paxData) ? r.paxData : [];
          return {
            ...r,
            name: r.ordererName || paxData[0]?.fullName || paxData[0]?.name || u.name,
            email: r.ordererEmail || paxData[0]?.email || u.email,
            accountEmail: u.email,
            phone: r.ordererPhone || paxData[0]?.phone || u.phone,
            notes: r.ordererNotes,
            status: u.status,
            paxCount: paxCount || 1,
            packageName: r.package?.name || 'Paket Terhapus',
            paymentStep: r.status === 'fully_paid' ? 'lunas' : r.status
          };
        });
      });
  };

  const consultations = useMemo(() => getConsultations(users, registrations), [users, registrations]);

  
  
  const [helpTickets, setHelpTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.get('/admin/support/tickets');
      const tickets = Array.isArray(data) ? data : [];
      setHelpTickets(tickets);
      setSelectedTicket((prev: any) => {
        if (!prev) return prev;
        const updated = tickets.find((t: any) => t.id === prev.id);
        return updated || prev;
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
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const [memories, setMemories] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const fetchMemories = async () => {
    try {
      const data = await api.get('/admin/memories');
      setMemories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const data = await api.get('/admin/certificates');
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    }
  };
  
  const updateConsultation = async (data: any) => {
    try {
      if (data.id.startsWith('user-')) {
        const realUserId = data.id.replace('user-', '');
        await api.patch(`/admin/users/${realUserId}`, {
          name: data.name,
          email: data.email,
          phone: data.phone
        });
      } else {
        await api.patch(`/admin/registrations/${data.id}`, {
          ordererName: data.name,
          ordererPhone: data.phone,
          ordererEmail: data.email,
          ordererNotes: data.notes,
          status: data.status,
          paxData: data.paxData,
          scheduleId: data.scheduleId
        });
      }
      toast.success('Data berhasil diperbarui.');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui data.');
    }
  };
  const deleteConsultation = async (id: string) => {
    try {
      if (id.startsWith('user-')) {
        const realUserId = id.replace('user-', '');
        await api.delete(`/admin/users/${realUserId}`);
      } else {
        await api.delete(`/admin/registrations/${id}`);
      }
      toast.success('Data berhasil dihapus.');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data.');
    }
  };
  
  const updatePackage = async (data: any) => {
    try {
      const dataToSend = { ...data };
      if (dataToSend.image) {
        dataToSend.imageUrl = dataToSend.image;
        delete dataToSend.image;
      }
      dataToSend.price = Number(dataToSend.price || 0);
      dataToSend.quota = Number(dataToSend.quota || 45);

      // Ensure description is clean array
      const descList = Array.isArray(dataToSend.description) 
        ? dataToSend.description.filter((d: string) => d && d.trim() !== '')
        : [dataToSend.description || 'Fasilitas Bintang 5'];
      dataToSend.description = descList.length > 0 ? descList : ['Fasilitas Bintang 5'];

      // Optimistic update
      setPackages((prev: any[]) => prev.map(p => p.id === data.id ? { 
        ...p, 
        ...dataToSend, 
        description: dataToSend.description,
        price: Number(dataToSend.price || 0),
        quota: Number(dataToSend.quota || 45),
        imageUrl: dataToSend.imageUrl || p.imageUrl 
      } : p));

      const notifyRealtimeCatalogChange = () => {
        try {
          localStorage.setItem('mitra_catalog_mutated', Date.now().toString());
          const bc = new BroadcastChannel('mitra_catalog_realtime');
          bc.postMessage({ type: 'MUTATED', timestamp: Date.now() });
          bc.close();

          const bc2 = new BroadcastChannel('golden_travel_updates');
          bc2.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
          bc2.close();
        } catch (e) {}
      };

      const updated = await api.put(`/admin/packages/${data.id}`, dataToSend);
      if (updated && updated.id) {
        setPackages((prev: any[]) => prev.map(p => p.id === data.id ? updated : p));
      }
      toast.success('Paket berhasil diperbarui.');
      notifyRealtimeCatalogChange();
      refreshData(true, true);
    } catch (error: any) {
      console.error('Error updating package:', error);
      toast.error(error.message || 'Gagal memperbarui paket.');
      refreshData(true, true);
    }
  };

  const addPackage = async (data: any) => {
    try {
      const { id, ...dataToSend } = data; // omit id to let db generate it
      if (dataToSend.image) {
        dataToSend.imageUrl = dataToSend.image;
        delete dataToSend.image;
      }
      dataToSend.price = Number(dataToSend.price || 0);
      dataToSend.quota = Number(dataToSend.quota || 45);

      const descList = Array.isArray(dataToSend.description) 
        ? dataToSend.description.filter((d: string) => d && d.trim() !== '')
        : [dataToSend.description || 'Fasilitas Bintang 5'];
      dataToSend.description = descList.length > 0 ? descList : ['Fasilitas Bintang 5'];

      // Optimistic temp item
      const tempId = `temp-pkg-${Date.now()}`;
      const tempItem = {
        id: tempId,
        name: dataToSend.name || 'Paket Baru',
        description: dataToSend.description,
        price: dataToSend.price,
        duration: dataToSend.duration || '9 Hari',
        type: dataToSend.type || activePackageTab || 'umroh',
        imageUrl: dataToSend.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80',
        isAvailable: dataToSend.isAvailable !== false,
        quota: dataToSend.quota,
        remainingSeats: dataToSend.quota,
        takenSeats: 0,
        createdAt: new Date().toISOString()
      };

      setPackages((prev: any[]) => [tempItem, ...prev]);

      const created = await api.post('/admin/packages', dataToSend);
      toast.success('Paket berhasil ditambahkan.');
      if (created && created.id) {
        setPackages((prev: any[]) => prev.map(p => p.id === tempId ? created : p));
      }
      try {
        localStorage.setItem('mitra_catalog_mutated', Date.now().toString());
        const bc = new BroadcastChannel('mitra_catalog_realtime');
        bc.postMessage({ type: 'MUTATED', timestamp: Date.now() });
        bc.close();

        const bc2 = new BroadcastChannel('golden_travel_updates');
        bc2.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
        bc2.close();
      } catch (e) {}
      refreshData(true, true);
    } catch (error: any) {
      console.error('Error adding package:', error);
      toast.error(error.message || 'Gagal menambahkan paket.');
      refreshData(true, true);
    }
  };
  const deletePackage = async (id: string) => {
    try {
      await api.delete(`/admin/packages/${id}`);
      setPackages((prev: any[]) => prev.filter(p => p.id !== id));
      toast.success('Paket berhasil dihapus.');
      try {
        localStorage.setItem('mitra_catalog_mutated', Date.now().toString());
        const bc = new BroadcastChannel('mitra_catalog_realtime');
        bc.postMessage({ type: 'MUTATED', timestamp: Date.now() });
        bc.close();

        const bc2 = new BroadcastChannel('golden_travel_updates');
        bc2.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
        bc2.close();
      } catch (e) {}
      refreshData(true, true);
    } catch (error: any) {
      console.error('Error deleting package:', error);
      toast.error(error.message || 'Gagal menghapus paket.');
      refreshData(true, true);
    }
  };
  
  const updateSchedule = async (data: any) => {
    try {
      await api.put(`/admin/schedules/${data.id}`, data);
      toast.success('Jadwal berhasil diperbarui.');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui jadwal.');
    }
  };
  const addSchedule = async (data: any) => {
    try {
      await api.post('/admin/schedules', data);
      toast.success('Jadwal berhasil ditambahkan.');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan jadwal.');
    }
  };
  const deleteSchedule = async (id: string) => {
    try {
      await api.delete(`/admin/schedules/${id}`);
      toast.success('Jadwal berhasil dihapus.');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus jadwal.');
    }
  };
  const updateInventory = async (jamaahId: string, item: 'koper' | 'ihram' | 'mukena', currentStatus: any) => {
    if (!jamaahId || jamaahId === '.') {
      toast.error('ID Jamaah tidak valid');
      return;
    }
    const payload = {
      koper: currentStatus?.koper || false,
      ihram: currentStatus?.ihram || false,
      mukena: currentStatus?.mukena || false,
      assignee: currentStatus?.assignee || '',
    };
    payload[item] = !payload[item];
    try {
      await api.patch(`/admin/equipment/${jamaahId}`, payload);
      toast.success('Status perlengkapan diperbarui!');
      await refreshData(true);
    } catch (e: any) {
      toast.error('Gagal memperbarui status perlengkapan');
    }
  };

  const handleUpdateAssignee = async (jamaahId: string, currentStatus: any, newAssignee: string) => {
    if (!jamaahId || jamaahId === '.') {
      toast.error('ID Jamaah tidak valid');
      return;
    }
    const payload = {
      koper: currentStatus?.koper || false,
      ihram: currentStatus?.ihram || false,
      mukena: currentStatus?.mukena || false,
      assignee: newAssignee,
    };
    try {
      await api.patch(`/admin/equipment/${jamaahId}`, payload);
      toast.success('Nama staf diperbarui!');
      await refreshData(true);
    } catch (e: any) {
      toast.error('Gagal memperbarui nama staf');
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Notification Center Dropdown state
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  const [rejectDocModal, setRejectDocModal] = useState<{
    isOpen: boolean;
    docId: string;
    docLabel?: string;
    reason: string;
  }>({
    isOpen: false,
    docId: '',
    docLabel: '',
    reason: 'Foto / Dokumen Kurang Jelas'
  });
  // Dashboard states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedJamaah, setSelectedJamaah] = useState<any>(null);
  const [isEditingJamaahInfo, setIsEditingJamaahInfo] = useState(false);
  const [jamaahEditForm, setJamaahEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [isJamaahDetailsModalOpen, setIsJamaahDetailsModalOpen] = useState(false);
  const [activeJamaahSubTab, setActiveJamaahSubTab] = useState<'biodata' | 'dokumen'>('biodata');
  const [activePaxIdx, setActivePaxIdx] = useState(0);
  
  // Verification Document States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingJamaah, setReviewingJamaah] = useState<any>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto-select first available document or first category when modal opens or active pax changes
  useEffect(() => {
    if (isReviewModalOpen && reviewingJamaah) {
      const docs = Array.isArray(reviewingJamaah.documents) ? reviewingJamaah.documents : [];
      const currentPaxData = Array.isArray(reviewingJamaah.paxData) ? reviewingJamaah.paxData[activePaxIdx] : null;
      const isMarried = currentPaxData?.maritalStatus === 'Menikah';
      const categories = ['KTP Asli', 'Paspor Asli', 'Kartu Keluarga (KK)', 'Pas Foto 4x6', 'Sertifikat Vaksin', ...(isMarried ? ['Buku Nikah'] : [])];
      
      let foundCat: string | null = null;
      for (const catName of categories) {
        const doc = docs.find((d: any) => matchDocumentCategory(d?.docType, catName, activePaxIdx));
        if (doc) {
          foundCat = catName;
          break;
        }
      }
      setReviewingDocId(foundCat || categories[0]);
    }
  }, [isReviewModalOpen, activePaxIdx, reviewingJamaah?.id]);

  const handleApproveDoc = async (jamaahId: string, categoryIdOrDocType: string | null) => {
    if (!reviewingJamaah || !categoryIdOrDocType) return;
    setIsVerifying(true);
    try {
      const allDocs = Array.isArray(reviewingJamaah.documents) ? reviewingJamaah.documents : [];
      const targetDoc = allDocs.find((d: any) => matchDocumentCategory(d?.docType, categoryIdOrDocType, activePaxIdx));
      
      const docIdToVerify = targetDoc?.id || targetDoc?.docType || categoryIdOrDocType;

      await api.patch('/admin/documents/verify', {
        registrationId: jamaahId,
        docId: docIdToVerify,
        docType: targetDoc?.docType || categoryIdOrDocType,
        status: 'approved',
        rejectionReason: ''
      });

      toast.success(`Dokumen ${categoryIdOrDocType.split('_')[0]} berhasil disetujui!`);
      setRejectionReason('');
      
      setReviewingJamaah((prev: any) => {
        if (!prev) return prev;
        const updatedDocs = (prev.documents || []).map((d: any) => {
          if (d === targetDoc || d.docType === targetDoc?.docType) {
            return { ...d, status: 'approved', rejectionReason: '' };
          }
          return d;
        });
        return { ...prev, documents: updatedDocs };
      });

      refreshData(true);
    } catch (err: any) {
      console.error('Approve doc error:', err);
      toast.error('Gagal menyetujui dokumen: ' + (err.message || 'Server error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectDoc = async (jamaahId: string, categoryIdOrDocType: string | null, reason: string) => {
    if (!reviewingJamaah || !categoryIdOrDocType) return;
    if (!reason.trim()) {
      toast.error('Mohon isi alasan penolakan dokumen.');
      return;
    }
    setIsVerifying(true);
    try {
      const allDocs = Array.isArray(reviewingJamaah.documents) ? reviewingJamaah.documents : [];
      const targetDoc = allDocs.find((d: any) => matchDocumentCategory(d?.docType, categoryIdOrDocType, activePaxIdx));
      
      const docIdToVerify = targetDoc?.id || targetDoc?.docType || categoryIdOrDocType;

      await api.patch('/admin/documents/verify', {
        registrationId: jamaahId,
        docId: docIdToVerify,
        docType: targetDoc?.docType || categoryIdOrDocType,
        status: 'rejected',
        rejectionReason: reason.trim(),
        adminNotes: reason.trim(),
        notes: reason.trim()
      });

      toast.success(`Dokumen ${categoryIdOrDocType.split('_')[0]} telah ditolak.`);
      setRejectionReason('');
      
      setReviewingJamaah((prev: any) => {
        if (!prev) return prev;
        const updatedDocs = (prev.documents || []).map((d: any) => {
          if (d === targetDoc || d.docType === targetDoc?.docType) {
            return { ...d, status: 'rejected', rejectionReason: reason.trim(), adminNotes: reason.trim(), notes: reason.trim() };
          }
          return d;
        });
        return { ...prev, documents: updatedDocs };
      });

      refreshData(true);
    } catch (err: any) {
      console.error('Reject doc error:', err);
      toast.error('Gagal menolak dokumen: ' + (err.message || 'Server error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetDoc = async (jamaahId: string, categoryIdOrDocType: string | null) => {
    if (!reviewingJamaah || !categoryIdOrDocType) return;
    setIsVerifying(true);
    try {
      const allDocs = Array.isArray(reviewingJamaah.documents) ? reviewingJamaah.documents : [];
      const targetDoc = allDocs.find((d: any) => matchDocumentCategory(d?.docType, categoryIdOrDocType, activePaxIdx));
      
      const docIdToVerify = targetDoc?.id || targetDoc?.docType || categoryIdOrDocType;

      await api.patch('/admin/documents/verify', {
        registrationId: jamaahId,
        docId: docIdToVerify,
        docType: targetDoc?.docType || categoryIdOrDocType,
        status: 'pending',
        rejectionReason: ''
      });

      toast.success(`Status verifikasi dokumen ${categoryIdOrDocType.split('_')[0]} dikembalikan ke pending.`);
      
      setReviewingJamaah((prev: any) => {
        if (!prev) return prev;
        const updatedDocs = (prev.documents || []).map((d: any) => {
          if (d === targetDoc || d.docType === targetDoc?.docType) {
            return { ...d, status: 'pending', rejectionReason: '' };
          }
          return d;
        });
        return { ...prev, documents: updatedDocs };
      });

      refreshData(true);
    } catch (err: any) {
      console.error('Reset doc error:', err);
      toast.error('Gagal mengubah status dokumen: ' + (err.message || 'Server error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadDoc = async (jamaahName: string, categoryIdOrDocType: string | null, fileUrl: string | undefined) => {
    if (!fileUrl) {
      toast.error('URL berkas tidak tersedia untuk diunduh.');
      return;
    }
    const cleanDocName = categoryIdOrDocType ? categoryIdOrDocType.split('_')[0].replace(/[^a-zA-Z0-9]/g, '_') : 'Dokumen';
    const cleanJamaahName = (jamaahName || 'Jamaah').replace(/[^a-zA-Z0-9]/g, '_');
    
    let ext = '.png';
    if (isPdfUrl(fileUrl) || fileUrl.includes('application/pdf') || fileUrl.includes('ext=.pdf')) {
      ext = '.pdf';
    } else if (fileUrl.includes('image/jpeg') || fileUrl.includes('ext=.jpg')) {
      ext = '.jpg';
    }

    const filename = `${cleanDocName}_${cleanJamaahName}_Pax${activePaxIdx + 1}${ext}`;
    toast.info(`Mengunduh berkas ${cleanDocName}...`);
    await downloadFile(fileUrl, filename);
  };

  const handleDownloadAllDocs = async (jamaahName: string) => {
    if (!reviewingJamaah) return;
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folderName = `Dokumen_${(jamaahName || 'Jamaah').replace(/\s+/g, '_')}_Pax_${activePaxIdx + 1}`;
      const folder = zip.folder(folderName) || zip;

      const allDocs = Array.isArray(reviewingJamaah.documents) ? reviewingJamaah.documents : [];
      const currentPaxData = Array.isArray(reviewingJamaah.paxData) ? reviewingJamaah.paxData[activePaxIdx] : null;
      const isMarried = currentPaxData?.maritalStatus === 'Menikah';
      const categories = [
        { id: 'KTP Asli', label: 'KTP_Asli' },
        { id: 'Paspor Asli', label: 'Paspor_Asli' },
        { id: 'Kartu Keluarga (KK)', label: 'Kartu_Keluarga' },
        { id: 'Pas Foto 4x6', label: 'Pas_Foto_4x6' },
        { id: 'Sertifikat Vaksin', label: 'Sertifikat_Vaksin' },
        ...(isMarried ? [{ id: 'Buku Nikah', label: 'Buku_Nikah' }] : [])
      ];

      let filesAdded = 0;
      const token = localStorage.getItem('token');

      for (const cat of categories) {
        const doc = allDocs.find((d: any) => matchDocumentCategory(d?.docType, cat.id, activePaxIdx));
        if (!doc) continue;

        let docUrl = doc.fileUrl;
        if (!docUrl && doc.id) {
          const isPdf = doc.isPdf || (doc.docType && doc.docType.toLowerCase().includes('pdf'));
          docUrl = `/api/documents/${doc.id}/file?token=${token}&ext=${isPdf ? '.pdf' : '.png'}`;
        }
        if (!docUrl) continue;

        let fileData: ArrayBuffer | null = null;
        let extension = 'png';

        if (docUrl.startsWith('data:')) {
          const parts = docUrl.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          if (mime.includes('pdf')) extension = 'pdf';
          else if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';
          
          const bstr = atob(parts[1] || '');
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          fileData = u8arr.buffer;
        } else if (docUrl.startsWith('/') || docUrl.startsWith('http')) {
          try {
            const resp = await fetch(docUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (resp.ok) {
              const blob = await resp.blob();
              if (!blob.type.includes('html') && !blob.type.includes('json')) {
                fileData = await blob.arrayBuffer();
                if (blob.type.includes('pdf') || docUrl.includes('.pdf')) extension = 'pdf';
                else if (blob.type.includes('jpeg') || docUrl.includes('.jpg')) extension = 'jpg';
              }
            }
          } catch (e) {
            console.warn('Failed to fetch doc for zip:', docUrl, e);
          }
        }

        if (fileData) {
          folder.file(`${cat.label}_Pax${activePaxIdx + 1}.${extension}`, fileData);
          filesAdded++;
        }
      }

      if (filesAdded === 0) {
        toast.error('Tidak ada berkas terunggah yang dapat diunduh.');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}.zip`);
      toast.success(`Berhasil mengunduh ${filesAdded} berkas dokumen (ZIP).`);
    } catch (error: any) {
      console.error('Download Zip error:', error);
      toast.error('Gagal membuat file ZIP unduhan.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Financial Verification States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [reviewingPaymentJamaahId, setReviewingPaymentJamaahId] = useState<string | null>(null);
  const [reviewingTransactionId, setReviewingTransactionId] = useState<string | null>(null);
  const [paymentRejectionReason, setPaymentRejectionReason] = useState('');

  // Financial Submenu & Rekap States
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<'verifikasi' | 'rekap_tahap' | 'laporan'>('verifikasi');
  const [rekapStageFilter, setRekapStageFilter] = useState<'all' | 'dp1' | 'dp2' | 'pelunasan' | 'full'>('all');
  const [rekapSearch, setRekapSearch] = useState('');
  const [rekapStatusFilter, setRekapStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [rekapDateMode, setRekapDateMode] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [rekapStartDate, setRekapStartDate] = useState('');
  const [rekapEndDate, setRekapEndDate] = useState('');

  const reviewingPaymentJamaah = consultations.find(c => c.id === reviewingPaymentJamaahId);

  // Helpdesk Admin State
  const [adminReply, setAdminReply] = useState('');

  const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' | null, title: string } | null>(null);

  // Memory Admin State
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryForm, setMemoryForm] = useState({ title: '', description: '', imageUrl: '', type: 'photo' as const, date: new Date().toISOString().split('T')[0], packageId: '', registrationId: '' });
  const [selectedMemoryFile, setSelectedMemoryFile] = useState<File | null>(null);
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);

  // Certificate Admin State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({ registrationId: '', recipientName: '', certificateUrl: '' });
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);
  const [certSearchQuery, setCertSearchQuery] = useState('');

  const toBase64 = (file: File) => new Promise<string>(async (resolve, reject) => {
    // Try uploading to /api/upload endpoint first via FormData fetch
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        const uploadRes = await res.json();
        if (uploadRes && uploadRes.url) {
          resolve(uploadRes.url);
          return;
        }
      }
    } catch (upErr) {
      console.warn("Notice: /api/upload endpoint skipped, falling back to compressed base64", upErr);
    }

    // Fallback: Compress image to small JPEG
    if (file.type.startsWith('image/')) {
      try {
        const compressedDataUrl = await compressImage(file);
        resolve(compressedDataUrl);
        return;
      } catch (err) {
        console.warn('Compression failed, falling back to original reader', err);
      }
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimension for fast storage and zero lag
            const MAX_DIM = 800;
            if (width > height && width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');
            
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  // Admin Account State
  const [adminProfileForm, setAdminProfileForm] = useState({ 
    name: currentUser?.name || 'Administrator', 
    email: currentUser?.email || 'admin@goldentravel.id', 
    phone: currentUser?.phone || '081218272734', 
    password: '', 
    confirmPassword: '' 
  });

  useEffect(() => {
    if (currentUser && currentUser.name) {
      setAdminProfileForm(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone
      }));
    }
  }, [currentUser]);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateLogo(result);
        toast.success('Logo travel berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser) {
      setAdminProfileForm(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone
      }));
    }
  }, [currentUser]);

  // CRM Search, Sub-Menu & Rekap States
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState('all');
  const [crmSubTab, setCrmSubTab] = useState<'database' | 'rekap' | 'berangkat'>('database');
  const [rekapCrmPackage, setRekapCrmPackage] = useState<string>('all');
  const [rekapCrmPaymentStatus, setRekapCrmPaymentStatus] = useState<string>('all');
  const [rekapCrmDateFilter, setRekapCrmDateFilter] = useState<string>('all');
  const [expandedRekapRows, setExpandedRekapRows] = useState<Record<string, boolean>>({});
  
  // Kelola Paket States
  // Sidebar Accordion State
  const [isPortalJemaahOpen, setIsPortalJemaahOpen] = useState(true);
  const [isPortalMitraOpen, setIsPortalMitraOpen] = useState(false);
  const [isCMSOpen, setIsCMSOpen] = useState(false);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<'umroh' | 'haji'>('umroh');
  
  // Master Data Travel Tabs
  const [activeMasterDataTab, setActiveMasterDataTab] = useState<'paket' | 'jadwal'>('paket');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  
  // High-Capacity PDF Upload Progress States (Supports Large Files up to 150MB)
  const [manasikProgress, setManasikProgress] = useState<number | null>(null);
  const [manasikFileName, setManasikFileName] = useState<string>('');
  const [itineraryProgress, setItineraryProgress] = useState<number | null>(null);
  const [itineraryFileName, setItineraryFileName] = useState<string>('');

  // Operasional Keberangkatan States
  const [activeOpsTab, setActiveOpsTab] = useState<'inventory' | 'broadcast' | 'manifest' | 'dokumen_final'>('inventory');
  const [broadcastMessage, setBroadcastMessage] = useState({ title: '', content: '', type: 'info' as any });
  const [manifestFilter, setManifestFilter] = useState('');
  const [selectedManifestReg, setSelectedManifestReg] = useState<any>(null);

  // Buku Panduan Manasik Feature States
  const [manasikSearchQuery, setManasikSearchQuery] = useState('');
  const [manasikCategoryFilter, setManasikCategoryFilter] = useState<'all' | 'umroh' | 'haji'>('all');
  const [uploadingPkgId, setUploadingPkgId] = useState<string | null>(null);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState('');

  const handleDirectManasikUpload = (pkg: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 150 * 1024 * 1024) {
      toast.error('Ukuran file PDF terlalu besar. Maksimal 150MB.');
      e.target.value = '';
      return;
    }
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diperbolehkan!');
      e.target.value = '';
      return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadingPkgId(pkg.id);
    setUploadingFileName(`${file.name} (${sizeMB} MB)`);
    setUploadingProgress(0);

    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setUploadingProgress(percent);
      }
    };
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await updatePackage({ ...pkg, manasikPdfUrl: base64 });
        toast.success(`Buku Panduan Manasik untuk "${pkg.name}" berhasil diunggah.`);
      } catch (err: any) {
        toast.error('Gagal memperbarui paket.');
      } finally {
        setUploadingPkgId(null);
        setUploadingProgress(null);
        setUploadingFileName('');
      }
    };
    reader.onerror = () => {
      setUploadingPkgId(null);
      setUploadingProgress(null);
      setUploadingFileName('');
      toast.error('Gagal membaca file PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveManasikPdf = async (pkg: any) => {
    showConfirm(
      'Hapus Buku Manasik',
      `Apakah Anda yakin ingin menghapus Buku Panduan Manasik untuk paket "${pkg.name}"?`,
      async () => {
        try {
          await updatePackage({ ...pkg, manasikPdfUrl: null });
          toast.success(`Buku Manasik untuk "${pkg.name}" berhasil dihapus.`);
        } catch (err: any) {
          toast.error('Gagal menghapus file.');
        }
      }
    );
  };

  const generatePDF = (jamaah: any) => {
    const doc = new jsPDF();
    const bio = jamaah.paxData?.[0] || {};
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(76, 124, 89); // Matcha green
    doc.text('PT. GOLDEN TOUR HARAMAIN', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Sistem Manajemen Jamaah Profesional', 105, 27, { align: 'center' });
    doc.line(20, 32, 190, 32);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('REKAPITULASI BIODATA JAMAAH', 105, 45, { align: 'center' });
    
    // Data Table
    const tableData = [
      ['NIK', bio.nik || '-'],
      ['Nama Lengkap', bio.fullName || jamaah.name],
      ['Tempat, Tanggal Lahir', `${bio.pob || '-'}, ${bio.dob || '-'}`],
      ['Jenis Kelamin', bio.gender || '-'],
      ['Status Pernikahan', bio.maritalStatus || '-'],
    ];
    
    if (bio.maritalStatus === 'Menikah') {
      tableData.push(['Nama Pasangan', bio.spouseName || '-']);
    }
    
    tableData.push(
      ['Alamat Lengkap', bio.address || '-'],
      ['Nomor HP', bio.phone || jamaah.phone || '-'],
      ['Email', bio.email || jamaah.email || '-'],
      ['Paket Dipilih', jamaah.packageName || '-'],
      ['Status Pembayaran', jamaah.paymentStep || 'none'],
      ['Status Dokumen', `${Array.isArray(jamaah.documents) ? jamaah.documents.length : 0} Berkas`]
    );

    // Section 2: Emergency Contact
    const emergencyData = [
      ['Nama Kontak Darurat', bio.emergencyName || '-'],
      ['Hubungan', bio.emergencyRelation || '-'],
      ['No. HP Darurat', bio.emergencyPhone || '-'],
    ];

    // Section 3: Passport
    const passportData = [
      ['Nomor Paspor', bio.passportNo || '-'],
      ['Kantor Penerbit', bio.passportOffice || '-'],
      ['Masa Berlaku', bio.passportExpiryDate || '-'],
      ['Riwayat Medis', bio.medicalHistory === 'Lainnya' ? (bio.medicalHistoryDetails || 'Lainnya') : (bio.medicalHistory || 'Sehat')],
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Kategori', 'Detail Informasi']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [76, 124, 89] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    const currentY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Kontak Darurat & Rekam Medis', 14, currentY + 15);
    
    autoTable(doc, {
      startY: currentY + 20,
      body: [...emergencyData, ...passportData],
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Footer / Signature
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    if (finalY > 250) doc.addPage();
    
    const signatureY = finalY > 250 ? 40 : finalY;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Batam, ' + new Date().toLocaleDateString('id-ID'), 140, signatureY + 10);
    doc.text('Admin PT. Golden Tour Haramain', 140, signatureY + 20);
    doc.text('( ____________________ )', 140, signatureY + 45);

    doc.save(`Biodata_${jamaah.name.replace(/\s+/g, '_')}.pdf`);
  };

  const salesData = [
    { name: 'Jan', jamaah: 45, pendapatan: 1.25 },
    { name: 'Feb', jamaah: 52, pendapatan: 1.45 },
    { name: 'Mar', jamaah: 88, pendapatan: 2.55 },
    { name: 'Apr', jamaah: 35, pendapatan: 0.95 },
    { name: 'Mei', jamaah: 60, pendapatan: 1.80 },
    { name: 'Jun', jamaah: 75, pendapatan: 2.10 },
    { name: 'Jul', jamaah: 92, pendapatan: 2.80 },
  ];

  // Count jamaah who have active registrations and are scheduled to depart
  const activeJamaahDepartingCount = React.useMemo(() => {
    if (!registrations || registrations.length === 0) {
      return dashboardStats?.totalJamaah || 0;
    }
    const validRegs = registrations.filter((r: any) => 
      r.status !== 'CANCELLED' && r.status !== 'PILIH_PAKET' && r.status !== 'none'
    );
    const paxTotal = validRegs.reduce((acc: number, r: any) => {
      const paxCount = (parseInt(r.adultCount) || 0) + (parseInt(r.childCount) || 0) + (parseInt(r.infantCount) || 0);
      const paxData = Array.isArray(r.paxData) ? r.paxData.length : 0;
      return acc + Math.max(paxCount, paxData, 1);
    }, 0);
    return paxTotal > 0 ? paxTotal : (dashboardStats?.totalJamaah || 0);
  }, [registrations, dashboardStats]);

  const stats = [
    { 
      title: 'Jamaah Aktif', 
      value: activeJamaahDepartingCount.toLocaleString('id-ID'), 
      icon: <Users className="text-blue-500 w-6 h-6 group-hover:scale-110 transition-transform" />, 
      bg: 'bg-blue-50', 
      trend: 'Akan Berangkat',
      tab: 'crm_jamaah'
    },
    { 
      title: 'Mitra Jemaah Aktif', 
      value: (dashboardStats?.totalMitraAktif || 0).toLocaleString('id-ID'), 
      icon: <UserCheck className="text-amber-600 w-6 h-6 group-hover:scale-110 transition-transform" />, 
      bg: 'bg-amber-50', 
      trend: 'Mitra Terverifikasi',
      tab: 'daftar_mitra'
    },
    { 
      title: 'Arus Kas (Bulan Ini)', 
      value: `Rp ${(dashboardStats?.monthlyCashFlow || 0).toLocaleString('id-ID')}`, 
      icon: <Banknote className="text-green-500 w-6 h-6 group-hover:scale-110 transition-transform" />, 
      bg: 'bg-green-50', 
      trend: 'Pemasukan Terverifikasi',
      tab: 'verifikasi_keuangan'
    },
    { 
      title: 'Persiapan Dokumen', 
      value: `${dashboardStats?.docProgress || 0}%`, 
      icon: <FileText className="text-orange-500 w-6 h-6 group-hover:scale-110 transition-transform" />, 
      bg: 'bg-orange-50', 
      trend: 'Dokumen Terverifikasi',
      tab: 'verifikasi_dokumen'
    },
    { 
      title: 'Batch Terdekat', 
      value: dashboardStats?.nextBatch 
        ? (dashboardStats.nextBatch ? new Date(dashboardStats.nextBatch).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-') 
        : (dashboardStats?.nextBatchName || '-'), 
      icon: <Plane className="text-indigo-500 w-6 h-6 group-hover:scale-110 transition-transform" />, 
      bg: 'bg-indigo-50', 
      trend: dashboardStats?.nextBatchRegs !== undefined ? `${dashboardStats.nextBatchRegs} Jamaah` : 'Belum ada jadwal',
      tab: 'ops_keberangkatan'
    },
  ];

  const sCurveData = [
    { day: 'H-30', target: 10, actual: 5 },
    { day: 'H-25', target: 25, actual: 18 },
    { day: 'H-20', target: 45, actual: 42 },
    { day: 'H-15', target: 65, actual: 60 },
    { day: 'H-10', target: 85, actual: 88 },
    { day: 'H-5', target: 95, actual: null },
    { day: 'Keberangkatan', target: 100, actual: null },
  ];

  const portalJemaahSubItems = [
    { id: 'master_data', label: 'Master Data Travel', icon: <Database className="w-4 h-4" /> },
    { id: 'crm_jamaah', label: 'CRM Jamaah', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'rekap_keberangkatan', label: 'Rekap Keberangkatan', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'verifikasi_dokumen', label: 'Verifikasi Dokumen', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'verifikasi_keuangan', label: 'Verifikasi Keuangan', icon: <Banknote className="w-4 h-4" /> },
    { id: 'ops_keberangkatan', label: 'Operasional Keberangkatan', icon: <Plane className="w-4 h-4" /> },
    { id: 'buku_manasik', label: 'Buku Panduan Manasik', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'helpdesk', label: 'Helpdesk Jamaah', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'sertifikat', label: 'Manajemen Sertifikat', icon: <Award className="w-4 h-4" /> },
  ];

  const kemitraanSubItems = [
    { id: 'verifikasi_mitra', label: 'Verifikasi Mitra', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'daftar_mitra', label: 'Daftar Mitra', icon: <Users className="w-4 h-4" /> },
    { id: 'mitra_calon_jamaah', label: 'Daftar Calon Jamaah', icon: <Users className="w-4 h-4" /> },
    { id: 'mitra_sertifikat_kenangan', label: 'Manajemen Sertifikat & Kenangan', icon: <Award className="w-4 h-4" /> },
    { id: 'mitra_pencairan_komisi', label: 'Verifikasi Komisi', icon: <Wallet className="w-4 h-4" /> },
  ];

  const cmsSubItems = [
    { id: 'cms_packages', label: 'Kelola Paket', icon: <InventoryIcon className="w-4 h-4" /> },
    { id: 'cms_gallery', label: 'Galeri Foto', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'cms_videos', label: 'Galeri Video', icon: <Video className="w-4 h-4" /> },
  ];

  const menuGroups = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Jemaah Portal',
      items: portalJemaahSubItems
    },
    {
      title: 'Kemitraan',
      items: kemitraanSubItems
    },
    {
      title: 'Sistem',
      items: [
        { id: 'pengaturan', label: 'Pengaturan Admin', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const adminNotifications = actionCenter.length > 0 ? actionCenter : [
    { id: '1', title: 'Verifikasi Pembayaran', message: 'Semua pembayaran telah diverifikasi.', type: 'info', time: 'Hari ini' },
    { id: '2', title: 'Verifikasi Dokumen', message: 'Semua dokumen telah diperiksa.', type: 'info', time: 'Hari ini' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ...portalJemaahSubItems,
    ...kemitraanSubItems,
    ...cmsSubItems,
    { id: 'pengaturan', label: 'Pengaturan Admin', icon: <Settings className="w-5 h-5" /> }
  ];

  const handleApproveFinancialPayment = async (jamaahId: string, transactionId: string) => {
    setIsVerifying(true);
    try {
      await api.patch(`/admin/payments/${transactionId}/verify`, { status: 'VERIFIED' });
      toast.success(`Pembayaran berhasil diverifikasi!`);
      setRegistrations((prev: any[]) => prev.map((r: any) => {
        if (r.id === jamaahId) {
          const updatedPayments = (r.payments || []).map((p: any) => 
            p.id === transactionId ? { ...p, status: 'VERIFIED' } : p
          );
          return { ...r, payments: updatedPayments };
        }
        return r;
      }));
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectFinancialPayment = async (jamaahId: string, transactionId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Mohon isi alasan penolakan!");
      return;
    }
    setIsVerifying(true);
    try {
      await api.patch(`/admin/payments/${transactionId}/verify`, { status: 'REJECTED', reason });
      toast.info(`Pembayaran telah ditolak.`);
      setRegistrations((prev: any[]) => prev.map((r: any) => {
        if (r.id === jamaahId) {
          const updatedPayments = (r.payments || []).map((p: any) => 
            p.id === transactionId ? { ...p, status: 'REJECTED', adminNotes: reason } : p
          );
          return { ...r, payments: updatedPayments };
        }
        return r;
      }));
      setPaymentRejectionReason('');
      refreshData(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menolak pembayaran');
    } finally {
      setIsVerifying(false);
    }
  };

  const terbilangIndonesian = (nilai: number): string => {
    const angka = Math.floor(Math.abs(nilai));
    const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

    if (angka < 12) return huruf[angka];
    if (angka < 20) return terbilangIndonesian(angka - 10) + ' Belas';
    if (angka < 100) return terbilangIndonesian(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 !== 0 ? ' ' + terbilangIndonesian(angka % 10) : '');
    if (angka < 200) return 'Seratus' + (angka - 100 !== 0 ? ' ' + terbilangIndonesian(angka - 100) : '');
    if (angka < 1000) return terbilangIndonesian(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 !== 0 ? ' ' + terbilangIndonesian(angka % 100) : '');
    if (angka < 2000) return 'Seribu' + (angka - 1000 !== 0 ? ' ' + terbilangIndonesian(angka - 1000) : '');
    if (angka < 1000000) return terbilangIndonesian(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 !== 0 ? ' ' + terbilangIndonesian(angka % 1000) : '');
    if (angka < 1000000000) return terbilangIndonesian(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 !== 0 ? ' ' + terbilangIndonesian(angka % 1000000) : '');
    if (angka < 1000000000000) return terbilangIndonesian(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 !== 0 ? ' ' + terbilangIndonesian(angka % 1000000000) : '');
    return angka.toString();
  };

  const formatTerbilang = (amount: number): string => {
    if (!amount || isNaN(amount) || amount === 0) return '# Nol Rupiah #';
    const text = terbilangIndonesian(amount).replace(/\s+/g, ' ').trim();
    return `# ${text} Rupiah #`;
  };

  const handleGenerateInvoice = (jamaah: any, transactionId: string) => {
    const transaction = (jamaah.payments || []).find((t: any) => t.id === transactionId);
    if (!transaction) {
      toast.error("Data transaksi tidak ditemukan.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Professional Receipt Number Generator
      const rawId = String(transaction.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const shortCode = rawId.length > 6 ? rawId.slice(0, 6) : (rawId || '888888');
      const txDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
      const yearMonth = `${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      const receiptNo = `KWT/GTH/${yearMonth}/${shortCode}`;

      // 1. Header Banner
      doc.setFillColor(31, 58, 43); // Dark Matcha #1F3A2B
      doc.rect(0, 0, pageWidth, 34, 'F');

      // Accent Line (Gold)
      doc.setFillColor(212, 175, 55); // #D4AF37
      doc.rect(0, 34, pageWidth, 1.5, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Layanan Penyelenggara Perjalanan Ibadah Umrah & Haji Khusus', 14, 22);
      doc.text('Izin Resmi Kemenag RI (PPIU/PIHK) | Layanan Jamaah & Keuangan', 14, 27);

      // Doc Info Top Right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('KUITANSI PEMBAYARAN RESMI', pageWidth - 14, 15, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`No. Kuitansi: ${receiptNo}`, pageWidth - 14, 20, { align: 'right' });
      doc.text(`Tanggal: ${txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 25, { align: 'right' });

      // 2. Receipt Badge & Transaction Card
      doc.setFillColor(245, 247, 245);
      doc.setDrawColor(210, 222, 213);
      doc.roundedRect(14, 40, pageWidth - 28, 26, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(31, 58, 43);
      doc.text('Rincian Transaksi Setoran Jamaah', 18, 47);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      // Format Ref ID Server neatly
      const formattedRefId = rawId.length >= 8 ? `TRX-GTH-${txDate.getFullYear()}-${rawId.slice(0, 8)}` : `TRX-GTH-${txDate.getFullYear()}-${rawId.padStart(6, '0')}`;
      doc.text(`Ref ID Server: ${formattedRefId}`, 18, 53);
      doc.text(`Status Verifikasi: VERIFIED / LUNAS DITERIMA`, 18, 58);

      // Stage label conversion
      let stageLabel = 'Setoran DP 1';
      const pType = String(transaction.paymentType || transaction.type || 'dp1').toLowerCase();
      if (pType === 'dp2' || pType === 'cicilan') stageLabel = 'Setoran DP 2';
      else if (pType === 'pelunasan') stageLabel = 'Pelunasan Sisa Tagihan';
      else if (pType === 'full' || pType === 'pelunasan_full') stageLabel = 'Pelunasan Full (Langsung Lunas)';

      const amountNumber = Number(transaction.amount || 0);
      const amountFormatted = `Rp ${amountNumber.toLocaleString('id-ID')}`;

      // 3. Table Breakdown
      autoTable(doc, {
        startY: 70,
        margin: { left: 14, right: 14 },
        head: [['RINCIAN ITEM', 'KETERANGAN BUKTI PEMBAYARAN']],
        body: [
          ['Nomor Kuitansi', receiptNo],
          ['Nama Jamaah / Penyetor', jamaah.name || 'Jamaah Umroh'],
          ['Nomor Kontak / Telepon', jamaah.phone || '-'],
          ['Email Jamaah', jamaah.email || '-'],
          ['Paket Umroh', jamaah.packageName || 'Paket Umroh Reguler'],
          ['Tahap Pembayaran', stageLabel],
          ['Metode Pembayaran', 'Transfer Bank (Verifikasi Sistem)'],
          ['Tanggal Setoran', txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
          ['JUMLAH SETORAN DITERIMA', amountFormatted]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [31, 58, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [40, 40, 40]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 248] },
          1: { cellWidth: 'auto' }
        },
        didParseCell: (data) => {
          if (data.row.index === 8 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
            data.cell.styles.textColor = [31, 58, 43];
            data.cell.styles.fillColor = [226, 235, 229];
          }
        }
      });

      const currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 140;

      // 4. Terbilang Callout Box
      doc.setFillColor(240, 245, 241);
      doc.setDrawColor(200, 215, 203);
      doc.roundedRect(14, currentY + 6, pageWidth - 28, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(31, 58, 43);
      doc.text('TERBILANG :', 18, currentY + 14);

      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 83, 45);
      doc.text(formatTerbilang(amountNumber), 42, currentY + 14);

      // 5. Signature Section
      const signRightX = pageWidth - 45;
      const startSignY = currentY + 28;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(`Batam, ${txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signRightX, startSignY, { align: 'center' });
      doc.text('Disetujui & Disahkan oleh,', signRightX, startSignY + 5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 58, 43);
      doc.text('Departemen Keuangan & Akuntansi', signRightX, startSignY + 10, { align: 'center' });

      // Signature Name & Role (without stamp box, clean)
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 58, 43);
      doc.text('AHMAD DAUD', signRightX, startSignY + 32, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Head of Finance & Treasury', signRightX, startSignY + 37, { align: 'center' });

      // Page Footer Line
      doc.setDrawColor(220, 220, 220);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('PT. Golden Tour Haramain — Bukti Sah Kuitansi Pembayaran Digital', 14, pageHeight - 7);
      doc.text('Halaman 1 dari 1', pageWidth - 14, pageHeight - 7, { align: 'right' });

      doc.save(`Kuitansi_${jamaah.name.replace(/\s+/g, '_')}_${receiptNo.replace(/\//g, '_')}.pdf`);
      toast.success(`Kuitansi ${receiptNo} berhasil diunduh!`);
    } catch (error) {
      console.error('Gagal mencetak kuitansi:', error);
      toast.error('Gagal mencetak kuitansi PDF. Silakan coba lagi.');
    }
  };

  const handleOpenPackageModal = (pkg: any = null) => {
    const editPkg = pkg ? { ...pkg } : {
      id: Date.now().toString(),
      name: '',
      description: [''],
      price: 0,
      duration: '',
      features: [],
      image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80',
      type: activePackageTab,
      isAvailable: true,
      scheduleUrl: '',
      manasikPdfUrl: '',
      quota: 45
    };
    if (pkg && pkg.imageUrl) {
      editPkg.image = pkg.imageUrl;
    }
    if (pkg && typeof pkg.description === 'string') {
      try {
        editPkg.description = JSON.parse(pkg.description);
        if (!Array.isArray(editPkg.description)) {
          editPkg.description = [pkg.description];
        }
      } catch(e) {
        editPkg.description = [pkg.description];
      }
    } else if (pkg && !Array.isArray(pkg.description)) {
      editPkg.description = [pkg.description];
    }
    if (pkg && pkg.price !== undefined) {
      editPkg.price = Number(pkg.price);
    }
    if (pkg && pkg.quota !== undefined) {
      editPkg.quota = Number(pkg.quota);
    }
    setEditingPackage(editPkg);
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = (e: any) => {
    e.preventDefault();
    if (packages.find(p => p.id === editingPackage.id)) {
      updatePackage(editingPackage);
    } else {
      addPackage(editingPackage);
    }
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    setDeletePackageId(id);
  };

  const handleOpenScheduleModal = (sch: any = null) => {
    setEditingSchedule(sch ? {
      ...sch,
      muthawwifName: sch.muthawwifName || 'Ustadz Hanan Attaki',
      muthawwifRole: sch.muthawwifRole || 'Muthawwif Utama & Pembimbing Syariah',
      muthawwifPhone: sch.muthawwifPhone || '081234567890',
      muthawwifAvatarUrl: sch.muthawwifAvatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      muthawwifNotes: sch.muthawwifNotes || "Assalamu'alaikum jemaah. Diharapkan hadir manasik H-3 sebelum keberangkatan di Asrama Haji. Pastikan fisik dan dokumen paspor telah siap.",
    } : {
      id: Date.now().toString(),
      packageId: packages[0]?.id || '',
      departureDate: '',
      name: '',
      airline: '',
      itineraryPdfUrl: '',
      availableSeats: 45,
      totalSeats: 45,
      muthawwifName: 'Ustadz Hanan Attaki',
      muthawwifRole: 'Muthawwif Utama & Pembimbing Syariah',
      muthawwifPhone: '081234567890',
      muthawwifAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      muthawwifNotes: "Assalamu'alaikum jemaah. Diharapkan hadir manasik H-3 sebelum keberangkatan di Asrama Haji. Pastikan fisik dan dokumen paspor telah siap."
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (schedules.find(s => s.id === editingSchedule.id)) {
      updateSchedule(editingSchedule);
    } else {
      addSchedule(editingSchedule);
    }
    setIsScheduleModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    showConfirm(
      'Hapus Jadwal',
      'Apakah Anda yakin ingin menghapus jadwal ini? Data tidak dapat dikembalikan.',
      () => {
        deleteSchedule(id);
      }
    );
  };

  const handleUpdateInventory = (jamaahId: string, item: 'koper' | 'ihram' | 'mukena', currentStatus: any) => {
    updateInventory(jamaahId, item, currentStatus);
  };

  
  
  const uploadFinalDocument = async (registrationId: string, docType: string, url: string) => {
    try {
      await api.post(`/admin/final-documents/${registrationId}`, { docType, fileUrl: url });
      toast.success('Dokumen berhasil diunggah');
      await refreshData(true);
    } catch (e: any) {
      toast.error('Gagal mengunggah dokumen: ' + e.message);
    }
  };

  const updateManifest = async (registrationId: string, data: any) => {
    try {
      await api.patch(`/admin/manifest/${registrationId}`, data);
      toast.success('Manifest berhasil diperbarui');
    } catch (e: any) {
      toast.error('Gagal memperbarui manifest: ' + (e.response?.data?.error || e.message || 'Server error'));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    showConfirm(
      'Hapus Pengumuman',
      'Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          await api.delete(`/admin/broadcast/${id}`);
          toast.success('Pengumuman dihapus');
          await refreshData(true);
        } catch (e: any) {
          toast.error('Gagal menghapus pengumuman');
        }
      }
    );
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.title || !broadcastMessage.content) {
      toast.error('Judul dan konten pengumuman wajib diisi');
      return;
    }
    try {
      await api.post('/admin/broadcast', broadcastMessage);
      setBroadcastMessage({ title: '', content: '', type: 'info' });
      toast.success('Pengumuman berhasil dikirim ke seluruh jamaah!');
      await refreshData(true);
    } catch (e: any) {
      toast.error('Gagal mengirim pengumuman: ' + (e.message || 'Error server'));
    }
  };

  const generateManifestPDF = () => {
    const doc = new jsPDF();
    const paidJamaah = consultations.filter(c => c.status !== 'none' && c.status !== 'cancelled' && c.packageName !== 'Belum Memilih Paket');
    
    doc.setFontSize(16);
    doc.setTextColor(20, 83, 45); // Emerald-900
    doc.text('MANIFES KEBERANGKATAN JAMAAH RESMI', 105, 18, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('PT. GOLDEN TOUR HARAMAIN', 105, 24, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(15, 28, 195, 28);

    const rows: any[] = [];
    let rowNo = 1;

    paidJamaah.forEach((c) => {
      const m = manifest?.find(item => item.registrationId === c.id);
      const rawPax = c.paxData && Array.isArray(c.paxData) && c.paxData.length > 0
        ? c.paxData
        : [{ fullName: c.name || 'Jamaah Utama' }];

      const splitSeats = m?.airplaneSeat ? m.airplaneSeat.split(/[,;/]\s*/).map((s: string) => s.trim()) : [];
      const splitBuses = m?.busNumber ? m.busNumber.split(/[,;/]\s*/).map((b: string) => b.trim()) : [];
      const splitRooms = m?.hotelRoom ? m.hotelRoom.split(/[,;/]\s*/).map((r: string) => r.trim()) : [];

      rawPax.forEach((pax: any, pIdx: number) => {
        const pm = m?.paxManifest?.[pIdx];
        const fullName = pm?.fullName || pax.fullName || c.name || '-';
        const seat = pm?.airplaneSeat || splitSeats[pIdx] || (splitSeats.length === 1 ? splitSeats[0] : m?.airplaneSeat || '-');
        const bus = pm?.busNumber || splitBuses[pIdx] || (splitBuses.length === 1 ? splitBuses[0] : m?.busNumber || '-');
        const room = pm?.hotelRoom || splitRooms[pIdx] || (splitRooms.length === 1 ? splitRooms[0] : m?.hotelRoom || '-');

        rows.push([
          rowNo++,
          fullName,
          c.packageName || '-',
          seat,
          bus,
          room,
          'LUNAS'
        ]);
      });
    });

    autoTable(doc, {
      head: [['No', 'Nama Jamaah', 'Paket Umrah/Haji', 'Kursi Pesawat', 'Bus', 'Kamar Hotel', 'Status']],
      body: rows,
      startY: 34,
      headStyles: { fillColor: [20, 83, 45], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 }
      }
    });

    doc.save(`Manifest_Keberangkatan_Jamaah_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('File Manifes Keberangkatan PDF berhasil diunduh');
  };

  const handleReplyTicketAdmin = async () => {
    if (!adminReply || !selectedTicket) return;
    try {
      await api.post(`/admin/support/tickets/${selectedTicket.id}/reply`, { message: adminReply });
      setAdminReply('');
      toast.success("Balasan terkirim!");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Gagal membalas tiket.");
    }
  };

  const handleCloseTicket = async (ticket: any) => {
    try {
      await api.post(`/admin/support/tickets/${ticket.id}/reply`, { message: "Tiket ditutup oleh Admin", status: 'closed' });
      toast.success("Tiket bantuan telah ditutup.");
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Gagal menutup tiket.");
    }
  };

  const handleUpdateAdminProfile = async () => {
    if (isUpdatingProfile) return;
    if (adminProfileForm.password && adminProfileForm.password !== adminProfileForm.confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      // Update admin profile & credentials via API
      const payload: any = {
        name: adminProfileForm.name,
        phone: adminProfileForm.phone,
        email: adminProfileForm.email,
      };

      if (adminProfileForm.password) {
        payload.password = adminProfileForm.password;
      }

      const res = await api.patch('/users/me', payload);

      if (res?.token) {
        localStorage.setItem('admin_token', res.token);
        sessionStorage.setItem('admin_token', res.token);
      }
      
      const updatedUserObj = {
        ...(currentUser || {}),
        name: res?.name || payload.name,
        phone: res?.phone || payload.phone,
        email: res?.email || payload.email,
        role: 'admin'
      };

      // Real-time immediate update of currentUser state
      setCurrentUser(updatedUserObj);

      try {
        const rawCache = sessionStorage.getItem("cached_admin_portal_data");
        const existingCache = rawCache ? JSON.parse(rawCache) : {};
        sessionStorage.setItem("cached_admin_portal_data", JSON.stringify({
          ...existingCache,
          currentUser: updatedUserObj
        }));
      } catch (e) {
        sessionStorage.setItem("cached_admin_portal_data", JSON.stringify({ currentUser: updatedUserObj }));
      }

      setAdminProfileForm({
        name: updatedUserObj.name,
        phone: updatedUserObj.phone,
        email: updatedUserObj.email,
        password: '',
        confirmPassword: ''
      });

      toast.success("Profil dan kata sandi admin berhasil diperbarui!");

      // Sync backend
      refreshData(true, true);

      // Optionally update password in Firebase if logged in via Firebase
      if (adminProfileForm.password) {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          try {
            await updatePassword(firebaseUser, adminProfileForm.password);
          } catch (pwError: any) {
            console.warn("Notice: Firebase auth password update skipped:", pwError?.message);
          }
        }
      }

      toast.success("Profil admin dan sistem berhasil diperbarui!");
      refreshData(true, true);
    } catch (error: any) {
      console.error("Admin profile update error:", error);
      let msg = error?.message || "Gagal memperbarui profil admin.";
      if (typeof msg === 'string' && (msg.includes('Failed query') || msg.includes('SELECT') || msg.includes('UPDATE'))) {
        msg = "Gagal memperbarui profil admin. Silakan periksa koneksi data.";
      }
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddMemory = async () => {
    if (isSubmittingMemory) return;
    setIsSubmittingMemory(true);
    try {
      let finalUrl = memoryForm.imageUrl;
      if (selectedMemoryFile) {
        if (selectedMemoryFile.type.startsWith('image/')) {
          finalUrl = await compressImage(selectedMemoryFile);
        } else {
          finalUrl = await toBase64(selectedMemoryFile);
        }
      }

      if (!finalUrl) {
        toast.error("Silakan pilih file atau masukkan URL gambar.");
        return;
      }

      await api.post('/admin/memories', {
        packageId: memoryForm.packageId || undefined,
        registrationId: memoryForm.registrationId || undefined,
        imageUrl: finalUrl,
        caption: memoryForm.description || memoryForm.title
      });
      setIsMemoryModalOpen(false);
      setMemoryForm({ title: '', description: '', imageUrl: '', type: 'photo', date: new Date().toISOString().split('T')[0], packageId: '', registrationId: '' });
      setSelectedMemoryFile(null);
      fetchMemories();
      toast.success("Momen berhasil diunggah.");
    } catch (error: any) {
      console.error("Memory upload error:", error);
      toast.error(error.message || "Gagal mengunggah momen.");
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  const deleteMemory = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Kenangan?",
      message: "Apakah Anda yakin ingin menghapus kenangan perjalanan ini? Tindakan ini tidak dapat dibatalkan.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/memories/${id}`);
          fetchMemories();
          toast.success("Kenangan berhasil dihapus.");
        } catch (error: any) {
          toast.error(error.message || "Gagal menghapus kenangan.");
        }
      }
    });
  };

  const handleAddCertificate = async () => {
    if (!certForm.registrationId) {
      toast.error("Pilih data jamaah / registrasi terlebih dahulu.");
      return;
    }

    const selectedReg = consultations.find(c => c.id === certForm.registrationId) || registrations.find(r => r.id === certForm.registrationId);
    const defaultName = selectedReg?.name || selectedReg?.ordererName || 'Jamaah';
    const finalRecipientName = certForm.recipientName.trim() || defaultName;

    setIsSubmittingCert(true);
    try {
      let finalUrl = certForm.certificateUrl;
      if (selectedCertFile) {
        finalUrl = await toBase64(selectedCertFile);
      }

      if (!finalUrl) {
        toast.error("Silakan pilih berkas sertifikat (PDF/Gambar) atau masukkan URL.");
        setIsSubmittingCert(false);
        return;
      }

      await api.post('/admin/certificates', {
        registrationId: certForm.registrationId,
        recipientName: finalRecipientName,
        certificateUrl: finalUrl
      });

      setIsCertModalOpen(false);
      setCertForm({ registrationId: '', recipientName: '', certificateUrl: '' });
      setSelectedCertFile(null);
      fetchCertificates();
      toast.success(`Sertifikat untuk ${finalRecipientName} berhasil diunggah!`);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah sertifikat.");
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const deleteCertificate = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Sertifikat?",
      message: "Apakah Anda yakin ingin menghapus sertifikat ini? Jamaah tidak akan bisa lagi melihat sertifikat ini di dashboard mereka.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/certificates/${id}`);
          fetchCertificates();
          toast.success("Sertifikat berhasil dihapus.");
        } catch (error: any) {
          toast.error(error.message || "Gagal menghapus sertifikat.");
        }
      }
    });
  };

  
  return (
    <div className="min-h-screen bg-gray-100 flex font-sans relative">
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-amber-500/20 overflow-hidden">
          <div className="h-full bg-amber-500 animate-pulse w-full"></div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full'} bg-[#132019] text-white flex flex-col shadow-2xl transition-all duration-300 z-20 shrink-0 h-screen sticky top-0 overflow-y-auto overflow-x-hidden`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#132019] z-10 w-64">
          {isSidebarOpen && (
            <Link to="/" className="flex items-center space-x-3 group min-w-0">
              <div className="w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center p-1 shrink-0">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="font-bold text-sm tracking-wider text-gold-400 uppercase truncate">Admin Panel</span>
            </Link>
          )}
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg shrink-0" title="Tutup Menu">
            <Menu className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        <div className="py-4 flex-1 w-64 overflow-y-auto custom-scrollbar">
          <nav className="space-y-4 px-3 pb-4">
            {/* UTAMA */}
            <div className="space-y-1">
              {isSidebarOpen && (
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 pb-1">Utama</h3>
              )}
              <button 
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-gold-500 text-gray-900 font-bold shadow-lg' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Dashboard' : ''}
              >
                <div className={activeTab === 'dashboard' ? 'text-gray-900' : 'text-slate-400'}>
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                {isSidebarOpen && <span className="text-sm truncate">Dashboard</span>}
              </button>
            </div>

            {/* PORTAL JEMAAH (SINGLE PARENT ITEM WITH SUBTITLE & SUB-ITEMS) */}
            <div className="space-y-1">
              {isSidebarOpen && (
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 pb-1">Layanan Utama</h3>
              )}
              
              {/* Parent Accordion Button */}
              <button 
                type="button"
                onClick={() => setIsPortalJemaahOpen(!isPortalJemaahOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${
                  portalJemaahSubItems.some(item => item.id === activeTab)
                    ? 'bg-white/15 text-white font-bold border border-gold-400/40 shadow-md' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Portal Jemaah' : ''}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    portalJemaahSubItems.some(item => item.id === activeTab)
                      ? 'bg-gold-500 text-gray-900 shadow-sm' 
                      : 'bg-white/10 text-gold-400'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <div className="text-sm font-bold leading-tight">Portal Jemaah</div>
                      <div className="text-[10px] text-gold-400 font-bold tracking-wide">Jemaah Portal</div>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                    isPortalJemaahOpen ? 'rotate-180 text-gold-400' : 'text-slate-400'
                  }`} />
                )}
              </button>

              {/* Sub-items Container */}
              {(isPortalJemaahOpen || !isSidebarOpen) && (
                <div className={`${isSidebarOpen ? 'pl-3 pr-1 py-1 space-y-1 border-l-2 border-gold-500/40 ml-4 my-1' : 'space-y-1'}`}>
                  {portalJemaahSubItems.map((subItem) => (
                    <button
                      type="button"
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === subItem.id
                          ? 'bg-gold-500 text-gray-900 font-extrabold shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={!isSidebarOpen ? subItem.label : ''}
                    >
                      <div className={`shrink-0 ${activeTab === subItem.id ? 'text-gray-900' : 'text-slate-400'}`}>
                        {subItem.icon}
                      </div>
                      {isSidebarOpen && <span className="truncate">{subItem.label}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PORTAL MITRA */}
            <div className="space-y-1">
              {/* Parent Accordion Button */}
              <button 
                type="button"
                onClick={() => setIsPortalMitraOpen(!isPortalMitraOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${
                  kemitraanSubItems.some(item => item.id === activeTab)
                    ? 'bg-white/15 text-white font-bold border border-gold-400/40 shadow-md' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Portal Mitra' : ''}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    kemitraanSubItems.some(item => item.id === activeTab)
                      ? 'bg-gold-500 text-gray-900 shadow-sm' 
                      : 'bg-white/10 text-gold-400'
                  }`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <div className="text-sm font-bold leading-tight">Portal Mitra</div>
                      <div className="text-[10px] text-gold-400 font-bold tracking-wide">Partner Portal</div>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                    isPortalMitraOpen ? 'rotate-180 text-gold-400' : 'text-slate-400'
                  }`} />
                )}
              </button>

              {/* Sub-items Container */}
              {(isPortalMitraOpen || !isSidebarOpen) && (
                <div className={`${isSidebarOpen ? 'pl-3 pr-1 py-1 space-y-1 border-l-2 border-gold-500/40 ml-4 my-1' : 'space-y-1'}`}>
                  {kemitraanSubItems.map((subItem) => (
                    <button
                      type="button"
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === subItem.id
                          ? 'bg-gold-500 text-gray-900 font-extrabold shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={!isSidebarOpen ? subItem.label : ''}
                    >
                      <div className={`shrink-0 ${activeTab === subItem.id ? 'text-gray-900' : 'text-slate-400'}`}>
                        {subItem.icon}
                      </div>
                      {isSidebarOpen && <span className="truncate">{subItem.label}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* KELOLA WEBSITE CMS */}
            <div className="space-y-1">
              {isSidebarOpen && (
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 pb-1">Konten Website</h3>
              )}
              
              <button 
                type="button"
                onClick={() => setIsCMSOpen(!isCMSOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${
                  cmsSubItems.some(item => item.id === activeTab)
                    ? 'bg-white/15 text-white font-bold border border-gold-400/40 shadow-md' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Kelola Website' : ''}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    cmsSubItems.some(item => item.id === activeTab)
                      ? 'bg-gold-500 text-gray-900 shadow-sm' 
                      : 'bg-white/10 text-gold-400'
                  }`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <div className="text-sm font-bold leading-tight">Kelola Website</div>
                      <div className="text-[10px] text-gold-400 font-bold tracking-wide">CMS Manager</div>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                    isCMSOpen ? 'rotate-180 text-gold-400' : 'text-slate-400'
                  }`} />
                )}
              </button>

              {(isCMSOpen || !isSidebarOpen) && (
                <div className={`${isSidebarOpen ? 'pl-3 pr-1 py-1 space-y-1 border-l-2 border-gold-500/40 ml-4 my-1' : 'space-y-1'}`}>
                  {cmsSubItems.map((subItem) => (
                    <button
                      type="button"
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === subItem.id
                          ? 'bg-gold-500 text-gray-900 font-extrabold shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      title={!isSidebarOpen ? subItem.label : ''}
                    >
                      <div className={`shrink-0 ${activeTab === subItem.id ? 'text-gray-900' : 'text-slate-400'}`}>
                        {subItem.icon}
                      </div>
                      {isSidebarOpen && <span className="truncate">{subItem.label}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SISTEM */}
            <div className="space-y-1 pt-1">
              {isSidebarOpen && (
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 pb-1">Sistem</h3>
              )}
              <button 
                type="button"
                onClick={() => setActiveTab('pengaturan')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'pengaturan' 
                    ? 'bg-gold-500 text-gray-900 font-bold shadow-lg' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Pengaturan Admin' : ''}
              >
                <div className={activeTab === 'pengaturan' ? 'text-gray-900' : 'text-slate-400'}>
                  <Settings className="w-5 h-5" />
                </div>
                {isSidebarOpen && <span className="text-sm truncate">Pengaturan Admin</span>}
              </button>
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10 sticky bottom-0 bg-[#132019] w-64">
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-3 px-4 py-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden bg-gray-100">
        <header className="bg-gradient-to-r from-[#0d281e] via-[#132019] to-[#0b2219] border-b border-emerald-900/60 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button 
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center justify-center border border-white/20 shadow-sm cursor-pointer active:scale-95"
                title="Buka Menu Sidebar"
              >
                <Menu className="w-5 h-5 text-emerald-100" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-white capitalize tracking-wide flex items-center gap-2">
                {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-[11px] text-emerald-300/80 font-medium">Sistem Manajemen Golden Travel Haramain</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 relative">
            {/* IN-APP NOTIFICATION BELL */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center border ${
                  showNotifDropdown
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg scale-105'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/20 border-white/20 hover:text-white'
                }`}
                title="Pusat Notifikasi Aplikasi"
              >
                <Bell className="w-5 h-5" />
                {adminNotifications.filter(n => !readNotifIds.includes(n.id)).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-[#0d281e] animate-pulse shadow-md">
                    {adminNotifications.filter(n => !readNotifIds.includes(n.id)).length}
                  </span>
                )}
              </button>

              {/* NOTIFICATION CENTER DROPDOWN */}
              {showNotifDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setShowNotifDropdown(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] border border-slate-100 z-[101] overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Dropdown Header */}
                    <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-5 text-white flex items-center justify-between border-b border-emerald-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-playfair font-bold text-sm text-white">Notifikasi Aplikasi</h4>
                          <p className="text-[10px] text-emerald-300 font-medium">
                            {adminNotifications.filter(n => !readNotifIds.includes(n.id)).length} pemberitahuan belum dibaca
                          </p>
                        </div>
                      </div>
                      
                      {adminNotifications.filter(n => !readNotifIds.includes(n.id)).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setReadNotifIds(adminNotifications.map(n => n.id))}
                          className="text-[10px] font-bold text-amber-300 hover:text-amber-200 hover:underline cursor-pointer"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNotifFilter('all')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            notifFilter === 'all'
                              ? 'bg-emerald-900 text-amber-300 shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Semua ({adminNotifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifFilter('unread')}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            notifFilter === 'unread'
                              ? 'bg-emerald-900 text-amber-300 shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Belum Dibaca ({adminNotifications.filter(n => !readNotifIds.includes(n.id)).length})
                        </button>
                      </div>
                    </div>

                    {/* Notification Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {adminNotifications
                        .filter(n => notifFilter === 'all' || !readNotifIds.includes(n.id))
                        .length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-40" />
                          <p className="text-xs font-bold text-slate-600">Tidak ada notifikasi saat ini</p>
                          <p className="text-[11px] text-slate-400">Semua aktivitas dan permohonan telah selesai diproses.</p>
                        </div>
                      ) : (
                        adminNotifications
                          .filter(n => notifFilter === 'all' || !readNotifIds.includes(n.id))
                          .map((notif) => {
                            const isRead = readNotifIds.includes(notif.id);
                            return (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  if (!isRead) setReadNotifIds([...readNotifIds, notif.id]);
                                  if (notif.target === 'jamaah' || notif.target === 'mitra_calon_jamaah') setActiveTab('mitra_calon_jamaah');
                                  else if (notif.target === 'mitra' || notif.target === 'verifikasi_mitra') setActiveTab('verifikasi_mitra');
                                  else if (notif.target === 'pembayaran' || notif.target === 'verifikasi_keuangan') setActiveTab('verifikasi_keuangan');
                                  setShowNotifDropdown(false);
                                }}
                                className={`p-4 transition-all hover:bg-slate-50 cursor-pointer relative group flex gap-3 ${
                                  !isRead ? 'bg-amber-50/40' : ''
                                }`}
                              >
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 animate-pulse" />
                                )}

                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-900 transition-colors">
                                      {notif.title}
                                    </h5>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {notif.time || 'Baru'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-snug font-medium line-clamp-2">
                                    {notif.message}
                                  </p>

                                  <div className="pt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1">
                                      Proses Sekarang &rarr;
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="bg-slate-50 p-3 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('dashboard');
                          setShowNotifDropdown(false);
                        }}
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-900 transition-colors cursor-pointer"
                      >
                        Buka Action Center Lengkap
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-white">{currentUser?.name || adminProfileForm?.name || 'Administrator'}</p>
              <p className="text-xs text-gold-400 font-semibold">{currentUser?.email || adminProfileForm?.email || 'Admin Workspace'}</p>
            </div>
            <div className="w-10 h-10 bg-gold-500 text-gray-950 border-2 border-gold-300 rounded-full flex items-center justify-center font-black shadow-md overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Admin Avatar" className="w-full h-full object-cover" />
              ) : (
                (currentUser?.name || adminProfileForm?.name || 'Admin')
                  .split(' ')
                  .map((n: string) => n[0])
                  .filter(Boolean)
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'verifikasi_keuangan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header & Submenu Navigation */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white shadow-md p-6 rounded-3xl border border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Verifikasi Keuangan & Transaksi</h2>
                  <p className="text-sm text-gray-600 mt-1">Audit pembayaran, rekapan per-tahap (DP1, DP2, Pelunasan), dan laporan arus kas.</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl flex-wrap gap-1">
                  <button 
                    onClick={() => setActiveFinanceSubTab('verifikasi')}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeFinanceSubTab === 'verifikasi' ? 'bg-white shadow-md text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Verifikasi Setoran
                  </button>
                  <button 
                    onClick={() => setActiveFinanceSubTab('rekap_tahap')}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeFinanceSubTab === 'rekap_tahap' ? 'bg-white shadow-md text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Rekapan Per-Tahap
                  </button>
                  <button 
                    onClick={() => setActiveFinanceSubTab('laporan')}
                    className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeFinanceSubTab === 'laporan' ? 'bg-white shadow-md text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Laporan Keuangan
                  </button>
                </div>
              </div>

              {/* Subtab 1: Verifikasi Setoran Jamaah */}
              {activeFinanceSubTab === 'verifikasi' && (
                <div className="bg-white shadow-md rounded-3xl overflow-hidden border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                        <th className="p-5 border-b border-gray-100">Jamaah</th>
                        <th className="p-5 border-b border-gray-100">Tagihan & Pembayaran</th>
                        <th className="p-5 border-b border-gray-100">Konfirmasi Pending</th>
                        <th className="p-5 border-b border-gray-100 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...consultations].sort((a, b) => {
                        const aPending = (a.payments || []).some((p: any) => ['pending', 'PENDING'].includes(p.status)) ? 1 : 0;
                        const bPending = (b.payments || []).some((p: any) => ['pending', 'PENDING'].includes(p.status)) ? 1 : 0;
                        return bPending - aPending;
                      }).map((c) => {
                        const pkg = packages.find(p => p.id === c.packageId) || packages.find(p => p.name === c.packageName);
                        const basePrice = pkg?.price || 0;
                        const paxCount = c.paxCount || 1;
                        const packagePrice = basePrice * paxCount;
                        const payments = c.payments || [];
                        const totalPaid = payments.filter((t: any) => ['approved', 'VERIFIED'].includes(t.status)).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
                        const pendingTx = payments.filter((t: any) => ['pending', 'PENDING'].includes(t.status));
                        const remaining = Math.max(0, packagePrice - totalPaid);

                        return (
                          <tr key={c.id} className="hover:bg-gold-50/20 transition-colors group">
                            <td className="p-5">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gold-100 text-gold-700 rounded-xl flex items-center justify-center font-bold">
                                  {(c.name || '?').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{c.name || 'Tanpa Nama'}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-600">{c.packageName || 'Belum Pilih Paket'}</p>
                                    {c.paxCount > 1 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-100">
                                        <UsersRound className="w-2.5 h-2.5 mr-0.5" /> {c.paxCount} PAX
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-900">Total: Rp {Number(packagePrice).toLocaleString('id-ID')}</p>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${remaining <= 0 && packagePrice > 0 ? 'bg-green-500' : 'bg-gold-500'}`}
                                    style={{ width: `${Math.min((totalPaid / (packagePrice || 1)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <p className="text-[10px] text-gray-400">Sisa: Rp {Number(remaining).toLocaleString('id-ID')}</p>
                              </div>
                            </td>
                            <td className="p-5">
                              {pendingTx.length > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 uppercase border border-orange-100">
                                  <History className="w-3 h-3 mr-1" /> {pendingTx.length} Bukti Transfer
                                </span>
                              ) : remaining <= 0 && packagePrice > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 uppercase border border-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" /> LUNAS
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Belum Ada Setoran</span>
                              )}
                            </td>
                            <td className="p-5 text-right">
                              <button 
                                onClick={() => {
                                  setReviewingPaymentJamaahId(c.id);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-4 py-2 bg-matcha-600 text-white rounded-xl text-xs font-bold hover:bg-matcha-700 shadow-sm transition-all"
                              >
                                Detail & Verifikasi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subtab 2: Rekapan Per-Tahap Pembayaran */}
              {activeFinanceSubTab === 'rekap_tahap' && (() => {
                const allPaymentsList = consultations.flatMap((c) => {
                  const pkg = packages.find(p => p.id === c.packageId) || packages.find(p => p.name === c.packageName);
                  const payments = c.payments || [];
                  return payments.map((t: any) => ({
                    ...t,
                    jamaahId: c.id,
                    jamaahName: c.name || 'Tanpa Nama',
                    jamaahPhone: c.phone || '-',
                    jamaahEmail: c.email || '-',
                    packageName: c.packageName || 'Belum Pilih Paket',
                    packagePrice: (pkg?.price || 0) * (c.paxCount || 1),
                    consultationObj: c
                  }));
                }).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                // Aggregates
                const dp1List = allPaymentsList.filter(p => ['dp1', 'dp', 'dp_1'].includes(String(p.paymentType || '').toLowerCase()));
                const dp1Total = dp1List.filter(p => ['approved', 'VERIFIED'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0);

                const dp2List = allPaymentsList.filter(p => ['dp2', 'cicilan', 'dp_2'].includes(String(p.paymentType || '').toLowerCase()));
                const dp2Total = dp2List.filter(p => ['approved', 'VERIFIED'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0);

                const pelunasanList = allPaymentsList.filter(p => ['pelunasan', 'pelunasan_sisa', 'pelunasan sisa', 'sisa', 'pelunasan_dp3'].includes(String(p.paymentType || '').toLowerCase()));
                const pelunasanTotal = pelunasanList.filter(p => ['approved', 'VERIFIED'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0);

                const fullList = allPaymentsList.filter(p => ['full', 'pelunasan_full', 'pelunasan full', 'lunas'].includes(String(p.paymentType || '').toLowerCase()));
                const fullTotal = fullList.filter(p => ['approved', 'VERIFIED'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0);

                // Filter list
                const filteredPaymentsList = allPaymentsList.filter(p => {
                  const pt = String(p.paymentType || '').toLowerCase();
                  if (rekapStageFilter === 'dp1' && !['dp1', 'dp', 'dp_1'].includes(pt)) return false;
                  if (rekapStageFilter === 'dp2' && !['dp2', 'cicilan', 'dp_2'].includes(pt)) return false;
                  if (rekapStageFilter === 'pelunasan' && !['pelunasan', 'pelunasan_sisa', 'pelunasan sisa', 'sisa', 'pelunasan_dp3'].includes(pt)) return false;
                  if (rekapStageFilter === 'full' && !['full', 'pelunasan_full', 'pelunasan full', 'lunas'].includes(pt)) return false;

                  if (rekapStatusFilter === 'approved' && !['approved', 'VERIFIED'].includes(p.status)) return false;
                  if (rekapStatusFilter === 'rejected' && !['rejected', 'REJECTED'].includes(p.status)) return false;
                  if (rekapStatusFilter === 'pending' && !['pending', 'PENDING'].includes(p.status)) return false;

                  // Date Filter
                  if (rekapDateMode === 'month') {
                    const itemDate = new Date(p.createdAt || 0);
                    const now = new Date();
                    if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
                      return false;
                    }
                  } else if (rekapDateMode === 'year') {
                    const itemDate = new Date(p.createdAt || 0);
                    const now = new Date();
                    if (itemDate.getFullYear() !== now.getFullYear()) {
                      return false;
                    }
                  } else if (rekapDateMode === 'custom' || rekapStartDate || rekapEndDate) {
                    if (rekapStartDate) {
                      const start = new Date(rekapStartDate);
                      start.setHours(0, 0, 0, 0);
                      const itemDate = new Date(p.createdAt || 0);
                      if (itemDate < start) return false;
                    }
                    if (rekapEndDate) {
                      const end = new Date(rekapEndDate);
                      end.setHours(23, 59, 59, 999);
                      const itemDate = new Date(p.createdAt || 0);
                      if (itemDate > end) return false;
                    }
                  }

                  if (rekapSearch.trim()) {
                    const q = rekapSearch.toLowerCase();
                    const matchName = p.jamaahName.toLowerCase().includes(q);
                    const matchPackage = p.packageName.toLowerCase().includes(q);
                    const matchId = String(p.id).toLowerCase().includes(q);
                    if (!matchName && !matchPackage && !matchId) return false;
                  }

                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Summary Cards Per Tahap */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setoran DP 1</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{dp1List.length} Transaksi</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">Rp {dp1Total.toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-gray-400 mt-1">DP Awal Pendaftaran Jamaah</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setoran DP 2</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">{dp2List.length} Transaksi</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">Rp {dp2Total.toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Setoran Tahap Lanjutan</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pelunasan Sisa</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{pelunasanList.length} Transaksi</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">Rp {pelunasanTotal.toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Pelunasan Bertahap</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pelunasan Full</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">{fullList.length} Transaksi</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">Rp {fullTotal.toLocaleString('id-ID')}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Pembayaran Langsung Lunas</p>
                      </div>
                    </div>

                    {/* Controls & Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
                        <button
                          onClick={() => setRekapStageFilter('all')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${rekapStageFilter === 'all' ? 'bg-matcha-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Semua ({allPaymentsList.length})
                        </button>
                        <button
                          onClick={() => setRekapStageFilter('dp1')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${rekapStageFilter === 'dp1' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          DP 1 ({dp1List.length})
                        </button>
                        <button
                          onClick={() => setRekapStageFilter('dp2')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${rekapStageFilter === 'dp2' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          DP 2 ({dp2List.length})
                        </button>
                        <button
                          onClick={() => setRekapStageFilter('pelunasan')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${rekapStageFilter === 'pelunasan' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Pelunasan Sisa ({pelunasanList.length})
                        </button>
                        <button
                          onClick={() => setRekapStageFilter('full')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${rekapStageFilter === 'full' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Pelunasan Full ({fullList.length})
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 sm:w-56">
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Cari jamaah / paket / ID..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-matcha-600 bg-white"
                            value={rekapSearch}
                            onChange={(e) => setRekapSearch(e.target.value)}
                          />
                        </div>

                        <select 
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-matcha-600 bg-white font-medium text-gray-700 cursor-pointer shadow-sm"
                          value={rekapStatusFilter}
                          onChange={(e) => setRekapStatusFilter(e.target.value as any)}
                        >
                          <option value="all">Semua Status</option>
                          <option value="approved">Disetujui</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Ditolak</option>
                        </select>

                        {/* Date Mode Select */}
                        <select
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-matcha-600 bg-white font-medium text-gray-700 cursor-pointer shadow-sm"
                          value={rekapDateMode}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setRekapDateMode(val);
                            if (val !== 'custom') {
                              setRekapStartDate('');
                              setRekapEndDate('');
                            }
                          }}
                        >
                          <option value="all">Semua Tanggal</option>
                          <option value="month">Bulan Ini</option>
                          <option value="year">Tahun Ini</option>
                          <option value="custom">📅 Kustom Tanggal (Tgl/Bln/Thn)</option>
                        </select>

                        {/* Custom Date Range Picker */}
                        {(rekapDateMode === 'custom' || rekapStartDate || rekapEndDate) && (
                          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-matcha-300 shadow-sm text-xs">
                            <CalendarIcon className="w-3.5 h-3.5 text-matcha-700 ml-1" />
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Dari:</span>
                              <input
                                type="date"
                                value={rekapStartDate}
                                onChange={(e) => {
                                  setRekapStartDate(e.target.value);
                                  setRekapDateMode('custom');
                                }}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-800 outline-none focus:border-matcha-600 font-medium"
                              />
                            </div>
                            <span className="text-gray-300 font-bold">-</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Sampai:</span>
                              <input
                                type="date"
                                value={rekapEndDate}
                                onChange={(e) => {
                                  setRekapEndDate(e.target.value);
                                  setRekapDateMode('custom');
                                }}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-800 outline-none focus:border-matcha-600 font-medium"
                              />
                            </div>
                            {(rekapStartDate || rekapEndDate) && (
                              <button
                                onClick={() => {
                                  setRekapStartDate('');
                                  setRekapEndDate('');
                                  setRekapDateMode('all');
                                }}
                                className="text-gray-400 hover:text-red-500 px-1 font-bold text-xs"
                                title="Reset Filter Tanggal"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rekapan Table */}
                    <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                            <th className="p-5 border-b border-gray-100">Jamaah</th>
                            <th className="p-5 border-b border-gray-100">Paket Perjalanan</th>
                            <th className="p-5 border-b border-gray-100">Tahap Pembayaran</th>
                            <th className="p-5 border-b border-gray-100">Nominal Setoran</th>
                            <th className="p-5 border-b border-gray-100">Tanggal Transfer</th>
                            <th className="p-5 border-b border-gray-100">Status Audit</th>
                            <th className="p-5 border-b border-gray-100 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                          {filteredPaymentsList.length > 0 ? (
                            filteredPaymentsList.map((t: any) => {
                              let stageLabel = 'DP 1';
                              let stageColor = 'bg-blue-50 text-blue-700 border-blue-100';
                              const pType = String(t.paymentType || '').toLowerCase().trim();

                              if (['dp2', 'cicilan', 'dp_2'].includes(pType)) {
                                stageLabel = 'DP 2';
                                stageColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                              } else if (['pelunasan', 'pelunasan_sisa', 'pelunasan sisa', 'sisa', 'pelunasan_dp3'].includes(pType)) {
                                stageLabel = 'Pelunasan Sisa';
                                stageColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                              } else if (['full', 'pelunasan_full', 'pelunasan full', 'lunas'].includes(pType)) {
                                stageLabel = 'Pelunasan Full';
                                stageColor = 'bg-green-50 text-green-700 border-green-100';
                              }

                              return (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-5">
                                    <p className="font-bold text-gray-900">{t.jamaahName}</p>
                                    <p className="text-xs text-gray-500">{t.jamaahPhone}</p>
                                  </td>
                                  <td className="p-5">
                                    <p className="font-bold text-gray-800">{t.packageName}</p>
                                    <p className="text-xs text-gray-400">Total Tagihan: Rp {Number(t.packagePrice).toLocaleString('id-ID')}</p>
                                  </td>
                                  <td className="p-5">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${stageColor}`}>
                                      {stageLabel}
                                    </span>
                                  </td>
                                  <td className="p-5">
                                    <p className="font-bold text-matcha-900">Rp {Number(t.amount || 0).toLocaleString('id-ID')}</p>
                                  </td>
                                  <td className="p-5">
                                    <p className="text-xs font-medium text-gray-600">
                                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </p>
                                  </td>
                                  <td className="p-5">
                                    {['approved', 'VERIFIED'].includes(t.status) ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 uppercase border border-green-100">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Disetujui
                                      </span>
                                    ) : ['rejected', 'REJECTED'].includes(t.status) ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 uppercase border border-red-100">
                                        Ditolak
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 uppercase border border-orange-100">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-5 text-right space-x-2">
                                    <button 
                                      onClick={() => {
                                        setReviewingPaymentJamaahId(t.jamaahId);
                                        setReviewingTransactionId(t.id);
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all"
                                    >
                                      Lihat Bukti
                                    </button>
                                    <button 
                                      onClick={() => generateProofPdf(t.consultationObj || { name: t.jamaahName, email: t.email, phone: t.phone, packageName: t.packageName }, t)}
                                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                      title="Unduh Bukti Transfer (PDF)"
                                    >
                                      <Download className="w-3 h-3 text-emerald-200" /> Bukti PDF
                                    </button>
                                    {['approved', 'VERIFIED'].includes(t.status) && (
                                      <button 
                                        onClick={() => handleGenerateInvoice(t.consultationObj, t.id)}
                                        className="px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center"
                                      >
                                        <Printer className="w-3 h-3 mr-1" /> Kuitansi
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                                Tidak ada data rekapan pembayaran yang sesuai dengan filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Subtab 3: Laporan Keuangan */}
              {activeFinanceSubTab === 'laporan' && (
                <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
                  <FinancialReport consultations={consultations} packages={packages} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'master_data' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#12291C] via-[#1c3e2b] to-[#12291C] text-white shadow-xl p-6 rounded-3xl border border-matcha-700/50 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 pointer-events-none rounded-r-3xl blur-xl"></div>
                <div className="relative z-10 flex items-center gap-3.5">
                  <div className="p-3 bg-matcha-800/80 backdrop-blur-md rounded-2xl border border-matcha-600/40 text-gold-400 shadow-md">
                    <Database className="w-6 h-6 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Master Data Travel</h2>
                    <p className="text-xs sm:text-sm text-matcha-200/90 mt-0.5 font-medium">Kelola data paket perjalanan dan jadwal itinerary secara terpusat.</p>
                  </div>
                </div>
                <div className="flex bg-black/35 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner relative z-10 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setActiveMasterDataTab('paket')}
                    className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                      activeMasterDataTab === 'paket' 
                        ? 'bg-gradient-to-r from-matcha-600 to-matcha-700 text-white shadow-lg border border-matcha-400/50 ring-2 ring-matcha-400/30' 
                        : 'text-matcha-200/80 hover:text-white hover:bg-white/10 font-bold'
                    }`}
                  >
                    <InventoryIcon className="w-4 h-4 text-gold-400" />
                    Kelola Paket
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveMasterDataTab('jadwal')}
                    className={`px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                      activeMasterDataTab === 'jadwal' 
                        ? 'bg-gradient-to-r from-matcha-600 to-matcha-700 text-white shadow-lg border border-matcha-400/50 ring-2 ring-matcha-400/30' 
                        : 'text-matcha-200/80 hover:text-white hover:bg-white/10 font-bold'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4 text-gold-400" />
                    Kelola Jadwal & Itinerary
                  </button>
                </div>
              </div>

              {activeMasterDataTab === 'paket' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      <button 
                        type="button"
                        onClick={() => setActivePackageTab('umroh')}
                        className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                          activePackageTab === 'umroh' 
                            ? 'bg-matcha-900 text-gold-400 shadow-lg border border-matcha-700' 
                            : 'bg-white shadow-sm text-matcha-900 hover:bg-matcha-50 border border-matcha-200/80'
                        }`}
                      >
                        Paket Umroh
                      </button>
                      <button 
                        type="button"
                        onClick={() => setActivePackageTab('haji')}
                        className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                          activePackageTab === 'haji' 
                            ? 'bg-matcha-900 text-gold-400 shadow-lg border border-matcha-700' 
                            : 'bg-white shadow-sm text-matcha-900 hover:bg-matcha-50 border border-matcha-200/80'
                        }`}
                      >
                        Paket Haji
                      </button>
                    </div>
                    <button 
                      onClick={() => handleOpenPackageModal()}
                      className="flex items-center px-6 py-3 bg-matcha-600 text-white rounded-2xl font-bold hover:bg-matcha-700 shadow-lg shadow-gray-900/20 transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Tambah Paket
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(() => {
                      const filteredPkgs = packages.filter(p => {
                        const t = (p?.type || 'umroh').toString().trim().toLowerCase();
                        if (activePackageTab === 'umroh') return t === 'umroh' || t === 'umrah';
                        if (activePackageTab === 'haji') return t === 'haji';
                        return true;
                      });

                      if (filteredPkgs.length === 0) {
                        return (
                          <div className="col-span-full bg-white/90 border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-3 shadow-sm">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                              <PackageIcon className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Belum ada {activePackageTab === 'umroh' ? 'Paket Umroh' : 'Paket Haji'}</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                              Tidak ada data paket yang tersimpan untuk kategori ini. Klik tombol <strong className="text-emerald-800">"Tambah Paket"</strong> di atas untuk membuat paket perjalanan baru.
                            </p>
                          </div>
                        );
                      }

                      return filteredPkgs.map((pkg) => (
                        <div key={pkg.id} className="bg-white shadow-md rounded-xl overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="relative h-[180px] overflow-hidden rounded-t-xl">
                            <img 
                              src={pkg.imageUrl || pkg.image || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80'} 
                              alt={pkg.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                              <div className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white/20 shadow-lg flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{pkg.duration}</span>
                                <span className="text-[9px] font-bold text-gray-600">SISA: {(pkg as any).remainingSeats ?? (pkg.quota || 45)} / {pkg.quota || 45}</span>
                              </div>
                              {pkg.isAvailable ? (
                                <span className="bg-green-500/90 backdrop-blur-md text-gray-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Tersedia</span>
                              ) : (
                                <span className="bg-red-500/90 backdrop-blur-md text-gray-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Full Booked</span>
                              )}
                            </div>
                          </div>
                          <div className="p-6 flex flex-col flex-grow">
                            <div className="mb-4">
                              <h3 className="font-bold text-gray-900 text-xl leading-tight mb-2">{pkg.name}</h3>
                              <div className="inline-flex items-center bg-gray-100 text-gray-900 px-3 py-1.5 rounded-xl">
                                <span className="text-sm font-black">Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                            
                            <div className={`text-gray-700 text-xs mb-4 leading-tight flex-grow font-bold grid grid-cols-2 gap-2`}>
                              {Array.isArray(pkg.description) ? (
                                pkg.description.map((line: string, i: number) => (
                                  <p key={i} className="flex items-start m-0 p-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1 mr-1.5 shrink-0" />
                                    <span className="break-words">{line}</span>
                                  </p>
                                ))
                              ) : (
                                <p className="flex items-start m-0 p-0 col-span-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1 mr-1.5 shrink-0" />
                                  <span className="break-words">{pkg.description}</span>
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                              <button 
                                onClick={() => handleOpenPackageModal(pkg)}
                                className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-gold-50 border border-gold-500 text-gold-600 py-3 rounded-xl transition-all font-bold text-sm"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="w-12 h-12 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-sm hover:shadow group shrink-0"
                              >
                                <Trash2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {activeMasterDataTab === 'jadwal' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">Jadwal Keberangkatan & Itinerary</h3>
                      <p className="text-xs text-gray-600">Daftar jadwal yang terhubung ke paket perjalanan.</p>
                    </div>
                    <button 
                      onClick={() => handleOpenScheduleModal()}
                      className="flex items-center px-6 py-3 bg-matcha-600 text-white rounded-2xl font-bold hover:bg-matcha-700 shadow-lg shadow-gray-900/20 transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Tambah Jadwal
                    </button>
                  </div>

                  <div className="bg-white shadow-md rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white shadow-md border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="p-5">Paket & Kloter</th>
                          <th className="p-5">Pembimbing / Muthawwif</th>
                          <th className="p-5">Tanggal Keberangkatan</th>
                          <th className="p-5">Sisa Kursi</th>
                          <th className="p-5">Itinerary (PDF)</th>
                          <th className="p-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(schedules || []).map((sch) => {
                          const pkg = packages.find(p => p.id === sch.packageId);
                          const mName = sch.muthawwifName || 'Ustadz Hanan Attaki';
                          const mRole = sch.muthawwifRole || 'Muthawwif Utama';
                          const mAvatar = sch.muthawwifAvatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                          return (
                            <tr key={sch.id} className="hover:bg-white/20 transition-colors">
                              <td className="p-5">
                                <p className="font-bold text-gray-900">{pkg?.name || 'Paket tidak ditemukan'}</p>
                                <div className="flex flex-col gap-1 mt-1">
                                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 w-fit">{pkg?.type?.toUpperCase()}</span>
                                  <p className="text-[10px] font-bold text-gold-600">{sch.name || 'Nama Kloter -'}</p>
                                  <p className="text-[10px] text-gray-400">✈️ {sch.airline || 'Maskapai -'}</p>
                                </div>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={mAvatar} 
                                    alt={mName} 
                                    className="w-9 h-9 rounded-full object-cover border border-amber-300 shrink-0" 
                                  />
                                  <div className="overflow-hidden">
                                    <p className="font-bold text-xs text-gray-900 truncate">{mName}</p>
                                    <p className="text-[10px] text-amber-700 font-medium truncate">{mRole}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-5 font-medium text-gray-700">
                                {sch.departureDate ? new Date(sch.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              </td>
                              <td className="p-5">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${sch.availableSeats < 10 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                  <span className="font-bold text-gray-900">{sch.availableSeats}</span>
                                  <span className="text-gray-400 text-xs ml-1">/ {sch.totalSeats}</span>
                                </div>
                              </td>
                              <td className="p-5">
                                {sch.itineraryPdfUrl ? (
                                  <button 
                                    onClick={() => setPreviewFile({ 
                                      url: sch.itineraryPdfUrl, 
                                      type: 'pdf', 
                                      title: `Itinerary - ${pkg?.name || 'Perjalanan'}` 
                                    })}
                                    className="inline-flex items-center text-blue-600 hover:underline font-medium text-xs"
                                  >
                                    <FileText className="w-4 h-4 mr-1" /> itinerary.pdf
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">Belum diunggah</span>
                                )}
                              </td>
                              <td className="p-5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button 
                                    onClick={() => handleOpenScheduleModal(sch)}
                                    className="p-2 bg-white shadow-md text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSchedule(sch.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {schedules.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-gray-400">
                              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                              <p className="font-bold">Belum ada jadwal yang dibuat</p>
                              <p className="text-xs">Klik tombol "Tambah Jadwal" untuk memulai</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verifikasi_dokumen' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-md p-6 rounded-3xl ">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Verifikasi Dokumen Persyaratan</h2>
                  <p className="text-sm text-gray-600 mt-1">Review dan verifikasi kelengkapan berkas jamaah untuk batch keberangkatan.</p>
                </div>
                <div className="flex items-center space-x-2 bg-white shadow-md px-4 py-2 rounded-xl border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-bold text-gray-700">Pusat Validasi Dokumen</span>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-3xl  overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                      <th className="p-5 border-b border-gray-100">Jamaah</th>
                      <th className="p-5 border-b border-gray-100">Berkas Terunggah</th>
                      <th className="p-5 border-b border-gray-100">Status Kelengkapan</th>
                      <th className="p-5 border-b border-gray-100 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...consultations].sort((a, b) => {
                      const aPending = (a.documents || []).some((d: any) => ['pending', 'PENDING'].includes(d.status)) ? 1 : 0;
                      const bPending = (b.documents || []).some((d: any) => ['pending', 'PENDING'].includes(d.status)) ? 1 : 0;
                      return bPending - aPending;
                    }).map((c) => {
                      const docs = Array.isArray(c.documents) ? c.documents : [];
                      
                      // Handle duplicates by taking the latest version of each docType
                      const latestDocsMap = new Map();
                      docs.forEach((doc: any) => {
                        const existing = latestDocsMap.get(doc.docType);
                        if (!existing || new Date(doc.updatedAt || doc.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
                          latestDocsMap.set(doc.docType, doc);
                        }
                      });
                      
                      const uniqueDocs = Array.from(latestDocsMap.values());
                      const docCount = uniqueDocs.length;
                      const pendingCount = uniqueDocs.filter((d: any) => ['pending', 'PENDING'].includes(d.status)).length;
                      
                      return (
                        <tr key={c.id} className="hover:bg-white/20 transition-colors group">
                          <td className="p-5">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center font-bold">
                                {(c.name || '?').charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{c.name || 'Tanpa Nama'}</p>
                                <p className="text-xs text-gray-600">{c.packageName || 'Belum Pilih Paket'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex -space-x-2">
                              {uniqueDocs.map((doc: any, idx: number) => (
                                <div key={idx} className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm" title={doc.docType || 'Dokumen'}>
                                  {(doc.docType || '?').charAt(0)}
                                </div>
                              ))}
                              {docCount === 0 && <span className="text-xs text-gray-400 italic">Belum ada dokumen</span>}
                            </div>
                          </td>
                          <td className="p-5">
                            {pendingCount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 uppercase">
                                <Clock className="w-3 h-3 mr-1" /> {pendingCount} Menunggu Review
                              </span>
                            ) : docCount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 uppercase">
                                <CheckCircle className="w-3 h-3 mr-1" /> Selesai Review
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kosong</span>
                            )}
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => {
                                setReviewingJamaah(c);
                                setActivePaxIdx(0);
                                setReviewingDocId('KTP Asli');
                                setIsReviewModalOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-matcha-600 text-white hover:bg-matcha-700 shadow-sm cursor-pointer"
                            >
                              Periksa Berkas
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {consultations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-gray-400 italic">Belum ada pendaftaran yang masuk.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verifikasi_mitra' && (
            <AdminMitraManager initialFilter="pending_verification" />
          )}

          {activeTab === 'daftar_mitra' && (
            <AdminMitraManager initialFilter="all" />
          )}

          {activeTab === 'mitra_pencairan_komisi' && (
            <AdminMitraPencairanKomisi />
          )}

          {activeTab === 'mitra_calon_jamaah' && (
            <AdminMitraJamaahManager activeSubTab="biodata" onRefresh={() => refreshData(true)} />
          )}

          {activeTab === 'mitra_sertifikat_kenangan' && (
            <AdminMitraSertifikatKenangan 
              onRefresh={() => refreshData(true)} 
              users={users}
              onNavigateTab={(tab: string) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'mitra_pembayaran' && (
            <AdminMitraJamaahManager activeSubTab="pembayaran" onRefresh={() => refreshData(true)} />
          )}

          {activeTab === 'mitra_persiapan_keberangkatan' && (
            <AdminMitraJamaahManager activeSubTab="persiapan" onRefresh={() => refreshData(true)} />
          )}

          {activeTab === 'mitra_dokumen_keberangkatan' && (
            <AdminMitraJamaahManager activeSubTab="dokumen_keberangkatan" onRefresh={() => refreshData(true)} />
          )}

          {activeTab === 'crm_jamaah' && (
            <CRMTable onRefresh={() => refreshData(true)} />
          )}

          {activeTab === 'rekap_keberangkatan' && (
            <RekapKeberangkatan />
          )}

          {activeTab === 'ops_keberangkatan' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-md p-6 rounded-3xl ">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Operasional Keberangkatan</h2>
                  <p className="text-sm text-gray-600 mt-1">Manajemen perlengkapan, komunikasi massa, dan manifes jamaah.</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => setActiveOpsTab('inventory')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeOpsTab === 'inventory' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    Perlengkapan
                  </button>
                  <button 
                    onClick={() => setActiveOpsTab('broadcast')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeOpsTab === 'broadcast' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    Broadcast
                  </button>
                  <button 
                    onClick={() => setActiveOpsTab('manifest')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeOpsTab === 'manifest' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    Manifes
                  </button>
                  <button 
                    onClick={() => setActiveOpsTab('dokumen_final')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeOpsTab === 'dokumen_final' ? 'bg-white shadow-md text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    Dokumen Final
                  </button>
                </div>
              </div>

              {activeOpsTab === 'inventory' && (
                <EquipmentManagement 
                  consultations={consultations} 
                  inventory={inventory} 
                  handleUpdateInventory={handleUpdateInventory} 
                  handleUpdateAssignee={handleUpdateAssignee} 
                />
              )}

              {activeOpsTab === 'broadcast' && (
                <BroadcastManager
                  users={users}
                  consultations={consultations}
                  announcements={announcements}
                  deleteAnnouncement={deleteAnnouncement}
                  refreshData={refreshData}
                />
              )}

              {activeOpsTab === 'manifest' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Cari jamaah lunas..."
                        value={manifestFilter}
                        onChange={e => setManifestFilter(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white shadow-md border border-gray-100 outline-none focus:border-gray-500 transition-all text-sm shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={generateManifestPDF}
                      className="flex items-center px-6 py-3 bg-gold-500 text-gray-900 rounded-2xl font-bold hover:bg-gold-600 transition-all shadow-lg shadow-gold-500/20"
                    >
                      <Scroll className="w-5 h-5 mr-2" /> Cetak Manifes (PDF)
                    </button>
                  </div>

                  <div className="bg-white shadow-md rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white shadow-md border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="p-5">Pemesan / Rombongan</th>
                          <th className="p-5">Paket</th>
                          <th className="p-5">Kontak</th>
                          <th className="p-5">Kursi Pesawat</th>
                          <th className="p-5">Alokasi Bus</th>
                          <th className="p-5">Kamar Hotel</th>
                          <th className="p-5">Aksi / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {consultations
                          .filter(c => c.status !== 'none' && c.status !== 'cancelled' && c.packageName !== 'Belum Memilih Paket' && (c.name || '').toLowerCase().includes(manifestFilter.toLowerCase()))
                          .map((c) => {
                            const existingM = manifest?.find(m => m.registrationId === c.id);
                            const paxList = c.paxData && Array.isArray(c.paxData) && c.paxData.length > 0
                              ? c.paxData
                              : [{ fullName: c.name || 'Jamaah Utama' }];
                            const paxCount = paxList.length;

                            return (
                              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-5">
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-gray-900 text-sm">{c.name || 'Tanpa Nama'}</p>
                                    {paxCount > 1 && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                                        <Users className="w-3 h-3 text-amber-700" /> {paxCount} Pax
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">Kode: #{c.id?.substring(0, 6)}</p>
                                </td>
                                <td className="p-5 text-sm text-gray-600 font-medium">{c.packageName}</td>
                                <td className="p-5 text-sm text-gray-600 font-mono">{c.phone}</td>
                                <td className="p-5">
                                  <div className="flex flex-col gap-1">
                                    <input 
                                      type="text"
                                      defaultValue={existingM?.airplaneSeat || ''}
                                      onBlur={(e) => updateManifest(c.id, { airplaneSeat: e.target.value })}
                                      placeholder="e.g. 12A, 12B"
                                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold border border-gray-200 rounded-xl focus:border-amber-500 outline-none shadow-2xs"
                                    />
                                    {paxCount > 1 && (
                                      <p className="text-[10px] text-blue-700 font-bold">
                                        {existingM?.paxManifest?.length ? 'Teralokasi Per-Pax' : `${paxCount} Rombongan`}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-5">
                                  <input 
                                    type="text"
                                    defaultValue={existingM?.busNumber || ''}
                                    onBlur={(e) => updateManifest(c.id, { busNumber: e.target.value })}
                                    placeholder="e.g. Bus 01"
                                    className="w-28 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl focus:border-amber-500 outline-none shadow-2xs"
                                  />
                                </td>
                                <td className="p-5">
                                  <input 
                                    type="text"
                                    defaultValue={existingM?.hotelRoom || ''}
                                    onBlur={(e) => updateManifest(c.id, { hotelRoom: e.target.value })}
                                    placeholder="e.g. 301"
                                    className="w-28 px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-xl focus:border-amber-500 outline-none shadow-2xs"
                                  />
                                </td>
                                <td className="p-5">
                                  <div className="flex flex-col items-start gap-1.5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 uppercase border border-green-200">
                                      LUNAS
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedManifestReg(c)}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Kelola All Pax ({paxCount})</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {consultations.filter(c => c.status !== 'none' && c.status !== 'cancelled' && c.packageName !== 'Belum Memilih Paket').length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-20 text-center text-gray-400">
                              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                              <p className="font-bold text-sm">Belum ada jamaah yang melunasi pembayaran</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeOpsTab === 'dokumen_final' && (
                <div className="space-y-6">
                  <div className="bg-white shadow-md rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-gray-900 to-matcha-950 text-white flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gold-400" /> Dokumen Final Keberangkatan Jamaah
                        </h3>
                        <p className="text-xs text-gray-300 mt-1">
                          Unggah PDF atau Foto E-Ticket, Visa, dan Asuransi. Dokumen yang diunggah akan langsung terhubung ke Portal Jamaah.
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <th className="p-5">Nama Jamaah & Paket</th>
                            <th className="p-5">E-Ticket</th>
                            <th className="p-5">Visa</th>
                            <th className="p-5">Asuransi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {consultations.filter(c => c.packageName && c.packageName !== 'Belum Memilih Paket').map(c => {
                            const jamaahDocs = (c as any).documents || [];
                            const paxData = (c as any).paxData || [];
                            const paxCount = (c as any).paxCount || paxData.length || 1;

                            const renderDocCell = (docType: 'eticket' | 'visa' | 'asuransi') => {
                              const label = docType === 'eticket' ? 'E-Ticket' : docType === 'visa' ? 'Visa' : 'Asuransi';
                              const groupDoc = jamaahDocs.find((d: any) => d.docType === docType);
                              const paxDocs = jamaahDocs.filter((d: any) => d.docType.startsWith(`${docType}_pax_`));
                              const hasGroup = groupDoc && groupDoc.fileUrl;
                              const paxWithDocsCount = paxDocs.filter((d: any) => d.fileUrl).length;

                              return (
                                <td className="p-5">
                                  {hasGroup ? (
                                    <div className="space-y-2">
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Group File (Semua Pax)
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openDataUrlInNewTab(groupDoc.fileUrl)}
                                          className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1 shadow-sm transition-colors"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-blue-600" /> Lihat
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFinalDocModal({
                                              isOpen: true,
                                              registrationId: c.id,
                                              jamaahName: c.name || 'Jamaah',
                                              packageName: c.packageName,
                                              docType,
                                              paxData,
                                              paxCount,
                                              documents: jamaahDocs,
                                              existingDocUrl: groupDoc.fileUrl
                                            });
                                          }}
                                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1 transition-colors"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" /> Kelola
                                        </button>
                                      </div>
                                    </div>
                                  ) : paxWithDocsCount > 0 ? (
                                    <div className="space-y-2">
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        <Users className="w-3.5 h-3.5 text-indigo-600" /> {paxWithDocsCount}/{paxCount} Pax Terunggah
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFinalDocModal({
                                              isOpen: true,
                                              registrationId: c.id,
                                              jamaahName: c.name || 'Jamaah',
                                              packageName: c.packageName,
                                              docType,
                                              paxData,
                                              paxCount,
                                              documents: jamaahDocs,
                                              existingDocUrl: ''
                                            });
                                          }}
                                          className="px-2.5 py-1 bg-matcha-900 hover:bg-matcha-950 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" /> Kelola Per Pax
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                                        Belum Diterbitkan
                                      </span>
                                      <div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFinalDocModal({
                                              isOpen: true,
                                              registrationId: c.id,
                                              jamaahName: c.name || 'Jamaah',
                                              packageName: c.packageName,
                                              docType,
                                              paxData,
                                              paxCount,
                                              documents: jamaahDocs,
                                              existingDocUrl: ''
                                            });
                                          }}
                                          className="px-3 py-1.5 bg-matcha-900 hover:bg-matcha-950 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Upload {label} ({paxCount} Pax)
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            };

                            return (
                              <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="p-5">
                                  <p className="font-bold text-gray-900 text-sm">{c.name || 'Tanpa Nama'}</p>
                                  <p className="text-xs text-matcha-700 font-medium">{c.packageName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                                      {paxCount} Pax
                                    </span>
                                    {c.phone && <span className="text-[11px] text-gray-500">{c.phone}</span>}
                                  </div>
                                </td>
                                {renderDocCell('eticket')}
                                {renderDocCell('visa')}
                                {renderDocCell('asuransi')}
                              </tr>
                            );
                          })}
                          {consultations.filter(c => c.packageName && c.packageName !== 'Belum Memilih Paket').length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-16 text-center text-gray-400">
                                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p className="font-bold text-sm text-gray-600">Belum Ada Data Keberangkatan Jamaah</p>
                                <p className="text-xs text-gray-400 mt-1">Jamaah yang mendaftar paket akan otomatis muncul di sini untuk penerbitan dokumen final.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'cms_packages' || activeTab === 'cms_gallery' || activeTab === 'cms_videos') && (
            <CMSManager />
          )}

          {activeTab === 'buku_manasik' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                  <BookOpen className="w-64 h-64 text-gold-400" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Modul Operasional & Edukasi
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Buku Panduan Manasik Digital</h2>
                    <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
                      Kelola dan unggah materi buku panduan manasik (PDF) untuk setiap paket keberangkatan Umroh & Haji. 
                      Dokumen ini secara otomatis terhubung dan dapat diunduh langsung oleh jamaah melalui portal pribadi mereka.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setActiveTab('master_data')}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Database className="w-4 h-4 text-gold-400" />
                      Kelola Master Paket
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <InventoryIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Paket Available</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">{packages.length}</h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Manasik PDF Terunggah</p>
                    <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
                      {packages.filter(p => !!p.manasikPdfUrl).length}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Belum Ada PDF Manasik</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-0.5">
                      {packages.filter(p => !p.manasikPdfUrl).length}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Jamaah Terkoneksi</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-0.5">
                      {registrations.filter(r => r.packageName && r.packageName !== 'Belum Memilih Paket').length}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama paket atau harga..." 
                    value={manasikSearchQuery}
                    onChange={(e) => setManasikSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                  {(['all', 'umroh', 'haji'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setManasikCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        manasikCategoryFilter === cat 
                          ? 'bg-gray-900 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? 'Semua Kategori' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Packages List with Manasik PDF Upload Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages
                  .filter(p => {
                    const matchSearch = p.name.toLowerCase().includes(manasikSearchQuery.toLowerCase());
                    const matchCat = manasikCategoryFilter === 'all' || (p.type && p.type.toLowerCase() === manasikCategoryFilter);
                    return matchSearch && matchCat;
                  })
                  .map((pkg) => {
                    const connectedJamaah = registrations.filter(r => r.packageName === pkg.name).length;
                    const isUploadingThis = uploadingPkgId === pkg.id;

                    return (
                      <div key={pkg.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between">
                        <div>
                          {/* Header Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              pkg.type === 'haji' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              Paket {pkg.type || 'Umroh'}
                            </span>
                            <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> {connectedJamaah} Jamaah
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{pkg.name}</h3>
                          <p className="text-xs text-gray-500 mb-4 font-semibold">
                            Rp {Number(pkg.price || 0).toLocaleString('id-ID')} &bull; {pkg.duration || '9'} Hari
                          </p>

                          {/* Status Manasik Card */}
                          <div className={`p-4 rounded-2xl border mb-5 ${
                            pkg.manasikPdfUrl 
                              ? 'bg-emerald-50/70 border-emerald-200' 
                              : 'bg-amber-50/70 border-amber-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                  pkg.manasikPdfUrl ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-gray-900">
                                    {pkg.manasikPdfUrl ? 'Buku Manasik Ready (PDF)' : 'Belum Ada Buku Manasik'}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-medium">
                                    {pkg.manasikPdfUrl ? 'Tersedia di portal jamaah' : 'Unggah PDF agar jamaah dapat membaca'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar if uploading */}
                            {isUploadingThis && uploadingProgress !== null && (
                              <div className="mt-3 space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold text-emerald-800">
                                  <span>Memproses: {uploadingFileName}</span>
                                  <span>{uploadingProgress}%</span>
                                </div>
                                <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                                  <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${uploadingProgress}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {pkg.manasikPdfUrl ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => openDataUrlInNewTab(pkg.manasikPdfUrl)}
                                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Pratinjau
                              </button>
                              
                              <label className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                <UploadCloud className="w-3.5 h-3.5 text-gray-600" /> Ganti PDF
                                <input 
                                  type="file" 
                                  accept=".pdf,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleDirectManasikUpload(pkg, e)}
                                />
                              </label>
                            </div>
                          ) : (
                            <label className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md">
                              <UploadCloud className="w-4 h-4" /> Unggah Buku Manasik (PDF)
                              <input 
                                type="file" 
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => handleDirectManasikUpload(pkg, e)}
                              />
                            </label>
                          )}

                          {pkg.manasikPdfUrl && (
                            <button
                              onClick={() => handleRemoveManasikPdf(pkg)}
                              className="w-full py-1.5 text-center text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            >
                              Hapus Buku Manasik
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Executive Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                {stats.map((s, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveTab(s.tab)}
                    className="bg-white shadow-md p-6 rounded-2xl relative overflow-hidden group hover:border-gold-300 hover:shadow-lg transition-all border border-transparent text-left w-full focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${s.bg}`}>
                        {s.icon}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        s.trend.includes('Delay') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {s.trend}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">{s.title}</p>
                      <h3 className={`font-black text-gray-900 mt-1.5 whitespace-nowrap tracking-tight ${
                        String(s.value).length > 15 
                          ? 'text-base sm:text-lg' 
                          : String(s.value).length > 10 
                          ? 'text-lg sm:text-xl' 
                          : 'text-2xl sm:text-3xl'
                      }`}>
                        {s.value}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* S-Curve & Batch Tracking */}
                <div className="lg:col-span-2 bg-white shadow-md rounded-3xl  p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">S-Curve: {dashboardStats?.nextBatchName ? `Batch ${dashboardStats.nextBatchName}` : 'Batch Keberangkatan'}</h3>
                      <p className="text-sm text-gray-600 mt-1">Monitoring kesiapan dokumen & pembayaran rombongan.</p>
                    </div>
                    <div className="flex items-center space-x-4 bg-white shadow-md p-2 rounded-xl">
                       <div className="flex items-center text-xs font-bold text-gray-600">
                         <div className="w-3 h-3 bg-matcha-600 rounded-full mr-2"></div> Target
                       </div>
                       <div className="flex items-center text-xs font-bold text-gray-600">
                         <div className="w-3 h-3 bg-gold-500 rounded-full mr-2"></div> Aktual
                       </div>
                    </div>
                  </div>
                  
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardStats?.sCurveData || sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4c7c59" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4c7c59" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 'bold' }} 
                          dy={15} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6b7280' }} 
                          tickFormatter={(val) => `${val}%`} 
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#4c7c59" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorTarget)" 
                          name="Target Persiapan (%)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#eab308" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorActual)" 
                          connectNulls={false}
                          name="Progres Aktual (%)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-8 p-4 bg-matcha-50/50 rounded-2xl border border-matcha-100 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white text-matcha-700 rounded-xl flex items-center justify-center mr-4 shadow-sm border border-matcha-100">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-matcha-800 uppercase tracking-widest">Analisis Sistem</p>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">{dashboardStats?.analysis || "Sistem sedang mengumpulkan data untuk batch terdekat."}</p>
                      </div>
                    </div>
                    <button className="text-xs font-bold bg-matcha-600 text-white px-5 py-2.5 rounded-xl hover:bg-matcha-700 shadow-md shadow-matcha-600/20 transition-all active:scale-95 whitespace-nowrap">
                      Lihat Rincian Batch
                    </button>
                  </div>
                </div>

                {/* Actionable Notifications */}
                <div className="bg-white shadow-md rounded-3xl  p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900">Action Center</h3>
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-6">
                    {adminNotifications.map((notif) => (
                      <div key={notif.id} className="group relative pl-6 border-l-2 border-transparent hover:border-gray-500 transition-all">
                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 text-sm group-hover:text-gray-700 transition-colors">{notif.title}</h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{notif.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                          <div className="mt-3 flex space-x-2">
                             <button 
                               onClick={() => {
                                 if (notif.target === 'jamaah') setActiveTab('jamaah');
                               }}
                               className="text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900"
                             >
                               Periksa Sekarang
                             </button>
                             <button className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600">Abaikan</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button className="w-full py-4 mt-4 border-2 border-dashed border-gray-100 rounded-2xl text-sm font-bold text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all flex items-center justify-center">
                       Lihat Semua Riwayat Aktivitas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          





          
          
          
          
          
          
          
          
          
          
          {/* Media Center Removed */}

          
          {/* Kelola Blog Removed */}

          
          {/* Kelola Promo Removed */}

          {/* Kelola Testimoni Removed */}

          
          {/* PENGATURAN TAB */}
          {activeTab === 'pengaturan' && adminProfileForm && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white shadow-md p-6 rounded-3xl ">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pengaturan Sistem & Admin</h2>
                  <p className="text-sm text-gray-600 mt-1">Konfigurasi profil admin dan parameter global aplikasi.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white shadow-md rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4">Profil Administrator</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Nama Admin</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-md outline-none focus:border-gray-500 transition-all font-medium"
                          value={adminProfileForm?.name || ''}
                          onChange={e => setAdminProfileForm({...adminProfileForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">WhatsApp Admin</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-md outline-none focus:border-gray-500 transition-all font-medium"
                          value={adminProfileForm?.phone || ''}
                          onChange={e => setAdminProfileForm({...adminProfileForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Email Login</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-md outline-none focus:border-gray-500 transition-all font-medium"
                          value={adminProfileForm?.email || ''}
                          onChange={e => setAdminProfileForm({...adminProfileForm, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow-md rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-900 mb-8 border-b border-gray-50 pb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-gray-600" /> Keamanan Panel Admin
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Sandi Baru</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-md outline-none focus:border-gray-500 transition-all font-medium"
                          value={adminProfileForm?.password || ''}
                          onChange={e => setAdminProfileForm({...adminProfileForm, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Konfirmasi Sandi</label>
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-md outline-none focus:border-gray-500 transition-all font-medium"
                          value={adminProfileForm?.confirmPassword || ''}
                          onChange={e => setAdminProfileForm({...adminProfileForm, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleUpdateAdminProfile}
                      disabled={isUpdatingProfile}
                      className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                    >
                      {isUpdatingProfile && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                      <span>{isUpdatingProfile ? 'Memproses...' : 'Update Sistem'}</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white shadow-md rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Logo Travel</h3>
                    <div className="p-6 bg-white shadow-md rounded-2xl border-2 border-dashed border-gray-200 text-center">
                      <img src={logoImg} alt="Logo" className="w-24 h-24 mx-auto rounded-full mb-4 border-4 border-white shadow-md object-contain bg-white" />
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        onChange={handleLogoChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-md cursor-pointer"
                      >
                        Ganti Logo
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-8 text-gray-900">
                    <h3 className="font-bold mb-4 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-gold-400" /> System Status
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase font-bold">API Status</span>
                        <span className="text-[8px] font-bold bg-green-500 text-gray-900 px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 uppercase font-bold">Storage</span>
                        <span className="text-[10px] font-bold">1.2 GB / 5 GB</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-gold-500 w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SERTIFIKAT & KENANGAN TAB */}
          {activeTab === 'sertifikat' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white shadow-md p-6 rounded-3xl border border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manajemen Kenangan & Sertifikat</h2>
                  <p className="text-sm text-gray-600 mt-1">Unggah sertifikat digital (PDF/Gambar) dan kelola galeri kenangan perjalanan jamaah.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCertModalOpen(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <UploadCloud className="w-5 h-5" />
                    <span>Unggah Sertifikat</span>
                  </button>
                  <button 
                    onClick={() => setIsMemoryModalOpen(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200 shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Momen</span>
                  </button>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-gold-500" /> Galeri Kenangan Jamaah
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(memories || []).map(memory => (
                    <div key={memory.id} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square shadow-sm">
                      <img 
                        src={memory.imageUrl} 
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                        <div className="flex justify-end">
                          <button 
                            onClick={() => deleteMemory(memory.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-white rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm truncate">{memory.title || 'Momen Perjalanan'}</h4>
                          <p className="text-white/70 text-[10px] mt-1 truncate">{memory.caption || 'Tanpa deskripsi'}</p>
                          <p className="text-gold-400 text-[8px] font-bold mt-2 uppercase">{new Date(memory.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {memories.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-bold uppercase tracking-widest">Belum ada momen perjalanan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Management Section */}
              <div className="bg-white shadow-md rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold-500" /> Sertifikat Jamaah Terunggah
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Daftar sertifikat digital yang siap diakses dan diunduh oleh para jamaah.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Cari nama jamaah..."
                        value={certSearchQuery}
                        onChange={e => setCertSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-gold-500 bg-gray-50/50"
                      />
                      {certSearchQuery && (
                        <button onClick={() => setCertSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={() => setIsCertModalOpen(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Unggah Sertifikat
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th className="pb-4 pl-4">Jamaah</th>
                        <th className="pb-4">Paket Perjalanan</th>
                        <th className="pb-4">Format Berkas</th>
                        <th className="pb-4">Tanggal Unggah</th>
                        <th className="pb-4 text-right pr-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(certificates || [])
                        .filter(cert => {
                          if (!certSearchQuery) return true;
                          const reg = consultations.find(c => c.id === cert.registrationId) || registrations.find(r => r.id === cert.registrationId);
                          const name = reg?.name || reg?.ordererName || '';
                          const recipient = cert.recipientName || '';
                          const pkg = reg?.packageName || '';
                          const q = certSearchQuery.toLowerCase();
                          return name.toLowerCase().includes(q) || recipient.toLowerCase().includes(q) || pkg.toLowerCase().includes(q);
                        })
                        .map(cert => {
                          const reg = consultations.find(c => c.id === cert.registrationId) || registrations.find(r => r.id === cert.registrationId);
                          const accountName = reg?.name || reg?.ordererName || 'Jamaah';
                          const recipientName = cert.recipientName || accountName;
                          const packageName = reg?.packageName || 'Paket Umroh';
                          const isPdf = cert.certificateUrl?.includes('pdf') || cert.certificateUrl?.startsWith('data:application/pdf');

                          return (
                            <tr key={cert.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-4 pl-4">
                                <div className="font-bold text-gray-900 text-sm">{recipientName}</div>
                                {cert.recipientName && cert.recipientName !== accountName && (
                                  <div className="text-[11px] text-gray-500 font-medium">
                                    Akun Pendaftar: <span className="font-semibold text-gray-700">{accountName}</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">Reg ID: {cert.registrationId.slice(0, 10)}...</div>
                              </td>
                              <td className="py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gold-50 text-gold-700 font-bold text-xs border border-gold-200/50">
                                  {packageName}
                                </span>
                              </td>
                              <td className="py-4">
                                {isPdf ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                                    <FileText className="w-3.5 h-3.5" /> PDF
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100">
                                    <ImageIcon className="w-3.5 h-3.5" /> Gambar
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-xs font-medium text-gray-600">
                                {new Date(cert.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </td>
                              <td className="py-4 text-right pr-4">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => openDataUrlInNewTab(cert.certificateUrl)}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1 text-xs font-bold px-3"
                                    title="Lihat / Pratinjau Sertifikat"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>Lihat</span>
                                  </button>
                                  <button 
                                    onClick={() => downloadFile(cert.certificateUrl, `Sertifikat-${recipientName.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}`)}
                                    className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1 text-xs font-bold px-3"
                                    title="Unduh Sertifikat"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh</span>
                                  </button>
                                  <button 
                                    onClick={() => deleteCertificate(cert.id)}
                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                                    title="Hapus Sertifikat"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Belum ada sertifikat yang diunggah
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HELPDESK TAB */}
          {activeTab === 'helpdesk' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white shadow-xl p-8 rounded-[2.5rem] border border-gray-100/50 shadow-slate-200/50">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-300">
                    <LifeBuoy className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Helpdesk <span className="text-gold-600">&</span> Support Center</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Manajemen Keluhan & Bantuan Terpadu</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tiket Aktif</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{helpTickets.filter(t => t.status === 'open').length}</p>
                  </div>
                  <div className="text-center px-6 py-3 bg-white shadow-xl rounded-2xl border border-gray-100 shadow-slate-200/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Selesai</p>
                    <p className="text-2xl font-black text-gray-700 mt-1">{helpTickets.filter(t => t.status === 'closed').length}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
                {/* Ticket List Sidebar */}
                <div className="lg:col-span-4 bg-white shadow-xl rounded-[2.5rem] border border-gray-100/50 shadow-slate-200/50 overflow-hidden flex flex-col h-full">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md">
                    <div>
                      <h3 className="font-black text-xs text-gray-900 uppercase tracking-[0.2em]">Daftar Tiket</h3>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Pilih tiket untuk merespons</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors border border-gray-100">
                      <Filter className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-100">
                    {(helpTickets || []).map(ticket => (
                      <button 
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                          selectedTicket?.id === ticket.id 
                            ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-300 ring-4 ring-slate-100' 
                            : 'bg-white border-gray-100 hover:border-gold-300 hover:shadow-lg hover:shadow-gold-100/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                            ticket.status === 'open' 
                              ? (selectedTicket?.id === ticket.id ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100') 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {ticket.status === 'open' ? 'Aktif' : 'Selesai'}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${selectedTicket?.id === ticket.id ? 'text-slate-400' : 'text-gray-300'}`}>
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                        <h4 className={`text-sm font-black truncate tracking-tight ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center mt-2">
                          <div className={`w-1 h-1 rounded-full mr-2 ${selectedTicket?.id === ticket.id ? 'bg-gold-400' : 'bg-gray-300'}`}></div>
                          <p className={`text-[10px] font-bold uppercase tracking-tight ${selectedTicket?.id === ticket.id ? 'text-slate-400' : 'text-gray-400'}`}>
                            {ticket.userName || 'Jamaah'}
                          </p>
                        </div>
                        {selectedTicket?.id !== ticket.id && (
                          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-4 h-4 text-gold-500" />
                          </div>
                        )}
                      </button>
                    ))}
                    {(helpTickets || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Inbox className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tidak ada tiket</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Detail Content */}
                <div className="lg:col-span-8 bg-white shadow-xl rounded-[2.5rem] border border-gray-100/50 shadow-slate-200/50 overflow-hidden flex flex-col h-full relative">
                  {selectedTicket ? (
                    <>
                      <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 bg-gold-50 rounded-2xl flex items-center justify-center shadow-sm border border-gold-100">
                            <span className="text-xl font-black text-gold-600">{(selectedTicket?.userName || '?').charAt(0)}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-black text-gray-900 tracking-tight">{selectedTicket.userName || 'Jamaah'}</h4>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-[8px] font-black text-gray-400 uppercase tracking-widest">USER</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">ID TIKET: <span className="text-gold-600">#{selectedTicket.id.slice(0, 8)}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedTicket.status === 'open' && (
                            <button 
                              onClick={() => handleCloseTicket(selectedTicket)}
                              className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.1em] bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all shadow-sm flex items-center"
                            >
                              <ShieldAlert className="w-4 h-4 mr-2" /> Tandai Selesai
                            </button>
                          )}
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 cursor-pointer hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 scrollbar-thin scrollbar-thumb-gray-200">
                        {/* Initial Message Block */}
                        <div className="flex justify-start">
                          <div className="max-w-[85%] bg-white p-6 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm relative group">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-gold-50 text-gold-600 rounded text-[8px] font-black uppercase tracking-widest">MASALAH UTAMA</span>
                                <span className="text-gray-900 font-black text-xs uppercase tracking-tighter">{selectedTicket.subject}</span>
                              </div>
                              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(selectedTicket.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed text-sm font-medium">{selectedTicket.message}</p>
                          </div>
                        </div>

                        {/* Visual Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-100"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 bg-transparent text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Log Percakapan</span>
                          </div>
                        </div>

                        {/* Dynamic Replies */}
                        {(selectedTicket?.replies || []).map((reply: any) => (
                          <div key={reply.id} className={`flex ${reply.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm ${
                              reply.sender === 'admin' 
                                ? 'bg-slate-900 text-white rounded-tr-none' 
                                : 'bg-white text-gray-900 rounded-tl-none border border-gold-100'
                            }`}>
                              <div className="flex items-center justify-between mb-2 space-x-12">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${reply.sender === 'admin' ? 'text-slate-400' : 'text-gold-600'}`}>
                                  {reply.sender === 'admin' ? 'ADMIN (ANDA)' : (selectedTicket.userName || 'JAMAAH')}
                                </p>
                                <p className={`text-[8px] font-bold ${reply.sender === 'admin' ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {new Date(reply.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className="text-sm leading-relaxed font-medium">{reply.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Input Section */}
                      {selectedTicket.status === 'open' ? (
                        <div className="p-8 border-t border-gray-100 bg-white sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-gold-300 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-gold-100/20 transition-all duration-300">
                            <input 
                              type="text" 
                              placeholder="Ketik balasan untuk membantu jamaah..." 
                              className="flex-1 bg-transparent px-5 py-4 outline-none text-sm text-gray-700 font-medium placeholder:text-gray-300"
                              value={adminReply}
                              onChange={e => setAdminReply(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleReplyTicketAdmin()}
                            />
                            <button 
                              onClick={handleReplyTicketAdmin}
                              disabled={!adminReply}
                              className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-20 disabled:pointer-events-none group"
                            >
                              <span>Balas</span>
                              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-4 text-center uppercase tracking-widest font-black opacity-60 italic">
                            Tekan 'Enter' untuk mengirim balasan instan
                          </p>
                        </div>
                      ) : (
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">TIKET TELAH DISELESAIKAN</p>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                          <p className="text-[9px] text-gray-300 font-bold max-w-xs uppercase tracking-tight">Tidak dapat mengirim balasan pada tiket yang sudah ditutup. Silakan minta jamaah membuka tiket baru jika masih ada kendala.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100 shadow-sm animate-bounce duration-[3s]">
                          <LifeBuoy className="w-10 h-10 text-gray-200" />
                        </div>
                        <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-gold-50 rounded-2xl flex items-center justify-center border border-gold-100 shadow-lg">
                          <MousePointer2 className="w-5 h-5 text-gold-400 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Pilih Percakapan</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-sm leading-relaxed">
                          Silakan pilih salah satu tiket dari daftar di samping untuk melihat detail keluhan dan memberikan bantuan kepada jamaah.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Modal Detail Jamaah */}
      {isJamaahDetailsModalOpen && selectedJamaah && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow-md rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white shadow-md z-10">
              <h3 className="font-bold text-xl text-gray-900">Detail Jamaah: {selectedJamaah.name}</h3>
              <button onClick={() => setIsJamaahDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-gray-100 px-6 sticky top-[73px] bg-white shadow-md z-10">
              <button 
                onClick={() => setActiveJamaahSubTab('biodata')}
                className={`px-4 py-4 text-sm font-bold border-b-2 transition-all ${activeJamaahSubTab === 'biodata' ? 'border-gray-600 text-gray-700' : 'border-transparent text-gray-600 hover:text-gray-700'}`}
              >
                Biodata & Pemesan
              </button>
              <button 
                onClick={() => setActiveJamaahSubTab('dokumen')}
                className={`px-4 py-4 text-sm font-bold border-b-2 transition-all ${activeJamaahSubTab === 'dokumen' ? 'border-gray-600 text-gray-700' : 'border-transparent text-gray-600 hover:text-gray-700'}`}
              >
                Verifikasi Dokumen
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white shadow-md p-4 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600">Paket</p>
                  <p className="font-bold text-gray-900">{selectedJamaah.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {selectedJamaah.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jumlah Pax</p>
                  <p className="font-bold text-gray-900">{selectedJamaah.paxCount || 1} Orang</p>
                </div>
                <button 
                  onClick={() => {
                    generateRegistrationFormPdf(selectedJamaah);
                    toast.success('Formulir pendaftaran berhasil diunduh sebagai PDF!');
                  }}
                  className="flex items-center px-4 py-2 bg-matcha-600 text-white rounded-xl text-sm font-bold hover:bg-matcha-700 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Unduh PDF
                </button>
              </div>

              {activeJamaahSubTab === 'biodata' && (
                <div className="animate-in fade-in duration-300 space-y-8">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-2 text-gold-500" /> Data Pemesan
                      </div>
                      {!isEditingJamaahInfo ? (
                        <button 
                          onClick={() => setIsEditingJamaahInfo(true)}
                          className="text-xs font-bold text-gold-600 hover:text-gold-700 underline"
                        >
                          Ubah Data
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button 
                            onClick={async () => {
                              await updateConsultation({ ...selectedJamaah, ...jamaahEditForm });
                              setIsEditingJamaahInfo(false);
                              // Manually update selectedJamaah to reflect changes in modal immediately
                              setSelectedJamaah({ ...selectedJamaah, ...jamaahEditForm });
                            }}
                            className="text-xs font-bold text-green-600 hover:text-green-700"
                          >
                            Simpan
                          </button>
                          <button 
                            onClick={() => setIsEditingJamaahInfo(false)}
                            className="text-xs font-bold text-red-600 hover:text-red-700"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white shadow-md p-6 rounded-xl border border-gray-100">
                  {isEditingJamaahInfo ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Nama Lengkap</p>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gold-500"
                          value={jamaahEditForm.name}
                          onChange={e => setJamaahEditForm({...jamaahEditForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Telepon / WA</p>
                        <input 
                          type="text"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gold-500"
                          value={jamaahEditForm.phone}
                          onChange={e => setJamaahEditForm({...jamaahEditForm, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">Email</p>
                        <input 
                          type="email"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gold-500"
                          value={jamaahEditForm.email}
                          onChange={e => setJamaahEditForm({...jamaahEditForm, email: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3 space-y-1">
                        <p className="text-xs text-gray-600">Catatan Tambahan</p>
                        <textarea 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gold-500 min-h-[80px]"
                          value={jamaahEditForm.notes}
                          onChange={e => setJamaahEditForm({...jamaahEditForm, notes: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3 space-y-1 mt-2">
                        <p className="text-xs font-bold text-gray-700">Pilih Jadwal Keberangkatan (Official Itinerary)</p>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gold-500 bg-white"
                          value={jamaahEditForm.scheduleId}
                          onChange={e => setJamaahEditForm({...jamaahEditForm, scheduleId: e.target.value})}
                        >
                          <option value="">-- Pilih Jadwal --</option>
                          {schedules
                            .filter(s => s.packageId === selectedJamaah.packageId)
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {new Date(s.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - Sisa {s.availableSeats} Kursi
                              </option>
                            ))
                          }
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                          * Memilih jadwal akan mengaktifkan rincian Itinerary Perjalanan Resmi di Dashboard Jamaah.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Nama Lengkap</p>
                        <p className="font-medium">{selectedJamaah.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Telepon / WA</p>
                        <p className="font-medium">{selectedJamaah.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="font-medium">{selectedJamaah.email || '-'}</p>
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <p className="text-xs text-gray-600 mb-1">Catatan Tambahan</p>
                        <p className="font-medium text-sm whitespace-pre-wrap">{selectedJamaah.notes || selectedJamaah.message || '-'}</p>
                      </div>
                      <div className="col-span-1 md:col-span-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-600 mb-1">Jadwal Keberangkatan Resmi</p>
                        {selectedJamaah.scheduleId ? (() => {
                          const sch = schedules.find(s => s.id === selectedJamaah.scheduleId);
                          return (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                              <CalendarIcon className="w-4 h-4" />
                              {sch ? new Date(sch.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Jadwal tidak ditemukan'}
                              {sch?.itineraryPdfUrl && <span className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">PDF Itinerary Aktif</span>}
                            </div>
                          );
                        })() : (
                          <div className="flex items-center gap-2 text-orange-500 font-bold text-sm bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
                            <AlertCircle className="w-4 h-4" />
                            Jadwal Belum Dipilih (Itinerary Tidak Akan Muncul)
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gold-500" /> Biodata & Paspor (Pax)
                  </div>
                  { (selectedJamaah.paxCount || 1) > 1 && (
                    <div className="flex bg-gray-100 p-1 rounded-xl space-x-1">
                      {Array.from({ length: selectedJamaah.paxCount || 1 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivePaxIdx(i)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            activePaxIdx === i 
                              ? 'bg-white text-gold-600 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Pax {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </h4>
                <div className="space-y-4">
                  <div className="bg-white shadow-md p-4 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h5 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2 flex justify-between items-center">
                      <span>Jamaah {activePaxIdx + 1}</span>
                      <button 
                        onClick={() => generateJamaahBiodataPdf(selectedJamaah, activePaxIdx)}
                        className="px-3 py-1 bg-gold-500 text-white rounded-md text-xs hover:bg-gold-600 transition-colors flex items-center shadow-sm"
                      >
                        <Download className="w-3 h-3 mr-1" /> Cetak PDF
                      </button>
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Nama Lengkap Sesuai KTP</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.fullName || (activePaxIdx === 0 ? selectedJamaah.name : 'Belum diisi')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">NIK</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.nik || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tempat/Tgl Lahir</p>
                        <p className="font-medium text-sm">
                          {selectedJamaah.paxData?.[activePaxIdx]?.pob || '-'}/{selectedJamaah.paxData?.[activePaxIdx]?.dob || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Jenis Kelamin</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.gender || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status Pernikahan</p>
                        <p className="font-medium text-sm">
                          {selectedJamaah.paxData?.[activePaxIdx]?.maritalStatus || selectedJamaah.paxData?.[activePaxIdx]?.statusPernikahan || '-'}
                          {(selectedJamaah.paxData?.[activePaxIdx]?.spouseName || selectedJamaah.paxData?.[activePaxIdx]?.namaPasangan) && ` (Pasangan: ${selectedJamaah.paxData?.[activePaxIdx]?.spouseName || selectedJamaah.paxData?.[activePaxIdx]?.namaPasangan})`}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Alamat Lengkap</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.address || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Telepon</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.phone || (activePaxIdx === 0 ? selectedJamaah.phone : 'Belum diisi')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.email || (activePaxIdx === 0 ? selectedJamaah.email : 'Belum diisi')}</p>
                      </div>
                      
                      <div className="col-span-4 mt-2 mb-1 border-t border-gray-200 pt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-bold text-gray-800 mb-2">Kontak Darurat</p>
                          <div className="bg-white shadow-md p-3 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-900">{selectedJamaah.paxData?.[activePaxIdx]?.emergencyName || '-'}</p>
                            <p className="text-[10px] text-gray-600">{selectedJamaah.paxData?.[activePaxIdx]?.emergencyRelation || '-'} • {selectedJamaah.paxData?.[activePaxIdx]?.emergencyPhone || '-'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 mb-2">Rekam Medis</p>
                          <div className="bg-white shadow-md p-3 rounded-lg border border-gray-100">
                            <p className="text-xs font-bold text-gray-900">{selectedJamaah.paxData?.[activePaxIdx]?.medicalHistory || 'Sehat Wal\'afiat'}</p>
                            {selectedJamaah.paxData?.[activePaxIdx]?.medicalHistoryDetails && (
                              <p className="text-[10px] text-gray-600 italic mt-1">"{selectedJamaah.paxData?.[activePaxIdx]?.medicalHistoryDetails}"</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 mt-2 mb-1 border-t border-gray-200 pt-2">
                        <p className="text-sm font-bold text-gray-800">Data Paspor</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Nomor Paspor</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.passportNo || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Kantor Penerbit</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.passportOffice || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tanggal Terbit</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.passportIssueDate || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tanggal Berakhir</p>
                        <p className="font-medium text-sm">{selectedJamaah.paxData?.[activePaxIdx]?.passportExpiryDate || 'Belum diisi'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* SECTION: Verifikasi Dokumen Persyaratan */}
              {activeJamaahSubTab === 'dokumen' && (
                <div className="animate-in fade-in duration-300">
                  <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-gold-500" /> Verifikasi Dokumen Persyaratan
                    </div>
                    { (selectedJamaah.paxCount || 1) > 1 && (
                      <div className="flex bg-gray-100 p-1 rounded-xl space-x-1">
                        {Array.from({ length: selectedJamaah.paxCount || 1 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActivePaxIdx(i)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              activePaxIdx === i 
                                ? 'bg-white text-gold-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Pax {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white shadow-md p-6 rounded-xl border border-gray-100">
                    {(() => {
                      const isMarried = selectedJamaah.paxData?.[activePaxIdx]?.maritalStatus === 'Menikah';
                      const categories = [
                        'KTP Asli', 
                        'Kartu Keluarga (KK)', 
                        'Paspor Asli', 
                        'Pas Foto 4x6', 
                        ...(isMarried ? ['Buku Nikah'] : []),
                        'Sertifikat Vaksin'
                      ];

                      return categories.map((docName, i) => {
                        const docSuffix = `_${activePaxIdx}`;
                        const docItem = Array.isArray(selectedJamaah.documents) ? selectedJamaah.documents.find((d: any) => d.docType.includes(docName) && d.docType.endsWith(docSuffix)) : null;
                        const isUploaded = !!docItem;
                        const status = docItem?.status || 'pending';
                        const isPdf = !!docItem?.isPdf;
                        const token = localStorage.getItem('token');
                        const ext = isPdf ? '.pdf' : '.png';
                        const fileUrl = docItem ? `/api/documents/${docItem.id}/file?token=${token}&ext=${ext}` : '';
                        const imageSrc = fileUrl;
                        const isBase64 = isUploaded && !isPdf;

                        return (
                          <div key={i} className={`flex flex-col border rounded-xl overflow-hidden bg-white shadow-md transition-all ${status === 'approved' || status === 'VERIFIED' ? 'border-green-200 ring-1 ring-green-100' : status === 'rejected' || status === 'REJECTED' ? 'border-red-200' : 'border-gray-100'}`}>
                            <div className={`p-3 border-b flex justify-between items-center ${status === 'approved' || status === 'VERIFIED' ? 'bg-green-50 border-green-100' : status === 'rejected' || status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                              <p className="text-sm font-medium text-gray-800">{docName}</p>
                              {(status === 'approved' || status === 'VERIFIED') && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {(status === 'rejected' || status === 'REJECTED') && <X className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="p-3 flex flex-col justify-center items-center h-32 bg-white relative">
                              {isUploaded ? (
                                isPdf ? (
                                  <>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 w-full rounded">
                                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                                      <span className="text-[10px] font-bold uppercase text-gray-500">PDF Document</span>
                                    </div>
                                    <button onClick={() => openDataUrlInNewTab(fileUrl)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold rounded">
                                      Buka PDF
                                    </button>
                                  </>
                                ) : isBase64 ? (
                                  <>
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 w-full rounded">
                                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                      <span className="text-[10px] font-bold uppercase text-gray-500">Image Document</span>
                                    </div>
                                    <button onClick={() => openDataUrlInNewTab(imageSrc)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold rounded">
                                      Lihat Penuh
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-green-600 font-bold text-sm flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1"/> File Tersimpan
                                  </div>
                                )
                              ) : (
                                <div className="text-gray-400 text-sm flex flex-col items-center">
                                  <X className="w-6 h-6 mb-1 opacity-20"/>
                                  <span className="text-xs">Belum diunggah</span>
                                </div>
                              )}
                            </div>
                            {isUploaded && (status === 'pending' || status === 'PENDING') && (
                              <div className="p-3 flex gap-2 bg-gray-50 border-t border-gray-100">
                                <button
                                   onClick={async () => {
                                     try {
                                       await api.patch(`/admin/documents/${docItem.id}/verify`, { status: 'approved' });
                                       toast.success('Dokumen disetujui');
                                       // Update local state to reflect change
                                       const updatedDocs = selectedJamaah.documents.map((d: any) => 
                                         d.id === docItem.id ? { ...d, status: 'approved' } : d
                                       );
                                       setSelectedJamaah({ ...selectedJamaah, documents: updatedDocs });
                                       refreshData(true);
                                     } catch (error: any) {
                                       toast.error('Gagal memverifikasi dokumen');
                                     }
                                   }}
                                   className="flex-1 text-[10px] py-1.5 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors uppercase tracking-wider"
                                >
                                  Terima
                                </button>
                                <button
                                   onClick={() => {
                                     setRejectDocModal({
                                       isOpen: true,
                                       docId: docItem.id,
                                       docLabel: docName || 'Dokumen',
                                       reason: 'Foto / Dokumen Kurang Jelas'
                                     });
                                   }}
                                   className="flex-1 text-[10px] py-1.5 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors uppercase tracking-wider"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                            {isUploaded && status !== 'pending' && status !== 'PENDING' && (
                              <div className={`p-2 text-center text-[10px] font-bold uppercase tracking-widest ${status === 'approved' || status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {status === 'approved' || status === 'VERIFIED' ? 'Terverifikasi' : 'Ditolak'}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Verifikasi Keuangan */}
      {isPaymentModalOpen && reviewingPaymentJamaah && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white shadow-md rounded-3xl w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-4 bg-gray-50 text-gray-900 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold">
                  {(reviewingPaymentJamaah?.name || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">Verifikasi Pembayaran: {reviewingPaymentJamaah.name}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{reviewingPaymentJamaah.packageName || 'Paket Belum Dipilih'}</p>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Transaction List */}
              <div className="w-full md:w-1/3 border-r border-gray-100 overflow-y-auto bg-white/50 p-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Riwayat Pembayaran</h4>
                {(reviewingPaymentJamaah.payments || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((t: any) => {
                  const isVer = ['approved', 'VERIFIED'].includes(t.status);
                  const isRej = ['rejected', 'REJECTED'].includes(t.status);
                  return (
                    <button 
                      key={t.id}
                      onClick={() => setReviewingTransactionId(t.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${reviewingTransactionId === t.id ? 'bg-white shadow-md border-gray-500 ring-2 ring-gray-100' : 'bg-white shadow-md border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reviewingTransactionId === t.id ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-400'}`}>
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Rp {Number(t.amount).toLocaleString('id-ID')}</p>
                          <p className={`text-[10px] font-bold uppercase ${isVer ? 'text-green-600' : isRej ? 'text-red-600' : 'text-yellow-600'}`}>
                            {isVer ? 'Terverifikasi' : isRej ? 'Ditolak' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</p>
                        <ChevronRight className={`w-4 h-4 transition-transform ml-auto ${reviewingTransactionId === t.id ? 'translate-x-1 text-gray-500' : 'text-gray-300'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Evidence & Action */}
              <div className="flex-1 overflow-y-auto bg-white shadow-md flex flex-col">
                {reviewingTransactionId ? (
                  <div className="p-8 space-y-8 flex-1 flex flex-col">
                    {(() => {
                      const transaction = (reviewingPaymentJamaah.payments || []).find((t: any) => t.id === reviewingTransactionId);
                      if (!transaction) return null;
                      const isVerified = ['approved', 'VERIFIED'].includes(transaction.status);
                      const isRejected = ['rejected', 'REJECTED'].includes(transaction.status);

                      return (
                        <>
                          <div className="flex items-center justify-between shrink-0">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">Detail Setoran</h4>
                              <p className="text-sm text-gray-600 mt-1">ID Transaksi: {transaction.id} • Diterima: {new Date(transaction.createdAt).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => generateProofPdf(reviewingPaymentJamaah, transaction)}
                                className="flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-md rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-800"
                                title="Unduh Bukti Transfer sebagai PDF resmi"
                              >
                                <Download className="w-4 h-4 mr-2 text-emerald-200" /> Unduh Bukti Transfer (PDF)
                              </button>
                              {isVerified && (
                                <button 
                                  onClick={() => handleGenerateInvoice(reviewingPaymentJamaah, transaction.id)}
                                  className="flex items-center px-4 py-2 bg-white shadow-md text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer"
                                  title="Cetak Kuitansi Resmi"
                                >
                                  <Printer className="w-4 h-4 mr-2" /> Cetak Kuitansi (PDF)
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                            {(() => {
                              const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
                              const apiProofEndpoint = `/api/payments/${transaction.id}/proof?token=${token}`;
                              
                              const rawProof = transaction.proofUrl || transaction.proof_url || transaction.fileUrl || (transaction as any).proof;
                              const isDirectBase64Image = typeof rawProof === 'string' && (rawProof.startsWith('data:image/') || rawProof.startsWith('iVBORw') || rawProof.startsWith('/9j/'));
                              const isPdf = typeof rawProof === 'string' && (rawProof.startsWith('data:application/pdf') || rawProof.toLowerCase().includes('.pdf'));

                              const initialSrc = isDirectBase64Image 
                                ? (rawProof.startsWith('data:') ? rawProof : `data:image/jpeg;base64,${rawProof}`)
                                : (rawProof && (rawProof.startsWith('http') || rawProof.startsWith('/uploads/')) ? rawProof : apiProofEndpoint);

                              return (
                                <div className="bg-slate-900/5 rounded-3xl relative group min-h-[420px] border border-gray-200/80 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
                                  {transaction.id ? (
                                    isPdf ? (
                                      <iframe 
                                        src={initialSrc} 
                                        className="w-full h-full min-h-[380px] rounded-2xl border border-gray-200 bg-white shadow-md" 
                                        title="Pratinjau Bukti Transfer (PDF)"
                                      />
                                    ) : (
                                      <div className="relative w-full h-full flex flex-col items-center justify-center p-2 group">
                                        <img 
                                          src={initialSrc} 
                                          alt="Bukti Transfer" 
                                          className="max-w-full max-h-[55vh] w-auto h-auto object-contain rounded-2xl shadow-xl border border-gray-200 bg-white transition-all duration-300 group-hover:scale-[1.01]" 
                                          onError={(e) => {
                                            const target = e.currentTarget;
                                            if (!target.dataset.triedEndpoint) {
                                              target.dataset.triedEndpoint = 'true';
                                              target.src = apiProofEndpoint;
                                            } else if (!target.dataset.failed) {
                                              target.dataset.failed = 'true';
                                              target.style.display = 'none';
                                              const parent = target.parentElement;
                                              if (parent) {
                                                const fallbackDiv = parent.querySelector('.proof-fallback-ui');
                                                if (fallbackDiv) (fallbackDiv as HTMLElement).style.display = 'flex';
                                              }
                                            }
                                          }}
                                        />

                                        <div className="proof-fallback-ui hidden flex-col items-center justify-center text-center p-8 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md space-y-3 max-w-sm">
                                          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                                            <FileText className="w-6 h-6" />
                                          </div>
                                          <div>
                                            <p className="font-bold text-gray-900 text-sm">Bukti Transfer Berkas</p>
                                            <p className="text-xs text-gray-500 mt-1">Gagal memuat pratinjau gambar secara langsung.</p>
                                          </div>
                                          <a 
                                            href={`${apiProofEndpoint}&download=true`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold text-xs hover:bg-emerald-800 transition-all shadow-md"
                                          >
                                            <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh Berkas Bukti
                                          </a>
                                        </div>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-white/20">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewFile({ url: initialSrc, type: 'image', title: `Bukti Bayar - Rp ${Number(transaction.amount).toLocaleString('id-ID')}` })}
                                            className="text-white text-xs font-bold hover:text-emerald-400 flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Maximize2 className="w-3.5 h-3.5" /> Zoom Layar Penuh
                                          </button>
                                          <span className="text-white/30 font-light">|</span>
                                          <a
                                            href={`${apiProofEndpoint}&download=true`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white text-xs font-bold hover:text-emerald-400 flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
                                          >
                                            <Download className="w-3.5 h-3.5" /> Unduh
                                          </a>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                      <FileText className="w-16 h-16 opacity-10" />
                                      <p className="font-bold text-sm uppercase tracking-widest">Pratinjau Bukti Transfer</p>
                                    </div>
                                  )}

                                  <div className="absolute top-4 left-4 pointer-events-none z-10">
                                    <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-100 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-widest shadow-md flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bukti Transfer Otentik
                                    </span>
                                  </div>
                                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewFile({ url: initialSrc, type: isPdf ? 'pdf' : 'image', title: `Bukti Bayar - Rp ${Number(transaction.amount).toLocaleString('id-ID')}` })}
                                      className="bg-emerald-700/90 hover:bg-emerald-800 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5 text-emerald-200" /> Perbesar Preview
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Info & Action */}
                            <div className="space-y-6 flex flex-col">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white shadow-md rounded-2xl border border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Nominal Dilaporkan</p>
                                  <p className="text-lg font-bold text-gray-700">Rp {Number(transaction.amount).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="p-4 bg-white shadow-md rounded-2xl border border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tanggal Transfer</p>
                                  <p className="text-lg font-bold text-gray-900">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('id-ID') : '-'}</p>
                                </div>
                              </div>

                              <div className="space-y-3 flex-1">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Catatan / Alasan Penolakan</label>
                                <textarea 
                                  placeholder="Berikan alasan jika setoran ditolak (misal: nominal tidak sesuai, bukti buram)..."
                                  className="w-full p-4 rounded-2xl bg-white shadow-md border border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all outline-none min-h-[120px] text-sm"
                                  value={paymentRejectionReason}
                                  onChange={(e) => setPaymentRejectionReason(e.target.value)}
                                />
                                {isRejected && (transaction.adminNotes || transaction.rejectionReason) && (
                                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                    <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Alasan Penolakan Sebelumnya:</p>
                                    <p className="text-xs text-red-500 italic">"{transaction.adminNotes || transaction.rejectionReason}"</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                <button 
                                  disabled={isVerified}
                                  onClick={() => handleRejectFinancialPayment(reviewingPaymentJamaah.id, transaction.id, paymentRejectionReason)}
                                  className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${isVerified ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'}`}
                                >
                                  Tolak Setoran
                                </button>
                                <button 
                                  disabled={isVerified}
                                  onClick={() => handleApproveFinancialPayment(reviewingPaymentJamaah.id, transaction.id)}
                                  className={`flex-[2] py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center ${isVerified ? 'bg-green-100 text-green-700 cursor-default' : 'bg-matcha-600 text-white hover:bg-matcha-700 shadow-lg shadow-gray-900/20'}`}
                                >
                                  {isVerified ? (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Setoran Terverifikasi</>
                                  ) : isRejected ? (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Setoran Ditolak (Klik untuk Terima)</>
                                  ) : (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Terima Pembayaran</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-white shadow-md rounded-full flex items-center justify-center">
                      <Banknote className="w-10 h-10 opacity-20" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">Pilih Transaksi</h4>
                      <p className="text-sm max-w-[300px]">Silakan pilih riwayat setoran di sisi kiri untuk melakukan verifikasi bukti transfer.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Verifikasi Dokumen */}
      {isReviewModalOpen && reviewingJamaah && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white shadow-md rounded-3xl w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="px-8 py-4 bg-gray-50 text-gray-900 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold">
                  {(reviewingJamaah?.name || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">Verifikasi Dokumen: {reviewingJamaah?.name || 'Jamaah'}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{reviewingJamaah?.packageName || 'Paket Belum Dipilih'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handleDownloadAllDocs(reviewingJamaah?.name || 'Jamaah')}
                  disabled={isDownloadingZip}
                  className={`flex items-center px-4 py-2 bg-gold-500 text-gray-900 rounded-xl text-xs font-bold hover:bg-gold-400 transition-all shadow-lg shadow-black/20 ${isDownloadingZip ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isDownloadingZip ? (
                    <>
                      <div className="w-3 h-3 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin mr-2" />
                      Mengunduh...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" /> Unduh Berkas Jamaah {activePaxIdx + 1} (ZIP)
                    </>
                  )}
                </button>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Document List & Preview */}
              <div className="w-full md:w-1/3 border-r border-gray-100 overflow-y-auto bg-white/50 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Dokumen</h4>
                  {(reviewingJamaah?.paxCount || 1) > 1 && (
                    <div className="flex bg-gray-100 p-1 rounded-xl space-x-1">
                      {Array.from({ length: reviewingJamaah?.paxCount || 1 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setActivePaxIdx(i);
                            setReviewingDocId(null);
                          }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                            activePaxIdx === i 
                              ? 'bg-white text-gold-600 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Jamaah {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {(() => {
                    const currentPaxData = Array.isArray(reviewingJamaah?.paxData) ? reviewingJamaah.paxData[activePaxIdx] : null;
                    const isMarried = currentPaxData?.maritalStatus === 'Menikah';

                    const expectedCategories = [
                      { id: 'KTP Asli', label: 'KTP Asli' },
                      { id: 'Paspor Asli', label: 'Paspor Asli' },
                      { id: 'Kartu Keluarga (KK)', label: 'Kartu Keluarga (KK)' },
                      { id: 'Pas Foto 4x6', label: 'Pas Foto 4x6' },
                      { id: 'Sertifikat Vaksin', label: 'Sertifikat Vaksin' },
                      ...(isMarried ? [{ id: 'Buku Nikah', label: 'Buku Nikah' }] : [])
                    ];

                    const allDocs = Array.isArray(reviewingJamaah?.documents) ? reviewingJamaah.documents : [];

                    return expectedCategories.map((cat) => {
                      // Find matching document for this category and pax index
                      const doc = allDocs
                        .filter((d: any) => matchDocumentCategory(d?.docType, cat.id, activePaxIdx))
                        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];

                      const isUploaded = !!doc && !!doc.fileUrl;
                      const status = doc?.status || 'missing';
                      const isSelected = reviewingDocId === cat.id || matchDocumentCategory(reviewingDocId, cat.id, activePaxIdx);

                      return (
                        <div key={cat.id} className="relative group/doc">
                          <button 
                            onClick={() => setReviewingDocId(cat.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                              !isUploaded ? 'bg-gray-50/80 border-gray-100 hover:border-gray-200' :
                              isSelected ? 'bg-white shadow-md border-emerald-500 ring-2 ring-emerald-100' : 
                              'bg-white shadow-sm border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                !isUploaded ? 'bg-gray-200 text-gray-400' :
                                status === 'VERIFIED' || status === 'approved' ? 'bg-green-100 text-green-600' :
                                status === 'REJECTED' || status === 'rejected' ? 'bg-red-100 text-red-600' :
                                isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{cat.label}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${
                                  !isUploaded ? 'text-gray-400' :
                                  ['approved', 'VERIFIED'].includes(status) ? 'text-green-600' : 
                                  ['rejected', 'REJECTED'].includes(status) ? 'text-red-600' : 'text-orange-500'
                                }`}>
                                  {!isUploaded ? 'BELUM UNGGAH' : 
                                   status === 'VERIFIED' || status === 'approved' ? 'TERVERIFIKASI' :
                                   status === 'REJECTED' || status === 'rejected' ? 'DITOLAK' : 'MENUNGGU VERIFIKASI'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-emerald-500' : 'text-gray-300'}`} />
                          </button>
                          
                          {/* Tarik/Reset Button for Verified/Rejected docs */}
                          {isUploaded && (status === 'VERIFIED' || status === 'REJECTED' || status === 'approved' || status === 'rejected') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetDoc(reviewingJamaah?.id, cat.id);
                              }}
                              disabled={isVerifying}
                              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:border-orange-200 transition-all z-10 hover:scale-110 active:scale-95"
                              title="Tarik Verifikasi (Kembalikan ke Pending)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Side: Detail Preview & Action */}
              <div className="flex-1 overflow-y-auto bg-white shadow-md flex flex-col">
                {reviewingDocId ? (
                  (() => {
                    const allDocs = Array.isArray(reviewingJamaah?.documents) ? reviewingJamaah.documents : [];
                    const activeDoc = allDocs.find((d: any) => matchDocumentCategory(d?.docType, reviewingDocId, activePaxIdx));

                    const token = localStorage.getItem('token');
                    let activeDocUrl: string | undefined = undefined;

                    if (activeDoc) {
                      if (activeDoc.fileUrl && activeDoc.fileUrl.trim() !== '') {
                        if (activeDoc.fileUrl.startsWith('/api/documents/') && !activeDoc.fileUrl.includes('.') && !activeDoc.fileUrl.includes('ext=')) {
                          const isPdf = activeDoc.isPdf || (activeDoc.docType && activeDoc.docType.toLowerCase().includes('pdf'));
                          const ext = isPdf ? '.pdf' : '.png';
                          activeDocUrl = `${activeDoc.fileUrl}?token=${token}&ext=${ext}`;
                        } else {
                          activeDocUrl = activeDoc.fileUrl;
                        }
                      } else if (activeDoc.id) {
                        const isPdf = activeDoc.isPdf || (activeDoc.docType && activeDoc.docType.toLowerCase().includes('pdf'));
                        const ext = isPdf ? '.pdf' : '.png';
                        activeDocUrl = `/api/documents/${activeDoc.id}/file?token=${token}&ext=${ext}`;
                      }
                    }

                    const effectiveDocUrl = activeDocUrl || getDocPreviewDataUrl(reviewingDocId, reviewingJamaah?.name, reviewingJamaah?.packageName, activePaxIdx);
                    const docTitle = reviewingDocId ? reviewingDocId.split('_')[0] : 'Detail Dokumen';

                    return (
                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between shrink-0">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{docTitle}</h4>
                        <p className="text-sm text-gray-600 mt-1">Review detail dokumen dan berikan keputusan verifikasi.</p>
                      </div>
                    </div>

                    <div className="flex-1 min-h-[450px] relative rounded-3xl overflow-hidden border border-gray-200 shadow-inner bg-slate-950">
                      <PdfViewer 
                        url={effectiveDocUrl} 
                        title={`${docTitle} - ${reviewingJamaah?.name || 'Jamaah'}`} 
                        className="w-full h-full min-h-[450px]" 
                      />
                    </div>

                    <div className="shrink-0 space-y-6 pt-2">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Catatan Verifikasi (Wajib jika ditolak)</label>
                        <textarea 
                          placeholder="Berikan alasan jika dokumen ditolak..."
                          className="w-full p-4 rounded-2xl bg-white shadow-md border border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all outline-none min-h-[100px] text-sm"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          disabled={isVerifying}
                          onClick={() => handleRejectDoc(reviewingJamaah?.id, reviewingDocId, rejectionReason)}
                          className={`flex-1 py-4 bg-red-50 text-red-700 rounded-2xl font-bold text-sm hover:bg-red-100 border border-red-100 transition-all active:scale-95 ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <X className="w-4 h-4 inline mr-2" /> Tolak Dokumen
                        </button>
                        <button 
                          disabled={isVerifying}
                          onClick={() => handleApproveDoc(reviewingJamaah?.id, reviewingDocId)}
                          className={`flex-[2] py-4 bg-matcha-600 text-white rounded-2xl font-bold text-sm hover:bg-matcha-700 shadow-lg shadow-gray-900/20 transition-all active:scale-95 flex items-center justify-center ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Ajukan dan Verifikasi
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-white shadow-md rounded-full flex items-center justify-center">
                      <FileText className="w-10 h-10 opacity-20" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">Pilih Dokumen</h4>
                      <p className="text-sm max-w-[300px]">Silakan pilih dokumen di sisi kiri untuk memulai proses review dan verifikasi.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {deletePackageId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[80] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Paket?</h3>
            <p className="text-gray-600 mb-6 text-sm">Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeletePackageId(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  deletePackage(deletePackageId);
                  setDeletePackageId(null);
                }}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isPackageModalOpen && editingPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4 sm:p-8 overflow-y-auto">
          <div className="bg-white shadow-md rounded-3xl shadow-2xl w-full max-w-3xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-gray-50 text-gray-900 flex justify-between items-center border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold">
                {packages.find(p => p.id === editingPackage.id) ? 'Edit' : 'Tambah'} Paket {editingPackage.type === 'umroh' ? 'Umroh' : 'Haji'}
              </h3>
              <button onClick={() => setIsPackageModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <form id="package-form" onSubmit={handleSavePackage} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4">Foto Paket *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      {editingPackage.image ? (
                        <>
                          <img src={editingPackage.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white shadow-md text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl active:scale-95 transition-all">
                              Ganti Foto
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await toBase64(file);
                                      setEditingPackage((prev: any) => ({ ...prev, image: compressed }));
                                    } catch (err) {
                                      toast.error("Gagal memproses file gambar");
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                          <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                          <span className="text-xs font-bold text-gray-400">Pilih Foto Paket</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await toBase64(file);
                                  setEditingPackage((prev: any) => ({ ...prev, image: compressed }));
                                } catch (err) {
                                  toast.error("Gagal memproses file gambar");
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Atau Gunakan URL Gambar</label>
                        <input 
                          type="text" 
                          value={editingPackage.image} 
                          onChange={e => setEditingPackage({...editingPackage, image: e.target.value})} 
                          className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all text-xs"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div className="p-4 bg-white shadow-md rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
                          <strong>Tips:</strong> Gunakan gambar dengan resolusi tinggi (min. 800x600px) untuk tampilan yang profesional. Anda bisa mengunggah file langsung atau menempelkan link gambar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Paket *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingPackage.name} 
                    onChange={e => setEditingPackage({...editingPackage, name: e.target.value})} 
                    className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                    placeholder="Contoh: Umroh Reguler Bintang 5"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Harga (Rp) *</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none group-focus-within:text-gray-600 transition-colors">
                        Rp
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={editingPackage.price === 0 ? '' : editingPackage.price.toLocaleString('id-ID')} 
                        onChange={e => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 10) val = val.slice(0, 10); // Max 10 digits to prevent numeric overflow
                          setEditingPackage({...editingPackage, price: val === '' ? 0 : Number(val)});
                        }} 
                        className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 pl-12 pr-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all font-medium"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kuota *</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        required 
                        value={editingPackage.quota === 0 ? '' : (editingPackage.quota || '')} 
                        onChange={e => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 4) val = val.slice(0, 4); // Max 4 digits
                          setEditingPackage({...editingPackage, quota: val === '' ? 0 : Number(val)});
                        }} 
                        className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all font-medium"
                        placeholder="45"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">
                        Pax
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Durasi *</label>
                    <input 
                      type="text" 
                      required 
                      value={editingPackage.duration} 
                      onChange={e => setEditingPackage({...editingPackage, duration: e.target.value})} 
                      className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                      placeholder="Contoh: 9 Hari"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Kategori *</label>
                    <select 
                      value={editingPackage.type || 'umroh'}
                      onChange={e => setEditingPackage({...editingPackage, type: e.target.value})}
                      className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                    >
                      <option value="umroh">Umroh</option>
                      <option value="haji">Haji</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Deskripsi / Poin Keunggulan *</label>
                    <button 
                      type="button"
                      onClick={() => setEditingPackage({...editingPackage, description: [...editingPackage.description, '']})}
                      className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-800 flex items-center bg-white shadow-md px-3 py-1 rounded-full transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Tambah Poin
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editingPackage.description || ['']).map((desc: string, index: number) => (
                      <div key={index} className="flex space-x-2 animate-in slide-in-from-left-2 duration-200">
                        <div className="flex-1 relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 group-focus-within:text-gray-400">
                            #{index + 1}
                          </div>
                          <input 
                            type="text" 
                            required 
                            value={desc} 
                            onChange={e => {
                              const newDesc = [...editingPackage.description];
                              newDesc[index] = e.target.value;
                              setEditingPackage({...editingPackage, description: newDesc});
                            }} 
                            className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 pl-11 pr-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all text-sm font-medium"
                            placeholder="Contoh: Fasilitas Hotel Bintang 5..."
                          />
                        </div>
                        {editingPackage.description.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newDesc = editingPackage.description.filter((_: any, i: number) => i !== index);
                              setEditingPackage({...editingPackage, description: newDesc});
                            }}
                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="isAvailable"
                    checked={editingPackage.isAvailable} 
                    onChange={e => setEditingPackage({...editingPackage, isAvailable: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-bold text-gray-700">Tersedia untuk Pendaftaran</label>
                </div>


              </form>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end space-x-4 bg-white shadow-md">
              <button 
                onClick={() => setIsPackageModalOpen(false)} 
                className="px-6 py-3 text-gray-600 hover:bg-gray-200 bg-white shadow-md border border-gray-200 rounded-2xl font-bold transition-all"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="package-form" 
                className="px-10 py-3 bg-gray-50 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/20"
              >
                Simpan Paket
              </button>
            </div>
          </div>
        </div>
      )}
      {isScheduleModalOpen && editingSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white shadow-md rounded-3xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-gray-50 text-gray-900 flex justify-between items-center border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold">
                {schedules.find(s => s.id === editingSchedule.id) ? 'Edit' : 'Tambah'} Jadwal Keberangkatan
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <form id="schedule-form" onSubmit={handleSaveSchedule} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kloter (Contoh: Kloter Jakarta 01) *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingSchedule.name || ''} 
                    onChange={e => setEditingSchedule({...editingSchedule, name: e.target.value})} 
                    placeholder="Masukkan nama kloter..."
                    className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Maskapai Penerbangan (Contoh: Garuda Indonesia) *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingSchedule.airline || ''} 
                    onChange={e => setEditingSchedule({...editingSchedule, airline: e.target.value})} 
                    placeholder="Masukkan nama maskapai..."
                    className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Paket *</label>
                  <select 
                    required 
                    value={editingSchedule.packageId} 
                    onChange={e => setEditingSchedule({...editingSchedule, packageId: e.target.value})} 
                    className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                  >
                    <option value="">Pilih Paket...</option>
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type?.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Keberangkatan *</label>
                  <input 
                    type="date" 
                    required 
                    value={editingSchedule.departureDate} 
                    onChange={e => setEditingSchedule({...editingSchedule, departureDate: e.target.value})} 
                    className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Total Kursi *</label>
                    <input 
                      type="number" 
                      required 
                      value={editingSchedule.totalSeats} 
                      onChange={e => setEditingSchedule({...editingSchedule, totalSeats: Number(e.target.value), availableSeats: Number(e.target.value)})} 
                      className="w-full border-gray-200 rounded-2xl bg-white shadow-md border py-3 px-4 focus:ring-4 focus:ring-gray-100 focus:border-gray-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Sisa Kursi</label>
                    <input 
                      type="number" 
                      readOnly
                      value={editingSchedule.availableSeats} 
                      className="w-full border-gray-200 rounded-2xl bg-gray-100 border py-3 px-4 outline-none"
                    />
                  </div>
                </div>

                {/* Section Informasi Pembimbing & Muthawwif */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-600" /> Informasi Pembimbing & Muthawwif Kloter
                    </label>
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Tampil di Portal Jemaah
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pembimbing / Ustaz</label>
                      <input 
                        type="text" 
                        value={editingSchedule.muthawwifName || ''} 
                        onChange={e => setEditingSchedule({...editingSchedule, muthawwifName: e.target.value})} 
                        placeholder="Contoh: Ustadz Hanan Attaki"
                        className="w-full border-gray-200 rounded-xl bg-white shadow-sm border py-2.5 px-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Peran / Jabatan</label>
                      <input 
                        type="text" 
                        value={editingSchedule.muthawwifRole || ''} 
                        onChange={e => setEditingSchedule({...editingSchedule, muthawwifRole: e.target.value})} 
                        placeholder="Contoh: Muthawwif Utama & Pembimbing Syariah"
                        className="w-full border-gray-200 rounded-xl bg-white shadow-sm border py-2.5 px-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor WhatsApp Pembimbing</label>
                      <input 
                        type="text" 
                        value={editingSchedule.muthawwifPhone || ''} 
                        onChange={e => setEditingSchedule({...editingSchedule, muthawwifPhone: e.target.value})} 
                        placeholder="Contoh: 081234567890"
                        className="w-full border-gray-200 rounded-xl bg-white shadow-sm border py-2.5 px-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Foto Profil Pembimbing (URL / Upload)</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={editingSchedule.muthawwifAvatarUrl || ''} 
                          onChange={e => setEditingSchedule({...editingSchedule, muthawwifAvatarUrl: e.target.value})} 
                          placeholder="https://..."
                          className="w-full border-gray-200 rounded-xl bg-white shadow-sm border py-2.5 px-3 text-xs focus:ring-2 focus:ring-amber-400 outline-none truncate"
                        />
                        <label className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer shrink-0 text-xs shadow-sm flex items-center justify-center" title="Unggah Foto Pembimbing">
                          <Upload className="w-4 h-4" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  toast.info('Mengunggah foto pembimbing...');
                                  const uploadRes = await api.upload('/upload', file);
                                  const newUrl = uploadRes.url || uploadRes.fileUrl;
                                  if (newUrl) {
                                    setEditingSchedule({...editingSchedule, muthawwifAvatarUrl: newUrl});
                                    toast.success('Foto pembimbing berhasil diunggah!');
                                  }
                                } catch (err) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditingSchedule({...editingSchedule, muthawwifAvatarUrl: reader.result as string});
                                    toast.success('Foto pembimbing dimuat.');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pesan & Pengumuman Bimbingan Manasik untuk Jemaah</label>
                    <textarea 
                      rows={3}
                      value={editingSchedule.muthawwifNotes || ''} 
                      onChange={e => setEditingSchedule({...editingSchedule, muthawwifNotes: e.target.value})} 
                      placeholder="Masukkan panduan, arahan manasik, atau pesan penting untuk jemaah kloter ini..."
                      className="w-full border-gray-200 rounded-xl bg-white shadow-sm border p-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-800">
                      Upload Itinerary (WAJIB PDF) *
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                      Mendukung File Besar s/d 150MB
                    </span>
                  </div>

                  {itineraryProgress !== null ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5 truncate">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">Memproses: {itineraryFileName}</span>
                        </span>
                        <span>{itineraryProgress}%</span>
                      </div>
                      <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-150"
                          style={{ width: `${itineraryProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-emerald-700 italic text-right">
                        Mohon tunggu, file itinerary sedang dimuat...
                      </p>
                    </div>
                  ) : editingSchedule.itineraryPdfUrl ? (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-extrabold text-emerald-950 truncate">
                            {itineraryFileName || 'Itinerary Perjalanan.pdf'}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Dokumen Itinerary Siap
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => openDataUrlInNewTab(editingSchedule.itineraryPdfUrl)}
                          className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-xl transition-all"
                          title="Pratinjau PDF Itinerary"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSchedule({...editingSchedule, itineraryPdfUrl: ''});
                            setItineraryFileName('');
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus / Ganti Itinerary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="group relative border-2 border-dashed border-gray-200 hover:border-emerald-500 bg-gray-50/60 hover:bg-emerald-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center">
                      <input 
                        type="file" 
                        accept=".pdf,application/pdf"
                        required={!editingSchedule.itineraryPdfUrl}
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 150 * 1024 * 1024) {
                              toast.error('Ukuran file PDF terlalu besar. Maksimal 150MB.');
                              e.target.value = '';
                              return;
                            }
                            if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
                              toast.error('Hanya file PDF yang diperbolehkan!');
                              e.target.value = '';
                              return;
                            }

                            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                            setItineraryFileName(`${file.name} (${sizeMB} MB)`);
                            setItineraryProgress(0);

                            const reader = new FileReader();
                            reader.onprogress = (evt) => {
                              if (evt.lengthComputable) {
                                const percent = Math.round((evt.loaded / evt.total) * 100);
                                setItineraryProgress(percent);
                              }
                            };
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              setEditingSchedule({...editingSchedule, itineraryPdfUrl: base64});
                              setItineraryProgress(null);
                              toast.success(`Itinerary (${sizeMB} MB) berhasil dimuat. Klik "Simpan Jadwal" jika sudah selesai.`);
                            };
                            reader.onerror = () => {
                              setItineraryProgress(null);
                              toast.error('Gagal membaca file PDF. Silakan coba lagi.');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 group-hover:border-emerald-200 transition-all mb-2 text-emerald-600">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                        Klik atau Tarik File Itinerary (PDF) ke Sini *
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Format PDF &bull; Kapasitas Fleksibel hingga <span className="font-bold text-gray-600">150 MB</span>
                      </p>
                    </label>
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end space-x-4 bg-white shadow-md">
              <button 
                onClick={() => setIsScheduleModalOpen(false)} 
                className="px-6 py-3 text-gray-600 hover:bg-gray-200 bg-white shadow-md border border-gray-200 rounded-2xl font-bold transition-all"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="schedule-form" 
                className="px-10 py-3 bg-gray-50 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-lg shadow-gray-900/20"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Certificate Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 shadow-2xl">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Award className="w-6 h-6 text-gold-400" /> Unggah Sertifikat Jamaah
                </h3>
                <p className="text-xs text-gray-300 mt-1">Pilih jamaah dan unggah berkas sertifikat digital (PDF/Gambar)</p>
              </div>
              <button 
                onClick={() => {
                  setIsCertModalOpen(false);
                  setSelectedCertFile(null);
                  setCertForm({ registrationId: '', certificateUrl: '' });
                }} 
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Select Jamaah */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gold-500" /> Pilih Akun / Pendaftaran <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all font-medium text-sm text-gray-800"
                  value={certForm.registrationId}
                  onChange={e => {
                    const regId = e.target.value;
                    const reg = consultations.find(c => c.id === regId) || registrations.find(r => r.id === regId);
                    setCertForm({
                      ...certForm,
                      registrationId: regId,
                      recipientName: reg?.name || reg?.ordererName || ''
                    });
                  }}
                >
                  <option value="">-- Pilih Pendaftaran Jamaah --</option>
                  {consultations.filter(c => c.status !== 'none').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.packageName ? `(${c.packageName})` : ''}
                    </option>
                  ))}
                  {registrations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ordererName || 'Jamaah'} {r.packageName ? `(${r.packageName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Specific Passenger (Pax) if multiple passengers exist in registration */}
              {certForm.registrationId && (() => {
                const reg = consultations.find(c => c.id === certForm.registrationId) || registrations.find(r => r.id === certForm.registrationId);
                const paxData = reg?.paxData && Array.isArray(reg.paxData) ? reg.paxData : [];
                const ordererName = reg?.name || reg?.ordererName || 'Jamaah';

                return (
                  <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-900">
                        <UsersRound className="w-4 h-4 text-gold-600" /> Nama Penerima Sertifikat
                      </span>
                      {paxData.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {paxData.length} Orang Terdaftar
                        </span>
                      )}
                    </label>

                    {paxData.length > 0 ? (
                      <div className="space-y-1.5">
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-amber-300/70 bg-white shadow-sm outline-none focus:border-gold-500 font-medium text-xs text-gray-800"
                          value={certForm.recipientName}
                          onChange={e => setCertForm({...certForm, recipientName: e.target.value})}
                        >
                          <option value={ordererName}>
                            Pemesan Utama: {ordererName}
                          </option>
                          {paxData.map((pax: any, idx: number) => {
                            const pName = pax.fullName || pax.name || `Jamaah #${idx + 1}`;
                            return (
                              <option key={idx} value={pName}>
                                Jamaah #{idx + 1}: {pName} {pax.nik ? `(NIK: ${pax.nik})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Satu akun pendaftaran memiliki {paxData.length} orang jamaah. Pilih nama spesifik jamaah yang menerima sertifikat ini.
                        </p>
                      </div>
                    ) : (
                      <input 
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-amber-300/70 bg-white shadow-sm outline-none focus:border-gold-500 text-xs font-medium text-gray-800 placeholder:text-gray-400"
                        placeholder={`Atas Nama: ${ordererName}`}
                        value={certForm.recipientName}
                        onChange={e => setCertForm({...certForm, recipientName: e.target.value})}
                      />
                    )}
                  </div>
                );
              })()}
              
              {/* Drag and Drop File Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-gold-500" /> Berkas Sertifikat (PDF / Gambar) <span className="text-red-500">*</span>
                </label>

                {!selectedCertFile ? (
                  <label 
                    className="group relative border-2 border-dashed border-gray-300 hover:border-gold-500 bg-gray-50/50 hover:bg-gold-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 text-center"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        if (file.size > 100 * 1024 * 1024) {
                          toast.error("Ukuran file terlalu besar. Maksimal 100 MB.");
                          return;
                        }
                        setSelectedCertFile(file);
                        setCertForm({...certForm, certificateUrl: ''});
                      }
                    }}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                      if (file.size > 100 * 1024 * 1024) {
                        toast.error("Ukuran file terlalu besar. Maksimal 100 MB.");
                        return;
                      }
                          setSelectedCertFile(file);
                          setCertForm({...certForm, certificateUrl: ''});
                        }
                      }} 
                      accept="application/pdf,image/*" 
                    />
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-100 group-hover:scale-110 group-hover:border-gold-200 transition-all mb-3">
                      <UploadCloud className="w-7 h-7 text-gold-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-gold-600 transition-colors">
                      Klik atau Tarik File Sertifikat ke Sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Mendukung format PDF, PNG, JPG, WEBP (Maks. 100 MB)
                    </p>
                  </label>
                ) : (
                  <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        {selectedCertFile.type.includes('pdf') ? (
                          <FileText className="w-6 h-6" />
                        ) : (
                          <ImageIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-emerald-950 truncate">{selectedCertFile.name}</p>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">
                          {(selectedCertFile.size / 1024).toFixed(1)} KB &bull; {selectedCertFile.type.includes('pdf') ? 'Dokumen PDF' : 'Gambar'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedCertFile(null)}
                      className="p-2 text-emerald-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0 ml-2"
                      title="Ganti Berkas"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Optional direct URL fallback */}
              {!selectedCertFile && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Atau Masukkan Link / URL Sertifikat (Opsional)
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:border-gold-500 text-xs font-medium text-gray-700 placeholder:text-gray-300"
                    placeholder="https://... (Link Google Drive / Cloud Storage)"
                    value={certForm.certificateUrl}
                    onChange={e => setCertForm({...certForm, certificateUrl: e.target.value})}
                  />
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsCertModalOpen(false);
                    setSelectedCertFile(null);
                    setCertForm({ registrationId: '', certificateUrl: '' });
                  }}
                  className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleAddCertificate}
                  disabled={isSubmittingCert || !certForm.registrationId || (!selectedCertFile && !certForm.certificateUrl)}
                  className="w-2/3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingCert ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah Berkas...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Simpan & Terbitkan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white shadow-2xl rounded-[32px] w-full max-w-xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-white border-b border-gray-100 text-gray-900 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold flex items-center">
                <ImageIcon className="w-6 h-6 mr-3 text-gold-500" /> Unggah Momen Kenangan
              </h3>
              <button 
                onClick={() => setIsMemoryModalOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Paket Perjalanan</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all font-medium"
                    value={memoryForm.packageId}
                    onChange={e => setMemoryForm({...memoryForm, packageId: e.target.value})}
                  >
                    <option value="">Semua Paket (General)</option>
                    {(packages || []).map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Akun (Opsional)</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all font-medium"
                    value={memoryForm.registrationId}
                    onChange={e => setMemoryForm({...memoryForm, registrationId: e.target.value})}
                  >
                    <option value="">Semua Jamaah (Public)</option>
                    {consultations.filter(c => !c.id.startsWith('user-')).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.packageName ? `(${c.packageName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Media Momen</label>
                <div 
                  onClick={() => document.getElementById('memory-file')?.click()}
                  className="w-full aspect-video rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gold-400 transition-all overflow-hidden relative group"
                >
                  {selectedMemoryFile ? (
                    selectedMemoryFile.type.startsWith('video') ? (
                      <div className="flex flex-col items-center">
                        <Video className="w-12 h-12 text-gold-500 mb-2" />
                        <span className="text-sm font-medium text-gray-600 truncate px-4">{selectedMemoryFile.name}</span>
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(selectedMemoryFile)} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                      <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-3 text-gray-400 group-hover:text-gold-500 group-hover:shadow-md transition-all">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Klik atau Seret File</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, atau MP4 (Maks. 5MB)</p>
                    </div>
                  )}
                  <input id="memory-file" type="file" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Ukuran file maksimal 5 MB.");
                        return;
                      }
                      setSelectedMemoryFile(file);
                    }
                  }} accept="image/*,video/*" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan / Caption</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all font-medium min-h-[100px] resize-none"
                  placeholder="Tuliskan deskripsi atau cerita singkat momen ini..."
                  value={memoryForm.description}
                  onChange={e => setMemoryForm({...memoryForm, description: e.target.value})}
                />
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
              <button 
                onClick={handleAddMemory}
                disabled={(!selectedMemoryFile && !memoryForm.imageUrl) || isSubmittingMemory}
                className="w-full py-4 bg-[#132019] text-white rounded-2xl font-bold hover:bg-[#1a2d23] transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                {isSubmittingMemory ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Sedang Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Simpan & Publikasikan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white shadow-md rounded-3xl overflow-hidden flex flex-col h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
                  {previewFile.type === 'pdf' ? <FileText className="w-5 h-5 text-gold-600" /> : <ImageIcon className="w-5 h-5 text-gold-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{previewFile.title}</h3>
                  <p className="text-xs text-gray-500">Preview Dokumen</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => downloadFile(previewFile.url, `${previewFile.title.replace(/\s+/g, '_')}.${isPdfUrl(previewFile.url) ? 'pdf' : 'png'}`)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                  title="Unduh File"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </button>
                <button 
                  onClick={() => openDataUrlInNewTab(previewFile.url, previewFile.title)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-emerald-200"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Baru</span>
                </button>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-950 p-2 flex items-center justify-center">
              {(() => {
                const isPdf = isPdfUrl(previewFile.url) || previewFile.type === 'pdf';
                const isImage = isImageUrl(previewFile.url) || previewFile.type === 'image';
                const blobUrl = getBlobUrlFromDataUrl(previewFile.url);

                if (isPdf) {
                  return (
                    <PdfViewer url={previewFile.url} title={previewFile.title} className="h-full w-full" />
                  );
                } else if (isImage) {
                  return (
                    <img 
                      src={blobUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-xl" 
                    />
                  );
                } else {
                  return (
                    <div className="text-center p-8 space-y-3">
                      <p className="font-bold text-gray-800">{previewFile.title}</p>
                      <button 
                        onClick={() => openDataUrlInNewTab(previewFile.url, previewFile.title)}
                        className="px-4 py-2 bg-gold-500 text-slate-950 rounded-xl font-bold text-xs"
                      >
                        Buka Dokumen
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-center">
              <button 
                onClick={() => setPreviewFile(null)}
                className="px-8 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-emerald-950/20 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative animate-in zoom-in-95 duration-300 border border-emerald-50">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner ${
              confirmDialog.type === 'danger' ? 'bg-red-50 text-red-500 border border-red-100' :
              confirmDialog.type === 'warning' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
              'bg-emerald-50 text-emerald-500 border border-emerald-100'
            }`}>
              {confirmDialog.type === 'danger' ? <ShieldAlert className="w-10 h-10" /> : 
               confirmDialog.type === 'warning' ? <AlertTriangle className="w-10 h-10" /> : 
               <ShieldCheck className="w-10 h-10" />}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-3 text-center tracking-tight">{confirmDialog.title}</h2>
            <p className="text-gray-500 mb-10 text-center leading-relaxed font-medium px-4">{confirmDialog.message}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className={`px-6 py-4 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-xl ${
                  confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                  confirmDialog.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' :
                  'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {confirmDialog.type === 'danger' ? 'Ya, Hapus' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Pax Modal */}
      <ManifestPaxModal
        isOpen={!!selectedManifestReg}
        onClose={() => setSelectedManifestReg(null)}
        consultation={selectedManifestReg}
        existingManifest={manifest?.find(m => m.registrationId === selectedManifestReg?.id)}
        onSave={async (registrationId, payload) => {
          await updateManifest(registrationId, payload);
          await refreshData(true);
        }}
      />

      {/* Final Document Upload Modal */}
      <FinalDocumentUploadModal
        isOpen={finalDocModal.isOpen}
        onClose={() => setFinalDocModal(prev => ({ ...prev, isOpen: false }))}
        registrationId={finalDocModal.registrationId}
        jamaahName={finalDocModal.jamaahName}
        packageName={finalDocModal.packageName}
        docType={finalDocModal.docType}
        paxData={finalDocModal.paxData}
        paxCount={finalDocModal.paxCount}
        documents={finalDocModal.documents}
        existingDocUrl={finalDocModal.existingDocUrl}
        onSuccess={async () => {
          await refreshData(true);
        }}
      />

      {/* Rejection Reason Modal */}
      {rejectDocModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl relative border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tolak Dokumen</h3>
                  <p className="text-xs text-gray-500">{rejectDocModal.docLabel}</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectDocModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Pilih / Tulis Alasan Penolakan:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Foto / Dokumen Kurang Jelas',
                  'Masa Berlaku Paspor < 6 Bulan',
                  'Format File Tidak Sesuai',
                  'Dokumen Belum Lengkap'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectDocModal(prev => ({ ...prev, reason: preset }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      rejectDocModal.reason === preset 
                        ? 'bg-red-50 border-red-300 text-red-700 font-bold' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectDocModal.reason}
                onChange={e => setRejectDocModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Masukkan catatan/alasan penolakan untuk jamaah..."
                className="w-full p-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-xs focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none h-24 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => setRejectDocModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!rejectDocModal.reason.trim()) {
                    toast.error('Mohon isi alasan penolakan');
                    return;
                  }
                  try {
                    await api.patch(`/admin/documents/${rejectDocModal.docId}/verify`, { status: 'rejected', reason: rejectDocModal.reason });
                    toast.error('Dokumen ditolak');
                    setRejectDocModal(prev => ({ ...prev, isOpen: false }));
                    refreshData(true);
                    if (selectedJamaah) {
                      const updatedDocs = (selectedJamaah.documents || []).map((d: any) => 
                        d.id === rejectDocModal.docId ? { ...d, status: 'rejected', rejectionReason: rejectDocModal.reason } : d
                      );
                      setSelectedJamaah({ ...selectedJamaah, documents: updatedDocs });
                    }
                  } catch (error: any) {
                    toast.error('Gagal menolak dokumen');
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/25 transition-all"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
