import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Play, CheckCircle2, ChevronLeft, ChevronRight, Award, ShieldCheck, MapPin, Phone, Mail, Star, Quote, Menu, X, LogIn, Sparkles, HeartHandshake, Compass, Layers, Hotel, FileCheck } from 'lucide-react';
import { useLogo } from '../utils/logo';
import heroBg from '../assets/bg-utama.jpg';
import { HEADER_BG_DATA } from '../assets/headerBgData';
import { ABOUT_BG_DATA } from '../assets/aboutBgData';
import { DIREKTUR_PHOTO_DATA } from '../assets/direkturPhotoData';
import LegalitasShowcase from '../components/LegalitasShowcase';
import WhyChooseGoldenTravel from '../components/WhyChooseGoldenTravel';
import PaketUmrahShowcase from '../components/PaketUmrahShowcase';
import PaketHajiShowcase from '../components/PaketHajiShowcase';

export default function Home() {
  const logoImg = useLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [direkturImgSrc, setDirekturImgSrc] = useState(DIREKTUR_PHOTO_DATA);

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
      <header className="sticky top-0 z-50 bg-[#F9F5EC] bg-cover bg-center bg-no-repeat border-b border-[#D4AF37]/40 py-2.5 sm:py-3.5 px-3 sm:px-6 md:px-12 flex justify-between items-center shadow-md transition-all duration-300" style={{ backgroundImage: `url("${HEADER_BG_DATA}")` }}>
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
        <div className="lg:hidden fixed inset-x-0 top-[52px] sm:top-[68px] z-40 bg-[#FAF7F2] bg-cover bg-center border-b border-[#D4AF37]/40 shadow-2xl px-4 py-4 max-h-[calc(100vh-60px)] overflow-y-auto rounded-b-2xl transition-all duration-300 space-y-3" style={{ backgroundImage: `url("${HEADER_BG_DATA}")` }}>
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
        
        <div className="relative z-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Main Hero Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6">
              <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[1.25] sm:leading-[1.1] drop-shadow-md text-balance" style={{ background: 'linear-gradient(to right, #D4AF37, #F3E5AB, #D4AF37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Wujudkan Perjalanan Suci yang Khusyuk dan Penuh Berkah.
              </h1>
              <p className="text-[#E6DBC6] text-xs sm:text-base md:text-xl leading-relaxed max-w-2xl font-light drop-shadow">
                Golden Travel menghadirkan layanan ibadah Haji dan Umroh eksklusif dengan fasilitas personal, premium, dan kedalaman spiritual. Aman, nyaman, dan profesional.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto pt-2">
                <a href="#pilihan-paket" className="w-full sm:w-auto bg-[#D4AF37] text-white text-center px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-transform duration-300 hover:scale-105 shadow-lg" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>
                  Lihat Paket Umroh
                </a>
                <a href="https://wa.me/628123456789" className="w-full sm:w-auto border-2 border-[#d4af37] text-white text-center px-6 sm:px-8 py-3 rounded-full font-semibold text-sm sm:text-base transition-all hover:bg-[#d4af37]/20" target="_blank" rel="noreferrer">
                  Konsultasi Gratis
                </a>
              </div>

              <p className="text-[#d4af37] font-serif italic text-xs sm:text-base md:text-lg drop-shadow-md">
                "Kenyamanan dan Kepercayaan Anda, Prioritas Kami."
              </p>
            </div>

            {/* Right Column: Director Photo Display (Frameless, Seamless Bottom Fade & Transparent Cutout) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center text-center">
              {/* Direct Photo cutout - with gentle bottom fade mask so cut-off edge is completely invisible */}
              <div 
                className="relative w-full max-w-[300px] sm:max-w-[340px] group transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 98%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 98%)'
                }}
              >
                <img 
                  src={direkturImgSrc} 
                  alt="Ustadz Ahmad Daud - Direktur Utama PT. Golden Tour Haromain" 
                  className="w-full h-auto max-h-[380px] sm:max-h-[440px] object-contain mx-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
                  onError={() => {
                    if (direkturImgSrc === '/owner.png') {
                      setDirekturImgSrc('/direktur.png');
                    } else if (direkturImgSrc === '/direktur.png') {
                      setDirekturImgSrc(DIREKTUR_PHOTO_DATA);
                    }
                  }}
                />
                {/* Soft dark gradient at bottom edge to guarantee zero cut-off line */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#01251a] via-[#01251a]/60 to-transparent pointer-events-none" />
              </div>

              {/* Name & Official Title below photo */}
              <div className="mt-1 space-y-1 relative z-10">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3E5AB] drop-shadow-md tracking-wide">
                  Ustadz Ahmad Daud
                </h3>
                <p className="text-[#D4AF37] text-sm sm:text-base font-medium">
                  Direktur Utama PT. Golden Tour Haromain
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#10B981] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resmi &amp; Terverifikasi Kemenag RI</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom 4 Feature Cards */}
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
      
      {/* Tentang Kami Section - Executive Modern Showcase with Proportional Kaaba Background */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#012519] text-white overflow-hidden" id="tentang-kami">
        {/* Proportional Background Ka'bah Showcase Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Base Background Color matching dark emerald green */}
          <div className="absolute inset-0 bg-[#012519]"></div>
          
          {/* Kaaba & Minarets Image: Positioned on the right with controlled proportional scale */}
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-4/5 md:w-3/4 lg:w-2/3 h-full">
            <img 
              src={ABOUT_BG_DATA} 
              alt="Latar Belakang Ka'bah Golden Travel" 
              className="w-full h-full object-cover object-right sm:object-[85%_center] opacity-90 transition-opacity duration-500"
            />
          </div>

          {/* Seamless Dark Emerald Gradients & Soft Vignettes for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#012519] via-[#012519]/85 to-transparent sm:via-[#012519]/65"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#012519]/70 via-transparent to-[#012519]/80"></div>
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[400px] bg-[#D4AF37]/15 rounded-full blur-[140px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-16">
          
          {/* Main Title & Narrative Header */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-lg backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>Tentang Golden Travel</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Perjalanan Kami Membantu Mewujudkan <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent underline decoration-[#D4AF37]/40 underline-offset-8">
                Ibadah Impian Anda
              </span>
            </h2>

            {/* Slogan Banner Pill */}
            <div className="pt-2">
              <div className="inline-block bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/30 to-[#D4AF37]/15 border border-[#D4AF37]/60 px-6 py-2.5 rounded-full shadow-lg backdrop-blur-md">
                <p className="font-serif text-sm sm:text-base md:text-lg italic font-medium text-[#F3E5AB] tracking-wide">
                  "Kenyamanan dan Kepercayaan Anda, Prioritas Utama Kami."
                </p>
              </div>
            </div>
          </div>

          {/* New Narrative Master Layout: Kerinduan Suci Memanggil & Perjalanan Hati Sakral */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
              
              {/* Card 1: Kerinduan Suci Memanggil */}
              <div className="group relative bg-gradient-to-br from-[#062116]/90 via-[#031810]/85 to-[#02120b]/90 border-2 border-[#D4AF37]/60 rounded-3xl p-7 sm:p-9 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:border-[#D4AF37] hover:shadow-[0_25px_60px_rgba(212,175,55,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] via-[#F3E5AB] to-[#8B6508]"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                        <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                          <Compass className="w-6 h-6" />
                        </div>
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                        Niat & Visi Suci
                      </span>
                    </div>
                    <span className="font-serif font-extrabold text-2xl text-[#D4AF37]/30 group-hover:text-[#D4AF37]/60 transition-colors">
                      01
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3E5AB] mb-4">
                    Kerinduan Suci Memanggil
                  </h3>

                  <div className="relative pl-4 border-l-2 border-[#D4AF37]/40 mb-4 bg-[#082218]/40 p-4 rounded-r-xl">
                    <p className="font-sans text-stone-200 text-sm sm:text-base leading-relaxed font-light text-justify">
                      Golden Travel hadir berawal dari sebuah kerinduan yang mendalam—kerinduan untuk memfasilitasi panggilan suci ke Baitullah melalui layanan Haji dan Umroh yang tidak sekadar eksklusif, namun juga kaya akan makna dan kedalaman spiritual.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D4AF37]/25 flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Layanan Ibadah Eksklusif & Penuh Makna</span>
                </div>
              </div>

              {/* Card 2: Perjalanan Hati Sakral */}
              <div className="group relative bg-gradient-to-br from-[#062116]/90 via-[#031810]/85 to-[#02120b]/90 border-2 border-[#D4AF37]/60 rounded-3xl p-7 sm:p-9 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:border-[#D4AF37] hover:shadow-[0_25px_60px_rgba(212,175,55,0.25)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] via-[#F3E5AB] to-[#8B6508]"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full pointer-events-none"></div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                        <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                          <HeartHandshake className="w-6 h-6" />
                        </div>
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                        Dedikasi Pendampingan
                      </span>
                    </div>
                    <span className="font-serif font-extrabold text-2xl text-[#D4AF37]/30 group-hover:text-[#D4AF37]/60 transition-colors">
                      02
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3E5AB] mb-4">
                    Perjalanan Hati Sakral
                  </h3>

                  <div className="relative pl-4 border-l-2 border-[#D4AF37]/40 mb-4 bg-[#082218]/40 p-4 rounded-r-xl">
                    <p className="font-sans text-stone-200 text-sm sm:text-base leading-relaxed font-light text-justify">
                      Kami didirikan di atas fondasi kecintaan yang tulus pada perjalanan suci ini. Kami meyakini bahwa setiap jejak langkah menuju Tanah Suci adalah perjalanan hati yang sakral. Seluruh tim ahli kami berkomitmen penuh menjadi pendamping setia Anda, memastikan ibadah berjalan tenang, khusyuk, dan sempurna.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D4AF37]/25 flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pendampingan Khusyuk & Tanpa Ragu</span>
                </div>
              </div>

            </div>

            {/* Executive Guarantees Ribbon */}
            <div className="bg-[#051a12]/90 border-2 border-[#D4AF37]/50 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-3.5 rounded-xl bg-[#082218]/80 border border-[#D4AF37]/30 shadow-inner flex flex-col justify-center items-center">
                  <span className="text-[#D4AF37] font-serif font-bold text-xs sm:text-sm md:text-base block mb-0.5">Izin Resmi Kemenag RI</span>
                  <span className="text-stone-300 text-[11px] sm:text-xs font-light">Legalitas & Kepastian Keberangkatan</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#082218]/80 border border-[#D4AF37]/30 shadow-inner flex flex-col justify-center items-center">
                  <span className="text-[#D4AF37] font-serif font-bold text-xs sm:text-sm md:text-base block mb-0.5">Hotel Ring 1 Bintang 5</span>
                  <span className="text-stone-300 text-[11px] sm:text-xs font-light">Pelataran Masjidil Haram & Nabawi</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#082218]/80 border border-[#D4AF37]/30 shadow-inner flex flex-col justify-center items-center">
                  <span className="text-[#D4AF37] font-serif font-bold text-xs sm:text-sm md:text-base block mb-0.5">Pembimbing Ahli Sunnah</span>
                  <span className="text-stone-300 text-[11px] sm:text-xs font-light">Asatidz Alumni Timur Tengah</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#082218]/80 border border-[#D4AF37]/30 shadow-inner flex flex-col justify-center items-center">
                  <span className="text-[#D4AF37] font-serif font-bold text-xs sm:text-sm md:text-base block mb-0.5">Fasilitas Executive VIP</span>
                  <span className="text-stone-300 text-[11px] sm:text-xs font-light">Bus Private & Personal Care</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Values Section Header & Grid */}
          <div className="space-y-10 pt-4">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase border border-[#D4AF37]/30">
                <span>Fondasi Keunggulan Utama</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#F3E5AB] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                Empat Pilar Layanan Golden Travel
              </h3>
              <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
                Komitmen kami diwujudkan melalui empat pilar utama yang menjadi landasan utama di setiap lini layanan kami:
              </p>
            </div>

            {/* 4 Pilar Core Values - Modern Structured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              
              {/* Pillar 1: Profesionalisme */}
              <div className="bg-[#041a12]/90 backdrop-blur-xl text-white border-2 border-[#D4AF37]/60 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>
                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                      <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[11px] text-[#0B2319] bg-[#F3E5AB] px-3 py-1 rounded-full border border-[#D4AF37]">
                      PILAR 01
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#F3E5AB] mb-2 flex items-center gap-2">
                    <span className="text-[#D4AF37]">✦</span> Profesionalisme
                  </h4>
                  <p className="font-sans text-stone-200 text-xs sm:text-sm leading-relaxed font-light text-left mb-4">
                    Tim ahli kami yang berdedikasi bekerja tanpa henti di balik layar untuk memastikan setiap detail perjalanan Anda ditangani dengan standar kesempurnaan tertinggi.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/30 space-y-1.5 text-xs text-stone-300 font-light">
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Standar Layanan Bintang 5
                  </div>
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Tim Operasional Standby 24/7
                  </div>
                </div>
              </div>

              {/* Pillar 2: Integritas */}
              <div className="bg-[#041a12]/90 backdrop-blur-xl text-white border-2 border-[#D4AF37]/60 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>
                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                      <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[11px] text-[#0B2319] bg-[#F3E5AB] px-3 py-1 rounded-full border border-[#D4AF37]">
                      PILAR 02
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#F3E5AB] mb-2 flex items-center gap-2">
                    <span className="text-[#D4AF37]">✦</span> Integritas
                  </h4>
                  <p className="font-sans text-stone-200 text-xs sm:text-sm leading-relaxed font-light text-left mb-4">
                    Fondasi utama kami adalah kejujuran dan keterbukaan. Kami menjunjung tinggi prinsip moral ini dalam setiap interaksi, membangun jembatan kepercayaan yang kokoh.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/30 space-y-1.5 text-xs text-stone-300 font-light">
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Tanpa Biaya Tersembunyi
                  </div>
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Transparansi Fasilitas & Jadwal
                  </div>
                </div>
              </div>

              {/* Pillar 3: Kenyamanan Tanpa Kompromi */}
              <div className="bg-[#041a12]/90 backdrop-blur-xl text-white border-2 border-[#D4AF37]/60 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>
                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                      <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                        <Hotel className="w-6 h-6" />
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[11px] text-[#0B2319] bg-[#F3E5AB] px-3 py-1 rounded-full border border-[#D4AF37]">
                      PILAR 03
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#F3E5AB] mb-2 flex items-center gap-2">
                    <span className="text-[#D4AF37]">✦</span> Kenyamanan Total
                  </h4>
                  <p className="font-sans text-stone-200 text-xs sm:text-sm leading-relaxed font-light text-left mb-4">
                    Fokus dan kekhusyukan ibadah Anda adalah prioritas absolut kami. Kami menyediakan fasilitas premium dan akomodasi bertaraf internasional terbaik.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/30 space-y-1.5 text-xs text-stone-300 font-light">
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Akomodasi Ring 1 Terdekat
                  </div>
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Bus Executive & Menu Indonesia
                  </div>
                </div>
              </div>

              {/* Pillar 4: Transparansi Setiap Langkah */}
              <div className="bg-[#041a12]/90 backdrop-blur-xl text-white border-2 border-[#D4AF37]/60 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:shadow-[0_20px_45px_rgba(212,175,55,0.35)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>
                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] p-0.5 shadow-md">
                      <div className="w-full h-full bg-[#081E15] rounded-[10px] flex items-center justify-center text-[#D4AF37]">
                        <FileCheck className="w-6 h-6" />
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[11px] text-[#0B2319] bg-[#F3E5AB] px-3 py-1 rounded-full border border-[#D4AF37]">
                      PILAR 04
                    </span>
                  </div>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#F3E5AB] mb-2 flex items-center gap-2">
                    <span className="text-[#D4AF37]">✦</span> Transparansi Proses
                  </h4>
                  <p className="font-sans text-stone-200 text-xs sm:text-sm leading-relaxed font-light text-left mb-4">
                    Kepastian adalah kunci ketenangan. Setiap proses—mulai pendaftaran, persiapan, pelaksanaan hingga kepulangan—kami jelaskan secara jernih dan terperinci.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/30 space-y-1.5 text-xs text-stone-300 font-light">
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Bimbingan Manasik Intensif
                  </div>
                  <div className="flex items-center gap-1.5 text-[#F3E5AB]">
                    <span className="text-[#D4AF37]">✓</span> Pendampingan Paspor & Visa
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Legalitas Section - Executive Modern Showcase with Kaaba Background */}
      <LegalitasShowcase />

      {/* Mengapa Memilih Golden Travel Section */}
      <WhyChooseGoldenTravel />

      {/* Paket Umrah Section - Executive Showcase Component */}
      <PaketUmrahShowcase />

      {/* Paket Haji Section - Executive Showcase Component */}
      <PaketHajiShowcase />

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
                <div className="w-10 h-10 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-[#064e3b] shrink-0 flex items-center justify-center">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
                </div>
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
