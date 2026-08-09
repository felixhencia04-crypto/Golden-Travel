import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, Image as ImageIcon, UploadCloud, Plus, Search, Trash2, 
  FileText, Download, Eye, X, CheckCircle2, User, RefreshCw, Filter, Sparkles,
  Users, ChevronRight, ExternalLink, ArrowRight, Building, ShieldCheck, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';
import { safeSetLocalStorage } from '../../utils/mitraStorage';

// Helper functions for extracting Jamaah data robustly
export const getJamaahName = (j: any) => {
  if (!j) return 'Calon Jemaah';
  return j.userName || j.fullName || j.namaLengkap || j.name || j.ordererName || 'Calon Jemaah';
};

export const getJamaahPhone = (j: any) => {
  if (!j) return '-';
  return j.userPhone || j.phone || j.phoneNumber || j.whatsapp || j.noHp || j.ordererPhone || '-';
};

export const getJamaahId = (j: any) => {
  if (!j) return '-';
  return j.id || j.registrationNumber || j.noPendaftaran || '-';
};

interface AdminMitraSertifikatKenanganProps {
  onRefresh?: () => void;
  users?: any[];
  onNavigateTab?: (tab: string) => void;
}

export default function AdminMitraSertifikatKenangan({ onRefresh, users = [], onNavigateTab }: AdminMitraSertifikatKenanganProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sertifikat' | 'kenangan'>('sertifikat');
  
  // Data State
  const [jamaahList, setJamaahList] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  // Search & Main Filter
  const [certSearch, setCertSearch] = useState('');
  const [memorySearch, setMemorySearch] = useState('');
  const [selectedFilterMitra, setSelectedFilterMitra] = useState<string>('all');
  const [selectedFilterJamaah, setSelectedFilterJamaah] = useState<string>('all');

  // Modals State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  // Cert Upload Form State
  const [certModalMitra, setCertModalMitra] = useState<string>('all');
  const [selectedJamaahId, setSelectedJamaahId] = useState('');
  const [certRecipientName, setCertRecipientName] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  // Memory Add Form State
  const [memoryModalMitra, setMemoryModalMitra] = useState<string>('all');
  const [memoryModalJamaah, setMemoryModalJamaah] = useState<string>('all');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryCaption, setMemoryCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [memoryImageFile, setMemoryImageFile] = useState<File | null>(null);
  const [memoryImageUrl, setMemoryImageUrl] = useState('');
  const [memoryTargetPaket, setMemoryTargetPaket] = useState('Semua Paket');
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);

  // Load Jamaah & Memories
  const loadData = () => {
    setLoading(true);
    try {
      // Load Jamaah List from mitra_jamaah_database
      const storedJamaahStr = localStorage.getItem('mitra_jamaah_database');
      let jList: any[] = [];
      if (storedJamaahStr) {
        try {
          jList = JSON.parse(storedJamaahStr);
        } catch (e) {
          console.error('Failed to parse mitra_jamaah_database', e);
        }
      }
      setJamaahList(jList);

      // Load Memories from golden_mitra_memories
      const storedMemoriesStr = localStorage.getItem('golden_mitra_memories');
      let mList: any[] = [];
      if (storedMemoriesStr) {
        try {
          mList = JSON.parse(storedMemoriesStr);
        } catch (e) {
          console.error('Failed to parse golden_mitra_memories', e);
        }
      }

      const isDummyMemory = (m: any) => {
        if (!m) return true;
        const idStr = String(m.id || '');
        if (idStr.startsWith('10000000-0000-4000-8000-00000000000')) return true;
        const titleLower = String(m.title || '').toLowerCase();
        if (
          titleLower.includes('thawaf wada jemaah golden tour') || 
          titleLower.includes('ziarah raudhah & masjid nabawi') || 
          titleLower.includes('manasik umroh bersama pembimbing syariah')
        ) {
          return true;
        }
        return false;
      };

      mList = (mList || []).filter(m => !isDummyMemory(m));
      localStorage.setItem('golden_mitra_memories', JSON.stringify(mList));
      setMemories(mList);

      // Try fetching from API if online
      api.get('/admin/memories').then(res => {
        if (Array.isArray(res)) {
          const cleanRes = res.filter((m: any) => !isDummyMemory(m));
          
          const mergedMap = new Map<string, any>();
          mList.forEach((lm: any) => {
            if (lm && lm.id) mergedMap.set(String(lm.id), lm);
          });
          cleanRes.forEach((am: any) => {
            if (am && am.id) {
              const existing = mergedMap.get(String(am.id));
              mergedMap.set(String(am.id), { ...existing, ...am });
            }
          });

          const finalMemories = Array.from(mergedMap.values());
          setMemories(finalMemories);
          localStorage.setItem('golden_mitra_memories', JSON.stringify(finalMemories));
        }
      }).catch(() => {});

    } catch (err) {
      console.error('Error loading cert & memory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unique Mitra accounts
  const uniqueMitraList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; jamaahCount: number }>();

    // 1. Extract from Jamaah Database
    jamaahList.forEach((j: any) => {
      const name = (j.mitraName || j.createdByName || '').trim();
      if (name) {
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: j.mitraId || j.createdBy || key,
            name: name,
            email: j.mitraEmail || '',
            jamaahCount: 1
          });
        } else {
          map.get(key)!.jamaahCount += 1;
        }
      }
    });

    // 2. Extract from Users props (roles mitra/agen/cabang)
    if (Array.isArray(users)) {
      users.forEach((u: any) => {
        if (u.role === 'mitra' || u.role === 'agen' || u.role === 'cabang') {
          const name = (u.fullName || u.namaLengkap || u.name || u.email || '').trim();
          if (name) {
            const key = name.toLowerCase();
            if (!map.has(key)) {
              map.set(key, {
                id: u.id || key,
                name: name,
                email: u.email || '',
                jamaahCount: 0
              });
            }
          }
        }
      });
    }

    return Array.from(map.values());
  }, [jamaahList, users]);

  // Sync jamaah database helper
  const syncJamaahDatabase = (updatedList: any[]) => {
    setJamaahList(updatedList);
    safeSetLocalStorage('mitra_jamaah_database', updatedList);
    try {
      const bc = new BroadcastChannel('mitra_catalog_realtime');
      bc.postMessage({ type: 'JAMAAH_UPDATED', timestamp: Date.now() });
      bc.close();
    } catch (e) {}
    window.dispatchEvent(new Event('mitra_jamaah_updated'));
    window.dispatchEvent(new Event('storage'));
    if (onRefresh) onRefresh();
  };

  // Sync memories database helper
  const syncMemoriesDatabase = (updatedMemories: any[]) => {
    const isDummyMemory = (m: any) => {
      if (!m) return true;
      const idStr = String(m.id || '');
      if (idStr.startsWith('10000000-0000-4000-8000-00000000000')) return true;
      const titleLower = String(m.title || '').toLowerCase();
      return (
        titleLower.includes('thawaf wada jemaah golden tour') || 
        titleLower.includes('ziarah raudhah & masjid nabawi') || 
        titleLower.includes('manasik umroh bersama pembimbing syariah')
      );
    };
    const cleanMemories = (updatedMemories || []).filter(m => !isDummyMemory(m));
    setMemories(cleanMemories);
    safeSetLocalStorage('golden_mitra_memories', cleanMemories);

    window.dispatchEvent(new Event('golden_memories_updated'));
    window.dispatchEvent(new Event('storage'));
    try {
      const bc = new BroadcastChannel('mitra_catalog_realtime');
      bc.postMessage({ type: 'MEMORIES_UPDATED', timestamp: Date.now() });
      bc.close();
    } catch (e) {}
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle Certificate Upload
  const handleUploadCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJamaahId) {
      toast.error('Silakan pilih calon jemaah terlebih dahulu.');
      return;
    }
    if (!certFile) {
      toast.error('Silakan unggah berkas sertifikat (PDF atau Gambar).');
      return;
    }

    setIsSubmittingCert(true);
    try {
      const base64Data = await fileToBase64(certFile);
      const targetJamaah = jamaahList.find(j => j.id === selectedJamaahId);
      const recipientName = certRecipientName.trim() || targetJamaah?.fullName || targetJamaah?.namaLengkap || 'Jemaah';
      const mitraName = targetJamaah?.mitraName || targetJamaah?.createdByName || certModalMitra;

      // 1. Post to backend server endpoint first to store file on disk and get short URL
      let serverCertUrl = '';
      try {
        const certRes = await api.post('/admin/certificates', {
          registrationId: selectedJamaahId,
          recipientName: recipientName,
          certificateUrl: base64Data
        });
        if (certRes && certRes.certificateUrl) {
          serverCertUrl = certRes.certificateUrl;
        }
      } catch (apiErr) {
        console.warn('API post certificate notice:', apiErr);
      }

      const finalCertUrl = serverCertUrl || base64Data;

      const fileObj = {
        name: certFile.name,
        size: (certFile.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        data: finalCertUrl,
        url: finalCertUrl,
        recipientName: recipientName,
        mitraName: mitraName
      };

      const updatedList = jamaahList.map(j => {
        if (j.id === selectedJamaahId) {
          return {
            ...j,
            docFiles: {
              ...(j.docFiles || {}),
              sertifikat: fileObj
            },
            isCertIssued: true,
            certificateUrl: finalCertUrl
          };
        }
        return j;
      });

      syncJamaahDatabase(updatedList);

      toast.success(`🎉 Sertifikat berhasil diterbitkan untuk ${recipientName}!`);
      setIsCertModalOpen(false);
      setSelectedJamaahId('');
      setCertRecipientName('');
      setCertFile(null);
    } catch (error: any) {
      console.error('Upload cert error:', error);
      toast.error('Gagal mengunggah sertifikat: ' + (error.message || 'Error'));
    } finally {
      setIsSubmittingCert(false);
    }
  };

  // Delete Certificate for a Jamaah
  const handleDeleteCert = (jamaahId: string, recipientName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Sertifikat Digital',
      message: `Apakah Anda yakin ingin menghapus sertifikat untuk ${recipientName}? Jamaah tidak akan bisa melihat sertifikat ini di portal Mitra.`,
      type: 'danger',
      onConfirm: () => {
        const updatedList = jamaahList.map(j => {
          if (j.id === jamaahId) {
            const newDocs = { ...(j.docFiles || {}) };
            delete newDocs.sertifikat;
            return {
              ...j,
              docFiles: newDocs,
              isCertIssued: false
            };
          }
          return j;
        });

        syncJamaahDatabase(updatedList);
        toast.success('Sertifikat berhasil dihapus.');
      }
    });
  };

  // Handle Memory Add Submit
  const handleAddMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTitle.trim()) {
      toast.error('Judul momen kenangan tidak boleh kosong.');
      return;
    }

    setIsSubmittingMemory(true);
    try {
      let finalImgUrl = memoryImageUrl.trim();
      if (memoryImageFile) {
        finalImgUrl = await fileToBase64(memoryImageFile);
      }

      if (!finalImgUrl) {
        finalImgUrl = 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800';
      }

      // Target Jamaah Info
      let targetJamaahName = '';
      if (memoryModalJamaah && memoryModalJamaah !== 'all') {
        const selJ = jamaahList.find(j => j.id === memoryModalJamaah);
        if (selJ) {
          targetJamaahName = selJ.fullName || selJ.namaLengkap || '';
        }
      }

      const newMemoryObj = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `10000000-0000-4000-8000-${Date.now().toString().padStart(12, '0')}`,
        title: memoryTitle.trim(),
        caption: memoryCaption.trim(),
        imageUrl: finalImgUrl,
        date: memoryDate,
        packageName: memoryTargetPaket || 'Semua Paket',
        targetMitraName: memoryModalMitra === 'all' ? 'Semua Mitra / Publik' : memoryModalMitra,
        targetJamaahId: memoryModalJamaah === 'all' ? '' : memoryModalJamaah,
        targetJamaahName: targetJamaahName,
        createdAt: new Date().toISOString()
      };

      const updatedMemories = [newMemoryObj, ...memories];
      syncMemoriesDatabase(updatedMemories);

      // API call
      api.post('/admin/memories', newMemoryObj).catch(() => {});

      toast.success('🎉 Momen kenangan perjalanan berhasil ditambahkan!');
      setIsMemoryModalOpen(false);
      setMemoryTitle('');
      setMemoryCaption('');
      setMemoryImageFile(null);
      setMemoryImageUrl('');
      setMemoryModalJamaah('all');
    } catch (err: any) {
      toast.error('Gagal menambahkan momen: ' + (err.message || 'Error'));
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  // Delete Memory
  const handleDeleteMemory = (memoryId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Momen Kenangan',
      message: 'Apakah Anda yakin ingin menghapus momen kenangan ini? Foto ini tidak akan lagi tampil di galeri mitra.',
      type: 'danger',
      onConfirm: () => {
        const updated = memories.filter(m => m.id !== memoryId);
        syncMemoriesDatabase(updated);

        api.delete(`/admin/memories/${memoryId}`).catch(() => {});
        toast.success('Momen kenangan berhasil dihapus.');
      }
    });
  };

  // Download Base64 File
  const handleDownloadFile = (dataUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(dataUrl, '_blank');
    }
  };

  // Jamaah list under selected Mitra filter
  const jamaahOfSelectedMitra = useMemo(() => {
    if (selectedFilterMitra === 'all') return jamaahList;
    return jamaahList.filter(j => {
      const mName = (j.mitraName || j.createdByName || '').toLowerCase();
      return mName.includes(selectedFilterMitra.toLowerCase());
    });
  }, [jamaahList, selectedFilterMitra]);

  // Filtered Jamaah for Cert Modal
  const certModalJamaahOptions = useMemo(() => {
    if (certModalMitra === 'all') return jamaahList;
    return jamaahList.filter(j => {
      const mName = (j.mitraName || j.createdByName || '').toLowerCase();
      return mName.includes(certModalMitra.toLowerCase());
    });
  }, [jamaahList, certModalMitra]);

  // Filtered Jamaah for Memory Modal
  const memoryModalJamaahOptions = useMemo(() => {
    if (memoryModalMitra === 'all') return jamaahList;
    return jamaahList.filter(j => {
      const mName = (j.mitraName || j.createdByName || '').toLowerCase();
      return mName.includes(memoryModalMitra.toLowerCase());
    });
  }, [jamaahList, memoryModalMitra]);

  // Filtered Jamaah with Certificate
  const jamaahWithCertificates = jamaahList.filter(j => {
    const cert = j.docFiles?.sertifikat;
    if (!cert) return false;

    // Mitra Filter
    if (selectedFilterMitra !== 'all') {
      const mName = (j.mitraName || j.createdByName || '').toLowerCase();
      if (!mName.includes(selectedFilterMitra.toLowerCase())) return false;
    }

    // Jamaah Filter
    if (selectedFilterJamaah !== 'all') {
      if (j.id !== selectedFilterJamaah) return false;
    }

    if (!certSearch) return true;
    const q = certSearch.toLowerCase();
    const name = getJamaahName(j).toLowerCase();
    const phone = getJamaahPhone(j).toLowerCase();
    const recipient = (cert.recipientName || '').toLowerCase();
    const mitra = (j.mitraName || j.createdByName || '').toLowerCase();
    const pkg = (j.paketName || j.packageName || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || recipient.includes(q) || mitra.includes(q) || pkg.includes(q);
  });

  // Filtered Memories
  const filteredMemories = memories.filter(m => {
    // Mitra Filter
    if (selectedFilterMitra !== 'all') {
      const targetM = (m.targetMitraName || '').toLowerCase();
      if (targetM && targetM !== 'semua mitra / publik' && !targetM.includes(selectedFilterMitra.toLowerCase())) {
        return false;
      }
    }

    // Jamaah Filter
    if (selectedFilterJamaah !== 'all') {
      const targetJ = jamaahList.find(j => j.id === selectedFilterJamaah);
      const targetJName = getJamaahName(targetJ).toLowerCase();
      if (m.targetJamaahId) {
        if (m.targetJamaahId !== selectedFilterJamaah) return false;
      } else if (targetJName && m.targetJamaahName) {
        if (!m.targetJamaahName.toLowerCase().includes(targetJName)) return false;
      }
    }

    if (!memorySearch) return true;
    const q = memorySearch.toLowerCase();
    return (m.title || '').toLowerCase().includes(q) || 
           (m.caption || '').toLowerCase().includes(q) || 
           (m.packageName || '').toLowerCase().includes(q) ||
           (m.targetMitraName || '').toLowerCase().includes(q) ||
           (m.targetJamaahName || '').toLowerCase().includes(q);
  });

  // Selected Jamaah Preview in Cert Modal
  const selectedJamaahPreview = useMemo(() => {
    return jamaahList.find(j => j.id === selectedJamaahId);
  }, [jamaahList, selectedJamaahId]);

  // Helper to open Cert Modal pre-filled for a specific Jamaah
  const openCertModalForJamaah = (jamaah: any) => {
    const mName = jamaah.mitraName || jamaah.createdByName || 'all';
    setCertModalMitra(mName);
    setSelectedJamaahId(jamaah.id);
    setCertRecipientName(getJamaahName(jamaah));
    setIsCertModalOpen(true);
  };

  // Helper to open Memory Modal pre-filled for a specific Jamaah
  const openMemoryModalForJamaah = (jamaah: any) => {
    const mName = jamaah.mitraName || jamaah.createdByName || 'all';
    setMemoryModalMitra(mName);
    setMemoryModalJamaah(jamaah.id);
    setMemoryTargetPaket(jamaah.paketName || jamaah.packageName || 'Semua Paket');
    setIsMemoryModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" /> MANAJEMEN PORTAL MITRA
            </div>
            <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-white">
              Sertifikat & Momen Kenangan Jemaah
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed font-medium">
              Unggah e-sertifikat ibadah resmi dan bagikan foto momen kenangan perjalanan suci bagi calon jemaah terdaftar melalui Agen Mitra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCertModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-slate-950" />
              <span>Unggah Sertifikat</span>
            </button>
            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Tambah Momen</span>
            </button>
          </div>
        </div>

        {/* Tab Switching Buttons */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t border-emerald-800/60">
          <button
            onClick={() => setActiveSubTab('sertifikat')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'sertifikat'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/80'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Sertifikat Digital Jemaah ({jamaahWithCertificates.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('kenangan')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'kenangan'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/80'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galeri Momen Kenangan ({memories.length})</span>
          </button>
        </div>
      </div>

      {/* MITRA SELECTION & JEMAAH FILTER NAVIGATION BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm font-playfair">
              <Building className="w-4 h-4 text-amber-500" />
              <span>Pilih Mitra Perwakilan & Penyaringan Jemaah</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Filter data sertifikat dan momen berdasarkan Mitra Perwakilan dan Calon Jemaah spesifik binaan mitra tersebut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Mitra */}
            <div className="relative min-w-[210px]">
              <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700" />
              <select
                value={selectedFilterMitra}
                onChange={e => {
                  setSelectedFilterMitra(e.target.value);
                  setSelectedFilterJamaah('all');
                }}
                className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">-- Semua Mitra ({uniqueMitraList.length} Mitra) --</option>
                {uniqueMitraList.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.jamaahCount} Jemaah)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Jamaah Specific */}
            <div className="relative min-w-[210px]">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
              <select
                value={selectedFilterJamaah}
                onChange={e => setSelectedFilterJamaah(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-amber-300 text-xs font-bold text-slate-800 bg-amber-50/50 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">-- Semua Jemaah Mitra ({jamaahOfSelectedMitra.length} Jemaah) --</option>
                {jamaahOfSelectedMitra.map(j => {
                  const name = getJamaahName(j);
                  const phone = getJamaahPhone(j);
                  const code = getJamaahId(j);
                  return (
                    <option key={j.id} value={j.id}>
                      {name} (ID: {code}) - {phone !== '-' ? `WA: ${phone}` : `NIK: ${j.nik || '-'}`} ({j.paketName || j.packageName || 'Umroh'})
                    </option>
                  );
                })}
              </select>
            </div>

            {onNavigateTab && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('mitra_calon_jamaah')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-900 text-amber-300 hover:bg-emerald-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Buka Halaman Calon Jemaah Binaan Mitra"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Data Jemaah</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('daftar_mitra')}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Kelola & Verifikasi Akun Mitra Portal Admin"
                >
                  <Building className="w-4 h-4 text-slate-500" />
                  <span>Akun Mitra</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Filter Summary Bar */}
        {(selectedFilterMitra !== 'all' || selectedFilterJamaah !== 'all') && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                  <span>Filter Aktif:</span>
                  {selectedFilterMitra !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 text-amber-300 font-bold text-xs">
                      Mitra: {selectedFilterMitra}
                    </span>
                  )}
                  {selectedFilterJamaah !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                      Jemaah: {getJamaahName(jamaahList.find(j => j.id === selectedFilterJamaah))} (WA: {getJamaahPhone(jamaahList.find(j => j.id === selectedFilterJamaah))})
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  Menampilkan {jamaahOfSelectedMitra.length} Jemaah binaan Mitra ini
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCertModalMitra(selectedFilterMitra);
                  if (selectedFilterJamaah !== 'all') setSelectedJamaahId(selectedFilterJamaah);
                  setIsCertModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-[11px] hover:bg-emerald-800 transition-all cursor-pointer"
              >
                + Upload Sertifikat
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemoryModalMitra(selectedFilterMitra);
                  if (selectedFilterJamaah !== 'all') setMemoryModalJamaah(selectedFilterJamaah);
                  setIsMemoryModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 border border-slate-300 font-bold text-[11px] hover:bg-slate-50 transition-all cursor-pointer"
              >
                + Tambah Momen
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilterMitra('all');
                  setSelectedFilterJamaah('all');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                title="Reset Semua Filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* DAFTAR JEMAAH MITRA CARDS SELECTION GRID */}
        {selectedFilterMitra !== 'all' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                Daftar Calon Jemaah Binaan Mitra ({selectedFilterMitra}):
              </h4>
              <span className="text-[10px] font-medium text-slate-500">
                Pilih Jemaah untuk upload sertifikat / momen secara langsung
              </span>
            </div>

            {jamaahOfSelectedMitra.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Belum ada jemaah terdaftar di bawah mitra ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {jamaahOfSelectedMitra.map(j => {
                  const jName = getJamaahName(j);
                  const jPhone = getJamaahPhone(j);
                  const jCode = getJamaahId(j);
                  const isSelected = selectedFilterJamaah === j.id;
                  const hasCert = !!j.docFiles?.sertifikat;

                  return (
                    <div
                      key={j.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/40' 
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{jName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold border border-slate-200">
                              ID: {jCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium flex-wrap">
                            <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <Phone className="w-2.5 h-2.5 text-emerald-700" /> {jPhone}
                            </span>
                            <span className="text-slate-500 font-mono">NIK: {j.nik || '-'}</span>
                          </div>
                          <p className="text-[10px] text-emerald-900 font-bold line-clamp-1">
                            {j.packageName || j.paketName || 'Umroh Reguler'}
                          </p>
                        </div>
                        {hasCert ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-300 shrink-0">
                            ✓ Sertifikat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300 shrink-0">
                            Belum Ada
                          </span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedFilterJamaah(isSelected ? 'all' : j.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-500 text-slate-950 shadow-sm' 
                              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ Filtered' : 'Filter Jemaah'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openCertModalForJamaah(j)}
                            className="px-2 py-1 rounded-lg bg-emerald-900 text-amber-300 hover:bg-emerald-800 font-bold transition-all cursor-pointer shadow-sm"
                            title={`Upload Sertifikat untuk ${jName}`}
                          >
                            + Sertifikat
                          </button>
                          <button
                            type="button"
                            onClick={() => openMemoryModalForJamaah(j)}
                            className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
                            title={`Tambah Momen Foto untuk ${jName}`}
                          >
                            + Momen
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 1: MANAJEMEN SERTIFIKAT */}
      {activeSubTab === 'sertifikat' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-playfair font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Daftar Sertifikat Terbit untuk Jemaah Mitra
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sertifikat ini langsung muncul di panel Mitra pada menu "Sertifikat".
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama jemaah / mitra..."
                value={certSearch}
                onChange={e => setCertSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
              />
            </div>
          </div>

          {jamaahWithCertificates.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-playfair font-bold text-slate-800 text-base">Belum Ada Sertifikat Diterbitkan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Klik tombol "Unggah Sertifikat" di atas untuk memilih jemaah dari Mitra dan mengunggah berkas sertifikat digital (.pdf atau .png/.jpg).
                </p>
              </div>
              <button
                onClick={() => setIsCertModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 hover:bg-emerald-800 font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Unggah Sertifikat Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-3 px-4">Nama Jemaah & Penerima</th>
                    <th className="pb-3 px-4">Mitra Perwakilan</th>
                    <th className="pb-3 px-4">Paket Ibadah</th>
                    <th className="pb-3 px-4">Berkas Sertifikat</th>
                    <th className="pb-3 px-4">Tanggal Terbit</th>
                    <th className="pb-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {jamaahWithCertificates.map(jamaah => {
                    const cert = jamaah.docFiles.sertifikat;
                    const recipientName = cert.recipientName || getJamaahName(jamaah);
                    const jPhone = getJamaahPhone(jamaah);
                    const jCode = getJamaahId(jamaah);
                    return (
                      <tr key={jamaah.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{recipientName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold border border-slate-200">
                              ID: {jCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            {jPhone !== '-' && (
                              <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <Phone className="w-2.5 h-2.5 text-emerald-700" /> {jPhone}
                              </span>
                            )}
                            <span className="font-mono">NIK: {jamaah.nik || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            <User className="w-3 h-3 text-emerald-600" />
                            {jamaah.mitraName || jamaah.createdByName || 'Mitra General'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {jamaah.paketName || jamaah.packageName || 'Paket Umroh Reguler'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 truncate max-w-[160px]" title={cert.name}>{cert.name}</div>
                              <div className="text-[10px] text-slate-400">{cert.size || 'PDF'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {cert.uploadedAt || 'Terbit'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadFile(cert.data, cert.name || `Sertifikat_${recipientName}.pdf`)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh PDF
                            </button>
                            <button
                              onClick={() => handleDeleteCert(jamaah.id, recipientName)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Hapus Sertifikat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: GALERI MOMEN KENANGAN */}
      {activeSubTab === 'kenangan' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-playfair font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-500" />
                Galeri Momen Kenangan Perjalanan Ibadah
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Foto-foto momen kegiatan ibadah yang diunggah akan otomatis dapat dilihat oleh Mitra di Portal Mitra.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari momen, mitra, jemaah..."
                value={memorySearch}
                onChange={e => setMemorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
              />
            </div>
          </div>

          {filteredMemories.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-playfair font-bold text-slate-800 text-base">Belum Ada Momen Kenangan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Klik "Tambah Momen" untuk menambahkan dokumentasi foto perjalanan jemaah untuk mitra spesifik atau seluruh mitra.
                </p>
              </div>
              <button
                onClick={() => setIsMemoryModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 hover:bg-emerald-800 font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" /> Tambah Momen Kenangan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMemories.map(item => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-slate-900 aspect-square shadow-sm border border-slate-200 flex flex-col justify-end">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
                  
                  <button
                    onClick={() => handleDeleteMemory(item.id)}
                    className="absolute top-3 right-3 p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-all shadow-md cursor-pointer z-10"
                    title="Hapus Momen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="relative z-10 p-4 space-y-1.5 text-white">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-wider border border-amber-400/40">
                        {item.packageName || 'Perjalanan Umroh'}
                      </span>
                      {item.targetMitraName && item.targetMitraName !== 'Semua Mitra / Publik' && (
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                          Mitra: {item.targetMitraName}
                        </span>
                      )}
                      {item.targetJamaahName && (
                        <span className="inline-block px-2 py-0.5 rounded bg-teal-500/30 text-teal-200 text-[9px] font-bold border border-teal-500/40">
                          Jemaah: {item.targetJamaahName}
                        </span>
                      )}
                    </div>
                    <h4 className="font-playfair font-bold text-sm text-white leading-snug line-clamp-2">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2 font-medium leading-relaxed">{item.caption || 'Tidak ada deskripsi'}</p>
                    <p className="text-[10px] text-amber-400 font-mono font-bold pt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: UNGGAH SERTIFIKAT */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative shrink-0">
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30 mb-2">
                <Award className="w-3 h-3 text-amber-400" /> FORMULIR SERTIFIKAT
              </div>
              <h3 className="text-xl font-playfair font-bold text-white">Unggah Sertifikat Jemaah Mitra</h3>
              <p className="text-xs text-emerald-100/80 mt-1">Pilih agen mitra dan calon jemaah terdaftar untuk menerbitkan e-sertifikat.</p>
            </div>

            <form onSubmit={handleUploadCertSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* STEP 1: PILIH MITRA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Pilih Mitra Perwakilan</span>
                  <span className="text-[10px] text-emerald-800 font-bold lowercase">Filter otomatis jemaah</span>
                </label>
                <select
                  value={certModalMitra}
                  onChange={e => {
                    setCertModalMitra(e.target.value);
                    setSelectedJamaahId('');
                    setCertRecipientName('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-slate-50"
                >
                  <option value="all">-- Tampilkan Semua Mitra ({jamaahList.length} Jemaah) --</option>
                  {uniqueMitraList.map(m => (
                    <option key={m.name} value={m.name}>
                      Mitra: {m.name} ({m.jamaahCount} Jemaah Terdaftar)
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 2: PILIH JAMAAH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Pilih Calon Jemaah <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedJamaahId}
                  onChange={e => {
                    setSelectedJamaahId(e.target.value);
                    const sel = jamaahList.find(j => j.id === e.target.value);
                    if (sel) {
                      setCertRecipientName(getJamaahName(sel));
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Jemaah ({certModalJamaahOptions.length} Tersedia) --</option>
                  {certModalJamaahOptions.map(j => {
                    const name = getJamaahName(j);
                    const phone = getJamaahPhone(j);
                    const code = getJamaahId(j);
                    return (
                      <option key={j.id} value={j.id}>
                        {name} (ID: {code}) - WA: {phone} - NIK: {j.nik || '-'} (Mitra: {j.mitraName || j.createdByName || 'General'})
                      </option>
                    );
                  })}
                </select>

                {/* Selected Jamaah Info Box */}
                {selectedJamaahPreview && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in duration-200">
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-950 text-xs">
                        {getJamaahName(selectedJamaahPreview)} <span className="font-mono text-[10px] text-emerald-700 font-bold">(ID: {getJamaahId(selectedJamaahPreview)})</span>
                      </p>
                      <p className="text-[10px] text-emerald-800">
                        No. WA / Telp: <strong>{getJamaahPhone(selectedJamaahPreview)}</strong> | NIK: {selectedJamaahPreview.nik || '-'}
                      </p>
                      <p className="text-[10px] text-emerald-800">
                        Mitra Binaan: <strong>{selectedJamaahPreview.mitraName || selectedJamaahPreview.createdByName || 'General'}</strong>
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        Paket: {selectedJamaahPreview.paketName || selectedJamaahPreview.packageName || 'Paket Umroh Reguler'}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>
                )}
              </div>

              {/* STEP 3: NAMA TERTERA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  3. Nama Tertera Pada Sertifikat
                </label>
                <input
                  type="text"
                  placeholder="Nama Lengkap Beserta Gelar (Contoh: H. Ahmad Subagyo, S.E.)"
                  value={certRecipientName}
                  onChange={e => setCertRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              {/* STEP 4: BERKAS FILE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Berkas File Sertifikat (PDF / Gambar) <span className="text-rose-500">*</span>
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer text-center group">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setCertFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    required
                  />
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-all flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  {certFile ? (
                    <div>
                      <span className="text-xs font-bold text-emerald-900">{certFile.name}</span>
                      <span className="block text-[10px] text-slate-400">{(certFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-emerald-900 block">Klik untuk pilih file PDF / Gambar</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Maksimal ukuran file 10MB</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCert ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Award className="w-4 h-4 text-amber-400" />}
                  <span>{isSubmittingCert ? 'Mengunggah...' : 'Terbitkan Sertifikat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MOMEN KENANGAN */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative shrink-0">
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30 mb-2">
                <ImageIcon className="w-3 h-3 text-amber-400" /> GALERI KENANGAN
              </div>
              <h3 className="text-xl font-playfair font-bold text-white">Tambah Momen Kenangan Perjalanan</h3>
              <p className="text-xs text-emerald-100/80 mt-1">Unggah foto kegiatan ibadah untuk mitra spesifik atau seluruh publik mitra.</p>
            </div>

            <form onSubmit={handleAddMemorySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* TARGET MITRA SELECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Target Mitra Perwakilan (Visibilitas Portal)
                </label>
                <select
                  value={memoryModalMitra}
                  onChange={e => {
                    setMemoryModalMitra(e.target.value);
                    setMemoryModalJamaah('all');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-slate-50"
                >
                  <option value="all">Semua Mitra / Publik (Tampil di Seluruh Portal Mitra)</option>
                  {uniqueMitraList.map(m => (
                    <option key={m.name} value={m.name}>
                      Khusus Mitra: {m.name} ({m.jamaahCount} Jemaah)
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET JAMAAH SELECTION (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>2. Target Calon Jemaah Spesifik (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kosongkan jika untuk semua jemaah</span>
                </label>
                <select
                  value={memoryModalJamaah}
                  onChange={e => {
                    setMemoryModalJamaah(e.target.value);
                    const selJ = jamaahList.find(j => j.id === e.target.value);
                    if (selJ) {
                      setMemoryTargetPaket(selJ.paketName || selJ.packageName || 'Paket Umroh');
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50 cursor-pointer"
                >
                  <option value="all">-- Semua Jemaah (Rombongan) --</option>
                  {memoryModalJamaahOptions.map(j => {
                    const name = getJamaahName(j);
                    const phone = getJamaahPhone(j);
                    const code = getJamaahId(j);
                    return (
                      <option key={j.id} value={j.id}>
                        {name} (ID: {code}) - WA: {phone} (Paket: {j.paketName || j.packageName || '-'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Judul Momen Kenangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ziarah Raudhah & Masjid Nabawi"
                  value={memoryTitle}
                  onChange={e => setMemoryTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  4. Kategori Paket / Rombongan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Paket Umroh Syawal / All Paket"
                  value={memoryTargetPaket}
                  onChange={e => setMemoryTargetPaket(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  5. Tanggal Kejadian
                </label>
                <input
                  type="date"
                  value={memoryDate}
                  onChange={e => setMemoryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  6. Unggah Foto Momen <span className="text-rose-500">*</span>
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-all cursor-pointer text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setMemoryImageFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-all flex items-center justify-center mb-1">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  {memoryImageFile ? (
                    <span className="text-xs font-bold text-emerald-900">{memoryImageFile.name}</span>
                  ) : (
                    <span className="text-xs font-black text-slate-700 group-hover:text-emerald-900">Pilih berkas foto dari perangkat</span>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  7. Deskripsi / Catatan Kenangan
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan cerita singkat atau kesan pesan untuk momen ini..."
                  value={memoryCaption}
                  onChange={e => setMemoryCaption(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMemory}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingMemory ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Plus className="w-4 h-4 text-amber-400" />}
                  <span>{isSubmittingMemory ? 'Simpan...' : 'Simpan Momen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

    </div>
  );
}
