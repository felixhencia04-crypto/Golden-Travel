import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, CheckCircle2, XCircle, Clock, 
  ChevronRight, FileText, Phone, Mail, Building2, CreditCard,
  ExternalLink, Eye, AlertCircle, MoreVertical, Check, X,
  Download, ArrowLeft, ShieldCheck, MapPin, FileDown, Archive, Loader2,
  Receipt, Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { exportMitraToPdf, exportMitraDocumentsZip } from '../utils/mitraExportUtils';
import { toast } from 'sonner';

interface MitraUser {
  id: string;
  name: string;
  email: string;
  noWa: string;
  statusAkun: 'incomplete_profile' | 'pending_verification' | 'active' | 'rejected';
  createdAt: string;
  profile?: {
    nik: string;
    tempatLahir: string;
    tanggalLahir: string;
    alamatLengkap: string;
    namaBank: string;
    noRekening: string;
    namaPemilikRekening: string;
    namaLengkap?: string;
    npwp?: string;
    jenisKelamin?: string;
    statusPerkawinan?: string;
    pekerjaan?: string;
    provinsi?: string;
    kota?: string;
    kecamatan?: string;
    kodePos?: string;
    reviewNotes?: string;
    buktiTransfer?: string;
  };
  documents?: {
    id: string;
    documentType: 'foto_ktp' | 'selfie_ktp' | 'npwp' | 'buku_tabungan' | 'bukti_transfer';
    fileUrl: string;
    status: 'pending' | 'verified' | 'rejected';
  }[];
}

interface AdminMitraManagerProps {
  initialFilter?: string;
}

const AdminMitraManager = ({ initialFilter = 'all' }: AdminMitraManagerProps) => {
  const [mitraList, setMitraList] = useState<MitraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter);
  const [selectedMitra, setSelectedMitra] = useState<MitraUser | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'identitas' | 'lampiran' | 'rekening' | 'bukti_transfer'>('identitas');
  const [isVerifying, setIsVerifying] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [deletingMitra, setDeletingMitra] = useState<MitraUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMitra = async () => {
    if (!deletingMitra) return;
    const target = deletingMitra;
    setDeletingMitra(null);
    setIsDeleting(true);

    // Optimistically update list state
    setMitraList(prev => prev.filter(m => m.id !== target.id && (m.email || '').toLowerCase() !== (target.email || '').toLowerCase()));

    try {
      await api.delete(`/admin/mitra/${target.id}`);
      toast.success(`Mitra ${target.name} berhasil dihapus.`);

      // Clean up local storage cache if present
      try {
        const emailClean = (target.email || '').toLowerCase().trim();
        const targetIdClean = (target.id || '').trim();
        const targetNameClean = (target.name || '').toLowerCase().trim();

        const stored = localStorage.getItem('mitra_jamaah_database');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const updated = list.filter((item: any) => {
              const itemEmail = (item.mitraEmail || item.email || item.ordererEmail || '').toLowerCase().trim();
              const itemId = (item.mitraId || item.userId || item.id || '').trim();
              const itemName = (item.mitraName || item.ordererName || '').toLowerCase().trim();

              const isMatchId = targetIdClean && itemId === targetIdClean;
              const isMatchEmail = emailClean && itemEmail === emailClean;
              const isMatchName = targetNameClean && itemName === targetNameClean;

              return !isMatchId && !isMatchEmail && !isMatchName;
            });
            localStorage.setItem('mitra_jamaah_database', JSON.stringify(updated));
          }
        }

        // Clean up any scoped pax keys for this mitra
        if (targetIdClean) localStorage.removeItem(`mitra_saved_pax_list_${targetIdClean}`);
        if (emailClean) localStorage.removeItem(`mitra_saved_pax_list_${emailClean}`);

        // Broadcast events so other tabs/components (e.g. AdminMitraJamaahManager) update immediately
        window.dispatchEvent(new CustomEvent('mitra_deleted', { detail: { id: target.id, email: target.email } }));
        window.dispatchEvent(new Event('mitra_jamaah_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.warn('LocalStorage cleanup notice:', e);
      }

      if (selectedMitra && (selectedMitra.id === target.id || (selectedMitra.email && selectedMitra.email === target.email))) {
        setSelectedMitra(null);
      }
      await fetchMitraList();
    } catch (error: any) {
      console.error('Error deleting mitra:', error);
      const errMsg = error?.response?.data?.error || error?.message || 'Gagal menghapus data mitra.';
      toast.error(errMsg);
      await fetchMitraList();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedMitra) return;
    try {
      setIsExportingPdf(true);
      exportMitraToPdf(selectedMitra);
      setExportSuccessMessage('Dokumen PDF Data Identitas, Legalitas & Rekening Komisi berhasil di-download!');
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Gagal membuat file PDF. Silakan coba lagi.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!selectedMitra) return;
    try {
      setIsExportingZip(true);
      const count = await exportMitraDocumentsZip(selectedMitra);
      if (count === 0) {
        toast.info('Belum ada file lampiran yang diupload oleh mitra.');
      } else {
        setExportSuccessMessage(`Arsip ZIP berisi ${count} berkas lampiran berhasil di-download!`);
        setTimeout(() => setExportSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('ZIP export error:', err);
      toast.error('Gagal membuat file ZIP berkas lampiran.');
    } finally {
      setIsExportingZip(false);
    }
  };

  useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    fetchMitraList();
  }, []);

  const fetchMitraList = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/mitra/list');
      setMitraList(data);
    } catch (error) {
      console.error('Error fetching mitra list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status: 'active' | 'rejected') => {
    if (!selectedMitra) return;
    try {
      setIsVerifying(true);
      await api.post('/admin/mitra/verify', {
        userId: selectedMitra.id,
        status,
        notes: reviewNotes
      });
      fetchMitraList();
      setSelectedMitra(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error verifying mitra:', error);
      toast.error('Gagal melakukan verifikasi');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredList = mitraList.filter(mitra => {
    const nameMatch = mitra.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const emailMatch = mitra.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesSearch = nameMatch || emailMatch;
    const matchesStatus = filterStatus === 'all' || mitra.statusAkun === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Aktif</span>
          </div>
        );
      case 'pending_verification':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Menunggu</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Ditolak</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Belum Lengkap</span>
          </div>
        );
    }
  };

  if (loading && mitraList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Memuat Data Mitra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-emerald-900">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-playfair font-black tracking-tight">Manajemen Mitra</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">
            Sistem verifikasi terpusat untuk pendaftaran mitra perwakilan Golden Travel. Pastikan data legalitas valid sebelum aktivasi.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verifikasi Masuk</div>
            <div className="text-2xl font-black text-amber-600">
              {mitraList.filter(m => m.statusAkun === 'pending_verification').length}
            </div>
          </div>
          <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mitra Aktif</div>
            <div className="text-2xl font-black text-emerald-900">
              {mitraList.filter(m => m.statusAkun === 'active').length}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-900 transition-colors" />
          <input 
            type="text"
            placeholder="Cari nama, email, atau ID mitra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none font-medium shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent outline-none font-bold text-xs uppercase tracking-widest text-slate-600 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending_verification">Menunggu</option>
            <option value="active">Aktif</option>
            <option value="rejected">Ditolak</option>
            <option value="incomplete_profile">Incomplete</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Mitra</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Informasi Kontak</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Akun</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registrasi</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((mitra) => (
                <tr key={mitra.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-800 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                        {mitra.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg">{mitra.name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Partner ID: {mitra.id.substring(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                        <Mail className="w-4 h-4 text-slate-300" /> {mitra.email}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                        <Phone className="w-4 h-4 text-slate-300" /> {mitra.noWa}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {getStatusBadge(mitra.statusAkun)}
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-xs font-bold text-slate-900">
                      {new Date(mitra.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Terdaftar</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => {
                          setSelectedMitra(mitra);
                          setActiveSubTab('identitas');
                          setReviewNotes(mitra.profile?.reviewNotes || '');
                        }}
                        className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-[0.1em] hover:bg-emerald-900 hover:text-white hover:shadow-xl hover:shadow-emerald-900/20 transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        Buka Profil <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingMitra(mitra)}
                        className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all hover:shadow-lg hover:shadow-rose-600/20 flex items-center justify-center border border-rose-100"
                        title="Hapus Mitra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300 mb-6">
                      <Users className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-playfair font-black text-slate-900 mb-2">Data Tidak Ditemukan</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">
                      Coba sesuaikan filter atau kata kunci pencarian Anda untuk menemukan data mitra yang dimaksud.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Verification Modal */}
      <AnimatePresence>
        {selectedMitra && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedMitra(null)}></div>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-slate-50 w-full max-w-6xl h-full max-h-[92vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-10 pt-8 pb-4 bg-white border-b border-slate-100 flex flex-col gap-6 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-900 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-emerald-900/20">
                      {selectedMitra.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-playfair font-black text-slate-900">{selectedMitra.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(selectedMitra.statusAkun)}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrasi ID: {selectedMitra.id}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMitra(null)}
                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                {/* Submenu Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1 overflow-x-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('identitas')}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                      activeSubTab === 'identitas'
                        ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Data Identitas & Legalitas
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('lampiran')}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                      activeSubTab === 'lampiran'
                        ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Berkas Lampiran
                    {selectedMitra.documents && selectedMitra.documents.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        activeSubTab === 'lampiran' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedMitra.documents.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('rekening')}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                      activeSubTab === 'rekening'
                        ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Rekening Komisi
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('bukti_transfer')}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                      activeSubTab === 'bukti_transfer'
                        ? 'bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 ring-2 ring-amber-300/50'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-amber-500" /> Bukti Transfer Pendaftaran
                    {selectedMitra.documents?.some(d => d.documentType === 'bukti_transfer' && d.fileUrl) || selectedMitra.profile?.buktiTransfer ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">Ada</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-700">Belum Ada</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                {/* Export Success Notification Banner */}
                {exportSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}

                {/* SUBTAB 1: Data Identitas & Legalitas */}
                {activeSubTab === 'identitas' && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    {/* Action Export Header for Identitas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                          <FileDown className="w-4 h-4" /> Ekspor Resmi Dokumen Identitas
                        </div>
                        <div className="text-base font-bold text-white">Download PDF Data Identitas & Legalitas Mitra</div>
                        <p className="text-xs text-slate-300 font-medium">Termasuk ringkasan biodata KTP, NPWP, alamat domisili, dan rekening pembayaran komisi.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isExportingPdf}
                        className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        Download PDF Identitas & Rekening
                      </button>
                    </div>

                    {/* Identity Info */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-white">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Data Identitas & Legalitas Mitra</h3>
                          <p className="text-xs text-slate-400 font-medium">Informasi biodata diri mitra sesuai dokumen resmi KTP & NPWP</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm md:col-span-2 lg:col-span-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap (Sesuai KTP)</div>
                          <div className="text-lg font-bold text-slate-900">{selectedMitra.profile?.namaLengkap || selectedMitra.name || 'Belum diisi'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor Induk Kependudukan (NIK)</div>
                          <div className="text-base font-mono font-bold text-slate-900 tracking-wider">{selectedMitra.profile?.nik || 'Belum diisi'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor Pokok Wajib Pajak (NPWP)</div>
                          <div className="text-base font-mono font-bold text-slate-900 tracking-wider">{selectedMitra.profile?.npwp || 'Belum diisi'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tempat & Tanggal Lahir</div>
                          <div className="text-base font-bold text-slate-900">
                            {selectedMitra.profile?.tempatLahir || '-'}, {selectedMitra.profile?.tanggalLahir || '-'}
                          </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.jenisKelamin || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status Perkawinan</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.statusPerkawinan || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pekerjaan Saat Ini</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.pekerjaan || '-'}</div>
                        </div>
                      </div>
                    </section>

                    {/* Location Info */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-white">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Alamat & Lokasi Domisili</h3>
                          <p className="text-xs text-slate-400 font-medium">Informasi domisili dan lokasi tempat tinggal mitra</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Provinsi</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.provinsi || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kota / Kabupaten</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.kota || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kecamatan</div>
                          <div className="text-base font-bold text-slate-900">{selectedMitra.profile?.kecamatan || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kode Pos</div>
                          <div className="text-base font-mono font-bold text-slate-900">{selectedMitra.profile?.kodePos || '-'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm md:col-span-2 lg:col-span-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap (Sesuai KTP)</div>
                          <div className="text-base font-bold text-slate-900 leading-relaxed">
                            {selectedMitra.profile?.alamatLengkap || 'Alamat belum dilengkapi'}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* SUBTAB 2: Berkas Lampiran */}
                {activeSubTab === 'lampiran' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Action Export Header for Berkas Lampiran */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-emerald-900 text-white shadow-xl shadow-slate-950/20 border border-emerald-800/40">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                          <Archive className="w-4 h-4" /> Export Arsip Dokumen Pendukung
                        </div>
                        <div className="text-base font-bold text-white">Download Semua Berkas Lampiran (ZIP)</div>
                        <p className="text-xs text-slate-300 font-medium">Unduh seluruh foto dokumen fisik (KTP, Selfie KTP, NPWP, Buku Tabungan) dalam 1 paket ZIP.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={isExportingPdf}
                          className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <FileDown className="w-4 h-4 text-emerald-300" /> Ringkasan PDF
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={isExportingZip}
                          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          {isExportingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                          Download ZIP Berkas
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2 pt-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-white">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Berkas Lampiran & Dokumen Legalitas</h3>
                        <p className="text-xs text-slate-400 font-medium">Dokumen fisik pendukung verifikasi identitas akun mitra</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { id: 'foto_ktp', label: 'Foto KTP Asli', description: 'Kartu Tanda Penduduk Republik Indonesia' },
                        { id: 'selfie_ktp', label: 'Selfie dengan KTP', description: 'Foto verifikasi wajah memegang KTP asli' },
                        { id: 'npwp', label: 'Kartu NPWP', description: 'Nomor Pokok Wajib Pajak' },
                        { id: 'buku_tabungan', label: 'Halaman Depan Buku Tabungan', description: 'Menampilkan nomor rekening & nama pemilik' },
                        { id: 'bukti_transfer', label: 'Bukti Transfer Pendaftaran Administrasi', description: 'Resi transfer biaya administrasi pendaftaran kemitraan' }
                      ].map((type) => {
                        const doc = selectedMitra.documents?.find(d => d.documentType === type.id)
                          || (type.id === 'bukti_transfer' && selectedMitra.profile?.buktiTransfer ? {
                               id: 'prof-bukti',
                               documentType: 'bukti_transfer',
                               fileUrl: selectedMitra.profile.buktiTransfer,
                               status: 'pending'
                             } : null);
                        return (
                          <div key={type.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  {type.label}
                                  {doc?.status === 'verified' && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">Verified</span>}
                                  {doc?.status === 'pending' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase">Pending</span>}
                                  {doc?.status === 'rejected' && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase">Rejected</span>}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium">{type.description}</p>
                              </div>
                              {doc?.fileUrl && (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={doc.fileUrl}
                                    download={`${type.id}_${(selectedMitra.name || 'mitra').replace(/\s+/g, '_')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                                    title="Download Gambar Ini"
                                  >
                                    <Download className="w-3 h-3 text-emerald-800" />
                                  </a>
                                  <button 
                                    onClick={() => setViewingImage(doc.fileUrl)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                                  >
                                    Lihat Full <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="relative aspect-video rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden group">
                              {doc?.fileUrl ? (
                                <>
                                  <img 
                                    src={doc.fileUrl} 
                                    alt={type.label} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button 
                                      onClick={() => setViewingImage(doc.fileUrl)}
                                      className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4" /> Perbesar
                                    </button>
                                    <a 
                                      href={doc.fileUrl}
                                      download={`${type.id}_${(selectedMitra.name || 'mitra').replace(/\s+/g, '_')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-4 py-2.5 rounded-xl bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-all cursor-pointer"
                                    >
                                      <Download className="w-4 h-4" /> Download
                                    </a>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
                                  <AlertCircle className="w-8 h-8" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Berkas Belum Diupload</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: Rekening Pembayaran Komisi */}
                {activeSubTab === 'rekening' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Action Export Header for Rekening */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Ekspor Gabungan Rekening & Legalitas
                        </div>
                        <div className="text-base font-bold text-white">Download PDF Rekening Komisi + Identitas Legalitas</div>
                        <p className="text-xs text-slate-300 font-medium">Mengunduh PDF resmi berisi detail rekening komisi pencairan serta data identitas mitra terhubung.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isExportingPdf}
                        className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        Download PDF Rekening & Legalitas
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-900 flex items-center justify-center text-white">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Rekening Pembayaran Komisi Mitra</h3>
                        <p className="text-xs text-slate-400 font-medium">Rekening bank resmi untuk pencairan komisi & bonus penjualan jemaah</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Bank Card Graphic */}
                      <div className="lg:col-span-7">
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white shadow-2xl shadow-emerald-900/30 relative overflow-hidden group border border-emerald-800/30">
                          <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                              <CreditCard className="w-12 h-12 text-emerald-400/60" />
                              <div className="px-4 py-1.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-400/30">
                                Verified Payment Method
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-2">Nomor Rekening Bank</div>
                                <div className="text-2xl sm:text-3xl font-mono tracking-[0.25em] font-medium leading-none">
                                  {selectedMitra.profile?.noRekening?.match(/.{1,4}/g)?.join(' ') || '**** **** **** ****'}
                                </div>
                              </div>
                              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-1">Nama Pemilik Rekening</div>
                                  <div className="text-lg font-bold tracking-wide uppercase text-white">
                                    {selectedMitra.profile?.namaPemilikRekening || selectedMitra.profile?.namaLengkap || selectedMitra.name || 'NAMA BELUM DIISI'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60 mb-1">Bank Penerbit</div>
                                  <div className="text-xl font-black italic tracking-wider text-emerald-300">{selectedMitra.profile?.namaBank || 'UNKNOWN BANK'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Bank</div>
                          <div className="text-lg font-bold text-slate-900">{selectedMitra.profile?.namaBank || 'Belum diisi'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nomor Rekening</div>
                          <div className="text-lg font-mono font-bold text-slate-900">{selectedMitra.profile?.noRekening || 'Belum diisi'}</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Pemilik Rekening</div>
                          <div className="text-lg font-bold text-slate-900">
                            {selectedMitra.profile?.namaPemilikRekening || selectedMitra.profile?.namaLengkap || selectedMitra.name || 'Belum diisi'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Transfer Quick Card next to/below Rekening Komisi */}
                    <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-amber-400/20">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase tracking-wider mb-1">
                            Bukti Transfer Registrasi
                          </div>
                          <h4 className="text-base font-bold text-slate-900">Lihat Bukti Transfer Biaya Pendaftaran</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Verifikasi resi pembayaran pendaftaran mitra ke Bank Mandiri PT Golden Tour Haramain
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('bukti_transfer')}
                        className="px-6 py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-lg shadow-emerald-900/20 active:scale-95"
                      >
                        <Eye className="w-4 h-4 text-amber-300" /> Buka Bukti Transfer
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: Bukti Transfer Pendaftaran */}
                {activeSubTab === 'bukti_transfer' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-900 via-emerald-950 to-slate-900 text-white shadow-xl shadow-amber-950/20 border border-amber-500/30">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 flex items-center gap-2">
                          <Receipt className="w-4 h-4" /> Verifikasi Pembayaran Biaya Kemitraan
                        </div>
                        <div className="text-base font-bold text-white">Bukti Transfer Biaya Registrasi</div>
                        <p className="text-xs text-amber-100/80 font-medium">Pembayaran biaya administrasi pendaftaran & perlengkapan kemitraan perwakilan Golden Travel.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedMitra.documents?.find(d => d.documentType === 'bukti_transfer')?.fileUrl || selectedMitra.profile?.buktiTransfer ? (
                          <button
                            type="button"
                            onClick={() => {
                              const url = selectedMitra.documents?.find(d => d.documentType === 'bukti_transfer')?.fileUrl || selectedMitra.profile?.buktiTransfer;
                              if (url) setViewingImage(url);
                            }}
                            className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-400/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" /> Perbesar Resi Fullscreen
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Dokumen Struk / Resi Bukti Transfer</h3>
                        <p className="text-xs text-slate-400 font-medium">Pastikan nominal transfer administrasi masuk ke Rekening Mandiri PT Golden Tour Haramain</p>
                      </div>
                    </div>

                    {(() => {
                      const buktiUrl = selectedMitra.documents?.find(d => d.documentType === 'bukti_transfer')?.fileUrl || selectedMitra.profile?.buktiTransfer;
                      const docStatus = selectedMitra.documents?.find(d => d.documentType === 'bukti_transfer')?.status || 'pending';

                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          {/* Main Image Box */}
                          <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  Foto / Screenshot Resi Transfer
                                  {docStatus === 'verified' && <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Verified</span>}
                                  {docStatus === 'pending' && <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Pending Review</span>}
                                  {docStatus === 'rejected' && <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">Rejected</span>}
                                </h4>
                                <p className="text-xs text-slate-400 font-medium">Diunggah oleh mitra pada saat pendaftaran</p>
                              </div>

                              {buktiUrl && (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={buktiUrl}
                                    download={`bukti_transfer_${(selectedMitra.name || 'mitra').replace(/\s+/g, '_')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-800" /> Download
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setViewingImage(buktiUrl)}
                                    className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                  >
                                    Lihat Full <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="relative min-h-[350px] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group">
                              {buktiUrl ? (
                                <>
                                  <img 
                                    src={buktiUrl} 
                                    alt="Bukti Transfer Pendaftaran" 
                                    className="max-h-[500px] w-full object-contain group-hover:scale-102 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <button 
                                      onClick={() => setViewingImage(buktiUrl)}
                                      className="px-5 py-3 rounded-xl bg-white text-emerald-900 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all cursor-pointer hover:bg-amber-300"
                                    >
                                      <Eye className="w-4 h-4" /> Perbesar Resi
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="p-8 text-center space-y-3">
                                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-slate-800">Bukti Transfer Belum Diunggah</h5>
                                    <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
                                      Mitra ini belum melampirkan foto resi bukti transfer biaya administrasi pendaftaran.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Side Info Cards */}
                          <div className="lg:col-span-5 space-y-4">
                            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-xl space-y-4 border border-emerald-800/30">
                              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-300">Rincian Tagihan Registrasi</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase">Biaya Administrasi</span>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Tagihan</div>
                                  <div className="text-2xl font-playfair font-black text-amber-300">Biaya Kemitraan</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank Tujuan Perusahaan</div>
                                  <div className="text-sm font-bold text-white">BANK MANDIRI - 1090064995673</div>
                                  <div className="text-xs text-slate-300 font-medium">a.n. PT. GOLDEN TOUR HARAMAIN</div>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Checklist Verifikasi Tim Keuangan:
                              </h5>
                              <ul className="text-xs text-slate-600 space-y-1.5 font-medium pl-6 list-disc">
                                <li>Pastikan nominal transfer sesuai tagihan administrasi</li>
                                <li>Rekening penerima adalah Bank Mandiri PT Golden Tour Haramain</li>
                                <li>Tanggal & jam transfer terlihat jelas pada resi</li>
                                <li>Jika valid, klik tombol <strong>Verifikasi & Aktifkan</strong> di bawah.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Review / Evaluation Section - Common across all tabs */}
                <section className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Catatan & Evaluasi Verifikasi</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Jika pendaftaran ditolak, berikan alasan yang jelas (misal: "Foto KTP buram" atau "Nomor NPWP tidak valid") agar mitra dapat melakukan revisi.
                  </p>
                  <textarea 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Tuliskan catatan evaluasi di sini..."
                    className="w-full h-28 p-5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                  />
                  {selectedMitra.profile?.reviewNotes && (
                    <div className="pt-4 border-t border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Riwayat Catatan Terakhir:</div>
                      <div className="p-4 rounded-xl bg-slate-50 text-slate-600 text-xs italic">
                        "{selectedMitra.profile.reviewNotes}"
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Action Footer */}
              <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-20">
                <div className="hidden md:flex items-center gap-3 text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-tight">Status Verifikator: Golden Admin Team</span>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setDeletingMitra(selectedMitra)}
                    className="flex-1 md:flex-none px-6 py-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 active:scale-95 border border-rose-100"
                  >
                    <Trash2 className="w-5 h-5" /> Hapus Mitra
                  </button>
                  <button 
                    onClick={() => handleVerify('rejected')}
                    disabled={isVerifying}
                    className="flex-1 md:flex-none px-8 py-4 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-3 group active:scale-95 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Tolak & Kabari
                  </button>
                  <button 
                    onClick={() => handleVerify('active')}
                    disabled={isVerifying}
                    className="flex-1 md:flex-none px-10 py-4 rounded-2xl bg-emerald-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 hover:bg-emerald-800 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    Verifikasi & Aktifkan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingMitra && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setDeletingMitra(null)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Trash2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-playfair font-black text-slate-900">Hapus Data Mitra?</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Apakah Anda yakin ingin menghapus mitra <span className="font-bold text-slate-800">{deletingMitra.name}</span>? Tindakan ini permanen dan akan menghapus semua berkas legalitas serta data terkait mitra ini.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setDeletingMitra(null)}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 font-black"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteMitra}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-black"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
            onClick={() => setViewingImage(null)}
          >
            <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={viewingImage} 
              alt="Document Full View" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMitraManager;
