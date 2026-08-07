import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  RotateCcw, 
  LogOut, 
  ChevronRight,
  CircleDot,
  Loader2,
  RefreshCw,
  Star
} from 'lucide-react';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';

export default function KatalogPaket() {
  const navigate = useNavigate();
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'semua' | 'umroh' | 'haji'>('semua');

  const fetchPackages = useCallback(async () => {
    try {
      const data = await api.get('/packages');
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch packages", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useSocket(() => fetchPackages());

  const handlePilihPaket = (pkg: any) => {
    setSelectedPkgId(pkg.id);
    setTimeout(() => {
      navigate('/dashboard?packageId=' + pkg.id);
    }, 500); 
  };

  const filteredPackages = packages.filter(pkg => {
    if (!pkg) return false;
    const isAvail = pkg.isAvailable !== false && pkg.isAvailable !== 'false' && pkg.isAvailable !== 0 && pkg.isAvailable !== '0';
    if (!isAvail) return false;
    if (activeCategory === 'semua') return true;
    const pkgType = (pkg.type || 'umroh').toString().trim().toLowerCase();
    return pkgType === activeCategory;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* Sidebar Kiri (Dark Mode) */}
      <aside className="w-64 bg-gray-900 text-gray-400 flex flex-col hidden md:flex shrink-0">
        {/* Logo / Profil Sistem */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
            GT
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Golden Travel</h1>
            <p className="text-xs text-gray-500">Sistem Pendaftaran</p>
          </div>
        </div>

        {/* Menu Navigasi Vertikal */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          {/* Dropdown / Group: Pilih Paket */}
          <div className="pt-2 pb-1">
            <div className="px-6 flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                Pilih Paket
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
            </div>
            
            {/* Indikator Aktif: Katalog Paket */}
            <button className="w-full flex items-center gap-3 pl-14 pr-6 py-2.5 text-sm font-medium bg-gray-800 text-yellow-500 border-l-4 border-yellow-500 transition-colors">
              <CircleDot className="w-1.5 h-1.5 fill-current" />
              Katalog Paket
            </button>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium hover:text-white hover:bg-gray-800 transition-colors"
          >
            <User className="w-5 h-5" />
            Biodata & Paspor
          </button>
        </div>

        {/* Menu Bawah */}
        <div className="p-6 border-t border-gray-800 space-y-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 text-sm font-medium text-yellow-600 hover:text-yellow-500 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Kembali ke Portal
          </button>
        </div>
      </aside>

      {/* Area Konten Utama (Kanan) */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Filter */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Katalog Paket Umroh & Haji
              </h2>
              <p className="text-gray-500 mt-2 text-sm md:text-base max-w-2xl">
                Temukan paket perjalanan ibadah resmi terpercaya dari Golden Travel dengan akomodasi hotel bintang 5.
              </p>
            </div>

            {/* Filter Kategori */}
            <div className="flex bg-gray-200/80 p-1 rounded-2xl border border-gray-200/80 shrink-0">
              <button
                onClick={() => setActiveCategory('semua')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeCategory === 'semua'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveCategory('umroh')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeCategory === 'umroh'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Umroh
              </button>
              <button
                onClick={() => setActiveCategory('haji')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeCategory === 'haji'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Haji
              </button>
            </div>
          </div>

          {/* Grid Cards (Paket) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
                <p className="font-medium">Memuat katalog paket perjalanan...</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm p-8">
                <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-100 shadow-sm">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Paket Tersedia</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
                  {activeCategory === 'semua'
                    ? 'Saat ini belum ada paket perjalanan ibadah yang dipublikasikan.'
                    : `Belum ada paket ${activeCategory.toUpperCase()} yang tersedia. Coba beralih kategori.`}
                </p>
                <div className="flex justify-center gap-3">
                  {activeCategory !== 'semua' && (
                    <button
                      onClick={() => setActiveCategory('semua')}
                      className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-md"
                    >
                      Tampilkan Semua Paket
                    </button>
                  )}
                  <button
                    onClick={() => { setLoading(true); fetchPackages(); }}
                    className="inline-flex items-center px-5 py-2.5 bg-yellow-500 text-gray-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-yellow-600 transition-all shadow-md"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Muat Ulang
                  </button>
                </div>
              </div>
            ) : filteredPackages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              const displayTitle = pkg.name || pkg.title;
              const displayImage = pkg.imageUrl || pkg.image || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80';
              
              let descList: string[] = [];
              if (Array.isArray(pkg.description)) {
                descList = pkg.description;
              } else if (typeof pkg.description === 'string') {
                try {
                  const parsed = JSON.parse(pkg.description);
                  if (Array.isArray(parsed)) descList = parsed;
                  else descList = pkg.description.split('\n');
                } catch (e) {
                  descList = pkg.description.split('\n');
                }
              }

              return (
                <div 
                  key={pkg.id} 
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl ${
                    isSelected 
                      ? 'border-yellow-500 ring-2 ring-yellow-500/30 -translate-y-1' 
                      : 'border-gray-200'
                  }`}
                >
                  {/* Bagian Gambar Utama */}
                  <div className="h-52 bg-gray-100 relative overflow-hidden group">
                    <img 
                      src={displayImage} 
                      alt={displayTitle} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Badge Durasi & Kategori */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-white">
                        {pkg.duration}
                      </span>
                      <span className="bg-yellow-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        {pkg.type || 'Umroh'}
                      </span>
                    </div>

                    {/* Gradient Overlay & Judul */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                      <div className="flex items-center text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Premium Package
                      </div>
                      <h3 className="text-white font-black text-xl leading-tight">
                        {displayTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Body & Deskripsi */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-2 mb-6 flex-1">
                      {descList.filter(d => d && d.trim()).slice(0, 4).map((line, idx) => (
                        <div key={idx} className="flex items-start text-xs text-gray-600 font-medium">
                          <span className="text-yellow-500 mr-2 font-bold">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>

                    {/* Harga & Kuota */}
                    <div className="flex items-end justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-5">
                      <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Investasi Ibadah
                        </span>
                        <p className="text-xl font-black text-gray-900 tracking-tight">
                          Rp {Number(pkg.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      
                      {/* Sisa Kuota */}
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          Sisa Seat
                        </span>
                        <span className="inline-block text-xs font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          {pkg.remainingSeats ?? pkg.quota ?? 45} Pax
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi (Full width) */}
                    <button
                      onClick={() => handlePilihPaket(pkg)}
                      disabled={isSelected}
                      className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-md shadow-yellow-500/20 active:scale-95'
                      }`}
                    >
                      {isSelected ? 'Mengarahkan ke Dashboard...' : 'Pilih Paket Ini'}
                      {!isSelected && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
