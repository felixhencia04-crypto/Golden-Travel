import React, { useState, useEffect } from 'react';
import { 
  Globe, Package, Image as ImageIcon, Video, Plus, Edit2, Trash2, 
  Search, Filter, ChevronRight, MapPin, Calendar, Clock, 
  CheckCircle2, AlertCircle, Save, X, Upload, Info, Hotel, Building2, ShieldCheck,
  List, Map as MapIcon, Utensils, Plane, Award, Tent, Sparkles, DollarSign, Layers, Tag,
  Users, FolderPlus, Link as LinkIcon, Eye
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface CMSManagerProps {
  workspaceId?: string;
  initialSubTab?: 'paket' | 'galeri' | 'video';
}


const notifyRealtimeCatalogChange = () => {
  try {
    const channel = new BroadcastChannel('golden_travel_updates');
    channel.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
    channel.close();
  } catch (e) {
    console.error('BroadcastChannel failed', e);
  }
};
export default function CMSManager({ workspaceId, initialSubTab = 'paket' }: CMSManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'paket' | 'galeri' | 'video'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelola Website</h2>
          <p className="text-sm text-gray-500">Content Management System untuk website utama</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveSubTab('paket')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'paket' 
                ? 'bg-gold-500 text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kelola Paket</span>
          </button>
          <button
            onClick={() => setActiveSubTab('galeri')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'galeri' 
                ? 'bg-gold-500 text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galeri Foto</span>
          </button>
          <button
            onClick={() => setActiveSubTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'video' 
                ? 'bg-gold-500 text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Galeri Video</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {activeSubTab === 'paket' && <CMSPackageList />}
        {activeSubTab === 'galeri' && <CMSGallery />}
        {activeSubTab === 'video' && <CMSVideoGallery />}
      </div>
    </div>
  );
}


// --- CONFIRM DIALOG COMPONENT ---
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Hapus", cancelText = "Batal", isDanger = true }: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl transform transition-all border border-gray-100">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20' : 'bg-gold-500 hover:bg-gold-600 text-gray-900'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function CMSPackageList() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'umroh' | 'haji'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/packages');
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Gagal mengambil data paket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/admin/packages/${deleteConfirmId}`);
      toast.success('Paket berhasil dihapus');
      notifyRealtimeCatalogChange();
      fetchPackages();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus paket');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const totalCount = packages.length;
  const umrohCount = packages.filter(p => p.type?.toLowerCase() === 'umroh' || !p.type).length;
  const hajiCount = packages.filter(p => p.type?.toLowerCase() === 'haji').length;

  const filteredPackages = packages.filter(pkg => {
    const pkgType = (pkg.type || 'umroh').toLowerCase();
    const matchCategory = activeCategory === 'all' 
      ? true 
      : activeCategory === 'haji' 
        ? pkgType === 'haji' 
        : (pkgType === 'umroh' || !pkgType);
    
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      (pkg.name && pkg.name.toLowerCase().includes(query)) ||
      (pkg.hotel && pkg.hotel.toLowerCase().includes(query)) ||
      (pkg.facilities && pkg.facilities.toLowerCase().includes(query));

    return matchCategory && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Paket"
        message="Apakah Anda yakin ingin menghapus paket ini? Data tidak dapat dikembalikan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Top Bar with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Katalog Paket Umroh & Haji</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Kelola seluruh paket umroh dan paket haji yang ditampilkan pada website utama
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setEditingPackage({ type: 'haji' });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Tent className="w-4 h-4 text-amber-200" />
            <span>+ Tambah Paket Haji</span>
          </button>

          <button 
            onClick={() => {
              setEditingPackage({ type: 'umroh' });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Paket Umroh</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/80 p-2 rounded-2xl border border-gray-200/80">
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Paket</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'all' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-700'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('umroh')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'umroh'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paket Umroh</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'umroh' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {umrohCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('haji')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === 'haji'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Tent className="w-3.5 h-3.5 text-amber-300" />
            <span>Paket Haji</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'haji' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-900 font-bold'
            }`}>
              {hajiCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari paket / hotel / fasilitas..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-800 text-base">
            Tidak ada {activeCategory === 'haji' ? 'Paket Haji' : activeCategory === 'umroh' ? 'Paket Umroh' : 'Paket'} ditemukan
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery ? `Tidak ada hasil pencarian untuk "${searchQuery}".` : 'Belum ada data paket untuk kategori ini. Buat paket baru dengan tombol di bawah.'}
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {activeCategory === 'haji' ? (
              <>
                <button
                  onClick={() => {
                    setEditingPackage({
                      type: 'haji',
                      name: 'Haji Furoda VIP (Visa Mujamalah - Tanpa Antre)',
                      price: '340000000',
                      duration: '25 Hari',
                      quota: 45,
                      waitingTime: 'Tanpa Antre (Langsung Berangkat)',
                      visaType: 'Visa Haji Mujamalah / Furoda Resmi',
                      airline: 'Saudia Airlines / Garuda Indonesia (Direct Flight)',
                      dpAmount: 'DP Rp 20.000.000',
                      hotelMakkah: 'MAYSAN AL-MASAER / PULLMAN ZAMZAM (Bintang 5)',
                      hotelMakkahDistance: '±100m dari Pelataran Masjidil Haram',
                      hotelMadinah: 'MIRAGE SALAM / GRAND PLAZA (Bintang 5)',
                      hotelMadinahDistance: '±100m dari Pelataran Masjid Nabawi',
                      facilities: 'Direct Flight Saudia, Visa Haji Mujamalah Resmi, Tenda VIP Mina & Arafah AC, Bus AC Executive, Konsumsi Fullboard Buffet, Muthawwif Berpengalaman, Kereta Cepat Haramain',
                      description: 'Visa Haji Mujamalah / Furoda Resmi Kerajaan Arab Saudi\nKeberangkatan Langsung Tanpa Masa Tunggu Siskohat\nAkomodasi Hotel Bintang 5 Dekat Pelataran Utama\nTenda Maktab VIP Arafah & Mina Ber-AC Super Nyaman\nBimbingan Manasik Haji Sesuai Sunnah oleh Ustadz Senior\nPenerbangan Langsung Direct Flight Tanpa Transit',
                      excludes: 'Pembuatan Paspor RI\nSuntik Vaksin Meningitis\nPengeluaran Pribadi & Dam/Hadyu'
                    });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-sm cursor-pointer"
                >
                  <Tent className="w-4 h-4 text-amber-200" />
                  <span>+ Buat Paket Haji Furoda VIP</span>
                </button>

                <button
                  onClick={() => {
                    setEditingPackage({
                      type: 'haji',
                      name: 'Haji Khusus / ONH Plus (Kemenag RI)',
                      price: '230000000',
                      duration: '25 Hari',
                      quota: 45,
                      waitingTime: 'Masa Tunggu ~5-7 Tahun (Siskohat Resmi)',
                      visaType: 'Visa Haji Kuota Resmi Kemenag RI',
                      airline: 'Saudia Airlines / Garuda Indonesia Direct',
                      dpAmount: 'DP Rp 10.000.000',
                      hotelMakkah: 'PULLMAN ZAMZAM / ANJUM MAKKAH (Bintang 5)',
                      hotelMakkahDistance: '±100m dari Pelataran Masjidil Haram',
                      hotelMadinah: 'GRAND PLAZA MADINAH (Bintang 5)',
                      hotelMadinahDistance: '±100m dari Pelataran Masjid Nabawi',
                      facilities: 'Visa Haji Resmi Kemenag, Hotel Bintang 5, Tenda AC Mina & Arafah, Konsumsi Fullboard Buffet, Bimbingan Ibadah Berkelanjutan',
                      description: 'Pendaftaran Resmi Siskohat Kemenag RI dengan Nomor Porsi\nMasa Tunggu Lebih Cepat Dibanding Haji Reguler (~5-7 Tahun)\nAkomodasi Hotel Bintang 5 Dekat Masjidil Haram & Nabawi\nTenda AC Nyaman di Arafah & Mina\nPelayanan Kesehatan & Pembimbing Ibadah Profesional',
                      excludes: 'Pembuatan Paspor RI\nSuntik Vaksin Meningitis\nPengeluaran Pribadi & Dam/Hadyu'
                    });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-amber-300 rounded-xl text-xs font-bold hover:bg-stone-900 transition-all shadow-sm cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>+ Buat Paket Haji Khusus (ONH Plus)</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingPackage({ type: 'umroh' });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Paket Umroh Baru</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const isHaji = (pkg.type || '').toLowerCase() === 'haji';
            return (
              <div 
                key={pkg.id} 
                className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col ${
                  isHaji ? 'border-amber-200/90 shadow-xs' : 'border-gray-200'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={pkg.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={pkg.name}
                  />
                  
                  {/* Action Buttons Top Right */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-white/90 hover:bg-white text-blue-600 rounded-xl shadow-md backdrop-blur-sm transition-all active:scale-95"
                      title="Edit Paket"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(pkg.id)}
                      className="p-2 bg-white/90 hover:bg-white text-red-600 rounded-xl shadow-md backdrop-blur-sm transition-all active:scale-95"
                      title="Hapus Paket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Badge Top Left */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 ${
                      isHaji 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 border border-amber-300' 
                        : 'bg-emerald-700 text-white'
                    }`}>
                      {isHaji ? <Tent className="w-3 h-3 text-stone-900" /> : <Award className="w-3 h-3 text-white" />}
                      <span>{isHaji ? 'Paket Haji' : 'Paket Umroh'}</span>
                    </span>
                  </div>

                  {/* Available / Full Booked Status Bottom Left */}
                  <div className="absolute bottom-3 left-3">
                    {pkg.isAvailable !== false ? (
                      <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tersedia ({pkg.remainingSeats ?? pkg.quota ?? 45} Seat)</span>
                      </span>
                    ) : (
                      <span className="bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm">
                        Full Booked
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {pkg.name}
                    </h4>

                    {/* Price Tag */}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`font-black text-lg ${isHaji ? 'text-amber-600' : 'text-emerald-600'}`}>
                        Rp {Number(pkg.price).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">/ pax</span>
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-2 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Durasi Paket:</span>
                        </div>
                        <span className="font-bold text-gray-800">{pkg.duration || '9 Hari'}</span>
                      </div>

                      {isHaji && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Masa Tunggu:</span>
                            </div>
                            <span className="font-bold text-amber-700 line-clamp-1">{pkg.waitingTime || 'Langsung Berangkat'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Jenis Visa:</span>
                            </div>
                            <span className="font-bold text-gray-800 line-clamp-1">{pkg.visaType || 'Visa Haji Resmi'}</span>
                          </div>
                        </>
                      )}

                      <div className="flex items-start gap-1.5 text-gray-500 pt-1 border-t border-gray-200/60">
                        <Hotel className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-gray-700 font-medium">
                          {pkg.hotelMakkah ? `${pkg.hotelMakkah} & ${pkg.hotelMadinah || 'Madinah'}` : (pkg.hotel || 'Hotel Bintang 5')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-400">
                      <List className="w-3.5 h-3.5 text-gray-400" />
                      <span>{pkg.itineraryCount || 0} Hari Itinerary</span>
                    </div>

                    <button 
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Detail & Itinerary</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CMSPackageModal 
          pkg={editingPackage} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPackages();
          }}
        />
      )}
    </div>
  );
}

function CMSPackageModal({ pkg, onClose, onSuccess }: { pkg: any, onClose: () => void, onSuccess: () => void }) {
  const initialHotel = pkg?.hotel || '';
  const hotelParts = initialHotel.split(',').map((s: string) => s.trim());

  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    type: pkg?.type || 'umroh',
    price: pkg?.price || '',
    duration: pkg?.duration || '9 Hari',
    imageUrl: pkg?.imageUrl || '',
    facilities: pkg?.facilities || '',
    hotel: pkg?.hotel || '',
    hotelMakkah: pkg?.hotelMakkah || hotelParts[0] || 'MAKKAH: MAYSAN AL-MASAER',
    hotelMakkahDistance: pkg?.hotelMakkahDistance || '±100m dari Pelataran',
    hotelMadinah: pkg?.hotelMadinah || hotelParts[1] || 'Hotel Pilihan Madinah',
    hotelMadinahDistance: pkg?.hotelMadinahDistance || '±100m dari Pelataran',
    waitingTime: pkg?.waitingTime || (pkg?.type === 'haji' ? 'Tanpa Antre (Langsung Berangkat)' : ''),
    visaType: pkg?.visaType || (pkg?.type === 'haji' ? 'Visa Haji Mujamalah / Furoda Resmi' : ''),
    airline: pkg?.airline || 'Saudia Airlines / Garuda Indonesia (Direct Flight)',
    dpAmount: pkg?.dpAmount || (pkg?.type === 'haji' ? 'DP Rp 10.000.000' : 'DP Rp 5.000.000'),
    excludes: Array.isArray(pkg?.excludes) ? pkg.excludes.join('\n') : (pkg?.excludes || ''),
    description: Array.isArray(pkg?.description) ? pkg.description.join('\n') : (pkg?.description || ''),
    quota: pkg?.quota || 45
  });

  const [itinerary, setItinerary] = useState<any[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'itinerary'>('info');

  useEffect(() => {
    if (pkg?.id) {
      fetchItinerary();
    }
  }, [pkg?.id]);

  const fetchItinerary = async () => {
    try {
      setLoadingItinerary(true);
      const data = await api.get(`/api/cms/packages/${pkg.id}/itinerary`);
      setItinerary(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch itinerary:', error);
    } finally {
      setLoadingItinerary(false);
    }
  };

  const applyHajiPreset = (presetType: 'furoda' | 'onh' | 'custom') => {
    if (presetType === 'furoda') {
      setFormData(prev => ({
        ...prev,
        name: 'Haji Furoda VIP (Visa Mujamalah - Tanpa Antre)',
        type: 'haji',
        price: '340000000',
        duration: '25 Hari',
        quota: 45,
        waitingTime: 'Tanpa Antre (Langsung Berangkat)',
        visaType: 'Visa Haji Mujamalah / Furoda Resmi',
        airline: 'Saudia Airlines / Garuda Indonesia (Direct Flight)',
        dpAmount: 'DP Rp 20.000.000',
        hotelMakkah: 'MAYSAN AL-MASAER / PULLMAN ZAMZAM (Bintang 5)',
        hotelMakkahDistance: '±100m dari Pelataran Masjidil Haram',
        hotelMadinah: 'MIRAGE SALAM / GRAND PLAZA (Bintang 5)',
        hotelMadinahDistance: '±100m dari Pelataran Masjid Nabawi',
        facilities: 'Direct Flight Saudia, Visa Haji Mujamalah Resmi, Tenda VIP Mina & Arafah AC, Bus AC Executive, Konsumsi Fullboard Buffet, Muthawwif Berpengalaman, Kereta Cepat Haramain',
        description: 'Visa Haji Mujamalah / Furoda Resmi Kerajaan Arab Saudi\nKeberangkatan Langsung Tanpa Masa Tunggu Siskohat\nAkomodasi Hotel Bintang 5 Dekat Pelataran Utama\nTenda Maktab VIP Arafah & Mina Ber-AC Super Nyaman\nBimbingan Manasik Haji Sesuai Sunnah oleh Ustadz Senior\nPenerbangan Langsung Direct Flight Tanpa Transit',
        excludes: 'Pembuatan Paspor RI\nSuntik Vaksin Meningitis\nPengeluaran Pribadi & Dam/Hadyu'
      }));
      toast.success('Preset Haji Furoda VIP berhasil diterapkan');
    } else if (presetType === 'onh') {
      setFormData(prev => ({
        ...prev,
        name: 'Haji Khusus / ONH Plus (Kemenag RI)',
        type: 'haji',
        price: '230000000',
        duration: '25 Hari',
        quota: 45,
        waitingTime: 'Masa Tunggu ~5-7 Tahun (Siskohat Resmi)',
        visaType: 'Visa Haji Kuota Resmi Kemenag RI',
        airline: 'Saudia Airlines / Garuda Indonesia Direct',
        dpAmount: 'DP Rp 10.000.000',
        hotelMakkah: 'PULLMAN ZAMZAM / ANJUM MAKKAH (Bintang 5)',
        hotelMakkahDistance: '±100m dari Pelataran Masjidil Haram',
        hotelMadinah: 'GRAND PLAZA MADINAH (Bintang 5)',
        hotelMadinahDistance: '±100m dari Pelataran Masjid Nabawi',
        facilities: 'Visa Haji Resmi Kemenag, Hotel Bintang 5, Tenda AC Mina & Arafah, Konsumsi Fullboard Buffet, Bimbingan Ibadah Berkelanjutan',
        description: 'Pendaftaran Resmi Siskohat Kemenag RI dengan Nomor Porsi\nMasa Tunggu Lebih Cepat Dibanding Haji Reguler (~5-7 Tahun)\nAkomodasi Hotel Bintang 5 Dekat Masjidil Haram & Nabawi\nTenda AC Nyaman di Arafah & Mina\nPelayanan Kesehatan & Pembimbing Ibadah Profesional',
        excludes: 'Pembuatan Paspor RI\nSuntik Vaksin Meningitis\nPengeluaran Pribadi & Dam/Hadyu'
      }));
      toast.success('Preset Haji Khusus / ONH Plus diterapkan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const computedHotel = `${formData.hotelMakkah || ''}${formData.hotelMadinah ? `, ${formData.hotelMadinah}` : ''}`;
      const payload = {
        ...formData,
        price: Number(formData.price),
        hotel: computedHotel,
        hotelMakkah: formData.hotelMakkah,
        hotelMakkahDistance: formData.hotelMakkahDistance,
        hotelMadinah: formData.hotelMadinah,
        hotelMadinahDistance: formData.hotelMadinahDistance,
        waitingTime: formData.waitingTime,
        visaType: formData.visaType,
        airline: formData.airline,
        dpAmount: formData.dpAmount,
        description: typeof formData.description === 'string' 
          ? formData.description.split('\n').filter((d: string) => d.trim() !== '')
          : formData.description,
        excludes: typeof formData.excludes === 'string'
          ? formData.excludes.split('\n').filter((d: string) => d.trim() !== '')
          : formData.excludes,
        itineraries: itinerary
      };

      if (pkg?.id) {
        await api.put(`/admin/packages/${pkg.id}`, payload);
        toast.success('Paket berhasil diperbarui');
        notifyRealtimeCatalogChange();
      } else {
        await api.post('/admin/packages', payload);
        toast.success('Paket berhasil ditambahkan');
        notifyRealtimeCatalogChange();
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHajiMode = formData.type === 'haji';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isHajiMode ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              isHajiMode ? 'bg-amber-500 text-stone-900 font-bold' : 'bg-emerald-600 text-white'
            }`}>
              {isHajiMode ? <Tent className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {pkg?.id ? `Edit ${isHajiMode ? 'Paket Haji' : 'Paket Umroh'}` : `Tambah ${isHajiMode ? 'Paket Haji' : 'Paket Umroh'} Baru`}
              </h3>
              <p className="text-xs text-gray-500">
                Lengkapi rincian paket perjalanan untuk ditampilkan pada website utama Golden Travel
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200/60 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
           <button 
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'info' 
                ? (isHajiMode ? 'border-amber-600 text-amber-800 bg-amber-50/50' : 'border-emerald-600 text-emerald-800 bg-emerald-50/50') 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
           >
             1. Informasi Utama & Fasilitas
           </button>
           {pkg?.id && (
             <button 
              type="button"
              onClick={() => setActiveTab('itinerary')}
              className={`px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'itinerary' 
                  ? (isHajiMode ? 'border-amber-600 text-amber-800 bg-amber-50/50' : 'border-emerald-600 text-emerald-800 bg-emerald-50/50') 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
             >
               2. Jadwal Itinerary Per Hari ({itinerary.length} Hari)
             </button>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'info' ? (
            <form id="pkg-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Category Selector Cards (Umroh vs Haji) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Pilih Kategori Perjalanan *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'umroh' })}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      formData.type === 'umroh'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.type === 'umroh' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">Paket Umroh</h5>
                      <p className="text-[11px] text-gray-500">Ibadah Umroh Regular & Plus</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        type: 'haji',
                        waitingTime: prev.waitingTime || 'Tanpa Antre (Langsung Berangkat)',
                        visaType: prev.visaType || 'Visa Haji Mujamalah / Furoda Resmi',
                        dpAmount: prev.dpAmount || 'DP Rp 10.000.000'
                      }));
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      formData.type === 'haji'
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      formData.type === 'haji' ? 'bg-amber-500 text-stone-900 font-bold' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Tent className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                        <span>Paket Haji</span>
                        <span className="bg-amber-200 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-black">KHUSUS</span>
                      </h5>
                      <p className="text-[11px] text-amber-800">Haji Furoda, Mujamalah & ONH Plus</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Presets Banner for Haji */}
              {isHajiMode && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Preset Cepat Form Paket Haji</span>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">Otomatisasi Form</span>
                  </div>
                  <p className="text-xs text-amber-900/80">
                    Klik tombol di bawah untuk langsung mengisi formulir dengan templat paket haji standar profesional:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => applyHajiPreset('furoda')}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Tent className="w-3.5 h-3.5 text-amber-200" />
                      <span>Haji Furoda VIP (Mujamalah)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHajiPreset('onh')}
                      className="px-3 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Haji Khusus / ONH Plus (Kemenag RI)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Basic Package Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Nama Paket *
                    </label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-bold text-gray-900"
                      placeholder={isHajiMode ? "Contoh: Haji Furoda VIP Direct Flight 2026" : "Contoh: Umroh Syawal Bintang 5 9 Hari"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Harga paket (Rp) *
                      </label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-bold text-emerald-700"
                        placeholder={isHajiMode ? "340000000" : "35000000"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Kuota / Seat *
                      </label>
                      <input 
                        type="number" 
                        value={formData.quota}
                        onChange={(e) => setFormData({...formData, quota: Number(e.target.value)})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-medium"
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Durasi Paket *
                      </label>
                      <input 
                        type="text" 
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-medium"
                        placeholder={isHajiMode ? "25 Hari" : "9 Hari"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                        Minimal DP / Uang Muka
                      </label>
                      <input 
                        type="text" 
                        value={formData.dpAmount}
                        onChange={(e) => setFormData({...formData, dpAmount: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-medium"
                        placeholder="DP Rp 10.000.000"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Additional Haji Fields if Haji mode */}
                  {isHajiMode && (
                    <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>Masa Tunggu / Antrean Haji *</span>
                        </label>
                        <input 
                          type="text" 
                          value={formData.waitingTime}
                          onChange={(e) => setFormData({...formData, waitingTime: e.target.value})}
                          required={isHajiMode}
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all outline-none text-xs font-medium"
                          placeholder="Contoh: Tanpa Antre (Langsung Berangkat)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Jenis Visa Haji *</span>
                        </label>
                        <input 
                          type="text" 
                          value={formData.visaType}
                          onChange={(e) => setFormData({...formData, visaType: e.target.value})}
                          required={isHajiMode}
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all outline-none text-xs font-medium"
                          placeholder="Contoh: Visa Haji Mujamalah / Furoda Resmi"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 text-amber-600" />
                          <span>Maskapai Penerbangan</span>
                        </label>
                        <input 
                          type="text" 
                          value={formData.airline}
                          onChange={(e) => setFormData({...formData, airline: e.target.value})}
                          className="w-full px-3.5 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all outline-none text-xs font-medium"
                          placeholder="Saudia Airlines / Garuda Indonesia"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Gambar Sampul Paket</label>
                    <div className="flex items-center space-x-4">
                      {formData.imageUrl && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, imageUrl: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="flex-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Accommodation Section - 2 Columns (Makkah & Madinah) */}
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Akomodasi Hotel Pilihan (2 Kolom Makkah & Madinah)</span>
                </div>
                <p className="text-xs text-stone-600">
                  Input akomodasi hotel di Makkah dan Madinah beserta lokasi/jarak relatif ke Masjidil Haram & Masjid Nabawi.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Makkah Hotel */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 shadow-xs">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase">
                      <Hotel className="w-4 h-4 text-amber-600" />
                      <span>Makkah Al-Mukarramah</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nama Hotel Makkah *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.hotelMakkah} 
                        onChange={e => setFormData({...formData, hotelMakkah: e.target.value})} 
                        className="w-full border-gray-200 rounded-xl bg-gray-50/60 border py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-xs font-medium"
                        placeholder="Contoh: MAYSAN AL-MASAER / PULLMAN ZAMZAM"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Jarak / Lokasi Makkah *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.hotelMakkahDistance} 
                        onChange={e => setFormData({...formData, hotelMakkahDistance: e.target.value})} 
                        className="w-full border-gray-200 rounded-xl bg-gray-50/60 border py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-xs font-medium"
                        placeholder="Contoh: ±100m dari Pelataran"
                      />
                    </div>
                  </div>

                  {/* Madinah Hotel */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 shadow-xs">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase">
                      <Hotel className="w-4 h-4 text-amber-600" />
                      <span>Madinah Al-Munawwarah</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nama Hotel Madinah *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.hotelMadinah} 
                        onChange={e => setFormData({...formData, hotelMadinah: e.target.value})} 
                        className="w-full border-gray-200 rounded-xl bg-gray-50/60 border py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-xs font-medium"
                        placeholder="Contoh: HOTEL PILIHAN / GRAND PLAZA"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Jarak / Lokasi Madinah *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.hotelMadinahDistance} 
                        onChange={e => setFormData({...formData, hotelMadinahDistance: e.target.value})} 
                        className="w-full border-gray-200 rounded-xl bg-gray-50/60 border py-2.5 px-3 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-xs font-medium"
                        placeholder="Contoh: ±100m dari Pelataran"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fasilitas Utama Section */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Fasilitas Utama Paket (Daftar Poin Keunggulan)</span>
                </label>
                <p className="text-xs text-stone-600">
                  Poin keunggulan utama paket ini akan tampil pada kartu paket & modal detail website. Pisahkan setiap fasilitas dengan koma (,).
                </p>
                <input 
                  type="text" 
                  value={formData.facilities}
                  onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-xs font-medium"
                  placeholder="Contoh: Direct Flight Saudia, Visa Resmi, Tenda AC VIP, Fullboard Buffet, Muthawwif Berpengalaman"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi Lengkap / Inklusi (Satu per baris)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none text-xs"
                  placeholder="Fasilitas Bintang 5&#10;Pesawat Saudi Airlines&#10;Muthawwif Berpengalaman"
                />
              </div>

              {/* Excludes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Belum Termasuk / Excludes (Satu per baris)</label>
                <textarea 
                  value={formData.excludes}
                  onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none text-xs"
                  placeholder="Pembuatan Paspor&#10;Vaksin Meningitis&#10;Pengeluaran Pribadi"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                   <MapIcon className="w-5 h-5 text-amber-500" />
                   Rincian Jadwal Perjalanan Per Hari
                </h4>
                <button 
                  type="button"
                  onClick={() => {
                    const nextDay = itinerary.length > 0 ? Math.max(...itinerary.map(i => i.day)) + 1 : 1;
                    setItinerary([...itinerary, { day: nextDay, title: '', description: '', location: '', meals: '' }]);
                  }}
                  className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition-all cursor-pointer"
                >
                  + Tambah Hari
                </button>
              </div>

              {itinerary.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500">Belum ada rincian itinerary.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itinerary.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-amber-500 text-gray-900 rounded-lg flex items-center justify-center font-black text-xs">
                              {item.day}
                            </span>
                            <input 
                              type="text" 
                              value={item.title}
                              onChange={(e) => {
                                const newItin = [...itinerary];
                                newItin[index].title = e.target.value;
                                setItinerary(newItin);
                              }}
                              className="bg-transparent border-b border-gray-300 focus:border-amber-500 outline-none text-xs font-bold py-1 w-64"
                              placeholder="Judul Agenda (contoh: Tiba di Jeddah & Transfer Madinah)"
                            />
                         </div>
                         <button 
                          type="button"
                          onClick={() => {
                            const newItin = itinerary.filter((_, i) => i !== index);
                            setItinerary(newItin);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea 
                          value={item.description}
                          onChange={(e) => {
                            const newItin = [...itinerary];
                            newItin[index].description = e.target.value;
                            setItinerary(newItin);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                          placeholder="Deskripsi kegiatan hari ini..."
                        />
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <input 
                                type="text"
                                value={item.location}
                                onChange={(e) => {
                                  const newItin = [...itinerary];
                                  newItin[index].location = e.target.value;
                                  setItinerary(newItin);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Lokasi"
                              />
                           </div>
                           <div className="flex items-center gap-2">
                              <Utensils className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <input 
                                type="text"
                                value={item.meals}
                                onChange={(e) => {
                                  const newItin = [...itinerary];
                                  newItin[index].meals = e.target.value;
                                  setItinerary(newItin);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                                placeholder="Konsumsi (contoh: Makan Pagi, Siang, Malam)"
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
          >
            Batal
          </button>

          <button 
            type="submit" 
            form="pkg-form"
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isHajiMode 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Paket Perjalanan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CMSGallery() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [formData, setFormData] = useState({
    title: '',
    location: 'Bandara / Hotel / Tanah Suci',
    jemaahCount: '45',
    category: 'keberangkatan',
    batchName: '',
    description: '',
    imageUrl: ''
  });
  const [previewImage, setPreviewImage] = useState('');

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/cms/gallery/photos');
      setPhotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      toast.error('Gagal mengambil data foto galeri');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const openAddModal = () => {
    setEditingPhoto(null);
    setUploadMode('file');
    setFormData({
      title: '',
      location: 'Bandara / Hotel / Tanah Suci',
      jemaahCount: '45',
      category: 'keberangkatan',
      batchName: 'Group Executive Bintang 5 Batch 08',
      description: 'Dokumentasi momen kebersamaan dan kekhusyukan jemaah PT. Golden Tour Haramain.',
      imageUrl: ''
    });
    setPreviewImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (photo: any) => {
    setEditingPhoto(photo);
    setUploadMode('url');
    setFormData({
      title: photo.title || '',
      location: photo.location || 'Bandara / Hotel / Tanah Suci',
      jemaahCount: photo.jemaahCount ? String(photo.jemaahCount) : '45',
      category: photo.category || 'keberangkatan',
      batchName: photo.batchName || '',
      description: photo.description || '',
      imageUrl: photo.imageUrl || ''
    });
    setPreviewImage(photo.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 15MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: base64,
        title: prev.title ? prev.title : file.name.split('.')[0]
      }));
      setPreviewImage(base64);
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = formData.imageUrl || previewImage;
    if (!finalImage) {
      toast.error('Silakan unggah foto atau masukkan URL foto');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        title: formData.title || 'Dokumentasi Keberangkatan Jemaah',
        location: formData.location || 'Bandara / Hotel / Tanah Suci',
        jemaahCount: Number(formData.jemaahCount) || 45,
        category: formData.category || 'keberangkatan',
        batchName: formData.batchName || '',
        description: formData.description || '',
        imageUrl: finalImage
      };

      if (editingPhoto) {
        await api.put(`/api/cms/gallery/photos/${editingPhoto.id}`, payload);
        toast.success('Foto dokumentasi berhasil diperbarui');
      } else {
        await api.post('/api/cms/gallery/photos', payload);
        toast.success('Foto dokumentasi berhasil ditambahkan');
      }

      setIsModalOpen(false);
      fetchPhotos();
      notifyRealtimeCatalogChange();
    } catch (error) {
      console.error('Failed to save photo:', error);
      toast.error('Gagal menyimpan foto dokumentasi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/api/cms/gallery/photos/${deleteConfirmId}`);
      toast.success('Foto dokumentasi berhasil dihapus');
      fetchPhotos();
      notifyRealtimeCatalogChange();
    } catch (error) {
      toast.error('Gagal menghapus foto');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredPhotos = photos.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'semua' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryBadges: Record<string, { label: string; color: string }> = {
    keberangkatan: { label: '✈️ Pelepasan Bandara', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    makkah: { label: '🕋 Makkah & Ka\'bah', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    madinah: { label: '🕌 Madinah & Nabawi', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    'vip-transport': { label: '🚆 Kereta Cepat & VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    ziarah: { label: '🏔️ City Tour & Ziarah', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  };

  const locationPresets = [
    'Bandara / Hotel / Tanah Suci',
    'Pelataran Masjidil Haram, Makkah',
    'Pelataran & Raudhah Masjid Nabawi, Madinah',
    'Terminal 3 International Soekarno-Hatta (CGK)',
    'Stasiun Kereta Cepat Haramain Madinah - Makkah',
    'Bukit Jabal Rahmah, Padang Arafah'
  ];

  return (
    <div className="p-6 space-y-6">
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Foto Dokumentasi"
        message="Apakah Anda yakin ingin menghapus foto ini dari galeri website utama?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-emerald-600" />
            <span>Galeri Foto Dokumentasi Jemaah</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Kelola foto, judul, lokasi (Bandara/Hotel/Tanah Suci), jumlah jemaah, kategori, dan deskripsi dokumentasi untuk website utama.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Dokumentasi Foto</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, lokasi, deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {[
            { id: 'semua', label: 'Semua' },
            { id: 'keberangkatan', label: 'Bandara' },
            { id: 'makkah', label: 'Makkah' },
            { id: 'madinah', label: 'Madinah' },
            { id: 'vip-transport', label: 'Transport' },
            { id: 'ziarah', label: 'Ziarah' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <FolderPlus className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">Belum ada foto dokumentasi</h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Klik tombol di bawah untuk menambahkan foto keberangkatan, lokasi bandara/hotel, dan informasi jemaah.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Foto Dokumentasi Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => {
            const badge = categoryBadges[photo.category] || { label: 'Dokumentasi', color: 'bg-gray-100 text-gray-800' };

            return (
              <div
                key={photo.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Thumbnail Container */}
                  <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title || 'Foto Galeri'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-sm backdrop-blur-md ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <button
                        onClick={() => openEditModal(photo)}
                        className="p-2.5 bg-white text-gray-900 hover:bg-emerald-500 hover:text-white rounded-xl shadow-lg transition-colors font-bold flex items-center gap-1.5 text-xs"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Data</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(photo.id)}
                        className="p-2.5 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-xl shadow-lg transition-colors font-bold flex items-center gap-1.5 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4 space-y-2.5">
                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/80 w-fit max-w-full truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{photo.location || 'Bandara / Hotel / Tanah Suci'}</span>
                    </div>

                    {/* Title / Judul Dokumentasi */}
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">
                      {photo.title || 'Dokumentasi Keberangkatan Jemaah'}
                    </h4>

                    {/* Description preview */}
                    {photo.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metadata & Action bar */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1 font-semibold text-gray-700">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>{photo.jemaahCount ?? 45} Jemaah</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(photo)}
                      className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Foto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(photo.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingPhoto ? 'Edit Foto Dokumentasi' : 'Tambah Foto Dokumentasi Baru'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Lengkapi informasi foto, lokasi (Bandara/Hotel/Tanah Suci), judul, dan jumlah jemaah.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Photo Input (Upload or URL) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Foto Dokumentasi *
                </label>
                
                <div className="flex items-center space-x-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      uploadMode === 'file'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      uploadMode === 'url'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Input Link URL Foto</span>
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="modal-file-upload"
                    />
                    <label htmlFor="modal-file-upload" className="cursor-pointer block space-y-2">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        Klik untuk memilih gambar dari perangkat Anda
                      </div>
                      <div className="text-[10px] text-gray-400">JPG, PNG, WEBP (Maksimal 15MB)</div>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
                        setPreviewImage(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                {/* Image Preview Box */}
                {(previewImage || formData.imageUrl) && (
                  <div className="mt-3 relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={previewImage || formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => toast.error('Gagal memuat URL foto preview')}
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-[10px] rounded-md font-mono">
                      Preview Foto
                    </div>
                  </div>
                )}
              </div>

              {/* Judul Dokumentasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Judul Dokumentasi / Nama Foto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Dokumentasi Pelepasan Jemaah Batch 8 di Bandara"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              {/* Lokasi (Bandara / Hotel / Tanah Suci) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Lokasi / Tag Tempat (misal: Bandara / Hotel / Tanah Suci) *
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Bandara / Hotel / Tanah Suci"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium mb-2"
                />

                {/* Quick Presets for Location */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-gray-400 self-center mr-1">Rekomendasi Tag:</span>
                  {locationPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location: preset }))}
                      className="px-2 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-600 rounded-md text-[11px] font-medium border border-gray-200 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 2 Column: Jumlah Jemaah & Kategori Momen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Jumlah Jemaah (Orang) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="45"
                      value={formData.jemaahCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, jemaahCount: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-bold text-gray-900"
                    />
                    <Users className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kategori Momen *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium bg-white"
                  >
                    <option value="keberangkatan">✈️ Pelepasan Bandara & Keberangkatan</option>
                    <option value="makkah">🕋 Makkah Al-Mukarramah & Ka'bah</option>
                    <option value="madinah">🕌 Madinah Munawwarah & Raudhah</option>
                    <option value="vip-transport">🚆 Kereta Cepat & VIP Transport</option>
                    <option value="ziarah">🏔️ City Tour & Ziarah Bersejarah</option>
                  </select>
                </div>
              </div>

              {/* Nama Rombongan / Batch (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Rombongan / Batch (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Rombongan Umrah Executive Bintang 5 Batch 08"
                  value={formData.batchName}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Keterangan / Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Keterangan / Deskripsi Momen
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan cerita singkat atau keterangan momen spiritual ini..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none leading-relaxed"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingPhoto ? 'Simpan Perubahan' : 'Upload & Simpan Foto'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CMSVideoGallery() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/cms/gallery/videos');
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File video terlalu besar (Max 100MB)');
      return;
    }

    try {
      setIsUploading(true);
      // Use FormData for large video files
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', file.name.split('.')[0]);

      // Actually we use base64 in this app for simplicity of the existing upload helper,
      // but for videos it's better to use direct upload if supported.
      // Let's check server.ts first. It has /api/upload.
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await api.post('/api/cms/gallery/videos', { 
          videoUrl: base64,
          title: file.name.split('.')[0]
        });
        toast.success('Video berhasil diunggah');
        fetchVideos();
      };
    } catch (error) {
      toast.error('Gagal mengunggah video');
    } finally {
      setIsUploading(false);
    }
  };

  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/api/cms/gallery/videos/${deleteConfirmId}`);
      toast.success('Video dihapus');
      fetchVideos();
    } catch (error) {
      toast.error('Gagal menghapus video');
    } finally {
      setDeleteConfirmId(null);
    }
  };


  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Video"
        message="Apakah Anda yakin ingin menghapus video ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900">Galeri Video (Direct Upload)</h3>
        <label className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Mengunggah...' : 'Unggah Video'}</span>
          <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 group relative">
              <video 
                src={video.videoUrl} 
                className="w-full aspect-video object-cover"
                controls={false}
                muted
                onMouseOver={e => e.currentTarget.play()}
                onMouseOut={e => e.currentTarget.pause()}
              />
              <div className="p-3">
                <p className="text-xs font-bold text-gray-700 truncate">{video.title}</p>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-[10px] text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</span>
                   <button 
                    onClick={() => setDeleteConfirmId(video.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
              <div className="absolute top-2 right-2 p-1 bg-black/20 backdrop-blur-md rounded-lg pointer-events-none">
                 <Video className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
          {videos.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-400">
               Belum ada video dalam galeri.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
