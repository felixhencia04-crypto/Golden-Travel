import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, Award, Briefcase, Building2, Search, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Legalitas() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0A110D]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[#0A110D]"></div>
        {/* Subtle dot pattern background matching the screenshot */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-8">
              <Sparkles className="w-4 h-4" />
              Legalitas & Sertifikasi Resmi
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white mb-4 leading-tight">
              Keamanan & Kenyamanan Anda <br className="hidden md:block" />
              <span className="text-[#D4AF37]">Adalah Prioritas Utama</span>
            </h1>
            <p className="text-white/60 font-light text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-6">
              PT. Golden Tour Haramain telah terdaftar secara resmi dan diawasi langsung oleh Kementerian Agama Republik Indonesia. Kami berkomitmen memberikan kepastian jadwal keberangkatan tanpa keraguan.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-grow py-20 bg-[#0A110D] relative z-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              className="bg-[#0f1712] rounded-2xl p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="text-[#D4AF37] mb-8">
                <ShieldCheck className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="mt-auto">
                <h3 className="font-serif text-xl font-medium text-white mb-4 text-center">Izin Penyelenggara Umrah (PPIU)</h3>
                <p className="text-white/50 text-sm text-center leading-relaxed font-light">
                  SK Kemenag RI No. 123 Tahun 2024
                </p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.1 }} 
              className="bg-[#0f1712] rounded-2xl p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="text-[#D4AF37] mb-8">
                <Award className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="mt-auto">
                <h3 className="font-serif text-xl font-medium text-white mb-4 text-center">Izin Penyelenggara Haji Khusus (PIHK)</h3>
                <p className="text-white/50 text-sm text-center leading-relaxed font-light">
                  SK Kemenag RI No. 456 Tahun 2024
                </p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.2 }} 
              className="bg-[#0f1712] rounded-2xl p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="text-[#D4AF37] mb-8">
                <Briefcase className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="mt-auto">
                <h3 className="font-serif text-xl font-medium text-white mb-4 text-center">Keanggotaan Asosiasi</h3>
                <p className="text-white/50 text-sm text-center leading-relaxed font-light">
                  Terdaftar resmi sebagai anggota AMPHURI / HIMPUH.
                </p>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.3 }} 
              className="bg-[#0f1712] rounded-2xl p-8 border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="text-[#D4AF37] mb-8">
                <Building2 className="w-10 h-10" strokeWidth={1.5} />
              </div>
              <div className="mt-auto">
                <h3 className="font-serif text-xl font-medium text-white mb-4 text-center">Legalitas Perusahaan</h3>
                <p className="text-white/50 text-sm text-center leading-relaxed font-light">
                  NIB & Akta Pendirian Perusahaan Tersertifikasi.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Section: Komitmen Keamanan */}
          <div className="bg-gradient-to-br from-[#0c1610] to-[#0A110D] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="font-serif text-3xl font-normal text-white mb-8">Mengapa Legalitas Kami Penting Untuk Anda?</h2>
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <span className="text-[#D4AF37] font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-lg">Perlindungan Dana Jamaah</h4>
                      <p className="text-white/50 text-sm leading-relaxed font-light">Sebagai travel resmi, dana Anda terpantau oleh regulasi Kemenag, terhindar dari praktik penipuan atau penyalahgunaan dana.</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <span className="text-[#D4AF37] font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-lg">Kepastian Keberangkatan & Layanan</h4>
                      <p className="text-white/50 text-sm leading-relaxed font-light">Kami terikat pada Standar Pelayanan Minimal (SPM) Kemenag untuk tiket, visa, akomodasi, dan bimbingan ibadah.</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                      <span className="text-[#D4AF37] font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2 text-lg">Bimbingan Sesuai Sunnah</h4>
                      <p className="text-white/50 text-sm leading-relaxed font-light">Dibimbing oleh muthawwif dan asatidzah bersertifikat yang diakui kredibilitas keilmuannya.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A110D]/80 backdrop-blur-md rounded-2xl p-10 border border-white/5 text-center shadow-2xl">
                <Search className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl font-normal text-white mb-4">Verifikasi Legalitas Kami</h3>
                <p className="text-white/50 text-sm mb-10 leading-relaxed font-light">
                  Anda dapat mengecek status legalitas PT. Golden Tour Haramain secara langsung melalui sistem resmi Siskopatuh Kemenag RI.
                </p>
                <a href="#" className="inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] hover:bg-[#c5a02e] text-[#0A110D] font-bold rounded-full transition-all duration-300 w-full shadow-[0_0_20px_rgba(212,175,55,0.15)] text-sm uppercase tracking-wider">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Cek di Web Kemenag
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
