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
  ArrowRight
} from 'lucide-react';
import { PAKET_UMRAH_BG_DATA } from '../assets/paketUmrahBgData';

export interface UmrahPackage {
  id: string;
  name: string;
  category: 'ekonomis' | 'reguler' | 'vip' | 'plus' | 'ramadhan';
  categoryLabel: string;
  duration: string;
  price: number;
  dpAmount: string;
  priceLabel?: string;
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
  departureSchedule: string;
  seatsLeft: number;
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: { day: number; title: string; description: string }[];
}

const DEFAULT_UMRAH_PACKAGES: UmrahPackage[] = [
  {
    id: 'pkg-mina-hemat',
    name: 'Paket Mina (Umrah Bintang 3 - 9 Hari)',
    category: 'ekonomis',
    categoryLabel: 'Hemat Bintang 3',
    duration: '9 Hari',
    price: 24500000,
    dpAmount: 'Rp 5.000.000',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
    airline: 'Lion Air / Saudia Airlines (Transit/Direct)',
    hotelMakkah: 'Olayan / Fajr Al Badea',
    hotelMakkahStars: 3,
    hotelMakkahDistance: '± 500m - 700m dari Masjidil Haram',
    hotelMadinah: 'Concorde Dar Al Khair / Jawharat Al Rasheed',
    hotelMadinahStars: 3,
    hotelMadinahDistance: '± 300m - 500m dari Masjid Nabawi',
    departureDate: '15 September 2024',
    totalSeats: 45,
    seatsLeft: 12,
    highlights: [
      'Harga Terjangkau & Hemat',
      'Fasilitas Nyaman Bintang 3',
      'Mutawwif Berpengalaman',
      'Bimbingan Manasik Intensif'
    ],
    includes: [
      'Tiket Pesawat Kelas Ekonomi PP',
      'Visa Umrah',
      'Hotel Bintang 3 Makkah & Madinah',
      'Makan 3x Sehari (Menu Indonesia)',
      'Transportasi Bus Full AC',
      'Muthawwif / Pembimbing Ibadah',
      'Air Zam-zam 5 Liter (Sesuai Aturan Maskapai)'
    ],
    excludes: [
      'Pembuatan Paspor',
      'Vaksin Meningitis',
      'Pengeluaran Pribadi',
      'Kelebihan Bagasi (Overweight)'
    ],
    itinerary: [
      { day: 1, title: 'Keberangkatan Jakarta - Jeddah', description: 'Kumpul di bandara dan penerbangan menuju Jeddah.' },
      { day: 2, title: 'Jeddah - Madinah', description: 'Tiba di Jeddah, melanjutkan perjalanan ke Madinah, check-in hotel dan istirahat.' },
      { day: 3, title: 'Ziarah Madinah', description: 'Ziarah ke Makam Rasulullah SAW, Raudhah, dan pemakaman Baqi.' },
      { day: 4, title: 'Ziarah Kota Madinah', description: 'City tour Madinah mengunjungi Masjid Quba, Masjid Qiblatain, Jabal Uhud, dan Kebun Kurma.' },
      { day: 5, title: 'Madinah - Makkah (Umrah Pertama)', description: 'Persiapan ihram di miqat Bir Ali, perjalanan menuju Makkah, check-in hotel dan pelaksanaan Umrah pertama.' },
      { day: 6, title: 'Memperbanyak Ibadah di Masjidil Haram', description: 'Acara bebas memperbanyak ibadah wajib dan sunnah di Masjidil Haram.' },
      { day: 7, title: 'Ziarah Kota Makkah (Umrah Kedua)', description: 'Ziarah Makkah mengunjungi Jabal Tsur, Padang Arafah, Jabal Rahmah, Muzdalifah, Mina, dan Jabal Nur. Miqat di Ji\'ranah untuk Umrah kedua.' },
      { day: 8, title: 'Makkah - Jeddah - Kepulangan', description: 'Tawaf Wada\', perjalanan menuju Jeddah, city tour Jeddah, dan penerbangan kembali ke Jakarta.' },
      { day: 9, title: 'Tiba di Tanah Air', description: 'Tiba di Bandara Internasional Soekarno Hatta, program umrah selesai.' }
    ]
  },
  {
    id: 'pkg-safa-reguler',
    name: 'Paket Safa (Umrah Reguler 9 Hari)',
    category: 'reguler',
    categoryLabel: 'Reguler Bintang 4',
    duration: '9 Hari',
    price: 28500000,
    dpAmount: 'Rp 5.000.000',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
    airline: 'Saudia Airlines / Garuda Indonesia (Direct)',
    hotelMakkah: 'Azka Al Safa / Le Meridian',
    hotelMakkahStars: 4,
    hotelMakkahDistance: '± 200m dari Masjidil Haram',
    hotelMadinah: 'Taiba Front / Grand Plaza',
    hotelMadinahStars: 4,
    hotelMadinahDistance: '± 100m dari Masjid Nabawi',
    departureSchedule: 'September - November 2026',
    seatsLeft: 6,
    highlights: [
      'Penerbangan Direct tanpa transit',
      'Hotel Ring 1 dekat pelataran masjid',
      'Kereta Cepat Haramain (Makkah - Madinah)',
      'Free Ziarah Kota Taif & Air Zamzam 5L'
    ],
    includes: [
      'Tiket Pesawat PP Economy Class',
      'Visa Umrah Resmi & Asuransi Perjalanan',
      'Akomodasi Hotel Bintang 4 Makkah & Madinah',
      'Makan 3x Sehari Menu Indonesia (Buffet)',
      'Kereta Cepat Haramain Express',
      'Transportasi Bus Full AC Executive',
      'Muthawwif / Pembimbing Bersertifikat',
      'Koper & Perlengkapan Eksklusif Golden Travel',
      'Air Zamzam 5 Liter (jika diizinkan)'
    ],
    excludes: [
      'Pembuatan Paspor & Tambah Nama',
      'Vaksinasi Meningitis',
      'Kebutuhan / Pengeluaran Pribadi (Laundry, Roaming)',
      'Biaya Kelebihan Bagasi'
    ],
    itinerary: [
      { day: 1, title: 'Keberangkatan Jakarta - Jeddah / Madinah', description: 'Berkumpul di Bandara Soekarno-Hatta, briefing, pembagian perlengkapan, dan terbang menuju Tanah Suci.' },
      { day: 2, title: 'Tiba di Madinah - Ziarah Raudhah & Masjid Nabawi', description: 'Check-in hotel Madinah, shalat di Masjid Nabawi, ziarah ke Raudhah & Makam Rasulullah SAW.' },
      { day: 3, title: 'Ziarah Kota Madinah', description: 'Mengunjungi Masjid Quba, Jabal Uhud, Masjid Qiblatain, dan Kebun Kurma.' },
      { day: 4, title: 'Madinah ke Makkah - Umrah Pertama', description: 'Mengambil Miqat di Bir Ali, perjalanan dengan Kereta Cepat Haramain ke Makkah, check-in hotel dan melaksanakan Ibadah Umrah 1 (Tawaf, Sa\'i, Tahallul).' },
      { day: 5, title: 'Memperbanyak Ibadah di Masjidil Haram', description: 'Shalat fardhu berjamaah, iktikaf, dan tawaf sunnah.' },
      { day: 6, title: 'Ziarah Kota Makkah & Umrah Kedua', description: 'Mengunjungi Jabal Thawr, Padang Arafah, Jabal Rahmah, Muzdalifah, Mina, dan Miqat di Ji\'ranah untuk Umrah 2.' },
      { day: 7, title: 'Wisata Religi Kota Taif', description: 'Perjalanan ke Kota Taif (Masjid Abdullah bin Abbas, Pabrik Parfum Mawar, Kereta Gantung Taif).' },
      { day: 8, title: 'Tawaf Wada\' & Kepulangan ke Indonesia', description: 'Melaksanakan Tawaf Wada\', check-out hotel, transfer ke Bandara Jeddah untuk kepulangan.' },
      { day: 9, title: 'Tiba di Jakarta', description: 'Tiba di Bandara Soekarno-Hatta dengan selamat. Semoga menjadi Umrah yang Mabrur.' }
    ]
  },
  {
    id: 'pkg-marwa-vip',
    name: 'Paket Marwa (Umrah VIP Executive 12 Hari)',
    category: 'vip',
    categoryLabel: 'VIP Executive Bintang 5',
    duration: '12 Hari',
    price: 35000000,
    dpAmount: 'Rp 5.000.000',
    isPopular: true,
    isBestSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=800&q=80',
    airline: 'Saudia Airlines Direct (Direct Flight)',
    hotelMakkah: 'Pullman ZamZam / Dar Al Eiman Royal',
    hotelMakkahStars: 5,
    hotelMakkahDistance: 'Pelataran Masjidil Haram (Clock Tower)',
    hotelMadinah: 'Anwar Movenpick / Frontel Al Harithia',
    hotelMadinahStars: 5,
    hotelMadinahDistance: 'Pelataran Masjid Nabawi',
    departureSchedule: 'Agustus, September & November 2026',
    seatsLeft: 3,
    highlights: [
      'Hotel Pelataran Masjid (Akses Langsung)',
      'Tiket Kereta Cepat Haramain VIP Class',
      'Muthawwif Senior Alumni Universitas Madinah',
      'Free City Tour Taif & Cable Car'
    ],
    includes: [
      'Tiket Pesawat Direct Flight Saudia Airlines PP',
      'Akomodasi Hotel Bintang 5 Pelataran Makkah & Madinah',
      'Visa Umrah VIP & Asuransi Kesehatan',
      'Menu Internasional & Indonesia Buffet Bintang 5',
      'Kereta Cepat Haramain Express VIP Class',
      'Handling Airport & Hotel VIP Fast Track',
      'Sertifikat Umrah Resmi Golden Travel',
      'Perlengkapan Executive (Koper Fiber Hardcase, Kain Ihram/Mukena Premium, Batik, Tas Paspor)',
      'Air Zamzam 5 Liter'
    ],
    excludes: [
      'Pembuatan / Perpanjangan Paspor',
      'Suntik Meningitis',
      'Kebutuhan Pribadi & Kelebihan Bagasi'
    ],
    itinerary: [
      { day: 1, title: 'Jakarta - Jeddah / Madinah Direct', description: 'Keberangkatan dengan Saudia Airlines Direct Flight, pelayanan Lounge VIP sebelum departure.' },
      { day: 2, title: 'Tiba di Madinah - Check-in Hotel Pelataran Nabawi', description: 'Penyambutan VIP di Bandara, transfer bus executive ke Anwar Movenpick, shalat di Nabawi.' },
      { day: 3, title: 'Ziarah Raudhah & Kota Madinah', description: 'Ibadah di Raudhah Mubarakah dengan tasrih resmi, ziarah Quba & Uhud.' },
      { day: 4, title: 'Santai & Ibadah di Masjid Nabawi', description: 'Hari khusus memperbanyak shalat, selawat, dan doa di Masjid Nabawi.' },
      { day: 5, title: 'Madinah ke Makkah via Kereta Cepat VIP', description: 'Perjalanan Kereta Cepat Haramain VIP Class. Check-in Pullman ZamZam, Umrah 1.' },
      { day: 6, title: 'Ibadah Khusyuk di Masjidil Haram', description: 'Iktikaf dan Tawaf Sunnah di pelataran Ka\'bah.' },
      { day: 7, title: 'Ziarah Makkah Al-Mukarramah', description: 'City tour Arafah, Muzdalifah, Mina, Jabal Rahmah, Miqat Ji\'ranah.' },
      { day: 8, title: 'Wisata Eksekutif Kota Taif', description: 'Kunjungan lengkap Taif, naik kereta gantung, makan siang kuliner lokal khas Taif.' },
      { day: 9, title: 'Ibadah Mandiri & Kuliner Makkah', description: 'Acara bebas untuk memperbanyak ibadah dan belanja oleh-oleh.' },
      { day: 10, title: 'Umrah Ketiga & Ziarah Hudaibiyah', description: 'Miqat Hudaibiyah, wisata museum Al-Amoudi, dan Ibadah Umrah 3.' },
      { day: 11, title: 'Tawaf Wada\' & Kepulangan', description: 'Tawaf perpisahan, transfer ke Bandara Jeddah VIP Lounge, penerbangan ke Jakarta.' },
      { day: 12, title: 'Tiba di Jakarta', description: 'Mendarat di Bandara Soekarno-Hatta. Semoga ibadah diterima dan Mabrur.' }
    ]
  },
  {
    id: 'pkg-zamzam-turki',
    name: 'Paket Zamzam (Umrah Plus Turki 12 Hari)',
    category: 'plus',
    categoryLabel: 'Umrah Plus Wisata Turki',
    duration: '12 Hari',
    price: 42500000,
    dpAmount: 'Rp 7.500.000',
    isPopular: true,
    imageUrl: 'https://images.unsplash.com/photo-1527838832700-54595d978669?auto=format&fit=crop&w=800&q=80',
    airline: 'Turkish Airlines / Saudia Airlines',
    hotelMakkah: 'Makkah Tower / Swissotel',
    hotelMakkahStars: 5,
    hotelMakkahDistance: 'Pelataran Masjidil Haram',
    hotelMadinah: 'Pullman Zamzam Madinah',
    hotelMadinahStars: 5,
    hotelMadinahDistance: '± 50m dari Masjid Nabawi',
    departureSchedule: 'Oktober & Desember 2026',
    seatsLeft: 5,
    highlights: [
      'Ibadah Umrah + Jelajah Istanbul & Bursa',
      'Cruising Selat Bosphorus & Hagia Sophia',
      'Naik Cable Car di Uludag Mountain Bursa',
      'Hotel Bintang 5 Makkah, Madinah & Istanbul'
    ],
    includes: [
      'Tiket Pesawat International Full Service PP',
      'Visa Umrah + Visa Turki Single Entry',
      'Akomodasi Hotel Bintang 5 Makkah, Madinah & Turki',
      'Makan Penuh (Buffet Indonesia di Saudi + Culinary Turki)',
      'Bosphorus Private Cruise in Istanbul',
      'Tiket Masuk Objek Wisata Turki (Hagia Sophia, Topkapi, Grand Bazaar)',
      'Tour Guide Berbahasa Indonesia di Turki + Muthawwif Saudi',
      'Perlengkapan Umrah Plus Eksklusif',
      'Air Zamzam 5 Liter'
    ],
    excludes: [
      'Paspor & Vaksin Meningitis',
      'Pengeluaran Pribadi & Tipping Guide'
    ],
    itinerary: [
      { day: 1, title: 'Jakarta - Istanbul (Turki)', description: 'Penerbangan menuju Istanbul, penerimaan visa & transfer ke hotel.' },
      { day: 2, title: 'Istanbul Tour - Hagia Sophia & Bosphorus Cruise', description: 'Mengunjungi Blue Mosque, Hagia Sophia, Hippodrome, dan private Bosphorus Cruise.' },
      { day: 3, title: 'Istanbul ke Bursa - Gunung Uludag & Grand Bazaar', description: 'Wisata ke Kota Bursa, naik cable car di Gunung Uludag, belanja sutra di Koza Han & Grand Bazaar.' },
      { day: 4, title: 'Istanbul ke Madinah', description: 'Penerbangan dari Istanbul ke Madinah, check-in hotel Pullman Zamzam Madinah.' },
      { day: 5, title: 'Ziarah Raudhah & Kota Madinah', description: 'Shalat di Masjid Nabawi, ziarah Raudhah, Masjid Quba, Jabal Uhud.' },
      { day: 6, title: 'Madinah ke Makkah - Umrah Pertama', description: 'Miqat di Bir Ali, perjalanan dengan Kereta Cepat ke Makkah, Ibadah Umrah 1.' },
      { day: 7, title: 'Memperbanyak Ibadah di Makkah', description: 'Iktikaf di Masjidil Haram, shalat berjamaah, tawaf sunnah.' },
      { day: 8, title: 'Ziarah Makkah & City Tour', description: 'Arafah, Muzdalifah, Mina, Jabal Rahmah, Miqat Ji\'ranah untuk Umrah 2.' },
      { day: 9, title: 'Wisata Sejarah Kota Taif', description: 'City tour Taif, pabrik minyak mawar, wisata kuliner.' },
      { day: 10, title: 'Ibadah Mandiri & Shopping Tour', description: 'Acara bebas di Makkah Clock Tower Mall.' },
      { day: 11, title: 'Tawaf Wada\' & Kepulangan', description: 'Tawaf Wada\', transfer ke Bandara Jeddah untuk penerbangan kembali ke Jakarta.' },
      { day: 12, title: 'Tiba di Jakarta', description: 'Tiba di Indonesia dengan kenangan manis ibadah & wisata syariah.' }
    ]
  },
  {
    id: 'pkg-rawdah-ramadhan',
    name: 'Paket Rawdah (Umrah Ramadhan 14 Hari)',
    category: 'ramadhan',
    categoryLabel: 'Spesial Ramadhan & Lailatul Qadr',
    duration: '14 Hari',
    price: 48000000,
    dpAmount: 'Rp 10.000.000',
    isPopular: true,
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
    airline: 'Saudia Airlines (Direct Flight)',
    hotelMakkah: 'Clock Tower Fairmont / Raffles Makkah',
    hotelMakkahStars: 5,
    hotelMakkahDistance: 'Pelataran Utama Masjidil Haram',
    hotelMadinah: 'Dar Al Taqwa / Movenpick',
    hotelMadinahStars: 5,
    hotelMadinahDistance: 'Pelataran Utama Masjid Nabawi',
    departureSchedule: 'Maret / April 2027 (Ramadhan 1447H)',
    seatsLeft: 4,
    highlights: [
      'Meraih Keberkahan Ramadhan & Lailatul Qadr di Haramain',
      'Prasmanan Bintang 5 untuk Sahur & Buka Puasa',
      'Iktikaf Khusyuk dengan Bimbingan Syariah Intensif',
      'View Ka\'bah Langsung dari Hotel Clock Tower'
    ],
    includes: [
      'Tiket Direct Flight Saudia Airlines PP',
      'Akomodasi Bintang 5 Fairmont / Raffles Clock Tower',
      'Visa Umrah Ramadhan & Asuransi Kesehatan',
      'Menu Buka Puasa & Sahur Buffet Bintang 5 Spesial Ramadhan',
      'Kereta Cepat Haramain Express VIP Class',
      'Bimbingan Iktikaf Lailatul Qadr oleh Ustadz Senior Alumni Madinah',
      'Perlengkapan Umrah Ramadhan Eksklusif',
      'Air Zamzam 5 Liter'
    ],
    excludes: [
      'Paspor & Vaksin Meningitis',
      'Kebutuhan Pribadi'
    ],
    itinerary: [
      { day: 1, title: 'Keberangkatan Jakarta - Madinah Direct', description: 'Terbang langsung ke Madinah bersama rombongan Umrah Ramadhan.' },
      { day: 2, title: 'Madinah - Suasana Ramadhan di Masjid Nabawi', description: 'Check-in hotel, merasakan keindahan Buka Puasa bersama di pelataran Masjid Nabawi.' },
      { day: 3, title: 'Ziarah Raudhah & Kota Madinah', description: 'Ziarah Raudhah Mubarakah, Masjid Quba, Jabal Uhud.' },
      { day: 4, title: 'Persiapan Ke Makkah Al-Mukarramah', description: 'Memperbanyak ibadah dan iktikaf di Masjid Nabawi.' },
      { day: 5, title: 'Madinah ke Makkah - Umrah Pertama Ramadhan', description: 'Naik Kereta Cepat Haramain ke Makkah, check-in Fairmont Clock Tower, Umrah 1.' },
      { day: 6, title: 'Ibadah Ramadhan & Tarawih di Masjidil Haram', description: 'Shalat Tarawih & Witir berjamaah di pelataran Masjidil Haram.' },
      { day: 7, title: 'Ziarah Kota Makkah', description: 'City tour Arafah, Muzdalifah, Mina, Jabal Rahmah.' },
      { day: 8, title: 'Program Iktikaf & Qiyamul Lail', description: 'Bimbingan khusus iktikaf dan qiyamul lail berburu Lailatul Qadr.' },
      { day: 9, title: 'Umrah Kedua & Ziarah Taif', description: 'City tour Taif & Miqat Ji\'ranah untuk Umrah 2.' },
      { day: 10, title: 'Ibadah Khusyuk Malam-Malam Terakhir Ramadhan', description: 'Memperbanyak doa, tadarus Al-Qur\'an, dan iktikaf.' },
      { day: 11, title: 'Ibadah Mandiri & Persiapan Kepulangan', description: 'Acara bebas di Masjidil Haram.' },
      { day: 12, title: 'Tawaf Wada\' Ramadhan', description: 'Melaksanakan Tawaf Wada\' penuh haru.' },
      { day: 13, title: 'Jeddah ke Jakarta', description: 'Transfer ke Bandara Jeddah untuk kepulangan ke Tanah Air.' },
      { day: 14, title: 'Tiba di Jakarta', description: 'Tiba di Indonesia dengan ampunan dan keberkahan Ramadhan.' }
    ]
  }
];

export default function PaketUmrahShowcase() {

  const [packages, setPackages] = useState<UmrahPackage[]>(DEFAULT_UMRAH_PACKAGES);
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
          const umrahPackages = data.filter((p: any) => p.type?.toLowerCase() === 'umroh' || !p.type);
          if (umrahPackages.length > 0) {
             const mapped = umrahPackages.map((p: any) => {
                const hotels = (p.hotel || '').split(',').map((s: string) => s.trim());
                const hMakkah = hotels[0] || 'Hotel Pilihan Makkah';
                const hMadinah = hotels[1] || 'Hotel Pilihan Madinah';
                
                return {
                id: p.id,
                name: p.name,
                category: p.type === 'haji' ? 'Haji' : 'Umrah',
                categoryLabel: p.type === 'haji' ? 'Haji' : 'Umrah',
                duration: p.duration || '9 Hari',
                price: Number(p.price) || 0,
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
                })()
             } as UmrahPackage;
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

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPkg, setSelectedPkg] = useState<UmrahPackage | null>(null);
  const [modalTab, setModalTab] = useState<'facilities' | 'itinerary' | 'terms'>('facilities');

  // Horizontal Carousel Slider States
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Filtered packages
  const filteredPackages = packages.filter(pkg => {
    if (activeCategory === 'all') return true;
    return pkg.category === activeCategory;
  });

  // Handle category switch & reset slider position
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveIndex(0);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Scroll prev/next handlers
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
      // Loop back to beginning
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

  // Track active index on manual touch / scroll
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

  const getWhatsAppUrl = (pkgName: string, price: number) => {
    const formattedPrice = `Rp ${(price || 0).toLocaleString('id-ID')}`;
    const text = encodeURIComponent(
      `Assalamu'alaikum Golden Travel, saya tertarik dengan "${pkgName}" (${formattedPrice}). Mohon informasi ketersediaan seat dan jadwal rincinya.`
    );
    return `https://wa.me/6282283201103?text=${text}`;
  };

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#011E15] text-white overflow-hidden border-t border-[#D4AF37]/30" id="pilihan-paket">
      
      {/* Background Texture & Gold Accents */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#011E15]"></div>
        
        <div 
          className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-100"
          style={{ backgroundImage: `url(${PAKET_UMRAH_BG_DATA})` }}
        ></div>

        <div className="absolute top-0 right-4 sm:right-12 md:right-20 w-48 h-48 sm:w-64 sm:h-64 bg-[#D4AF37]/25 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#011E15]/15 via-transparent to-[#011E15]/35"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#022A1F]/90 border border-[#D4AF37]/60 text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-lg backdrop-blur-md">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>Paket Umrah Eksklusif & Reguler</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
            Pilihan Perjalanan Ibadah <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
              Sesuai Kerinduan Anda
            </span>
          </h2>

          <p className="font-sans text-stone-200 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto text-center pt-2 drop-shadow-sm">
            Nikmati ketenangan ibadah ke Tanah Suci dengan garansi kepastian penerbangan Direct Flight, akomodasi hotel Ring 1 Masjidil Haram & Nabawi, serta bimbingan ibadah yang sesuai tuntunan Sunnah.
          </p>
        </div>

        {/* Filter Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-2 pb-2">
          {[
            { id: 'all', label: 'Semua Paket' },
            { id: 'ekonomis', label: 'Umrah Bintang Tiga (3⭐)' },
            { id: 'reguler', label: 'Umrah Reguler (4⭐)' },
            { id: 'vip', label: 'Umrah VIP Executive (5⭐)' },
            { id: 'plus', label: 'Umrah Plus Turki' },
            { id: 'ramadhan', label: 'Spesial Ramadhan' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 shadow-md ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#011E15] shadow-[#D4AF37]/30 scale-105 border border-[#F3E5AB]'
                  : 'bg-[#022A1F]/80 text-stone-300 hover:text-white hover:bg-[#023829] border border-[#D4AF37]/30 backdrop-blur-md'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Carousel Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-2 pb-1 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#022A1F]/90 border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F3E5AB]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Paket {activeIndex + 1} dari {filteredPackages.length}</span>
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
                  aria-label={`Ke paket ${idx + 1}`}
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
            <p className="text-[#F3E5AB] text-lg font-medium">Memuat paket umrah...</p>
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
              {/* Side Floating Next/Prev Buttons for Desktop */}
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
                {/* Top Metallic Gold Accent Bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] w-full"></div>

                {/* Card Header Media */}
                <div>
                  <div className="relative h-60 sm:h-64 overflow-hidden">
                    <img 
                      src={pkg.imageUrl} 
                      alt={pkg.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#022A1F] via-[#022A1F]/20 to-transparent"></div>

                    {/* Top Right Badges */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                      <span className="bg-[#011E15]/90 border border-[#D4AF37] text-[#F3E5AB] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {pkg.duration}
                      </span>
                      <span className="bg-[#D4AF37] text-[#011E15] px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                        {pkg.categoryLabel}
                      </span>
                    </div>

                    {/* Featured Tag Badge */}
                    {pkg.isBestSeller && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#F3E5AB] text-[#011E15] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 z-10">
                        <Award className="w-4 h-4 fill-current text-[#011E15]" />
                        <span>BEST SELLER</span>
                      </div>
                    )}

                    {/* Airline Badge at Bottom of Image */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 bg-[#011E15]/80 backdrop-blur-md p-2 rounded-xl border border-[#D4AF37]/30 text-stone-200 text-xs font-medium">
                      <Plane className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{pkg.airline}</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 sm:p-7 space-y-5">
                    
                    {/* Title & Price Header */}
                    <div>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-white mb-2 leading-snug group-hover:text-[#F3E5AB] transition-colors line-clamp-2">
                        {pkg.name}
                      </h3>

                      <div className="flex flex-wrap items-baseline gap-2 pt-1">
                        <span className="font-serif text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
                          Rp {pkg.price?.toLocaleString('id-ID')}
                        </span>
                        <span className="text-stone-300 text-xs font-light">/ pax</span>
                        
                        {/* DP Badge */}
                        <span className="ml-auto bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#F3E5AB] text-[11px] font-bold px-2.5 py-1 rounded-md">
                          DP {pkg.dpAmount}
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Seats Badge */}
                    <div className="bg-[#011E15]/80 rounded-2xl p-3 border border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-stone-200">
                        <Calendar className="w-4 h-4 text-[#D4AF37]" />
                        <span className="truncate max-w-[200px]">{pkg.departureSchedule}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#F3E5AB] font-bold bg-[#D4AF37]/20 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40">
                        <span>Sisa {pkg.seatsLeft} Seat</span>
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
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Keunggulan Fasilitas Paket:</span>
                      </div>
                      {pkg.highlights.map((item, idx) => (
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

                {/* Card Footer Actions */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedPkg(pkg);
                        setModalTab('facilities');
                      }}
                      className="w-full py-3 px-3 rounded-xl border border-[#D4AF37] bg-[#011E15]/90 hover:bg-[#D4AF37]/15 text-[#F3E5AB] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Info className="w-4 h-4 text-[#D4AF37]" />
                      <span>Detail & Itinerary</span>
                    </button>

                    <a
                      href={getWhatsAppUrl(pkg.name, pkg.price)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#EEDCA2] to-[#B8860B] hover:brightness-110 text-[#011E15] text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4 fill-[#011E15]" />
                      <span>Booking / Tanya WA</span>
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
        </>
        )}

        {/* Bottom Guarantee Banner */}
        <div className="bg-gradient-to-r from-[#022A1F] via-[#043d2d] to-[#022A1F] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-[#011E15] border border-[#D4AF37] flex items-center justify-center shrink-0 shadow-lg text-[#D4AF37]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-white">Butuh Jadwal Khusus atau Umrah Rombongan / Private?</h4>
              <p className="text-xs sm:text-sm text-stone-200 font-light">Tim konsultan ibadah Golden Travel siap merancang paket custom sesuai budget dan preferensi keluarga Anda.</p>
            </div>
          </div>

          <a
            href="https://wa.me/6282283201103?text=Halo%20Golden%20Travel,%20saya%20ingin%20konsultasi%20Paket%20Umrah%20Custom%20/%20Keluarga"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl bg-[#D4AF37] text-[#011E15] text-xs sm:text-sm font-extrabold hover:bg-[#F3E5AB] transition-all shrink-0 shadow-lg flex items-center gap-2"
          >
            <span>Konsultasi Paket Custom</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPkg(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#012519] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden z-10 my-8 text-white max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-[#022A1F] via-[#043a2b] to-[#022A1F] border-b border-[#D4AF37]/30 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3E5AB] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    {selectedPkg.categoryLabel} • {selectedPkg.duration}
                  </div>
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                    {selectedPkg.name}
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold text-[#F3E5AB] mt-1 font-serif">
                    Rp {selectedPkg.price?.toLocaleString('id-ID')} <span className="text-xs font-sans text-stone-300 font-normal">/ pax</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPkg(null)}
                  className="w-10 h-10 rounded-full bg-[#011E15] border border-[#D4AF37]/50 text-stone-300 hover:text-white hover:bg-[#D4AF37] hover:text-[#011E15] transition-all flex items-center justify-center shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs Inside Modal */}
              <div className="flex border-b border-[#D4AF37]/25 bg-[#011E15]">
                <button
                  onClick={() => setModalTab('facilities')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    modalTab === 'facilities'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Hotel className="w-4 h-4" />
                  <span>Fasilitas & Hotel</span>
                </button>

                <button
                  onClick={() => setModalTab('itinerary')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    modalTab === 'itinerary'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Itinerary Perjalanan</span>
                </button>

                <button
                  onClick={() => setModalTab('terms')}
                  className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    modalTab === 'terms'
                      ? 'border-[#D4AF37] text-[#F3E5AB] bg-[#022A1F]'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Persyaratan & Legalitas</span>
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                
                {/* Tab 1: Fasilitas & Hotel */}
                {modalTab === 'facilities' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                        <Hotel className="w-4 h-4" />
                        <span>Akomodasi Hotel Bintang Pilihan</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
                          <div className="flex items-center justify-between text-[#F3E5AB]">
                            <span className="font-bold text-sm">Makkah Al-Mukarramah</span>
                            <div className="flex text-[#D4AF37]">
                              {Array.from({ length: selectedPkg.hotelMakkahStars }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <div className="text-white font-bold text-base">{selectedPkg.hotelMakkah}</div>
                          <p className="text-xs text-stone-300 font-light">{selectedPkg.hotelMakkahDistance}</p>
                        </div>

                        <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/30 space-y-2">
                          <div className="flex items-center justify-between text-[#F3E5AB]">
                            <span className="font-bold text-sm">Madinah Al-Munawwarah</span>
                            <div className="flex text-[#D4AF37]">
                              {Array.from({ length: selectedPkg.hotelMadinahStars }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <div className="text-white font-bold text-base">{selectedPkg.hotelMadinah}</div>
                          <p className="text-xs text-stone-300 font-light">{selectedPkg.hotelMadinahDistance}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="bg-[#022A1F]/70 p-5 rounded-2xl border border-[#D4AF37]/30 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-[#F3E5AB] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                          <span>Harga Sudah Termasuk (Included):</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-stone-200">
                          {selectedPkg.includes.map((inc, i) => (
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
                          {selectedPkg.excludes.map((exc, i) => (
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

                {/* Tab 2: Itinerary */}
                {modalTab === 'itinerary' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Rencana Perjalanan {selectedPkg.duration} Hari</span>
                    </h4>

                    <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4AF37]/30">
                      {selectedPkg.itinerary.map((item) => (
                        <div key={item.day} className="relative pl-10">
                          <div className="absolute left-1.5 top-1.5 w-5 h-5 rounded-full bg-[#D4AF37] text-[#011E15] font-black text-[10px] flex items-center justify-center ring-4 ring-[#012519]">
                            {item.day}
                          </div>
                          <div className="bg-[#022A1F] p-4 rounded-2xl border border-[#D4AF37]/25 space-y-1">
                            <div className="font-serif font-bold text-sm text-[#F3E5AB]">
                              Hari ke-{item.day}: {item.title}
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

                {/* Tab 3: Persyaratan & Legalitas */}
                {modalTab === 'terms' && (
                  <div className="space-y-6">
                    <div className="bg-[#022A1F] p-5 rounded-2xl border border-[#D4AF37]/30 space-y-3">
                      <h4 className="text-sm font-bold text-[#F3E5AB] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#D4AF37]" />
                        <span>Dokumen Pendaftaran Umrah</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-stone-200">
                        <li className="flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold">1.</span>
                          <span><strong>Paspor Asli:</strong> Masih berlaku minimal 7 bulan sebelum tanggal keberangkatan dengan nama minimal 2-3 kata (contoh: Ahmad Abdullah).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold">2.</span>
                          <span><strong>Fotokopi Dokumen Pribadi:</strong> Kartu Tanda Penduduk (KTP), Kartu Keluarga (KK), dan Buku Nikah (bagi suami istri) / Akta Kelahiran (bagi anak-anak).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold">3.</span>
                          <span><strong>Buku Kesehatan / Vaksin:</strong> Sertifikat Vaksin Meningitis & Meningokokus (Sertifikat Internasional ICV).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#D4AF37] font-bold">4.</span>
                          <span><strong>Pasfoto Terbaru:</strong> Ukuran 4x6 sebanyak 4 lembar (Background Putih, Tampak Wajah 80%).</span>
                        </li>
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
                        <p>• <strong>Pelunasan:</strong> Wajib dilunasi paling lambat 30 hari sebelum tanggal keberangkatan.</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer CTA */}
              <div className="p-6 bg-[#022A1F] border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-300">Total Biaya Paket:</div>
                  <div className="font-serif font-bold text-2xl text-[#F3E5AB]">
                    Rp {selectedPkg.price?.toLocaleString('id-ID')} <span className="text-xs font-sans text-stone-300 font-normal">/ pax</span>
                  </div>
                </div>

                <a
                  href={getWhatsAppUrl(selectedPkg.name, selectedPkg.price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#EEDCA2] to-[#B8860B] text-[#011E15] text-xs sm:text-sm font-extrabold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <MessageCircle className="w-4 h-4 fill-[#011E15]" />
                  <span>Daftar & Booking via WhatsApp</span>
                </a>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

