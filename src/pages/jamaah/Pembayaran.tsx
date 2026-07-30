import React, { useState, useEffect } from 'react';
import { useRegistrasi } from '../../hooks/useRegistrasi';
import { api } from '../../lib/api';
import { 
  CreditCard, 
  Upload, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  FileText,
  Download,
  Info,
  ChevronRight,
  Camera,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Pembayaran: React.FC = () => {
  const { dbUser, registration, refreshData } = useRegistrasi();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchInvoice = async () => {
    if (!registration?.id) return;
    try {
      setLoading(true);
      const data = await api.get(`/api/registrasi/${registration.id}/invoice`);
      setInvoice(data);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      toast.error("Gagal memuat data tagihan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [registration?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !invoice) return;

    setUploading(true);
    try {
      // 1. Upload file
      const uploadRes = await api.upload('/api/upload', selectedFile);
      const proofUrl = uploadRes.url;

      // 2. Create transaction
      await api.post(`/api/registrasi/${registration.id}/transaksis`, {
        paymentType: invoice.tahapBerikutnya,
        amount: invoice.nominalBerikutnya,
        proofUrl
      });

      toast.success("Bukti transfer berhasil diunggah! Menunggu verifikasi admin.");
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchInvoice();
      refreshData(true);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengunggah bukti transfer");
    } finally {
      setUploading(false);
    }
  };

  if (loading && !invoice) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Memuat rincian tagihan...</p>
      </div>
    );
  }

  const steps = [
    { id: 'DP1', label: 'DP Awal (DP1)', amount: 1500000, description: 'Booking seat & pendaftaran sistem' },
    { id: 'DP2', label: 'DP Lanjutan (DP2)', amount: 10000000, description: 'Pengurusan visa & akomodasi' },
    { id: 'PELUNASAN', label: 'Pelunasan Akhir', amount: invoice?.sisaTagihan || 0, description: 'Pelunasan seluruh biaya keberangkatan' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pembayaran</h1>
          <p className="text-gray-500">Kelola cicilan dan pantau status pembayaran paket Anda.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gold-50 text-gold-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Tagihan</p>
            <p className="text-xl font-black text-gray-900">Rp {(invoice?.sisaTagihan || 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stages & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Payment Stages Visualizer */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Info className="w-5 h-5 text-gold-500" />
              Alur Pembayaran Bertahap
            </h2>
            <div className="relative space-y-12">
              {/* Connector Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>
              
              {steps.map((step, idx) => {
                const isCompleted = invoice?.riwayatTransaksi?.some((t: any) => t.paymentType === step.id && t.status === 'VERIFIED');
                const isPending = invoice?.riwayatTransaksi?.some((t: any) => t.paymentType === step.id && t.status === 'PENDING');
                const isCurrent = invoice?.tahapBerikutnya === step.id;

                return (
                  <div key={step.id} className="relative z-10 flex items-start gap-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' :
                      isPending ? 'bg-amber-100 border-amber-500 text-amber-600' :
                      isCurrent ? 'bg-gold-500 border-gold-500 text-white shadow-lg shadow-gold-100 animate-pulse' :
                      'bg-white border-gray-200 text-gray-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold text-sm">{idx + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className={`font-bold ${isCompleted ? 'text-gray-900' : isCurrent ? 'text-gold-600' : 'text-gray-500'}`}>
                          {step.label}
                        </h3>
                        <span className={`text-sm font-black ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                          Rp {step.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      {isPending && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Menunggu Verifikasi Admin
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Transaction History */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-gold-500" />
              Riwayat Pembayaran
            </h2>
            <div className="space-y-4">
              {invoice?.riwayatTransaksi?.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm italic">Belum ada riwayat transaksi.</p>
                </div>
              ) : (
                invoice?.riwayatTransaksi?.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tx.status === 'VERIFIED' ? 'bg-green-50 text-green-600' :
                        tx.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{tx.paymentType}</p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm">Rp {Number(tx.amount).toLocaleString('id-ID')}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === 'VERIFIED' ? 'text-green-600' :
                        tx.status === 'REJECTED' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Upload Form */}
        <div className="space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 sticky top-28">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Bukti Bayar</h2>
              <p className="text-xs text-gray-500 mt-1">Langkah selanjutnya: <span className="text-gold-600 font-bold">{invoice?.tahapBerikutnya}</span></p>
            </div>

            <div className="bg-gold-50/50 rounded-2xl p-6 border border-gold-100 mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Nominal Transfer</span>
                <span className="text-lg font-black text-gold-700">Rp {(invoice?.nominalBerikutnya || 0).toLocaleString('id-ID')}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-center border-t border-gold-100 pt-3 mt-3">
                Mohon transfer sesuai nominal di atas untuk mempermudah verifikasi otomatis.
              </p>
            </div>

            {/* File Dropzone */}
            <div className="space-y-4">
              <div 
                className={`relative group h-64 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer ${
                  previewUrl ? 'border-gold-500 bg-gold-50/20' : 'border-gray-200 hover:border-gold-400 hover:bg-gold-50/10'
                }`}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                <input 
                  id="receipt-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
                
                {previewUrl ? (
                  <div className="w-full h-full relative overflow-hidden rounded-2xl">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">Klik untuk upload bukti transfer</p>
                    <p className="text-xs text-gray-400 mt-1">Format JPG, PNG (Maks 10MB)</p>
                  </>
                )}
              </div>

              <button
                disabled={!selectedFile || uploading || invoice?.tahapBerikutnya === 'LUNAS'}
                onClick={handleUpload}
                className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !selectedFile || uploading || invoice?.tahapBerikutnya === 'LUNAS'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-[#132019] hover:bg-black text-white shadow-gray-200'
                }`}
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {uploading ? 'Sedang Mengirim...' : 'Konfirmasi Setoran'}
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Rekening Tujuan</p>
                  <p className="text-xs font-bold text-gray-800">Bank Syariah Indonesia (BSI)</p>
                  <p className="text-xs font-mono font-bold text-blue-600 tracking-wider">7788 9900 11</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                * Kuitansi resmi akan diterbitkan otomatis setelah admin memverifikasi setoran Anda.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Pembayaran;
