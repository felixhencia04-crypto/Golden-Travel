import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  CreditCard, Upload, CheckCircle2, Clock, 
  AlertCircle, Loader2, Download, Receipt, 
  ChevronRight, Building2, Wallet, Banknote
} from 'lucide-react';
import { api } from '../utils/api';
import { motion } from 'motion/react';

export default function InvoiceDetails() {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentType, setPaymentType] = useState<'dp1' | 'dp2' | 'full'>('dp1');

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await api.getJamaahInvoice();
      setInvoice(data);
      
      // Default to next payment step
      if (data.status === 'package_selected') setPaymentType('dp1');
      else if (data.status === 'dp1_paid') setPaymentType('dp2');
      else if (data.status === 'dp2_paid') setPaymentType('full');
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File terlalu besar! Maksimal 5MB.');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const proofUrl = reader.result as string;
        await api.uploadPayment({ 
          registrationId: invoice.id, 
          paymentType, 
          amount: (invoice.calculatedTotal / 3).toString(), // Simplified split payment
          proofUrl 
        });
        toast.success('Bukti transfer berhasil diupload. Menunggu verifikasi admin.');
        await loadInvoice();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Gagal mengupload bukti transfer');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!invoice) return <div>Data invoice tidak ditemukan.</div>;

  const isFullyPaid = invoice.status === 'fully_paid';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-matcha-950">Detail Tagihan</h2>
          <p className="text-gray-500">Kelola pembayaran keberangkatan Umroh Anda.</p>
        </div>
        {isFullyPaid && (
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-100 text-green-700 rounded-2xl font-bold">
            <CheckCircle2 className="w-5 h-5" />
            PEMBAYARAN LUNAS
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Receipt className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Paket Perjalanan</label>
                  <h3 className="text-2xl font-bold text-gray-900">{invoice.package.name}</h3>
                </div>
                <div className="text-right">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
                  <span className={`text-sm font-bold uppercase ${isFullyPaid ? 'text-green-600' : 'text-gold-600'}`}>
                    {invoice.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Harga Dasar Paket</span>
                  <span className="font-medium text-gray-900">{formatCurrency(Number(invoice.package.price))} / orang</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Jumlah Jamaah ({invoice.adultCount} Dewasa, {invoice.childCount} Anak, {invoice.infantCount} Bayi)</span>
                  <span className="font-medium text-gray-900">Total Pax</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-dashed border-gray-200">
                  <span className="text-matcha-950">Total Tagihan</span>
                  <span className="text-gold-600">{formatCurrency(invoice.calculatedTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-matcha-900 rounded-3xl p-8 text-white shadow-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-gold-400" />
              Rekening Pembayaran
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-all group flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-matcha-200 uppercase tracking-widest mb-2">Bank Mandiri</p>
                  <p className="text-lg font-mono font-bold text-gold-400">1090064995673</p>
                  <p className="text-sm mt-1 font-medium">A.N. PT. Golden Tour Haramain</p>
                </div>
                <button 
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText("1090064995673");
                  }}
                  title="Salin Nomor Rekening"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Action */}
        <div className="space-y-6">
          {!isFullyPaid ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gold-100 text-gold-600 rounded-2xl flex items-center justify-center mb-6">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Bukti Transfer</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Silakan upload bukti transfer bank Anda untuk memverifikasi pembayaran.
              </p>

              <div className="w-full space-y-4">
                <div className="flex gap-2">
                  {['dp1', 'dp2', 'full'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setPaymentType(type as any)}
                      className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        paymentType === type 
                          ? 'bg-matcha-900 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <label className="w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-matcha-500 hover:bg-matcha-50/50 transition-all group">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-matcha-600" />
                  ) : (
                    <>
                      <div className="p-3 bg-gray-100 rounded-full text-gray-400 group-hover:bg-matcha-100 group-hover:text-matcha-600 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-bold text-gray-700">Pilih Bukti Transfer</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Format: JPG, PNG (Maks 5MB)</p>
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUploadProof}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Alhamdulillah!</h3>
              <p className="text-green-800/80 text-sm leading-relaxed mb-6">
                Seluruh pembayaran Anda telah tervalidasi oleh sistem. Anda sekarang bisa fokus pada persiapan spiritual.
              </p>
              <button className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-green-200 text-green-700 rounded-2xl font-bold hover:bg-green-100 transition-all shadow-sm">
                <Download className="w-5 h-5" />
                Unduh Kwitansi Pelunasan
              </button>
            </div>
          )}

          {/* Payment History Mini Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Riwayat Pembayaran
            </h4>
            <div className="space-y-3">
              {invoice.payments?.length > 0 ? invoice.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase">{p.paymentType}</p>
                    <p className="text-[10px] text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(Number(p.amount))}</p>
                    <span className={`text-[9px] font-bold uppercase ${
                      p.status === 'approved' ? 'text-green-600' : 
                      p.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic text-center py-4">Belum ada riwayat pembayaran.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
