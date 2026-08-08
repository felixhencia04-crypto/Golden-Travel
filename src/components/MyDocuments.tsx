import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  FileText, Upload, CheckCircle2, XCircle, Clock, 
  AlertCircle, Loader2, Eye, Trash2, Plane, ShieldCheck, Download
} from 'lucide-react';
import { api } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'motion/react';
import { openDataUrlInNewTab } from '../utils/file';

const DOC_TYPES = [
  { id: 'ktp', label: 'Kartu Tanda Penduduk (KTP)', required: true },
  { id: 'passport', label: 'Paspor RI', required: true },
  { id: 'kk', label: 'Kartu Keluarga (KK)', required: false },
  { id: 'buku_nikah', label: 'Buku Nikah (Bagi Suami Istri)', required: false },
  { id: 'vaccine', label: 'Sertifikat Vaksin', required: false },
];

const FINAL_DOC_TYPES = [
  { id: 'eticket', label: 'E-Ticket Keberangkatan', icon: Plane, desc: 'Tiket penerbangan resmi jamaah' },
  { id: 'visa', label: 'Visa Umrah / Haji', icon: ShieldCheck, desc: 'Dokumen visa resmi KSA' },
  { id: 'asuransi', label: 'Polis Asuransi Perjalanan', icon: ShieldCheck, desc: 'Asuransi kesehatan & perjalanan' },
];

export default function MyDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useSocket(() => loadDocuments(true));

  useEffect(() => {
    loadDocuments();
  }, []);

  const lastLoadRef = React.useRef<number>(0);

  const loadDocuments = async (silent = false, force = false) => {
    const now = Date.now();
    if (!force && silent && now - lastLoadRef.current < 4000) {
      return;
    }
    lastLoadRef.current = now;

    try {
      if (!silent) setLoading(true);
      const data = await api.getJamaahDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // High capacity upload up to 100MB
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File terlalu besar! Maksimal 100MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileUrl = reader.result as string;
      
      // Optimistic state update
      const newDoc = { id: `doc-${Date.now()}`, docType, fileUrl, status: 'pending', createdAt: new Date().toISOString() };
      setDocuments(prev => [...prev.filter(d => d.docType !== docType), newDoc]);
      toast.success('Dokumen berhasil diunggah secara real-time!');
      setUploading(null);

      // Non-blocking background upload
      api.uploadDocument({ docType, fileUrl }).then(() => {
        setTimeout(() => loadDocuments(true), 1000);
      }).catch((error) => {
        console.error('Upload failed:', error);
        toast.error('Gagal mengupload dokumen ke server');
      });
    };
    reader.readAsDataURL(file);
  };

  const getDocStatus = (docType: string) => {
    return documents.find(d => 
      d.docType === docType || 
      d.docType?.toLowerCase() === docType.toLowerCase() ||
      d.docType?.toLowerCase().includes(docType.toLowerCase()) ||
      d.id === docType
    );
  };

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gold-500/20 overflow-hidden rounded-full z-10">
          <div className="h-full bg-gold-500 animate-pulse w-full"></div>
        </div>
      )}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Dokumen Saya</h3>
        <p className="text-gray-500 text-sm mb-6">Lengkapi dokumen persyaratan keberangkatan Anda. Pastikan foto jelas dan terbaca.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOC_TYPES.map((type) => {
            const status = getDocStatus(type.id);
            const isUploading = uploading === type.id;

            return (
              <div 
                key={type.id} 
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  status?.status === 'approved' ? 'border-green-100 bg-green-50/30' : 
                  status?.status === 'rejected' ? 'border-red-100 bg-red-50/30' :
                  status?.status === 'pending' ? 'border-blue-100 bg-blue-50/30' :
                  'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      status?.status === 'approved' ? 'bg-green-100 text-green-600' : 
                      status?.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      status?.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{type.label}</h4>
                      {type.required && <span className="text-[10px] font-bold text-red-500 uppercase">Wajib</span>}
                    </div>
                  </div>
                  
                  {status && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      status.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      status.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {status.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {status.status === 'rejected' && <AlertCircle className="w-3.5 h-3.5" />}
                      {status.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      {status.status === 'approved' ? 'Tervalidasi' : 
                       status.status === 'rejected' ? 'Ditolak' : 
                       'Menunggu Verifikasi'}
                    </div>
                  )}
                </div>

                {status?.status === 'rejected' && (
                  <div className="mb-4 p-3.5 bg-red-50/90 rounded-xl border border-red-200 text-xs text-red-900 flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-950">Catatan Verifikasi (Alasan Penolakan):</p>
                      <p className="text-red-800 mt-0.5 leading-relaxed font-medium">
                        {status.adminNotes || status.rejectionReason || status.notes || status.reason || 'Dokumen belum memenuhi standar. Silakan unggah berkas pengganti yang baru.'}
                      </p>
                    </div>
                  </div>
                )}

                {status ? (
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => openDataUrlInNewTab(status.fileUrl)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Lihat Dokumen
                    </button>
                    {status.status !== 'approved' && (
                      <label className="flex items-center justify-center p-2.5 bg-matcha-900 text-white rounded-xl cursor-pointer hover:bg-matcha-950 transition-colors">
                        <Upload className="w-5 h-5" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => handleUpload(type.id, e)}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-matcha-500 hover:bg-matcha-50/30 transition-all group">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-matcha-600" />
                    ) : (
                      <>
                        <div className="p-2 bg-gray-100 rounded-full text-gray-400 group-hover:bg-matcha-100 group-hover:text-matcha-600 transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-700">Pilih File</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Maks 20MB (JPG, PNG, PDF)</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleUpload(type.id, e)}
                      disabled={!!uploading}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dokumen Final Keberangkatan dari Travel */}
      <div className="bg-gradient-to-br from-gray-900 to-matcha-950 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold-500/20 text-gold-400 rounded-2xl border border-gold-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Dokumen Final Keberangkatan</h3>
              <p className="text-xs text-gray-300">Diterbitkan langsung oleh Tim Travel (E-Ticket, Visa, Asuransi)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {FINAL_DOC_TYPES.map((finalDoc) => {
            const IconComp = finalDoc.icon;
            
            // Check group doc and pax docs
            const groupDoc = documents.find((d: any) => d.docType === finalDoc.id);
            const paxDocs = documents.filter((d: any) => d.docType.startsWith(`${finalDoc.id}_pax_`));
            const hasGroup = groupDoc && groupDoc.fileUrl;
            const hasPaxDocs = paxDocs.length > 0;
            const hasAny = hasGroup || hasPaxDocs;

            return (
              <div 
                key={finalDoc.id}
                className={`p-5 rounded-2xl border transition-all ${
                  hasAny 
                    ? 'bg-white/10 border-gold-500/40 backdrop-blur-md hover:bg-white/15' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-gold-500/20 text-gold-400">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    hasAny ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {hasAny ? 'Siap Diunduh' : 'Belum Diterbitkan'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{finalDoc.label}</h4>
                <p className="text-[11px] text-gray-400 mt-1 mb-4">{finalDoc.desc}</p>

                {hasGroup && (
                  <button
                    type="button"
                    onClick={() => openDataUrlInNewTab(groupDoc.fileUrl, `${finalDoc.label} Group`)}
                    className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 text-gray-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-gold-500/20 mb-2"
                  >
                    <Eye className="w-4 h-4" /> Lihat {finalDoc.label} Group
                  </button>
                )}

                {hasPaxDocs && (
                  <div className="space-y-1.5 pt-1 border-t border-white/10">
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">Per Pax / Perorangan:</p>
                    {paxDocs.map((pDoc: any) => {
                      const paxIdx = pDoc.docType.replace(`${finalDoc.id}_pax_`, '');
                      const paxNum = parseInt(paxIdx, 10) + 1;
                      return (
                        <button
                          key={pDoc.id}
                          type="button"
                          onClick={() => openDataUrlInNewTab(pDoc.fileUrl, `${finalDoc.label} Pax #${paxNum}`)}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg flex items-center justify-between px-3 transition-all border border-white/10"
                        >
                          <span>Jamaah Pax {paxNum}</span>
                          <span className="text-[10px] text-gold-400 font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Unduh
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!hasAny && (
                  <div className="p-2.5 rounded-xl bg-white/5 text-center text-[11px] font-medium text-gray-400">
                    Menunggu penerbitan dari Travel
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gold-50 border border-gold-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-gold-600 shadow-sm">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-gold-900 mb-1">Informasi Penting</h4>
          <p className="text-gold-800/80 text-sm leading-relaxed">
            Admin akan memeriksa dokumen Anda dalam waktu maksimal 1x24 jam kerja. 
            Mohon pastikan data pada Paspor dan KTP sinkron agar tidak terjadi penolakan sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
