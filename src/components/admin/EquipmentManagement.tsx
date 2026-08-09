import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Plus, Search, Filter, Luggage, UserCheck, 
  Download, FileText, AlertCircle, Sparkles, RefreshCw, X, Eye
} from 'lucide-react';
import { generateEquipmentReceiptPdf } from '../../utils/generateEquipmentReceiptPdf';

interface EquipmentManagementProps {
  consultations: any[];
  inventory: any[];
  handleUpdateInventory: (jamaahId: string, item: 'koper' | 'ihram' | 'mukena', currentStatus: any) => void;
  handleUpdateAssignee: (jamaahId: string, currentStatus: any, newAssignee: string) => void;
}

export default function EquipmentManagement({
  consultations,
  inventory,
  handleUpdateInventory,
  handleUpdateAssignee,
}: EquipmentManagementProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'PARTIAL' | 'PENDING'>('ALL');
  const [selectedJamaah, setSelectedJamaah] = useState<any | null>(null);

  // Local state for gender overrides
  const [genderOverrides, setGenderOverrides] = useState<Record<string, 'L' | 'P'>>(() => {
    try {
      const saved = localStorage.getItem('golden_travel_equipment_gender_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('golden_travel_equipment_gender_overrides', JSON.stringify(genderOverrides));
    } catch (e) {
      console.error(e);
    }
  }, [genderOverrides]);

  // Helper to determine gender ('L' or 'P')
  const getJamaahGender = (c: any): 'L' | 'P' => {
    if (c?.id && genderOverrides[c.id]) {
      return genderOverrides[c.id];
    }
    const g = String(c?.gender || c?.paxData?.[0]?.gender || c?.user?.gender || c?.jenisKelamin || '').toUpperCase();
    if (g.startsWith('L') || g.includes('PRIA') || g.includes('MALE') || g.includes('LAKI')) return 'L';
    if (g.startsWith('P') || g.includes('WANITA') || g.includes('FEMALE') || g.includes('PEREMPUAN')) return 'P';

    const title = String(c?.title || c?.salutation || c?.ordererTitle || c?.paxData?.[0]?.title || '').toLowerCase();
    if (title.includes('bpk') || title.includes('bapak') || title.includes('sdr') || title.includes('mr') || title.includes('h.')) return 'L';
    if (title.includes('ibu') || title.includes('sdri') || title.includes('mrs') || title.includes('ms') || title.includes('hj')) return 'P';

    const name = String(c?.name || '').toLowerCase();
    if (name.includes(' bin ') || name.endsWith(' bin')) return 'L';
    if (name.includes(' binti ') || name.endsWith(' binti')) return 'P';

    return 'L'; // Default
  };

  const toggleGender = (jamaahId: string, currentGender: 'L' | 'P') => {
    const nextGender = currentGender === 'L' ? 'P' : 'L';
    setGenderOverrides(prev => ({ ...prev, [jamaahId]: nextGender }));
  };

  // Filter valid consultations
  const filteredList = useMemo(() => {
    return consultations.filter(c => {
      if (c.status === 'none' || c.status === 'cancelled' || c.packageName === 'Belum Memilih Paket') return false;

      // Search filter
      const q = search.toLowerCase();
      const matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.packageName || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      // Gender filter
      const jamaahGender = getJamaahGender(c);
      if (genderFilter === 'L' && jamaahGender !== 'L') return false;
      if (genderFilter === 'P' && jamaahGender !== 'P') return false;

      // Status filter
      const status = inventory?.find(i => i.registrationId === c.id);
      const isKoper = Boolean(status?.koper);
      const isIhram = Boolean(status?.ihram);
      const isMukena = Boolean(status?.mukena);
      const count = [isKoper, isIhram, isMukena].filter(Boolean).length;

      if (statusFilter === 'COMPLETE' && count !== 3) return false;
      if (statusFilter === 'PARTIAL' && (count === 0 || count === 3)) return false;
      if (statusFilter === 'PENDING' && count !== 0) return false;

      return true;
    });
  }, [consultations, inventory, search, genderFilter, statusFilter, genderOverrides]);

  // Overall Statistics
  const validConsultations = consultations.filter(c => c.status !== 'none' && c.status !== 'cancelled' && c.packageName !== 'Belum Memilih Paket');

  const { totalJamaah, maleCount, femaleCount } = useMemo(() => {
    let total = 0;
    let male = 0;
    let female = 0;

    validConsultations.forEach(c => {
      const paxList = Array.isArray(c.paxData) && c.paxData.length > 0 ? c.paxData : [c];
      paxList.forEach((pax: any) => {
        total++;
        const g = String(pax?.gender || pax?.jenisKelamin || '').toUpperCase();
        const title = String(pax?.title || pax?.salutation || '').toLowerCase();
        const name = String(pax?.fullName || pax?.name || '').toLowerCase();

        let isMale = true;
        if (g.startsWith('L') || g.includes('PRIA') || g.includes('MALE') || g.includes('LAKI')) {
          isMale = true;
        } else if (g.startsWith('P') || g.includes('WANITA') || g.includes('FEMALE') || g.includes('PEREMPUAN')) {
          isMale = false;
        } else if (title.includes('bpk') || title.includes('bapak') || title.includes('sdr') || title.includes('mr') || title.includes('h.')) {
          isMale = true;
        } else if (title.includes('ibu') || title.includes('sdri') || title.includes('mrs') || title.includes('ms') || title.includes('hj')) {
          isMale = false;
        } else if (name.includes(' bin ') || name.endsWith(' bin')) {
          isMale = true;
        } else if (name.includes(' binti ') || name.endsWith(' binti')) {
          isMale = false;
        } else {
          isMale = getJamaahGender(c) === 'L';
        }

        if (isMale) {
          male++;
        } else {
          female++;
        }
      });
    });

    return { totalJamaah: total, maleCount: male, femaleCount: female };
  }, [validConsultations, genderOverrides]);

  const totalDistributed = validConsultations.reduce((acc, c) => {
    const status = inventory?.find(i => i.registrationId === c.id);
    return acc + (status?.koper ? 1 : 0) + (status?.ihram ? 1 : 0) + (status?.mukena ? 1 : 0);
  }, 0);
  const totalPossible = validConsultations.length * 3;
  const overallPercent = totalPossible > 0 ? Math.round((totalDistributed / totalPossible) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-matcha-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Luggage className="w-20 h-20 text-white" />
          </div>
          <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1">Total Jamaah Operasional</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black">{totalJamaah}</span>
            <span className="text-xs text-emerald-200 font-medium">Orang</span>
          </div>
          <p className="text-[11px] text-emerald-300 mt-2">Terdaftar Siap Berangkat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Jamaah Pria (♂)</p>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">Kain Ihram + Sabuk</span>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{maleCount} <span className="text-xs font-normal text-gray-600">Pria</span></p>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Penerima Set Ihram Katun & Sabuk</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Jamaah Wanita (♀)</p>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">Mukena + Bergo</span>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{femaleCount} <span className="text-xs font-normal text-gray-600">Wanita</span></p>
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Penerima Set Mukena & Bergo Seragam</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Progress Distribusi</p>
              <span className="text-xs font-bold text-emerald-700">{overallPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${overallPercent}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 font-medium">{totalDistributed} dari {totalPossible} item perlengkapan diserahkan</p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama jamaah / paket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Gender Filter Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setGenderFilter('ALL')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${genderFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Semua Gender
          </button>
          <button 
            onClick={() => setGenderFilter('L')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${genderFilter === 'L' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'}`}
          >
            <span>♂</span> Pria (Ihram)
          </button>
          <button 
            onClick={() => setGenderFilter('P')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${genderFilter === 'P' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-rose-600'}`}
          >
            <span>♀</span> Wanita (Mukena)
          </button>
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">Semua Status Perlengkapan</option>
            <option value="COMPLETE">Distribusi Lengkap (3 Item)</option>
            <option value="PARTIAL">Sebagian Terambil</option>
            <option value="PENDING">Belum Diambil (0 Item)</option>
          </select>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white shadow-md rounded-3xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="p-4 pl-6">Jamaah & Gender</th>
                <th className="p-4">Item 1: Koper & Tas</th>
                <th className="p-4">Item 2: Pakaian Ibadah Utama</th>
                <th className="p-4">Item 3: Seragam & Panduan</th>
                <th className="p-4">Approval Staf</th>
                <th className="p-4 pr-6 text-right">Aksi & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredList.map((c) => {
                const status = inventory?.find(i => i.registrationId === c.id);
                const gender = getJamaahGender(c);
                const isMale = gender === 'L';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Jamaah & Gender */}
                    <td className="p-4 pl-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate text-sm">{c.name || 'Tanpa Nama'}</p>
                          <p className="text-[11px] text-gray-600 truncate">{c.packageName}</p>
                          
                          {/* Gender Selector Badge */}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleGender(c.id, gender)}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                                isMale 
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200' 
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200'
                              }`}
                              title="Klik untuk mengubah gender jamaah"
                            >
                              <span className="mr-1 text-xs">{isMale ? '♂' : '♀'}</span>
                              <span>{isMale ? 'Pria (Laki-Laki)' : 'Wanita (Perempuan)'}</span>
                              <RefreshCw className="w-2.5 h-2.5 ml-1 opacity-60" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Item 1: Koper & Tas */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <button 
                          onClick={() => handleUpdateInventory(c.id, 'koper', status)}
                          className={`flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                            status?.koper 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {status?.koper ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                          <span>{status?.koper ? 'Koper Diserahkan' : 'Koper Pending'}</span>
                        </button>
                        <p className="text-[10px] text-gray-600 pl-1">Koper 24", 20" & Tas Paspor</p>
                      </div>
                    </td>

                    {/* Item 2: Pakaian Ibadah Utama (GENDERIZED!) */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <button 
                          onClick={() => handleUpdateInventory(c.id, 'ihram', status)}
                          className={`flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                            status?.ihram 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : isMale
                                ? 'bg-blue-50/60 text-blue-900 border-blue-200 hover:bg-blue-100'
                                : 'bg-rose-50/60 text-rose-900 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {status?.ihram ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                          <span>
                            {status?.ihram 
                              ? (isMale ? 'Kain Ihram Diserahkan' : 'Mukena Diserahkan')
                              : (isMale ? 'Ihram & Sabuk Pending' : 'Mukena & Bergo Pending')}
                          </span>
                        </button>
                        <p className="text-[10px] text-gray-600 pl-1 font-medium">
                          {isMale ? '• Set Kain Ihram (2pcs) & Sabuk' : '• Set Mukena & Bergo Seragam'}
                        </p>
                      </div>
                    </td>

                    {/* Item 3: Seragam Batik & Buku Doa */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <button 
                          onClick={() => handleUpdateInventory(c.id, 'mukena', status)}
                          className={`flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                            status?.mukena 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {status?.mukena ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />}
                          <span>{status?.mukena ? 'Seragam Diserahkan' : 'Seragam Pending'}</span>
                        </button>
                        <p className="text-[10px] text-gray-600 pl-1">Kain Batik & Buku Doa Manasik</p>
                      </div>
                    </td>

                    {/* Approval Staf */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {status?.assignee && (
                          <div className="w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 uppercase">
                            {status.assignee.charAt(0)}
                          </div>
                        )}
                        <input
                          type="text"
                          className="text-xs font-semibold text-gray-800 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-emerald-600 rounded-lg py-1 px-2.5 w-32 transition-all placeholder-gray-400"
                          placeholder="Nama staf..."
                          defaultValue={status?.assignee || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (status?.assignee || '')) {
                              handleUpdateAssignee(c.id, status, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJamaah(c)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer"
                          title="Lihat Detail Checklist & Handover"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => generateEquipmentReceiptPdf(c, status, gender)}
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                          title="Unduh Tanda Terima Perlengkapan (PDF)"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 text-emerald-200" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                    Tidak ada data perlengkapan jamaah yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Handover Detail Modal */}
      {selectedJamaah && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-matcha-900 text-white p-6 relative">
              <button 
                onClick={() => setSelectedJamaah(null)}
                className="absolute top-5 right-5 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <Luggage className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Rincian Tanda Terima Perlengkapan</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">{selectedJamaah.name || 'Jamaah Umroh'} • {selectedJamaah.packageName}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {(() => {
                const status = inventory?.find(i => i.registrationId === selectedJamaah.id);
                const gender = getJamaahGender(selectedJamaah);
                const isMale = gender === 'L';

                return (
                  <>
                    {/* Gender Banner */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isMale ? 'bg-blue-50/80 border-blue-200 text-blue-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{isMale ? '♂' : '♀'}</span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Kategori Perlengkapan Jamaah</p>
                          <p className="text-sm font-black">{isMale ? 'Jamaah Pria (Laki-Laki)' : 'Jamaah Wanita (Perempuan)'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGender(selectedJamaah.id, gender)}
                        className="px-3 py-1.5 bg-white shadow-xs rounded-xl text-xs font-bold border hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        Ubah ke {isMale ? 'Wanita (♀)' : 'Pria (♂)'}
                      </button>
                    </div>

                    {/* Item Checklist Breakdown */}
                    <div className="space-y-4">
                      {/* Item 1 */}
                      <div className={`p-4 rounded-2xl border transition-all ${status?.koper ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">🧳</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">1. Set Koper Utama & Tas Travel</h4>
                              <p className="text-xs text-gray-600 mt-0.5">• Koper Bagasi 24 Inch, Koper Kabin 20 Inch, Tas Paspor & Sling Bag ID Card</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${status?.koper ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'}`}>
                            {status?.koper ? 'Sudah Diserahkan' : 'Belum Diserahkan'}
                          </span>
                        </div>
                      </div>

                      {/* Item 2 (Gender-Specific) */}
                      <div className={`p-4 rounded-2xl border transition-all ${status?.ihram ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{isMale ? '🕋' : '🧕'}</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">
                                {isMale ? '2. Set Kain Ihram & Sabuk (Pria)' : '2. Set Mukena & Bergo (Wanita)'}
                              </h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {isMale 
                                  ? '• Set Kain Ihram Katun Premium (2 Lembar) & Sabuk Ihram Khusus' 
                                  : '• Set Mukena Premium Travel & Bergo / Kerudung Seragam Travel'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${status?.ihram ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'}`}>
                            {status?.ihram ? 'Sudah Diserahkan' : 'Belum Diserahkan'}
                          </span>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className={`p-4 rounded-2xl border transition-all ${status?.mukena ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">👔</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">3. Seragam Batik & Buku Panduan</h4>
                              <p className="text-xs text-gray-600 mt-0.5">• Kain Seragam Batik Official Jamaah, Buku Doa Manasik & Syal Travel</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${status?.mukena ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'}`}>
                            {status?.mukena ? 'Sudah Diserahkan' : 'Belum Diserahkan'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Staff & Date Info */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-700">Petugas / Staf Penyerah:</p>
                        <p className="text-gray-900 font-bold mt-0.5">{status?.assignee || 'Belum diisi staf'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => generateEquipmentReceiptPdf(selectedJamaah, status, gender)}
                        className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2 text-emerald-200" />
                        Cetak Tanda Terima (PDF)
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
