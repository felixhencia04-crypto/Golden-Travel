import React, { useState } from 'react';
import { 
  Play, 
  Video, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Award, 
  X, 
  Filter, 
  Tv, 
  Film, 
  MapPin, 
  Eye, 
  Download,
  Share2,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'profil' | 'dokumenter' | 'manasik' | 'fasilitas';
  categoryLabel: string;
  youtubeId: string;
  youtubeUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  duration: string;
  resolution: string;
  batchOrEvent: string;
  releaseDate: string;
  description: string;
  viewsCount: string;
  highlights: string[];
  featured?: boolean;
}

export const VIDEO_CATALOG: VideoItem[] = [
  {
    id: 'vid-prof-1',
    title: 'Profil Resmi PT. Golden Tour Haramain',
    subtitle: 'Solusi Perjalanan Umrah & Haji Khusus Bintang 5 Terpercaya',
    category: 'profil',
    categoryLabel: 'Video Profil Resmi',
    youtubeId: 'dQw4w9WgXcQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    duration: '05:30 Min',
    resolution: '4K Ultra HD',
    batchOrEvent: 'Official Company Profile',
    releaseDate: '2024',
    description: 'Profil lengkap PT. Golden Tour Haramain (Mitra PT. Sederhana Almaidani Group, Izin PPIU: 08012300040570002). Menampilkan komitmen pelayanan dari Direktur Utama, tim pembimbing ibadah alumni UIM Madinah, serta jaminan fasilitas hotel Ring 1 Masjidil Haram.',
    viewsCount: '45,200+',
    highlights: ['Izin Resmi Kemenag RI', 'Hotel Ring 1 Masjidil Haram', 'Bimbingan Syariah Alumni Madinah'],
    featured: true
  },
  {
    id: 'vid-doc-1',
    title: 'Dokumenter Khusus Haji Furoda 1445 H: Armuzna VIP',
    subtitle: 'Kenyamanan Tenda AC Arafah & Mina Jemaah Furoda Gold',
    category: 'dokumenter',
    categoryLabel: 'Dokumenter Khusus Haji',
    youtubeId: '5qap5aO4i9A',
    youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
    thumbnailUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    duration: '08:45 Min',
    resolution: '4K Ultra HD',
    batchOrEvent: 'Musim Haji 1445 H / 2024 M',
    releaseDate: 'Juni 2024',
    description: 'Dokumentasi sinematik perjalanan jemaah Haji Khusus Furoda Golden Tour Haramain saat wukuf di Arafah, bermalam di Muzdalifah, dan melontar Jumrah di Mina. Menampilkan fasilitas Maktab VIP ber-AC, prasmanan kuliner Indonesia 24 jam, serta bimbingan manasik intensif.',
    viewsCount: '62,800+',
    highlights: ['Maktab AC Khusus Armuzna', 'Prasmanan Khas Indonesia 24 Jam', 'Pendampingan Tim Medis Mandiri'],
    featured: true
  },
  {
    id: 'vid-doc-2',
    title: 'Dokumenter Umrah Executive Syawal: Thawaf & Sa\'i Syahdu',
    subtitle: 'Momen Mabrur & Kebersamaan Jemaah di Pelataran Ka\'bah',
    category: 'dokumenter',
    categoryLabel: 'Dokumenter Umrah',
    youtubeId: 'LXb3EKWsInQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    embedUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=1200&q=80',
    duration: '06:20 Min',
    resolution: '1080p Full HD',
    batchOrEvent: 'Rombongan Umrah Syawal Batch 04',
    releaseDate: 'April 2024',
    description: 'Merekam linangan air mata bahagia jemaah saat pertama kali melangkahkan kaki di pelataran Ka\'bah dan berdoa di Multazam. Dilengkapi bimbingan doa jarak dekat oleh Muthawwif utama.',
    viewsCount: '38,100+',
    highlights: ['Bimbingan Thawaf Ring 1', 'Fast Track Imigrasi Airport', 'Bus Bus VIP Executive']
  },
  {
    id: 'vid-fas-1',
    title: 'Pengalaman Kereta Cepat Haramain Express & Hotel Ring 1',
    subtitle: 'Tur Fasilitas Mewah Madinah ke Makkah Kecepatan 300 km/jam',
    category: 'fasilitas',
    categoryLabel: 'Fasilitas & Transportasi',
    youtubeId: 'YQHsXMglC9A',
    youtubeUrl: 'https://www.youtube.com/watch?v=YQHsXMglC9A',
    embedUrl: 'https://www.youtube.com/embed/YQHsXMglC9A',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    duration: '04:15 Min',
    resolution: '1080p Full HD',
    batchOrEvent: 'Executive Haramain Experience',
    releaseDate: 'Februari 2024',
    description: 'Penjelasan lengkap kemudahan akses transportasi Kereta Cepat Haramain dari Stasiun Madinah menuju Makkah dalam waktu 2 jam 15 menit, serta akses kamar hotel berbintang yang langsung menghadap pelataran Masjidil Haram.',
    viewsCount: '29,400+',
    highlights: ['Kereta Cepat 300km/jam', 'Hotel Dar Al Eiman Royal', 'Handling Bagasi Otomatis']
  },
  {
    id: 'vid-man-1',
    title: 'Panduan Praktis Manasik Umrah & Ziarah Raudhah Madinah',
    subtitle: 'Tata Cara Ibadah Sesuai Sunnah Rasulullah SAW',
    category: 'manasik',
    categoryLabel: 'Bimbingan Manasik',
    youtubeId: 'kXYiU_JCYtU',
    youtubeUrl: 'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    embedUrl: 'https://www.youtube.com/embed/kXYiU_JCYtU',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565552643954-1a4be7aa0fc8?auto=format&fit=crop&w=1200&q=80',
    duration: '07:30 Min',
    resolution: '4K Ultra HD',
    batchOrEvent: 'Edukasi Syariah Jemaah',
    releaseDate: 'Januari 2024',
    description: 'Video edukasi manasik interaktif yang dibawakan oleh Pembimbing Syariah PT. Golden Tour Haramain. Menjelaskan rukun, wajib, tata cara ihram di Miqat, serta kiat mudah memasuki Raudhah Madinah.',
    viewsCount: '51,900+',
    highlights: ['Edukasi Sunnah Shahih', 'Panduan Tasreh Raudhah', 'Kiat Ibadah Khusyuk']
  },
  {
    id: 'vid-doc-3',
    title: 'Dokumenter Ziarah Bersejarah Makkah & Jabal Rahmah',
    subtitle: 'Napak Tilas Peradaban Islam & Doa Bersama di Padang Arafah',
    category: 'dokumenter',
    categoryLabel: 'Dokumenter Ziarah',
    youtubeId: '3JZ_D3ELwOQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    embedUrl: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80',
    duration: '05:50 Min',
    resolution: '1080p Full HD',
    batchOrEvent: 'Historical City Tour Group A',
    releaseDate: 'Maret 2024',
    description: 'Liputan dokumenter kunjungan jemaah ke situs bersejarah di Makkah seperti Jabal Thawr, Jabal Nur, Padang Arafah, Jabal Rahmah, dan Mina dipandu ustaz narator yang interaktif.',
    viewsCount: '23,700+',
    highlights: ['Napak Tilas Peradaban Islam', 'Penjelasan Sirah Nabawiyah', 'Bus AC Exclusive']
  }
];

export const VideoProfileShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'semua' | 'profil' | 'dokumenter' | 'manasik' | 'fasilitas'>('semua');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredVideos = VIDEO_CATALOG.filter(v => activeTab === 'semua' || v.category === activeTab);

  const featuredVideo = VIDEO_CATALOG.find(v => v.id === 'vid-prof-1') || VIDEO_CATALOG[0];

  return (
    <section 
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-20 relative overflow-hidden bg-cover bg-center bg-no-repeat text-white"
      style={{ backgroundImage: `url('/testimoni-bg.png')` }}
      id="video-dokumenter"
    >
      {/* Soft dark luxury overlay matching testimonials & departure gallery */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#011d15]/85 via-[#01251a]/80 to-[#01140d]/90 pointer-events-none" />

      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 shadow-sm">
            <Film className="w-4 h-4 text-[#D4AF37]" />
            <span>Galeri Sinematik YouTube & Dokumen Suci</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-sm">
            Video Profil & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E6CA65]">Dokumenter Khusus</span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
            Saksikan tayangan otentik perjalanan ibadah jemaah, tur fasilitas hotel & Kereta Cepat Haramain, serta bimbingan syariat lengkap langsung dari kanal resmi YouTube <strong className="text-white font-semibold">PT. Golden Tour Haramain</strong>.
          </p>
        </div>

        {/* Hero Featured Main Video Spotlight Player */}
        <div className="mb-14 rounded-3xl overflow-hidden border-2 border-[#D4AF37]/40 bg-gradient-to-r from-[#022e23] via-[#01241b] to-[#011812] shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-6 sm:p-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Embed Player or Interactive YouTube Thumbnail */}
            <div className="lg:col-span-7">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl group bg-black">
                <iframe
                  className="w-full h-full"
                  src={`${featuredVideo.embedUrl}?rel=0`}
                  title={featuredVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Right Column: Video Details & YouTube Actions */}
            <div className="lg:col-span-5 space-y-4 text-stone-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#011710] font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Play className="w-4 h-4 fill-[#011710]" />
                  <span>Sorotan Utama</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#011710]/80 text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-semibold">
                  {featuredVideo.resolution}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{featuredVideo.duration}</span>
                </span>
              </div>

              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-snug">
                {featuredVideo.title}
              </h3>

              <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed">
                {featuredVideo.description}
              </p>

              {/* Highlights */}
              <div className="pt-2 space-y-2">
                {featuredVideo.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedVideo(featuredVideo)}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#011710] font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-[#011710]" />
                  <span>Putar Layar Penuh</span>
                </button>

                <a
                  href={featuredVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#CC0000] text-white font-bold text-xs sm:text-sm shadow-lg hover:bg-[#E60000] transition-all flex items-center gap-2"
                >
                  <Play className="w-4.5 h-4.5 fill-white" />
                  <span>Buka di YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Filter Tabs & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">
            {[
              { id: 'semua', label: '🎬 Semua Video', count: VIDEO_CATALOG.length },
              { id: 'profil', label: '🏢 Profil Resmi', count: VIDEO_CATALOG.filter(v => v.category === 'profil').length },
              { id: 'dokumenter', label: '🕌 Dokumenter Khusus', count: VIDEO_CATALOG.filter(v => v.category === 'dokumenter').length },
              { id: 'manasik', label: '📖 Panduan Manasik', count: VIDEO_CATALOG.filter(v => v.category === 'manasik').length },
              { id: 'fasilitas', label: '🚆 Fasilitas & Transport', count: VIDEO_CATALOG.filter(v => v.category === 'fasilitas').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
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

          {/* Grid vs Table Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#02251c] border border-[#D4AF37]/25 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#D4AF37] text-[#011710]' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tampilan Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-[#D4AF37] text-[#011710]' : 'text-stone-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Tabel Elegan</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: GRID VIEW (Embedded YouTube Video Cards) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredVideos.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-b from-[#022b1f] via-[#02251c] to-[#011812] rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Embedded YouTube Player Direct Embed */}
                <div className="relative aspect-video bg-black overflow-hidden border-b border-[#D4AF37]/20">
                  <iframe
                    className="w-full h-full"
                    src={`${item.embedUrl}?rel=0`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>

                  {/* Top Badge Overlay */}
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#011710]/90 border border-[#D4AF37]/30 text-[#F3E5AB] text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
                    <Play className="w-3 h-3 text-[#CC0000] fill-[#CC0000]" />
                    <span>{item.categoryLabel}</span>
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-stone-700 text-stone-200 text-[10px] font-mono pointer-events-none">
                    {item.duration}
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span className="text-[#D4AF37] font-medium">{item.batchOrEvent}</span>
                      <span className="text-emerald-400 font-semibold">{item.resolution}</span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-white group-hover:text-[#F3E5AB] transition-colors leading-snug mb-2">
                      {item.title}
                    </h4>

                    <p className="text-stone-300 text-xs leading-relaxed font-light line-clamp-2 mb-3">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Card Bottom YouTube Links */}
                  <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedVideo(item)}
                      className="inline-flex items-center gap-1 text-[#F3E5AB] hover:text-[#D4AF37] text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#F3E5AB]" />
                      <span>Putar Di Modal</span>
                    </button>

                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#FF4D4D] hover:text-white text-xs font-semibold transition-colors"
                      title="Tonton Langsung Di YouTube"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}

        {/* View Mode 2: ELEGANT & PROFESSIONAL SUMMARY TABLE */}
        {viewMode === 'table' && (
          <div className="mb-16 rounded-2xl overflow-hidden border border-[#D4AF37]/35 bg-[#02251c]/90 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
            <div className="p-4 sm:p-6 bg-[#011811] border-b border-[#D4AF37]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F3E5AB]">
                  Katalog Resmi Video Profil & Dokumenter YouTube
                </h3>
                <p className="text-stone-400 text-xs">
                  Daftar lengkap dokumentasi perjalanan ibadah dan video profil PT. Golden Tour Haramain
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold font-mono">
                Total {filteredVideos.length} Video
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 bg-[#011f16] text-[#D4AF37] text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Pemain YouTube</th>
                    <th className="py-3.5 px-4 sm:px-6">Judul Video & Subtitle</th>
                    <th className="py-3.5 px-4 sm:px-6">Kategori</th>
                    <th className="py-3.5 px-4 sm:px-6">Durasi & Kualitas</th>
                    <th className="py-3.5 px-4 sm:px-6">Tahun / Acara</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Tautan YouTube Direct</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/15 text-xs text-stone-200">
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-[#033327]/60 transition-colors">
                      
                      {/* Thumbnail Player Mini */}
                      <td className="py-4 px-4 sm:px-6 w-44">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-[#D4AF37]/30 bg-black group shadow-sm">
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#011710] flex items-center justify-center shadow-md">
                              <Play className="w-4 h-4 ml-0.5 fill-[#011710]" />
                            </div>
                          </button>
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-sm">
                        <h4 className="font-serif font-bold text-white text-sm leading-snug mb-1">
                          {video.title}
                        </h4>
                        <p className="text-stone-400 text-[11px] line-clamp-1 font-light">
                          {video.subtitle}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-[#011811] border border-[#D4AF37]/25 text-[#F3E5AB] font-semibold text-[11px]">
                          {video.categoryLabel}
                        </span>
                      </td>

                      {/* Duration & Resolution */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-mono text-emerald-400 font-semibold">{video.duration}</div>
                        <div className="text-stone-400 text-[10px]">{video.resolution}</div>
                      </td>

                      {/* Batch / Event */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-stone-300">
                        {video.batchOrEvent}
                      </td>

                      {/* YouTube Links & Direct Player */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="px-3 py-1.5 rounded-full bg-[#D4AF37] text-[#011710] font-bold text-[11px] hover:bg-[#F3E5AB] transition-colors shadow-sm flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-[#011710]" />
                            <span>Putar</span>
                          </button>

                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-full bg-[#CC0000] text-white font-bold text-[11px] hover:bg-[#E60000] transition-colors shadow-sm flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>YouTube</span>
                          </a>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Video Modal Player */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#011710] border border-[#D4AF37]/50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/80 text-white hover:text-[#D4AF37] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Info inside Modal */}
              <div className="mb-4 pr-10">
                <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold mb-1">
                  <Play className="w-4 h-4 text-[#CC0000] fill-[#CC0000]" />
                  <span>{selectedVideo.categoryLabel} • {selectedVideo.duration} • {selectedVideo.resolution}</span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-[#F3E5AB]">
                  {selectedVideo.title}
                </h3>
                <p className="text-stone-400 text-xs sm:text-sm font-light mt-1">
                  {selectedVideo.subtitle}
                </p>
              </div>

              {/* YouTube iFrame Player Embed */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/30 bg-black shadow-2xl mb-4">
                <iframe
                  className="w-full h-full"
                  src={`${selectedVideo.embedUrl}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Modal Footer Link */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-300">
                <p className="font-light">
                  Penonton: <strong className="text-white font-semibold">{selectedVideo.viewsCount} Viewers</strong> | Event: <strong className="text-[#D4AF37]">{selectedVideo.batchOrEvent}</strong>
                </p>

                <a
                  href={selectedVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#CC0000] text-white font-bold hover:bg-[#E60000] transition-colors flex items-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Tonton di Aplikasi YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default VideoProfileShowcase;
