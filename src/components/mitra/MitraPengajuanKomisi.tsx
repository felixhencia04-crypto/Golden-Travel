import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Building2, 
  User, 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Download, 
  X,
  HelpCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { api } from '../../lib/api';
import { generateCommissionRecapPdf } from '../../utils/generateCommissionPayoutPdf';
import { filterJamaahForCurrentMitra } from '../../utils/mitraStorage';

interface PayoutRequest {
  id: string;
  jamaahName?: string;
  packageName?: string;
  amount: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mitraNotes?: string;
  adminNotes?: string;
  proofOfTransferUrl?: string;
  transferDate?: string;
  createdAt: string;
}

interface JamaahItem {
  id: string;
  name: string;
  email?: string;
  packageName?: string;
}

interface BankInfo {
  namaBank: string;
  noRekening: string;
  namaPemilikRekening: string;
}

interface Summary {
  totalEarned: number;
  totalPending: number;
  totalApproved: number;
  availableBalance: number;
}

export const MitraPengajuanKomisi: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalEarned: 0,
    totalPending: 0,
    totalApproved: 0,
    availableBalance: 0,
  });

  // Form states
  const [amountInput, setAmountInput] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');

  // Jamaah & Package selection states
  const [jamaahList, setJamaahList] = useState<JamaahItem[]>([]);
  const [selectedJamaahId, setSelectedJamaahId] = useState<string>('');
  const [jamaahName, setJamaahName] = useState('');
  const [packageName, setPackageName] = useState('');

  // Proof Modal
  const [selectedProof, setSelectedProof] = useState<{ url: string; date?: string; notes?: string; amount: string } | null>(null);

  const fetchJamaahList = async () => {
    try {
      // 1. Fetch Local Storage Jamaah inputted by this Mitra
      let localItems: JamaahItem[] = [];
      try {
        const storedStr = localStorage.getItem('mitra_jamaah_database');
        if (storedStr) {
          const rawLocal = JSON.parse(storedStr);
          const filteredLocal = filterJamaahForCurrentMitra(rawLocal);
          localItems = filteredLocal
            .filter((j: any) => j && (j.userName || j.name))
            .map((j: any) => ({
              id: j.id || `local-${j.userName || j.name}`,
              name: String(j.userName || j.name || '').trim(),
              packageName: String(j.packageName || j.paket || '').trim(),
            }));
        }
      } catch (e) {
        console.error('Error reading local jamaah database:', e);
      }

      // 2. Fetch API Jamaah for this Mitra
      let apiItems: JamaahItem[] = [];
      try {
        const list = await api.get('/mitra/jamaah');
        if (Array.isArray(list)) {
          apiItems = list
            .filter((j: any) => j && j.name)
            .map((j: any) => ({
              id: String(j.id),
              name: String(j.name || '').trim(),
              packageName: String(j.packageName || '').trim(),
            }));
        }
      } catch (e) {
        console.error('Failed to fetch API jamaah list:', e);
      }

      // 3. Merge & Deduplicate by Jamaah Name
      const combined: JamaahItem[] = [];
      const seenNames = new Set<string>();

      [...localItems, ...apiItems].forEach((item) => {
        if (item.name && !seenNames.has(item.name.toLowerCase())) {
          seenNames.add(item.name.toLowerCase());
          combined.push(item);
        }
      });

      setJamaahList(combined);
    } catch (err) {
      console.error('Failed to fetch jamaah list for select:', err);
    }
  };

  const fetchPayoutData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/mitra/commission-payouts');
      if (res) {
        setPayouts(res.payouts || []);
        if (res.summary) setSummary(res.summary);
        if (res.bankInfo) {
          if (res.bankInfo.namaBank && !bankName) setBankName(res.bankInfo.namaBank);
          if (res.bankInfo.noRekening && !accountNumber) setAccountNumber(res.bankInfo.noRekening);
          if (res.bankInfo.namaPemilikRekening && !accountHolder) setAccountHolder(res.bankInfo.namaPemilikRekening);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch commission payouts:', err);
      setErrorMsg(err.message || 'Gagal memuat data pencairan komisi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
    fetchJamaahList();
  }, []);

  const handleSelectJamaah = (id: string) => {
    setSelectedJamaahId(id);
    if (!id) {
      setJamaahName('');
      setPackageName('');
    } else {
      const found = jamaahList.find(j => j.id === id);
      if (found) {
        setJamaahName(found.name || '');
        setPackageName(found.packageName || '');
      }
    }
  };

  const formatNumberWithDots = (value: string) => {
    // Remove everything except numbers
    const number = value.replace(/\D/g, '');
    // Format with dots as thousands separator
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePresetAmount = (preset: number) => {
    const amount = preset === -1 ? summary.availableBalance : preset;
    setAmountInput(formatNumberWithDots(amount.toString()));
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Remove dots before converting to number for backend
    const numAmount = Number(amountInput.replace(/\./g, ''));

    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Masukkan nominal pencairan komisi yang valid (lebih dari Rp 0)');
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      setErrorMsg('Mohon lengkapi informasi rekening penerima (Nama Bank, Nomor Rekening, & Nama Pemilik)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/mitra/commission-payouts', {
        amount: numAmount,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        notes: notes.trim(),
        jamaahName: jamaahName.trim(),
        packageName: packageName.trim(),
      });

      if (res) {
        setSuccessMsg('Pengajuan pencairan komisi berhasil dikirim! Status saat ini Menunggu Verifikasi & Transfer Admin.');
        setAmountInput('');
        setNotes('');
        setSelectedJamaahId('');
        setJamaahName('');
        setPackageName('');
        await fetchPayoutData();
      }
    } catch (err: any) {
      console.error('Submit payout failed:', err);
      setErrorMsg(err.message || 'Gagal mengirim pengajuan pencairan komisi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-1">
            <Wallet className="w-3.5 h-3.5 text-amber-300" /> Pengajuan & Pencairan Komisi Mitra
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-playfair tracking-tight">E-Wallet & Komisi Kemitraan</h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
            Pantau perolehan komisi jemaah anda, ajukan pencairan ke rekening pribadi, dan lihat bukti transfer real-time dari Tim Finansial Admin.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => generateCommissionRecapPdf(payouts as any, summary, 'Laporan Rekapitulasi Komisi Saya')}
            disabled={payouts.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF Rekap Komisi</span>
          </button>
          <button
            onClick={fetchPayoutData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer backdrop-blur-md shrink-0 active:scale-95 shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Terakumulasi */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Komisi Terakumulasi</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            Rp {(summary.totalEarned || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            5% komisi hasil setoran pembayaran jemaah terverifikasi.
          </p>
        </div>

        {/* Card 3: Sedang Diproses (Pending) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Diproses (Pending)</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            Rp {(summary.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Menunggu persetujuan & proses transfer Tim Admin.
          </p>
        </div>

        {/* Card 4: Total Sudah Dicairkan (Approved) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sudah Dicairkan</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">
            Rp {(summary.totalApproved || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Telah berhasil ditransfer ke rekening bank Mitra.
          </p>
        </div>
      </div>

      {/* Main Grid: Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Pengajuan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Formulir Pengajuan Komisi</h3>
                <p className="text-xs text-slate-500">Isi nominal dan konfirmasi data rekening tujuan</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Nominal Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nominal Pencairan Komisi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 2.000.000"
                    value={amountInput}
                    onChange={(e) => setAmountInput(formatNumberWithDots(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-base font-black text-slate-900 bg-slate-50/50"
                    required
                  />
                </div>
                {/* Preset Quick Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(250000)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    250rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(500000)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    500rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(1000000)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    1 Juta
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(2500000)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all cursor-pointer"
                  >
                    2.5 Juta
                  </button>
                </div>
              </div>

              {/* Data Jemaah & Jenis Paket */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-800" /> Data Jemaah Rujukan & Jenis Paket
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Jemaah Binaan (Opsional)</label>
                  <select
                    value={selectedJamaahId}
                    onChange={(e) => handleSelectJamaah(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Pilih Jemaah Rujukan --</option>
                    {jamaahList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} {j.packageName ? `(${j.packageName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Jemaah</label>
                    <input
                      type="text"
                      placeholder="Contoh: H. Ahmad Subagyo"
                      value={jamaahName}
                      onChange={(e) => setJamaahName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Jenis Paket Jemaah</label>
                    <input
                      type="text"
                      placeholder="Contoh: Umrah Reguler, Haji Plus"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Selection & Account Info */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-800" /> Rekening Tujuan Pencairan
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Bank / E-Wallet</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank BCA, Mandiri, BSI, BRI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pemilik Rekening (Sesuai Buku Tabungan)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Abdullah"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan pengajuan atau nomor HP verifikasi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  !submitting
                    ? 'bg-emerald-900 hover:bg-emerald-800 text-amber-300 shadow-emerald-900/20 active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Kirim Pengajuan Pencairan Komisi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History Table & Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Riwayat Pengajuan & Transfer</h3>
                <p className="text-xs text-slate-500">Daftar transaksi pencairan komisi anda secara real-time</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold self-start sm:self-auto border border-slate-200">
                {payouts.length} Transaksi
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-800" />
                Memuat riwayat pencairan komisi...
              </div>
            ) : payouts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Wallet className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Pengajuan Pencairan</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Silakan ajukan komisi anda melalui formulir di sebelah kiri untuk diproses oleh Tim Admin.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {payouts.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <div key={item.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-base">
                              Rp {Number(item.amount).toLocaleString('id-ID')}
                            </span>
                            {/* Status Badge */}
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px]">
                                <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending (Menunggu Admin)
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved & Ditransfer
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-bold text-[10px]">
                                <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Tanggal Pengajuan: {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>

                        {/* Action Proof View & Kwitansi PDF */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isApproved && item.proofOfTransferUrl && (
                            <button
                              onClick={() => setSelectedProof({
                                url: item.proofOfTransferUrl!,
                                date: item.transferDate,
                                notes: item.adminNotes,
                                amount: item.amount
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 text-amber-300 hover:bg-emerald-800 font-bold text-[11px] shadow-sm transition-all cursor-pointer shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Bukti Transfer
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Jemaah & Paket Info */}
                      {(item.jamaahName || item.packageName) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                            <User className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Jemaah: {item.jamaahName || 'Semua Jemaah Binaan'}</span>
                          </div>
                          {item.packageName && (
                            <div className="text-slate-600 font-medium text-[11px]">
                              • Paket: <strong className="text-slate-900">{item.packageName}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bank Details */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Bank Tujuan</span>
                          <span className="font-bold text-slate-800">{item.bankName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">No. Rekening</span>
                          <span className="font-mono font-bold text-slate-900">{item.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Atas Nama</span>
                          <span className="font-bold text-slate-800">{item.accountHolder}</span>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {(item.mitraNotes || item.adminNotes) && (
                        <div className="space-y-1 text-xs">
                          {item.mitraNotes && (
                            <p className="text-slate-600">
                              <span className="font-bold text-slate-700">Catatan Mitra:</span> {item.mitraNotes}
                            </p>
                          )}
                          {item.adminNotes && (
                            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                              <span className="font-bold text-amber-950">Catatan Tim Admin:</span> {item.adminNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-300">Bukti Transfer Resmi Admin</h3>
                <p className="text-[11px] text-emerald-200">
                  Pencairan Rp {Number(selectedProof.amount).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {selectedProof.date && (
                <p className="text-xs font-medium text-slate-500">
                  Tanggal Transfer: <strong className="text-slate-800">{new Date(selectedProof.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                </p>
              )}

              <div className="p-2 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                <img
                  src={selectedProof.url}
                  alt="Bukti Transfer Admin"
                  className="max-h-[50vh] w-auto object-contain rounded-xl shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {selectedProof.notes && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold">Pesan Admin:</span> {selectedProof.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedProof(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MitraPengajuanKomisi;
