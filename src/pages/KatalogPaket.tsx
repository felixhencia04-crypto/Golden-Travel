import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  RotateCcw, 
  LogOut, 
  ChevronRight,
  CircleDot,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

export default function KatalogPaket() {
  const navigate = useNavigate();
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await api.get('/packages');
        setPackages(data);
      } catch (error) {
        console.error("Failed to fetch packages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handlePilihPaket = (pkg: any) => {
    setSelectedPkgId(pkg.id);
    setTimeout(() => {
      navigate('/dashboard?packageId=' + pkg.id);
    }, 800); 
  };

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
            <h1 className="text-white font-bold text-lg leading-tight">PT Golden Tour Haromain</h1>
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

          <button className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium hover:text-white hover:bg-gray-800 transition-colors">
            <User className="w-5 h-5" />
            Biodata & Paspor
          </button>
        </div>

        {/* Menu Bawah */}
        <div className="p-6 border-t border-gray-800 space-y-3">
          <button className="w-full flex items-center gap-3 text-sm font-medium text-yellow-600 hover:text-yellow-500 transition-colors">
            <RotateCcw className="w-5 h-5" />
            Reset Simulasi
          </button>
          <button className="w-full flex items-center gap-3 text-sm font-medium text-red-500 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Area Konten Utama (Kanan) */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Judul Halaman */}
          <header className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Pilih paket perjalanan Umroh atau Haji terbaik untuk Anda dan keluarga
            </h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Temukan paket yang sesuai dengan kebutuhan ibadah Anda.
            </p>
          </header>

          {/* Grid Cards (Paket) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Memuat paket perjalanan...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-500">
                <p>Belum ada paket yang tersedia saat ini.</p>
              </div>
            ) : packages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              const displayTitle = pkg.name || pkg.title;
              const displayImage = pkg.imageUrl || pkg.image || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80';
              const displayDesc = typeof pkg.description === 'string' ? pkg.description : (Array.isArray(pkg.description) ? pkg.description.join(', ') : 'Deskripsi tidak tersedia');

              return (
                <div 
                  key={pkg.id} 
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 ${
                    isSelected 
                      ? 'border-yellow-500 ring-2 ring-yellow-500/30 -translate-y-1' 
                      : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  {/* Bagian Gambar Utama */}
                  <div className="h-48 bg-gray-200 relative">
                    <img 
                      src={displayImage} 
                      alt={displayTitle} 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge Durasi */}
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded shadow-sm">
                      {pkg.duration}
                    </div>

                    {/* Gradient Overlay & Judul */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                      <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
                        {displayTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Body & Deskripsi */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                      {displayDesc}
                    </p>

                    {/* Harga & Kuota */}
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                          Harga Mulai
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-yellow-600">
                            Rp {(Number(pkg.price) / 1000000).toLocaleString('id-ID')}jt
                          </span>
                          <span className="text-xs text-gray-400 font-medium">/pax</span>
                        </div>
                      </div>
                      
                      {/* Sisa Kuota */}
                      <div className="bg-red-50 px-2.5 py-1 rounded border border-red-100">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                          Sisa Kuota: {pkg.remainingSeats ?? pkg.quota} Seat
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi (Full width) */}
                    <button
                      onClick={() => handlePilihPaket(pkg)}
                      disabled={isSelected}
                      className={`w-full py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-500/50'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm'
                      }`}
                    >
                      {isSelected ? 'Ubah Jumlah Jamaah' : 'Pilih Paket Ini'}
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
