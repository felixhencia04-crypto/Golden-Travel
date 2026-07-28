import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LegalitasShowcase from '../components/LegalitasShowcase';
import WhyChooseGoldenTravel from '../components/WhyChooseGoldenTravel';
import { 
  Lock, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Building2, 
  FileCheck 
} from 'lucide-react';

export default function Legalitas() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF7F2] text-[#1f2937]">
      <Navbar />
      
      <div className="pt-20">
        {/* Main Executive Legalitas Showcase with Kaaba Background */}
        <LegalitasShowcase />

        {/* Executive Why Choose Golden Travel Section */}
        <WhyChooseGoldenTravel />
      </div>

      {/* Siskopatuh Direct Verification Portal Section */}
      <main className="flex-grow py-16 sm:py-20 bg-[#FAF7F2] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Direct Verification Banner - Siskopatuh Kemenag RI */}
          <div className="bg-gradient-to-br from-[#012519] via-[#043323] to-[#011a11] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border-2 border-[#D4AF37]/50">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Siskopatuh Kemenag RI Verified</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3E5AB]">
                  Verifikasi Langsung Legalitas PT. Golden Tour Haramain
                </h3>
                <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
                  Guna menjamin kepastian dan rasa aman 100%, Anda dapat memeriksa status izin resmi kami secara langsung melalui portal resmi Siskopatuh Kementerian Agama Republik Indonesia.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-stone-200">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Izin PPIU Aktif & Valid</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Izin PIHK Khusus Aktif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Akreditasi KAN / ISO 9001</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20 text-center space-y-4 shadow-xl">
                <Search className="w-10 h-10 text-[#D4AF37] mx-auto" />
                <h4 className="font-serif text-xl font-bold text-white">Cek Database Kemenag RI</h4>
                <p className="text-stone-200 text-xs sm:text-sm font-light">
                  Masukan nama <strong className="text-[#F3E5AB]">PT. GOLDEN TOUR HARAMAIN</strong> di portal pencarian resmi Siskopatuh Kemenag.
                </p>

                <a 
                  href="https://haji.kemenag.go.id/siskopatuh/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#8B6508] text-[#0B2319] font-bold text-sm sm:text-base hover:brightness-110 shadow-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Portal Siskopatuh Kemenag</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Guarantee Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#D4AF37]/30 p-5 rounded-2xl text-center shadow-sm">
              <Award className="w-7 h-7 text-[#D4AF37] mx-auto mb-2" />
              <h5 className="font-bold text-[#0B2319] text-xs sm:text-sm">Akreditasi A</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Kemenag RI</p>
            </div>
            <div className="bg-white border border-[#D4AF37]/30 p-5 rounded-2xl text-center shadow-sm">
              <ShieldCheck className="w-7 h-7 text-[#D4AF37] mx-auto mb-2" />
              <h5 className="font-bold text-[#0B2319] text-xs sm:text-sm">Jaminan 100% Legal</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Siskopatuh Terintegrasi</p>
            </div>
            <div className="bg-white border border-[#D4AF37]/30 p-5 rounded-2xl text-center shadow-sm">
              <Building2 className="w-7 h-7 text-[#D4AF37] mx-auto mb-2" />
              <h5 className="font-bold text-[#0B2319] text-xs sm:text-sm">Izin BPW & NIB</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">OSS BKPM RI</p>
            </div>
            <div className="bg-white border border-[#D4AF37]/30 p-5 rounded-2xl text-center shadow-sm">
              <FileCheck className="w-7 h-7 text-[#D4AF37] mx-auto mb-2" />
              <h5 className="font-bold text-[#0B2319] text-xs sm:text-sm">Anggota AMPHURI</h5>
              <p className="text-stone-500 text-[11px] mt-0.5">Asosiasi Resmi</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
