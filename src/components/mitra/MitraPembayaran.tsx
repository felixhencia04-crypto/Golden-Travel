import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Wallet, Banknote, CreditCard, Upload, CheckCircle2, Clock, 
  AlertCircle, Download, FileText, ChevronDown, Check, MessageCircle,
  Building2, ArrowRight, ShieldCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { filterJamaahForCurrentMitra, getScopedKey } from '../../utils/mitraStorage';

interface MitraPembayaranProps {
  jamaahList: any[];
  onRefresh?: () => void;
}

export default function MitraPembayaran({ jamaahList, onRefresh }: MitraPembayaranProps) {
  // Use jamaahList from props as primary source for real-time data
  const realJamaahList = React.useMemo(() => {
    // If props are provided, use them as they come from the API (Source of Truth)
    if (jamaahList && jamaahList.length > 0) {
      const filtered = filterJamaahForCurrentMitra(jamaahList);
      if (filtered.length > 0) {
        return filtered.filter(j => 
          j.userName && 
          j.userName.trim() !== '' && 
          !j.userName.startsWith('Jamaah #')
        );
      }
    }

    // Fallback to local database for session persistence if props are empty
    try {
      const stored = localStorage.getItem('mitra_jamaah_database');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = filterJamaahForCurrentMitra(parsed);
          return filtered.filter(j => 
            j.userName && 
            j.userName.trim() !== '' && 
            !j.userName.startsWith('Jamaah #')
          );
        }
      }

      // Check scoped pax list
      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const savedPax = localStorage.getItem(scopedKey);
      if (savedPax) {
        const parsedPax = JSON.parse(savedPax);
        if (Array.isArray(parsedPax) && parsedPax.length > 0) {
          return parsedPax.filter(j => j.userName && j.userName.trim() !== '');
        }
      }
    } catch (e) {}
    
    return [];
  }, [jamaahList]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync listener for Admin updates (deletions/verifications)
  React.useEffect(() => {
    const handleSync = () => {
      if (onRefresh) onRefresh();
    };

    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [onRefresh]);
  
  const selectedJamaah = React.useMemo(() => {
    if (selectedId) {
      const found = realJamaahList.find(j => j.id === selectedId);
      if (found) return found;
    }
    return realJamaahList[0];
  }, [selectedId, realJamaahList]);

  // Update selectedId when list changes if not set
  React.useEffect(() => {
    if (!selectedId && realJamaahList.length > 0) {
      setSelectedId(realJamaahList[0].id);
    }
  }, [realJamaahList, selectedId]);

  const hasPending = React.useMemo(() => {
    return selectedJamaah?.payments?.some((p: any) => p.status === 'pending');
  }, [selectedJamaah]);

  // Professional currency formatter helper
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  // Real-time calculated values
  const totalPrice = Number(selectedJamaah?.packagePrice || selectedJamaah?.totalPrice || 20000000);
  
  // Sum verified and pending payments to provide immediate feedback after upload
  const totalPaid = React.useMemo(() => {
    if (!selectedJamaah?.payments || selectedJamaah.payments.length === 0) return 0;
    return selectedJamaah.payments
      .filter((p: any) => ['approved', 'verified', 'VERIFIED', 'pending'].includes(p.status))
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  }, [selectedJamaah]);

  const remainingPrice = Math.max(0, totalPrice - totalPaid);

  const [paymentStage, setPaymentStage] = useState<'dp1' | 'dp2' | 'pelunasan' | 'pelunasan_penuh'>('dp1');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [nominal, setNominal] = useState(remainingPrice.toString());
  const [selectedBank, setSelectedBank] = useState('mandiri');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Sync nominal when selected jemaah or stage changes
  React.useEffect(() => {
    if (paymentStage === 'dp1') setNominal('1500000');
    else if (paymentStage === 'dp2') setNominal('10000000');
    else if (paymentStage === 'pelunasan_penuh') setNominal(totalPrice.toString());
    else setNominal(remainingPrice.toString());
  }, [paymentStage, remainingPrice, totalPrice]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJamaah) {
      toast.error('Pilih jamaah terlebih dahulu.');
      return;
    }
    if (!nominal || Number(nominal) <= 0) {
      toast.error('Masukkan nominal transfer yang valid.');
      return;
    }
    if (!proofFile) {
      toast.error('Harap unggah bukti transfer (foto/PDF).');
      return;
    }

    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: paymentDate || new Date().toISOString().split('T')[0],
      stage: paymentStage === 'dp1' ? 'DP 1 (Perlengkapan)' : 
             paymentStage === 'dp2' ? 'DP 2 (Booking Seat)' : 
             paymentStage === 'pelunasan_penuh' ? 'Pelunasan Penuh' :
             'Pelunasan Akhir',
      amount: Number(nominal),
      bank: selectedBank === 'bsi' ? 'Bank Syariah Indonesia (BSI)' : selectedBank === 'mandiri' ? 'Bank Mandiri' : 'Bank BCA',
      status: 'pending',
      proofUrl: proofPreview || '#'
    };

    // Update central database and scoped pax list
    try {
      const stored = localStorage.getItem('mitra_jamaah_database');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((j: any) => {
          if (j.id === selectedJamaah.id) {
            const history = j.payments || [];
            return {
              ...j,
              payments: [newPayment, ...history],
              paymentStep: paymentStage,
            };
          }
          return j;
        });
        localStorage.setItem('mitra_jamaah_database', JSON.stringify(updated));
      }

      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const scopedStored = localStorage.getItem(scopedKey);
      if (scopedStored) {
        const scopedParsed = JSON.parse(scopedStored);
        const updatedScoped = scopedParsed.map((p: any) => {
          if (p.id === selectedJamaah.id || p.userName === selectedJamaah.userName) {
            const history = p.payments || [];
            return {
              ...p,
              payments: [newPayment, ...history],
              paymentStep: paymentStage
            };
          }
          return p;
        });
        localStorage.setItem(scopedKey, JSON.stringify(updatedScoped));
      }

      window.dispatchEvent(new Event('mitra_jamaah_updated'));
    } catch (e) {
      console.error('Failed to update payment in database:', e);
    }

    setProofFile(null);
    setProofPreview(null);
    toast.success('Bukti pembayaran berhasil dikirim! Admin akan memverifikasi dalam 1x24 jam.');
    if (onRefresh) onRefresh();
  };

  const paymentHistory = selectedJamaah?.payments || [];

  if (realJamaahList.length === 0) {
    return (
      <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 animate-in fade-in">
        <div className="w-20 h-20 bg-white text-slate-300 rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
          <Wallet className="w-10 h-10" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h4 className="text-lg font-black text-slate-900 tracking-tight">Belum Ada Data Jamaah Terdaftar</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed px-8">
            Silakan daftarkan jemaah Anda terlebih dahulu melalui menu Biodata sebelum melakukan proses pembayaran.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Jamaah Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Pilih Jamaah Binaan</div>
            <div className="relative mt-1">
              <select
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full md:w-72 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer pr-10"
              >
                {realJamaahList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.userName} ({j.packageName || 'Paket Ibadah'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full font-black text-xs border flex items-center gap-1.5 ${
            totalPaid >= totalPrice 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            <ShieldCheck className="w-4 h-4" /> 
            STATUS TAGIHAN: {totalPaid >= totalPrice ? 'LUNAS' : selectedJamaah.paymentStep?.toUpperCase() || 'BELUM BAYAR'}
          </span>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Biaya Paket</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            Rp {formatCurrency(totalPrice)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Termasuk perlengkapan & visa</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Sudah Terbayar</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            Rp {formatCurrency(totalPaid)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">
            {hasPending ? 'Termasuk Menunggu Verifikasi' : 'Diverifikasi Admin'}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Sisa Pelunasan</div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            Rp {formatCurrency(remainingPrice)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Batas H-30 Keberangkatan</p>
        </div>
      </div>

      {/* Payment Form & Bank Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bank Account Info Card */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-emerald-950 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 border border-emerald-800">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-widest">
              REKENING RESMI
            </span>
            <h3 className="text-xl font-playfair font-bold text-white mt-3">Rekening Pembayaran PT Golden Tour Haramain</h3>
            <p className="text-xs text-emerald-200 mt-1">
              Mohon lakukan transfer ke salah satu rekening resmi atas nama PT Golden Tour Haramain di bawah ini:
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-tight">Bank Mandiri</span>
                <Building2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="text-2xl font-black tracking-wider text-white mt-2">1090064995673</div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">a.n. PT Golden Tour Haramain</p>
            </div>
          </div>

          <a 
            href={`https://wa.me/6282283201103?text=${encodeURIComponent(`Halo Admin, saya Mitra ingin konfirmasi pembayaran untuk Jamaah ${selectedJamaah.userName}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Konfirmasi Langsung via WA
          </a>
        </div>

        {/* Upload Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-playfair font-bold text-slate-900 text-lg">Unggah Bukti Pembayaran</h3>
              <p className="text-xs text-slate-500">Isi formulir transfer di bawah untuk memproses verifikasi kuitansi jamaah.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tahapan Pembayaran</label>
                <select
                  value={paymentStage}
                  onChange={(e) => setPaymentStage(e.target.value as any)}
                  className="w-full mt-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50"
                >
                  <option value="dp1">DP 1 - Perlengkapan (Rp 1.500.000)</option>
                  <option value="dp2">DP 2 - Booking Seat (Rp 10.000.000)</option>
                  <option value="pelunasan">Pelunasan Akhir (Sisa Tagihan)</option>
                  <option value="pelunasan_penuh">Pelunasan Penuh (Sesuai Paket)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Transfer</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50"
                  placeholder="32500000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Tujuan Transfer</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 outline-none focus:border-emerald-500 bg-slate-50"
                >
                  <option value="mandiri">Bank Mandiri - 1090064995673</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Lampirkan Foto / PDF Bukti Transfer</label>
              <label className="mt-1 border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  {proofFile ? proofFile.name : 'Pilih Bukti Transfer / Struk Bank'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau PDF (Maks 5MB)</span>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-850 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-amber-400" /> Kirim Bukti Pembayaran
            </button>
          </form>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-playfair font-bold text-slate-900 text-lg">Riwayat Pembayaran {selectedJamaah.userName}</h3>
            <p className="text-xs text-slate-500">Daftar transaksi cicilan & pelunasan yang tercatat di sistem.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {paymentHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium italic">
              Belum ada riwayat transaksi untuk jemaah ini.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-extrabold">Tanggal</th>
                  <th className="py-3 px-4 font-extrabold">Tahapan</th>
                  <th className="py-3 px-4 font-extrabold">Bank</th>
                  <th className="py-3 px-4 font-extrabold">Nominal</th>
                  <th className="py-3 px-4 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {paymentHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">{item.date}</td>
                    <td className="py-3.5 px-4 text-slate-900">{item.stage}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.bank}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-900">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'verified' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          DISETUJUI
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                          MENUNGGU VERIFIKASI
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black border border-red-300">
                          DITOLAK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

