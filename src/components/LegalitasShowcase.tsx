import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Building2, 
  FileCheck, 
  Handshake, 
  Sparkles, 
  CheckCircle2, 
  CreditCard,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { LEGALITAS_BG_DATA } from '../assets/legalitasBgData';
import { ABOUT_BG_DATA } from '../assets/aboutBgData';

export interface LegalCardItem {
  id: string;
  title: string;
  iconType: 'ppiu' | 'pihk' | 'bpw' | 'nib' | 'amphuri' | 'npwp';
  category: string;
  issuer: string;
  description: string;
  highlights: string[];
}

export const LEGAL_CARD_ITEMS: LegalCardItem[] = [
  {
    id: 'ppiu',
    title: 'Izin Penyelenggara Ibadah Umrah (PPIU)',
    iconType: 'ppiu',
    category: 'Penyelenggara Perjalanan Ibadah Umrah',
    issuer: 'Kementerian Agama Republik Indonesia',
    description: 'Terdaftar resmi di Kemenag RI sebagai Penyelenggara Perjalanan Ibadah Umrah (PPIU) dengan akreditasi A (Sangat Baik).',
    highlights: ['Akreditasi Grade A (Sangat Baik)', 'Terintegrasi SISKOPATUH Kemenag', 'Kepastian Jadwal & Akomodasi']
  },
  {
    id: 'pihk',
    title: 'Izin Penyelenggara Ibadah Haji Khusus (PIHK)',
    iconType: 'pihk',
    category: 'Penyelenggara Ibadah Haji Khusus',
    issuer: 'Kementerian Agama Republik Indonesia',
    description: 'Mengantongi lisensi Penyelenggara Ibadah Haji Khusus (PIHK) resmi negara, memberikan kepastian kuota legal dan perlindungan hak jemaah.',
    highlights: ['Lisensi Haji Khusus Resmi', 'Jaminan Kuota Kuota Kemenag RI', 'Pendampingan Bimbingan Ibadah']
  },
  {
    id: 'bpw',
    title: 'Izin Biro Perjalanan Wisata (BPW)',
    iconType: 'bpw',
    category: 'Biro Perjalanan Wisata Resmi',
    issuer: 'Dinas Pariwisata & Kemenparekraf RI',
    description: 'Lisensi operasional biro perjalanan wisata resmi terstandarisasi yang menjamin legalitas seluruh paket perjalanan ibadah umrah & tour.',
    highlights: ['Sertifikasi Wisata Resmi', 'Standar Kemenparekraf RI', 'Jaminan Keamanan Perjalanan']
  },
  {
    id: 'nib',
    title: 'SIUP & Nomor Induk Berusaha (NIB)',
    iconType: 'nib',
    category: 'Nomor Induk Berusaha & Izin Usaha',
    issuer: 'BKPM / OSS Republik Indonesia',
    description: 'Dokumen legalitas usaha resmi berstandar OSS nasional yang mencakup klasifikasi agen perjalanan ibadah dan pemesanan tiket.',
    highlights: ['Terdaftar Sistem OSS BKPM', 'Izin Usaha Operasional Sah', 'Legalitas Hukum Nasional']
  },
  {
    id: 'amphuri',
    title: 'Keanggotaan Asosiasi Resmi (AMPHURI)',
    iconType: 'amphuri',
    category: 'Asosiasi Muslim Penyelenggara Haji & Umrah',
    issuer: 'DPP AMPHURI / HIMPUH',
    description: 'Tergabung secara aktif dalam asosiasi terbesar penyelenggara haji dan umrah terpercaya Indonesia, menjamin kepatuhan kode etik.',
    highlights: ['Anggota Aktif AMPHURI', 'Kepatuhan Kode Etik Industri', 'Jaringan Kemitraan Seluruh Saudi']
  },
  {
    id: 'npwp',
    title: 'NPWP Perusahaan PT. Golden Tour Haramain',
    iconType: 'npwp',
    category: 'Nomor Pokok Wajib Pajak Badan',
    issuer: 'Direktorat Jenderal Pajak Kemenkeu RI',
    description: 'Terdaftar secara sah sebagai Wajib Pajak Badan PT. Golden Tour Haramain yang taat hukum, mendukung transparansi finansial.',
    highlights: ['Wajib Pajak Badan Sah', 'Transparansi Finansial Perusahaan', 'Kepatuhan Hukum Perpajakan']
  }
];

export default function LegalitasShowcase() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#012519] text-white overflow-hidden" id="legalitas">
      {/* Background Image Container with Kaaba & Gold Mandalas */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Deep Emerald Dark Canvas */}
        <div className="absolute inset-0 bg-[#012519]"></div>
        
        {/* Base Layer: Uploaded Emerald & Gold Mandala Pattern Background */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-75"
          style={{ backgroundImage: `url(${LEGALITAS_BG_DATA})` }}
        ></div>

        {/* Prominent Majestic Kaaba Image Overlay - Right Side Display */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 h-full overflow-hidden">
          <img 
            src={ABOUT_BG_DATA} 
            alt="Latar Belakang Ka'bah Masjidil Haram" 
            className="w-full h-full object-cover object-right sm:object-[80%_center] opacity-90 drop-shadow-2xl"
          />
          {/* Smooth Gradient Masks to Blend Kaaba with Emerald Green Mandalas */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#012519] via-[#012519]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#012519]/70 via-transparent to-[#012519]/85"></div>
        </div>

        {/* Left Side Gold Mandala Accent Overlay for Symmetry */}
        <div className="absolute top-0 left-0 bottom-0 w-40 sm:w-64 md:w-80 lg:w-[420px] pointer-events-none overflow-hidden opacity-90 mix-blend-screen">
          <img 
            src={LEGALITAS_BG_DATA} 
            alt="Corak Mandala Emas Kiri" 
            className="h-full w-auto max-w-none object-cover object-left"
          />
        </div>

        {/* Soft Golden Glow & Vignette */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-[#D4AF37]/15 rounded-full blur-[150px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#012519]/60 via-transparent to-[#012519]/85"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Header Text Section */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Legalitas & Sertifikasi Resmi</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
            Legalitas dan Kepercayaan Kami <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
              untuk Kenyamanan Anda
            </span>
          </h2>

          <p className="font-sans text-stone-200 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto text-center pt-1">
            Kepercayaan Anda adalah prioritas utama kami. Untuk memberikan jaminan keamanan, profesionalisme, dan kepatuhan penuh terhadap regulasi, berikut adalah dokumen legalitas resmi kami sebagai Penyelenggara Perjalanan Ibadah yang Sah di Indonesia.
          </p>
        </div>

        {/* 6 Legal Cards Showcase Grid - Clean Executive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {LEGAL_CARD_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-[#FAF7F0] text-[#0B2319] border-2 border-[#D4AF37]/70 rounded-2xl p-6 sm:p-7 shadow-[0_15px_30px_rgba(0,0,0,0.35)] hover:border-[#D4AF37] hover:shadow-[0_20px_45px_rgba(212,175,55,0.25)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Gold Top Metallic Bar Accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>

              <div className="pt-2">
                {/* Top Header Row with Icon & Verified Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B2319] to-[#04120C] text-[#D4AF37] border border-[#D4AF37] flex items-center justify-center shadow-md">
                    {item.iconType === 'ppiu' && <Award className="w-6 h-6 text-[#D4AF37]" />}
                    {item.iconType === 'pihk' && <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />}
                    {item.iconType === 'bpw' && <Building2 className="w-6 h-6 text-[#D4AF37]" />}
                    {item.iconType === 'nib' && <FileCheck className="w-6 h-6 text-[#D4AF37]" />}
                    {item.iconType === 'amphuri' && <Handshake className="w-6 h-6 text-[#D4AF37]" />}
                    {item.iconType === 'npwp' && <CreditCard className="w-6 h-6 text-[#D4AF37]" />}
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-[#012519]/10 text-[#0B2319] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Terverifikasi Resmi</span>
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#0B2319] leading-snug mb-1 group-hover:text-[#8B6508] transition-colors">
                  {item.title}
                </h3>

                {/* Issuer */}
                <p className="font-sans text-xs font-semibold text-[#8B6508] mb-3">
                  {item.issuer}
                </p>

                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-stone-600 font-normal leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Highlight Checkpoints */}
                <div className="space-y-1.5 pt-1 border-t border-stone-200/80">
                  {item.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                      <div className="w-4 h-4 rounded-full bg-[#012519] flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Line */}
              <div className="pt-4 mt-5 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                <span className="font-semibold text-[#0B2319]">PT. Golden Tour Haramain</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Status Aktif
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Slogan Ribbon */}
        <div className="text-center pt-4">
          <div className="inline-block bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/30 to-[#D4AF37]/15 border border-[#D4AF37]/60 px-8 py-3.5 rounded-full shadow-lg backdrop-blur-md">
            <p className="font-serif text-base sm:text-lg md:text-xl font-medium text-[#F3E5AB] italic tracking-wide">
              "Kenyamanan dan Kepercayaan Anda, Prioritas Utama Kami."
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
