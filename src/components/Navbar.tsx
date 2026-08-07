import { useLogo } from '../utils/logo';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, LogIn, Menu, X, Briefcase, ArrowLeft } from 'lucide-react';
import { HEADER_BG_DATA } from '../assets/headerBgData';

export default function Navbar() {
  const logoImg = useLogo();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const isMitra = location.pathname.startsWith('/mitra');
  const isKemitraan = location.pathname === '/kemitraan';
  const isJamaah = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/jamaah');

  return (
    <nav className="bg-[#F9F5EC] bg-cover bg-center bg-no-repeat shadow-md border-b border-[#D4AF37]/40 sticky top-0 z-50 transition-all duration-300" style={{ backgroundImage: `url("${HEADER_BG_DATA}")` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 sm:h-24">
          <div className="flex items-center">
            <Link to="/" className="font-button flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
              <img src={logoImg} alt="PT. Golden Tour Haramain Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 rounded-full border-2 border-gold-400/50 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs min-[360px]:text-sm sm:text-lg md:text-xl font-black text-[#064e3b] tracking-tight transition-colors leading-tight uppercase whitespace-nowrap">GOLDEN TRAVEL</span>
                <span className="text-[0.48rem] min-[360px]:text-[0.56rem] sm:text-[0.65rem] md:text-[0.7rem] text-[#b45309] font-extrabold tracking-[0.02em] min-[360px]:tracking-[0.05em] sm:tracking-[0.15em] uppercase mt-0.5 whitespace-nowrap">PT. GOLDEN TOUR HARAMAIN</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6 xl:space-x-8">
            {!isAdmin && !isMitra && !isKemitraan && (
              <>
                <Link 
                  to="/" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-bold pb-1 whitespace-nowrap transition-colors ${
                    location.pathname === '/' && !location.hash
                      ? 'text-[#064e3b] border-b-2 border-[#064e3b]' 
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Beranda
                </Link>
                <a 
                  href="/#tentang-kami" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.hash === '#tentang-kami'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Tentang Kami
                </a>
                <Link 
                  to="/legalitas" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.pathname === '/legalitas' 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]' 
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Legalitas
                </Link>
                <a 
                  href="/#pilihan-paket" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.hash === '#pilihan-paket'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Paket Umroh
                </a>
                <a 
                  href="/#pilihan-haji" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.hash === '#pilihan-haji'
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]'
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Paket Haji
                </a>
                <Link 
                  to="/blog" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.pathname.startsWith('/blog') 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]' 
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Blog
                </Link>
                <Link 
                  to="/kemitraan" 
                  className={`font-button text-xs lg:text-sm xl:text-base font-semibold pb-1 whitespace-nowrap transition-colors ${
                    location.pathname === '/kemitraan' 
                      ? 'text-[#064e3b] font-bold border-b-2 border-[#064e3b]' 
                      : 'text-[#1f3a30] hover:text-[#064e3b]'
                  }`}
                >
                  Kemitraan
                </Link>
                <Link to="/login" className="font-button bg-[#064e3b] hover:bg-[#04382a] text-white px-5 sm:px-6 py-2 rounded-full font-bold transition-all duration-300 flex items-center shadow-md whitespace-nowrap">
                  <LogIn className="w-4 h-4 mr-2 text-[#D4AF37]" />
                  Masuk
                </Link>
              </>
            )}

            {isKemitraan && (
              <div className="flex items-center p-1.5 pl-4 pr-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/60 shadow-lg shadow-emerald-950/10 hover:border-[#D4AF37] transition-all">
                <Link 
                  to="/" 
                  className="group flex items-center gap-2 text-[#064e3b] hover:text-[#b45309] font-jakarta font-bold text-xs sm:text-sm transition-colors pr-3"
                >
                  <ArrowLeft className="w-4 h-4 text-[#064e3b] group-hover:-translate-x-1 transition-transform shrink-0" />
                  <span>Beranda Utama</span>
                </Link>
                
                <div className="w-[1px] h-5 bg-[#D4AF37]/40 mx-2"></div>
                
                <Link 
                  to="/mitra/login" 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#064e3b] to-[#04281e] text-amber-300 font-jakarta font-black text-xs sm:text-sm shadow-md hover:brightness-125 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-[#D4AF37]/50"
                >
                  <Briefcase className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Login Mitra</span>
                </Link>
              </div>
            )}
            
            {isMitra && (
              <div className="flex items-center p-1.5 pl-4 pr-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/60 shadow-lg shadow-emerald-950/10 hover:border-[#D4AF37] transition-all">
                <Link 
                  to="/" 
                  className="group flex items-center gap-2 text-[#064e3b] hover:text-[#b45309] font-jakarta font-bold text-xs sm:text-sm transition-colors pr-2"
                >
                  <ArrowLeft className="w-4 h-4 text-[#064e3b] group-hover:-translate-x-1 transition-transform shrink-0" />
                  <span>Beranda Utama</span>
                </Link>
                
                <div className="w-[1px] h-5 bg-[#D4AF37]/40 mx-2"></div>
                
                <Link 
                  to="/mitra/login" 
                  className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-jakarta font-black text-xs sm:text-sm shadow-md hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-[#04170d] shrink-0" />
                  <span>Daftar Mitra</span>
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
            {!isAdmin && !isMitra && !isKemitraan && (
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="font-button bg-[#064e3b] hover:bg-[#04382a] text-white px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-all shadow-md"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Masuk</span>
              </Link>
            )}

            {isKemitraan && (
              <Link 
                to="/mitra/login" 
                onClick={() => setIsOpen(false)}
                className="font-button bg-[#064e3b] hover:bg-[#04382a] text-amber-300 border border-[#D4AF37]/50 px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Login Mitra</span>
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
            {!isAdmin && !isMitra && !isKemitraan && (
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
                <Link to="/kemitraan" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Kemitraan</span>
                  <span className="text-xs text-stone-400">›</span>
                </Link>
                <Link to="/blog" onClick={() => setIsOpen(false)} className="font-button flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-[#064e3b] hover:bg-black/5 transition-colors">
                  <span>Blog & Edukasi</span>
                  <span className="text-xs text-stone-400">›</span>
                </Link>
              </>
            )}

            {isKemitraan && (
              <>
                <div className="p-3.5 bg-gradient-to-br from-[#064e3b] to-[#04281e] rounded-2xl border border-[#D4AF37]/40 mb-3 text-white space-y-3 shadow-md">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Akses Khusus Mitra Agen</span>
                  <Link 
                    to="/mitra/login" 
                    onClick={() => setIsOpen(false)}
                    className="font-button flex items-center justify-center w-full px-4 py-2.5 rounded-xl shadow-md text-sm font-black text-amber-300 bg-emerald-950 border border-[#D4AF37]/60 hover:bg-black transition-all gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                    <span>Login / Masuk Portal Mitra</span>
                  </Link>
                </div>

                <Link 
                  to="/" 
                  onClick={() => setIsOpen(false)}
                  className="font-button flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-[#064e3b] bg-emerald-50/80 border border-emerald-200/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-[#064e3b]" />
                    <span>Kembali ke Beranda Utama</span>
                  </span>
                  <span className="text-xs">›</span>
                </Link>
              </>
            )}
            
            {isMitra && (
              <>
                <Link 
                  to="/" 
                  onClick={() => setIsOpen(false)}
                  className="font-button flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-[#064e3b] bg-emerald-50/80 border border-emerald-200/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-[#064e3b]" />
                    <span>Beranda Utama</span>
                  </span>
                  <span className="text-xs">›</span>
                </Link>
                <div className="pt-2">
                  <Link 
                    to="/mitra/login" 
                    onClick={() => setIsOpen(false)}
                    className="font-button flex items-center justify-center w-full px-4 py-3 rounded-full shadow-lg text-sm font-black text-[#04170d] bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] hover:brightness-105 transition-all gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-[#04170d]" />
                    <span>Daftar Mitra</span>
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
