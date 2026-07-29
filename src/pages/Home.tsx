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
import TestimonialsShowcase from '../components/TestimonialsShowcase';
import DepartureGalleryShowcase from '../components/DepartureGalleryShowcase';
import VideoProfileShowcase from '../components/VideoProfileShowcase';

export default function Home() {
  const logoImg = useLogo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('beranda');
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [direkturImgSrc, setDirekturImgSrc] = useState(DIREKTUR_PHOTO_DATA);

  // ScrollSpy to update active nav underline as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'beranda', elementId: 'hero-section' },
        { id: 'tentang-kami', elementId: 'tentang-kami' },
        { id: 'pilihan-paket', elementId: 'pilihan-paket' },
        { id: 'pilihan-haji', elementId: 'pilihan-haji' },
        { id: 'galeri', elementId: 'galeri' }
      ];

      const scrollPosition = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        const el = document.getElementById(sec.elementId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const targetId = sectionId === 'hero-section' ? 'beranda' : sectionId;
    setActiveSection(targetId);
    if (sectionId === 'beranda' || sectionId === 'hero-section') {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
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
        <nav className="hidden lg:flex gap-5 xl:gap-8 text-xs xl:text-sm font-semibold items-center">
          <a 
            href="#" 
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeSection === 'beranda' 
                ? 'text-[#064e3b] font-bold border-[#064e3b]' 
                : 'text-[#1f3a30] hover:text-[#064e3b] border-transparent'
            }`} 
            onClick={(e) => scrollToSection(e, 'beranda')}
          >
            Beranda
          </a>
          <a 
            href="#tentang-kami" 
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeSection === 'tentang-kami' 
                ? 'text-[#064e3b] font-bold border-[#064e3b]' 
                : 'text-[#1f3a30] hover:text-[#064e3b] border-transparent'
            }`} 
            onClick={(e) => scrollToSection(e, 'tentang-kami')}
          >
            Tentang Kami
          </a>
          <Link to="/legalitas" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors pb-1 border-b-2 border-transparent">
            Legalitas
          </Link>
          <a 
            href="#pilihan-paket" 
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeSection === 'pilihan-paket' 
                ? 'text-[#064e3b] font-bold border-[#064e3b]' 
                : 'text-[#1f3a30] hover:text-[#064e3b] border-transparent'
            }`} 
            onClick={(e) => scrollToSection(e, 'pilihan-paket')}
          >
            Paket Umroh
          </a>
          <a 
            href="#pilihan-haji" 
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeSection === 'pilihan-haji' 
                ? 'text-[#064e3b] font-bold border-[#064e3b]' 
                : 'text-[#1f3a30] hover:text-[#064e3b] border-transparent'
            }`} 
            onClick={(e) => scrollToSection(e, 'pilihan-haji')}
          >
            Paket Haji
          </a>
          <a 
            href="#galeri" 
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeSection === 'galeri' 
                ? 'text-[#064e3b] font-bold border-[#064e3b]' 
                : 'text-[#1f3a30] hover:text-[#064e3b] border-transparent'
            }`} 
            onClick={(e) => scrollToSection(e, 'galeri')}
          >
            Galeri
          </a>
          <Link to="/mitra" className="text-[#1f3a30] hover:text-[#064e3b] transition-colors pb-1 border-b-2 border-transparent">
            Kemitraan
          </Link>
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
            <a 
              href="#" 
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                activeSection === 'beranda' ? 'text-[#064e3b] font-bold bg-emerald-50/70' : 'text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]'
              }`} 
              onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'beranda'); }}
            >
              <span>Beranda</span>
              <span className="text-xs text-[#064e3b]">›</span>
            </a>
            <a 
              href="#tentang-kami" 
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                activeSection === 'tentang-kami' ? 'text-[#064e3b] font-bold bg-emerald-50/70' : 'text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]'
              }`} 
              onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'tentang-kami'); }}
            >
              <span>Tentang Kami</span>
              <span className="text-xs text-[#064e3b]">›</span>
            </a>
            <Link to="/legalitas" className="flex items-center justify-between py-2.5 px-3 rounded-lg text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]" onClick={() => setMobileMenuOpen(false)}>
              <span>Legalitas Resmi</span>
              <span className="text-xs text-gray-400">›</span>
            </Link>
            <a 
              href="#pilihan-paket" 
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                activeSection === 'pilihan-paket' ? 'text-[#064e3b] font-bold bg-emerald-50/70' : 'text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]'
              }`} 
              onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'pilihan-paket'); }}
            >
              <span>Paket Umroh</span>
              <span className="text-xs text-[#064e3b]">›</span>
            </a>
            <a 
              href="#pilihan-haji" 
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                activeSection === 'pilihan-haji' ? 'text-[#064e3b] font-bold bg-emerald-50/70' : 'text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]'
              }`} 
              onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'pilihan-haji'); }}
            >
              <span>Paket Haji</span>
              <span className="text-xs text-[#064e3b]">›</span>
            </a>
            <a 
              href="#galeri" 
              className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
                activeSection === 'galeri' ? 'text-[#064e3b] font-bold bg-emerald-50/70' : 'text-gray-700 font-medium hover:bg-stone-50 hover:text-[#064e3b]'
              }`} 
              onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'galeri'); }}
            >
              <span>Galeri Keberangkatan</span>
              <span className="text-xs text-[#064e3b]">›</span>
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

            {/* Right Column: Director Photo Display (Frameless & Clean Cutout) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center text-center">
              {/* Direct Photo Cutout - No card, no background box, frameless */}
              <div 
                className="relative w-full max-w-[300px] sm:max-w-[340px] group transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 98%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 98%)'
                }}
              >
                <img 
                  src={direkturImgSrc} 
                  alt="Ustadz Ahmad Daud - Direktur Utama PT. Golden Tour Haramain" 
                  className="w-full h-auto max-h-[380px] sm:max-h-[420px] object-contain mx-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
                  onError={() => {
                    if (direkturImgSrc === '/owner.png') {
                      setDirekturImgSrc('/direktur.png');
                    } else if (direkturImgSrc === '/direktur.png') {
                      setDirekturImgSrc(DIREKTUR_PHOTO_DATA);
                    }
                  }}
                />
              </div>

              {/* Clean, Neat Name & Title Below Photo (Frameless) */}
              <div className="mt-2 space-y-1 relative z-10">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3E5AB] drop-shadow-md tracking-wide">
                  Ustadz Ahmad Daud
                </h3>
                <p className="text-[#D4AF37] text-sm sm:text-base font-semibold tracking-wide">
                  Direktur Utama PT. Golden Tour Haramain
                </p>
                <div className="pt-1.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#10B981] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
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
      <section className="relative py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#06281e] text-white overflow-hidden" id="tentang-kami">
        {/* Subtle Background Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute inset-0 bg-[#06281e]"></div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[140px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-12">
          
          {/* Main Title & Narrative Header */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#083829] border border-[#14533e] text-[#e5c158] text-xs font-semibold tracking-widest uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e5c158]" />
              <span>TENTANG GOLDEN TRAVEL</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight">
              Perjalanan Kami Membantu <br className="hidden sm:inline" />
              Mewujudkan <span className="text-[#e5c158] font-serif">Ibadah Impian Anda</span>
            </h2>

            {/* Slogan Subtitle */}
            <p className="font-serif italic text-base sm:text-lg md:text-xl text-[#e5c158]/90 font-light tracking-wide pt-1">
              “Kenyamanan dan Kepercayaan Anda, Prioritas Utama Kami.”
            </p>
          </div>

          {/* Cards Layout: Kerinduan Suci Memanggil & Perjalanan Hati Sakral */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              
              {/* Card 1: Kerinduan Suci Memanggil */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                        <Compass className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                        NIAT & VISI SUCI
                      </span>
                    </div>
                    <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1e5845]">
                      01
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f5f5f0] mb-3">
                    Kerinduan Suci Memanggil
                  </h3>

                  <p className="font-sans text-[#bdccc4] text-sm sm:text-base leading-relaxed font-light">
                    Golden Travel hadir berawal dari sebuah kerinduan yang mendalam—kerinduan untuk memfasilitasi panggilan suci ke Baitullah melalui layanan Haji dan Umroh yang tidak sekadar eksklusif, namun juga kaya akan makna dan kedalaman spiritual.
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-[#14533e] flex items-center gap-2 text-xs font-medium text-[#e5c158]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Layanan Ibadah Eksklusif & Penuh Makna</span>
                </div>
              </div>

              {/* Card 2: Perjalanan Hati Sakral */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                        DEDIKASI PENDAMPINGAN
                      </span>
                    </div>
                    <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1e5845]">
                      02
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f5f5f0] mb-3">
                    Perjalanan Hati Sakral
                  </h3>

                  <p className="font-sans text-[#bdccc4] text-sm sm:text-base leading-relaxed font-light">
                    Kami didirikan di atas fondasi kecintaan yang tulus pada perjalanan suci ini. Kami meyakini bahwa setiap jejak langkah menuju Tanah Suci adalah perjalanan hati yang sakral. Seluruh tim ahli kami berkomitmen penuh menjadi pendamping setia Anda, memastikan ibadah berjalan tenang, khusyuk, dan sempurna.
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-[#14533e] flex items-center gap-2 text-xs font-medium text-[#e5c158]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pendampingan Khusyuk & Tanpa Ragu</span>
                </div>
              </div>

            </div>

            {/* Bottom Feature Ribbon Card */}
            <div className="bg-[#083023]/90 border border-[#14533e] rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-lg sm:text-xl text-[#e5c158]">Izin Resmi Kemenag RI</h4>
                  <p className="text-xs sm:text-sm text-[#9eb2a7] font-light">Legalitas & Kepastian Keberangkatan</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-lg sm:text-xl text-[#e5c158]">Hotel Ring 1 Bintang 5</h4>
                  <p className="text-xs sm:text-sm text-[#9eb2a7] font-light">Pelataran Masjidil Haram & Nabawi</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-lg sm:text-xl text-[#e5c158]">Pembimbing Ahli Sunnah</h4>
                  <p className="text-xs sm:text-sm text-[#9eb2a7] font-light">Asatidz Alumni Timur Tengah</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-semibold text-lg sm:text-xl text-[#e5c158]">Fasilitas Executive VIP</h4>
                  <p className="text-xs sm:text-sm text-[#9eb2a7] font-light">Bus Private & Personal Care</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Values Section Header & Grid */}
          <div className="space-y-10 pt-6">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#083829] border border-[#14533e] text-[#e5c158] text-xs font-semibold tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#e5c158]" />
                <span>FONDASI KEUNGGULAN UTAMA</span>
              </div>
              
              <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
                Empat <span className="text-[#e5c158] font-serif">Pilar Layanan</span> Golden Travel
              </h3>
              
              <p className="text-[#bdccc4] text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">
                Komitmen kami diwujudkan melalui empat pilar utama yang menjadi landasan utama di setiap lini layanan kami:
              </p>
            </div>

            {/* 4 Pilar Core Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
              
              {/* Pilar 01: Profesionalisme */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                      PILAR 01
                    </span>
                  </div>

                  <h4 className="font-serif text-xl font-semibold text-[#f5f5f0] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e5c158] shrink-0" />
                    <span>Profesionalisme</span>
                  </h4>

                  <p className="font-sans text-[#bdccc4] text-xs sm:text-sm leading-relaxed font-light mb-6">
                    Tim ahli kami yang berdedikasi bekerja tanpa henti di balik layar untuk memastikan setiap detail perjalanan Anda ditangani dengan standar kesempurnaan tertinggi.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#14533e] space-y-2 text-xs text-[#bdccc4] font-light">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Standar Layanan Bintang 5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Tim Operasional Standby 24/7</span>
                  </div>
                </div>
              </div>

              {/* Pilar 02: Integritas */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                      PILAR 02
                    </span>
                  </div>

                  <h4 className="font-serif text-xl font-semibold text-[#f5f5f0] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e5c158] shrink-0" />
                    <span>Integritas</span>
                  </h4>

                  <p className="font-sans text-[#bdccc4] text-xs sm:text-sm leading-relaxed font-light mb-6">
                    Fondasi utama kami adalah kejujuran dan keterbukaan. Kami menjunjung tinggi prinsip moral ini dalam setiap interaksi, membangun jembatan kepercayaan yang kokoh.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#14533e] space-y-2 text-xs text-[#bdccc4] font-light">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Tanpa Biaya Tersembunyi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Transparansi Fasilitas & Jadwal</span>
                  </div>
                </div>
              </div>

              {/* Pilar 03: Kenyamanan Total */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                      <Hotel className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                      PILAR 03
                    </span>
                  </div>

                  <h4 className="font-serif text-xl font-semibold text-[#f5f5f0] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e5c158] shrink-0" />
                    <span>Kenyamanan Total</span>
                  </h4>

                  <p className="font-sans text-[#bdccc4] text-xs sm:text-sm leading-relaxed font-light mb-6">
                    Fokus dan kekhusyukan ibadah Anda adalah prioritas absolut kami. Kami menyediakan fasilitas premium dan akomodasi bertaraf internasional terbaik.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#14533e] space-y-2 text-xs text-[#bdccc4] font-light">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Akomodasi Ring 1 Terdekat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Bus Executive & Menu Indonesia</span>
                  </div>
                </div>
              </div>

              {/* Pilar 04: Transparansi Proses */}
              <div className="bg-[#083023]/90 border border-[#14533e] hover:border-[#1e6e53] transition-all rounded-2xl p-6 flex flex-col justify-between shadow-xl group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#083829] border border-[#14533e] flex items-center justify-center text-[#e5c158] shadow-sm">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#e5c158] uppercase bg-[#083829] px-3.5 py-1 rounded-full border border-[#14533e]">
                      PILAR 04
                    </span>
                  </div>

                  <h4 className="font-serif text-xl font-semibold text-[#f5f5f0] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e5c158] shrink-0" />
                    <span>Transparansi Proses</span>
                  </h4>

                  <p className="font-sans text-[#bdccc4] text-xs sm:text-sm leading-relaxed font-light mb-6">
                    Kepastian adalah kunci ketenangan. Setiap proses—mulai pendaftaran, persiapan, pelaksanaan hingga kepulangan—kami jelaskan secara jernih dan terperinci.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#14533e] space-y-2 text-xs text-[#bdccc4] font-light">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Bimbingan Manasik Intensif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#e5c158] font-bold">✓</span>
                    <span>Pendampingan Paspor & Visa</span>
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

      {/* Testimonial Section - Executive Testimonials Showcase Component */}
      <TestimonialsShowcase />

      {/* Gallery Section - Departure Gallery Showcase Component */}
      <DepartureGalleryShowcase />

      {/* Video Profile & Special Documentary Section */}
      <VideoProfileShowcase />

      {/* Footer */}
      <footer 
        className="bg-[#01140e] bg-cover bg-center bg-no-repeat border-t-2 border-[#D4AF37]/60 pt-12 sm:pt-16 pb-8 px-5 sm:px-8 md:px-12 lg:px-20 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] relative z-20 text-xs sm:text-sm text-stone-200 overflow-hidden"
        style={{ backgroundImage: `url('/testimoni-bg.png')` }}
      >
        {/* Soft Dark Emerald Overlay for maximum contrast & seamless blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#011f17]/95 via-[#01140e]/95 to-[#000d08]/98 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
            
            {/* Column 1: Brand Info & License */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#011710] shrink-0 flex items-center justify-center shadow-md p-0.5">
                    <img src={logoImg} alt="Logo Golden Travel" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white m-0 leading-tight tracking-wide">GOLDEN TRAVEL</h3>
                    <span className="text-[10px] text-[#D4AF37] font-extrabold tracking-widest uppercase block">PT GOLDEN TOUR HARAMAIN</span>
                  </div>
                </div>
                
                <p className="text-stone-300 text-xs leading-relaxed font-light">
                  Biro perjalanan Haji & Umrah terpercaya, melayani sepenuh hati untuk ibadah mabrur, amanah, dan kenyamanan perjalanan suci Anda.
                </p>
              </div>
              
              <div className="bg-[#01281e]/90 border border-[#D4AF37]/40 p-3 rounded-xl text-xs text-stone-200 shadow-md backdrop-blur-sm space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[#F3E5AB] text-[11px]">PT. GOLDEN TOUR HARAMAIN</span>
                  <span className="text-[10px] bg-[#D4AF37]/20 text-[#F3E5AB] font-semibold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40">Izin PPIU Kemenag Resmi</span>
                </div>
                <p className="text-stone-300 text-[10px] m-0 font-light">Mitra Resmi PT. SEDERHANA ALMAIDANI GROUP</p>
              </div>
            </div>

            {/* Column 2: Layanan Utama */}
            <div>
              <h4 className="font-serif text-[#F3E5AB] text-base font-bold mb-4 pb-2 border-b border-[#D4AF37]/30 flex items-center gap-2">
                <span className="text-[#D4AF37] text-xs">✦</span> Layanan Utama
              </h4>
              <ul className="space-y-2.5 text-stone-300 text-xs font-light">
                <li><a href="#pilihan-paket" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Paket Umroh Reguler Bintang 4 & 5</a></li>
                <li><a href="#pilihan-paket" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Paket Umroh VIP Executive & Plus Turki</a></li>
                <li><a href="#pilihan-haji" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Program Haji Furoda Direct Flight</a></li>
                <li><a href="#pilihan-haji" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Program Haji Khusus Resmi (PIHK)</a></li>
                <li><a href="#pilihan-paket" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Pengurusan Visa, Tasreh & Handling</a></li>
              </ul>
            </div>

            {/* Column 3: Navigasi Portal */}
            <div>
              <h4 className="font-serif text-[#F3E5AB] text-base font-bold mb-4 pb-2 border-b border-[#D4AF37]/30 flex items-center gap-2">
                <span className="text-[#D4AF37] text-xs">✦</span> Navigasi & Portal
              </h4>
              <ul className="space-y-2 text-stone-300 text-xs font-light mb-4">
                <li><a href="#tentang-kami" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Tentang Golden Travel</a></li>
                <li><Link to="/legalitas" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Legalitas Resmi Kemenag RI</Link></li>
                <li><a href="#galeri" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Galeri Keberangkatan Jemaah</a></li>
                <li><Link to="/mitra" className="hover:text-[#F3E5AB] transition-all flex items-center gap-1.5 group"><span className="text-[#D4AF37] group-hover:translate-x-1 transition-transform">›</span> Program Kemitraan Travel Agent</Link></li>
              </ul>
              
              <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-col gap-2">
                <Link to="/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#011710] hover:brightness-110 text-[11px] font-bold transition-all shadow-md w-fit">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Portal Login Jemaah</span>
                </Link>
                <Link to="/mitra/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#01281e] border border-[#D4AF37]/40 text-[#F3E5AB] hover:bg-[#023a2c] text-[11px] font-semibold transition-all w-fit">
                  <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Portal Login Mitra Agent</span>
                </Link>
                <Link to="/admin/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#241703] border border-[#f59e0b]/40 text-[#F3E5AB] hover:bg-[#382404] text-[11px] font-semibold transition-all w-fit">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Portal Login Admin</span>
                </Link>
              </div>
            </div>

            {/* Column 4: Kantor & Kontak */}
            <div>
              <h4 className="font-serif text-[#F3E5AB] text-base font-bold mb-4 pb-2 border-b border-[#D4AF37]/30 flex items-center gap-2">
                <span className="text-[#D4AF37] text-xs">✦</span> Kantor Pusat & Kontak
              </h4>
              
              <div className="space-y-3 text-xs text-stone-300 font-light">
                {/* Address */}
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    Komplek Marbella Residence Blok D7 No. 09, Belian, Kec. Batam Kota, Kota Batam, Kepulauan Riau 29464
                  </p>
                </div>

                {/* Hotline Phones */}
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-[11px]">
                    <a href="https://wa.me/6282283201103" target="_blank" rel="noopener noreferrer" className="hover:text-[#F3E5AB] transition-colors block">
                      0822-8320-1103 <span className="text-[#D4AF37] font-semibold">(Hotline 1)</span>
                    </a>
                    <a href="https://wa.me/6282288308220" target="_blank" rel="noopener noreferrer" className="hover:text-[#F3E5AB] transition-colors block">
                      0822-8830-8220 <span className="text-[#D4AF37] font-semibold">(Hotline 2)</span>
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <a href="mailto:travelgolden2026@gmail.com" className="hover:text-[#F3E5AB] transition-colors text-[11px] break-all">
                    travelgolden2026@gmail.com
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Copyright & Legal links */}
          <div className="pt-6 border-t border-[#D4AF37]/25 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-400 font-light">
            <p>&copy; {new Date().getFullYear()} PT Golden Tour Haramain Haji & Umroh. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-4 text-xs">
              <a href="#" className="hover:text-[#F3E5AB] transition-colors">Kebijakan Privasi</a>
              <span className="text-[#D4AF37]/40">•</span>
              <a href="#" className="hover:text-[#F3E5AB] transition-colors">Syarat & Ketentuan</a>
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
