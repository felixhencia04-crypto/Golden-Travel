import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Award, 
  Building2, 
  FileCheck, 
  Handshake, 
  Sparkles, 
  CheckCircle2, 
  CreditCard,
  Check,
  Lock,
  X,
  BadgeCheck,
  Eye,
  Star,
  Plane,
  Hotel,
  FileText,
  Calendar,
  Compass,
  AlertCircle,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LEGALITAS_BG_DATA } from '../assets/legalitasBgData';
import { ABOUT_BG_DATA } from '../assets/aboutBgData';

export interface LegalCardItem {
  id: string;
  title: string;
  iconType: 'ppiu' | 'pihk' | 'bpw' | 'nib' | 'amphuri' | 'finansial';
  category: 'kemenag' | 'usaha' | 'asosiasi';
  categoryLabel: string;
  issuer: string;
  accreditation: string;
  description: string;
  highlights: string[];
  validUntil: string;
}

export const LEGAL_CARD_ITEMS: LegalCardItem[] = [
  {
    id: 'ppiu',
    title: 'Penyelenggara Perjalanan Ibadah Umrah (PPIU)',
    iconType: 'ppiu',
    category: 'kemenag',
    categoryLabel: 'Kementerian Agama RI',
    issuer: 'Direktorat Jenderal Penyelenggaraan Haji dan Umrah Kemenag RI',
    accreditation: 'Terakreditasi (Standar Kualitas & Layanan Teruji Profesional)',
    description: 'Terdaftar & terverifikasi resmi di Kementerian Agama RI sebagai Penyelenggara Perjalanan Ibadah Umrah resmi dengan predikat terakreditasi terbaik.',
    highlights: [
      'Terakreditasi dengan Kualitas Layanan Teruji Profesional',
      'Terintegrasi Sistem SISKOPATUH Kemenag RI',
      'Jaminan Kepastian Jadwal & Hotel Makkah-Madinah'
    ],
    validUntil: 'Status Aktif & Terverifikasi'
  },
  {
    id: 'pihk',
    title: 'Penyelenggara Ibadah Haji Khusus (PIHK)',
    iconType: 'pihk',
    category: 'kemenag',
    categoryLabel: 'Kementerian Agama RI',
    issuer: 'Direktorat Jenderal Penyelenggaraan Haji dan Umrah Kemenag RI',
    accreditation: 'Lisensi Resmi Haji Khusus',
    description: 'Izin Penyelenggara Ibadah Haji Khusus resmi negara, memberikan kepastian kuota haji legal langsung dari Kemenag tanpa antrean bertahun-tahun.',
    highlights: [
      'Lisensi Haji Khusus (ONH Plus) Sah Negara',
      'Jaminan Kuota Resmi Kemenag Direct',
      'Pendampingan Pembimbing Ibadah Bersertifikat'
    ],
    validUntil: 'Status Aktif & Terdaftar Resmi'
  },
  {
    id: 'bpw',
    title: 'Biro Perjalanan Wisata (BPW) Terstandar',
    iconType: 'bpw',
    category: 'usaha',
    categoryLabel: 'Kemenparekraf RI',
    issuer: 'Dinas Kebudayaan & Pariwisata / Kemenparekraf RI',
    accreditation: 'Sertifikasi Usaha Pariwisata Resmi',
    description: 'Biro perjalanan wisata terstandarisasi pemerintah yang menjamin kualifikasi manajemen, keamanan paket tour, dan kenyamanan perjalanan jemaah.',
    highlights: [
      'Sertifikasi Standar Usaha Pariwisata',
      'Memenuhi Standar Mutu Layanan Kemenparekraf',
      'Jaminan Perlindungan & Proteksi Jemaah'
    ],
    validUntil: 'Status Aktif & Terverifikasi'
  },
  {
    id: 'nib',
    title: 'Legalitas Badan Hukum PT. Golden Tour Haramain',
    iconType: 'nib',
    category: 'usaha',
    categoryLabel: 'BKPM / OSS RI',
    issuer: 'Lembaga Pengelola & Penyelenggara OSS BKPM RI',
    accreditation: 'Terintegrasi Legalitas OSS Nasional',
    description: 'Badan hukum usaha resmi berstandar OSS nasional yang sah secara hukum mencakup klasifikasi agen perjalanan ibadah umrah, haji, dan penerbangan.',
    highlights: [
      'Terdaftar Sistem OSS BKPM Nasional',
      'Badan Hukum Sah Terlindungi Undang-Undang',
      'Klasifikasi Usaha Travel Umrah & Haji Resmi'
    ],
    validUntil: 'Berlaku Selama Perusahaan Beroperasi'
  },
  {
    id: 'amphuri',
    title: 'Keanggotaan Asosiasi Resmi (AMPHURI)',
    iconType: 'amphuri',
    category: 'asosiasi',
    categoryLabel: 'Asosiasi Travel Umrah',
    issuer: 'DPP AMPHURI (Asosiasi Muslim Penyelenggara Haji & Umrah RI)',
    accreditation: 'Anggota Aktif Dewan Pengurus Pusat',
    description: 'Tergabung secara aktif dalam asosiasi terbesar penyelenggara haji dan umrah terpercaya di Indonesia, menjamin kepatuhan kode etik dan mutu layanan.',
    highlights: [
      'Anggota Aktif Asosiasi AMPHURI Indonesia',
      'Komitmen Kepatuhan Kode Etik Jemaah',
      'Jaringan Kemitraan Hotel & Transportasi Saudi'
    ],
    validUntil: 'Keanggotaan Aktif'
  },
  {
    id: 'finansial',
    title: 'Garansi Keamanan Finansial & Transaksi',
    iconType: 'finansial',
    category: 'usaha',
    categoryLabel: 'Perbankan Syariah Mitra',
    issuer: 'Bank Syariah Indonesia (BSI) / Bank Mandiri / BCA',
    accreditation: 'Rekening Resmi PT. Golden Tour Haramain',
    description: 'Seluruh pembayaran transaksi jemaah dijamin aman 100% menggunakan rekening resmi atas nama Perusahaan PT, terbebas dari risiko penipuan.',
    highlights: [
      'Pembayaran Wajib ke Rekening Resmi PT',
      'Transparansi Kuitansi & Invoice Digital',
      'Sistem Pembayaran Terproteksi & Akuntabel'
    ],
    validUntil: 'Jaminan Transaksi Aman 100%'
  }
];

export default function LegalitasShowcase() {
  const [activeTab, setActiveTab] = useState<'all' | 'kemenag' | 'usaha' | 'asosiasi'>('all');
  const [selectedItem, setSelectedItem] = useState<LegalCardItem | null>(null);

  const filteredItems = LEGAL_CARD_ITEMS.filter((item) => {
    return activeTab === 'all' || item.category === activeTab;
  });

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-20 bg-[#011d14] text-white overflow-hidden" id="legalitas">
      
      {/* Background Image Container with Kaaba & Gold Mandalas */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Deep Emerald Background Base */}
        <div className="absolute inset-0 bg-[#011d14]"></div>
        
        {/* Mandala Overlay */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-60 mix-blend-soft-light"
          style={{ backgroundImage: `url(${LEGALITAS_BG_DATA})` }}
        ></div>

        {/* Kaaba Background Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-3/5 h-full overflow-hidden opacity-80">
          <img 
            src={ABOUT_BG_DATA} 
            alt="Latar Belakang Ka'bah" 
            className="w-full h-full object-cover object-right sm:object-[85%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#011d14] via-[#011d14]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#011d14]/80 via-transparent to-[#011d14]/95"></div>
        </div>

        {/* Ambient Gold Lighting */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Top Header Badge & Main Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/35 to-[#D4AF37]/20 border border-[#D4AF37]/70 text-[#F3E5AB] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-xl backdrop-blur-md"
          >
            <Shield className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span>Garansi Keamanan & Perlindungan 100% Jemaah</span>
          </motion.div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
            Legalitas Resmi & Kepercayaan <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#FFF5D1] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent">
              Terjamin 100% Amanah
            </span>
          </h2>

          <p className="font-sans text-stone-300 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
            Prioritas utama PT. Golden Tour Haramain adalah memberikan <strong className="text-[#F3E5AB] font-semibold">100% kepastian legalitas, rasa aman, dan kepuasan ibadah</strong>. Terdaftar resmi di Kementerian Agama RI serta didukung sistem proteksi jemaah yang transparan.
          </p>

          {/* Quick Stat Guarantee Ribbon (No raw numbers) */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-[#012d20]/90 border border-[#D4AF37]/40 p-3.5 rounded-2xl backdrop-blur-md text-center shadow-lg">
              <span className="block font-serif font-bold text-lg text-[#F3E5AB]">Izin PPIU & PIHK</span>
              <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">Kemenag RI Resmi</span>
            </div>
            <div className="bg-[#012d20]/90 border border-[#D4AF37]/40 p-3.5 rounded-2xl backdrop-blur-md text-center shadow-lg">
              <span className="block font-serif font-bold text-lg text-[#F3E5AB]">Terakreditasi</span>
              <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">Standar Kualitas & Layanan Teruji Profesional</span>
            </div>
            <div className="bg-[#012d20]/90 border border-[#D4AF37]/40 p-3.5 rounded-2xl backdrop-blur-md text-center shadow-lg">
              <span className="block font-serif font-bold text-lg text-[#F3E5AB]">Anggota AMPHURI</span>
              <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold">Asosiasi Resmi Travel</span>
            </div>
            <div className="bg-[#012d20]/90 border border-[#D4AF37]/40 p-3.5 rounded-2xl backdrop-blur-md text-center shadow-lg">
              <span className="block font-serif font-bold text-lg text-[#F3E5AB]">SISKOPATUH</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terintegrasi Direct
              </span>
            </div>
          </div>
        </div>

        {/* Interactive "5 PASTI UMRAH KEMENAG RI" Banner */}
        <div className="bg-gradient-to-r from-[#013526] via-[#02402e] to-[#012b1f] border-2 border-[#D4AF37]/70 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 pb-6 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B6508] text-[#011d14] flex items-center justify-center font-bold shadow-lg shrink-0">
                <BadgeCheck className="w-8 h-8 text-[#011d14]" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">Komitmen 5 Pasti Umrah Kemenag RI</h3>
                <p className="text-xs sm:text-sm text-stone-300 font-light">Garansi standar tertinggi perlindungan & kepastian ibadah jemaah Indonesia.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[
              { num: '1', title: 'Pasti Travelnya', desc: 'Travel Izin Resmi Kemenag', icon: ShieldCheck },
              { num: '2', title: 'Pasti Jadwalnya', desc: 'Tanggal Tanggal Pasti', icon: Calendar },
              { num: '3', title: 'Pasti Terbangnya', desc: 'Tiket PP & Maskapai Sah', icon: Plane },
              { num: '4', title: 'Pasti Hotelnya', desc: 'Hotel Makkah-Madinah Terkonfirmasi', icon: Hotel },
              { num: '5', title: 'Pasti Visanya', desc: 'Visa & Tasreh Umrah Resmi', icon: FileText },
            ].map((pasti) => {
              const IconComp = pasti.icon;
              return (
                <div key={pasti.num} className="bg-[#012218]/90 border border-[#D4AF37]/40 p-4 rounded-2xl flex items-center gap-3 hover:border-[#D4AF37] transition-all shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3E5AB] flex items-center justify-center shrink-0 font-bold text-sm">
                    <IconComp className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{pasti.title}</h4>
                    <p className="text-[10px] text-stone-300 font-light leading-tight">{pasti.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 bg-[#01281e]/90 p-1.5 rounded-2xl border border-[#D4AF37]/40 backdrop-blur-md w-full md:w-auto">
            {[
              { id: 'all', label: 'Semua Legalitas (6)' },
              { id: 'kemenag', label: 'Kemenag RI (2)' },
              { id: 'usaha', label: 'Izin Usaha & Finansial (3)' },
              { id: 'asosiasi', label: 'Asosiasi (1)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#011d14] font-bold shadow-md'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Executive Legal Cards Grid (Clean without numbers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E5] to-[#EFE7D5] text-[#011d14] border-2 border-[#D4AF37]/80 rounded-3xl p-6 sm:p-7 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-[#D4AF37] hover:shadow-[0_25px_50px_rgba(212,175,55,0.3)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Gold Metallic Header Bar */}
                <div className="h-2 bg-gradient-to-r from-[#D4AF37] via-[#FFF5D1] to-[#AA7C11] absolute top-0 left-0 right-0"></div>

                <div>
                  {/* Category & Status Row */}
                  <div className="flex items-center justify-between gap-2 mb-4 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#011d14] text-[#F3E5AB] text-[11px] font-bold tracking-wide border border-[#D4AF37]/40">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{item.categoryLabel}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>TERVERIFIKASI RESMI</span>
                    </span>
                  </div>

                  {/* Icon & Title Block */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#012d20] to-[#011710] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                      {item.iconType === 'ppiu' && <Award className="w-7 h-7 text-[#D4AF37]" />}
                      {item.iconType === 'pihk' && <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />}
                      {item.iconType === 'bpw' && <Building2 className="w-7 h-7 text-[#D4AF37]" />}
                      {item.iconType === 'nib' && <FileCheck className="w-7 h-7 text-[#D4AF37]" />}
                      {item.iconType === 'amphuri' && <Handshake className="w-7 h-7 text-[#D4AF37]" />}
                      {item.iconType === 'finansial' && <CreditCard className="w-7 h-7 text-[#D4AF37]" />}
                    </div>

                    <div className="space-y-1">
                      <div className="inline-block font-sans text-[11px] font-bold text-[#8B6508] bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                        {item.accreditation}
                      </div>
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-[#011d14] leading-snug group-hover:text-[#8B6508] transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Issuer Subtitle */}
                  <p className="text-xs font-semibold text-[#8B6508] mb-3 border-b border-stone-300/80 pb-2 flex items-center gap-1">
                    <span>Instansi:</span>
                    <span className="text-[#011d14]">{item.issuer}</span>
                  </p>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal mb-4">
                    {item.description}
                  </p>

                  {/* Highlight Checkpoints */}
                  <div className="space-y-1.5 pt-3 border-t border-stone-300/80 mb-4">
                    {item.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-stone-800 font-medium">
                        <div className="w-4 h-4 rounded-full bg-[#011d14] flex items-center justify-center shrink-0 text-[#D4AF37]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-4 border-t border-stone-300/80 flex items-center justify-between gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Garansi Terjamin</span>
                  </span>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-[#012d20] to-[#011710] hover:from-[#01402e] hover:to-[#012218] px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Detail Informasi</span>
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Certificate Modal Popup */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#FAF7F2] text-[#011d14] max-w-2xl w-full rounded-3xl p-6 sm:p-8 border-4 border-[#D4AF37] shadow-2xl relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#011d14] text-[#F3E5AB] flex items-center justify-center hover:bg-[#8B6508] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Certificate Frame Inner Styling */}
                <div className="border-2 border-[#D4AF37]/60 p-6 sm:p-8 rounded-2xl bg-white relative">
                  {/* Watermark Seal */}
                  <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-48 h-48 text-[#D4AF37]" />
                  </div>

                  <div className="text-center space-y-2 mb-6 border-b border-stone-200 pb-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#011d14] text-[#F3E5AB] text-xs font-bold">
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span>GARANSI LEGALITAS & PERLINDUNGAN RESMI</span>
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#011d14]">
                      {selectedItem.title}
                    </h3>
                    <p className="text-xs text-[#8B6508] font-bold">
                      Status: {selectedItem.accreditation}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-stone-700 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-500 text-[11px] block">Instansi Penerbit:</span>
                        <strong className="text-[#011d14] font-semibold">{selectedItem.issuer}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px] block">Predikat Kualitas:</span>
                        <strong className="text-[#8B6508]">{selectedItem.accreditation}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px] block">Status Legalitas:</span>
                        <strong className="text-emerald-700">Terdaftar & Terverifikasi Aktif</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px] block">Jaminan Keamanan:</span>
                        <strong className="text-[#011d14]">{selectedItem.validUntil}</strong>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#011d14] mb-1">Deskripsi Garansi:</h4>
                      <p className="text-stone-600 leading-relaxed text-xs">{selectedItem.description}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#011d14] mb-1">Komitmen Layanan & Perlindungan:</h4>
                      <ul className="space-y-1.5 text-xs">
                        {selectedItem.highlights.map((hl, i) => (
                          <li key={i} className="flex items-center gap-2 text-stone-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <Shield className="w-5 h-5 text-[#D4AF37]" />
                      <span>Terverifikasi Database Sistem Pemerintah RI</span>
                    </div>

                    <button
                      onClick={() => setSelectedItem(null)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#011d14] text-[#F3E5AB] hover:bg-[#013526] text-xs font-bold transition-all w-full sm:w-auto justify-center shadow-md"
                    >
                      <span>Tutup Detail</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Executive Slogan */}
        <div className="text-center pt-2">
          <div className="inline-block bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/40 to-[#D4AF37]/20 border border-[#D4AF37]/70 px-8 py-4 rounded-full shadow-2xl backdrop-blur-md">
            <p className="font-serif text-base sm:text-lg md:text-xl font-bold text-[#F3E5AB] tracking-wide">
              "Melayani Ibadah Suci Anda dengan Kepastian Legalitas, Amanah, & Kenyamanan Utama."
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

