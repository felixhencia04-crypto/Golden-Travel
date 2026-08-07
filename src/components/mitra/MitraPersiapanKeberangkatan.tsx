import React, { useState, useEffect } from 'react';
import { 
  Plane, ChevronDown, MessageCircle, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { filterJamaahForCurrentMitra, getScopedKey } from '../../utils/mitraStorage';

interface MitraPersiapanKeberangkatanProps {
  jamaahList: any[];
  onRefresh?: () => void;
}

export default function MitraPersiapanKeberangkatan({ jamaahList, onRefresh }: MitraPersiapanKeberangkatanProps) {
  const [realJamaahList, setRealJamaahList] = useState<any[]>([]);

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('mitra_jamaah_database');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = filterJamaahForCurrentMitra(parsed);
            if (filtered.length > 0) {
              setRealJamaahList(filtered);
              return;
            }
          }
        }

        // Check scoped pax list
        const scopedKey = getScopedKey('mitra_saved_pax_list');
        const savedPax = localStorage.getItem(scopedKey);
        if (savedPax) {
          const parsedPax = JSON.parse(savedPax);
          if (Array.isArray(parsedPax) && parsedPax.length > 0) {
            setRealJamaahList(parsedPax.filter(j => j.userName && j.userName.trim() !== ''));
            return;
          }
        }
      } catch (e) {}

      if (jamaahList && jamaahList.length > 0) {
        setRealJamaahList(filterJamaahForCurrentMitra(jamaahList));
      } else {
        setRealJamaahList([]);
      }
    };

    loadData();

    const handleSync = () => {
      loadData();
      if (onRefresh) onRefresh();
    };

    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [jamaahList, onRefresh]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedJamaah = realJamaahList[selectedIndex] || realJamaahList[0];

  const isItemTaken = (key: string) => {
    if (!selectedJamaah) return true;
    const eq = selectedJamaah.equipment;
    if (!eq) return true;
    if (key === 'koper') return eq.koper !== false && eq.koperTas !== false;
    if (key === 'ihram') return eq.ihram !== false && eq.kainIhram !== false;
    if (key === 'batik') return eq.batik !== false && eq.seragamBatik !== false;
    return true;
  };

  const getOfficerName = (key: string) => {
    if (selectedJamaah?.equipmentOfficers?.[key]) {
      return selectedJamaah.equipmentOfficers[key];
    }
    return selectedJamaah?.petugas || 'budi';
  };

  const distributionItems = [
    {
      id: 'koper',
      icon: '🧳',
      title: 'Koper & Tas Travel',
      desc: 'Koper Bagasi 24", Kabin 20", Tas Paspor & ID Card',
      taken: isItemTaken('koper'),
      petugas: getOfficerName('koper')
    },
    {
      id: 'ihram',
      icon: '🕋',
      title: 'Set Kain Ihram & Sabuk',
      desc: 'Set Kain Ihram Katun (2 Pcs) & Sabuk',
      taken: isItemTaken('ihram'),
      petugas: getOfficerName('ihram')
    },
    {
      id: 'batik',
      icon: '👔',
      title: 'Seragam Batik & Buku Doa',
      desc: 'Kain Batik Seragam Official & Buku Panduan Doa',
      taken: isItemTaken('batik'),
      petugas: getOfficerName('batik')
    }
  ];

  const takenCount = distributionItems.filter(i => i.taken).length;
  const totalCount = distributionItems.length;
  const progressPercent = Math.round((takenCount / totalCount) * 100);

  const handleInformJamaahWA = () => {
    if (!selectedJamaah) return;

    const name = selectedJamaah.userName || 'Jemaah';
    const phone = selectedJamaah.phone || selectedJamaah.phoneNumber || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const message = `Assalamu'alaikum Wr. Wb. Bp/Ibu *${name}*,

Berikut informasi update status penyerahan kelengkapan distribusi Umroh Anda dari *PT. Golden Tour Haramain*:

${distributionItems.map(item => `${item.taken ? '[✓]' : '[ ]'} *${item.title}*: ${item.taken ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'} (Petugas: ${item.petugas})`).join('\n')}

*Status Progres Distribusi:* ${progressPercent}% Selesai

Terima kasih. Semoga ibadah umroh berjalan lancar dan mabrur. 🤲
*PT. Golden Tour Haramain*`;

    if (waPhone) {
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');
      toast.success(`Membuka WhatsApp untuk mengirim pesan ke ${name}`);
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Pesan informasi berhasil disalin ke clipboard! Silakan kirimkan ke jemaah.');
    }
  };

  const handleCopyInfo = () => {
    if (!selectedJamaah) return;
    const name = selectedJamaah.userName || 'Jemaah';
    const message = `Informasi Kelengkapan Umroh - Bp/Ibu ${name}:
- Koper & Tas Travel: ${isItemTaken('koper') ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'} (Petugas: ${getOfficerName('koper')})
- Set Kain Ihram & Sabuk: ${isItemTaken('ihram') ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'} (Petugas: ${getOfficerName('ihram')})
- Seragam Batik & Buku Doa: ${isItemTaken('batik') ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL'} (Petugas: ${getOfficerName('batik')})
Progress Distribusi: ${progressPercent}%`;

    navigator.clipboard.writeText(message);
    toast.success('Ringkasan informasi kelengkapan berhasil disalin!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Jamaah Selector & Inform Action */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 font-bold">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Jamaah Binaan</div>
            <div className="relative mt-1">
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="w-full md:w-80 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer pr-10"
              >
                {realJamaahList.map((j, idx) => (
                  <option key={j.id || idx} value={idx}>
                    {j.userName || j.name || `Jamaah ${idx + 1}`} ({j.packageName || 'Paket Umroh'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleCopyInfo}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-black rounded-xl transition-all flex items-center gap-2"
            title="Salin Rincian Kelengkapan"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Salin Text</span>
          </button>
          
          <button
            onClick={handleInformJamaahWA}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            INFORMASIKAN KE JEMAAH
          </button>
        </div>
      </div>

      {/* Main Container matching user screenshot */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        {/* Progress Bar Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 tracking-wider uppercase">
              KELENGKAPAN DISTRIBUSI
            </span>
            <span className="text-sm font-black text-emerald-800">
              {progressPercent}%
            </span>
          </div>

          {/* Green Progress Bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div 
              className="h-full bg-emerald-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Equipment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {distributionItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#f2faf5] border border-emerald-200/80 rounded-[1.75rem] p-6 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Card Top Content */}
              <div className="space-y-3">
                {/* Graphic Icon */}
                <div className="w-12 h-12 text-2xl flex items-center justify-center bg-white rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Card Bottom Status & Officer */}
              <div className="pt-3 border-t border-emerald-100/60 space-y-1.5">
                <div>
                  {item.taken ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-800 text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-emerald-200">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> SUDAH DIAMBIL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100/90 text-amber-800 text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-amber-200">
                      BELUM DIAMBIL
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 italic font-medium pt-1">
                  Petugas: <span className="text-slate-600 not-italic font-bold">{item.petugas}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
