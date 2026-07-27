import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Check, X, Eye, AlertCircle, Loader2, Search, Filter, 
  ChevronRight, Calendar, User, Package, Banknote, FileText
} from 'lucide-react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import DocumentVerification from './DocumentVerification';

export default function VerificationManagement() {
  const [activeSubTab, setActiveSubTab] = useState<'pembayaran' | 'dokumen'>('pembayaran');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'pembayaran') {
      loadVerifications();
    }
  }, [activeSubTab]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingVerifications();
      setVerifications(data);
    } catch (error) {
      console.error('Failed to load verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setSubmitting(true);
      await api.verifyPayment(id, status, status === 'rejected' ? rejectionReason : undefined);
      setVerifications(prev => prev.filter(v => v.paymentId !== id));
      setIsRejecting(false);
      setRejectionReason('');
      setSelectedVerification(null);
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Gagal memproses verifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-matcha-950">Pusat Verifikasi</h2>
          <p className="text-gray-500">Tinjau dan proses pengajuan dari jamaah.</p>
        </div>
      </div>

      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-md">
        <button 
          onClick={() => setActiveSubTab('pembayaran')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'pembayaran' ? 'bg-white text-matcha-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Pembayaran
        </button>
        <button 
          onClick={() => setActiveSubTab('dokumen')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'dokumen' ? 'bg-white text-matcha-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Dokumen
        </button>
      </div>

      {activeSubTab === 'dokumen' ? (
        <DocumentVerification />
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Jamaah</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Paket & Jenis</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nominal</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {verifications.length > 0 ? verifications.map((v) => (
                <tr key={v.paymentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-matcha-100 flex items-center justify-center text-matcha-700 font-bold">
                        {(v.userName || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{v.userName}</div>
                        <div className="text-xs text-gray-500">{v.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{v.packageName}</div>
                    <div className="text-xs text-gold-600 font-semibold uppercase">{v.paymentType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-matcha-900">
                      Rp {Number(v.amount).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedVerification(v)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Bukti"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleVerify(v.paymentId, 'approved')}
                        disabled={submitting}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Setujui"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedVerification(v);
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada verifikasi tertunda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>
)}

  {/* Modal Rejection / Detail */}
      <AnimatePresence>
        {selectedVerification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!submitting) {
                  setSelectedVerification(null);
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
                <h3 className="text-xl font-bold text-matcha-950">Detail Verifikasi</h3>
                <button 
                  onClick={() => {
                    setSelectedVerification(null);
                    setIsRejecting(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jamaah</label>
                    <p className="font-bold text-gray-900">{selectedVerification.userName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nominal</label>
                    <p className="font-bold text-matcha-900">Rp {Number(selectedVerification.amount).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bukti Pembayaran</label>
                  <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 aspect-video relative group">
                    {(selectedVerification.proofUrl?.startsWith('data:application/pdf') || selectedVerification.proofUrl?.endsWith('.pdf')) ? (
                      <iframe 
                        src={selectedVerification.proofUrl} 
                        className="w-full h-full border-none"
                        title="PDF Preview"
                      />
                    ) : (
                      <img 
                        src={selectedVerification.proofUrl} 
                        alt="Bukti Transfer" 
                        className="w-full h-full object-contain"
                      />
                    )}
                    <a 
                      href={selectedVerification.proofUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold"
                    >
                      Buka Penuh
                    </a>
                  </div>
                </div>

                {isRejecting && (
                  <div className="space-y-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <label className="block text-sm font-bold text-red-900">Alasan Penolakan</label>
                    <textarea 
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Bukti transfer tidak terbaca atau nominal tidak sesuai..."
                      className="w-full p-4 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setSelectedVerification(null);
                    setIsRejecting(false);
                  }}
                  className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900"
                >
                  Batal
                </button>
                {isRejecting ? (
                  <button 
                    onClick={() => handleVerify(selectedVerification.paymentId, 'rejected')}
                    disabled={!rejectionReason || submitting}
                    className="px-8 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Konfirmasi Tolak
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerify(selectedVerification.paymentId, 'approved')}
                    disabled={submitting}
                    className="px-8 py-2.5 bg-matcha-900 text-white font-bold rounded-xl hover:bg-matcha-950 transition-colors flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Setujui Pembayaran
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
