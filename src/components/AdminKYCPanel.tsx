import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { 
  Users, CheckCircle2, XCircle, AlertTriangle, 
  Eye, FileText, Phone, Mail, MapPin, Building2,
  ChevronRight, Search, Clock, ShieldCheck
} from 'lucide-react';

export default function AdminKYCPanel() {
  const [pendingMitra, setPendingMitra] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMitra, setSelectedMitra] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/kyc/pending');
      setPendingMitra(data);
    } catch (error) {
      toast.error('Gagal memuat data verifikasi mitra');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (mitraId: string, status: 'active' | 'rejected') => {
    try {
      await api.post('/admin/kyc/review', { mitraId, status, notes: reviewNotes });
      toast.success(`Mitra berhasil ${status === 'active' ? 'disetujui' : 'ditolak'}`);
      setSelectedMitra(null);
      setReviewNotes('');
      fetchPending();
    } catch (error) {
      toast.error('Gagal memperbarui status verifikasi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-900">Verifikasi Mitra Baru</h2>
          <p className="text-slate-500 font-medium text-sm">Kelola pendaftaran mitra yang menunggu verifikasi KYC.</p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-black text-amber-700 uppercase tracking-widest">{pendingMitra.length} Menunggu</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left List */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {pendingMitra.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Semua Bersih!</p>
              <p className="text-slate-400 text-xs mt-1">Tidak ada mitra yang menunggu verifikasi.</p>
            </div>
          ) : (
            pendingMitra.map((mitra) => (
              <button
                key={mitra.id}
                onClick={() => setSelectedMitra(mitra)}
                className={`w-full text-left p-5 rounded-[2rem] border transition-all ${
                  selectedMitra?.id === mitra.id 
                    ? 'bg-emerald-900 border-emerald-900 text-white shadow-xl shadow-emerald-900/20' 
                    : 'bg-white border-slate-100 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    selectedMitra?.id === mitra.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${selectedMitra?.id === mitra.id ? 'text-white' : 'text-slate-900'}`}>
                      {mitra.name}
                    </p>
                    <p className={`text-xs font-medium truncate ${selectedMitra?.id === mitra.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {mitra.email}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedMitra?.id === mitra.id ? 'translate-x-1' : ''}`} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Detail / Preview */}
        <div className="lg:col-span-2">
          {selectedMitra ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-white flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-playfair font-black text-slate-900">{selectedMitra.name}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Status: Menunggu Verifikasi</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Text Info */}
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Biodata Lengkap</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">NIK</p>
                          <p className="text-sm font-bold text-slate-700">{selectedMitra.profile?.nik || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Alamat</p>
                          <p className="text-sm font-bold text-slate-700">{selectedMitra.profile?.alamatLengkap || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Informasi Bank</h4>
                    <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900">{selectedMitra.profile?.namaBank || '-'}</p>
                          <p className="text-xs text-emerald-700 font-medium">Buku Tabungan / Nama Pemilik Sesuai</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-playfair font-black text-emerald-900 tracking-wider">
                          {selectedMitra.profile?.noRekening || '-'}
                        </p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          A.N {selectedMitra.profile?.namaPemilikRekening || selectedMitra.profile?.namaLengkap || selectedMitra.name || '-'}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Documents Preview */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pratinjau Dokumen</h4>
                  <div className="space-y-4">
                    {selectedMitra.documents?.map((doc: any) => (
                      <div key={doc.id} className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Eye className="w-3 h-3" /> {doc.documentType.replace('_', ' ')}
                        </p>
                        <div className="aspect-video rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden group relative">
                          <img 
                            src={doc.fileUrl} 
                            alt={doc.documentType} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                          />
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                          >
                            Buka Ukuran Penuh
                          </a>
                        </div>
                      </div>
                    ))}
                    {(!selectedMitra.documents || selectedMitra.documents.length === 0) && (
                      <div className="h-40 rounded-3xl bg-slate-50 border border-slate-100 border-dashed flex items-center justify-center text-slate-400 text-xs font-medium">
                        Tidak ada dokumen terunggah
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan Review (Opsional)</label>
                  <textarea 
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Contoh: Foto KTP kurang jelas, mohon upload ulang..."
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 outline-none text-sm font-medium focus:border-emerald-500 transition-all"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleReview(selectedMitra.id, 'active')}
                    className="flex-1 py-4 rounded-2xl bg-emerald-900 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Setujui Mitra
                  </button>
                  <button
                    onClick={() => handleReview(selectedMitra.id, 'rejected')}
                    className="flex-1 py-4 rounded-2xl bg-white border border-red-200 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Tolak / Revisi
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem] p-12 text-center text-slate-400">
              <div className="max-w-xs space-y-4">
                <Search className="w-12 h-12 mx-auto opacity-20" />
                <p className="font-medium">Pilih salah satu mitra di sebelah kiri untuk meninjau data pendaftaran mereka.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
