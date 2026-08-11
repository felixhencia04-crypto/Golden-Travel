import React from 'react';
import { LAYANAN_KAMI_BG_DATA } from '../assets/layananKamiData';
import { 
  ShieldCheck, 
  Sparkles, 
  Hotel, 
  Plane, 
  Bus, 
  HeartHandshake, 
  BadgeCheck, 
  Clock, 
  Users, 
  Check, 
  Award, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';

export interface ReasonItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  points: string[];
  badgeText: string;
}

export const REASONS_DATA: ReasonItem[] = [
  {
    id: 'pasti-sunnah',
    number: '01',
    title: 'Komitmen 5 Pasti Kemenag RI & Pembimbing Sesuai Sunnah',
    subtitle: 'Ketenangan Batin dengan Bimbingan Ibadah yang Shahih',
    description: 'Kami memegang teguh garansi 5 Pasti Umrah Kemenag RI (Pasti Travelnya, Pasti Jadwalnya, Pasti Terbangnya, Pasti Hotelnya, Pasti Visanya) yang dipandu oleh Muthawwif bersertifikasi Kemenag & alumni Universitas Islam Madinah sesuai Qur\'an & Sunnah.',
    icon: <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />,
    points: [
      'Izin Resmi PPIU & PIHK Kemenag RI',
      'Muthawwif Alumni UIM & LIPIA Berilmu',
      'Manasik Umrah & Haji Intensif Sesuai Sunnah'
    ],
    badgeText: '5 PASTI KEMENAG RI'
  },
  {
    id: 'akomodasi-ring1',
    number: '02',
    title: 'Akomodasi Hotel Bintang Dekat Pelataran Masjid',
    subtitle: 'Kenyamanan Akses Ibadah dengan Akomodasi Strategis',
    description: 'Kami menyediakan pilihan hotel bintang 3, 4, dan 5 yang berlokasi strategis dan sangat dekat dari pelataran Masjidil Haram Makkah serta Masjid Nabawi Madinah. Dirancang khusus untuk memberikan kenyamanan maksimal bagi lansia, anak-anak, maupun seluruh keluarga.',
    icon: <Hotel className="w-7 h-7 text-[#D4AF37]" />,
    points: [
      'Akses Jalan Kaki Mudah ke Pelataran Utama',
      'Pilihan Hotel Bintang 3, 4 & 5 Berkualitas',
      'Sajian Menu Cita Rasa Nusantara 3x Sehari'
    ],
    badgeText: 'AKOMODASI PREMIUM'
  },
  {
    id: 'direct-flight',
    number: '03',
    title: 'Penerbangan Direct dan Transit',
    subtitle: 'Kenyamanan Perjalanan Udara dengan Maskapai Internasional',
    description: 'Bermitra dengan maskapai kelas dunia (Lion Air, Saudia Airlines, Garuda Indonesia) yang menghadirkan opsi penerbangan rute langsung maupun transit secara efisien. Menjamin pengalaman perjalanan udara premium demi menjaga stamina jemaah.',
    icon: <Plane className="w-7 h-7 text-[#D4AF37]" />,
    points: [
      'Opsi Penerbangan Direct & Transit Fleksibel',
      'Maskapai Kelas Ekonomi dan Bisnis',
      'Bagasi Ekstra Luas & Air Zamzam 5 Liter'
    ],
    badgeText: 'PREMIUM FLIGHT'
  },
  {
    id: 'transportasi-vip',
    number: '04',
    title: 'Transportasi Bus VIP & Akses Kereta Cepat Haramain',
    subtitle: 'Perjalanan Antar Kota Suci yang Dingin, Cepat & Elegan',
    description: 'Armada bus eksklusif ber-AC dingin terbaru dengan kursi reclining ergonomis, serta opsi Kereta Cepat Haramain High Speed Railway (Makkah-Madinah hanya 2 jam) untuk mobilitas berkelas.',
    icon: <Bus className="w-7 h-7 text-[#D4AF37]" />,
    points: [
      'Armada Bus VIP Model Terbaru AC Dingin',
      'Opsional Kereta Cepat Haramain 2 Jam',
      'Handling Logistik & Bagasi Profesional'
    ],
    badgeText: 'MOBILITAS VIP'
  },
  {
    id: 'transparansi-biaya',
    number: '05',
    title: 'Transparansi Biaya Tanpa Ada Biaya Tersembunyi',
    subtitle: 'Integritas Tinggi Tanpa Kejutan Biaya Tambahan di Tengah Jalan',
    description: 'Biaya yang Anda bayarkan bersifat All-Inclusive mencakup tiket pesawat PP, visa, hotel, makan 3x sehari, manasik, perlengkapan eksklusif, ziarah, dan asuransi. Tidak ada biaya siluman.',
    icon: <BadgeCheck className="w-7 h-7 text-[#D4AF37]" />,
    points: [
      'Biaya All-Inclusive Sesuai Akad Awal',
      'Perlengkapan Umrah Eksklusif & Elegan',
      'Proses Administrasi & Visa Cepat & Aman'
    ],
    badgeText: 'ALL-INCLUSIVE'
  }
];

export default function WhyChooseGoldenTravel() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-8 md:px-12 lg:px-24 bg-[#011E15] text-white overflow-hidden border-t border-[#D4AF37]/30" id="keunggulan-layanan">
      
      {/* Background Image Container - Guaranteed Display of Gold Mandalas & Islamic Patterns */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        {/* Base Rich Emerald Background */}
        <div className="absolute inset-0 bg-[#011E15]"></div>
        
        {/* Main Full-Size Background Image */}
        <div 
          className="absolute inset-0 bg-no-repeat bg-top bg-cover opacity-80"
          style={{ backgroundImage: `url(${LAYANAN_KAMI_BG_DATA})` }}
        ></div>

        {/* Left Side Gold Mandala Accent Overlay - Pinned to Left Edge */}
        <div className="absolute top-0 left-0 bottom-0 w-40 sm:w-64 md:w-80 lg:w-[420px] pointer-events-none overflow-hidden opacity-90 mix-blend-screen">
          <img 
            src={LAYANAN_KAMI_BG_DATA} 
            alt="Corak Mandala Emas Kiri" 
            className="h-full w-auto max-w-none object-cover object-left"
          />
        </div>

        {/* Right Side Gold Mandala Accent Overlay - Pinned to Right Edge */}
        <div className="absolute top-0 right-0 bottom-0 w-40 sm:w-64 md:w-80 lg:w-[420px] pointer-events-none overflow-hidden opacity-90 mix-blend-screen">
          <img 
            src={LAYANAN_KAMI_BG_DATA} 
            alt="Corak Mandala Emas Kanan" 
            className="h-full w-auto max-w-none object-cover object-right"
          />
        </div>

        {/* Subtle Center Glow & Gradient for Maximum Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#011E15]/60 via-[#011E15]/20 to-[#011E15]/80"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D4AF37]/15 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16 sm:space-y-20">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#012E20]/80 border border-[#D4AF37]/60 text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase shadow-lg backdrop-blur-md">
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            <span>Keunggulan Layanan Kami</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
            Mengapa Anda Harus Memilih <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent">
              Golden Travel?
            </span>
          </h2>

          <p className="font-sans text-stone-200 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto text-center pt-2 drop-shadow-sm">
            Perjalanan ke Tanah Suci adalah perjalanan suci seumur hidup. Golden Travel hadir memberikan standar pelayanan terbaik berkelas eksekutif, memadukan kepastian legalitas, kenyamanan akomodasi, serta bimbingan ibadah yang khusyuk dan sesuai tuntunan.
          </p>
        </div>

        {/* Executive Stats Bar - Glassmorphic Translucent Dark Emerald */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-[#02281D]/80 p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="text-center space-y-1 border-r border-[#D4AF37]/25 last:border-r-0 pr-2">
            <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
              Layanan VIP
            </div>
            <div className="text-xs sm:text-sm font-medium text-stone-200">Pengalaman Ibadah Eksklusif</div>
            <div className="text-[11px] text-[#D4AF37] font-light">Dedikasi Pelayanan Sepenuh Hati</div>
          </div>

          <div className="text-center space-y-1 border-r border-[#D4AF37]/25 last:border-r-0 pr-2">
            <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
              Bimbingan Sunnah
            </div>
            <div className="text-xs sm:text-sm font-medium text-stone-200">Pendampingan Ibadah Khusyuk</div>
            <div className="text-[11px] text-[#D4AF37] font-light">Asatidz Berpengalaman & Profesional</div>
          </div>

          <div className="text-center space-y-1 border-r border-[#D4AF37]/25 last:border-r-0 pr-2">
            <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
              Jaminan Kepastian
            </div>
            <div className="text-xs sm:text-sm font-medium text-stone-200">Perlindungan Hukum & Amanah</div>
            <div className="text-[11px] text-[#D4AF37] font-light">Terdaftar Resmi Kemenag RI</div>
          </div>

          <div className="text-center space-y-1 pl-2">
            <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent leading-tight">
              Fasilitas Terbaik
            </div>
            <div className="text-xs sm:text-sm font-medium text-stone-200">Kenyamanan Akomodasi Strategis</div>
            <div className="text-[11px] text-[#D4AF37] font-light">Fokus Ibadah Tanpa Kendala</div>
          </div>
        </div>

        {/* 6 Core Value Cards Grid - Glassmorphism Translucent Emerald & Metallic Gold */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {REASONS_DATA.map((reason, idx) => (
            <motion.div
              key={reason.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-[#022A1F]/85 text-white border-2 border-[#D4AF37]/60 rounded-3xl p-6 sm:p-8 shadow-[0_20px_45px_rgba(0,0,0,0.5)] hover:border-[#D4AF37] hover:bg-[#022A1F]/95 hover:shadow-[0_25px_50px_rgba(212,175,55,0.25)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group backdrop-blur-md"
            >
              {/* Metallic Gold Top Accent Line */}
              <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] absolute top-0 left-0 right-0"></div>

              <div>
                {/* Header Row: Icon & Number Badge */}
                <div className="flex items-center justify-between mb-6 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#011E15] border border-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    {reason.icon}
                  </div>
                  <span className="font-serif font-extrabold text-2xl text-[#F3E5AB] bg-[#D4AF37]/20 px-3.5 py-1 rounded-xl border border-[#D4AF37]/60 shadow-inner">
                    {reason.number}
                  </span>
                </div>

                {/* Subtitle Pill */}
                <div className="inline-block bg-[#D4AF37]/15 text-[#F3E5AB] text-[11px] font-bold px-3 py-1 rounded-full border border-[#D4AF37]/50 mb-3 uppercase tracking-wider">
                  {reason.badgeText}
                </div>

                {/* Main Card Title */}
                <h3 className="font-serif font-bold text-xl text-white leading-snug mb-2 group-hover:text-[#F3E5AB] transition-colors">
                  {reason.title}
                </h3>

                {/* Subtitle */}
                <p className="font-serif italic text-xs font-semibold text-[#D4AF37] mb-3">
                  "{reason.subtitle}"
                </p>

                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-stone-200 font-normal leading-relaxed mb-6">
                  {reason.description}
                </p>

                {/* Bullet Points */}
                <div className="space-y-2 pt-4 border-t border-[#D4AF37]/25">
                  {reason.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs text-stone-100 font-medium">
                      <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#F3E5AB]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Tag */}
              <div className="pt-5 mt-6 border-t border-[#D4AF37]/25 flex items-center justify-between text-xs text-stone-300 font-medium">
                <span className="text-[#F3E5AB] font-bold">Standar Layanan Eksekutif</span>
                <span className="text-[#D4AF37] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Golden Travel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action Banner inside Why Choose Us */}
        <div className="bg-gradient-to-br from-[#043323]/90 via-[#012519]/90 to-[#021811]/90 rounded-3xl p-8 sm:p-12 border-2 border-[#D4AF37] shadow-2xl relative overflow-hidden text-center space-y-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F3E5AB] text-xs font-semibold uppercase tracking-wider">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>Niat Suci Anda, Komitmen Utama Kami</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#F3E5AB] leading-snug">
              Siap Menunaikan Panggilan Suci ke Tanah Suci dengan Tenang, Aman, Nyaman, dan Khusyuk?
            </h3>

            <p className="text-stone-200 text-sm sm:text-base font-light leading-relaxed">
              Konsultasikan jadwal keberangkatan, rincian fasilitas hotel, serta pendaftaran paket Umrah & Haji Khusus Anda bersama tim konsultan ibadah Golden Travel sekarang juga.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://wa.me/6282283201103?text=Assalamu%27alaikum,%20saya%20ingin%20konsultasi%20paket%20Umrah%2FHaji%20Golden%20Travel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#8B6508] text-[#0B2319] font-bold text-sm sm:text-base hover:brightness-110 shadow-xl transition-all duration-300"
              >
                <HeartHandshake className="w-5 h-5 text-[#0B2319]" />
                <span>Konsultasi Gratis via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
