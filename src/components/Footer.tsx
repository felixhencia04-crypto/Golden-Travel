import React from 'react';
import { Link } from 'react-router-dom';
import { useLogo } from '../utils/logo';
import { MapPin, Phone, Mail, LogIn, ShieldCheck, ChevronRight, MessageCircle } from 'lucide-react';

export default function Footer() {
  const logoImg = useLogo();

  return (
    <footer className="bg-[#021d15] text-stone-200 border-t-2 border-[#D4AF37] relative pt-16 pb-12 overflow-hidden font-sans">
      {/* Subtle radial background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* KOLOM 1: BRAND & LEGALITAS */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-[#042e22] border-2 border-[#D4AF37] p-1 shadow-lg shrink-0 flex items-center justify-center">
                <img src={logoImg} alt="Golden Travel Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-serif">
                  PT. GOLDEN TOUR HARAMAIN
                </h3>
                <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest block">
                  PT. GOLDEN TOUR HARAMAIN OFFICIAL
                </span>
              </div>
            </div>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Biro perjalanan Haji &amp; Umrah terpercaya, melayani sepenuh hati untuk ibadah mabrur, amanah, dan kenyamanan perjalanan suci Anda.
            </p>

            {/* Badge Box Legalitas */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#04281e] border border-[#D4AF37]/40 shadow-inner space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-white tracking-wide">
                  PT. GOLDEN TOUR HARAMAIN
                </span>
                <span className="px-2.5 py-1 rounded bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F5E6B3] text-[10px] font-black uppercase tracking-wider">
                  Izin PPIU Kemenag Resmi
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-400">
                Mitra Resmi PT. SEDERHANA ALMAIDANI GROUP
              </p>
            </div>
          </div>

          {/* KOLOM 2: LAYANAN UTAMA */}
          <div className="lg:col-span-3 space-y-4">
            <div className="border-b border-[#D4AF37]/30 pb-2">
              <h4 className="text-base sm:text-lg font-bold text-[#F5E6B3] font-serif flex items-center gap-2">
                <span className="text-[#D4AF37] text-xs">✦</span>
                <span>Layanan Utama</span>
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-stone-300">
              <li>
                <Link to="/paket-umroh" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Paket Umroh Reguler Bintang 4 &amp; 5</span>
                </Link>
              </li>
              <li>
                <Link to="/paket-umroh" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Paket Umroh VIP Executive &amp; Plus Turki</span>
                </Link>
              </li>
              <li>
                <Link to="/paket-haji" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Program Haji Furoda Direct Flight</span>
                </Link>
              </li>
              <li>
                <Link to="/paket-haji" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Program Haji Khusus Resmi (PIHK)</span>
                </Link>
              </li>
              <li>
                <Link to="/fasilitas" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Pengurusan Visa, Tasreh &amp; Handling</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* KOLOM 3: NAVIGASI & PORTAL */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-b border-[#D4AF37]/30 pb-2">
              <h4 className="text-base sm:text-lg font-bold text-[#F5E6B3] font-serif flex items-center gap-2 whitespace-nowrap">
                <span className="text-[#D4AF37] text-xs">✦</span>
                <span>Navigasi &amp; Portal</span>
              </h4>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm font-medium text-stone-300">
              <li>
                <Link to="/tentang-kami" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Tentang Golden Travel</span>
                </Link>
              </li>
              <li>
                <Link to="/legalitas" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Legalitas Resmi Kemenag RI</span>
                </Link>
              </li>
              <li>
                <Link to="/galeri" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Galeri Keberangkatan Jemaah</span>
                </Link>
              </li>
              <li>
                <Link to="/kemitraan" className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group">
                  <span className="text-[#D4AF37] font-bold text-xs group-hover:translate-x-1 transition-transform">›</span>
                  <span>Daftar Mitra Agent</span>
                </Link>
              </li>
            </ul>

            {/* Portal Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <Link 
                to="/login" 
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#021d15] font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login Jemaah</span>
              </Link>

              <Link 
                to="/mitra/login" 
                className="w-full py-2.5 px-4 rounded-lg bg-[#04281e] border border-[#D4AF37] text-[#F5E6B3] font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-[#063b2c] transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Portal Login Mitra Agent</span>
              </Link>

              <Link 
                to="/admin/login" 
                className="w-full py-2.5 px-4 rounded-lg bg-black/40 border border-amber-600/60 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-950/40 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Portal Login Admin</span>
              </Link>
            </div>
          </div>

          {/* KOLOM 4: KANTOR PUSAT & KONTAK */}
          <div className="lg:col-span-3 space-y-4">
            <div className="border-b border-[#D4AF37]/30 pb-2">
              <h4 className="text-base sm:text-lg font-bold text-[#F5E6B3] font-serif flex items-center gap-2 whitespace-nowrap">
                <span className="text-[#D4AF37] text-xs">✦</span>
                <span>Kantor Pusat &amp; Kontak</span>
              </h4>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Komplek Marbella Residence Blok D7 No. 09, Belian, Kec. Batam Kota, Kota Batam, Kepulauan Riau 29464
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-0.5 font-medium">
                  <p className="hover:text-[#D4AF37] transition-colors">
                    0822-8320-1103 <span className="text-[#D4AF37] font-bold text-[11px]">(Hotline 1)</span>
                  </p>
                  <p className="hover:text-[#D4AF37] transition-colors">
                    0822-8830-8220 <span className="text-[#D4AF37] font-bold text-[11px]">(Hotline 2)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="hover:text-[#D4AF37] transition-colors font-medium">
                  travelgolden2026@gmail.com
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright divider */}
        <div className="mt-12 pt-6 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>
            © {new Date().getFullYear()} Golden Travel Haji &amp; Umroh. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-4 font-medium">
            <Link to="/kebijakan-privasi" className="hover:text-[#D4AF37] transition-colors">
              Kebijakan Privasi
            </Link>
            <span>·</span>
            <Link to="/syarat-ketentuan" className="hover:text-[#D4AF37] transition-colors">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>

      </div>

      {/* Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/6282283201103?text=Assalamualaikum%20Golden%20Travel,%20saya%20ingin%20bertanya%20mengenai%20layanan%20Haji%20dan%20Umroh"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi WhatsApp Official"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform border-2 border-white/20 group"
      >
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366] group-hover:scale-110 transition-transform" />
      </a>
    </footer>
  );
}
