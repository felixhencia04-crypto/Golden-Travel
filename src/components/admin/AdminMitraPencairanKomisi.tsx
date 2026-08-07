import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Building2, 
  User, 
  Phone, 
  FileText, 
  Upload, 
  Eye, 
  Image as ImageIcon,
  X, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  Download,
  Copy,
  Check,
  Printer,
  Users
} from 'lucide-react';
import { api } from '../../lib/api';
import { generateCommissionReceiptPdf, generateCommissionRecapPdf } from '../../utils/generateCommissionPayoutPdf';

interface PayoutRequest {
  id: string;
  mitraUserId: string;
  mitraName: string;
  mitraPhone?: string;
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

interface Summary {
  totalPending: number;
  totalApproved: number;
  pendingCount: number;
  totalRequests: number;
}

export const AdminMitraPencairanKomisi: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [viewMode, setViewMode] = useState<'verification' | 'recap_mitra'>('verification');
  const [summary, setSummary] = useState<Summary>({
    totalPending: 0,
    totalApproved: 0,
    pendingCount: 0,
    totalRequests: 0,
  });

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Per Mitra Aggregated Recap
  const perMitraRecap = useMemo(() => {
    const map = new Map<string, {
      mitraUserId: string;
      mitraName: string;
      mitraPhone?: string;
      totalPending: number;
      totalApproved: number;
      totalRejected: number;
      totalRequested: number;
      requestCount: number;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      payoutsList: PayoutRequest[];
    }>();

    payouts.forEach(p => {
      const key = p.mitraUserId || p.mitraName || 'Unknown';
      const amt = Number(p.amount || 0);
      const existing = map.get(key) || {
        mitraUserId: p.mitraUserId,
        mitraName: p.mitraName,
        mitraPhone: p.mitraPhone,
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalRequested: 0,
        requestCount: 0,
        bankName: p.bankName,
        accountNumber: p.accountNumber,
        accountHolder: p.accountHolder,
        payoutsList: [],
      };

      existing.requestCount += 1;
      existing.totalRequested += amt;
      existing.payoutsList.push(p);

      if (p.status === 'PENDING') existing.totalPending += amt;
      if (p.status === 'APPROVED') existing.totalApproved += amt;
      if (p.status === 'REJECTED') existing.totalRejected += amt;

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [payouts]);

  // Modal Approve / Transfer
  const [selectedPayoutForApprove, setSelectedPayoutForApprove] = useState<PayoutRequest | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [transferDateInput, setTransferDateInput] = useState(new Date().toISOString().slice(0, 16));
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Modal Reject
  const [selectedPayoutForReject, setSelectedPayoutForReject] = useState<PayoutRequest | null>(null);
  const [rejectNotesInput, setRejectNotesInput] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Modal View Proof
  const [viewProofModal, setViewProofModal] = useState<PayoutRequest | null>(null);

  // Copy Feedback
  const [copiedAccount, setCopiedAccount] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/commission-payouts?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (res) {
        setPayouts(res.payouts || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to fetch admin commission payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayouts();
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutForApprove) return;

    setSubmittingApprove(true);
    try {
      if (proofFile) {
        await api.upload(`/admin/commission-payouts/${selectedPayoutForApprove.id}/approve`, proofFile, {
          adminNotes: adminNotesInput.trim(),
          transferDate: transferDateInput,
        });
      } else {
        await api.post(`/admin/commission-payouts/${selectedPayoutForApprove.id}/approve`, {
          adminNotes: adminNotesInput.trim(),
          transferDate: transferDateInput,
        });
      }

      setSelectedPayoutForApprove(null);
      setProofFile(null);
      setProofPreviewUrl('');
      setAdminNotesInput('');
      await fetchPayouts();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pengajuan pencairan komisi.');
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutForReject) return;

    setSubmittingReject(true);
    try {
      await api.post(`/admin/commission-payouts/${selectedPayoutForReject.id}/reject`, {
        adminNotes: rejectNotesInput.trim() || 'Pengajuan pencairan komisi ditolak oleh Admin.',
      });

      setSelectedPayoutForReject(null);
      setRejectNotesInput('');
      await fetchPayouts();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pengajuan.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-1">
            <Wallet className="w-3.5 h-3.5 text-amber-300" /> Management Portal Mitra
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-playfair tracking-tight">Pencairan & Komisi Mitra</h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
            Kelola pengajuan pencairan komisi dari Mitra Binaan, lakukan verifikasi transfer bank, dan unggah bukti transfer resmi secara tersentralisasi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => generateCommissionRecapPdf(payouts as any, summary, 'Laporan Rekapitulasi Komisi Mitra (Keseluruhan)')}
            disabled={payouts.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF Rekap Laporan</span>
          </button>
          <button
            onClick={fetchPayouts}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer backdrop-blur-md shrink-0 active:scale-95 shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="flex items-center p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/70 max-w-md">
        <button
          onClick={() => setViewMode('verification')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'verification'
              ? 'bg-emerald-900 text-amber-300 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Verifikasi & Review Komisi</span>
        </button>
        <button
          onClick={() => setViewMode('recap_mitra')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'recap_mitra'
              ? 'bg-emerald-900 text-amber-300 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekap Komisi Per Mitra</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antrean Pending Pencairan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            Rp {(summary.totalPending || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-amber-900 font-bold mt-1">
            {summary.pendingCount} Permintaan Perlu Di-transfer
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Komisi Disetujui (Ditransfer)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800">
            Rp {(summary.totalApproved || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Telah berhasil diproses & dikirim ke Mitra
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Pengajuan Menunggu</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary.pendingCount} Pengajuan
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prioritas penanganan verifikasi
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Riwayat Pengajuan</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary.totalRequests} Permintaan
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Terakumulasi di sistem
          </p>
        </div>
      </div>

      {/* Main View Mode Section */}
      {viewMode === 'verification' ? (
        /* VERIFIKASI & REVIEW KOMISI MODE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Filter Bar & Search */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-emerald-900 text-amber-300 shadow-md shadow-emerald-900/10'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({summary.totalRequests})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Menunggu Approval ({summary.pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'APPROVED'
                    ? 'bg-emerald-900 text-amber-300 shadow-md shadow-emerald-900/10'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Sudah Ditransfer
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'REJECTED'
                    ? 'bg-rose-900 text-white shadow-md'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Ditolak
              </button>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama mitra / rekening..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-600"
              />
            </form>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-800" />
              Memuat data pengajuan pencairan komisi mitra...
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Wallet className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Tidak ada pengajuan pencairan komisi ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                    <th className="py-3.5 px-4">Mitra Binaan</th>
                    <th className="py-3.5 px-4">Jemaah & Paket</th>
                    <th className="py-3.5 px-4">Rekening Bank Tujuan</th>
                    <th className="py-3.5 px-4">Nominal Komisi</th>
                    <th className="py-3.5 px-4">Bukti</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                  {payouts.map((item) => {
                    const isPending = item.status === 'PENDING';
                    const isApproved = item.status === 'APPROVED';
                    const isRejected = item.status === 'REJECTED';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                          <div className="font-bold text-slate-800">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString('id-ID', { timeStyle: 'short' })} WIB
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-sm">{item.mitraName}</div>
                          {item.mitraPhone && (
                            <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-700" /> {item.mitraPhone}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {item.jamaahName || 'Semua Jemaah Binaan'}
                          </div>
                          <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                            {item.packageName || 'Paket Umrah/Haji'}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900">{item.bankName}</div>
                          <div className="font-mono text-emerald-900 font-bold text-[11px]">
                            {item.accountNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            a.n. <strong className="text-slate-800">{item.accountHolder}</strong>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-black text-slate-900 text-base">
                            Rp {Number(item.amount).toLocaleString('id-ID')}
                          </div>
                          {item.mitraNotes && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs italic">
                              "{item.mitraNotes}"
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {item.proofOfTransferUrl ? (
                            <button
                              onClick={() => setViewProofModal(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                              title="Lihat Bukti Transfer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Lihat</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">Belum Ada</span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending Transfer
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ditransfer
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-bold text-[10px]">
                              <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => generateCommissionReceiptPdf(item as any)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                              title="Unduh Kwitansi Resi PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-800" /> Resi PDF
                            </button>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedPayoutForApprove(item);
                                    setAdminNotesInput('');
                                    setProofFile(null);
                                    setProofPreviewUrl('');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-[11px] shadow-sm transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Transfer & Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPayoutForReject(item);
                                    setRejectNotesInput('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </>
                            ) : (
                              item.proofOfTransferUrl && (
                                <button
                                  onClick={() => setViewProofModal(item)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-800" /> Lihat Bukti
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* REKAPITULASI KOMISI PER MITRA VIEW MODE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Rekapitulasi Finansial Per Mitra Binaan</h3>
              <p className="text-xs text-slate-500">Breakdown data akumulasi komisi cair, pending, dan data rekening mitra binaan</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold shrink-0 self-start sm:self-auto">
              {perMitraRecap.length} Mitra Terdaftar
            </span>
          </div>

          {perMitraRecap.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Belum ada data pengajuan komisi dari Mitra.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Nama Mitra Binaan</th>
                    <th className="py-3.5 px-4">Rekening Utama Mitra</th>
                    <th className="py-3.5 px-4">Total Cair (Ditransfer)</th>
                    <th className="py-3.5 px-4">Antrean Pending</th>
                    <th className="py-3.5 px-4">Total Permintaan</th>
                    <th className="py-3.5 px-4 text-right">Aksi Export PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                  {perMitraRecap.map((m) => (
                    <tr key={m.mitraUserId || m.mitraName} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{m.mitraName}</div>
                        {m.mitraPhone && (
                          <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-700" /> {m.mitraPhone}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">ID: {(m.mitraUserId || '-').substring(0, 8)}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{m.bankName}</div>
                        <div className="font-mono text-emerald-900 font-bold text-[11px]">
                          {m.accountNumber}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          a.n. <strong className="text-slate-800">{m.accountHolder}</strong>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-emerald-800 text-base">
                          Rp {m.totalApproved.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold">Cair Ke Rekening</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-black text-amber-700 text-base">
                          Rp {m.totalPending.toLocaleString('id-ID')}
                        </div>
                        <span className="text-[10px] text-amber-800 font-bold">Dalam Proses Approval</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-sm">
                          {m.requestCount} Transaksi
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Total: Rp {m.totalRequested.toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => generateCommissionRecapPdf(
                            m.payoutsList as any, 
                            { totalApproved: m.totalApproved, totalPending: m.totalPending, totalRequests: m.requestCount },
                            `Laporan Rekapitulasi Komisi Mitra - ${m.mitraName}`
                          )}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ml-auto shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Unduh PDF Rekap Mitra
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Approve / Transfer */}
      {selectedPayoutForApprove && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-300">Konfirmasi Transfer & Disburse Komisi</h3>
                <div className="flex flex-col mt-0.5">
                  <span className="text-[11px] text-emerald-200 font-bold">Mitra: {selectedPayoutForApprove.mitraName}</span>
                  <span className="text-[10px] text-emerald-300 italic">Jemaah: {selectedPayoutForApprove.jamaahName || 'Umum / Semua Binaan'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayoutForApprove(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Account copy card for admin convenience */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider">Rekening Tujuan Transfer</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${selectedPayoutForApprove.bankName} - ${selectedPayoutForApprove.accountNumber} a.n ${selectedPayoutForApprove.accountHolder}`)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] cursor-pointer"
                  >
                    {copiedAccount ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount ? 'Tersalin!' : 'Salin Rekening'}</span>
                  </button>
                </div>
                <div className="text-xs text-amber-950 space-y-0.5">
                  <p>Bank: <strong>{selectedPayoutForApprove.bankName}</strong></p>
                  <p>No. Rekening: <strong className="font-mono text-sm">{selectedPayoutForApprove.accountNumber}</strong></p>
                  <p>Atas Nama: <strong>{selectedPayoutForApprove.accountHolder}</strong></p>
                  <p className="pt-1 text-sm font-black text-emerald-900">
                    Nominal Transfer: Rp {Number(selectedPayoutForApprove.amount).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Upload Proof File */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Unggah Bukti Transfer / Resi Bank <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-900 file:text-amber-300 hover:file:bg-emerald-800 cursor-pointer"
                  required={!proofPreviewUrl}
                />
                {proofPreviewUrl && (
                  <div className="mt-2 p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                    <img src={proofPreviewUrl} alt="Preview Bukti Transfer" className="max-h-36 object-contain rounded-lg shadow-sm" />
                  </div>
                )}
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Tanggal Transfer Selesai</label>
                <input
                  type="datetime-local"
                  value={transferDateInput}
                  onChange={(e) => setTransferDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan / No. Referensi Transfer</label>
                <input
                  type="text"
                  placeholder="Contoh: Ref BCA #98123 - Ditransfer oleh Admin Finansial"
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutForApprove(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingApprove}
                  className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submittingApprove ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Transfer & Selesai
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {selectedPayoutForReject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-rose-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-rose-200">Tolak Pengajuan Pencairan Komisi</h3>
                <p className="text-[11px] text-rose-300">Mitra: {selectedPayoutForReject.mitraName}</p>
              </div>
              <button
                onClick={() => setSelectedPayoutForReject(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Nomor rekening tidak cocok atau kesalahan data bank."
                  value={rejectNotesInput}
                  onChange={(e) => setRejectNotesInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-600 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutForReject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {submittingReject ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Tolak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Proof */}
      {viewProofModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-amber-300">Bukti Transfer Finansial Admin</h3>
                <p className="text-[11px] text-emerald-200">Mitra: {viewProofModal.mitraName}</p>
              </div>
              <button
                onClick={() => setViewProofModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="p-2 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                <img
                  src={viewProofModal.proofOfTransferUrl}
                  alt="Bukti Transfer"
                  className="max-h-[50vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>

              {viewProofModal.adminNotes && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold">Catatan Admin:</span> {viewProofModal.adminNotes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewProofModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
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

export default AdminMitraPencairanKomisi;
