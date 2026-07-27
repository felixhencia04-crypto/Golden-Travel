import { useLogo } from '../utils/logo';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, LogIn, Menu, X, Briefcase } from 'lucide-react';

export default function Navbar() {
  const logoImg = useLogo();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const isMitra = location.pathname.startsWith('/mitra');
  const isJamaah = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/jamaah');

  return (
    <nav className="bg-matcha-950/95 backdrop-blur-md shadow-md border-b border-matcha-800/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link to="/" className="font-button flex items-center space-x-3 group">
              <img src={logoImg} alt="PT Golden Tour Haromain Logo" className="h-16 w-16 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 rounded-full border-2 border-gold-400/50" />
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tight group-hover:text-gold-400 transition-colors leading-tight uppercase">Golden Tour Haromain</span>
                <span className="text-[10px] text-gold-400 font-bold tracking-[0.2em] uppercase mt-0.5 opacity-80">Pelayanan Haji & Umroh Premium</span>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {!isAdmin && !isMitra && (
              <>
                <Link to="/" className="font-button text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] font-medium transition-colors">Beranda</Link>
                <a href="/#about" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Tentang Kami</a>
                <Link to="/legalitas" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Legalitas</Link>
                <a href="/#umroh" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Paket Umroh</a>
                <a href="/#haji" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Paket Haji</a>
                <Link to="/blog" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Blog</Link>
                <Link to="/mitra" className="font-button text-white hover:text-[#D4AF37] font-medium transition-colors">Kemitraan</Link>
                <Link to="/login" className="font-button bg-transparent border border-[#D4AF37] hover:bg-[#D4AF37]/10 text-[#D4AF37] px-6 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk
                </Link>
              </>
            )}
            
            {isMitra && (
              <div className="mitra-top-nav">
                  <Link to="/" className="nav-back-link">
                      <span className="back-arrow">←</span> Beranda Utama
                  </Link>
                  
                  <div className="nav-divider"></div>
                  
                  <Link to="/mitra/login" className="nav-portal-btn">
                      <span className="portal-icon"><Briefcase className="w-4 h-4" /></span> Portal Mitra
                  </Link>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 font-medium">Mode Admin</span>
                <Link to="/" className="font-button text-matcha-600 hover:text-matcha-800 font-medium transition-colors text-sm">Keluar</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white/80 hover:text-gold-400 focus:outline-none p-2 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-matcha-950/95 backdrop-blur-md border-t border-matcha-800/50">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {!isAdmin && !isMitra && (
              <>
                <Link to="/" className="font-button block px-3 py-3 rounded-md text-base font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)] transition-colors">Beranda</Link>
                <a href="/#about" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Tentang Kami</a>
                <Link to="/legalitas" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Legalitas</Link>
                <a href="/#umroh" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Paket Umroh</a>
                <a href="/#haji" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Paket Haji</a>
                <Link to="/blog" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Blog</Link>
                <Link to="/mitra" className="font-button block px-3 py-3 rounded-md text-base font-medium text-white hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Kemitraan</Link>
                <div className="pt-4">
                  <Link to="/login" className="font-button flex items-center justify-center w-full px-4 py-3 border border-[#D4AF37] rounded-full shadow-lg text-base font-bold text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 transition-all">
                    <LogIn className="w-5 h-5 mr-2" />
                    Masuk
                  </Link>
                </div>
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
