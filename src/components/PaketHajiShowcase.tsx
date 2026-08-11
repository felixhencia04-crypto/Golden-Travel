import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  Calendar, 
  Hotel, 
  Plane, 
  MessageCircle, 
  ChevronRight, 
  ChevronLeft,
  Pause,
  Play,
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
    dpAmount: 'Rp 50.000.000 / pax',
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
      'Membayar Uang Muka (DP) Rp 50.000.000 / pax'
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
    dpAmount: 'Rp 40.000.000 / pax',
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
      'Penyelenggara Berizin Resmi Kementerian Agama RI',
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
      'Setoran Awal Porsi Kuota Haji Khusus Rp 40.000.000'
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
    dpAmount: 'Rp 50.000.000 / pax',
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
      'DP Pembayaran Rp 50.000.000 / pax'
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

  const [packages, setPackages] = useState<HajiPackage[]>(DEFAULT_HAJI_PACKAGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${baseUrl}/api/packages`);
        if (response.ok) {
          const data = await response.json();
          const hajiPackages = data.filter((p: any) => p.type?.toLowerCase() === 'haji');
          if (hajiPackages.length > 0) {
             const mapped = hajiPackages.map((p: any) => {
                const hotels = (p.hotel || '').split(',').map((s: string) => s.trim());
                const hMakkah = hotels[0] || 'Hotel Pilihan Makkah';
                const hMadinah = hotels[1] || 'Hotel Pilihan Madinah';
                
                return {
                id: p.id,
                name: p.name,
                category: (p.type === 'haji' ? 'khusus' : 'reguler') as any,
                categoryLabel: p.type === 'haji' ? 'Haji' : 'Umrah',
                duration: p.duration || '9 Hari',
                price: Number(p.price) || 0,
                priceUsd: Math.round((Number(p.price) || 0) / 16000),
                priceIdrApprox: (Number(p.price) || 0).toLocaleString('id-ID'),
                waitingTime: 'Langsung Berangkat',
                visaType: 'Visa Haji Mujamalah',
                isPopular: false,
                isBestSeller: false,
                dpAmount: 'DP Rp 5.000.000',
                imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                airline: 'Saudia Airlines',
                hotelMakkah: hMakkah,
                hotelMakkahStars: 5,
                hotelMakkahDistance: '±100m',
                hotelMadinah: hMadinah,
                hotelMadinahStars: 5,
                hotelMadinahDistance: '±100m',
                departureSchedule: p.departureDate ? new Date(p.departureDate).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'}) : 'Lihat Jadwal',
                seatsLeft: p.remainingSeats ?? (p.quota || 45),
                highlights: (p.facilities || '').split(',').map((f:string)=>f.trim()).filter(Boolean),
                includes: Array.isArray(p.description) ? p.description : [],
                excludes: (() => {
                  try {
                    return Array.isArray(p.excludes) ? p.excludes : (typeof p.excludes === 'string' ? JSON.parse(p.excludes || '[]') : ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi']);
                  } catch(e) {
                    return ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi'];
                  }
                })(),
                itinerary: (() => {
                  try {
                    return Array.isArray(p.itinerary) ? p.itinerary : (typeof p.itinerary === 'string' ? JSON.parse(p.itinerary || '[]') : []);
                  } catch(e) {
                    return [];
                  }
                })(),
                requirements: (() => {
                  try {
                    const parsed = Array.isArray(p.requirements) ? p.requirements : (typeof p.requirements === 'string' ? JSON.parse(p.requirements) : null);
                    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['Paspor Asli (Masa berlaku minimal 8 bulan)', 'Fotokopi KTP & Kartu Keluarga (KK)', 'Fotokopi Akta Kelahiran / Surat Nikah', 'Pas Foto berwarna dengan latar belakang putih', 'Sertifikat Vaksin Meningitis (Asli)'];
                  } catch(e) {
                    return ['Paspor Asli (Masa berlaku minimal 8 bulan)', 'Fotokopi KTP & Kartu Keluarga (KK)', 'Fotokopi Akta Kelahiran / Surat Nikah', 'Pas Foto berwarna dengan latar belakang putih', 'Sertifikat Vaksin Meningitis (Asli)'];
                  }
                })(),
                tentMinaArafah: p.tentMinaArafah || 'Tenda Maktab Standar (Mina & Arafah)'
             } as HajiPackage;
             });
             setPackages(mapped);
          }
        } else {
          setIsError(true);
        }
      } catch (error) {
        console.error('Failed to fetch packages', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackages();
    
    try {
      const channel = new BroadcastChannel('golden_travel_updates');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CATALOG_UPDATED') {
          fetchPackages();
        }
      };
      return () => channel.close();
    } catch(e) {}
  }, []);

  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedPackage, setSelectedPackage] = useState<HajiPackage | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'fasilitas' | 'itinerary' | 'persyaratan'>('fasilitas');

  // Carousel Slider States
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const filteredPackages = packages.filter((pkg) => {
    if (activeTab === 'semua') return true;
    return pkg.category === activeTab;
  });

  // Handle Tab Switch & Reset Slider Position
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setActiveIndex(0);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Scroll Prev / Next Handlers
  const scrollPrev = () => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.firstElementChild?.clientWidth || 380;
    sliderRef.current.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.firstElementChild?.clientWidth || 380;
    const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
    if (sliderRef.current.scrollLeft >= maxScroll - 15) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      sliderRef.current.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
    }
  };

  const scrollToCard = (index: number) => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.firstElementChild?.clientWidth || 380;
    sliderRef.current.scrollTo({ left: index * (cardWidth + 24), behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const cardWidth = (sliderRef.current.firstElementChild?.clientWidth || 380) + 24;
    const scrollPos = sliderRef.current.scrollLeft;
    const idx = Math.round(scrollPos / cardWidth);
    if (idx >= 0 && idx < filteredPackages.length) {
      setActiveIndex(idx);
    }
  };

  // Auto-slide effect every 4.5s
  useEffect(() => {
    if (!isAutoplay || isHovered || filteredPackages.length <= 1) return;
    const timer = setInterval(() => {
      scrollNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoplay, isHovered, filteredPackages.length]);

  const handleConsultation = (pkgName: string) => {
    const text = encodeURIComponent(
      `Assalamu'alaikum Admin Golden Travel. Saya berminat dengan informasi pendaftaran ${pkgName}. Mohon info kuota, jadwal manasik, dan rincian pendaftarannya.`
    );
    window.open(`https://wa.me/6282283201103?text=${text}`, '_blank');
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

      <div className="relative z-10 max-w-7xl mx-auto space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 border-b border-[#D4AF37]/20 pb-8 sm:pb-12">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Program Haji Khusus & Furoda Resmi
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Pilihan Perjalanan <span className="text-[#D4AF37]">Ibadah Haji Mabrur</span>
            </h2>
            <p className="text-stone-300 text-sm sm:text-base md:text-lg font-light leading-relaxed">
              Tunaikan Rukun Islam kelima dengan kepastian visa resmi, bimbingan syariat intensif, dan kenyamanan akomodasi Bintang 5 di Makkah, Madinah, serta Tenda Maktab VIP Armuzna.
            </p>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {[
            { id: 'semua', label: 'Semua Program Haji' },
            { id: 'furoda', label: 'Haji Furoda (Tanpa Antre)' },
            { id: 'khusus', label: 'Haji Khusus / ONH Plus' },
            { id: 'plus_turki', label: 'Furoda + Transit Turki' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 shadow-md ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#011E15] shadow-[#D4AF37]/30 scale-105 border border-[#F3E5AB]'
                  : 'bg-[#022A1F]/80 text-stone-300 hover:text-white hover:bg-[#023829] border border-[#D4AF37]/30 backdrop-blur-md'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Carousel Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-2 pb-1 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#022A1F]/90 border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F3E5AB]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Paket Haji {activeIndex + 1} dari {filteredPackages.length}</span>
            </div>

            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                isAutoplay 
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]' 
                  : 'bg-[#011E15] border-stone-600 text-stone-400 hover:text-stone-200'
              }`}
            >
              {isAutoplay ? <Pause className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAutoplay ? 'Auto-Slide Aktif' : 'Auto-Slide Jeda'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollPrev}
              className="w-11 h-11 rounded-2xl bg-[#022A1F]/90 border border-[#D4AF37]/50 text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#011E15] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg group"
              aria-label="Paket Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              {filteredPackages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToCard(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeIndex === idx
                      ? 'w-7 bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                      : 'w-2.5 bg-[#023829] hover:bg-[#D4AF37]/50'
                  }`}
                  aria-label={`Ke paket haji ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              className="w-11 h-11 rounded-2xl bg-[#022A1F]/90 border border-[#D4AF37]/50 text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#011E15] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg group"
              aria-label="Paket Selanjutnya"
            >
              <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#D4AF37]">
            <div className="animate-spin w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full mb-4"></div>
            <p className="text-[#F3E5AB] text-lg font-medium">Memuat paket haji...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-bold text-[#F3E5AB] mb-2">Gagal Terhubung ke Server</h3>
            <p className="text-[#D4AF37]/80 max-w-md">Mohon maaf, kami tidak dapat mengambil data paket saat ini. Silakan periksa koneksi Anda atau coba lagi nanti.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 bg-[#D4AF37] hover:bg-[#B8860B] text-[#011E15] font-bold rounded-full transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* Horizontal Slider Track Container */}
            <div className="relative group/carousel">
              {/* Side Floating Controls for Desktop */}
          <button
            onClick={scrollPrev}
            className="hidden xl:flex absolute left-[-24px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#011E15]/95 border-2 border-[#D4AF37] text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#011E15] transition-all items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={scrollNext}
            className="hidden xl:flex absolute right-[-24px] top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#011E15]/95 border-2 border-[#D4AF37] text-[#F3E5AB] hover:bg-[#D4AF37] hover:text-[#011E15] transition-all items-center justify-center shadow-2xl backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Horizontal Track */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth py-4 px-1"
          >
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="w-[88vw] sm:w-[420px] lg:w-[460px] xl:w-[480px] shrink-0 snap-start bg-[#022A1F]/85 border-2 border-[#D4AF37]/50 hover:border-[#D4AF37] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_rgba(212,175,55,0.25)] transition-all duration-500 flex flex-col justify-between relative group backdrop-blur-md"
              >
                {/* Metallic Gold Header Accent */}
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] w-full"></div>

                <div>
                  {/* Image & Top Badges */}
                  <div className="relative h-60 sm:h-64 overflow-hidden">
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#022A1F] via-[#022A1F]/20 to-transparent"></div>

                    {/* Category Label */}
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#F3E5AB] text-[#011E15] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#011E15]" />
                      <span>{pkg.categoryLabel}</span>
                    </div>

                    {/* Waiting Time Badge */}
                    <div className="absolute top-4 right-4 bg-[#011E15]/90 border border-[#D4AF37] text-[#F3E5AB] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md">
                      {pkg.waitingTime}
                    </div>

                    {/* Airline Banner */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 bg-[#011E15]/80 backdrop-blur-md p-2 rounded-xl border border-[#D4AF37]/30 text-stone-200 text-xs font-medium">
                      <Plane className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{pkg.airline}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7 space-y-5">
                    
                    {/* Title & Price */}
                    <div>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-white mb-2 leading-snug group-hover:text-[#F3E5AB] transition-colors line-clamp-2">
                        {pkg.name}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
                            Rp {pkg.priceIdrApprox}
                          </span>
                          <span className="text-stone-300 text-xs">/ pax</span>
                        </div>
                      </div>
                    </div>

                    {/* Visa & Tent Badges */}
                    <div className="space-y-2 text-xs">
                      <div className="bg-[#011E15]/80 p-2.5 rounded-xl border border-[#D4AF37]/30 flex items-center gap-2 text-stone-200">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span className="truncate font-semibold">{pkg.visaType}</span>
                      </div>

                      <div className="bg-[#011E15]/80 p-2.5 rounded-xl border border-[#D4AF37]/30 flex items-center gap-2 text-stone-200">
                        <Tent className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span className="truncate font-semibold">{pkg.tentMinaArafah}</span>
                      </div>
                    </div>

                    {/* Hotel Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#021811]/70 p-3 rounded-xl border border-[#D4AF37]/25 space-y-1">
                        <div className="flex items-center justify-between text-[#D4AF37] font-semibold">
                          <span className="flex items-center gap-1"><Hotel className="w-3.5 h-3.5" /> Makkah</span>
                          <span className="flex items-center gap-0.5 text-[10px]">
                            {Array.from({ length: pkg.hotelMakkahStars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                            ))}
                          </span>
                        </div>
                        <div className="font-bold text-white truncate">{pkg.hotelMakkah}</div>
                        <div className="text-[11px] text-stone-300 font-light truncate">{pkg.hotelMakkahDistance}</div>
                      </div>

                      <div className="bg-[#021811]/70 p-3 rounded-xl border border-[#D4AF37]/25 space-y-1">
                        <div className="flex items-center justify-between text-[#D4AF37] font-semibold">
                          <span className="flex items-center gap-1"><Hotel className="w-3.5 h-3.5" /> Madinah</span>
                          <span className="flex items-center gap-0.5 text-[10px]">
                            {Array.from({ length: pkg.hotelMadinahStars }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                            ))}
                          </span>
                        </div>
                        <div className="font-bold text-white truncate">{pkg.hotelMadinah}</div>
                        <div className="text-[11px] text-stone-300 font-light truncate">{pkg.hotelMadinahDistance}</div>
                      </div>
                    </div>

                    {/* Highlights Bullet List */}
                    <div className="space-y-2 pt-2 border-t border-[#D4AF37]/20">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                        <span>Fasilitas Keunggulan Haji:</span>
                      </div>
                      {pkg.highlights.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-stone-100 font-medium">
                          <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#F3E5AB]">
                            <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-tight line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setDetailModalTab('fasilitas');
                      }}
                      className="w-full py-3 px-3 rounded-xl border border-[#D4AF37] bg-[#011E15]/90 hover:bg-[#D4AF37]/15 text-[#F3E5AB] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Info className="w-4 h-4 text-[#D4AF37]" />
                      <span>Detail Program</span>
                    </button>

                    <button
                      onClick={() => handleConsultation(pkg.name)}
                      className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#EEDCA2] to-[#B8860B] hover:brightness-110 text-[#011E15] text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4 fill-[#011E15]" />
                      <span>Konsultasi WA</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
        </>
        )}

        {/* Guarantee Banner */}
        <div className="bg-gradient-to-r from-[#022A1F] via-[#043d2d] to-[#022A1F] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-[#011E15] border border-[#D4AF37] flex items-center justify-center shrink-0 shadow-lg text-[#D4AF37]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-white">Ingin Konsultasi Kuota Haji Porsi Resmi Kemenag atau Haji Furoda?</h4>
              <p className="text-xs sm:text-sm text-stone-200 font-light">Pembimbing manasik & konsultan haji Golden Travel siap memberikan penjelasan transparan mengenai prosedur pendaftaran dan keberangkatan.</p>
            </div>
          </div>

          <button
            onClick={() => handleConsultation('Program Haji Golden Travel')}
            className="px-6 py-3.5 rounded-xl bg-[#D4AF37] text-[#011E15] text-xs sm:text-sm font-extrabold hover:bg-[#F3E5AB] transition-all shrink-0 shadow-lg flex items-center gap-2"
          >
            <span>Hubungi Konsultan Haji</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPackage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#012519] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden z-10 my-8 text-white max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#022A1F] via-[#043a2b] to-[#022A1F] border-b border-[#D4AF37]/30 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3E5AB] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    {selectedPackage.categoryLabel} • {selectedPackage.duration}
                  </div>
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                    {selectedPackage.name}
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold text-[#F3E5AB] mt-1 font-serif">
                    Rp {selectedPackage.priceIdrApprox}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPackage(null)}
                  className="w-10 h-10 rounded-full bg-[#011E15] border border-[#D4AF37]/50 text-stone-300 hover:text-white hover:bg-[#D4AF37] hover:text-[#011E15] transition-all flex items-center justify-center shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#D4AF37]/25 bg-[#011E15]">
                <button
                  onClick={() => setDetailModalTab('fasilitas')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    detailModalTab === 'fasilitas'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Hotel className="w-4 h-4" />
                  <span>Fasilitas & Hotel</span>
                </button>

                <button
                  onClick={() => setDetailModalTab('itinerary')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    detailModalTab === 'itinerary'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Itinerary Haji</span>
                </button>

                <button
                  onClick={() => setDetailModalTab('persyaratan')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    detailModalTab === 'persyaratan'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Syarat & Prosedur</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                
                {detailModalTab === 'fasilitas' && (
                  <div className="space-y-6">
                    {/* Hotel Specs */}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                        <Hotel className="w-4 h-4" />
                        <span>Akomodasi Hotel Bintang 5 & Tenda Armuzna</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
                          <div className="flex items-center justify-between text-[#F3E5AB]">
                            <span className="font-bold text-sm">Hotel Makkah Al-Mukarramah</span>
                            <div className="flex text-[#D4AF37]">
                              {Array.from({ length: selectedPackage.hotelMakkahStars }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <div className="text-white font-bold text-base">{selectedPackage.hotelMakkah}</div>
                          <p className="text-xs text-stone-300 font-light">{selectedPackage.hotelMakkahDistance}</p>
                        </div>

                        <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
                          <div className="flex items-center justify-between text-[#F3E5AB]">
                            <span className="font-bold text-sm">Hotel Madinah Al-Munawwarah</span>
                            <div className="flex text-[#D4AF37]">
                              {Array.from({ length: selectedPackage.hotelMadinahStars }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <div className="text-white font-bold text-base">{selectedPackage.hotelMadinah}</div>
                          <p className="text-xs text-stone-300 font-light">{selectedPackage.hotelMadinahDistance}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
                      <div className="text-[#F3E5AB] font-bold text-sm flex items-center gap-2">
                        <Tent className="w-4 h-4 text-[#D4AF37]" />
                        <span>Tenda Maktab Arafah & Mina</span>
                      </div>
                      <div className="text-white font-bold text-base">{selectedPackage.tentMinaArafah}</div>
                    </div>

                    {/* Includes & Excludes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="bg-[#022A1F]/70 p-5 rounded-2xl border border-[#D4AF37]/30 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#F3E5AB] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          <span>Fasilitas Termasuk (Included):</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-stone-200">
                          {selectedPackage.includes.map((inc, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">•</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-[#022A1F]/70 p-5 rounded-2xl border border-stone-700/50 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                          <X className="w-4 h-4 text-red-400" />
                          <span>Belum Termasuk (Excluded):</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-stone-300">
                          {selectedPackage.excludes.map((exc, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-400 font-bold">•</span>
                              <span>{exc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itinerary */}
                {detailModalTab === 'itinerary' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Rangkaian Perjalanan Haji ({selectedPackage.duration})</span>
                    </h4>

                    <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4AF37]/30">
                      {selectedPackage.itinerary.map((item, idx) => (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-1.5 top-1.5 w-5 h-5 rounded-full bg-[#D4AF37] text-[#011E15] font-black text-[9px] flex items-center justify-center ring-4 ring-[#012519]">
                            {idx + 1}
                          </div>
                          <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/25 space-y-1">
                            <div className="font-serif font-bold text-sm text-[#F3E5AB]">
                              Hari {item.day}: {item.title}
                            </div>
                            <p className="text-xs text-stone-200 font-light leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {detailModalTab === 'persyaratan' && (
                  <div className="space-y-6">
                    <div className="bg-[#022A1F] p-5 rounded-2xl border border-[#D4AF37]/30 space-y-3">
                      <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#D4AF37]" />
                        <span>Dokumen & Syarat Pendaftaran Haji</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-stone-200">
                        {selectedPackage.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#D4AF37] font-bold">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#022A1F] p-5 rounded-2xl border border-[#D4AF37]/30 space-y-3">
                      <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Sistem Pembayaran & Ketentuan Setoran DP</span>
                      </h4>
                      <div className="space-y-2 text-xs text-stone-200">
                        <p>• <strong>DP Perlengkapan:</strong> Rp 1.500.000</p>
                        <p>• <strong>DP Booking Seat:</strong> Rp 10.000.000 saat pendaftaran.</p>
                        <p>• <strong>Pelunasan:</strong> Dilakukan saat penerbitan Visa Haji resmi oleh Kerajaan Arab Saudi.</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-[#022A1F] border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-300">Biaya Investasi Haji:</div>
                  <div className="font-serif font-bold text-2xl text-[#F3E5AB]">
                    Rp {selectedPackage.priceIdrApprox}
                  </div>
                </div>

                <button
                  onClick={() => handleConsultation(selectedPackage.name)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#EEDCA2] to-[#B8860B] text-[#011E15] text-xs sm:text-sm font-extrabold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <MessageCircle className="w-4 h-4 fill-[#011E15]" />
                  <span>Konsultasi & Pendaftaran WA</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
