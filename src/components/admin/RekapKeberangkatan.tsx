import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { CRMRegistration, Package, Schedule, Consultation } from '../../types';
import { 
  Search, RefreshCw, 
  User, Calendar, Plane, Info, Download, FileSpreadsheet, Check,
  ChevronDown, ChevronUp, Users, Fingerprint, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { generateJamaahRecapPdf, generateDepartureManifestPdf } from '../../utils/generateJamaahRecapPdf';

export const RekapKeberangkatan: React.FC = () => {
  const [search, setSearch] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'lunas', 'all'
  const [viewType, setViewType] = useState<'grouped' | 'individual'>('grouped');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  // Fetch Registrations
  const { data: registrations, isLoading, refetch } = useQuery<CRMRegistration[]>({
    queryKey: ['admin_registrations_rekap'],
    queryFn: () => api.get('/admin/registrations'),
  });

  // Fetch Packages & Schedules for filters
  const { data: packages } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: () => api.get('/pakets'),
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules'),
  });

  // Filter Logic
  const filteredRegs = (registrations || []).filter(reg => {
    // Basic status check
    if (reg.status === 'CANCELLED') return false;
    
    // Status filter
    if (statusFilter === 'active') {
      const activeStatuses = ['ISI_BIODATA', 'UPLOAD_DOKUMEN', 'VERIFIKASI_DOKUMEN', 'CICIL_BAYAR', 'VERIFIKASI_BAYAR', 'LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'];
      if (!activeStatuses.includes(reg.status)) return false;
    } else if (statusFilter === 'lunas') {
      const lunasStatuses = ['LUNAS', 'SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'];
      if (!lunasStatuses.includes(reg.status)) return false;
    }

    const matchesSearch = 
      reg.ordererName?.toLowerCase().includes(search.toLowerCase()) ||
      reg.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(reg.paxData) && reg.paxData.some((p: any) => p.fullName?.toLowerCase().includes(search.toLowerCase())));
    
    const matchesPackage = packageFilter === 'all' || reg.packageId === packageFilter;
    const matchesSchedule = scheduleFilter === 'all' || reg.scheduleId === scheduleFilter;
    const matchesType = typeFilter === 'all' || reg.package?.type === typeFilter;
    
    let matchesMonth = true;
    if (monthFilter !== 'all' && reg.schedule?.departureDate) {
      const departureDate = new Date(reg.schedule.departureDate);
      matchesMonth = departureDate.getMonth() === parseInt(monthFilter);
    }

    let matchesYear = true;
    if (yearFilter !== 'all' && reg.schedule?.departureDate) {
      const departureDate = new Date(reg.schedule.departureDate);
      matchesYear = departureDate.getFullYear().toString() === yearFilter;
    }

    let matchesDateRange = true;
    if (startDate && reg.schedule?.departureDate) {
      const depDate = new Date(reg.schedule.departureDate);
      matchesDateRange = matchesDateRange && depDate >= new Date(startDate);
    }
    if (endDate && reg.schedule?.departureDate) {
      const depDate = new Date(reg.schedule.departureDate);
      matchesDateRange = matchesDateRange && depDate <= new Date(endDate);
    }

    return matchesSearch && matchesPackage && matchesSchedule && matchesMonth && matchesYear && matchesType && matchesDateRange;
  });

  // Calculate stats for current filter
  const totalPax = filteredRegs.reduce((sum, reg) => sum + (Array.isArray(reg.paxData) ? reg.paxData.length : 1), 0);
  const monthlyPax = monthFilter === 'all' ? 0 : totalPax;

  // Month options
  const months = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' },
  ];

  // Convert to Consultation format for PDF util
  const consultations: Consultation[] = filteredRegs.map(reg => {
    const paxData = Array.isArray(reg.paxData) ? reg.paxData : [];
    return {
      id: reg.id,
      packageId: reg.packageId,
      packageName: reg.package?.name || 'Paket Terhapus',
      name: reg.ordererName || paxData[0]?.fullName || reg.user?.name || 'No Name',
      phone: reg.ordererPhone || reg.user?.phone || '-',
      email: reg.ordererEmail || reg.user?.email || '-',
      status: reg.status.toLowerCase() as any,
      paxData: paxData,
      createdAt: reg.createdAt,
      paymentStep: reg.status === 'LUNAS' || reg.status === 'SIAP_BERANGKAT' || reg.status === 'BERANGKAT' ? 'lunas' : 'none'
    } as Consultation;
  });

  const handleDownloadPdf = () => {
    if (consultations.length === 0) {
      toast.error("Tidak ada data jemaah untuk diunduh.");
      return;
    }
    try {
      generateDepartureManifestPdf(consultations, {
        title: statusFilter === 'lunas' ? 'MANIFEST JEMAAH LUNAS & BERANGKAT' : 'MANIFEST SELURUH DATA JEMAAH AKTIF',
        filterPackage: packageFilter !== 'all' ? packages?.find(p => p.id === packageFilter)?.name : undefined,
        filterStatus: statusFilter.toUpperCase(),
      });
      toast.success("Manifest Keberangkatan berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh PDF.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-white border border-matcha-100 p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center text-white shadow-xl shadow-gold-500/20">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-black text-matcha-950 tracking-tight">Rekapitulasi Keberangkatan</h2>
              <p className="text-matcha-600 mt-1 font-medium">Monitoring data manifest dan kesiapan jemaah secara real-time.</p>
            </div>
          </div>
          <button 
            onClick={handleDownloadPdf}
            className="flex items-center space-x-3 px-8 py-4 bg-gold-500 text-white rounded-2xl hover:bg-gold-600 transition-all font-bold shadow-lg shadow-gold-500/30 active:scale-95 group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/50 backdrop-blur-xl border border-matcha-100 p-6 rounded-[2rem] shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2 p-1 bg-matcha-50 rounded-2xl w-fit">
          <button 
            onClick={() => setViewType('grouped')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewType === 'grouped' ? 'bg-white text-matcha-950 shadow-md' : 'text-matcha-400 hover:text-matcha-600'}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Grup Pemesanan
            </div>
          </button>
          <button 
            onClick={() => setViewType('individual')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${viewType === 'individual' ? 'bg-white text-matcha-950 shadow-md' : 'text-matcha-400 hover:text-matcha-600'}`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Manifest Individu (Pax)
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-matcha-400 group-focus-within:text-gold-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari Nama/ID/Pax..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer font-semibold text-matcha-800"
          >
            <option value="active">Jemaah Aktif (Semua)</option>
            <option value="lunas">Hanya Lunas & Berangkat</option>
            <option value="all">Seluruh Database (Inc. Draft)</option>
          </select>

          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer"
          >
            <option value="all">Pilih Paket Umroh/Haji</option>
            {packages?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer"
          >
            <option value="all">Pilih Jadwal Keberangkatan</option>
            {schedules?.map(s => (
              <option key={s.id} value={s.id}>{s.departureDate} ({s.packageName})</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer"
          >
            <option value="all">Semua Jenis Paket</option>
            <option value="umroh">Umroh</option>
            <option value="haji">Haji</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer"
          >
            <option value="all">Semua Bulan</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-matcha-100 rounded-2xl focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all text-sm cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <div className="flex gap-2 lg:col-span-1">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-3 bg-white border border-matcha-100 rounded-2xl text-[10px] focus:ring-2 focus:ring-gold-500/10 outline-none"
              title="Tanggal Mulai"
            />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-3 bg-white border border-matcha-100 rounded-2xl text-[10px] focus:ring-2 focus:ring-gold-500/10 outline-none"
              title="Tanggal Akhir"
            />
          </div>

          <button 
            onClick={() => {
              setSearch('');
              setPackageFilter('all');
              setScheduleFilter('all');
              setStatusFilter('active');
              setMonthFilter('all');
              setYearFilter('all');
              setTypeFilter('all');
              setStartDate('');
              setEndDate('');
              refetch();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-matcha-950 text-white rounded-2xl hover:bg-black transition-all text-sm font-bold shadow-lg shadow-matcha-900/10"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reset & Segarkan</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {months.map((m, idx) => {
          const count = (registrations || []).filter(reg => {
            if (!reg.schedule?.departureDate) return false;
            const d = new Date(reg.schedule.departureDate);
            const matchesYear = yearFilter === 'all' || d.getFullYear().toString() === yearFilter;
            return d.getMonth() === parseInt(m.value) && matchesYear;
          }).reduce((sum, reg) => sum + (Array.isArray(reg.paxData) ? reg.paxData.length : 1), 0);

          if (count === 0) return null;

          return (
            <button
              key={m.value}
              onClick={() => setMonthFilter(m.value)}
              className={`p-4 rounded-3xl border transition-all text-left group ${
                monthFilter === m.value 
                  ? 'bg-gold-500 border-gold-400 text-white shadow-lg shadow-gold-500/20' 
                  : 'bg-white border-matcha-100 hover:border-gold-300 text-matcha-900'
              }`}
            >
              <p className={`text-[10px] font-black uppercase tracking-widest ${monthFilter === m.value ? 'text-gold-100' : 'text-matcha-400'}`}>
                {m.label}
              </p>
              <div className="flex items-end justify-between mt-1">
                <span className="text-2xl font-serif font-black">{count}</span>
                <span className={`text-[10px] font-bold ${monthFilter === m.value ? 'text-gold-100' : 'text-matcha-400'}`}>Pax</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-matcha-100 rounded-[2rem] shadow-xl shadow-matcha-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-matcha-50/50 border-b border-matcha-100">
                <th className="p-5 text-xs font-black text-matcha-500 uppercase tracking-widest pl-10">
                  {viewType === 'grouped' ? 'Identitas Jemaah / Pemesan' : 'Nama Lengkap Jamaah'}
                </th>
                <th className="p-5 text-xs font-black text-matcha-500 uppercase tracking-widest text-center">
                  {viewType === 'grouped' ? 'Detail Rencana Perjalanan' : 'Paket & Jadwal'}
                </th>
                {viewType === 'individual' && (
                  <th className="p-5 text-xs font-black text-matcha-500 uppercase tracking-widest text-center">
                    Tgl Keberangkatan
                  </th>
                )}
                <th className="p-5 text-xs font-black text-matcha-500 uppercase tracking-widest text-center">
                  {viewType === 'grouped' ? 'Informasi Kontak' : 'Data Pendukung (NIK/WA)'}
                </th>
                <th className="p-5 text-xs font-black text-matcha-500 uppercase tracking-widest text-center pr-10">Status & Progres</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={viewType === 'grouped' ? 4 : 5} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-matcha-600 font-black animate-pulse">Menghubungkan ke server...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan={viewType === 'grouped' ? 4 : 5} className="p-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="w-24 h-24 bg-matcha-50 rounded-full flex items-center justify-center">
                        <Search className="w-10 h-10 text-matcha-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-matcha-950 font-bold text-xl">Data Tidak Ditemukan</p>
                        <p className="text-matcha-500 max-w-xs mx-auto">Coba sesuaikan filter status atau kata kunci pencarian Anda.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : viewType === 'grouped' ? (
                filteredRegs.map((reg) => (
                  <React.Fragment key={reg.id}>
                    <tr 
                      className={`hover:bg-matcha-50/50 transition-all border-b border-matcha-5 last:border-0 group cursor-pointer ${expandedRegId === reg.id ? 'bg-matcha-50/80' : ''}`}
                      onClick={() => setExpandedRegId(expandedRegId === reg.id ? null : reg.id)}
                    >
                      <td className="p-5 pl-10">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center text-white font-black text-xl border-2 border-white shadow-xl group-hover:rotate-3 transition-transform">
                              {reg.ordererName?.[0] || reg.user?.name?.[0] || 'J'}
                            </div>
                            {reg.status === 'LUNAS' && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-matcha-950 text-lg leading-none mb-1">{reg.ordererName || reg.user?.name}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] bg-matcha-950 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm">REG-{reg.id.slice(0,8)}</span>
                              <span className="text-[10px] text-matcha-400 font-bold flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {Array.isArray(reg.paxData) ? reg.paxData.length : 1} Pax
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="flex items-center text-sm">
                            <Plane className="w-4 h-4 mr-2 text-gold-500 shrink-0" />
                            <span className="font-black text-matcha-900 tracking-tight">{reg.package?.name || 'Paket Terhapus'}</span>
                          </div>
                          <div className="flex items-center text-xs bg-gold-50 px-3 py-1 rounded-full border border-gold-100">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-gold-600 shrink-0" />
                            <span className={`font-black ${ (reg.schedule?.departureDate || reg.package?.departureDate) ? 'text-gold-700' : 'text-rose-500'}`}>
                              {reg.schedule?.departureDate 
                                ? new Date(reg.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                : reg.package?.departureDate
                                  ? new Date(reg.package.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                  : 'Belum Diatur'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-center justify-center space-y-1 text-center">
                          <p className="font-black text-matcha-800 flex items-center text-sm">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-matcha-400" />
                            {reg.ordererPhone || reg.user?.phone || '-'}
                          </p>
                          <p className="text-[11px] text-matcha-400 font-bold bg-matcha-50 px-2 py-0.5 rounded-lg border border-matcha-100 break-all">{reg.ordererEmail || reg.user?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="p-5 pr-10">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center space-x-3">
                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all group-hover:scale-105 ${
                              reg.status === 'LUNAS' ? 'bg-blue-500 text-white border-blue-400 shadow-blue-200' :
                              ['SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'].includes(reg.status) ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-200' :
                              reg.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {reg.status.replace(/_/g, ' ')}
                            </span>
                            {expandedRegId === reg.id ? (
                              <ChevronUp className="w-5 h-5 text-gold-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-matcha-300 group-hover:text-gold-500 transition-colors" />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Sub-row for Pax Data */}
                    <AnimatePresence>
                      {expandedRegId === reg.id && (
                        <motion.tr 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-matcha-50/30"
                        >
                          <td colSpan={4} className="p-0">
                            <div className="p-6 border-l-4 border-gold-500 ml-5 my-4 bg-white rounded-2xl shadow-inner">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 bg-matcha-50/50 p-6 rounded-3xl border border-matcha-100">
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 text-matcha-900 font-black text-xs uppercase tracking-wider">
                                    <Plane className="w-4 h-4 text-gold-500" />
                                    <span>Detail Rencana Perjalanan</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-matcha-100 shadow-sm">
                                    <p className="text-[10px] text-matcha-400 font-bold uppercase mb-1">Paket Terpilih</p>
                                    <p className="text-sm font-black text-matcha-950">{reg.package?.name}</p>
                                    <div className="mt-3 flex items-center text-xs font-bold text-gold-600 bg-gold-50 px-3 py-1.5 rounded-xl border border-gold-100 w-fit">
                                      <Calendar className="w-3.5 h-3.5 mr-2" />
                                      Berangkat: {reg.schedule?.departureDate 
                                        ? new Date(reg.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                        : reg.package?.departureDate
                                          ? new Date(reg.package.departureDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                                          : 'Menunggu Jadwal'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 text-matcha-900 font-black text-xs uppercase tracking-wider">
                                    <Info className="w-4 h-4 text-gold-500" />
                                    <span>Status Keberangkatan</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-matcha-100 shadow-sm">
                                    <p className="text-[10px] text-matcha-400 font-bold uppercase mb-1">Kesiapan Dokumen</p>
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2 h-2 rounded-full ${reg.hasRequiredDocs ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                      <span className="text-xs font-bold text-matcha-700">{reg.hasRequiredDocs ? 'Dokumen Lengkap' : 'Dokumen Belum Lengkap'}</span>
                                    </div>
                                    <div className="mt-3">
                                      <p className="text-[10px] text-matcha-400 font-bold uppercase mb-1">Status Pembayaran</p>
                                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${reg.paymentProgress || 0}%` }}></div>
                                      </div>
                                      <p className="text-[10px] font-black text-emerald-600 mt-1 text-right">{reg.paymentProgress || 0}% Lunas</p>
                                    </div>
                                  </div>
                                </div>
 
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 text-matcha-900 font-black text-xs uppercase tracking-wider">
                                    <MapPin className="w-4 h-4 text-gold-500" />
                                    <span>Lokasi & Kontak</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-matcha-100 shadow-sm">
                                    <p className="text-[10px] text-matcha-400 font-bold uppercase mb-1">Alamat Pemesan</p>
                                    <p className="text-xs font-bold text-matcha-800 line-clamp-2">{reg.user?.phone || reg.ordererPhone || '-'}</p>
                                    <p className="text-[10px] text-matcha-500 mt-1 italic">{reg.user?.email || reg.ordererEmail || '-'}</p>
                                  </div>
                                  {reg.manifests && reg.manifests.length > 0 && (
                                    <div className="bg-gold-50 p-4 rounded-2xl border border-gold-100 shadow-sm mt-2">
                                      <div className="flex items-center gap-2 mb-2 text-gold-700 font-black text-[10px] uppercase">
                                        <Plane className="w-3 h-3" /> Transport & Akomodasi
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-gold-200">
                                           <p className="text-[8px] text-gray-400 font-black uppercase">Bus</p>
                                           <p className="text-[10px] font-black">{reg.manifests[0].busNumber || '-'}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-gold-200">
                                           <p className="text-[8px] text-gray-400 font-black uppercase">Kamar</p>
                                           <p className="text-[10px] font-black">{reg.manifests[0].hotelRoom || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
 
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-5 h-5 text-gold-600" />
                                  <h4 className="text-sm font-black text-matcha-900 uppercase tracking-wider">Manifest Jemaah ({Array.isArray(reg.paxData) ? reg.paxData.length : 0} Orang)</h4>
                                </div>
                                <div className="text-[10px] font-bold text-matcha-400 italic">
                                  Dipesan oleh: {reg.ordererName || reg.user?.name}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.isArray(reg.paxData) && reg.paxData.map((pax, idx) => (
                                  <div key={idx} className="bg-matcha-50/50 p-4 rounded-xl border border-matcha-100 flex items-start space-x-4 hover:shadow-md transition-shadow">
                                    <div className="w-8 h-8 rounded-full bg-matcha-900 text-white flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <div className="flex justify-between items-start">
                                        <p className="font-black text-matcha-950 text-sm uppercase">{pax.fullName || 'Tanpa Nama'}</p>
                                        <span className="text-[9px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-bold">{pax.gender || '-'}</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-matcha-600 font-medium">
                                        <div className="flex items-center">
                                          <Fingerprint className="w-3 h-3 mr-1 text-matcha-400" />
                                          NIK: {pax.nik || '-'}
                                        </div>
                                        <div className="flex items-center">
                                          <Phone className="w-3 h-3 mr-1 text-matcha-400" />
                                          WA: {pax.phone || '-'}
                                        </div>
                                        <div className="flex items-center col-span-2">
                                          <MapPin className="w-3 h-3 mr-1 text-matcha-400" />
                                          {pax.address || '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {(!Array.isArray(reg.paxData) || reg.paxData.length === 0) && (
                                  <div className="col-span-2 py-4 text-center text-matcha-400 italic text-xs">
                                    Data jemaah belum diisi lengkap.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                filteredRegs.flatMap(reg => 
                  (Array.isArray(reg.paxData) && reg.paxData.length > 0 ? reg.paxData : [{ fullName: reg.ordererName || reg.user?.name, nik: '-', phone: '-' }]).map((pax, pIdx) => (
                    <tr key={`${reg.id}-${pIdx}`} className="hover:bg-matcha-50/50 transition-all border-b border-matcha-5 last:border-0 group">
                      <td className="p-5 pl-10">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold text-sm">
                            {pax.fullName?.[0] || 'J'}
                          </div>
                          <div>
                            <p className="font-black text-matcha-950 text-sm uppercase">{pax.fullName || 'Tanpa Nama'}</p>
                            <p className="text-[10px] text-matcha-400 font-bold">Group: {reg.ordererName || reg.user?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-center justify-center space-y-2 text-center">
                          <span className="text-sm font-black text-matcha-900">{reg.package?.name}</span>
                          <div className="text-[10px] text-matcha-400 font-bold uppercase tracking-wider">
                            {reg.package?.type || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center">
                          <div className="flex items-center text-xs bg-gold-50 px-4 py-1.5 rounded-xl border border-gold-100 text-gold-700 font-black shadow-sm">
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            { (reg.schedule?.departureDate || reg.package?.departureDate)
                              ? new Date(reg.schedule?.departureDate || reg.package?.departureDate || '').toLocaleDateString('id-ID', { dateStyle: 'medium' })
                              : 'TBA'}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-center justify-center space-y-1 text-center">
                          <p className="text-xs font-black text-matcha-800">NIK: {pax.nik || '-'}</p>
                          <p className="text-[10px] text-matcha-400">WA: {pax.phone || '-'}</p>
                        </div>
                      </td>
                      <td className="p-5 pr-10">
                        <div className="flex justify-center">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            reg.status === 'LUNAS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ['SIAP_BERANGKAT', 'BERANGKAT', 'SELESAI'].includes(reg.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {reg.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-matcha-50/30 p-5 border-t border-matcha-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-matcha-500">
          <div className="flex items-center space-x-6">
            <p>TOTAL DATA: <span className="text-gold-600 text-sm">{filteredRegs.length}</span> PEMESANAN</p>
            <p>TOTAL JEMAAH: <span className="text-gold-600 text-sm">{totalPax}</span> ORANG</p>
            {monthFilter !== 'all' && (
              <p className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100">
                BULAN {months[parseInt(monthFilter)].label.toUpperCase()}: <span className="text-sm">{monthlyPax}</span> JEMAAH
              </p>
            )}
          </div>
          <p className="tracking-widest uppercase opacity-50">Sistem Rekapitulasi Otomatis &bull; Golden Travel</p>
        </div>
      </div>
    </div>
  );
};
