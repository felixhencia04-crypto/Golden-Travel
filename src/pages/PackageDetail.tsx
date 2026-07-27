import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAppContext } from '../store';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle2, Map as MapIcon, ChevronLeft, MapPin, Calendar, CreditCard, Send, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { packages, addConsultation } = useAppContext();
  
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const data = await api.get(`/packages/${id}`);
        setPkg(data);
      } catch (error) {
        console.error("Failed to fetch package:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-matcha-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
           <p className="text-matcha-700 font-medium">Memuat Detail Paket...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-matcha-950 mb-4">Paket tidak ditemukan</h2>
            <Link to="/" className="font-button text-gold-500 font-medium hover:underline">Kembali ke Beranda</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConsultation({
      id: Date.now().toString(),
      packageId: pkg.id,
      packageName: pkg.name,
      ...formData,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-matcha-50">
      <Navbar />

      <main className="flex-grow pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button className="font-button flex items-center text-matcha-700 hover:text-gold-500 transition-colors mb-8 font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Package Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-matcha-50 rounded-3xl shadow-xl border border-matcha-100 overflow-hidden shadow-sm border border-matcha-100">
                <div className="h-80 relative">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-matcha-50/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-matcha-950 shadow-sm border border-gold-200">
                    {pkg.duration}
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                    <div>
                      <span className="text-gold-500 font-semibold tracking-widest text-sm uppercase mb-2 block">
                        Paket {pkg.type === 'haji' ? 'Haji' : 'Umroh'}
                      </span>
                      <h1 className="font-serif text-3xl md:text-4xl font-bold text-matcha-950 mb-4">{pkg.name}</h1>
                    </div>
                    <div className="md:text-right shrink-0">
                      <p className="text-sm text-matcha-100 uppercase tracking-wider mb-1">Harga Mulai</p>
                      <p className="text-3xl font-bold text-matcha-950">
                        Rp {Number(pkg.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-20 h-1 bg-gold-400 mb-8 rounded-full"></div>
                  
                  <div className={`text-matcha-950 text-lg font-bold leading-tight mb-12 ${Array.isArray(pkg.description) && pkg.description.length > 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4' : 'space-y-4'}`}>
                    {Array.isArray(pkg.description) ? (
                      pkg.description.map((line: string, i: number) => (
                        <p key={i} className="flex items-start bg-matcha-50 p-4 rounded-2xl border border-matcha-100">
                          <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0" />
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="flex items-start bg-matcha-50 p-4 rounded-2xl border border-matcha-100">
                        <CheckCircle2 className="w-5 h-5 text-gold-500 mr-3 shrink-0" />
                        {pkg.description}
                      </p>
                    )}
                  </div>
                  
                  <h3 className="font-serif text-xl font-bold text-matcha-950 mb-6 flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-gold-500 mr-2" /> Fasilitas Eksklusif
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start text-matcha-700 bg-matcha-50/50 p-4 rounded-2xl border border-matcha-100">
                        <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-gold-600" />
                        </div>
                        <span className="font-medium text-sm">{feature}</span>
                      </div>
                    ))}

                  </div>
                  
                  {pkg.itinerary && pkg.itinerary.length > 0 && (
                    <div className="mt-10">
                      <h3 className="font-serif text-xl font-bold text-matcha-950 mb-6 flex items-center">
                        <MapIcon className="w-6 h-6 text-gold-500 mr-2" /> Rencana Perjalanan (Itinerary)
                      </h3>
                      <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-matcha-100">
                        {pkg.itinerary.map((item, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-matcha-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                              <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
                            </div>
                            <h4 className="font-bold text-matcha-950">{item.day} - {item.title}</h4>
                            <p className="text-matcha-600 font-light mt-1 text-sm">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
              <div className="bg-matcha-50 rounded-3xl shadow-xl border border-matcha-100 p-8 shadow-sm border border-matcha-100">
                <h3 className="font-serif text-xl font-bold text-matcha-950 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 text-gold-500 mr-2" /> Jadwal & Lokasi
                </h3>
                <div className="space-y-6">
                  <div className="flex">
                    <div className="w-12 h-12 bg-matcha-100 rounded-full flex items-center justify-center mr-4 shrink-0 text-matcha-700">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-matcha-950 text-lg">Jadwal Keberangkatan</h4>
                      <p className="text-matcha-600 font-light mt-1">Beragam pilihan jadwal tersedia setiap bulannya. Hubungi kami untuk ketersediaan seat pada tanggal yang Anda inginkan.</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-12 h-12 bg-matcha-100 rounded-full flex items-center justify-center mr-4 shrink-0 text-matcha-700">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-matcha-950 text-lg">Metode Pembayaran</h4>
                      <p className="text-matcha-600 font-light mt-1">Menerima pembayaran tunai, transfer bank, dan cicilan (syarat & ketentuan berlaku).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Form Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-matcha-50 rounded-3xl shadow-xl border border-matcha-100 p-8 shadow-xl shadow-matcha-900/5 border border-matcha-100 sticky top-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="font-serif text-2xl font-bold text-matcha-950 mb-2 relative z-10">Form Pendaftaran Umroh</h3>
                <p className="text-matcha-100 font-light text-sm mb-8 relative z-10">
                  Isi form pendaftaran berikut untuk mendaftar paket ini. Tim kami akan segera memproses pendaftaran Anda.
                </p>

                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 relative z-10"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="font-serif text-xl font-bold text-matcha-950 mb-2">Terima Kasih!</h4>
                    <p className="text-matcha-600 font-light text-sm">
                      Pesan Anda telah kami terima. Tim Admin PT Golden Tour Haromain akan segera menghubungi Anda melalui WhatsApp untuk proses selanjutnya.
                    </p>
                    <div className="flex gap-4 mt-8">
                      <Link 
                        to="/dashboard"
                        className="font-button text-matcha-950 bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-xl transition"
                      >
                        Buka Portal Jamaah (Simulasi)
                      </Link>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="font-button text-gold-600 font-medium hover:underline px-6 py-3"
                      >
                        Kembali
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div>
                      <label className="block text-sm font-medium text-matcha-700 mb-2">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border-matcha-200 rounded-xl bg-matcha-50 border py-3 px-4 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                        placeholder="Contoh: Ahmad Abdullah"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-matcha-700 mb-2">Nomor WhatsApp</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full border-matcha-200 rounded-xl bg-matcha-50 border py-3 px-4 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-matcha-700 mb-2">Email (Opsional)</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full border-matcha-200 rounded-xl bg-matcha-50 border py-3 px-4 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                        placeholder="anda@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-matcha-700 mb-2">Catatan Tambahan (Opsional)</label>
                      <textarea 
                        rows={3}
                        required
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full border-matcha-200 rounded-xl bg-matcha-50 border py-3 px-4 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                        placeholder="Tuliskan pertanyaan atau rencana keberangkatan Anda..."
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="font-button w-full flex justify-center items-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-matcha-950 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 shadow-lg shadow-gold-500/20 transition-all hover:-translate-y-0.5 mt-4"
                    >
                      Daftar Umroh Sekarang <Send className="ml-2 w-5 h-5" />
                    </button>
                    <p className="text-xs text-center text-matcha-100 mt-4">
                      Dengan menekan tombol kirim, Anda menyetujui untuk dihubungi oleh tim PT Golden Tour Haromain.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
