import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Search, Download, Share2, Sparkles, X, 
  Calendar, MapPin, RefreshCw, Eye, Heart, User, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { getActiveMitraInfo } from '../../utils/mitraStorage';

interface MitraKenanganProps {
  jamaahList?: any[];
}

export default function MitraKenangan({ jamaahList = [] }: MitraKenanganProps) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeLightBox, setActiveLightBox] = useState<any | null>(null);

  const isDummyMemory = (m: any) => {
    if (!m) return true;
    const idStr = String(m.id || '');
    if (idStr.startsWith('10000000-0000-4000-8000-00000000000')) return true;
    const titleLower = String(m.title || '').toLowerCase();
    if (
      titleLower.includes('thawaf wada jemaah golden tour') || 
      titleLower.includes('ziarah raudhah & masjid nabawi') || 
      titleLower.includes('manasik umroh bersama pembimbing syariah')
    ) {
      return true;
    }
    return false;
  };

  const fetchMemories = () => {
    setLoading(true);
    try {
      const storedStr = localStorage.getItem('golden_mitra_memories');
      let localMemories: any[] = [];
      if (storedStr) {
        try {
          localMemories = JSON.parse(storedStr);
        } catch (e) {}
      }

      // Filter out any dummy seed items
      localMemories = (localMemories || []).filter(m => !isDummyMemory(m));

      // Fetch online memories API
      api.get('/memories').then(res => {
        if (Array.isArray(res)) {
          const cleanRes = res.filter((m: any) => !isDummyMemory(m));
          
          const mergedMap = new Map<string, any>();
          localMemories.forEach((lm: any) => {
            if (lm && lm.id) mergedMap.set(String(lm.id), lm);
          });
          cleanRes.forEach((am: any) => {
            if (am && am.id) {
              const existing = mergedMap.get(String(am.id));
              mergedMap.set(String(am.id), { ...existing, ...am });
            }
          });

          const finalMemories = Array.from(mergedMap.values());
          setMemories(finalMemories);
          localStorage.setItem('golden_mitra_memories', JSON.stringify(finalMemories));
        } else {
          setMemories(localMemories);
        }
      }).catch(() => {
        setMemories(localMemories);
      });

    } catch (e) {
      console.error('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();

    const handleSync = () => {
      fetchMemories();
    };

    window.addEventListener('golden_memories_updated', handleSync);
    window.addEventListener('storage', handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mitra_catalog_realtime');
      bc.onmessage = (e) => {
        if (e.data?.type === 'MEMORIES_UPDATED') {
          fetchMemories();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('golden_memories_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      if (bc) bc.close();
    };
  }, []);

  const handleShareMemory = (item: any) => {
    const shareText = `Assalamu'alaikum, kenangan indah perjalanan ibadah *${item.title}* (${item.packageName || 'Golden Travel'}).\nLihat momen perjalanan selengkapnya bersama kami!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleDownloadImage = (item: any) => {
    try {
      const link = document.createElement('a');
      link.href = item.imageUrl;
      link.download = `${(item.title || 'Momen').replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Foto momen berhasil diunduh!');
    } catch (e) {
      window.open(item.imageUrl, '_blank');
    }
  };

  const activeMitraInfo = getActiveMitraInfo();

  const filtered = memories.filter(m => {
    // Filter by target Mitra scoping if specified
    if (m.targetMitraName && m.targetMitraName !== 'all' && m.targetMitraName !== 'Semua Mitra / Publik') {
      const activeName = (activeMitraInfo.name || activeMitraInfo.email || activeMitraInfo.id || '').toLowerCase().trim();
      const activeEmail = (activeMitraInfo.email || '').toLowerCase().trim();
      const targetName = (m.targetMitraName || '').toLowerCase().trim();
      
      if (targetName === 'all' || targetName.includes('semua mitra')) {
        // Public / all mitras
      } else {
        const matchesName = activeName && (activeName.includes(targetName) || targetName.includes(activeName));
        const matchesEmail = activeEmail && (activeEmail.includes(targetName) || targetName.includes(activeEmail));
        
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }
    }

    const matchesSearch = !searchQuery || 
      (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.caption || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.targetJamaahName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> GALERI MOMEN BERKESAN
            </div>
            <h2 className="text-2xl sm:text-4xl font-playfair font-bold text-white leading-snug">
              Galeri Kenangan Perjalanan Ibadah
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed font-medium">
              Koleksi momen spiritual dan dokumentasi perjalanan ibadah jamaah bersama Golden Travel Haramain. Anda dapat membagikan momen ini langsung kepada calon jamaah.
            </p>
          </div>

          <button
            onClick={fetchMemories}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Galeri</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari momen kenangan atau nama lokasi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50/80"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Menampilkan <span className="text-emerald-900 font-black">{filtered.length}</span> Momen Dokumentasi
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold animate-pulse">
          Memuat galeri momen kenangan...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-playfair font-bold text-slate-800 text-base">Momen Belum Ditemukan</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Dokumentasi kenangan perjalanan yang diunggah oleh Admin akan otomatis muncul di halaman ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map(item => (
            <div 
              key={item.id} 
              className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setActiveLightBox(item)}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                    {item.packageName || 'Kenangan Umroh'}
                  </span>
                  {item.targetJamaahName && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-amber-300 font-bold text-[10px] border border-amber-400/40 backdrop-blur-md">
                      Jemaah: {item.targetJamaahName}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs font-bold">
                  <span className="flex items-center gap-1.5 opacity-90">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> {item.date}
                  </span>
                  <span className="p-2 rounded-xl bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all text-white">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-playfair font-bold text-slate-900 text-base group-hover:text-emerald-900 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 line-clamp-3">
                    {item.caption || 'Momen kebersamaan jamaah dalam perjalanan ibadah suci.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleDownloadImage(item)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Unduh Foto</span>
                  </button>
                  <button
                    onClick={() => handleShareMemory(item)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bagikan WA</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightBox && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="relative bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
            <button
              onClick={() => setActiveLightBox(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
              <img
                src={activeLightBox.imageUrl}
                alt={activeLightBox.title}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="p-6 bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  {activeLightBox.packageName || 'Momen Keberangkatan'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{activeLightBox.date}</span>
              </div>
              <h3 className="text-xl font-playfair font-bold text-white">{activeLightBox.title}</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">{activeLightBox.caption}</p>

              <div className="pt-3 flex items-center gap-3">
                <button
                  onClick={() => handleDownloadImage(activeLightBox)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh Ukuran Penuh
                </button>
                <button
                  onClick={() => handleShareMemory(activeLightBox)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-400" /> Bagikan via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
