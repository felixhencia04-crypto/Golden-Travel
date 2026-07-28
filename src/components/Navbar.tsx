import { useLogo } from '../utils/logo';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, LogIn, Menu, X, Briefcase } from 'lucide-react';
import { HEADER_BG_DATA } from '../assets/headerBgData';

export default function Navbar() {
  const logoImg = useLogo();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const isMitra = location.pathname.startsWith('/mitra');
  const isJamaah = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/jamaah');

  return (
    <nav className="bg-[#F9F5EC] bg-cover bg-center bg-no-repeat shadow-md border-b border-[#D4AF37]/40 sticky top-0 z-50 transition-all duration-300" style={{ backgroundImage: `url("${HEADER_BG_DATA}")` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 sm:h-24">
          <div className="flex items-center">
            <Link to="/" className="font-button flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
              <img src={logoImg} alt="PT Golden Tour Haramain Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 rounded-full border-2 border-gold-400/50 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl font-black text-[#064e3b] tracking-tight transition-colors leading-tight uppercase whitespace-nowrap">GOLDEN TRAVEL</span>
                <span className="text-[0.48rem] min-[360px]:text-[0.56rem] sm:text-[0.65rem] md:text-[0.7rem] text-[#b45309] font-extrabold tracking-[0.02em] min-[360px]:tracking-[0.05em] sm:tracking-[0.15em] uppercase mt-0.5 whitespace-nowrap">PT GOLDEN TOUR HARAMAIN</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-6 lg:space-x-8">
            {!isAdmin && !isMitra && (
              <>
                <Link 
                  to="/" 
                  className={`font-button text-sm lg:text-base font-bold pb-1 transition-colors ${
                    location.pathname === '/' && !location.hash
                      ? 'text-[#064e3b] border-b-2 border-[#064e3b]' 
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Beranda
                </Link>
                <a 
                  href="/#tentang-kami" 
                  className={`font-button text-sm lg:text-base font-medium transition-colors ${
                    location.hash === '#tentang-kami'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Tentang Kami
                </a>
                <Link 
                  to="/legalitas" 
                  className={`font-button text-sm lg:text-base transition-colors ${
                    location.pathname === '/legalitas' 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1' 
                      : 'text-[#1f3a30] hover:text-[#064e3b] font-medium'
                  }`}
                >
                  Legalitas
                </Link>
                <a 
                  href="/#pilihan-paket" 
                  className={`font-button text-sm lg:text-base font-medium transition-colors ${
                    location.hash === '#pilihan-paket'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Paket Umroh
                </a>
                <a 
                  href="/#pilihan-haji" 
                  className={`font-button text-sm lg:text-base font-medium transition-colors ${
                    location.hash === '#pilihan-haji'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Paket Haji
                </a>
                <Link 
                  to="/blog" 
                  className={`font-button text-sm lg:text-base transition-colors ${
                    location.pathname.startsWith('/blog') 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1' 
                      : 'text-[#1f3a30] hover:text-[#064e3b] font-medium'
                  }`}
                >
                  Blog
                </Link>
                <Link 
                  to="/mitra" 
                  className={`font-button text-sm lg:text-base transition-colors ${
                    location.pathname.startsWith('/mitra') 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b] pb-1' 
                      : 'text-[#1f3a30] hover:text-[#064e3b] font-medium'
                  }`}
                >
                  Kemitraan
                </Link>
                <Link to="/login" className="font-button bg-[#064e3b] hover:bg-[#04382a] text-white px-5 sm:px-6 py-2 rounded-full font-bold transition-all duration-300 flex items-center shadow-md">
                  <LogIn className="w-4 h-4 mr-2 text-[#D4AF37]" />
                  Masuk
                </Link>
              </>
            )}
            
            {isMitra && (
              <div className="mitra-top-nav">
                  <Link to="/" className="nav-back-link text-[#064e3b] font-semibold">
                      <span className="back-arrow">←</span> Beranda Utama
                  </Link>
                  
                  <div className="nav-divider"></div>
                  
                  <Link to="/mitra/login" className="nav-portal-btn bg-[#064e3b] text-white px-4 py-2 rounded-full">
                      <span className="portal-icon"><Briefcase className="w-4 h-4 text-[#D4AF37]" /></span> Portal Mitra
                  </Link>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-stone-700 font-medium">Mode Admin</span>
                <Link to="/" className="font-button text-red-600 hover:text-red-800 font-medium transition-colors text-sm">Keluar</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button and quick CTA */}
          <div className="flex items-center gap-2 md:hidden">
            {!isAdmin && (
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="font-button bg-[#064e3b] hover:bg-[#04382a] text-white px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-all shadow-md"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Masuk</span>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#064e3b] hover:text-[#04382a] focus:outline-none p-2 transition-colors rounded-lg hover:bg-black/5"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#FAF7F2] bg-cover bg-center border-t border-[#D4AF37]/40 max-h-[calc(100vh-80px)] overflow-y-auto shadow-2xl transition-all" style={{ backgroundImage: `url("${HEADER_BG_DATA}")` }}>
          <div className="px-4 pt-3 pb-6 space-y-2">
            {!isAdmin && !isMitra && (
              <>
                <div className="p-3 bg-stone-100/80 rounded-xl border border-stone-200/80 mb-3 space-y-2">
                  <span className="text-[10px] font-bold text-[#064e3b] uppercase tracking-wider block">Akses Portal System</span>
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)}
                    className="font-button flex items-center justify-center w-full px-4 py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-[#064e3b] hover:bg-[#04382a] transition-all"
                  >
                    <LogIn className="w-4 h-4 mr-2 text-[#D4AF37]" />
                    Masuk Portal Jemaah
                  </Link>
                  <Link 
                    to="/mitra/login" 
                    onClick={() => setIsOpen(false)}
                    className="font-button flex items-center justify-center w-full px-4 py-2 rounded-lg text-xs font-semibold text-[#064e3b] bg-white border border-stone-300 hover:bg-stone-50 transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-[#D4AF37]" />
                    Portal Agent / Mitra
                  </Link>
                </div>

                <Link to="/" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-[#064e3b] bg-emerald-50/70 transition-colors">
                  <span>Beranda</span>
                  <span className="text-xs">›</span>
                </Link>
                <a href="/#tentang-kami" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Tentang Kami</span>
                  <span className="text-xs text-stone-400">›</span>
                </a>
                <Link to="/legalitas" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Legalitas</span>
                  <span className="text-xs text-stone-400">›</span>
                </Link>
                <a href="/#pilihan-paket" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Paket Umroh</span>
                  <span className="text-xs text-stone-400">›</span>
                </a>
                <a href="/#pilihan-haji" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Paket Haji</span>
                  <span className="text-xs text-stone-400">›</span>
                </a>
                <Link to="/blog" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Blog & Edukasi</span>
                  <span className="text-xs text-stone-400">›</span>
                </Link>
                <Link to="/mitra" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Kemitraan</span>
                  <span className="text-xs text-stone-400">›</span>
                </Link>
              </>
            )}
            
            {isMitra && (
              <>
                <Link to="/" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Kembali ke Utama</Link>
                <div className="pt-4">
                  <Link to="/mitra/login" className="font-button flex items-center justify-center w-full px-4 py-3 border border-[#D4AF37] rounded-full shadow-lg text-base font-bold text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 transition-all">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Portal Mitra
                  </Link>
                </div>
              </>
            )}
            
            {isAdmin && (
              <Link to="/" className="font-button block px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors">Keluar Mode Admin</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
