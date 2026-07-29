import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Calendar, 
  Hotel, 
  Plane, 
  MessageCircle, 
  ChevronRight, 
  Info, 
  X, 
  Clock, 
  Award, 
  ShieldCheck, 
  MapPin, 
  Users, 
  FileText,
  Star,
  Layers,
  ArrowRight,
  Shield,
  Tent
} from 'lucide-react';
import { PAKET_UMRAH_BG_DATA } from '../assets/paketUmrahBgData';

export interface HajiPackage {
  id: string;
  name: string;
  category: 'furoda' | 'khusus' | 'plus_turki';
  categoryLabel: string;
  duration: string;
  priceUsd: number;
  priceIdrApprox: string;
  dpAmount: string;
  waitingTime: string;
  visaType: string;
  isPopular?: boolean;
  isBestSeller?: boolean;
  imageUrl: string;
  airline: string;
  hotelMakkah: string;
  hotelMakkahStars: number;
  hotelMakkahDistance: string;
  hotelMadinah: string;
  hotelMadinahStars: number;
  hotelMadinahDistance: string;
  tentMinaArafah: string;
  seatsLeft: number;
  highlights: string[];
  includes: string[];
  excludes: string[];
  requirements: string[];
  itinerary: { day: string; title: string; description: string }[];
}

const DEFAULT_HAJI_PACKAGES: HajiPackage[] = [
  {
    id: 'haji-furoda-vip',
    name: 'Haji Furoda VIP (Visa Mujamalah)',
    category: 'furoda',
    categoryLabel: 'Langsung Berangkat 2026',
    duration: '24-26 Hari',
    priceUsd: 21500,
    priceIdrApprox: '340.000.000',
    dpAmount: 'USD 5.000 / pax',
    waitingTime: 'Tanpa Antre (Langsung Berangkat)',
    visaType: 'Visa Haji Mujamalah / Furoda Resmi',
    isBestSeller: true,
    isPopular: true,
    imageUrl: 'https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=800&q=80',
    airline: 'Saudia Airlines / Garuda Indonesia (Direct Flight)',
    hotelMakkah: 'Fairmont Makkah Clock Royal Tower',
    hotelMakkahStars: 5,
    hotelMakkahDistance: '0 Meter Pelataran',
    hotelMadinah: 'Anwar Al Madinah Movenpick / Oberoi',
    hotelMadinahStars: 5,
    hotelMadinahDistance: 'Pelataran Masjid Nabawi',
    tentMinaArafah: 'Tenda Maktab VIP Arafah & Mina (Full AC + Sofa Bed)',
    seatsLeft: 6,
    highlights: [
      'Visa Haji Mujamalah Resmi terdaftar Kerajaan Arab Saudi',
      'Tanpa Antre — Berangkat Tahun Ini (Musim Haji 1447H)',
      'Akomodasi Hotel Bintang 5 Pelataran Makkah & Madinah',
      'Tenda Maktab VIP Arafah & Mina dengan Fasilitas Catering Indonesia',
      'Tiket Kereta Cepat Haramain Express (First Class)',
      'Bimbingan Ibadah oleh Pembimbing & Ustadz berpengalaman'
    ],
    includes: [
      'Visa Haji Furoda / Mujamalah Resmi',
      'Tiket Pesawat PP Saudia Airlines / Garuda (Kelas Ekonomi Executive)',
      'Akomodasi Hotel Bintang 5 Makkah & Madinah',
      'Tenda Maktab VIP Arafah & Mina + Karpet & Sofa Bed',
      'Makan 3x Sehari Menu Indonesia Chef Profesional',
      'Kereta Cepat Haramain Makkah - Madinah VIP',
      'Bis Bus Eksekutif AC Selama Ziarah & Transportasi',
      'Perlengkapan Haji Premium (Koper, Kain Ihram/Mukena, Jaket, Seragam)',
      'Air Zamzam 5 Liter & Asuransi Perjalanan Haji'
    ],
    excludes: [
      'Biaya Paspor & Pemeriksaan Kesehatan / Vaksin Meningitis',
      'Dam (Denda) Haji Tamattu / Qiran',
      'Pengeluaran Pribadi (Laundry, Telepon, Kursi Roda Khusus)',
      'Kelebihan Bagasi Pesawat'
    ],
    requirements: [
      'Foto Scan Paspor Asli (Masa berlaku minimal 8 bulan)',
      'Buku Nikah Asli (Pasutri) / Akta Kelahiran Asli (Anak)',
      'Kartu Tanda Penduduk (KTP) & Kartu Keluarga (KK)',
      'Pasfoto Terbaru Latar Belakang Putih Ukuran 4x6 (6 lembar)',
      'Sertifikat Vaksin Meningitis & COVID-19 Lengkap',
      'Membayar Uang Muka (DP) USD 5.000 / pax'
    ],
    itinerary: [
      { day: 'Hari 1-2', title: 'Keberangkatan Jakarta - Jeddah - Madinah', description: 'Berkumpul di Bandara Soekarno Hatta, proses check-in & pembagian dokumen. Penerbangan ke Jeddah/Madinah. Tiba & check-in hotel Madinah.' },
      { day: 'Hari 3-5', title: 'Ziarah Kota Madinah & Raudhah', description: 'Melaksanakan shalat berjamaah di Masjid Nabawi, ziarah ke Raudhah, Makam Rasulullah SAW, Masjid Quba, Jabal Uhud, dan Kebun Kurma.' },
      { day: 'Hari 6', title: 'Persiapan Ihram & Menuju Makkah', description: 'Mengambil Miqat di Bir Ali, niat Ihram Haji/Umrah, perjalanan menuju Makkah dengan Kereta Cepat Haramain. Check-in hotel Makkah & Thawaf Qudum.' },
      { day: 'Hari 7-8', title: 'Manasik & Pemantapan Ibadah di Makkah', description: 'Memperbanyak ibadah di Masjidil Haram dan pendalaman materi puncak ibadah haji bersama Muthawwif.' },
      { day: 'Hari 9', title: 'Puncak Haji: Tarwiyah & Wukuf di Arafah (9 Dzulhijjah)', description: 'Berangkat menuju Arafah. Melaksanakan Wukuf Arafah, khutbah wukuf, serta dzikir dan doa khusyu hingga terbenam matahari.' },
      { day: 'Hari 10', title: 'Muzdalifah & Mabit di Mina (10 Dzulhijjah)', description: 'Singgah di Muzdalifah mabit & mengambil batu jumrah. Menuju Mina untuk Melontar Jumrah Aqabah & Tahallul Awal.' },
      { day: 'Hari 11-13', title: 'Mabit & Melontar Jumrah Ula, Wusta, Aqabah di Mina', description: 'Mabit di Tenda Maktab VIP Mina, melontar jumrah hari Tasyriq, dan menyelesaikan Tahallul Tsani.' },
      { day: 'Hari 14-18', title: 'Thawaf Ifadhah, Sai, & Tawaf Wada', description: 'Kembali ke hotel Makkah, menyempurnakan Thawaf Ifadhah & Sai Haji. Persiapan Thawaf Wada sebelum kepulangan.' },
      { day: 'Hari 19-24', title: 'Kembali ke Tanah Air', description: 'Perjalanan menuju Bandara Jeddah untuk kepulangan ke Jakarta. Tiba di Tanah Air dengan predikat Haji Mabrur.' }
    ]
  },
  {
    id: 'haji-khusus-onh-plus',
    name: 'Haji Khusus / ONH Plus (Kemenag RI)',
    category: 'khusus',
    categoryLabel: 'Kuota Resmi Kemenag RI',
    duration: '26 Hari',
    priceUsd: 14500,
    priceIdrApprox: '230.000.000',
    dpAmount: 'USD 4.000 / pax',
    waitingTime: 'Masa Tunggu ~5-7 Tahun (Siskohat Resmi)',
    visaType: 'Visa Haji Kuota Resmi Indonesia',
    isPopular: true,
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
    airline: 'Saudia Airlines / Garuda Indonesia Direct',
    hotelMakkah: 'Pullman ZamZam Makkah / Dar Al Ghufran',
    hotelMakkahStars: 5,
    hotelMakkahDistance: 'Depan Pelataran Kompleks Abraj',
    hotelMadinah: 'Taiba Front / Grand Mercure Madinah',
    hotelMadinahStars: 5,
    hotelMadinahDistance: '150 Meter Masjid Nabawi',
    tentMinaArafah: 'Tenda Maktab Khusus Haji Plus AC & Catering',
    seatsLeft: 12,
    highlights: [
      'Porsi Nomor Kuota Resmi Kementerian Agama RI (SISKOHAT)',
      'Jaminan Kepastian Berangkat Sesuai Nomor Porsi Kuota',
      'Fasilitas Hotel Bintang 5 Dekat Pelataran Masjid',
      'Penyelenggara Berizin Resmi PIHK Kemenag No. 912/2021',
      'Pembimbing Ibadah Ulama & Pembimbing Bersertifikat'
    ],
    includes: [
      'Setoran Awal Nomor Porsi SISKOHAT Kemenag',
      'Tiket Pesawat PP Saudia Airlines / Garuda Direct',
      'Akomodasi Hotel Bintang 5 Makkah & Madinah',
      'Tenda Khusus Arafah & Mina AC + Katering Indonesia',
      'Manasik Haji 5x Pertemuan Intensif Teori & Praktek',
      'Bimbingan Ibadah & Dokter Pendamping 24 Jam',
      'Perlengkapan Lengkap Koper, Seragam & Tas Paspor'
    ],
    excludes: [
      'Pemeriksaan Kesehatan & Vaksinasi Khusus',
      'Biaya Dam / Qurban Pasangan',
      'Pengeluaran Pribadi'
    ],
    requirements: [
      'Fotokopi KTP & Kartu Keluarga (KK)',
      'Fotokopi Akta Kelahiran / Surat Nikah',
      'Pasfoto 3x4 & 4x6 Latar Putih (masing-masing 10 lembar)',
      'Setoran Awal Porsi Kuota Haji Khusus USD 4.000'
    ],
    itinerary: [
      { day: 'Hari 1-3', title: 'Pemberangkatan & Madinah Munawwarah', description: 'Penerbangan dari Jakarta ke Madinah. Ziarah Raudhah & Masjid Nabawi.' },
      { day: 'Hari 4-8', title: 'Persiapan & Perjalanan ke Makkah Al Mukarramah', description: 'Ambil Miqat, Umrah Wajib Haji, dan pendalaman materi manasik di Makkah.' },
      { day: 'Hari 9-13', title: 'Puncak Prosesi Ibadah Haji (Armuzna)', description: 'Wukuf Arafah, Mabit Muzdalifah & Mina, Melontar Jumrah 3 Hari Tasyriq.' },
      { day: 'Hari 14-26', title: 'Thawaf Ifadhah, Tawaf Wada & Kepulangan', description: 'Penyempurnaan rukun haji dan kepulangan selamat sampai Tanah Air.' }
    ]
  },
  {
    id: 'haji-furoda-turkey',
    name: 'Haji Furoda Executive + City Tour Istanbul',
    category: 'plus_turki',
    categoryLabel: 'Furoda + Transit Turki 30 Hari',
    duration: '30 Hari',
    priceUsd: 24800,
    priceIdrApprox: '390.000.000',
    dpAmount: 'USD 5.000 / pax',
    waitingTime: 'Tanpa Antre (Langsung Berangkat 2026)',
    visaType: 'Visa Haji Mujamalah + Visa Transit Turki',
    isBestSeller: false,
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
    airline: 'Turkish Airlines / Saudia Airlines',
    hotelMakkah: 'Raffles Makkah Palace / Swissotel',
    hotelMakkahStars: 5,
    hotelMakkahDistance: '0 Meter Kompleks Zamzam Tower',
    hotelMadinah: 'Dar Al Taqwa / Oberoi Madinah',
    hotelMadinahStars: 5,
    hotelMadinahDistance: 'Pelataran Utama Nabawi',
    tentMinaArafah: 'Tenda Maktab VIP Arafah & Mina Plus Suite',
    seatsLeft: 4,
    highlights: [
      'Visa Furoda Langsung Berangkat + Wisata Sejarah Islam Istanbul',
      'Menginap di Hotel Bintang 5 Luxury Raffles / Swissotel Makkah',
      'Wisata Hagia Sophia, Blue Mosque, & Bosphorus Cruise di Turki',
      'Kereta Cepat Haramain Executive Class Makkah-Madinah',
      'Pelayanan Private VVIP & Catering Khusus Chef Nusantara'
    ],
    includes: [
      'Visa Haji Furoda Resmi + E-Visa Turki',
      'Tiket Pesawat PP Turkish Airlines / Saudia Class',
      'Hotel Bintang 5 Makkah, Madinah & Istanbul (3 Malam)',
      'Tenda VIP Arafah & Mina AC Suite',
      'Bosphorus Private Yacht Cruise & Tour Guide Bahasa Indonesia',
      'Katering Full Board 3x Sehari & Perlengkapan VVIP'
    ],
    excludes: [
      'Biaya Pembuatan Paspor & Vaksin Meningitis',
      'Dam Qurban & Tipping Guide Turki',
      'Pengeluaran Belanja Pribadi'
    ],
    requirements: [
      'Scan Paspor Asli Berlakunya minimal 9 bulan',
      'Dokumen Identitas KTP & Kartu Keluarga',
      'Pasfoto 4x6 Latar Belakang Putih',
      'DP Pembayaran USD 5.000 / pax'
    ],
    itinerary: [
      { day: 'Hari 1-4', title: 'Transit & City Tour Istanbul Turki', description: 'Tiba di Istanbul. Mengunjungi Blue Mosque, Hagia Sophia, Topkapi Palace, dan Bosphorus Cruise.' },
      { day: 'Hari 5-10', title: 'Penerbangan Istanbul - Madinah Munawwarah', description: 'Menuju Madinah. Shalat di Masjid Nabawi, ziarah Raudhah, dan persiapan ibadah haji.' },
      { day: 'Hari 11-17', title: 'Prosesi Puncak Ibadah Haji Armuzna (Arafah, Muzdalifah, Mina)', description: 'Melaksanakan Wukuf Arafah, Mabit Muzdalifah, Mabit & Melontar Jumrah di Tenda VIP Mina.' },
      { day: 'Hari 18-30', title: 'Thawaf Ifadhah, Makkah, & Kepulangan ke Indonesia', description: 'Penyempurnaan Ibadah Haji di Makkah, Thawaf Wada, dan penerbangan kembali ke Jakarta.' }
    ]
  }
];

export default function PaketHajiShowcase() {
  const [activeTab, setActiveTab] = useState<'semua' | 'furoda' | 'khusus' | 'plus_turki'>('semua');
  const [selectedPackage, setSelectedPackage] = useState<HajiPackage | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'fasilitas' | 'itinerary' | 'persyaratan'>('fasilitas');

  const filteredPackages = DEFAULT_HAJI_PACKAGES.filter((pkg) => {
    if (activeTab === 'semua') return true;
    return pkg.category === activeTab;
  });

  const handleConsultation = (pkgName: string) => {
    const text = encodeURIComponent(
      `Assalamu'alaikum Admin Golden Travel. Saya berminat dengan informasi pendaftaran ${pkgName}. Mohon info kuota, jadwal manasik, dan rincian pendaftarannya.`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#011E15] text-white overflow-hidden border-t border-[#D4AF37]/30" id="pilihan-haji">
      
      {/* Clean Elegant Single-Layer Background */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Deep Emerald Background Base */}
        <div className="absolute inset-0 bg-[#011E15]"></div>
        
        {/* Single Full Artwork Background Image - 100% Opacity */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-100"
          style={{ backgroundImage: `url(${PAKET_UMRAH_BG_DATA})` }}
        ></div>

        {/* Natural Subtle Golden Lamp Glow */}
        <div className="absolute top-0 right-4 sm:right-12 md:right-20 w-48 h-48 sm:w-64 sm:h-64 bg-[#D4AF37]/25 rounded-full blur-3xl"></div>

        {/* Center Soft Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[160px]"></div>

        {/* Minimal Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#011E15]/15 via-transparent to-[#011E15]/35"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 border-b border-[#D4AF37]/20 pb-8 sm:pb-12">
          <div className="max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Program Haji Khusus & Furoda Resmi
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Pilihan Perjalanan <span className="text-[#D4AF37]">Ibadah Haji Mabrur</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base md:text-lg font-light leading-relaxed">
              Tunaikan Rukun Islam kelima dengan kepastian visa resmi, bimbingan syariat intensif, dan kenyamanan akomodasi Bintang 5 di Makkah, Madinah, serta Tenda Maktab VIP Armuzna.
            </p>
          </div>

          {/* Guarantee Badge */}
          <div className="flex items-center gap-3 bg-[#012B1E]/90 border border-[#D4AF37]/30 p-4 rounded-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-stone-300 font-medium">Legalitas PIHK Kemenag RI</div>
              <div className="text-sm font-bold text-white font-serif">Izin Resmi No. 912/2021</div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#01251A]/80 p-1.5 sm:p-2 rounded-2xl border border-[#D4AF37]/20 backdrop-blur-md w-fit">
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
              activeTab === 'semua'
                ? 'bg-[#D4AF37] text-[#011E15] shadow-lg shadow-[#D4AF37]/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Semua Program Haji
          </button>
          <button
            onClick={() => setActiveTab('furoda')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
              activeTab === 'furoda'
                ? 'bg-[#D4AF37] text-[#011E15] shadow-lg shadow-[#D4AF37]/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Haji Furoda (Tanpa Antre)
          </button>
          <button
            onClick={() => setActiveTab('khusus')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
              activeTab === 'khusus'
                ? 'bg-[#D4AF37] text-[#011E15] shadow-lg shadow-[#D4AF37]/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Haji Khusus / ONH Plus
          </button>
          <button
            onClick={() => setActiveTab('plus_turki')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
              activeTab === 'plus_turki'
                ? 'bg-[#D4AF37] text-[#011E15] shadow-lg shadow-[#D4AF37]/20'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Furoda + Transit Turki
          </button>
        </div>

        {/* Haji Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className={`relative group bg-[#012B1E]/90 rounded-3xl border ${
                  pkg.isBestSeller 
                    ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/10' 
                    : 'border-[#D4AF37]/25 hover:border-[#D4AF37]'
                } overflow-hidden flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5`}
              >
                {/* Popular / Best Seller Badge */}
                {pkg.isBestSeller && (
                  <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#011E15] px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Terfavorit Jamaah
                  </div>
                )}

                <div>
                  {/* Card Banner Image */}
                  <div className="relative h-56 sm:h-64 overflow-hidden">
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#012B1E] via-[#012B1E]/30 to-transparent"></div>
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-4 left-4 bg-[#011E15]/90 backdrop-blur-md text-[#D4AF37] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#D4AF37]/30 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {pkg.duration}
                    </div>

                    {/* Visa / Waiting Badge */}
                    <div className="absolute top-4 right-4 bg-[#012B1E]/90 backdrop-blur-md text-emerald-300 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30">
                      {pkg.categoryLabel}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 sm:p-7 space-y-5">
                    
                    {/* Title & Waiting info */}
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl text-white font-bold group-hover:text-[#D4AF37] transition-colors leading-snug">
                        {pkg.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-300 font-medium">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>{pkg.waitingTime}</span>
                      </div>
                    </div>

                    {/* Pricing Block */}
                    <div className="bg-[#011E15]/80 p-4 rounded-2xl border border-[#D4AF37]/20">
                      <div className="text-xs text-stone-400 font-medium uppercase tracking-wider">Biaya Paket Haji</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                          USD {pkg.priceUsd.toLocaleString('en-US')}
                        </span>
                        <span className="text-xs text-stone-300 font-sans">/ pax</span>
                      </div>
                      <div className="text-xs text-stone-300 mt-1 flex justify-between items-center pt-2 border-t border-[#D4AF37]/15">
                        <span>Estimasi Rupiah:</span>
                        <span className="font-semibold text-white">± Rp {pkg.priceIdrApprox}</span>
                      </div>
                      <div className="text-xs text-[#D4AF37] mt-1 flex justify-between items-center">
                        <span>DP Pendaftaran:</span>
                        <span className="font-bold">{pkg.dpAmount}</span>
                      </div>
                    </div>

                    {/* Quick Specs List */}
                    <div className="space-y-2.5 text-xs sm:text-sm text-stone-200">
                      <div className="flex items-start gap-2.5">
                        <Hotel className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-400">Makkah:</span> <span className="font-semibold text-white">{pkg.hotelMakkah}</span> ({pkg.hotelMakkahStars}⭐)
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Hotel className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-400">Madinah:</span> <span className="font-semibold text-white">{pkg.hotelMadinah}</span> ({pkg.hotelMadinahStars}⭐)
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Tent className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-400">Arafah & Mina:</span> <span className="font-semibold text-white">{pkg.tentMinaArafah}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Plane className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-stone-400">Penerbangan:</span> <span className="font-semibold text-white">{pkg.airline}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Highlights Bullet Checkpoints */}
                    <div className="space-y-2 pt-2 border-t border-[#D4AF37]/15">
                      {pkg.highlights.slice(0, 3).map((hl, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-stone-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{hl}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-6 pt-0 space-y-2.5">
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setDetailModalTab('fasilitas');
                    }}
                    className="w-full py-3 rounded-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#011E15] transition-all flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" /> Detail Fasilitas & Itinerary
                  </button>

                  <button
                    onClick={() => handleConsultation(pkg.name)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#011E15] text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Konsultasi & Booking Kuota
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Consultation Callout Banner */}
        <div className="bg-gradient-to-r from-[#012B1E] via-[#013827] to-[#012B1E] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-bold">
              Ingin Berkonsultasi Mengenai Program Haji 2026?
            </h3>
            <p className="text-stone-300 text-sm sm:text-base font-light">
              Tim konsultan haji profesional Golden Travel siap membimbing Anda dari pengecekan nomor porsi SISKOHAT, persyaratan visa Mujamalah/Furoda, hingga kesiapan fisik & ibadah.
            </p>
          </div>
          <button
            onClick={() => handleConsultation("Konsultasi Program Haji 2026")}
            className="px-8 py-4 rounded-2xl bg-[#D4AF37] text-[#011E15] font-bold text-sm sm:text-base hover:bg-amber-300 transition-all shadow-xl hover:scale-105 shrink-0 flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" /> Hubungi Pembimbing Haji
          </button>
        </div>

      </div>

      {/* Package Detail Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPackage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            {/* Modal Content Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#012B1E] border border-[#D4AF37] rounded-3xl overflow-hidden shadow-2xl z-10 my-8 text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#011E15] via-[#01251A] to-[#011E15] border-b border-[#D4AF37]/30 flex justify-between items-start gap-4 shrink-0">
                <div className="space-y-1">
                  <div className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold border border-[#D4AF37]/30">
                    {selectedPackage.categoryLabel}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-bold">{selectedPackage.name}</h3>
                  <p className="text-xs sm:text-sm text-stone-300 flex items-center gap-3">
                    <span>Durasi: <strong className="text-[#D4AF37]">{selectedPackage.duration}</strong></span>
                    <span>•</span>
                    <span>Visa: <strong className="text-emerald-300">{selectedPackage.visaType}</strong></span>
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="p-2 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs Header */}
              <div className="flex border-b border-[#D4AF37]/20 bg-[#011E15] px-6 shrink-0 overflow-x-auto">
                <button
                  onClick={() => setDetailModalTab('fasilitas')}
                  className={`py-3.5 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    detailModalTab === 'fasilitas'
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Fasilitas & Akomodasi
                </button>
                <button
                  onClick={() => setDetailModalTab('itinerary')}
                  className={`py-3.5 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    detailModalTab === 'itinerary'
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Jadwal & Itinerary
                </button>
                <button
                  onClick={() => setDetailModalTab('persyaratan')}
                  className={`py-3.5 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    detailModalTab === 'persyaratan'
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Persyaratan & Ketentuan
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                
                {detailModalTab === 'fasilitas' && (
                  <div className="space-y-6">
                    {/* Hotel & Tent Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#011E15] p-5 rounded-2xl border border-[#D4AF37]/20 space-y-2">
                        <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                          <Hotel className="w-5 h-5" /> Hotel Makkah
                        </div>
                        <div className="text-lg font-bold text-white font-serif">{selectedPackage.hotelMakkah}</div>
                        <div className="text-xs text-stone-300 flex items-center gap-2">
                          <span className="flex text-amber-400">{'★'.repeat(selectedPackage.hotelMakkahStars)}</span>
                          <span>({selectedPackage.hotelMakkahDistance})</span>
                        </div>
                      </div>

                      <div className="bg-[#011E15] p-5 rounded-2xl border border-[#D4AF37]/20 space-y-2">
                        <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                          <Hotel className="w-5 h-5" /> Hotel Madinah
                        </div>
                        <div className="text-lg font-bold text-white font-serif">{selectedPackage.hotelMadinah}</div>
                        <div className="text-xs text-stone-300 flex items-center gap-2">
                          <span className="flex text-amber-400">{'★'.repeat(selectedPackage.hotelMadinahStars)}</span>
                          <span>({selectedPackage.hotelMadinahDistance})</span>
                        </div>
                      </div>

                      <div className="bg-[#011E15] p-5 rounded-2xl border border-[#D4AF37]/20 space-y-2 md:col-span-2">
                        <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                          <Tent className="w-5 h-5" /> Fasilitas Tenda Arafah & Mina (Armuzna)
                        </div>
                        <div className="text-base font-bold text-white font-serif">{selectedPackage.tentMinaArafah}</div>
                        <div className="text-xs text-stone-300">
                          Dilengkapi dengan pendingin udara (AC), karpet tebal, sofa bed lipat, katering menu Indonesia 3x sehari, dan toilet khusus maktab.
                        </div>
                      </div>
                    </div>

                    {/* Includes & Excludes List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-3">
                        <h4 className="font-serif text-base text-[#D4AF37] font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Fasilitas Termasuk (Include)
                        </h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-stone-200">
                          {selectedPackage.includes.map((inc, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#D4AF37]">•</span> {inc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-serif text-base text-amber-400 font-bold flex items-center gap-2">
                          <Info className="w-5 h-5 text-amber-400" /> Belum Termasuk (Exclude)
                        </h4>
                        <ul className="space-y-2 text-xs sm:text-sm text-stone-300">
                          {selectedPackage.excludes.map((exc, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-400">•</span> {exc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {detailModalTab === 'itinerary' && (
                  <div className="space-y-4">
                    <div className="text-xs text-stone-300 mb-2">
                      *Jadwal dan susunan acara bersifat fleksibel menyesuaikan dengan regulasi penerbangan dan kondisi lapangan di Arab Saudi.
                    </div>

                    <div className="space-y-3">
                      {selectedPackage.itinerary.map((item, idx) => (
                        <div key={idx} className="bg-[#011E15] p-4 rounded-2xl border border-[#D4AF37]/20 flex gap-4">
                          <div className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold shrink-0 h-fit">
                            {item.day}
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-serif text-sm font-bold text-white">{item.title}</h5>
                            <p className="text-xs text-stone-300 font-light leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailModalTab === 'persyaratan' && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-[#D4AF37] font-bold">Dokumen & Ketentuan Pendaftaran Haji</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPackage.requirements.map((req, i) => (
                        <div key={i} className="bg-[#011E15] p-4 rounded-2xl border border-[#D4AF37]/20 flex items-center gap-3 text-xs sm:text-sm text-stone-200">
                          <FileText className="w-5 h-5 text-[#D4AF37] shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Action */}
              <div className="p-6 bg-[#011E15] border-t border-[#D4AF37]/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                  <div className="text-xs text-stone-400">DP Pendaftaran</div>
                  <div className="font-serif text-xl font-bold text-[#D4AF37]">{selectedPackage.dpAmount}</div>
                </div>

                <button
                  onClick={() => handleConsultation(selectedPackage.name)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#D4AF37] text-[#011E15] font-bold text-sm hover:bg-amber-300 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Minta Kuota & Pendaftaran VIA WA
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
