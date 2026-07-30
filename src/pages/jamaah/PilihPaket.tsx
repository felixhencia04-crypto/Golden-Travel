import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Package } from '../../types';
import { useRegistrasi } from '../../hooks/useRegistrasi';
import { toast } from 'sonner';
import { Check, Info, Tag, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const PilihPaket: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshData } = useRegistrasi();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await api.get('/pakets');
        setPackages(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Gagal mengambil data paket");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSelectPackage = async (pkgId: string) => {
    try {
      await api.post('/registrasi', { 
        packageId: pkgId,
        adultCount: '1',
        childCount: '0',
        infantCount: '0'
      });
      toast.success("Berhasil memilih paket!");
      await refreshData(true);
      window.location.hash = '#dashboard'; // Simple internal routing
    } catch (err: any) {
      toast.error(err.message || "Gagal memilih paket");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat daftar paket...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Pilih Paket Perjalanan Anda</h1>
        <p className="text-gray-600">Tersedia berbagai pilihan paket Umroh dan Haji dengan layanan premium dan harga terbaik.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <motion.div 
            key={pkg.id}
            whileHover={{ y: -8 }}
            className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col"
          >
            <div className="relative h-56">
              <img 
                src={pkg.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80'} 
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-gold-600 shadow-sm">
                {pkg.type || 'Umroh'}
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {pkg.duration}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Batam
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {pkg.description?.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <div className="text-sm text-gray-400 font-bold mb-1 uppercase tracking-tighter">Mulai dari</div>
                <div className="text-3xl font-black text-gray-900 mb-6">
                  <span className="text-sm align-top mr-1">Rp</span>
                  {Number(pkg.price).toLocaleString('id-ID')}
                </div>
                
                <button 
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="w-full py-4 bg-[#132019] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 group"
                >
                  Pilih Paket
                  <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
        <Info className="w-6 h-6 text-blue-500 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900">Butuh bantuan memilih?</h4>
          <p className="text-sm text-blue-800 opacity-80">Tim kami siap membantu Anda memilih paket yang paling sesuai dengan kebutuhan Anda. Hubungi kami via WhatsApp.</p>
        </div>
      </div>
    </div>
  );
};
