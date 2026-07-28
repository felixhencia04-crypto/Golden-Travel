import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Play, CheckCircle2, ChevronLeft, ChevronRight, Award, ShieldCheck, MapPin, Phone, Mail, Star, Quote, Menu, X, LogIn } from 'lucide-react';
import { useLogo } from '../utils/logo';
import heroBg from '../assets/bg-utama.jpg';

export default function Home() {
  const logoImg = useLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <header className="sticky top-0 z-50 bg-[#F9F5EC] bg-[url('/header-bg.png')] bg-cover bg-center bg-no-repeat border-b border-[#D4AF37]/40 py-2.5 sm:py-3.5 px-3 sm:px-6 md:px-12 flex justify-between items-center shadow-md transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-[1.5px] border-[#f59e0b] overflow-hidden flex items-center justify-center bg-[#064e3b] shrink-0 shadow-sm">
            {logoImg ? (
              <img src={logoImg} alt="Logo Golden Travel" className="w-full h-full object-contain p-0.5 sm:p-1" />
            ) : (
              <span className="font-serif font-bold text-[#D4AF37] text-base sm:text-lg">G</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-xs min-[360px]:text-sm sm:text-lg md:text-xl font-black text-[#064e3b] tracking-wider m-0 leading-tight whitespace-nowrap">GOLDEN TRAVEL</h2>
            <p className="text-[0.48rem] min-[360px]:text-[0.56rem] sm:text-[0.65rem] md:text-[0.7rem] text-[#b45309] font-extrabold tracking-[0.02em] min-[360px]:tracking-[0.05em] sm:tracking-[0.15em] uppercase m-0 mt-0.5 whitespace-nowrap">PT GOLDEN TOUR HARAMAIN</p>
          </div>
        </div>
        
        {/* Desktop Menu */}
        <nav className="hidden lg:flex gap-5 xl:gap-7 text-xs xl:text-sm font-semibold items-center">
          <a href="#" className="text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: "smooth"}); }}>Beranda</a>
          <a href="#tentang-kami" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors" onClick={(e) => scrollToSection(e, 'tentang-kami')}>Tentang Kami</a>
          <Link to="/legalitas" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors">Legalitas</Link>
          <a href="#pilihan-paket" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>Paket Umroh</a>
          <a href="#pilihan-haji" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors" onClick={(e) => scrollToSection(e, 'pilihan-haji')}>Paket Haji</a>
          <a href="#galeri" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors" onClick={(e) => scrollToSection(e, 'galeri')}>Galeri</a>
          <Link to="/mitra" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors">Kemitraan</Link>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Direct Mobile Masuk Button on header for immediate access */}
          <Link 
            to="/login" 
            className="flex lg:hidden items-center gap-1 bg-[#064e3b] hover:bg-[#04382a] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Masuk</span>
          </Link>

          {/* Desktop Masuk Button */}
          <Link to="/login" className="hidden lg:flex items-center gap-2 border-none bg-[#064e3b] hover:bg-[#04382a] text-white px-6 xl:px-7 py-2 sm:py-2.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95">
            <LogIn className="w-4 h-4 text-[#D4AF37]" />
            Masuk
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#064e3b] p-1.5 sm:p-2 rounded-lg hover:bg-black/5 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[52px] sm:top-[68px] z-40 bg-[#FAF7F2] bg-[url('/header-bg.png')] bg-cover bg-center border-b border-[#D4AF37]/40 shadow-2xl px-4 py-4 max-h-[calc(100vh-60px)] overflow-y-auto rounded-b-2xl transition-all duration-300 space-y-3">
          {/* Quick Login Section inside Drawer */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
            <p className="text-[11px] font-bold text-[#064e3b] uppercase tracking-wider">Akses Portal System</p>
            <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 bg-[#164C40] hover:bg-[#0d4732] text-white px-4 py-3 rounded-xl font-bold text-sm w-full shadow-md transition-all active:scale-[0.98]" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" /> 
              <span>Masuk Portal Jemaah</span>
            </Link>
            <Link 
              to="/mitra/login" 
              className="flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-[#064e3b] border border-stone-300 px-4 py-2.5 rounded-xl font-bold text-xs w-full transition-all active:scale-[0.98]" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Portal Agent / Mitra</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="py-1 space-y-1">
            <a href="#" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#064e3b] font-bold bg-emerald-50/70" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); window.scrollTo({top: 0, behavior: "smooth"}); }}>
              <span>Beranda</span>
              <span className="text-xs text-[#064e3b]">›</span>
            </a>
            <a href="#tentang-kami" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'tentang-kami'); }}>
              <span>Tentang Kami</span>
              <span className="text-xs text-gray-400">›</span>
            </a>
            <Link to="/legalitas" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={() => setMobileMenuOpen(false)}>
              <span>Legalitas Resmi</span>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            <a href="#pilihan-paket" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'pilihan-paket'); }}>
              <span>Paket Umroh</span>
              <span className="text-xs text-gray-400">›</span>
            </a>
            <a href="#pilihan-haji" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'pilihan-haji'); }}>
              <span>Paket Haji</span>
              <span className="text-xs text-gray-400">›</span>
            </a>
            <a href="#galeri" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'galeri'); }}>
              <span>Galeri Keberangkatan</span>
              <span className="text-xs text-gray-400">›</span>
            </a>
            <Link to="/mitra" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={() => setMobileMenuOpen(false)}>
              <span>Program Kemitraan</span>
              <span className="text-xs text-gray-400">›</span>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero-section" className="relative min-h-[90vh] sm:min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-24 overflow-hidden bg-[#0C3C30] pt-20 sm:pt-28 pb-12 sm:pb-16 w-full">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src={heroBg} 
            alt="Background Golden Travel Ka'bah" 
            className="w-full h-full object-cover object-[82%_center] sm:object-center transition-opacity duration-300"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.attempt) {
                target.dataset.attempt = '1';
                target.src = '/bg-utama.jpg';
              } else if (target.dataset.attempt === '1') {
                target.dataset.attempt = '2';
                target.src = '/bg-utama.webp';
              } else if (target.dataset.attempt === '2') {
                target.dataset.attempt = '3';
                target.src = '/images/bg-utama.jpg';
              } else if (target.dataset.attempt === '3') {
                target.dataset.attempt = '4';
                target.src = '/bg-utama.png';
              }
            }}
          />
          {/* Dual gradient overlay: top-to-bottom dark vignette for mobile contrast, plus smooth left-to-right gradient for desktop */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C3C30]/95 via-[#0C3C30]/85 to-[#0C3C30]/60 md:bg-gradient-to-r md:from-[#0C3C30]/95 md:via-[#0C3C30]/65 md:to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.25] sm:leading-[1.1] mb-4 sm:mb-6 drop-shadow-md text-balance" style={{ background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Wujudkan Perjalanan Suci yang Khusyuk dan Penuh Berkah.
          </h1>
          <p className="text-[#E6DBC6] text-xs sm:text-base md:text-xl leading-relaxed mb-6 sm:mb-8 max-w-2xl font-light drop-shadow">
            Golden Travel menghadirkan layanan ibadah Haji dan Umroh eksklusif dengan fasilitas personal, premium, dan kedalaman spiritual. Aman, nyaman, dan profesional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10 w-full sm:w-auto">
            <a href="#pilihan-paket" className="w-full sm:w-auto bg-[#D4AF37] text-white text-center px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-transform duration-300 hover:scale-105 shadow-lg" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>
              Lihat Paket Umroh
            </a>
            <a href="https://wa.me/628123456789" className="w-full sm:w-auto border-2 border-[#d4af37] text-white text-center px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-all hover:bg-[#d4af37]/20" target="_blank" rel="noreferrer">
              Konsultasi Gratis
            </a>
          </div>

          <p className="text-[#d4af37] font-serif italic text-xs sm:text-base md:text-lg mb-8 sm:mb-12 drop-shadow-md">Kenyamanan dan Kepercayaan Anda, Prioritas Kami.</p>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <Award className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-xs sm:text-sm leading-tight">Sertifikat<br/>Komitmen</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-xs sm:text-sm leading-tight">Sertifikat<br/>Resmi</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-sm sm:text-sm leading-tight">Layanan<br/>Premium</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-lg border-b-4 border-[#d4af37]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center shrink-0">
                <MapPin className="text-[#d4af37] w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[#0d4732] font-semibold text-xs sm:text-sm leading-tight">Transportasi<br/>Resmi</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tentang Kami Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="tentang-kami">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 text-left">
            <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">✨ Tentang Perusahaan</div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-4 sm:mb-6">
              Dedikasi Menjaga Kekhusyukan Ibadah Anda di <span className="text-[#D4AF37]">Tanah Suci</span>
            </h2>
            
            <div className="space-y-3 sm:space-y-4 text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-10 font-light">
              <p>
                <strong className="text-white font-semibold">PT Golden Tour Haramain</strong> didirikan atas dasar niat suci untuk memfasilitasi umat Muslim di Indonesia dalam menunaikan ibadah Umrah dan Haji secara paripurna. Kami hadir bukan sekadar sebagai biro perjalanan, melainkan sebagai mitra spiritual yang mendampingi setiap langkah Anda menuju Baitullah.
              </p>
              <p>
                Dengan berpegang teguh pada tuntunan Al-Qur'an dan Sunnah, kami merancang setiap program secara teliti—mulai dari manasik yang komprehensif, pemilihan maskapai penerbangan terpercaya, hingga akomodasi strategis di ring satu—untuk memastikan kenyamanan, keamanan, dan kesempurnaan ibadah Anda.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-10">
              <div className="flex gap-3 sm:gap-4 items-start bg-white/5 p-3.5 sm:p-0 rounded-xl sm:bg-transparent">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2F4F4F]/80 text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#D4AF37]/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base sm:text-xl text-white mb-1 sm:mb-2">Legalitas Terjamin</h4>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">Terdaftar resmi di Kemenag RI, memberikan kepastian jadwal keberangkatan tanpa rasa khawatir.</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 items-start bg-white/5 p-3.5 sm:p-0 rounded-xl sm:bg-transparent">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2F4F4F]/80 text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#D4AF37]/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base sm:text-xl text-white mb-1 sm:mb-2">Bimbingan Sunnah</h4>
                  <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">Ibadah didampingi langsung oleh asatidz dan mutawwif berpengalaman lulusan Timur Tengah.</p>
                </div>
              </div>
            </div>
            
            <a href="#pilihan-paket" className="inline-flex items-center gap-2 text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1 font-bold text-xs sm:text-sm hover:text-amber-300 transition-colors tracking-wide" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>
              LIHAT PROFIL PERUSAHAAN &rarr;
            </a>
          </div>
          
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] aspect-[4/5] p-2 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-t-full rounded-b-3xl shadow-2xl overflow-hidden group">
              <img src="/foto-about.jpg.jpeg" alt="Jemaah PT Golden Tour Haramain" className="w-full h-full object-cover rounded-t-full rounded-b-2xl transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80'; }} />
            </div>
          </div>
        </div>
      </section>

      {/* Legalitas Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F]" id="legalitas">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">✨ Legalitas & Sertifikasi Resmi</div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-4 sm:mb-6 max-w-3xl mx-auto">
            Keamanan & Kenyamanan Anda Adalah <span className="text-[#D4AF37]">Prioritas Utama</span>
          </h2>
          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-10 sm:mb-16 font-light">
            Sebagai komitmen pelayanan prima, PT. Golden Tour Haramain beroperasi dengan perizinan penuh yang diawasi langsung oleh Kementerian Agama Republik Indonesia, memastikan setiap keberangkatan aman dan sesuai prosedur negara.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { title: 'Izin Penyelenggara Umrah (PPIU)', desc: 'Memiliki SK Kemenag RI resmi sebagai penyelenggara perjalanan ibadah umrah yang kredibel.', icon: '📜' },
              { title: 'Izin Haji Khusus (PIHK)', desc: 'Tersertifikasi untuk menyelenggarakan program Haji Khusus dengan kuota resmi negara.', icon: '🏛️' },
              { title: 'Keanggotaan Asosiasi', desc: 'Anggota aktif AMPHURI / HIMPUH, menjamin standar pelayanan industri travel ibadah.', icon: '🤝' },
              { title: 'Legalitas Perusahaan', desc: 'Terdaftar secara sah dengan NIB & Akta Pendirian Perusahaan yang tersertifikasi hukum.', icon: '🏢' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#2F4F4F]/90 rounded-2xl p-6 sm:p-8 border border-[#2F4F4F]/80 shadow-sm hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300 text-left group">
                <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{item.icon}</div>
                <h3 className="font-serif text-lg sm:text-xl text-white mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                <div className="w-0 h-1 bg-[#D4AF37] mt-4 sm:mt-6 transition-all duration-500 group-hover:w-full rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paket Umroh Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="pilihan-paket">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-10 sm:mb-16">
            <div className="max-w-2xl">
              <div className="inline-block bg-[#2F4F4F] text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 border border-[#D4AF37]/30">Paket Reguler & Plus</div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-3 sm:mb-4">
                Pilih Perjalanan Ibadah <span className="text-[#D4AF37]">Sesuai Kebutuhan Anda</span>
              </h2>
              <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                Nikmati kenyamanan ibadah ke Tanah Suci dengan berbagai pilihan durasi dan fasilitas kelas dunia yang dirancang khusus untuk ketenangan batiniah dan lahiriah.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => scrollTrack(trackRef, 'left')} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => scrollTrack(trackRef, 'right')} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div ref={trackRef} className="flex gap-4 sm:gap-8 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            
            {loading ? (
              <div className="w-full text-center py-20 text-stone-500 text-lg">Memuat paket pilihan...</div>
            ) : umrahPackages.length > 0 ? (
              umrahPackages.map((pkg) => (
                <div key={pkg.id} className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-2xl sm:rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-500 flex flex-col group">
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 backdrop-blur text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">{pkg.duration}</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">{pkg.name}</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                      <span className="text-base sm:text-lg align-top mr-1">Rp</span>{Number(pkg.price).toLocaleString('id-ID')}
                      <span className="font-sans text-xs sm:text-sm text-stone-400 font-normal ml-1">/ pax</span>
                    </div>
                    
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                      {Array.isArray(pkg.description) ? (
                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-stone-300 text-xs sm:text-sm">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> <span>{line}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-300 text-xs sm:text-sm line-clamp-4 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                    
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">
                      Lihat Detail Jadwal
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback
              <>
                <div className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-2xl sm:rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300">
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Paket Safa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">9 Hari</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">Paket Safa (Reguler)</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6"><span className="text-base sm:text-lg align-top mr-1">Rp</span>28.500.000<span className="font-sans text-xs sm:text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-xs sm:text-sm text-stone-300">
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Maskapai Saudia Airlines / Garuda Indonesia</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Makkah: Hotel Azka Al Safa (4⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Madinah: Hotel Taiba Front (4⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Bus Full AC / Kereta Cepat Haramain</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-bold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">Lihat Detail Jadwal</Link>
                  </div>
                </div>
                
                <div className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F] rounded-2xl sm:rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col relative transform lg:-translate-y-2 group">
                  <div className="absolute top-6 -right-12 bg-[#D4AF37] text-[#2F4F4F] px-12 py-1 rotate-45 text-[10px] font-black tracking-[0.2em] z-20 shadow-md">TERFAVORIT</div>
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Paket Marwa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">12 Hari</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">Paket Marwa (VIP)</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6"><span className="text-base sm:text-lg align-top mr-1">Rp</span>35.000.000<span className="font-sans text-xs sm:text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-xs sm:text-sm text-stone-300">
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Saudia Airlines (Direct Flight)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Makkah: Pullman ZamZam (5⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Madinah: Anwar Movenpick (5⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Tiket Kereta Cepat Haramain (VIP Class)</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl bg-[#D4AF37] text-[#2F4F4F] text-xs sm:text-sm font-bold hover:bg-amber-300 transition-colors shadow-lg">Booking Sekarang</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Paket Haji Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F] border-t border-[#2F4F4F]/90/50" id="pilihan-haji">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-10 sm:mb-16">
            <div className="max-w-2xl">
              <div className="inline-block bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 border border-[#D4AF37]/30">Haji Khusus & Furoda</div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-3 sm:mb-4">
                Program Haji Resmi, Nyaman, <br className="hidden sm:inline"/><span className="text-[#D4AF37]">Sesuai Syariat</span>
              </h2>
              <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                Tunaikan Rukun Islam kelima dengan tenang melalui program haji khusus yang terjamin legalitasnya, waktu tunggu yang lebih ideal, dan bimbingan ibadah intensif hingga mabrur.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => scrollTrack(hajiTrackRef, 'left')} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => scrollTrack(hajiTrackRef, 'right')} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-stone-600 flex justify-center items-center text-stone-300 hover:bg-[#D4AF37] hover:text-[#2F4F4F] hover:border-[#D4AF37] transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div ref={hajiTrackRef} className="flex gap-4 sm:gap-8 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            
            {loading ? (
              <div className="w-full text-center py-20 text-stone-500 text-lg">Memuat paket haji...</div>
            ) : hajiPackages.length > 0 ? (
              hajiPackages.map((pkg) => (
                <div key={pkg.id} className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-2xl sm:rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-500 flex flex-col group">
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 backdrop-blur text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">{pkg.duration}</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">{pkg.name}</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                      <span className="text-base sm:text-lg align-top mr-1">USD</span>{Number(pkg.price).toLocaleString('en-US')}
                      <span className="font-sans text-xs sm:text-sm text-stone-400 font-normal ml-1">/ pax</span>
                    </div>
                    
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                      {Array.isArray(pkg.description) ? (
                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 text-stone-300 text-xs sm:text-sm">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> <span>{line}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-300 text-xs sm:text-sm line-clamp-4 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                    
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">
                      Lihat Detail Jadwal
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback Haji
              <>
                <div className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-2xl sm:rounded-3xl border border-[#2F4F4F]/80 overflow-hidden shadow-sm flex flex-col group hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300">
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80" alt="Haji Khusus" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">26 Hari</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">Haji Khusus (ONH Plus)</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6"><span className="text-base sm:text-lg align-top mr-1">USD</span>14.500<span className="font-sans text-xs sm:text-sm text-stone-400 font-normal ml-1">/ pax</span></div>
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-xs sm:text-sm text-stone-300">
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Kuota Resmi Kementerian Agama RI</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Makkah: Fairmont / Pullman (5⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Madinah: Oberoi / Movenpick (5⭐)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Tenda Maktab VIP & Kereta Cepat</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-bold hover:bg-[#D4AF37] hover:text-[#2F4F4F] transition-colors">Konsultasi Kuota</Link>
                  </div>
                </div>

                <div className="min-w-[280px] sm:min-w-[340px] max-w-[340px] snap-center bg-[#2F4F4F]/90 rounded-2xl sm:rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col relative transform lg:-translate-y-2 group">
                  <div className="absolute top-6 -right-12 bg-[#D4AF37] text-[#2F4F4F] px-12 py-1 rotate-45 text-[10px] font-black tracking-[0.2em] z-20 shadow-md">TANPA ANTRI</div>
                  <div className="relative h-48 sm:h-64 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Haji Furoda" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#2F4F4F]/90 text-[#D4AF37] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm border border-[#D4AF37]/20">24 Hari</div>
                  </div>
                  <div className="p-5 sm:p-8 flex-1 flex flex-col">
                    <h3 className="font-serif text-xl sm:text-2xl text-white mb-2">Haji Furoda (Visa Mujamalah)</h3>
                    <div className="text-[#D4AF37] font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-6"><span className="text-base sm:text-lg align-top mr-1">Mulai USD</span>21.000</div>
                    <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-xs sm:text-sm text-stone-300">
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Keberangkatan Tahun Berjalan (Langsung)</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Visa Mujamalah Resmi Kerajaan Saudi</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Hotel Bintang 5 Pelataran Masjidil Haram</div>
                      <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" /> Tenda AC Khusus Maktab Furoda VIP</div>
                    </div>
                    <Link to="/login" className="block w-full text-center py-3 sm:py-3.5 rounded-xl bg-[#D4AF37] text-[#2F4F4F] text-xs sm:text-sm font-bold hover:bg-amber-300 transition-colors shadow-lg">Amankan Kursi</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F]/90" id="testimoni">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">✨ Ulasan Jemaah</div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-4 sm:mb-6 max-w-3xl mx-auto">
            Apa Kata Mereka Tentang <span className="text-[#D4AF37]">Pelayanan Kami?</span>
          </h2>
          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-10 sm:mb-16 font-light">
            Pengalaman nyata dari para jemaah yang telah mempercayakan perjalanan ibadah mereka kepada Golden Travel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {[
              { name: "Bapak H. Abdullah", role: "Jemaah Umroh Plus", text: "Pelayanan sangat memuaskan, mulai dari keberangkatan hingga kepulangan. Mutawwif sangat sabar dan berilmu, fasilitas hotel bintang 5 sesuai dengan yang dijanjikan. Alhamdulillah ibadah jadi lebih khusyuk." },
              { name: "Ibu Hj. Siti Aminah", role: "Jemaah Haji Khusus", text: "Awalnya khawatir karena berangkat Haji untuk pertama kali, tapi berkat bimbingan intensif dari Golden Travel, semua berjalan lancar. Tenda di Arafah sangat nyaman dan makanan terjamin." },
              { name: "Keluarga Bapak Budi", role: "Jemaah Umroh Reguler", text: "Terima kasih Golden Travel telah mewujudkan impian keluarga kami untuk ke Baitullah. Harga yang ditawarkan sangat sepadan dengan kualitas pelayanan VIP yang diberikan. Sangat direkomendasikan!" }
            ].map((testi, idx) => (
              <div key={idx} className="bg-[#2F4F4F] rounded-2xl p-6 sm:p-8 border border-[#2F4F4F]/80 shadow-sm relative">
                <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-[#2F4F4F]/80 absolute top-5 right-5 sm:top-6 sm:right-6 opacity-50" />
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6 font-light italic">"{testi.text}"</p>
                <div>
                  <h4 className="text-white font-bold text-sm sm:text-base">{testi.name}</h4>
                  <p className="text-[#D4AF37] text-xs">{testi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#2F4F4F]" id="galeri">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <div className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">✨ Jejak Langkah Spiritual</div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white leading-tight mb-3 sm:mb-4">
              Galeri <span className="text-[#D4AF37]">Keberangkatan</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
              Momen-momen indah dan penuh kekhusyukan para Tamu Allah yang telah mempercayakan perjalanan sucinya bersama kami.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-20">
            {[
              { src: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Khusyuk di Baitullah' },
              { src: 'https://images.unsplash.com/photo-1565552643954-1a4be7aa0fc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Ziarah Masjid Nabawi' },
              { src: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'City Tour Bersejarah' },
              { src: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', title: 'Keberangkatan Jemaah' },
            ].map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-sm">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-[#2F4F4F]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="font-serif text-[#D4AF37] text-xs sm:text-lg font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-center px-2 sm:px-4">{img.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cinematic Video Showcase */}
          <div className="relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-[#2F4F4F]/80 aspect-video">
            <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Cinematic Profile" className="w-full h-full object-cover brightness-75 group-hover:brightness-50 transition-all duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-[#2F4F4F]/20">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#D4AF37]/90 text-[#2F4F4F] rounded-full flex items-center justify-center mb-3 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#D4AF37] shadow-xl shadow-[#D4AF37]/30">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" fill="currentColor" />
              </div>
              <h3 className="font-serif text-lg sm:text-2xl md:text-4xl text-white font-bold mb-2 sm:mb-3 drop-shadow-md">Kenyamanan Beribadah Bersama Kami</h3>
              <p className="text-white/90 text-xs sm:text-sm md:text-lg max-w-xl font-light drop-shadow">Saksikan cuplikan perjalanan khusyuk para jemaah menikmati layanan VIP di Tanah Suci.</p>
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
                  <h3 className="font-serif text-lg text-white m-0">PT Golden Tour Haramain</h3>
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
                  <p>info@goldentourharamain.com</p>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-[#2F4F4F]/90 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
            <p>&copy; {new Date().getFullYear()} PT Golden Tour Haramain. Hak Cipta Dilindungi.</p>
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
