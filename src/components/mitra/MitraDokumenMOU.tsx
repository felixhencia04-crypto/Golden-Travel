import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Eye, CheckCircle2, Clock, AlertCircle, 
  ShieldCheck, Check, RefreshCw, FileCheck, PenTool, X, Calendar, Paperclip, Building
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

export const MitraDokumenMOU: React.FC = () => {
  const [mous, setMous] = useState<MOUItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [selectedMouForPreview, setSelectedMouForPreview] = useState<MOUItem | null>(null);

  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [selectedMouForSign, setSelectedMouForSign] = useState<MOUItem | null>(null);
  
  // Sign Form State
  const [signatoryName, setSignatoryName] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [signNotes, setSignNotes] = useState<string>('');
  const [isSubmittingSign, setIsSubmittingSign] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mitra/mou', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: m.id,
          mouNumber: m.mou_number || m.mouNumber || '',
          title: m.title || 'MOU Kemitraan',
          mitraId: m.mitra_id || m.mitraId || 'ALL',
          mitraName: m.mitra_name || m.mitraName || 'Mitra Agent',
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
    } catch (err) {
      console.error('Failed to load Mitra MOUs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingSignatureMou = mous.find(m => m.status === 'menunggu_tanda_tangan');

  // Submit Signature
  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMouForSign) return;

    if (!signatoryName.trim()) {
      toast.error('Nama Lengkap Penandatangan wajib diisi');
      return;
    }

    if (!agreeTerms) {
      toast.error('Anda wajib menyetujui seluruh isi Perjanjian Kerjasama (MOU)');
      return;
    }

    setIsSubmittingSign(true);
    try {
      const res = await fetch(`/api/mitra/mou/${selectedMouForSign.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          signedByName: signatoryName.trim(),
          notes: signNotes
        })
      });

      if (!res.ok) {
        throw new Error('Gagal menandatangani MOU');
      }

      toast.success('MOU Kemitraan berhasil ditandatangani & disetujui!');
      setIsSignModalOpen(false);
      setSignatoryName('');
      setAgreeTerms(false);
      setSignNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyetujui MOU');
    } finally {
      setIsSubmittingSign(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Berkas Perjanjian Kerjasama
          </div>
          <h1 className="text-3xl md:text-4xl font-playfair font-black text-amber-100">
            Dokumen MOU Kemitraan
          </h1>
          <p className="text-emerald-100/80 text-sm max-w-2xl font-medium leading-relaxed">
            Halaman resmi berisi dokumen Perjanjian Kerjasama (MOU) antara Anda sebagai Mitra Agent dan Manajemen PT Golden Travel Haramain. Silakan unduh, pelajari, dan lakukan konfirmasi penandatanganan.
          </p>
        </div>
      </div>

      {/* Alert Banner if Pending Signature */}
      {pendingSignatureMou && (
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-400/60 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">
                Perhatian: Dokumen MOU Perlu Dikonfirmasi & Ditandatangani
              </h3>
              <p className="text-xs text-amber-800 font-medium mt-1">
                Anda memiliki 1 dokumen MOU ({pendingSignatureMou.mouNumber}) yang memerlukan persetujuan tanda tangan Anda agar akun kemitraan aktif sepenuhnya.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedMouForSign(pendingSignatureMou);
              setIsSignModalOpen(true);
            }}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2 active:scale-95"
          >
            <PenTool className="w-4 h-4" /> Tandatangani Sekarang
          </button>
        </div>
      )}

      {/* MOU Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" /> Daftar Berkas MOU Resmi
          </h2>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-700 mx-auto" />
            <p className="text-sm font-medium text-slate-500">Memuat berkas MOU Anda...</p>
          </div>
        ) : mous.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Berkas MOU</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Admin sedang menyiapkan berkas Perjanjian Kerjasama (MOU) khusus untuk akun Anda. Dokumen akan tampil otomatis di sini setelah diunggah oleh Admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {mous.map((mou) => {
              const isPending = mou.status === 'menunggu_tanda_tangan';
              const isActive = mou.status === 'aktif';

              return (
                <div 
                  key={mou.id}
                  className={`bg-white rounded-3xl p-6 md:p-8 border transition-all space-y-6 ${
                    isPending 
                      ? 'border-amber-300 shadow-xl shadow-amber-500/5' 
                      : 'border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/60">
                          {mou.mouNumber}
                        </span>

                        <span className={`text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                          {isActive ? 'Aktif & Sah' : isPending ? 'Perlu Tanda Tangan Anda' : 'Kadaluarsa'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900">{mou.title}</h3>
                      
                      {mou.notes && (
                        <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <strong>Catatan Admin:</strong> {mou.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedMouForPreview(mou);
                          setIsPreviewModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-all"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>Baca / Preview</span>
                      </button>

                      <a
                        href={mou.fileUrl}
                        download={mou.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2 transition-all border border-emerald-200/60"
                      >
                        <Download className="w-4 h-4 text-emerald-700" />
                        <span>Unduh File</span>
                      </a>

                      {isPending && (
                        <button
                          onClick={() => {
                            setSelectedMouForSign(mou);
                            setIsSignModalOpen(true);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          <PenTool className="w-4 h-4" />
                          <span>Konfirmasi MOU</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl">
                      <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Masa Berlaku</p>
                        <p className="font-bold text-slate-800">{mou.effectiveDate || '-'} s/d {mou.expiryDate || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl">
                      <Paperclip className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Nama Berkas</p>
                        <p className="font-bold text-slate-800 truncate max-w-[180px]">{mou.fileName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl">
                      <Building className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Pihak Penerbit</p>
                        <p className="font-bold text-slate-800">PT Golden Travel Haramain</p>
                      </div>
                    </div>
                  </div>

                  {/* Signature Box if signed */}
                  {mou.signedAt && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs font-medium text-emerald-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">MOU Telah Ditandatangani & Sah</p>
                          <p className="text-[11px] text-emerald-700">
                            Penandatangan: <strong>{mou.signedByName || 'Mitra'}</strong> pada {new Date(mou.signedAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
                        Terverifikasi Digital
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Preview Document */}
      {isPreviewModalOpen && selectedMouForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-100">{selectedMouForPreview.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">No: {selectedMouForPreview.mouNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedMouForPreview.fileUrl}
                  download={selectedMouForPreview.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" /> Unduh PDF
                </a>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
              {selectedMouForPreview.fileUrl ? (
                <iframe
                  src={selectedMouForPreview.fileUrl}
                  className="w-full h-full rounded-2xl bg-white shadow-inner border border-slate-200"
                  title="Document Preview"
                />
              ) : (
                <div className="text-center p-12">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">Berkas MOU tidak ditemukan</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>PT Golden Travel Haramain - Perjanjian Resmi</span>
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

      {/* MODAL 2: Tanda Tangani & Konfirmasi MOU */}
      {isSignModalOpen && selectedMouForSign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfirmasi Tanda Tangan MOU</h3>
                  <p className="text-xs text-slate-500 font-medium">No: {selectedMouForSign.mouNumber}</p>
                </div>
              </div>

              <button
                onClick={() => setIsSignModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSignature} className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">{selectedMouForSign.title}</h4>
                <p className="text-xs text-emerald-800 font-medium">
                  Dengan mengonfirmasi modal ini, Anda secara resmi menyatakan menyetujui seluruh ketentuan dan hak-kewajiban yang tercantum dalam dokumen MOU Kemitraan Golden Travel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Penandatangan (Sesuai KTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Masukkan Nama Lengkap Anda..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Persetujuan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={signNotes}
                  onChange={(e) => setSignNotes(e.target.value)}
                  placeholder="Contoh: Menyetujui syarat kemitraan & ketentuan komisi 2026..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    Saya telah membaca, memahami, dan menyetujui seluruh isi Perjanjian Kerjasama (MOU) Kemitraan secara sadar tanpa paksaan dari pihak manapun.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingSign || !agreeTerms}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingSign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  <span>{isSubmittingSign ? 'Memproses...' : 'Tandatangani & Setujui MOU'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
