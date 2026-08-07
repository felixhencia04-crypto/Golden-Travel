import React, { useState } from 'react';
import { 
  Star, 
  Quote, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  ThumbsUp, 
  Search, 
  MessageCircle, 
  Award, 
  X, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  avatar: string;
  packageTaken: string;
  rating: number;
  departurePeriod: string;
  category: 'umrah-exec' | 'umrah-plus' | 'haji-khusus' | 'keluarga-lansia';
  highlight: string;
  story: string;
  tags: string[];
  verified: boolean;
  videoUrl?: string;
  videoThumbnail?: string;
  helpfulCount: number;
}

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'testi-1',
    name: 'Drs. H. M. Ridwan, M.Si & Hj. Endang S.',
    role: 'Jemaah Umrah Executive Bintang 5',
    city: 'Jakarta Selatan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Paket Umrah VVIP Dar Al Eiman Royal 9 Hari',
    rating: 5,
    departurePeriod: 'Keberangkatan Rajab 1445 H (2024)',
    category: 'keluarga-lansia',
    highlight: 'Kenyamanan Lansia Nomor Satu, Hotel Benar-Benar Depan Pelataran Masjidil Haram!',
    story: 'Saya membawa Ibu saya yang berusia 72 tahun dan menggunakan kursi roda. Kekhawatiran awal kami sirnah seketika saat tiba di Makkah. Tim pendorong kursi roda dan Muthawwif dari PT. Golden Tour Haramain sangat sigap, sabar, dan penuh kasih sayang membantu Ibu dari awal hingga selesai Thawaf dan Sai. Hotel Dar Al Eiman Royal hanya berjarak beberapa langkah dari pelataran utama Masjidil Haram, sangat memudahkan Ibu untuk shalat berjamaah 5 waktu di masjid tanpa lelah. Makanan khas Indonesia yang disediakan juga sangat cocok dengan lidah kami.',
    tags: ['Ring 1 Masjidil Haram', 'Pelayanan Kursi Roda', 'Muthawwif Alumni Madinah', 'Makanan Nusantara'],
    verified: true,
    videoThumbnail: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80',
    helpfulCount: 218
  },
  {
    id: 'testi-2',
    name: 'Hj. Ratna Kusumawardhani & Suami',
    role: 'Jemaah Haji Khusus Furoda VIP',
    city: 'Surabaya, Jawa Timur',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Haji Khusus Furoda Direct Flight Saudi Arabian',
    rating: 5,
    departurePeriod: 'Musim Haji 1445 H (2024)',
    category: 'haji-khusus',
    highlight: 'Fasilitas Maktab Arafah & Mina Sangat Mewah, Ibadah Menjadi Sangat Khusyuk.',
    story: 'Alhamdulillah, keputusan mempercayakan ibadah Haji Khusus bersama PT. Golden Tour Haramain adalah langkah terbaik keluarga kami. Tenda ber-AC di Arafah dan Mina sangat nyaman dengan kasur empuk, kamar mandi bersih, serta sajian kuliner yang melimpah 24 jam. Pembimbing ibadah Ustaz senior membimbing kami dengan dalil shahih sesuai Sunnah, membuat tangis haru pecah saat wukuf di Arafah. Kepastian visa Furoda dan koordinasi lapangan tanpa kendala sama sekali.',
    tags: ['Tenda AC Arafah Mina', 'Visa Furoda Resmi', 'Kereta Cepat Haramain', 'Bimbingan Syariah'],
    verified: true,
    helpfulCount: 184
  },
  {
    id: 'testi-3',
    name: 'Bapak dr. H. Ahmad Fauzi, Sp.OT',
    role: 'Jemaah Umrah Plus Turki & Cappadocia',
    city: 'Bandung, Jawa Barat',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Umrah Plus Turki Cappadocia & Bosphorus Cruise 12 Hari',
    rating: 5,
    departurePeriod: 'Keberangkatan Musim Dingin (Desember 2023)',
    category: 'umrah-plus',
    highlight: 'Kombinasi Ibadah Khusyuk di Tanah Suci dan Tour Sejarah Islam yang Luar Biasa.',
    story: 'Perjalanan 12 hari yang sangat berkesan bagi saya dan istri. Di Makkah & Madinah kami fokus ibadah dengan fasilitas hotel bintang 5. Kemudian dilanjutkan City Tour ke Istanbul & Cappadocia, Turki. Pemandu wisata di Turki sangat menguasai sejarah peradaban Utsmani. Koordinasi penerbangan Saudia Airlines sangat tepat waktu dan bagasi diurus dengan sangat rapi oleh tim Golden Tour Haramain.',
    tags: ['Turki Cappadocia', 'Saudia Airlines Direct Flight', 'Hotel Bintang 5', 'Tour Guide Berpengalaman'],
    verified: true,
    videoThumbnail: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=600&q=80',
    helpfulCount: 159
  },
  {
    id: 'testi-4',
    name: 'Keluarga Besar Ir. H. Bambang Suherman',
    role: 'Jemaah Umrah Reguler Bintang 4 (12 Orang)',
    city: 'Semarang, Jawa Tengah',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Umrah Reguler Bintang 4 Syawal (Group Rombongan)',
    rating: 5,
    departurePeriod: 'Keberangkatan Syawal 1445 H',
    category: 'umrah-exec',
    highlight: 'Harga Sangat Sepadan Dengan Fasilitas Mewah & Bimbingan Ibadah Yang Telaten.',
    story: 'Kami mendaftarkan rombongan keluarga besar sebanyak 12 orang. Pelayanan dari tim kantor pusat sejak pendaftaran, pembuatan paspor, hingga manasik umrah di hotel berbintang sangat profesional. Saat di Madinah dan Makkah, Kereta Cepat Haramain Makkah-Madinah membuat perjalanan kami hanya 2 jam dengan sangat tenang. Terima kasih PT. Golden Tour Haramain atas komitmen luar biasanya!',
    tags: ['Grup Rombongan Keluarga', 'Kereta Cepat Haramain', 'Manasik Intensif', 'Fast Track Airport'],
    verified: true,
    helpfulCount: 132
  },
  {
    id: 'testi-5',
    name: 'Ibu Hj. Siti Nurjanah, S.Pd',
    role: 'Jemaah Umrah Lailatul Qadr Ramadhan',
    city: 'Medan, Sumatera Utara',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Umrah Khusus 10 Hari Terakhir Ramadhan (Iktikaf Haram)',
    rating: 5,
    departurePeriod: 'Ramadhan 1445 H',
    category: 'umrah-exec',
    highlight: 'Iktikaf 10 Hari Terakhir Ramadhan di Masjidil Haram Berjalan Sangat Syahdu.',
    story: 'Impian merasakan iktikaf Lailatul Qadr di Makkah terwujud dengan sangat sempurna. Golden Tour Haramain menyediakan sahur dan buka puasa dengan sajian bernutrisi tinggi, serta penginapan yang sangat dekat dari bab (pintu) utama Masjidil Haram. Muthawwif membantu kami membagi waktu ibadah dan istirahat dengan sangat proporsional.',
    tags: ['Iktikaf Ramadhan', 'Buka & Sahur Hotel Ring 1', 'Muthawwif Standby 24 Jam', 'Privilege Transport'],
    verified: true,
    helpfulCount: 195
  },
  {
    id: 'testi-6',
    name: 'H. Andi Muhammad Arief & Istri',
    role: 'Jemaah Umrah Plus Aqsa & Jordan',
    city: 'Makassar, Sulawesi Selatan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    packageTaken: 'Umrah Plus Jejak Para Nabi Aqsa Jordan Makkah Madinah',
    rating: 5,
    departurePeriod: 'Maret 2024',
    category: 'umrah-plus',
    highlight: 'Pengalaman Spiritual Mengunjungi 3 Masjid Suci Utama Umat Islam.',
    story: 'Sungguh pengalaman hidup yang tak terlupakan bisa shalat di Masjidil Aqsa, Masjid Nabawi, dan Masjidil Haram dalam satu rangkaian perjalanan. Legalitas visa border Jordan-Palestina diurus sangat cepat tanpa hambatan oleh tim Golden Tour Haramain. Semua akomodasi hotel Bintang 5 sangat terjamin aman dan nyaman.',
    tags: ['Masjidil Aqsa & Jordan', 'Visa Kompleks Terjamin', 'Hotel Bintang 5', 'Pendampingan Keamanan'],
    verified: true,
    helpfulCount: 176
  }
];

export const TestimonialsShowcase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTesti, setSelectedTesti] = useState<Testimonial | null>(null);
  const [helpfulLiked, setHelpfulLiked] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'semua', label: '🌟 Semua Ulasan Jemaah', count: TESTIMONIALS_DATA.length },
    { id: 'umrah-exec', label: '🕋 Umrah Executive & VIP', count: TESTIMONIALS_DATA.filter(t => t.category === 'umrah-exec').length },
    { id: 'umrah-plus', label: '✈️ Umrah Plus Turki & Aqsa', count: TESTIMONIALS_DATA.filter(t => t.category === 'umrah-plus').length },
    { id: 'haji-khusus', label: '🕌 Haji Khusus & Furoda', count: TESTIMONIALS_DATA.filter(t => t.category === 'haji-khusus').length },
    { id: 'keluarga-lansia', label: '👵 Jemaah Lansia & Keluarga', count: TESTIMONIALS_DATA.filter(t => t.category === 'keluarga-lansia').length },
  ];

  const filteredTestimonials = TESTIMONIALS_DATA.filter(item => {
    const matchesCategory = activeCategory === 'semua' || item.category === activeCategory;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageTaken.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleHelpful = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulLiked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section 
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 lg:px-20 relative overflow-hidden bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: `url('/testimoni-bg.png')` }}
      id="testimoni"
    >
      {/* Soft dark luxury gradient overlay over background image for maximum contrast & atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#011d15]/85 via-[#01251a]/80 to-[#01140d]/90 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-xs sm:text-sm font-semibold tracking-wider uppercase mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Kisah Real & Ulasan Otentik</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-sm">
            Apakah Kata Mereka Tentang <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#E6CA65]">Layanan Kami?</span>
          </h2>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg leading-relaxed font-light max-w-2xl mx-auto">
            Pengalaman nyata dari para jemaah yang telah mempercayakan perjalanan ibadah suci mereka kepada <strong className="text-white font-semibold">PT. Golden Tour Haramain</strong>.
          </p>
        </div>

        {/* Key Trust Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 p-4 sm:p-6 rounded-2xl bg-[#022b1f]/90 border border-[#D4AF37]/30 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/20 last:border-r-0">
            <div className="flex items-center gap-1 text-[#D4AF37] font-bold text-xl sm:text-2xl font-serif">
              <span>4.98</span>
              <Star className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
            </div>
            <p className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">2,850+ Ulasan Otentik</p>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/20 last:border-r-0">
            <div className="text-[#34D399] font-bold text-xl sm:text-2xl font-serif">100%</div>
            <p className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Garansi Keberangkatan</p>
          </div>

          <div className="flex flex-col items-center text-center p-2 border-r border-[#D4AF37]/20 last:border-r-0">
            <div className="text-[#F3E5AB] font-bold text-xl sm:text-2xl font-serif">99.6%</div>
            <p className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Kepuasan Jemaah</p>
          </div>

          <div className="flex flex-col items-center text-center p-2">
            <div className="text-[#D4AF37] font-bold text-base sm:text-lg font-serif">Izin PPIU & PIHK</div>
            <p className="text-stone-300 text-xs sm:text-sm font-medium mt-0.5">Kemenag RI Terverifikasi</p>
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="space-y-4 mb-10">
          {/* Search Input */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            <input 
              type="text" 
              placeholder="Cari ulasan berdasarkan nama, kota, atau kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#02251c]/90 border border-[#D4AF37]/35 text-white placeholder-stone-400 text-xs sm:text-sm shadow-inner focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                  activeCategory === cat.id
                    ? 'bg-[#D4AF37] text-[#011710] border-[#D4AF37] font-bold shadow-[0_4px_15px_rgba(212,175,55,0.3)] scale-105'
                    : 'bg-[#02251c]/80 text-stone-300 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#033327]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeCategory === cat.id ? 'bg-[#011710] text-[#F3E5AB]' : 'bg-[#011710]/60 text-[#D4AF37]'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 bg-[#02251c]/90 rounded-2xl border border-[#D4AF37]/30 shadow-md">
            <p className="text-stone-200 text-sm sm:text-base font-medium">Tidak ada ulasan jemaah yang cocok dengan pencarian Anda.</p>
            <button 
              onClick={() => { setActiveCategory('semua'); setSearchQuery(''); }}
              className="mt-3 text-[#D4AF37] text-xs font-bold underline hover:text-white"
            >
              Tampilkan Semua Ulasan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((item) => {
              const isLiked = !!helpfulLiked[item.id];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-b from-[#02291f] via-[#02251c] to-[#011812] rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/30 hover:border-[#D4AF37]/70 shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Decorative Background Quote Icon */}
                  <Quote className="w-12 h-12 text-[#D4AF37]/10 absolute -top-1 -right-1 pointer-events-none group-hover:text-[#D4AF37]/25 transition-colors" />

                  <div>
                    {/* Header: Avatar, Name & Verification Badge */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative shrink-0">
                        <img 
                          src={item.avatar} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]"
                        />
                        {item.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-[#10B981] text-white p-0.5 rounded-full ring-2 ring-[#02251c]" title="Verifikasi Jemaah Resmi PPIU">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-[#10B981] text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-[#F3E5AB] transition-colors">
                            {item.name}
                          </h4>
                        </div>
                        <p className="text-[#D4AF37] text-xs font-semibold truncate">{item.role}</p>
                        <div className="flex items-center gap-2 text-[11px] text-stone-300 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#34D399]" />
                            {item.city}
                          </span>
                          <span>•</span>
                          <span className="text-[#34D399] font-medium">{item.departurePeriod}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Stars & Package Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3 bg-[#011811] p-2 rounded-lg border border-[#D4AF37]/25">
                      <div className="flex gap-0.5">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#F3E5AB] font-bold truncate max-w-[180px]" title={item.packageTaken}>
                        {item.packageTaken}
                      </span>
                    </div>

                    {/* Review Highlight */}
                    <h5 className="font-serif font-bold text-sm text-[#F3E5AB] leading-snug mb-2 line-clamp-2">
                      "{item.highlight}"
                    </h5>

                    {/* Shortened Story Narrative */}
                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4 font-light line-clamp-4 italic">
                      "{item.story}"
                    </p>

                    {/* Key Highlight Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#011811] text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => setSelectedTesti(item)}
                      className="inline-flex items-center gap-1 text-[#F3E5AB] hover:text-[#D4AF37] font-bold transition-colors group/btn"
                    >
                      <span>Baca Kisah Lengkap</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={(e) => toggleHelpful(item.id, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        isLiked 
                          ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40' 
                          : 'bg-[#011811] text-stone-300 hover:text-white border border-[#D4AF37]/25 hover:bg-[#033327]'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-[#34D399]' : ''}`} />
                      <span>Bermanfaat ({item.helpfulCount + (isLiked ? 1 : 0)})</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA Bottom Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#02382a] via-[#012b20] to-[#011e16] border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Garansi 100% Layanan Terbaik</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
              Siap Menjadi Bagian Dari Kisah Bahagia Baitullah Berikutnya?
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm font-light">
              Konsultasikan rencana ibadah Umrah atau Haji Anda bersama konsultan profesional PT. Golden Tour Haramain secara gratis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10">
            <a 
              href="https://wa.me/6281234567890?text=Assalamu%27alaikum,%20saya%20tertarik%20dengan%20paket%20Umrah/Haji%20Golden%20Tour%20Haramain.%20Bisa%20bantu%20jelaskan%20detailnya?"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#011710] font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi Bebas Biaya</span>
            </a>
          </div>
        </div>

      </div>

      {/* Modal Detail Testimonial */}
      <AnimatePresence>
        {selectedTesti && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-[#032d20] to-[#011710] border border-[#D4AF37]/50 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTesti(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#011710] text-stone-400 hover:text-white hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={selectedTesti.avatar} 
                  alt={selectedTesti.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-[#F3E5AB]">
                      {selectedTesti.name}
                    </h3>
                    {selectedTesti.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#34D399] text-[10px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Terverifikasi PPIU
                      </span>
                    )}
                  </div>
                  <p className="text-[#D4AF37] text-xs sm:text-sm font-medium">{selectedTesti.role}</p>
                  <p className="text-stone-400 text-xs">{selectedTesti.city} • {selectedTesti.departurePeriod}</p>
                </div>
              </div>

              {/* Package Badge */}
              <div className="p-3 rounded-xl bg-[#011a12] border border-[#D4AF37]/20 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-stone-400 font-semibold block">Paket Yang Diambil:</span>
                  <span className="text-xs sm:text-sm text-[#F3E5AB] font-bold">{selectedTesti.packageTaken}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {[...Array(selectedTesti.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
              </div>

              {/* Full Highlight */}
              <blockquote className="font-serif font-bold text-base sm:text-lg text-white mb-4 italic pl-4 border-l-4 border-[#D4AF37]">
                "{selectedTesti.highlight}"
              </blockquote>

              {/* Full Narrative */}
              <div className="space-y-3 text-stone-300 text-xs sm:text-sm leading-relaxed font-light mb-6">
                <p>{selectedTesti.story}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {selectedTesti.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/30 text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Footer CTA inside Modal */}
              <div className="pt-4 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>Ulasan Resmi Jemaah PT. Golden Tour Haramain</span>
                </div>

                <a
                  href="https://wa.me/6281234567890?text=Assalamu%27alaikum,%20saya%20membaca%20ulasan%20dari%20jemaah%20Golden%20Tour%20Haramain%20dan%20tertarik%20untuk%20konsultasi."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#011710] font-bold text-xs hover:bg-[#F3E5AB] transition-colors text-center"
                >
                  Tanyakan Paket Serupa
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TestimonialsShowcase;
