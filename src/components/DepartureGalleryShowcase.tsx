import React, { useState } from 'react';
import { 
  Sparkles, 
  Camera, 
  Play, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Share2, 
  Maximize2, 
  Video, 
  Clock, 
  Heart,
  ShieldCheck,
  Building2,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GalleryItem {
  id: string;
  title: string;
  category: 'semua' | 'makkah' | 'madinah' | 'keberangkatan' | 'vip-transport' | 'ziarah' | 'video';
  categoryLabel: string;
  imageUrl: string;
  location: string;
  hijriDate: string;
  gregorianDate: string;
  batchName: string;
  jemaahCount: number;
  description: string;
  photographer?: string;
  likesCount: number;
  isVideo?: boolean;
  videoDuration?: string;
  videoEmbedUrl?: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Thawaf Khusyuk & Sa\'i Jemaah VIP Ring 1',
    category: 'makkah',
    categoryLabel: 'Makkah Al-Mukarramah',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    location: 'Pelataran Thawaf Masjidil Haram, Makkah',
    hijriDate: '15 Rajab 1445 H',
    gregorianDate: '27 Januari 2024',
    batchName: 'Rombongan Umrah Executive Bintang 5 Batch 08',
    jemaahCount: 45,
    description: 'Dokumentasi momen haru para jemaah saat pertama kali memandang Ka\'bah dan melaksanakan ibadah Thawaf dengan bimbingan khusus Muthawwif alumni Universitas Islam Madinah. Suasana penuh ketenangan dan ketakwaan di pelataran utama Masjidil Haram.',
    likesCount: 342
  },
  {
    id: 'gal-2',
    title: 'Ziarah Syahdu di Raudhah & Masjid Nabawi',
    category: 'madinah',
    categoryLabel: 'Madinah Munawwarah',
    imageUrl: 'https://images.unsplash.com/photo-1565552643954-1a4be7aa0fc8?auto=format&fit=crop&w=1200&q=80',
    location: 'Pelataran & Pelataran Payung Masjid Nabawi, Madinah',
    hijriDate: '10 Rajab 1445 H',
    gregorianDate: '22 Januari 2024',
    batchName: 'Grup Madinah Munawwarah VIP Phase 1',
    jemaahCount: 42,
    description: 'Jemaah wanita dan pria mendapat pendampingan khusyuk saat memasuki Raudhah (Taman Surga) dengan Tasreh resmi Kemenag & Kementerian Haji Saudi. Dilanjutkan foto kebersamaan di pelataran payung raksasa Masjid Nabawi.',
    likesCount: 289
  },
  {
    id: 'gal-3',
    title: 'Pelepasan & Seremonial Keberangkatan Bandara Soekarno-Hatta',
    category: 'keberangkatan',
    categoryLabel: 'Bandara & Pelepasan',
    imageUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=1200&q=80',
    location: 'Terminal 3 International, Bandara Soekarno-Hatta (CGK)',
    hijriDate: '01 Syawal 1445 H',
    gregorianDate: '10 April 2024',
    batchName: 'Keberangkatan Spesial Syawal Group Akbar',
    jemaahCount: 88,
    description: 'Prosesi pelepasan jemaah secara resmi oleh Direktur Utama PT. Golden Tour Haramain, Ustadz Ahmad Daud, dilengkapi pembagian perlengkapan eksklusif, lounge VIP, dan kemudahan Fast-Track imigrasi sebelum penerbangan Saudia Airlines.',
    likesCount: 412
  },
  {
    id: 'gal-4',
    title: 'Pengalaman Mewah Kereta Cepat Haramain Express',
    category: 'vip-transport',
    categoryLabel: 'Layanan VIP & Transport',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    location: 'Stasiun Kereta Cepat Haramain Madinah - Makkah',
    hijriDate: '12 Rajab 1445 H',
    gregorianDate: '24 Januari 2024',
    batchName: 'Executive Group Fast Train Experience',
    jemaahCount: 45,
    description: 'Jemaah menikmati fasilitas perjalanan Kereta Cepat Haramain dengan kecepatan 300 km/jam dari Madinah ke Makkah hanya dalam waktu 2 jam 15 menit. Nyaman, tenang, tanpa lelah, dan dilayani dengan snack premium.',
    likesCount: 215
  },
  {
    id: 'gal-5',
    title: 'Ziarah Bersejarah Jabal Rahmah & Padang Arafah',
    category: 'ziarah',
    categoryLabel: 'City Tour & Ziarah',
    imageUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80',
    location: 'Bukit Jabal Rahmah, Arafah, Makkah',
    hijriDate: '16 Rajab 1445 H',
    gregorianDate: '28 Januari 2024',
    batchName: 'Historical City Tour Makkah Group A',
    jemaahCount: 45,
    description: 'Kunjungan edukatif dan doa bersama di Tugu Jabal Rahmah, tempat bertemunya Nabi Adam AS dan Sayyidatu Hawa. Tim Muthawwif memberikan penjelasan mendalam tentang peristiwa penting di Padang Arafah.',
    likesCount: 378
  },
  {
    id: 'gal-6',
    title: 'Tenda VIP Ber-AC Arafah & Mina Jemaah Haji Furoda',
    category: 'makkah',
    categoryLabel: 'Makkah Al-Mukarramah',
    imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    location: 'Maktab Khusus Armuzna (Arafah-Muzdalifah-Mina)',
    hijriDate: '09 Dzulhijjah 1445 H',
    gregorianDate: '15 Juni 2024',
    batchName: 'Jemaah Haji Khusus Furoda Gold 1445 H',
    jemaahCount: 30,
    description: 'Fasilitas tenda ber-AC berstandar hotel berbintang di Arafah dan Mina untuk jemaah Haji Furoda PT. Golden Tour Haramain. Dilengkapi kasur springbed, kuliner khas Indonesia 24 jam, serta layanan medis mandiri.',
    likesCount: 520
  },
  {
    id: 'gal-7',
    title: 'Penerbangan Direct Flight Saudia Airlines Boeing 777',
    category: 'keberangkatan',
    categoryLabel: 'Bandara & Pelepasan',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    location: 'Kabin Saudia Airlines Rute Jakarta - Madinah',
    hijriDate: '01 Sya\'ban 1445 H',
    gregorianDate: '11 Februari 2024',
    batchName: 'Grup Umrah Sya\'ban Direct Madinah',
    jemaahCount: 50,
    description: 'Suasana kabin pesawat Saudia Airlines khusus penerbangan langsung (non-stop) Jakarta - Madinah. Jemaah mendapat hidangan halal 2 kali, peralatan ibadah gratis, serta doa safar bersama di dalam pesawat.',
    likesCount: 198
  },
  {
    id: 'gal-8',
    title: 'Dokumenter Sinematik: Perjalanan Suci Ke Baitullah',
    category: 'video',
    categoryLabel: 'Video Sinematik',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    location: 'Makkah Al-Mukarramah & Madinah Munawwarah',
    hijriDate: 'Arsip Dokumenter 1445 H',
    gregorianDate: 'Musim Ibadah 2024',
    batchName: 'Film Dokumenter Perjalanan Jemaah Golden Tour',
    jemaahCount: 120,
    description: 'Saksikan video rangkuman perjalanan spiritual 9 hari penuh kehangatan, haru, dan kenyamanan ibadah jemaah Golden Tour Haramain dari titik pelepasan di tanah air hingga tawaf wada di Baitullah.',
    likesCount: 890,
    isVideo: true,
    videoDuration: '04:12 Min HD',
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

export const DepartureGalleryShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('semua');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [likesState, setLikesState] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  const filterTabs = [
    { id: 'semua', label: '🌟 Semua Momen', count: GALLERY_ITEMS.length },
    { id: 'makkah', label: '🕋 Makkah & Ka\'bah', count: GALLERY_ITEMS.filter(i => i.category === 'makkah').length },
    { id: 'madinah', label: '🕌 Madinah & Nabawi', count: GALLERY_ITEMS.filter(i => i.category === 'madinah').length },
    { id: 'keberangkatan', label: '✈️ Pelepasan Bandara', count: GALLERY_ITEMS.filter(i => i.category === 'keberangkatan').length },
    { id: 'vip-transport', label: '🚆 Kereta Cepat & VIP', count: GALLERY_ITEMS.filter(i => i.category === 'vip-transport').length },
    { id: 'ziarah', label: '🏔️ City Tour & Ziarah', count: GALLERY_ITEMS.filter(i => i.category === 'ziarah').length },
    { id: 'video', label: '🎬 Video Sinematik', count: GALLERY_ITEMS.filter(i => i.isVideo).length },
  ];

  const filteredItems = GALLERY_ITEMS.filter(item => {
    if (activeTab === 'semua') return true;
    if (activeTab === 'video') return item.isVideo;
    return item.category === activeTab;
  });

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedMap[id];
    setLikedMap(prev => ({ ...prev, [id]: !isLiked }));
    setLikesState(prev => ({
      ...prev,
      [id]: (prev[id] ?? 0) + (isLiked ? -1 : 1)
    }));
  };

  const currentSelectedItem = selectedItemIndex !== null ? filteredItems[selectedItemIndex] : null;

  const handlePrevImage = () => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex(selectedItemIndex === 0 ? filteredItems.length - 1 : selectedItemIndex - 1);
  };

  const handleNextImage = () => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex(selectedItemIndex === filteredItems.length - 1 ? 0 : selectedItemIndex + 1);
  };

  return (
    <section 
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-20 relative overflow-hidden bg-cover bg-center bg-no-repeat text-white" 
      style={{ backgroundImage: `url('/testimoni-bg.png')` }}
      id="galeri"
    >
      {/* Soft dark luxury gradient overlay matching testimonials section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#011d15]/85 via-[#01251a]/80 to-[#01140d]/90 pointer-events-none" />

      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Dokumentasi Autentik & Momen Suci</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Jejak Langkah <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E6CA65]">Spiritual Jemaah</span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
            Menelusuri kembali momen-momen suci penuh haru, kekhusyukan, dan kebahagiaan para Tamu Allah yang telah beribadah bersama <strong className="text-white font-semibold">PT. Golden Tour Haramain</strong>.
          </p>
        </div>

        {/* Live Statistics Counter Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 p-4 sm:p-6 rounded-2xl bg-[#022b1f]/80 border border-[#D4AF37]/25 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/15 last:border-r-0">
            <span className="text-[#D4AF37] font-bold text-xl sm:text-2xl font-serif">150+</span>
            <span className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Rombongan Keberangkatan</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/15 last:border-r-0">
            <span className="text-[#34D399] font-bold text-xl sm:text-2xl font-serif">12,500+</span>
            <span className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Jemaah Diberangkatkan</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/15 last:border-r-0">
            <span className="text-[#F3E5AB] font-bold text-xl sm:text-2xl font-serif">5,000+</span>
            <span className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Arsip Foto & Video HD</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-[#D4AF37] font-bold text-xl sm:text-2xl font-serif">100%</span>
            <span className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Kepuasan & Keamanan</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-10 scrollbar-none px-1">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-[#D4AF37] text-[#011710] border-[#D4AF37] font-bold shadow-[0_4px_15px_rgba(212,175,55,0.3)] scale-105'
                  : 'bg-[#02251c]/80 text-stone-300 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#033327]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-[#011710] text-[#F3E5AB]' : 'bg-[#011710]/60 text-[#D4AF37]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-16">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const extraLikes = likesState[item.id] ?? 0;
              const isLiked = likedMap[item.id];
              const totalLikes = item.likesCount + extraLikes;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedItemIndex(index)}
                  className="group relative rounded-2xl overflow-hidden bg-[#02251c] border border-[#D4AF37]/25 hover:border-[#D4AF37]/70 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] transition-all duration-500 cursor-pointer flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#011710]">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-95 group-hover:brightness-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#011710] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Category Badge Top Left */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#011710]/80 backdrop-blur-md border border-[#D4AF37]/30 text-[#F3E5AB] text-[10px] font-semibold flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.categoryLabel}</span>
                    </div>

                    {/* Video Badge / Play Icon if Video */}
                    {item.isVideo ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#011710] flex items-center justify-center shadow-lg group-hover:scale-115 transition-transform">
                          <Play className="w-6 h-6 ml-0.5 fill-[#011710]" />
                        </div>
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-stone-200 text-[10px] font-mono">
                          {item.videoDuration}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-full text-white hover:text-[#D4AF37]">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Card Content Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#02251c] to-[#011912]">
                    <div>
                      {/* Location & Date */}
                      <div className="flex items-center justify-between text-[11px] text-stone-300 mb-1.5">
                        <span className="flex items-center gap-1 truncate max-w-[160px]" title={item.location}>
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        <span className="text-[#D4AF37] font-medium shrink-0">{item.hijriDate}</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-serif font-bold text-sm sm:text-base text-white group-hover:text-[#F3E5AB] transition-colors leading-snug line-clamp-2 mb-2">
                        {item.title}
                      </h4>
                    </div>

                    {/* Bottom Metadata & Like Button */}
                    <div className="pt-2 border-t border-[#D4AF37]/15 flex items-center justify-between text-xs text-stone-400">
                      <span className="flex items-center gap-1 text-[11px] text-stone-300 truncate max-w-[140px]" title={item.batchName}>
                        <Users className="w-3 h-3 text-[#D4AF37]" />
                        <span className="truncate">{item.jemaahCount} Jemaah</span>
                      </span>

                      <button
                        onClick={(e) => handleLike(item.id, e)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                          isLiked 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'hover:bg-white/10 text-stone-400'
                        }`}
                        title="Sukai Foto Ini"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{totalLikes}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Featured Video Showcase Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-[#D4AF37]/40 bg-gradient-to-r from-[#022e23] via-[#01241b] to-[#011812] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#F3E5AB] text-xs font-semibold">
                <Video className="w-4 h-4 text-[#D4AF37]" />
                <span>Video Profile & Dokumenter Khusus</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                Kenyamanan & Khidmat Beribadah di <span className="text-[#D4AF37]">Tanah Suci</span>
              </h3>

              <p className="text-stone-300 text-xs sm:text-sm md:text-base font-light leading-relaxed">
                Saksikan rangkuman momen haru, bimbingan manasik intensif, kemudahan transportasi kereta cepat, serta fasilitas hotel bintang 5 depan Masjidil Haram yang dinikmati para jemaah Golden Tour Haramain.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-300">
                <div className="flex items-center gap-1.5 bg-[#011710]/80 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                  <span>Pendampingan Full 24 Jam</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#011710]/80 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Hotel Ring 1 Masjidil Haram</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#011710]/80 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#F3E5AB]" />
                  <span>Muthawwif Kemenag / Alumni Madinah</span>
                </div>
              </div>
            </div>

            {/* Right Video Preview Card */}
            <div className="lg:col-span-5">
              <div 
                onClick={() => setIsVideoModalOpen(true)}
                className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-2xl group cursor-pointer"
              >
                <img 
                  src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=80" 
                  alt="Video Trailer" 
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-50 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-[#011710]/30 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D4AF37] text-[#011710] flex items-center justify-center shadow-xl shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 ml-1 fill-[#011710]" />
                  </div>
                  <span className="mt-3 font-serif font-bold text-white text-sm sm:text-base drop-shadow-md">
                    Putar Video Dokumenter (04:12 HD)
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Lightbox Photo / Detail Modal */}
      <AnimatePresence>
        {currentSelectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-b from-[#022b1f] to-[#01140d] border border-[#D4AF37]/50 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col relative"
            >
              {/* Top Bar inside Modal */}
              <div className="p-4 bg-[#011710] border-b border-[#D4AF37]/20 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold">
                  <Camera className="w-4 h-4" />
                  <span>Galeri Keberangkatan Resmi ({selectedItemIndex! + 1} dari {filteredItems.length})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedItemIndex(null)}
                    className="p-1.5 rounded-full bg-[#02251c] text-stone-300 hover:text-white hover:bg-[#D4AF37]/30 border border-[#D4AF37]/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Image Showcase Left Column */}
                <div className="md:col-span-7 relative group rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-black aspect-[4/3] flex items-center justify-center">
                  <img 
                    src={currentSelectedItem.imageUrl} 
                    alt={currentSelectedItem.title} 
                    className="w-full h-full object-cover"
                  />

                  {/* Nav Arrows */}
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-[#D4AF37] hover:text-[#011710] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-[#D4AF37] hover:text-[#011710] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Info Details Right Column */}
                <div className="md:col-span-5 space-y-4 text-stone-200">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{currentSelectedItem.location}</span>
                  </div>

                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-snug">
                    {currentSelectedItem.title}
                  </h3>

                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed font-light">
                    {currentSelectedItem.description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#011811] border border-[#D4AF37]/20 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-stone-800 pb-1.5">
                      <span className="text-stone-400">Grup / Rombongan:</span>
                      <span className="text-[#F3E5AB] font-semibold text-right">{currentSelectedItem.batchName}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-1.5">
                      <span className="text-stone-400">Tanggal Ibadah:</span>
                      <span className="text-white font-medium">{currentSelectedItem.hijriDate} ({currentSelectedItem.gregorianDate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Jumlah Jemaah:</span>
                      <span className="text-emerald-400 font-bold">{currentSelectedItem.jemaahCount} Orang</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <a
                      href="https://wa.me/6281234567890?text=Assalamu%27alaikum,%20saya%20tertarik%20dengan%20jadwal%20keberangkatan%20dan%20paket%20seperti%20pada%20dokumentasi%20di%20galeri."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#011710] font-bold text-xs text-center hover:brightness-110 transition-all shadow-md"
                    >
                      Tanyakan Keberangkatan Serupa
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#011710] border border-[#D4AF37]/50 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/80 text-white hover:text-[#D4AF37] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 text-center">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F3E5AB]">
                  Dokumenter Perjalanan Ibadah Golden Tour Haramain
                </h3>
                <p className="text-stone-400 text-xs">Momen nyata kenyamanan ibadah di Makkah & Madinah</p>
              </div>

              {/* Responsive Video Container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-black">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Dokumenter Perjalanan Golden Tour Haramain"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default DepartureGalleryShowcase;
