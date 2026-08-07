import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Users, Award, DollarSign, ShieldCheck, CheckCircle2, 
  HelpCircle, ChevronDown, ArrowRight, Briefcase, Sparkles, 
  BookOpen, PhoneCall, Gift, TrendingUp, Building2, UserCheck, 
  Clock, Zap, FileText, Check, Globe, Quote,
  GraduationCap, Target, Mic, Megaphone, Compass
} from 'lucide-react';
import { HEADER_BG_DATA } from '../assets/headerBgData';
import bgKemitraanHero from '../assets/kemitraan-hero-bg.webp';

export default function Kemitraan() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Apakah pendaftaran Mitra Agen di Golden Travel dipungut biaya?',
      a: 'Tidak ada biaya pendaftaran (100% Gratis). Siapa saja yang ingin menjadi bagian dari Syiar Ibadah Umroh & Haji dapat mendaftar tanpa uang pangkal.'
    },
    {
      q: 'Berapa besaran komisi atau Ujrah yang didapatkan per Jemaah?',
      a: 'Besaran komisi atau ujrah sangat kompetitif dan transparan per jemaah yang mendaftar dan melunasi paket, disesuaikan berdasarkan jenis paket Umroh/Haji yang dipilih serta skema keagenan Anda.'
    },
    {
      q: 'Kapan komisi mitra dicairkan?',
      a: 'Komisi dicairkan secara transparan dan ditransfer langsung ke rekening bank mitra yang telah terverifikasi setelah jemaah melakukan pembayaran DP atau pelunasan sesuai ketentuan.'
    },
    {
      q: 'Apakah ada target jumlah jemaah bulanan yang mengikat?',
      a: 'Tidak ada target jemaah bulanan yang membebani. Anda bebas menentukan waktu dan fleksibilitas kerja Anda sendiri sebagai mitra syiar.'
    },
    {
      q: 'Dokumen apa saja yang diperlukan untuk pendaftaran Mitra?',
      a: 'Anda hanya perlu menyiapkan Foto KTP, Selfie dengan KTP, NPWP (opsional), serta halaman depan Buku Tabungan untuk rekening pencairan komisi.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-jakarta flex flex-col selection:bg-[#D4AF37] selection:text-emerald-950">
      {/* Header Navbar */}
      <Navbar />

      {/* Hero Section / Slide Pertama Kemitraan */}
      <section 
        className="relative py-16 sm:py-24 lg:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center lg:text-left max-w-3xl space-y-7 my-2">
            {/* Badge Title */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#063b2c] border border-[#D4AF37] text-[#F5E6B3] text-xs font-extrabold uppercase tracking-widest shadow-xl shadow-emerald-950/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse shrink-0" />
              <span>Program Resmi Syiar Keagenan &amp; Kemitraan</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#083325] leading-[1.15] tracking-tight drop-shadow-sm">
              Bergabung Menjadi <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                Mitra Syiar
              </span>{" "}
              <span className="text-[#083325]">Baitullah</span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-base sm:text-lg lg:text-xl text-[#1a382d] font-semibold leading-relaxed drop-shadow-sm max-w-2xl">
              Dapatkan kesempatan meraih keberkahan syiar ibadah Umroh &amp; Haji sekaligus penghasilan komisi profesional bersama{" "}
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#063b2c] text-[#F5E6B3] font-black text-sm sm:text-base border border-[#D4AF37]/60 shadow-sm align-baseline">
                PT. Golden Tour Haramain
              </span>
              . Dikelola dengan transparansi penuh melalui portal digital resmi.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                to="/mitra/login" 
                className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-900/25 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-amber-100"
              >
                <Briefcase className="w-5 h-5 text-[#04170d]" />
                <span>DAFTAR / LOGIN MITRA NOW</span>
                <ArrowRight className="w-4 h-4 text-[#04170d]" />
              </Link>
              
              <a 
                href="#keunggulan" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#063b2c] hover:bg-[#04281e] border border-[#D4AF37] text-[#F5E6B3] font-extrabold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/15"
              >
                <span>Pelajari Program</span>
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
              </a>
            </div>
          </div>

          {/* Highlights & Guarantees Container - Full Width Expansion */}
          <div className="mt-10 lg:mt-12 pt-8 border-t border-[#063b2c]/20 space-y-6">
            {/* Highlights 4-Column Grid Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/95 border border-[#D4AF37]/60 backdrop-blur-md shadow-md hover:border-[#D4AF37] hover:shadow-lg transition-all group">
                <div className="w-11 h-11 rounded-xl bg-[#063b2c] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E6B3] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#063b2c] uppercase font-bold tracking-widest mb-0.5">IZIN RESMI</div>
                  <div className="text-xs sm:text-sm font-black text-stone-900 leading-snug">PPIU Kemenag RI</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/95 border border-[#D4AF37]/60 backdrop-blur-md shadow-md hover:border-[#D4AF37] hover:shadow-lg transition-all group">
                <div className="w-11 h-11 rounded-xl bg-[#063b2c] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E6B3] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-[10px] text-[#063b2c] uppercase font-bold tracking-widest mb-0.5">UJRAH &amp; KOMISI</div>
                  <div className="text-xs sm:text-sm font-black text-[#9A7B1C] leading-snug">Kompetitif / Jemaah</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/95 border border-[#D4AF37]/60 backdrop-blur-md shadow-md hover:border-[#D4AF37] hover:shadow-lg transition-all group">
                <div className="w-11 h-11 rounded-xl bg-[#063b2c] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E6B3] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-[10px] text-[#063b2c] uppercase font-bold tracking-widest mb-0.5">PORTAL REALTIME</div>
                  <div className="text-xs sm:text-sm font-black text-stone-900 leading-snug">Sistem Digital 24/7</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/95 border border-[#D4AF37]/60 backdrop-blur-md shadow-md hover:border-[#D4AF37] hover:shadow-lg transition-all group">
                <div className="w-11 h-11 rounded-xl bg-[#063b2c] border border-[#D4AF37]/50 flex items-center justify-center text-[#F5E6B3] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-[10px] text-[#063b2c] uppercase font-bold tracking-widest mb-0.5">PENCAIRAN CEPAT</div>
                  <div className="text-xs sm:text-sm font-black text-stone-900 leading-snug">Direct Bank Transfer</div>
                </div>
              </div>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 text-xs text-[#063b2c] font-black pt-1">
              <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#D4AF37]/60 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                100% Pendaftaran Gratis
              </span>
              <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#D4AF37]/60 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                Tanpa Beban Target Bulanan
              </span>
              <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#D4AF37]/60 shadow-sm hover:shadow-md transition-shadow whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                Bimbingan Marketing &amp; Brosur
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Kenapa Harus Berbisnis Umroh Section */}
      <section 
        id="keunggulan" 
        className="relative py-20 sm:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        {/* Background Subtle Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#063b2c_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Banner Block */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#063b2c]/10 border border-[#D4AF37]/50 text-[#063b2c] text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#9A7B1C]" />
              <span>Analisis Peluang Usaha Syiar</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#083325] tracking-tight leading-tight">
              KENAPA HARUS BERBISNIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F]">UMROH?</span>
            </h2>

            {/* Abadi Banner Box */}
            <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#063b2c] via-[#084836] to-[#04281e] border-2 border-[#D4AF37] text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl"></div>
              <p className="text-xs sm:text-sm font-extrabold text-[#F5E6B3] uppercase tracking-[0.25em] mb-1">
                POTENSI USAHA MASA DEPAN
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-wide drop-shadow-sm">
                KARENA UMROH ADALAH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE082] via-[#F3E5AB] to-[#D4AF37]">BISNIS ABADI SEPANJANG MASA</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-2 max-w-2xl mx-auto">
                6 Alasan Strategis Mengapa Industri Travel Umroh Menjadi Peluang Usaha Berkelanjutan, Sangat Prospektif, dan Bernilai Ibadah Mulia di Indonesia.
              </p>
            </div>
          </div>

          {/* 6 Core Reasons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Reason 1 */}
            <div className="rounded-3xl bg-white border border-stone-200/90 hover:border-[#D4AF37] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                01
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#063b2c] border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#063b2c] group-hover:text-[#F5E6B3] transition-all">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Indonesia Populasi Muslim Terbesar di Dunia
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Dengan pasar yang sangat luas dan berkesinambungan, Indonesia menjadi rumah bagi ratusan juta jiwa Muslim yang selalu mendambakan kunjungan ke Rumah Allah.
                </p>
              </div>

              {/* Data Callout Box */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Penduduk Muslim 2025:</span>
                  <span className="text-[#063b2c] font-black text-sm">± 248 Juta</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#063b2c] to-[#9A7B1C] h-2 rounded-full w-[87%]"></div>
                </div>
                <div className="text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                  <span>87% dari Total Penduduk</span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold text-[10px]">1 dari 8 Muslim Dunia</span>
                </div>
              </div>
            </div>

            {/* Reason 2 */}
            <div className="rounded-3xl bg-white border border-stone-200/90 hover:border-[#D4AF37] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                02
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#063b2c] border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#063b2c] group-hover:text-[#F5E6B3] transition-all">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Tren &amp; Gaya Hidup Spiritual Meningkat
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Jumlah keberangkatan jamaah umroh Indonesia mencatatkan pertumbuhan sangat pesat dan stabil pasca pandemi (Data Kemenag RI SISKOPATUH).
                </p>
              </div>

              {/* Data Growth Graphic */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-emerald-200/60 space-y-2">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-stone-500 font-bold">2022</div>
                    <div className="text-xs font-black text-[#083325]">1,00 Juta</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-stone-200">
                    <div className="text-[10px] text-stone-500 font-bold">2023</div>
                    <div className="text-xs font-black text-emerald-700">1,36 Juta</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-900 text-amber-300 font-bold border border-emerald-950">
                    <div className="text-[10px] text-emerald-200">2024</div>
                    <div className="text-xs font-black">1,48 Juta</div>
                  </div>
                </div>
                <div className="text-[11px] font-black text-[#9A7B1C] text-center pt-1 bg-amber-50 rounded-lg py-1 border border-amber-200">
                  ⚡ Pertumbuhan 2 Tahun: +47,8% (+480.699 Jamaah)
                </div>
              </div>
            </div>

            {/* Reason 3 */}
            <div className="rounded-3xl bg-white border border-stone-200/90 hover:border-[#D4AF37] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                03
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#063b2c] border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#063b2c] group-hover:text-[#F5E6B3] transition-all">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Masa Tunggu Haji Sampai 49 Tahun
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Dengan 5,5 juta antrean calon jemaah haji, umroh menjadi pilihan terbaik dan solusi langsung untuk mengobati kerinduan ke Tanah Suci tanpa menunggu puluhan tahun.
                </p>
              </div>

              {/* Data Callout Box */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Antrean Haji Reguler:</span>
                  <span className="text-red-700 font-black text-xs bg-red-50 px-2 py-0.5 rounded border border-red-200">11 s/d 49 Tahun</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>Total Calon Jemaah:</span>
                  <span className="text-[#063b2c] font-black text-xs">5,5 Juta Orang</span>
                </div>
                <div className="text-[11px] font-bold text-[#063b2c] italic text-center pt-1 border-t border-stone-200">
                  "Umroh Hari Ini, Haji Nanti"
                </div>
              </div>
            </div>

            {/* Reason 4 */}
            <div className="rounded-3xl bg-white border border-stone-200/90 hover:border-[#D4AF37] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                04
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#063b2c] border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#063b2c] group-hover:text-[#F5E6B3] transition-all">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Sangat Mudah Dijalankan
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Sistem usaha yang tidak membutuhkan riset destinasi rumit. Alur pendaftaran hingga pelayanan jemaah telah terstandarisasi dengan sangat rapi.
                </p>
              </div>

              {/* Pillars Box */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-emerald-200/60 space-y-1.5 text-xs text-stone-800 font-bold">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Destinasi Tetap (Makkah &amp; Madinah)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Produk Clear (Tiket, Visa, Hotel, Bus)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sistem Bisnis Sangat Mudah Diduplikasi</span>
                </div>
              </div>
            </div>

            {/* Reason 5 */}
            <div className="rounded-3xl bg-white border border-stone-200/90 hover:border-[#D4AF37] p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                05
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#063b2c] border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#063b2c] group-hover:text-[#F5E6B3] transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Pasar Luas Semua Kalangan
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Ibadah Umroh adalah impian setiap Muslim dari berbagai kelas ekonomi dan profesi. Mulai dari lansia, keluarga, profesional, hingga mahasiswa.
                </p>
              </div>

              {/* Quote Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 font-medium italic relative">
                <Quote className="w-4 h-4 text-[#D4AF37] absolute top-2 right-2 opacity-50" />
                "Umroh bukan tentang seberapa besar harta, tapi seberapa besar kerinduan hati untuk memenuhi panggilan Allah."
              </div>
            </div>

            {/* Reason 6 */}
            <div className="rounded-3xl bg-gradient-to-b from-white to-[#FAF7F2] border-2 border-[#D4AF37]/80 hover:border-[#D4AF37] p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                06
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#083325] mb-2 leading-snug">
                  Bisnis Mulia Dunia &amp; Akhirat
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Menggabungkan keuntungan finansial yang halal dengan keberkahan mengantarkan tamu-tamu Allah ke Tanah Suci yang berpahala jariyah.
                </p>
              </div>

              {/* Hadits Callout Box */}
              <div className="p-3.5 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37]/50 space-y-1 text-[11px] font-semibold leading-snug">
                <div className="text-amber-300 font-extrabold uppercase text-[10px] tracking-wider mb-1">
                  📖 Keberkahan Syiar (HR. Muslim No. 2674)
                </div>
                <p className="italic text-emerald-100">
                  "Barangsiapa mengajak kepada kebaikan, ia memperoleh pahala seperti pahala orang yang mengikutinya..."
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Call to Action strip */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#063b2c] to-[#04281e] border border-[#D4AF37] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-amber-300">
                Siap Meraih Keberkahan &amp; Kemandirian Finansial?
              </h4>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                Bergabunglah bersama jaringan Mitra Syiar PT. Golden Tour Haramain dan mulai langkah syiar Anda hari ini secara gratis.
              </p>
            </div>
            <Link 
              to="/mitra/login" 
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-black text-xs sm:text-sm uppercase tracking-wider hover:scale-105 transition-transform shrink-0 shadow-lg border border-amber-100 flex items-center gap-2"
            >
              <span>DAFTAR MITRA SEKARANG</span>
              <ArrowRight className="w-4 h-4 text-[#04170d]" />
            </Link>
          </div>

        </div>
      </section>

      {/* Mengapa Harus Bermitra Dengan Golden Travel Section (Slide 3) */}
      <section 
        id="mengapa-bermitra" 
        className="relative py-20 sm:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        {/* Subtle background highlight for optimal clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 backdrop-blur-[0.5px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#063b2c_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Block */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#063b2c] border border-[#D4AF37] text-[#F5E6B3] text-xs font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>EKOSISTEM KEMITRAAN TERPADU</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#083325] tracking-tight leading-tight">
              KENAPA HARUS BERMITRA DENGAN <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F] drop-shadow-sm">
                GOLDEN TRAVEL??
              </span>
            </h2>

            {/* 3 IN 1 Hero Feature Box */}
            <div className="mt-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#063b2c] via-[#084836] to-[#04281e] border-2 border-[#D4AF37] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-center md:text-left space-y-2">
                  <div className="inline-block px-3 py-1 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#F5E6B3] font-black text-xs uppercase tracking-widest">
                    FORMULA SUKSES MITRA
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                    PROGRAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE082] via-[#F3E5AB] to-[#D4AF37]">3 IN 1</span> GOLDEN TRAVEL
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                    Satu-satunya program kemitraan yang menjamin Anda dibimbing dari awal hingga berangkat Umroh dengan sistem terstruktur.
                  </p>
                </div>

                {/* 3 Pill Badges */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
                  <div className="px-3 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/60 text-center">
                    <span className="block text-[10px] text-amber-300 font-extrabold uppercase">LANGKAH 1</span>
                    <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">DIAJARIN</span>
                  </div>
                  <div className="px-3 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/60 text-center">
                    <span className="block text-[10px] text-amber-300 font-extrabold uppercase">LANGKAH 2</span>
                    <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">DISUKSESIN</span>
                  </div>
                  <div className="px-3 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/60 text-center">
                    <span className="block text-[10px] text-amber-300 font-extrabold uppercase">LANGKAH 3</span>
                    <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">DIUMROHIN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Pillar 1: DIAJARIN */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/20 hover:border-[#D4AF37] p-6 sm:p-8 shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                1.
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <BookOpen className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  PEMBEKALAN LENGKAP
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#083325] mb-3 tracking-tight">
                  DIAJARIN
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Anda akan mendapatkan pelatihan intensif mengenai produk, teknik penawaran, komunikasi publik, hingga pemasaran digital.
                </p>

                {/* Items List */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#063b2c] flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Produk Knowledge</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Pemahaman detail paket Umroh &amp; Haji</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#063b2c] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Pemasaran</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Strategi prospeking &amp; teknik closing</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#063b2c] flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Public Speaking</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Keterampilan presentasi &amp; syiar publik</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#063b2c] flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Iklan Meta &amp; TikTok</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Panduan iklan FB, IG &amp; TikTok Ads</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 text-center">
                <span className="text-[11px] font-extrabold text-[#063b2c]">✓ Pelatihan Online &amp; Offline Gratis</span>
              </div>
            </div>

            {/* Pillar 2: DISUKSESIN */}
            <div className="rounded-3xl bg-gradient-to-b from-white via-white to-[#FAF7F2] border-2 border-[#D4AF37] p-6 sm:p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#D4AF37] text-emerald-950 font-black text-xs rounded-bl-2xl border-l border-b border-amber-300">
                2.
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA771C] text-[#04170d] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <TrendingUp className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  PENDAMPINGAN SISTEM
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#083325] mb-3 tracking-tight">
                  DISUKSESIN
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Sistem pendampingan yang siap membimbing siapapun untuk sukses, selama memiliki komitmen dan semangat syiar.
                </p>

                {/* Items List */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#063b2c] text-[#F5E6B3] flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Mau Belajar</h4>
                      <p className="text-[11px] text-stone-600 font-medium">Terbuka menyerap ilmu &amp; wawasan baru</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#063b2c] text-[#F5E6B3] flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Mau Diajari</h4>
                      <p className="text-[11px] text-stone-600 font-medium">Siap dibimbing langsung oleh mentor</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#063b2c] text-[#F5E6B3] flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">Mau Ikut System</h4>
                      <p className="text-[11px] text-stone-600 font-medium">Menjalankan SOP teruji &amp; berkelanjutan</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-200 text-center">
                <span className="text-[11px] font-black text-[#9A7B1C]">⚡ Ekosistem Terbukti Membantu Ratusan Mitra</span>
              </div>
            </div>

            {/* Pillar 3: DIUMROHIN */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/20 hover:border-[#D4AF37] p-6 sm:p-8 shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                3.
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <Award className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  APRESIASI PENCAPAIAN
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#083325] mb-3 tracking-tight">
                  DIUMROHIN
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
                  Puncak apresiasi bagi Mitra Syiar berprestasi untuk berangkat ke Baitullah secara gratis dan menjadi pembimbing jamaah.
                </p>

                {/* Items List */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">TOUR LEADER</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Kesempatan memimpin rombongan jemaah</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#083325]">BONUS MITRA</h4>
                      <p className="text-[11px] text-stone-500 font-medium">Reward perjalanan Umroh gratis &amp; ujrah</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 text-center">
                <span className="text-[11px] font-extrabold text-[#063b2c]">🕋 Beribadah Sambil Mensyiarkan Baitullah</span>
              </div>
            </div>

          </div>

          {/* Bottom CTA Card */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#063b2c] via-[#084836] to-[#04281e] border-2 border-[#D4AF37] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-xl sm:text-2xl font-black text-amber-300">
                Siap Merasakan Pengalaman 3 in 1 Bersama Golden Travel?
              </h4>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                Segera daftarkan diri Anda sebagai Mitra Syiar resmi PT. Golden Tour Haramain dan dapatkan seluruh bimbingan secara penuh.
              </p>
            </div>
            <Link 
              to="/mitra/login" 
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-black text-xs sm:text-sm uppercase tracking-wider hover:scale-105 transition-transform shrink-0 shadow-xl border border-amber-100 flex items-center gap-2"
            >
              <span>GABUNG PROGRAM 3 IN 1 NOW</span>
              <ArrowRight className="w-4 h-4 text-[#04170d]" />
            </Link>
          </div>

        </div>
      </section>

      {/* Alur Pendaftaran Mitra Section (Slide 4) */}
      <section 
        className="relative py-20 sm:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        {/* Subtle background highlight for optimal clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 backdrop-blur-[0.5px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#063b2c_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Block */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#063b2c] border border-[#D4AF37] text-[#F5E6B3] text-xs font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>ALUR PENDAFTARAN CEPAT &amp; TRANSPARAN</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#083325] tracking-tight leading-tight">
              4 LANGKAH MENJADI <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F] drop-shadow-sm">
                MITRA RESMI GOLDEN TRAVEL
              </span>
            </h2>

            <p className="text-stone-700 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
              Proses registrasi serba digital, transparan, tanpa biaya tersembunyi, dan langsung terverifikasi oleh sistem admin resmi.
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/20 hover:border-[#D4AF37] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                01
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <FileText className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  LANGKAH PERTAMA
                </div>

                <h3 className="text-xl font-black text-[#083325] mb-3 tracking-tight">
                  Isi Formulir Online
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Daftar melalui Portal Resmi Mitra dengan memasukkan email aktif, nomor WhatsApp, serta password keamanan akun Anda.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 text-center">
                <span className="text-[11px] font-extrabold text-[#063b2c]">✓ Proses Cepat 2 Menit</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/20 hover:border-[#D4AF37] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                02
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <UserCheck className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  DOKUMEN DIRI
                </div>

                <h3 className="text-xl font-black text-[#083325] mb-3 tracking-tight">
                  Lengkapi Profil KYC
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Unggah foto KTP, selfie identitas, serta data rekening bank resmi untuk saluran verifikasi dan pencairan komisi Anda.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 text-center">
                <span className="text-[11px] font-extrabold text-[#063b2c]">🔒 Data Terenkripsi Aman</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/20 hover:border-[#D4AF37] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#063b2c] text-[#F5E6B3] font-black text-xs rounded-bl-2xl border-l border-b border-[#D4AF37]">
                03
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  VERIFIKASI LEGAL
                </div>

                <h3 className="text-xl font-black text-[#083325] mb-3 tracking-tight">
                  Verifikasi Compliance
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Tim Compliance PT. Golden Tour Haramain akan meninjau kelengkapan berkas Anda secara cepat demi keamanan bersama.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 text-center">
                <span className="text-[11px] font-extrabold text-[#063b2c]">⚡ Approval Maks. 1x24 Jam</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-3xl bg-gradient-to-b from-white via-white to-[#FAF7F2] border-2 border-[#D4AF37] p-6 sm:p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-2 bg-[#D4AF37] text-emerald-950 font-black text-xs rounded-bl-2xl border-l border-b border-amber-300">
                04
              </div>

              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA771C] text-[#04170d] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Award className="w-7 h-7" />
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                  MULAI BERAKSI
                </div>

                <h3 className="text-xl font-black text-[#083325] mb-3 tracking-tight">
                  Mulai Syiar &amp; Komisi
                </h3>

                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Akun Anda aktif penuh! Anda dapat langsung menginput jemaah, memanfaatkan materi promosi, dan menikmati ujrah komisi.
                </p>
              </div>

              <div className="pt-4 border-t border-amber-200 text-center">
                <span className="text-[11px] font-black text-[#9A7B1C]">🎉 Siap Raih Keberkahan Syiar</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Syarat & Promo Starter Kit Mitra Section (Slide 5) */}
      <section 
        id="syarat-mitra"
        className="relative py-20 sm:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        {/* Subtle background highlight for optimal clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 backdrop-blur-[0.5px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#063b2c_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Block */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#063b2c] border border-[#D4AF37] text-[#F5E6B3] text-xs font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>SYARAT &amp; INVESTASI KEMITRAAN</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#083325] tracking-tight leading-tight">
              APA SYARAT BERGABUNG JADI <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F] drop-shadow-sm">
                MITRA GOLDEN TRAVEL?
              </span>
            </h2>

            <p className="text-stone-700 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
              Sangat mudah! Tanpa ikatan rumit, siapapun dapat bergabung mensyiarkan Baitullah dan memperoleh paket fasilitas starter kit keagenan lengkap.
            </p>
          </div>

          {/* Promo Price & Offer Banner */}
          <div className="mb-14 p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#063b2c] via-[#084836] to-[#04281e] border-2 border-[#D4AF37] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              
              {/* Left Side: Promo Title & Pricing */}
              <div className="text-center lg:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/90 text-white font-black text-xs uppercase tracking-widest shadow-md border border-red-400 animate-pulse">
                  🔥 PROMO SPESIAL TERBATAS
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Cukup Investasi Starter Kit Syiar
                </h3>

                <div className="flex flex-wrap items-baseline justify-center lg:justify-start gap-4 pt-1">
                  <div className="text-stone-400 text-lg sm:text-xl font-bold line-through">
                    Rp 1.000.000,-
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-amber-300 uppercase">Cukup Dengan</span>
                    <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFE082] via-[#F3E5AB] to-[#D4AF37] drop-shadow-md">
                      Rp 350.000,-
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  *Sekali seumur hidup • Tanpa biaya tahunan • Langsung berhak memasarkan &amp; terima komisi
                </p>
              </div>

              {/* Right Side: Quick Highlight Badges */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/60 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold text-white">Fasilitas Starter Kit 6 in 1 Langsung Dikirim</span>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/60 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold text-white">Akses Portal Digital &amp; Mentoring Rutin</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section Subhead: 6 Kit Items */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-[#083325]">
              MEMPEROLEH 6 FASILITAS STARTER KIT EKSKLUSIF:
            </h3>
            <p className="text-stone-700 text-xs sm:text-sm font-semibold mt-1">
              Perlengkapan resmi siap pakai untuk mendukung aktivitas syiar pemasaran Anda di lapangan
            </p>
          </div>

          {/* 6 Starter Kit Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            
            {/* Item 1: SPANDUK */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/15 hover:border-[#D4AF37] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-md">
                1
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  MEDIA POSKO / OUTDOOR
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  SPANDUK RESMI MITRA
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Spanduk cetak berkualitas tinggi berdesain resmi "Mitra Resmi Golden Travel" siap dipasang di rumah atau kantor Anda.
                </p>
              </div>
            </div>

            {/* Item 2: ID CARD */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/15 hover:border-[#D4AF37] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-md">
                2
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  IDENTITAS RESMI
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  ID CARD &amp; LANYARD EKSKLUSIF
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tanda pengenal fisik lengkap dengan foto &amp; nama Anda serta tali lanyard premium untuk legitimasi saat bertemu calon jemaah.
                </p>
              </div>
            </div>

            {/* Item 3: KARTU NAMA */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/15 hover:border-[#D4AF37] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-md">
                3
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  PERSONAL BRANDING
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  KARTU NAMA PROFESIONAL
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Kartu nama bisnis cetak berlogo PT. Golden Tour Haramain lengkap dengan kontak resmi Anda untuk dibagikan secara profesional.
                </p>
              </div>
            </div>

            {/* Item 4: BROSUR */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/15 hover:border-[#D4AF37] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-md">
                4
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  MATERI PROMOSI
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  BROSUR PEMASARAN CETAK
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Paket brosur fisik full color berisi info fasilitas, jadwal keberangkatan, dan keunggulan paket Umroh &amp; Haji Plus.
                </p>
              </div>
            </div>

            {/* Item 5: FORM PENDAFTARAN */}
            <div className="rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-900/15 hover:border-[#D4AF37] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-md">
                5
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  BERKAS FISIK
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  FORM PENDAFTARAN JEMAAH
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Formulir fisik resmi pendaftaran jemaah untuk memudahkan pengisian data langsung di lapangan secara tertulis.
                </p>
              </div>
            </div>

            {/* Item 6: MOU */}
            <div className="rounded-3xl bg-gradient-to-b from-white via-white to-[#FAF7F2] border-2 border-[#D4AF37] p-6 shadow-2xl transition-all duration-300 flex items-start gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA771C] text-[#04170d] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                6
              </div>
              <div className="space-y-1.5">
                <div className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  LEGALITAS PERJANJIAN
                </div>
                <h4 className="text-lg font-black text-[#083325] tracking-tight">
                  DOKUMEN MOU KERJASAMA
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Memorandum of Understanding (MOU) sah berkekuatan hukum yang menjamin transparansi hak komisi &amp; kewajiban kemitraan Anda.
                </p>
              </div>
            </div>

          </div>

          {/* Inspirational Inclusivity Feature Card (Image 2 Concept) */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#063b2c] via-[#084836] to-[#04281e] border-2 border-[#D4AF37] text-white shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column: Inspiring Headline & Founder Highlight */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37] text-[#04170d] font-black text-xs uppercase tracking-widest shadow-md">
                  <Award className="w-3.5 h-3.5" />
                  Kisah Inspiratif &amp; Pintu Terbuka Untuk Semua
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  "SIAPAPUN KAMU, APAPUN PROFESIMU... <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE082] via-[#F3E5AB] to-[#D4AF37]">
                    KAMU BISA UMROH!"
                  </span>
                </h3>

                {/* Profile Badge Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-[#D4AF37]/50 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#AA771C] text-[#04170d] font-black text-xl flex items-center justify-center border-2 border-white shrink-0 shadow-lg">
                    AD
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-amber-300">Ahmad Daud</h4>
                    <p className="text-xs font-bold text-white">
                      Direktur PT. Golden Tour Haramain <span className="text-emerald-300 font-semibold">(Mantan Tukang Ojek)</span>
                    </p>
                    <p className="text-[11px] text-emerald-100/90 mt-1 italic">
                      "Perjalanan syiar ini membuktikan bahwa latar belakang profesi bukanlah penghalang. Siapapun yang berniat tulus mensyiarkan Baitullah pasti Allah bukakan jalan keberkahan."
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                  Apakah Anda seorang ojek online, guru, ibu rumah tangga, pedagang, karyawan, atau profesional — pintu kemitraan Golden Travel terbuka lebar tanpa diskriminasi.
                </p>
              </div>

              {/* Right Column: Key Requirements Checklist */}
              <div className="lg:col-span-5 bg-white/95 text-stone-900 p-6 sm:p-8 rounded-3xl border-2 border-[#D4AF37] shadow-xl space-y-4">
                <h4 className="text-lg font-black text-[#083325] border-b border-stone-200 pb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#063b2c]" />
                  Ringkasan Syarat Pendaftaran
                </h4>

                <div className="space-y-3 text-xs sm:text-sm font-bold text-stone-800">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Niat ikhlas mensyiarkan ibadah Umroh &amp; Haji.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Identitas Diri (KTP &amp; Rekening Bank aktif).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Memiliki HP / Smartphone (Akses Portal Mitra digital).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Registrasi Starter Kit Promo Rp 350.000,- (Sekali selamanya).</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link 
                    to="/mitra/login" 
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-black text-xs sm:text-sm uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-lg border border-amber-100 flex items-center justify-center gap-2"
                  >
                    <span>DAFTAR MITRA SEKARANG</span>
                    <ArrowRight className="w-4 h-4 text-[#04170d]" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section 
        id="faq"
        className="relative py-20 sm:py-28 bg-[#d6daba] text-stone-900 border-b-4 border-[#D4AF37] overflow-hidden"
        >
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <img src={bgKemitraanHero} alt="Background" className="w-full h-full object-cover object-center lg:object-right-top opacity-100" loading="eager" fetchPriority="high" />
        </div>
        {/* Subtle background highlight for optimal clarity */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 backdrop-blur-[0.5px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#063b2c_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#063b2c] border border-[#D4AF37] text-[#F5E6B3] text-xs font-black uppercase tracking-widest shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>PERTANYAAN POPULER</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#083325] tracking-tight leading-tight">
              PERTANYAAN SERING <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A7B1C] via-[#C89B2B] to-[#785E0F] drop-shadow-sm">
                DIAJUKAN (FAQ)
              </span>
            </h2>

            <p className="text-stone-700 text-sm sm:text-base font-semibold max-w-2xl mx-auto">
              Temukan jawaban cepat atas pertanyaan umum seputar program kemitraan dan syiar agen Golden Travel.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-emerald-900/15 hover:border-[#D4AF37] overflow-hidden shadow-xl transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-black text-[#083325] hover:text-[#063b2c] transition-colors"
                >
                  <span className="text-base sm:text-lg">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-[#063b2c] text-[#F5E6B3] border border-[#D4AF37] flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 bg-[#D4AF37] text-emerald-950' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm sm:text-base text-stone-700 font-medium leading-relaxed border-t border-stone-200/80 pt-4 bg-white/60 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-[#04281e] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Siap Menjadi Bagian dari Syiar Baitullah Bersama Golden Travel?
          </h2>
          <p className="text-emerald-100/80 max-w-2xl mx-auto text-sm sm:text-base">
            Daftarkan diri Anda sekarang juga. Proses mudah, gratis, dan terhubung langsung ke portal keagenan terpercaya.
          </p>
          <div className="pt-2">
            <Link 
              to="/mitra/login" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#f3d373] to-[#AA771C] text-[#04170d] font-black text-sm uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              <span>Daftar Mitra Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
