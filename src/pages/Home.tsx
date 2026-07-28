import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Play, CheckCircle2, ChevronLeft, ChevronRight, Award, ShieldCheck, MapPin, Phone, Mail, Star, Quote } from 'lucide-react';
import heroBg from '../assets/bg-utama.png';

export default function Home() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await api.get('/packages');
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const hajiTrackRef = useRef<HTMLDivElement>(null);
  
  const scrollTrack = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const umrahPackages = packages.filter(p => p.type === 'umroh' || !p.type);
  const hajiPackages = packages.filter(p => p.type === 'haji');

  return (
    <div className="font-['Montserrat',sans-serif] bg-stone-50 text-[#2F4F4F] min-h-screen selection:bg-[#C8D5B9] selection:text-[#2F4F4F]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-[1.5px] border-[#f59e0b]"></div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#064e3b] tracking-wider m-0 leading-tight">GOLDEN TRAVEL</h2>
            <p className="text-[0.7rem] text-[#f59e0b] font-bold tracking-[0.15em] uppercase m-0 mt-0.5">PT GOLDEN TOUR HAROMAIN</p>
          </div>
        </div>
        
        {/* Desktop Menu */}
        <nav className="hidden lg:flex gap-6 xl:gap-8 text-sm font-medium">
          <a href="#" className="text-[#0d4732] font-bold border-b-2 border-[#0d4732] pb-1" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: "smooth"}); }}>Beranda</a>
          <a href="#tentang-kami" className="text-gray-700 hover:text-[#0d4732] transition-colors" onClick={(e) => scrollToSection(e, 'tentang-kami')}>Tentang Kami</a>
          <Link to="/legalitas" className="text-gray-700 hover:text-[#0d4732] transition-colors">Legalitas</Link>
          <a href="#pilihan-paket" className="text-gray-700 hover:text-[#0d4732] transition-colors" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>Paket Umroh</a>
          <a href="#pilihan-haji" className="text-gray-700 hover:text-[#0d4732] transition-colors" onClick={(e) => scrollToSection(e, 'pilihan-haji')}>Paket Haji</a>
          <a href="#galeri" className="text-gray-700 hover:text-[#0d4732] transition-colors" onClick={(e) => scrollToSection(e, 'galeri')}>Galeri</a>
          <Link to="/mitra" className="text-gray-700 hover:text-[#0d4732] transition-colors">Kemitraan</Link>
        </nav>
        
        <Link to="/login" className="hidden lg:flex items-center gap-2 border-none bg-[#164C40] text-white px-8 py-2.5 rounded-full font-bold transition-all shadow-sm hover:bg-[#0d4732]">
          Masuk
        </Link>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 overflow-hidden bg-[#0C3C30] bg-no-repeat pt-28 pb-16 w-full" style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: 'right top', backgroundSize: 'cover' }}>
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 drop-shadow-lg" style={{ background: 'linear-gradient(to right, #D4AF37, #BFA76E, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Wujudkan Perjalanan Suci yang Khusyuk dan Penuh Berkah.
          </h1>
          <p className="text-[#E6DBC6] text-lg md:text-xl leading-relaxed mb-8 max-w-2xl font-light drop-shadow">
            Golden Travel menghadirkan layanan ibadah Haji dan Umroh eksklusif dengan fasilitas personal, premium, dan kedalaman spiritual. Aman, nyaman, dan profesional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a href="#pilihan-paket" className="bg-[#D4AF37] text-white text-center px-8 py-3 rounded-full font-semibold transition-transform duration-300 hover:scale-105 shadow-lg" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>
              Lihat Paket Umroh
            </a>
            <a href="https://wa.me/628123456789" className="border-2 border-[#d4af37] text-white text-center px-8 py-3 rounded-full font-semibold transition-all hover:bg-[#d4af37]/20" target="_blank" rel="noreferrer">
              Konsultasi Gratis
            </a>
          </div>

          <p className="text-[#d4af37] font-serif italic text-lg mb-12 drop-shadow-md">Kenyamanan dan Kepercayaan Anda, Prioritas Kami.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <Award className="text-[#d4af37] w-5 h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-sm leading-tight">Sertifikat<br/>Komitmen</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-[#d4af37] w-5 h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-sm leading-tight">Sertifikat<br/>Resmi</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-[#d4af37] w-5 h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-sm leading-tight">Layanan<br/>Premium</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <MapPin className="text-[#d4af37] w-5 h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-sm leading-tight">Transportasi<br/>Resmi</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tentang Kami Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="tentang-kami">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-left">
            <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4">✨ Tentang Perusahaan</div>
            <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-6">
              Dedikasi Menjaga Kekhusyukan Ibadah Anda di <span className="text-[#D4AF37]">Tanah Suci</span>
            </h2>
            
            <div className="space-y-4 text-stone-300 text-lg leading-relaxed mb-10 font-light">
              <p>
                <strong className="text-white font-semibold">PT Golden Tour Haromain</strong> didirikan atas dasar niat suci untuk memfasilitasi umat Muslim di Indonesia dalam menunaikan ibadah Umrah dan Haji secara paripurna. Kami hadir bukan sekadar sebagai biro perjalanan, melainkan sebagai mitra spiritual yang mendampingi setiap langkah Anda menuju Baitullah.
              </p>
              <p>
                Dengan berpegang teguh pada tuntunan Al-Qur'an dan Sunnah, kami merancang setiap program secara teliti—mulai dari manasik yang komprehensif, pemilihan maskapai penerbangan terpercaya, hingga akomodasi strategis di ring satu—untuk memastikan kenyamanan, keamanan, dan kesempurnaan ibadah Anda.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#2F4F4F]/80 text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xl text-white mb-2">Legalitas Terjamin</h4>
                  <p className="text-stone-400 text-sm leading-relaxed">Terdaftar resmi di Kemenag RI, memberikan kepastian jadwal keberangkatan tanpa rasa khawatir dan was-was.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#2F4F4F]/80 text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-1">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xl text-white mb-2">Bimbingan Sunnah</h4>
                  <p className="text-stone-400 text-sm leading-relaxed">Ibadah didampingi langsung oleh asatidz dan mutawwif berpengalaman lulusan universitas Timur Tengah.</p>
                </div>
              </div>
            </div>
            
            <a href="#pilihan-paket" className="inline-flex items-center gap-2 text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1 font-bold hover:text-amber-300 transition-colors tracking-wide" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>
              LIHAT PROFIL PERUSAHAAN &rarr;
            </a>
          </div>
          
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[400px] aspect-[4/5] p-2 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-t-full rounded-b-3xl shadow-2xl overflow-hidden group">
              <img src="/foto-about.jpg.jpeg" alt="Jemaah PT Golden Tour Haromain" className="w-full h-full object-cover rounded-t-full rounded-b-2xl transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80'; }} />
            </div>
          </div>
        </div>
      </section>

      {/* Legalitas Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F]" id="legalitas">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4">✨ Legalitas & Sertifikasi Resmi</div>
          <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-6 max-w-3xl mx-auto">
            Keamanan & Kenyamanan Anda Adalah <span className="text-[#D4AF37]">Prioritas Utama</span>
          </h2>
          <p className="text-stone-300 text-lg leading-relaxed max-w-3xl mx-auto mb-16 font-light">
            Sebagai komitmen pelayanan prima, PT. Golden Tour Haromain beroperasi dengan perizinan penuh yang diawasi langsung oleh Kementerian Agama Republik Indonesia, memastikan setiap keberangkatan aman dan sesuai prosedur negara.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Izin Penyelenggara Umrah (PPIU)', desc: 'Memiliki SK Kemenag RI resmi sebagai penyelenggara perjalanan ibadah umrah yang kredibel.', icon: '📜' },
              { title: 'Izin Haji Khusus (PIHK)', desc: 'Tersertifikasi untuk menyelenggarakan program Haji Khusus dengan kuota resmi negara.', icon: '🏛️' },
              { title: 'Keanggotaan Asosiasi', desc: 'Anggota aktif AMPHURI / HIMPUH, menjamin standar pelayanan industri travel ibadah.', icon: '🤝' },
              { title: 'Legalitas Perusahaan', desc: 'Terdaftar secara sah dengan NIB & Akta Pendirian Perusahaan yang tersertifikasi hukum.', icon: '🏢' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#2F4F4F]/90 rounded-2xl p-8 border border-[#2F4F4F]/80 shadow-sm hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300 text-left group">
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="font-serif text-xl text-white mb-3">{item.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{item.desc}</p>
                <div className="w-0 h-1 bg-[#D4AF37] mt-6 transition-all duration-500 group-hover:w-full rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paket Umroh Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="pilihan-paket">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="inline-block bg-[#2F4F4F] text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-[#D4AF37]/30">Paket Reguler & Plus</div>
              <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-4">
                Pilih Perjalanan Ibadah <span className="text-[#D4AF37]">Sesuai Kebutuhan Anda</span>
              </h2>
              <p className="text-stone-300 text-lg leading-relaxed font-light">
                Nikmati kenyamanan ibadah ke Tanah Suci dengan berbagai pilihan durasi dan fasilitas kelas dunia yang dirancang khusus untuk ketenangan batiniah dan lahiriah.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => scrollTrack(trackRef, 'left')} className="w-12 h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronLeft /></button>
              <button onClick={() => scrollTrack(trackRef, 'right')} className="w-12 h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronRight /></button>
            </div>
          </div>

          <div ref={trackRef} className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            
            {loading ? (
              <div className="w-full text-center py-20 text-stone-500 text-lg">Memuat paket pilihan...</div>
            ) : umrahPackages.length > 0 ? (
              umrahPackages.map((pkg) => (
                <div key={pkg.id} className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-500 flex flex-col group">
                  <div className="relative h-64 overflow-hidden">
                    <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90/90 backdrop-blur text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">{pkg.duration}</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">{pkg.name}</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6">
                      <span className="text-lg align-top mr-1">Rp</span>{Number(pkg.price).toLocaleString('id-ID')}
                      <span className="font-sans text-sm text-stone-400 font-normal ml-1">/ pax</span>
                    </div>
                    
                    <div className="space-y-3 mb-8 flex-1">
                      {Array.isArray(pkg.description) ? (
                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-stone-300 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> <span>{line}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-300 text-sm line-clamp-4 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                    
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">
                      Lihat Detail Jadwal
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback
              <>
                <div className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Paket Safa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90/90 text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">9 Hari</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">Paket Safa (Reguler)</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6"><span className="text-lg align-top mr-1">Rp</span>28.500.000<span className="font-sans text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-3 mb-8 flex-1 text-sm text-stone-300">
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Maskapai Saudia Airlines / Garuda Indonesia</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Makkah: Hotel Azka Al Safa (4⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Madinah: Hotel Taiba Front (4⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Bus Full AC / Kereta Cepat Haramain</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] font-bold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">Lihat Detail Jadwal</Link>
                  </div>
                </div>
                
                <div className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col relative transform lg:-translate-y-2 group">
                  <div className="absolute top-6 -right-12 bg-[#D4AF37] text-[#2F4F4F] px-12 py-1 rotate-45 text-[10px] font-black tracking-[0.2em] z-20 shadow-md">TERFAVORIT</div>
                  <div className="relative h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Paket Marwa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90/90 text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">12 Hari</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">Paket Marwa (VIP)</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6"><span className="text-lg align-top mr-1">Rp</span>35.000.000<span className="font-sans text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-3 mb-8 flex-1 text-sm text-stone-300">
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Saudia Airlines (Direct Flight)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Makkah: Pullman ZamZam (5⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Madinah: Anwar Movenpick (5⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Tiket Kereta Cepat Haramain (VIP Class)</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl bg-[#D4AF37] text-[#2F4F4F] font-bold hover:bg-amber-300 transition-colors shadow-lg">Booking Sekarang</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Paket Haji Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F] border-t border-[#2F4F4F]/90/50" id="pilihan-haji">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="inline-block bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-[#D4AF37]/30">Haji Khusus & Furoda</div>
              <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-4">
                Program Haji Resmi, Nyaman, <br/><span className="text-[#D4AF37]">Sesuai Syariat</span>
              </h2>
              <p className="text-stone-300 text-lg leading-relaxed font-light">
                Tunaikan Rukun Islam kelima dengan tenang melalui program haji khusus yang terjamin legalitasnya, waktu tunggu yang lebih ideal, dan bimbingan ibadah intensif hingga mabrur.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => scrollTrack(hajiTrackRef, 'left')} className="w-12 h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronLeft /></button>
              <button onClick={() => scrollTrack(hajiTrackRef, 'right')} className="w-12 h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronRight /></button>
            </div>
          </div>

          <div ref={hajiTrackRef} className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            
            {loading ? (
              <div className="w-full text-center py-20 text-stone-500 text-lg">Memuat paket haji...</div>
            ) : hajiPackages.length > 0 ? (
              hajiPackages.map((pkg) => (
                <div key={pkg.id} className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-500 flex flex-col group">
                  <div className="relative h-64 overflow-hidden">
                    <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90 backdrop-blur text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">{pkg.duration}</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">{pkg.name}</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6">
                      <span className="text-lg align-top mr-1">USD</span>{Number(pkg.price).toLocaleString('en-US')}
                      <span className="font-sans text-sm text-stone-400 font-normal ml-1">/ pax</span>
                    </div>
                    
                    <div className="space-y-3 mb-8 flex-1">
                      {Array.isArray(pkg.description) ? (
                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-stone-300 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> <span>{line}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-300 text-sm line-clamp-4 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                    
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">
                      Lihat Detail Jadwal
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback Haji
              <>
                <div className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80" alt="Haji Khusus" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">26 Hari</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">Haji Khusus (ONH Plus)</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6"><span className="text-lg align-top mr-1">USD</span>14.500<span className="font-sans text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-3 mb-8 flex-1 text-sm text-stone-300">
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Kuota Resmi Kementerian Agama RI</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Makkah: Fairmont / Pullman (5⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Madinah: Oberoi / Movenpick (5⭐)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Tenda Maktab VIP & Kereta Cepat</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] font-bold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">Konsultasi Kuota</Link>
                  </div>
                </div>

                <div className="min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col relative transform lg:-translate-y-2 group">
                  <div className="absolute top-6 -right-12 bg-[#D4AF37] text-[#2F4F4F] px-12 py-1 rotate-45 text-[10px] font-black tracking-[0.2em] z-20 shadow-md">TANPA ANTRI</div>
                  <div className="relative h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Haji Furoda" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-[#D4AF37]/20">24 Hari</div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-2xl text-white mb-2">Haji Furoda (Visa Mujamalah)</h3>
                    <div className="text-[#D4AF37] font-serif text-3xl font-bold mb-6"><span className="text-lg align-top mr-1">Mulai USD</span>21.000</div>
                    <div className="space-y-3 mb-8 flex-1 text-sm text-stone-300">
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Keberangkatan Tahun Berjalan (Langsung)</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Visa Mujamalah Resmi Kerajaan Saudi</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Hotel Bintang 5 Pelataran Masjidil Haram</div>
                      <div className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" /> Tenda AC Khusus Maktab Furoda VIP</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl bg-[#D4AF37] text-[#2F4F4F] font-bold hover:bg-amber-300 transition-colors shadow-lg">Amankan Kursi</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="testimoni">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4">✨ Ulasan Jemaah</div>
          <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-6 max-w-3xl mx-auto">
            Apa Kata Mereka Tentang <span className="text-[#D4AF37]">Pelayanan Kami?</span>
          </h2>
          <p className="text-stone-300 text-lg leading-relaxed max-w-3xl mx-auto mb-16 font-light">
            Pengalaman nyata dari para jemaah yang telah mempercayakan perjalanan ibadah mereka kepada Golden Travel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { name: "Bapak H. Abdullah", role: "Jemaah Umroh Plus", text: "Pelayanan sangat memuaskan, mulai dari keberangkatan hingga kepulangan. Mutawwif sangat sabar dan berilmu, fasilitas hotel bintang 5 sesuai dengan yang dijanjikan. Alhamdulillah ibadah jadi lebih khusyuk." },
              { name: "Ibu Hj. Siti Aminah", role: "Jemaah Haji Khusus", text: "Awalnya khawatir karena berangkat Haji untuk pertama kali, tapi berkat bimbingan intensif dari Golden Travel, semua berjalan lancar. Tenda di Arafah sangat nyaman dan makanan terjamin." },
              { name: "Keluarga Bapak Budi", role: "Jemaah Umroh Reguler", text: "Terima kasih Golden Travel telah mewujudkan impian keluarga kami untuk ke Baitullah. Harga yang ditawarkan sangat sepadan dengan kualitas pelayanan VIP yang diberikan. Sangat direkomendasikan!" }
            ].map((testi, idx) => (
              <div key={idx} className="bg-[#2F4F4F] rounded-2xl p-8 border border-[#2F4F4F]/80 shadow-sm relative">
                <Quote className="w-10 h-10 text-[#2F4F4F]/80 absolute top-6 right-6 opacity-50" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-stone-300 text-sm leading-relaxed mb-6 font-light italic">"{testi.text}"</p>
                <div>
                  <h4 className="text-white font-bold">{testi.name}</h4>
                  <p className="text-[#D4AF37] text-xs">{testi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#2F4F4F]" id="galeri">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-4">✨ Jejak Langkah Spiritual</div>
            <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight mb-4">
              Galeri <span className="text-[#D4AF37]">Keberangkatan</span>
            </h2>
            <p className="text-stone-300 text-lg leading-relaxed max-w-2xl mx-auto font-light">
              Momen-momen indah dan penuh kekhusyukan para Tamu Allah yang telah mempercayakan perjalanan sucinya bersama kami.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {[
              { src: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Khusyuk di Baitullah' },
              { src: 'https://images.unsplash.com/photo-1565552643954-1a4be7aa0fc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Ziarah Masjid Nabawi' },
              { src: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'City Tour Bersejarah' },
              { src: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Keberangkatan Jemaah' },
            ].map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer shadow-sm">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-[#2F4F4F]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="font-serif text-[#D4AF37] text-lg font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-center px-4">{img.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cinematic Video Showcase */}
          <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-[#2F4F4F]/80 aspect-video">
            <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Cinematic Profile" className="w-full h-full object-cover brightness-75 group-hover:brightness-50 transition-all duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#2F4F4F]/20">
              <div className="w-20 h-20 bg-[#D4AF37]/90 text-[#2F4F4F] rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#D4AF37] shadow-xl shadow-[#D4AF37]/30">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </div>
              <h3 className="font-serif text-2xl md:text-4xl text-white font-bold mb-3 drop-shadow-md">Kenyamanan Beribadah Bersama Kami</h3>
              <p className="text-white/90 text-sm md:text-lg max-w-xl font-light drop-shadow">Saksikan cuplikan perjalanan khusyuk para jemaah menikmati layanan VIP di Tanah Suci.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2F4F4F] pt-20 pb-8 px-6 md:px-12 lg:px-24 border-t border-[#2F4F4F]/90">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full border border-[#D4AF37]/50 bg-[url('/logo.png')] bg-cover bg-center"></div>
                <div>
                  <h3 className="font-serif text-lg text-white m-0">PT Golden Tour Haromain</h3>
                  <span className="text-[10px] text-[#D4AF37] tracking-wider">HAJI & UMROH PREMIUM</span>
                </div>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                Biro perjalanan Haji dan Umroh terpercaya, berkomitmen melayani sepenuh hati untuk ibadah mabrur dan pengalaman religius yang sempurna.
              </p>
              <div className="bg-[#2F4F4F]/90/50 border border-[#2F4F4F]/80 p-4 rounded-xl text-xs text-stone-300 leading-relaxed">
                <strong className="text-white block mb-1">PT. GOLDEN TOUR HARAMAIN</strong>
                Mitra PT. SEDERHANA ALMAIDANI GROUP
                <div className="text-[#D4AF37] font-mono mt-2 tracking-widest font-bold">Izin PPIU: 08012300040570002</div>
              </div>
            </div>

            <div>
              <h4 className="font-serif text-[#D4AF37] text-xl mb-6 pb-3 border-b border-[#2F4F4F]/90">Layanan Kami</h4>
              <ul className="space-y-3 text-stone-400 text-sm">
                <li><a href="#pilihan-paket" className="hover:text-[#D4AF37] transition-colors">Paket Umroh Reguler</a></li>
                <li><a href="#pilihan-paket" className="hover:text-[#D4AF37] transition-colors">Paket Umroh VIP & Plus</a></li>
                <li><a href="#pilihan-haji" className="hover:text-[#D4AF37] transition-colors">Program Haji Furoda</a></li>
                <li><a href="#pilihan-haji" className="hover:text-[#D4AF37] transition-colors">Program Haji Khusus (ONH)</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Pengurusan Visa Mandiri</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif text-[#D4AF37] text-xl mb-6 pb-3 border-b border-[#2F4F4F]/90">Tautan Cepat</h4>
              <ul className="space-y-3 text-stone-400 text-sm mb-8">
                <li><a href="#tentang-kami" className="hover:text-[#D4AF37] transition-colors">Tentang Kami</a></li>
                <li><Link to="/legalitas" className="hover:text-[#D4AF37] transition-colors">Legalitas Resmi</Link></li>
                <li><a href="#galeri" className="hover:text-[#D4AF37] transition-colors">Galeri Perjalanan</a></li>
                <li><Link to="/mitra" className="hover:text-[#D4AF37] transition-colors">Menjadi Mitra Penjualan</Link></li>
              </ul>
              <h4 className="font-serif text-white text-md mb-4">Portal Sistem</h4>
              <ul className="space-y-3 text-stone-400 text-sm">
                <li><Link to="/login" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2">Login Jemaah</Link></li>
                <li><Link to="/mitra/login" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2">Login Mitra Agent</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif text-[#D4AF37] text-xl mb-6 pb-3 border-b border-[#2F4F4F]/90">Hubungi Kami</h4>
              <div className="space-y-5 text-sm text-stone-400">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <p className="leading-relaxed">Gedung Harmoni Lt.3,<br/>Jl. Engku Putri No. 123,<br/>Batam Center, Kepulauan Riau</p>
                </div>
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <div>
                    <p>0822-8320-1103 <span className="text-stone-500 text-xs ml-1">(Hotline 1)</span></p>
                    <p className="mt-1">0822-8830-8220 <span className="text-stone-500 text-xs ml-1">(Hotline 2)</span></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <p>info@goldentourharomain.com</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-[#2F4F4F]/90 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
            <p>&copy; {new Date().getFullYear()} PT Golden Tour Haromain. Hak Cipta Dilindungi.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href="https://wa.me/628123456789" target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50 border-2 border-white">
        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.79L2 22l5.35-1.18c1.37.7 2.94 1.1 4.65 1.1 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
        </svg>
      </a>
    </div>
  );
}
