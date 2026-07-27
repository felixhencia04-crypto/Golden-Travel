import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { articles } from '../data/homeData';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-matcha-50">
      <Navbar />

      <main className="flex-grow pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-gold-600 font-semibold tracking-widest text-sm uppercase mb-3 block">Blog & Panduan</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-matcha-950 mb-6">Kajian & Artikel Islami</h1>
            <div className="w-24 h-1 bg-gold-400 mx-auto rounded-full mb-8"></div>
            <p className="text-gray-600 font-light text-lg max-w-2xl mx-auto">
              Perdalam wawasan Anda tentang ibadah Umroh dan Haji, sejarah Islam, serta tips perjalanan ke Tanah Suci.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((art, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={art.id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="h-56 overflow-hidden relative">
                  <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-matcha-900 shadow-sm">
                    {art.date}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-serif text-2xl font-bold text-matcha-950 mb-3 line-clamp-2 group-hover:text-gold-600 transition-colors">{art.title}</h3>
                  <p className="text-gray-600 font-light text-sm mb-6 line-clamp-3 leading-relaxed">{art.excerpt}</p>
                  <Link to="#" className="font-button text-matcha-700 font-medium text-sm flex items-center hover:text-gold-600 transition-colors">
                    Baca Selengkapnya <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
