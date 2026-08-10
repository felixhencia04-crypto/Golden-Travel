import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Check, X, Eye, AlertCircle, Loader2, Search, Filter, 
  ChevronRight, Calendar, User, FileText, ExternalLink
} from 'lucide-react';
import { api } from '../utils/api';
import { isPdfUrl } from '../utils/file';
import { motion, AnimatePresence } from 'motion/react';
import PdfViewer from './PdfViewer';

export default function DocumentVerification() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    const docId = id || selectedDoc?.id || selectedDoc?.documentId || selectedDoc?.document_id;
    console.log("ID Payload yang dikirim:", docId);
    if (!docId || docId === '.' || (typeof docId === 'string' && docId.startsWith('.'))) {
      toast.error("ID Dokumen tidak valid atau berupa titik (.)");
      return;
    }
    try {
      setSubmitting(true);
      await api.verifyDocument(docId, status, status === 'rejected' ? rejectionReason : undefined);
      setDocuments(prev => prev.filter(d => d.id !== docId && d.documentId !== docId));
      setIsRejecting(false);
      setRejectionReason('');
      setSelectedDoc(null);
      toast.success(status === 'approved' ? 'Dokumen berhasil disetujui' : 'Dokumen ditolak');
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Gagal memproses verifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-matcha-950">Verifikasi Dokumen</h2>
          <p className="text-gray-500 text-sm">Tinjau kelengkapan dokumen persyaratan jamaah.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Jamaah</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Jenis Dokumen</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Tanggal Upload</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.length > 0 ? documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-matcha-100 flex items-center justify-center text-matcha-700 font-bold">
                        {(doc.userName || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{doc.userName}</div>
                        <div className="text-xs text-gray-500">{doc.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-700 uppercase">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      {doc.docType}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Tinjau"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleVerify(doc.id, 'approved')}
                        disabled={submitting}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Setujui"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsRejecting(true);
                        }}
                        disabled={submitting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Tolak"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                    Belum ada dokumen yang menunggu verifikasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View / Reject */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!submitting) {
                  setSelectedDoc(null);
                  setIsRejecting(false);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-matcha-50/50">
                <h3 className="text-xl font-bold text-matcha-950">Tinjau Dokumen</h3>
                <button 
                  onClick={() => {
                    setSelectedDoc(null);
                    setIsRejecting(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Jamaah</label>
                    <p className="font-bold text-gray-900">{selectedDoc.userName}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Jenis Dokumen</label>
                    <p className="font-bold text-matcha-900 uppercase">{selectedDoc.docType}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Dokumen</label>
                    <a 
                      href={selectedDoc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-matcha-600 flex items-center gap-1 hover:underline"
                    >
                      Buka di Tab Baru <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="rounded-2xl border border-gray-100 overflow-hidden bg-slate-900 min-h-[350px] relative group flex items-center justify-center">
                    {(selectedDoc.isPdf || isPdfUrl(selectedDoc.fileUrl) || (selectedDoc.docType && selectedDoc.docType.toLowerCase().includes('pdf'))) ? (
                      <PdfViewer url={selectedDoc.fileUrl} title={selectedDoc.docType || 'Pratinjau Dokumen'} className="h-[380px] w-full" />
                    ) : (
                      <img 
                        src={selectedDoc.fileUrl} 
                        alt="Preview Dokumen" 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {isRejecting && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-3 p-5 bg-red-50 rounded-2xl border border-red-100"
                  >
                    <label className="block text-sm font-bold text-red-900">Alasan Penolakan</label>
                    <textarea 
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Foto Paspor buram, mohon upload ulang yang lebih jelas..."
                      className="w-full p-4 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] text-sm"
                    />
                  </motion.div>
                )}
              </div>

              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setSelectedDoc(null);
                    setIsRejecting(false);
                  }}
                  className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                {isRejecting ? (
                  <button 
                    onClick={() => handleVerify(selectedDoc.id, 'rejected')}
                    disabled={!rejectionReason || submitting}
                    className="px-8 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-200"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Konfirmasi Tolak
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerify(selectedDoc.id, 'approved')}
                    disabled={submitting}
                    className="px-8 py-2.5 bg-matcha-900 text-white font-bold rounded-xl hover:bg-matcha-950 transition-colors flex items-center gap-2 shadow-lg shadow-matcha-900/20"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Setujui Dokumen
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
