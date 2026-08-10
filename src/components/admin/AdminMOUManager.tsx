import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Plus, Search, Filter, CheckCircle2, Clock, 
  AlertCircle, Trash2, Eye, Download, Share2, Users, Calendar, 
  ShieldCheck, Edit3, X, RefreshCw, FileCheck, ExternalLink, Printer,
  Building, Check, FileCode, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';

interface MOUItem {
  id: string;
  mouNumber: string;
  title: string;
  mitraId: string;
  mitraName: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  status: 'menunggu_tanda_tangan' | 'aktif' | 'kadaluarsa' | 'ditolak';
  effectiveDate?: string;
  expiryDate?: string;
  notes?: string;
  signedFileUrl?: string;
  signedAt?: string;
  signedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MitraOption {
  id: string;
  name: string;
  email: string;
  status?: string;
}

export const AdminMOUManager: React.FC = () => {
  const [mous, setMous] = useState<MOUItem[]>([]);
  const [mitraList, setMitraList] = useState<MitraOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [mitraFilter, setMitraFilter] = useState<string>('semua');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [selectedMouForPreview, setSelectedMouForPreview] = useState<MOUItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedMouForEdit, setSelectedMouForEdit] = useState<MOUItem | null>(null);

  // Form State
  const [mouNumber, setMouNumber] = useState<string>(`MOU/GT/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
  const [title, setTitle] = useState<string>('Surat Perjanjian Kerjasama (MOU) Kemitraan Agent 2026');
  const [selectedMitraId, setSelectedMitraId] = useState<string>('ALL');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [status, setStatus] = useState<'menunggu_tanda_tangan' | 'aktif' | 'kadaluarsa'>('menunggu_tanda_tangan');
  const [notes, setNotes] = useState<string>('Segera baca, unduh, dan lakukan konfirmasi penandatanganan MOU Kemitraan ini.');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const getAdminToken = () => {
    return (
      localStorage.getItem('admin_token') ||
      sessionStorage.getItem('admin_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      ''
    );
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      // 1. Fetch MOUs
      const mouRes = await fetch('/api/admin/mou', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mouRes.ok) {
        const data = await mouRes.json();
        // format backend rows to frontend item camelCase
        const formatted = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: m.id,
          mouNumber: m.mou_number || m.mouNumber || '',
          title: m.title || 'MOU Kemitraan',
          mitraId: m.mitra_id || m.mitraId || 'ALL',
          mitraName: m.mitra_name || m.mitraName || 'Semua Mitra',
          fileUrl: m.file_url || m.fileUrl || '',
          fileName: m.file_name || m.fileName || 'Dokumen_MOU.pdf',
          fileSize: m.file_size || m.fileSize || 'PDF',
          status: m.status || 'menunggu_tanda_tangan',
          effectiveDate: m.effective_date || m.effectiveDate || '',
          expiryDate: m.expiry_date || m.expiryDate || '',
          notes: m.notes || '',
          signedFileUrl: m.signed_file_url || m.signedFileUrl || '',
          signedAt: m.signed_at || m.signedAt || '',
          signedByName: m.signed_by_name || m.signedByName || '',
          createdAt: m.created_at || m.createdAt || '',
          updatedAt: m.updated_at || m.updatedAt || ''
        }));
        setMous(formatted);
      }

      // 2. Fetch Mitra List for dropdown selection
      const mitraRes = await fetch('/api/admin/mitra/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mitraRes.ok) {
        const mData = await mitraRes.json();
        if (Array.isArray(mData)) {
          setMitraList(mData.map((item: any) => ({
            id: item.id,
            name: item.name || item.fullName || item.namaLengkap || item.email || 'Mitra Agent',
            email: item.email || '',
            status: item.status_akun || item.status || ''
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load MOU list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 15MB');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setFileDataUrl(result);
      toast.success(`Berkas ${file.name} siap diunggah`);
    };
    reader.readAsDataURL(file);
  };

  // Generate Sample Standard MOU PDF Data URL if no external file uploaded
  const handleUseStandardTemplate = () => {
    const templateTitle = title || 'SURAT PERJANJIAN KERJASAMA (MOU) KEMITRAAN AGENT GOLDEN TRAVEL';
    const num = mouNumber || `MOU/GT/2026/001`;
    const targetName = selectedMitraId === 'ALL' ? 'Semua Mitra Agent' : (mitraList.find(m => m.id === selectedMitraId)?.name || 'Mitra Agent');

    // Simple HTML styled page encoded as Data URL for viewable agreement document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${templateTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px double #0d5c3a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-text { font-size: 24px; font-weight: bold; color: #0d5c3a; letter-spacing: 2px; }
          .sub-text { font-size: 13px; color: #555; }
          .title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; color: #000; }
          .number { text-align: center; font-size: 13px; margin-bottom: 30px; color: #444; }
          .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; color: #0d5c3a; }
          .box { background: #f9fbf9; border: 1px solid #d1e7dd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-box { text-align: center; width: 45%; }
          .sig-space { height: 80px; margin: 10px 0; border-bottom: 1px dashed #aaa; }
          .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-text">PT GOLDEN TRAVEL HARAMAIN</div>
          <div class="sub-text">Izin Penyelenggara Perjalanan Ibadah Umrah (PPIU) Kemenag RI</div>
          <div class="sub-text">Jl. Raya Boulevard Gold No. 88, Jakarta Selatan | Telp: (021) 7890-1234</div>
        </div>

        <div class="title">${templateTitle.toUpperCase()}</div>
        <div class="number">Nomor: ${num}</div>

        <p>Pada hari ini, disepakati Perjanjian Kerjasama Kemitraan (MOU) antara:</p>
        
        <div class="box">
          <strong>PIHAK PERTAMA:</strong><br>
          Nama Perusahaan: PT Golden Travel Haramain<br>
          Jabatan: Manajemen Pusat Kemitraan & Syiar Umroh
        </div>

        <div class="box">
          <strong>PIHAK KEDUA:</strong><br>
          Nama Agent / Mitra: <strong>${targetName}</strong><br>
          Status Kemitraan: Mitra Agent Reseller Resmi
        </div>

        <div class="section-title">PASAL 1: MAKSUD DAN TUJUAN</div>
        <p>Pihak Pertama menunjuk Pihak Kedua sebagai Mitra Resmi untuk mensyiar dan membantu pendaftaran calon jemaah Umroh dan Haji Plus Golden Travel dengan ketentuan dan bagi hasil komisi yang telah disepakati.</p>

        <div class="section-title">PASAL 2: HAK DAN KEWAJIBAN</div>
        <p>1. Pihak Pertama berkewajiban menyediakan materi edukasi, brosur, sistem pendaftaran online, dan kepastian fasilitas jemaah.<br>
        2. Pihak Kedua berhak mendapatkan pencairan komisi sesuai tarif kemitraan resmi setelah pembayaran jemaah terverifikasi.<br>
        3. Pihak Kedua wajib menjaga nama baik, integritas, dan memberikan informasi yang benar kepada calon jemaah.</p>

        <div class="section-title">PASAL 3: MASA BERLAKU</div>
        <p>Perjanjian ini berlaku efektif mulai tanggal <strong>${effectiveDate || '-'}</strong> sampai dengan <strong>${expiryDate || '-'}</strong> dan dapat diperpanjang atas kesepakatan kedua belah pihak.</p>

        <div class="signatures">
          <div class="sig-box">
            <p>PIHAK PERTAMA<br><strong>PT Golden Travel Haramain</strong></p>
            <div class="sig-space" style="display:flex;align-items:center;justify-content:center;color:#0d5c3a;font-weight:bold;">
              [TERVERIFIKASI MANAJEMEN]
            </div>
            <p><strong>Ahmad Daud</strong><br>Direktur Kemitraan</p>
          </div>
          <div class="sig-box">
            <p>PIHAK KEDUA<br><strong>${targetName}</strong></p>
            <div class="sig-space"></div>
            <p><strong>(${targetName})</strong><br>Mitra Agent Reseller</p>
          </div>
        </div>

        <div class="footer">
          Dokumen MOU ini dikeluarkan secara elektronik oleh Sistem Manajemen Golden Travel Haramain. Valid & Sah secara Hukum.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
      setFileName(`Template_MOU_${num.replace(/[/]/g, '_')}.html`);
      setFileSize('HTML/Doc');
      toast.success('Template MOU Standard Golden Travel berhasil dibuat!');
    };
    reader.readAsDataURL(blob);
  };

  // Submit Upload MOU
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mouNumber.trim() || !title.trim()) {
      toast.error('Nomor MOU dan Judul Perjanjian wajib diisi.');
      return;
    }

    if (!fileDataUrl) {
      toast.error('Silakan unggah berkas MOU atau gunakan template standard.');
      return;
    }

    setIsUploading(true);
    try {
      const selectedMitraObj = mitraList.find(m => m.id === selectedMitraId);
      const targetMitraName = selectedMitraId === 'ALL' ? 'Semua Mitra (Global)' : (selectedMitraObj?.name || 'Mitra Agent');

      const payload = {
        mouNumber: mouNumber.trim(),
        title: title.trim(),
        mitraId: selectedMitraId,
        mitraName: targetMitraName,
        fileUrl: fileDataUrl,
        fileName: fileName || 'Dokumen_MOU.pdf',
        fileSize: fileSize || 'Dokumen',
        effectiveDate,
        expiryDate,
        status,
        notes
      };

      const res = await fetch('/api/admin/mou', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan MOU');
      }

      toast.success('Berkas MOU berhasil diunggah & dibagikan ke Portal Mitra!');
      setIsUploadModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah MOU');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMouNumber(`MOU/GT/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`);
    setTitle('Surat Perjanjian Kerjasama (MOU) Kemitraan Agent 2026');
    setSelectedMitraId('ALL');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setExpiryDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setStatus('menunggu_tanda_tangan');
    setNotes('Segera baca, unduh, dan lakukan konfirmasi penandatanganan MOU Kemitraan ini.');
    setFileDataUrl('');
    setFileName('');
    setFileSize('');
  };

  // Delete MOU
  const handleDeleteMou = async (id: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen MOU "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/mou/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        toast.success('Dokumen MOU berhasil dihapus');
        fetchData();
      } else {
        toast.error('Gagal menghapus dokumen MOU');
      }
    } catch (err) {
      toast.error('Gagal menghapus dokumen MOU');
    }
  };

  // Update Status Modal Handler
  const handleSaveEditStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMouForEdit) return;

    try {
      const res = await fetch(`/api/admin/mou/${selectedMouForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({
          status: selectedMouForEdit.status,
          notes: selectedMouForEdit.notes,
          effectiveDate: selectedMouForEdit.effectiveDate,
          expiryDate: selectedMouForEdit.expiryDate
        })
      });

      if (res.ok) {
        toast.success('Status MOU berhasil diperbarui');
        setIsEditModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal memperbarui MOU');
      }
    } catch (err) {
      toast.error('Gagal memperbarui MOU');
    }
  };

  // Share Notification Link
  const handleShareMou = (mou: MOUItem) => {
    const shareText = `Golden Travel - Dokumen MOU Resmi: ${mou.title} (${mou.mouNumber}). Silakan cek & konfirmasi di Portal Mitra Anda.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toast.success('Pesan informasi MOU berhasil disalin ke clipboard!');
    } else {
      toast.success(`Informasi MOU dibagikan ke ${mou.mitraName}`);
    }
  };

  // Filtering
  const filteredMous = mous.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mouNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mitraName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;
    const matchesMitra = mitraFilter === 'semua' || item.mitraId === mitraFilter || (mitraFilter === 'ALL' && item.mitraId === 'ALL');

    return matchesSearch && matchesStatus && matchesMitra;
  });

  // Calculate statistics
  const totalMous = mous.length;
  const pendingSignCount = mous.filter(m => m.status === 'menunggu_tanda_tangan').length;
  const activeCount = mous.filter(m => m.status === 'aktif').length;
  const uniqueMitrasCount = new Set(mous.map(m => m.mitraId)).size;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Portal Kemitraan & Legal
            </div>
            <h1 className="text-3xl md:text-4xl font-playfair font-black text-amber-100">
              Unggah & Management MOU Mitra
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl font-medium leading-relaxed">
              Unggah dokumen Perjanjian Kerjasama (MOU), bagikan ke Mitra tertentu atau seluruh Agent, dan pantau status penandatanganan serta legalitas secara real-time.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm hover:from-amber-300 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 shrink-0"
          >
            <Upload className="w-5 h-5" />
            <span>Unggah MOU Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dokumen MOU</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalMous}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Tersimpan di sistem</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Tanda Tangan</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{pendingSignCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Perlu dikonfirmasi Mitra</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MOU Aktif / Resmi</p>
            <h3 className="text-2xl font-black text-teal-600 mt-0.5">{activeCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Sah & Berjalan</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mitra Terhubung</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{mitraList.length}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Akun Agent Aktif</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor MOU, judul, atau nama mitra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="semua">Semua Status</option>
                <option value="menunggu_tanda_tangan">Menunggu Tanda Tangan</option>
                <option value="aktif">Aktif / Resmi</option>
                <option value="kadaluarsa">Kadaluarsa</option>
              </select>
            </div>

            <select
              value={mitraFilter}
              onChange={(e) => setMitraFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 bg-white max-w-[200px] truncate"
            >
              <option value="semua">Semua Target Mitra</option>
              <option value="ALL">Global (Semua Mitra)</option>
              {mitraList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* MOU List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Memuat berkas MOU...</p>
          </div>
        ) : filteredMous.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Dokumen MOU</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery || statusFilter !== 'semua' || mitraFilter !== 'semua'
                  ? 'Tidak ada dokumen MOU yang cocok dengan kata kunci pencarian atau filter.'
                  : 'Belum ada dokumen MOU yang diunggah. Klik tombol "Unggah MOU Baru" di atas untuk menambahkan berkas baru.'}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsUploadModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Unggah Sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMous.map((mou) => {
              const isGlobal = mou.mitraId === 'ALL';
              return (
                <div key={mou.id} className="p-6 hover:bg-slate-50/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                        {mou.mouNumber}
                      </span>

                      {/* Target Mitra Tag */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        isGlobal 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {isGlobal ? <Users className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                        {mou.mitraName}
                      </span>

                      {/* Status Tag */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        mou.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : mou.status === 'menunggu_tanda_tangan'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {mou.status === 'aktif' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {mou.status === 'menunggu_tanda_tangan' && <Clock className="w-3 h-3 text-amber-600 animate-pulse" />}
                        {mou.status === 'kadaluarsa' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {mou.status === 'aktif' ? 'Aktif & Ditandatangani' : mou.status === 'menunggu_tanda_tangan' ? 'Menunggu Ttd Mitra' : 'Kadaluarsa'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        {mou.title}
                      </h4>
                      {mou.notes && (
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                          {mou.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Masa Berlaku: <strong>{mou.effectiveDate || '-'}</strong> s/d <strong>{mou.expiryDate || '-'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>Berkas: <strong>{mou.fileName}</strong> ({mou.fileSize})</span>
                      </div>

                      {mou.signedAt && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3.5 h-3.5" />
                          <span>Dittd oleh {mou.signedByName || 'Mitra'} pada {new Date(mou.signedAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedMouForPreview(mou);
                        setIsPreviewModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                      title="Lihat Preview Dokumen"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Lihat</span>
                    </button>

                    <a
                      href={mou.fileUrl}
                      download={mou.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-emerald-200/60"
                      title="Unduh Berkas MOU"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>Unduh</span>
                    </a>

                    <button
                      onClick={() => handleShareMou(mou)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                      title="Bagikan Info MOU"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMouForEdit(mou);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-all"
                      title="Edit Status / Catatan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteMou(mou.id, mou.title)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                      title="Hapus MOU"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Upload MOU Baru */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header - Fixed at Top */}
            <div className="p-5 sm:p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Unggah Dokumen MOU Kemitraan</h3>
                  <p className="text-xs text-slate-500 font-medium">Bagikan dokumen Perjanjian Kerjasama resmi ke akun Mitra Agent</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitUpload} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Target Mitra Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Mitra Penerima MOU <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMitraId}
                  onChange={(e) => setSelectedMitraId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                >
                  <option value="ALL">🌐 Bagikan ke Semua Mitra Agent (Global MOU)</option>
                  <optgroup label="Mitra Terdaftar Spesifik">
                    {mitraList.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.email})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {selectedMitraId === 'ALL'
                    ? 'Dokumen MOU ini akan dapat diakses oleh semua Mitra Agent di portal mereka.'
                    : 'Dokumen MOU khusus ini hanya akan dikirimkan dan diakses oleh Mitra yang dipilih.'}
                </p>
              </div>

              {/* MOU Number & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor MOU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mouNumber}
                    onChange={(e) => setMouNumber(e.target.value)}
                    placeholder="MOU/GT/2026/001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Awal
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="menunggu_tanda_tangan">⏳ Menunggu Tanda Tangan Mitra</option>
                    <option value="aktif">✅ Aktif / Resmi Disetujui</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Perjanjian / MOU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Surat Perjanjian Kerjasama (MOU) Kemitraan Agent 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Effective & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Efektif
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Kadaluarsa
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan / Instruksi untuk Mitra
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan atau syarat tambahan..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* File Attachment Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Berkas MOU (PDF, DOC, Gambar) <span className="text-rose-500">*</span>
                </label>

                <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-5 text-center transition-all space-y-3">
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {fileName ? `File Terpilih: ${fileName} (${fileSize})` : 'Pilih Berkas MOU dari Komputer'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Format: PDF, DOCX, PNG, JPG (Maks 15MB)</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <label className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" /> Pilih File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleUseStandardTemplate}
                      className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs hover:bg-amber-200 transition-all inline-flex items-center gap-1.5 border border-amber-300"
                    >
                      <FileCode className="w-4 h-4" /> Gunakan Template Golden Travel
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Sticky at Bottom */}
              <div className="sticky bottom-0 bg-white pt-4 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 z-10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? 'Mengunggah...' : 'Simpan & Bagikan MOU'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Preview Dokumen MOU */}
      {isPreviewModalOpen && selectedMouForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-100">{selectedMouForPreview.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">No: {selectedMouForPreview.mouNumber} | Target: {selectedMouForPreview.mitraName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedMouForPreview.fileUrl}
                  download={selectedMouForPreview.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" /> Unduh
                </a>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative flex items-center justify-center">
              {selectedMouForPreview.fileUrl ? (
                <iframe
                  src={selectedMouForPreview.fileUrl}
                  className="w-full h-full rounded-2xl bg-white shadow-inner border border-slate-200"
                  title="Document Preview"
                />
              ) : (
                <div className="text-center p-8">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">File preview tidak tersedia</p>
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Status: <strong className="uppercase text-emerald-800">{selectedMouForPreview.status}</strong>
                {selectedMouForPreview.signedAt && ` | Dittd oleh: ${selectedMouForPreview.signedByName}`}
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit MOU Status & Detail */}
      {isEditModalOpen && selectedMouForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Status MOU</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedMouForEdit.title}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status MOU
                </label>
                <select
                  value={selectedMouForEdit.status}
                  onChange={(e) => setSelectedMouForEdit({ ...selectedMouForEdit, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="menunggu_tanda_tangan">⏳ Menunggu Tanda Tangan Mitra</option>
                  <option value="aktif">✅ Aktif / Ditandatangani & Resmi</option>
                  <option value="kadaluarsa">⚠️ Kadaluarsa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={selectedMouForEdit.notes || ''}
                  onChange={(e) => setSelectedMouForEdit({ ...selectedMouForEdit, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-800 shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
