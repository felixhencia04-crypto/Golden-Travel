import React, { useState, useEffect } from 'react';
import { 
  Globe, Package, Image as ImageIcon, Video, Plus, Edit2, Trash2, 
  Search, Filter, ChevronRight, MapPin, Calendar, Clock, 
  CheckCircle2, AlertCircle, Save, X, Upload, Info, Hotel, 
  List, Map as MapIcon, Utensils
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface CMSManagerProps {
  workspaceId?: string;
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
export default function CMSManager({ workspaceId }: CMSManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'paket' | 'galeri' | 'video'>('paket');

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

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/packages'); // Use existing packages list
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

  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/admin/packages/${deleteConfirmId}`);
      toast.success('Paket berhasil dihapus');
      notifyRealtimeCatalogChange();
      fetchPackages();
    } catch (error) {
      toast.error('Gagal menghapus paket');
    } finally {
      setDeleteConfirmId(null);
    }
  };


  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Paket"
        message="Apakah Anda yakin ingin menghapus paket ini? Data tidak dapat dikembalikan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900">Daftar Paket Umroh & Haji</h3>
        <button 
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada paket yang tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative h-48">
                <img 
                  src={pkg.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={pkg.name}
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button 
                    onClick={() => {
                      setEditingPackage(pkg);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-white/90 hover:bg-white text-blue-600 rounded-lg shadow-sm backdrop-blur-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(pkg.id)}
                    className="p-2 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                    pkg.type === 'haji' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {pkg.type}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{pkg.name}</h4>
                <p className="text-emerald-600 font-bold text-lg mb-3">
                  Rp {Number(pkg.price).toLocaleString('id-ID')}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <Clock className="w-3.5 h-3.5 text-gold-500" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <Hotel className="w-3.5 h-3.5 text-gold-500" />
                    <span className="line-clamp-1">{pkg.hotel || 'Info Hotel Belum Ada'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                   <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400">
                      <List className="w-3 h-3" />
                      <span>{pkg.itineraryCount || 0} Hari Jadwal</span>
                   </div>
                   <button 
                    onClick={() => {
                      setEditingPackage(pkg);
                      setIsModalOpen(true);
                    }}
                    className="text-xs font-bold text-gold-600 hover:text-gold-700 flex items-center space-x-1"
                   >
                     <span>Detail & Itinerary</span>
                     <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </div>
          ))}
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
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    type: pkg?.type || 'umroh',
    price: pkg?.price || '',
    duration: pkg?.duration || '',
    imageUrl: pkg?.imageUrl || '',
    facilities: pkg?.facilities || '',
    hotel: pkg?.hotel || '',
    excludes: Array.isArray(pkg?.excludes) ? pkg.excludes.join('\n') : (pkg?.excludes || ''),
    description: Array.isArray(pkg?.description) ? pkg.description.join('\n') : (pkg?.description || '')
  ,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        price: Number(formData.price),
        description: formData.description.split('\n').filter((d: string) => d.trim() !== ''),
        excludes: formData.excludes.split('\n').filter((d: string) => d.trim() !== ''),
      };

      if (pkg?.id) {
        await api.put(`/admin/packages/${pkg.id}`, payload);
        toast.success('Paket berhasil diperbarui');
        notifyRealtimeCatalogChange();
      } else {
        await api.post('/admin/packages', payload);
        toast.success('Paket berhasil ditambahkan');
      }
      onSuccess();
    } catch (error) {
      toast.error('Gagal menyimpan paket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{pkg ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
              <p className="text-xs text-gray-500">Lengkapi informasi paket perjalanan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
           <button 
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'info' ? 'border-gold-500 text-gold-600 bg-gold-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
           >
             Informasi Utama
           </button>
           {pkg?.id && (
             <button 
              onClick={() => setActiveTab('itinerary')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'itinerary' ? 'border-gold-500 text-gold-600 bg-gold-50/30' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
             >
               Jadwal Itinerary
             </button>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'info' ? (
            <form id="pkg-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Paket</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      placeholder="Contoh: Umroh Syawal Bintang 5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Kategori</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                    >
                      <option value="umroh">Umroh</option>
                      <option value="haji">Haji</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Harga (Rp)</label>
                      <input 
                        type="number" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                        placeholder="35000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Kuota / Total Seat</label>
                      <input 
                        type="number" 
                        value={formData.quota}
                        onChange={(e) => setFormData({...formData, quota: Number(e.target.value)})}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                        placeholder="45"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Durasi</label>
                    <input 
                      type="text" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      placeholder="9 Hari"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Gambar (Opsional)</label>
                    <div className="flex items-center space-x-4">
                      {formData.imageUrl && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0">
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
                            setFormData({...formData, imageUrl: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="flex-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Info Hotel</label>
                    <input 
                      type="text" 
                      value={formData.hotel}
                      onChange={(e) => setFormData({...formData, hotel: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      placeholder="Makkah: Anjum, Madinah: Nozol Royal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fasilitas Utama</label>
                    <input 
                      type="text" 
                      value={formData.facilities}
                      onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none"
                      placeholder="Tiket PP, Visa, Hotel, Makan 3x"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi Lengkap (Satu per baris)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none resize-none"
                  placeholder="Fasilitas Bintang 5&#10;Pesawat Saudi Airlines&#10;Muthawwif Berpengalaman"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Belum Termasuk / Excludes (Satu per baris)</label>
                <textarea 
                  value={formData.excludes}
                  onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none resize-none"
                  placeholder="Pembuatan Paspor&#10;Vaksin Meningitis&#10;Pengeluaran Pribadi"
                />
              </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Belum Termasuk / Excludes (Satu per baris)</label>
                <textarea 
                  value={formData.excludes}
                  onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all outline-none resize-none"
                  placeholder="Pembuatan Paspor&#10;Vaksin Meningitis&#10;Pengeluaran Pribadi"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                   <MapIcon className="w-5 h-5 text-gold-500" />
                   Rincian Jadwal Perjalanan
                </h4>
                <button 
                  type="button"
                  onClick={() => {
                    const nextDay = itinerary.length > 0 ? Math.max(...itinerary.map(i => i.day)) + 1 : 1;
                    setItinerary([...itinerary, { day: nextDay, title: '', description: '', location: '', meals: '' }]);
                  }}
                  className="text-xs bg-gold-100 text-gold-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gold-200 transition-all"
                >
                  Tambah Hari
                </button>
              </div>

              {itinerary.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">Belum ada rincian itinerary.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itinerary.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-gold-500 text-gray-900 rounded-lg flex items-center justify-center font-black text-sm">
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
                              className="bg-transparent border-b border-gray-300 focus:border-gold-500 outline-none text-sm font-bold py-1 w-64"
                              placeholder="Judul Agenda (contoh: Keberangkatan)"
                            />
                         </div>
                         <button 
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
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                          placeholder="Deskripsi kegiatan hari ini..."
                        />
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <input 
                                type="text"
                                value={item.location}
                                onChange={(e) => {
                                  const newItin = [...itinerary];
                                  newItin[index].location = e.target.value;
                                  setItinerary(newItin);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                placeholder="Lokasi"
                              />
                           </div>
                           <div className="flex items-center gap-2">
                              <Utensils className="w-3.5 h-3.5 text-gray-400" />
                              <input 
                                type="text"
                                value={item.meals}
                                onChange={(e) => {
                                  const newItin = [...itinerary];
                                  newItin[index].meals = e.target.value;
                                  setItinerary(newItin);
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                placeholder="Makan (contoh: B, L, D)"
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={async () => {
                      try {
                        await api.post(`/api/cms/packages/${pkg.id}/itinerary`, { itineraries: itinerary });
                        toast.success('Itinerary berhasil disimpan');
                      } catch (err) {
                        toast.error('Gagal menyimpan itinerary');
                      }
                    }}
                    className="w-full py-3 bg-gold-100 text-gold-700 rounded-2xl font-bold hover:bg-gold-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Itinerary
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">
            Batal
          </button>
          {activeTab === 'info' && (
            <button 
              form="pkg-form"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{pkg ? 'Simpan Perubahan' : 'Tambah Paket'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CMSGallery() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/cms/gallery/photos');
      setPhotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await api.post('/api/cms/gallery/photos', { 
          imageUrl: base64,
          title: file.name.split('.')[0]
        });
        toast.success('Foto berhasil diunggah');
        fetchPhotos();
      };
    } catch (error) {
      toast.error('Gagal mengunggah foto');
    } finally {
      setIsUploading(false);
    }
  };

  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/api/cms/gallery/photos/${deleteConfirmId}`);
      toast.success('Foto dihapus');
      fetchPhotos();
    } catch (error) {
      toast.error('Gagal menghapus foto');
    } finally {
      setDeleteConfirmId(null);
    }
  };


  return (
    <div className="p-6">
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Foto"
        message="Apakah Anda yakin ingin menghapus foto ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900">Galeri Foto Dokumentasi</h3>
        <label className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Mengunggah...' : 'Unggah Foto'}</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
              <img src={photo.imageUrl} className="w-full h-full object-cover" alt={photo.title} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                 <button 
                  onClick={() => setDeleteConfirmId(photo.id)}
                  className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
          {photos.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-400">
               Belum ada foto dalam galeri.
            </div>
          )}
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
