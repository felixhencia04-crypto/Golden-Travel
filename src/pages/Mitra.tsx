import { useLogo } from '../utils/logo';
import { toast } from 'sonner';
import { DIREKTUR_PHOTO_DATA } from '../assets/direkturPhotoData';
const direkturImg = DIREKTUR_PHOTO_DATA;
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Briefcase, Building, FileText, Phone, Mail, CheckCircle2, ArrowRight, TrendingUp, Users, Clock, Compass, Target, Heart, Award, Star, BookOpen, Handshake, Plane, DollarSign, Crown, MessageSquare, Quote } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Mitra() {
  const logoImg = useLogo();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'register'>('info');

  return (
    <div className="min-h-screen font-sans bg-[#0f1712] flex flex-col">
      <Navbar />
      
      <style dangerouslySetInnerHTML={{__html: `
        /* --- HERO SECTION KEMITRAAN --- */
        .mitra-hero-section {
            position: relative;
            /* Warna dasar Deep Matcha */
            background-color: #0b1710;
            /* Efek Spotlight di tengah */
            background-image: radial-gradient(circle at 50% 40%, rgba(35, 71, 46, 0.8) 0%, rgba(11, 23, 16, 1) 70%);
            padding: 8rem 5% 6rem;
            text-align: center;
            overflow: hidden;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        /* Pola Geometris Lembut di Background */
        .mitra-pattern {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(rgba(212, 175, 55, 0.08) 1px, transparent 1px);
            background-size: 40px 40px;
            opacity: 0.7;
            pointer-events: none;
            z-index: 1;
        }

        .mitra-hero-container {
            position: relative;
            z-index: 2;
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .mitra-badge-top {
            display: inline-block;
            background: rgba(212, 175, 55, 0.1);
            color: #D4AF37;
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 1px;
            border: 1px solid rgba(212, 175, 55, 0.3);
            margin-bottom: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .mitra-title {
            font-family: 'Playfair Display', serif;
            font-size: 3.8rem;
            color: #ffffff;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .mitra-title .gold-text {
            color: #D4AF37;
        }

        .mitra-desc {
            color: #b5c7bc; /* Hijau matcha terang agar nyaman dibaca */
            font-size: 1.15rem;
            line-height: 1.7;
            max-width: 750px;
            margin-bottom: 3rem;
        }

        .mitra-action-group {
            display: flex;
            gap: 20px;
            margin-bottom: 4rem;
        }

        /* Tombol Primary (Emas) */
        .btn-mitra-primary {
            background: linear-gradient(45deg, #D4AF37, #b58d20);
            color: #0b1710;
            padding: 16px 32px;
            border-radius: 30px;
            font-size: 1.05rem;
            font-weight: bold;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
        }

        .btn-mitra-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
        }

        /* Tombol Secondary (Outline) */
        .btn-mitra-outline {
            background: transparent;
            color: #ffffff;
            padding: 16px 32px;
            border-radius: 30px;
            font-size: 1.05rem;
            font-weight: bold;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }

        .btn-mitra-outline:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #ffffff;
        }

        /* Statistik Kepercayaan di bawah tombol */
        .mitra-trust-stats {
            display: flex;
            align-items: center;
            gap: 30px;
            background: rgba(255, 255, 255, 0.03);
            padding: 20px 40px;
            border-radius: 20px;
            border: 1px solid rgba(212, 175, 55, 0.15);
            backdrop-filter: blur(10px);
        }

        .stat-mitra {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }

        .stat-num {
            color: #D4AF37;
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: bold;
        }

        .stat-text {
            color: #8fa697;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .stat-divider {
            width: 1px;
            height: 40px;
            background: rgba(255,255,255,0.1);
        }

        /* Responsif untuk HP */
        @media (max-width: 768px) {
            .mitra-title { font-size: 2.5rem; }
            .mitra-action-group { flex-direction: column; width: 100%; }
            .btn-mitra-primary, .btn-mitra-outline { width: 100%; justify-content: center; }
            .mitra-trust-stats { flex-direction: column; gap: 15px; padding: 20px; }
            .stat-divider { width: 100%; height: 1px; }
        }
      `}} />

      {/* Hero Section */}
      <section className="mitra-hero-section">
          {/* Efek Pola Islami Transparan */}
          <div className="mitra-pattern"></div>

          <div className="mitra-hero-container">
              <div className="mitra-badge-top">✨ PROGRAM KEMITRAAN RESMI</div>
              
              <h1 className="mitra-title">
                  Bangun Bisnis Penuh Berkah<br />Bersama <span className="gold-text">PT Golden Tour Haramain</span>
              </h1>
              
              <p className="mitra-desc">
                  Jadilah representatif resmi PT. Golden Tour Haramain di kota Anda. Raih kebebasan finansial melalui bisnis Umrah & Haji dengan sistem bagi hasil yang transparan, legalitas terjamin, dan dukungan pemasaran penuh dari tim pusat.
              </p>
              
              <div className="mitra-action-group">
                  <button onClick={() => setActiveTab('register')} className="btn-mitra-primary cursor-pointer">
                      Daftar Kemitraan Sekarang <span>→</span>
                  </button>
                  <button onClick={() => {
                      document.getElementById('komisi-section')?.scrollIntoView({ behavior: 'smooth' });
                  }} className="btn-mitra-outline cursor-pointer">
                      Pelajari Skema Komisi
                  </button>
              </div>

              {/* Angka Kepercayaan (Trust Stats) */}
              <div className="mitra-trust-stats">
                  <div className="stat-mitra">
                      <span className="stat-num">50+</span>
                      <span className="stat-text">Mitra Tersebar</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-mitra">
                      <span className="stat-num">Bimbingan</span>
                      <span className="stat-text">Marketing 1-on-1</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-mitra">
                      <span className="stat-num">Legalitas</span>
                      <span className="stat-text">100% Aman</span>
                  </div>
              </div>
          </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        /* --- BAGIAN NAVIGASI SUB-MENU --- */
        .mitra-navigation-section {
            position: relative;
            background-color: #050a07; /* Latar belakang Matcha sangat gelap */
            padding: 4rem 2rem; /* Ruang atas dan bawah agar menu bernapas */
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        /* Efek Cahaya (Aura Glow) di latar belakang */
        .mitra-aura-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            height: 100px;
            /* Kombinasi cahaya emas dan matcha terang */
            background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.15) 0%, rgba(24, 56, 35, 0.2) 50%, transparent 100%);
            filter: blur(40px); /* Dibuat sangat pudar agar elegan, tidak norak */
            z-index: 1;
            pointer-events: none; /* Agar tidak mengganggu klik tombol */
        }

        /* Wadah Menu Kaca */
        .mitra-tab-container {
            position: relative;
            z-index: 2; /* Berada di atas cahaya glow */
            display: inline-flex;
            background: rgba(255, 255, 255, 0.03); /* Transparan */
            backdrop-filter: blur(20px); /* Efek kaca buram */
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 50px; /* Bentuk pil / kapsul panjang */
            padding: 8px; /* Jarak antara garis luar dan tombol dalam */
            gap: 5px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        }

        /* Tombol Satuan di Dalam Wadah */
        .mitra-tab-btn {
            padding: 12px 30px;
            border-radius: 40px;
            color: #a3b8aa; /* Hijau pucat untuk tombol yang tidak aktif */
            text-decoration: none;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.4s ease;
            cursor: pointer;
            border: none;
            background: transparent;
        }

        /* Tombol yang Sedang Aktif (Terpilih) */
        .mitra-tab-btn.active {
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07; /* Teks gelap agar terbaca jelas di emas */
            font-weight: 700;
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
        }

        /* Efek Saat Kursor Diarahkan (Hover) ke Tombol Tidak Aktif */
        .mitra-tab-btn:hover:not(.active) {
            color: #D4AF37;
            background: rgba(212, 175, 55, 0.05);
        }

        /* Responsif untuk layar HP */
        @media (max-width: 600px) {
            .mitra-tab-container {
                flex-direction: column; /* Berubah jadi atas-bawah di HP */
                border-radius: 20px;
                width: 100%;
                max-width: 300px;
            }
            .mitra-tab-btn {
                text-align: center;
                width: 100%;
            }
        }
      `}} />

      {/* Main Content Area */}
      <main className="flex-grow w-full">
        {/* Navigation Tabs */}
        <section className="mitra-navigation-section">
            {/* Efek Cahaya Pendar di Belakang Menu */}
            <div className="mitra-aura-glow"></div>

            {/* Wadah Menu Kaca (Glassmorphism) */}
            <div className="mitra-tab-container">
                <button 
                    onClick={() => setActiveTab('info')} 
                    className={`mitra-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                >
                    Informasi Kemitraan
                </button>
                <button 
                    onClick={() => setActiveTab('register')} 
                    className={`mitra-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                >
                    Daftar Mitra
                </button>
                <button 
                    onClick={() => navigate('/mitra/login')} 
                    className="mitra-tab-btn"
                >
                    Login Mitra
                </button>
            </div>
        </section>

        {/* Tab Content */}
        <div className="animate-fade-in pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          {activeTab === 'info' && <MitraInfo setActiveTab={setActiveTab} />}
          {activeTab === 'register' && <MitraRegister />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MitraInfo({ setActiveTab }: { setActiveTab: (tab: 'register' | 'login') => void }) {
  return (
    <div className="space-y-24">
         <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION MENGAPA BISNIS UMROH --- */
        .mitra-reasons-section {
            background-color: #08110c; /* Deep Matcha pekat, menyambung mulus dari atas */
            padding: 6rem 5%;
            border-bottom: 1px solid rgba(212, 175, 55, 0.1);
            border-radius: 2rem;
        }

        .mitra-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header Section */
        .section-header-center {
            text-align: center;
            margin-bottom: 4rem;
        }

        .gold-subtitle {
            color: #D4AF37;
            font-size: 0.85rem;
            letter-spacing: 3px;
            font-weight: 700;
            text-transform: uppercase;
            display: block;
            margin-bottom: 1rem;
        }

        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-bottom: 1.5rem;
        }

        .section-title .gold-text {
            color: #D4AF37;
        }

        .gold-line {
            width: 80px;
            height: 3px;
            background: #D4AF37;
            margin: 0 auto;
            border-radius: 2px;
        }

        /* Grid Setup */
        .reasons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
        }

        /* Desain Kartu (Glassmorphism & Interactive) */
        .reason-card {
            background: rgba(255, 255, 255, 0.02); /* Kaca sangat gelap */
            border: 1px solid rgba(212, 175, 55, 0.1);
            padding: 2.5rem 2rem;
            border-radius: 20px;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            text-align: left;
        }

        /* Efek cahaya tipis di ujung kartu */
        .reason-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, #D4AF37, transparent);
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .reason-card:hover {
            transform: translateY(-10px);
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(212, 175, 55, 0.4);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
        }

        .reason-card:hover::before {
            opacity: 1;
        }

        /* Ikon */
        .reason-icon-wrapper {
            width: 60px;
            height: 60px;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
        }

        .reason-icon {
            font-size: 1.8rem;
        }

        .reason-card:hover .reason-icon-wrapper {
            background: #D4AF37;
            border-color: #D4AF37;
        }

        .reason-card:hover .reason-icon {
            filter: brightness(0); /* Membuat emoji/icon jadi gelap saat di hover */
        }

        /* Tipografi Teks */
        .reason-card h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.4rem;
            margin-bottom: 1rem;
        }

        .reason-card p {
            color: #a3b8aa; /* Hijau matcha abu-abu terang */
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 0;
        }

        /* Responsif */
        @media (max-width: 768px) {
            .section-title {
                font-size: 2.2rem;
            }
            .reasons-grid {
                grid-template-columns: 1fr;
            }
        }
      `}} />

      {/* Seksi 2: Validasi Peluang Bisnis */}
      <section className="mitra-reasons-section">
          <div className="mitra-container">
              <div className="section-header-center">
                  <span className="gold-subtitle">✨ PELUANG EMAS</span>
                  <h2 className="section-title">Mengapa Anda Harus Berbisnis Umroh <span className="gold-text">Saat Ini?</span></h2>
                  <div className="gold-line"></div>
              </div>

              <div className="reasons-grid">
                  {/* Kartu 1 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">👥</span>
                      </div>
                      <h3>Pasar Muslim Terbesar</h3>
                      <p>Indonesia memegang populasi muslim terbesar di dunia (±248 juta jiwa). Ini bukan sekadar pasar, melainkan ekosistem tanpa batas untuk eskalasi bisnis Anda.</p>
                  </div>

                  {/* Kartu 2 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">📈</span>
                      </div>
                      <h3>Permintaan Eksponensial</h3>
                      <p>Tren keberangkatan melonjak tajam dengan pertumbuhan nyaris 50% dalam dua tahun terakhir. Gaya hidup spiritual kini menjadi prioritas utama masyarakat.</p>
                  </div>

                  {/* Kartu 3 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">⏳</span>
                      </div>
                      <h3>Solusi Antrean Haji</h3>
                      <p>Dengan masa tunggu Haji reguler yang mencapai 11 hingga 49 tahun, Umrah menjadi alternatif utama dan tercepat bagi umat untuk segera ke Tanah Suci.</p>
                  </div>

                  {/* Kartu 4 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">⚙️</span>
                      </div>
                      <h3>Sistem Bisnis Teruji</h3>
                      <p>Anda tidak perlu merintis dari nol. PT Golden Tour Haramain menyediakan sistem operasional, legalitas, dan destinasi tetap yang siap dijalankan dengan mudah.</p>
                  </div>

                  {/* Kartu 5 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">🎯</span>
                      </div>
                      <h3>Segmentasi Tanpa Batas</h3>
                      <p>Potensi target market melintasi berbagai kalangan; mulai dari lansia, keluarga, korporasi, hingga milenial dan profesional muda yang mencari ketenangan.</p>
                  </div>

                  {/* Kartu 6 */}
                  <div className="reason-card">
                      <div className="reason-icon-wrapper">
                          <span className="reason-icon">🤲</span>
                      </div>
                      <h3>Keberkahan Dunia Akhirat</h3>
                      <p>Satu-satunya instrumen bisnis di mana profit ekonomi yang menjanjikan berjalan beriringan dengan aliran pahala memfasilitasi Tamu Allah.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Seksi 3: Keunggulan Sistem Kemitraan */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION SISTEM 3IN --- */
        .sistem3in-section {
            position: relative;
            background-color: #070e0a; /* Dasar Hijau Matcha Paling Gelap */
            padding: 7rem 5%;
            overflow: hidden;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border-radius: 3rem;
            margin-bottom: 3rem;
        }

        /* Pendaran Cahaya Hijau di Latar Belakang (Memberi Dimensi) */
        .s3in-bg-glow {
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background: radial-gradient(circle at center, rgba(30, 66, 42, 0.4) 0%, transparent 60%);
            filter: blur(60px);
            z-index: 1;
            pointer-events: none;
        }

        .s3in-container {
            position: relative;
            z-index: 2;
            max-width: 1100px;
            margin: 0 auto;
        }

        /* Header Section */
        .s3in-header {
            text-align: center;
            margin-bottom: 5rem;
        }

        .gold-badge {
            display: inline-block;
            background: rgba(212, 175, 55, 0.1);
            color: #D4AF37;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            letter-spacing: 2px;
            border: 1px solid rgba(212, 175, 55, 0.3);
            margin-bottom: 1.5rem;
        }

        .s3in-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            color: #ffffff;
            line-height: 1.3;
            margin-bottom: 1rem;
        }

        .s3in-title .gold-text { color: #D4AF37; }

        .s3in-desc {
            color: #a3b8aa;
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* Grid Layout untuk 3 Kartu */
        .s3in-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        /* Desain Kartu (Glassmorphism & Watermark) */
        .s3in-card {
            position: relative;
            background: rgba(255, 255, 255, 0.03); /* Kaca transparan gelap */
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 24px;
            padding: 3.5rem 2.5rem;
            text-align: center;
            transition: all 0.4s ease;
            overflow: hidden;
            backdrop-filter: blur(10px);
        }

        /* Efek Watermark Angka Besar (01, 02, 03) */
        .s3in-watermark {
            position: absolute;
            top: -10px;
            right: -10px;
            font-family: 'Playfair Display', serif;
            font-size: 10rem;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.02); /* Sangat tipis/samar */
            line-height: 1;
            z-index: 1;
            transition: all 0.4s ease;
        }

        .s3in-card:hover {
            transform: translateY(-10px);
            border-color: rgba(212, 175, 55, 0.5);
            background: rgba(212, 175, 55, 0.05);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .s3in-card:hover .s3in-watermark {
            color: rgba(212, 175, 55, 0.05); /* Angka jadi keemasan saat di hover */
            transform: scale(1.05);
        }

        /* Ikon dan Teks Content */
        .s3in-icon {
            position: relative;
            z-index: 2;
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%);
            border: 1px solid rgba(212, 175, 55, 0.4);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2rem;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
        }

        .s3in-content {
            position: relative;
            z-index: 2;
        }

        .s3in-content h3 {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            letter-spacing: 1px;
        }

        .s3in-content h3 span {
            display: block;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #ffffff;
            font-size: 1rem;
            margin-top: 5px;
            font-weight: 500;
            letter-spacing: 0;
        }

        .s3in-content p {
            color: #a3b8aa;
            font-size: 0.95rem;
            line-height: 1.7;
        }

        /* Responsif */
        @media (max-width: 992px) {
            .s3in-title { font-size: 2.5rem; }
            .s3in-grid { grid-template-columns: 1fr; max-width: 500px; margin: 0 auto; }
        }
      `}} />
      <section className="sistem3in-section">
          {/* Efek Background Pattern & Glow */}
          <div className="s3in-bg-glow"></div>

          <div className="s3in-container">
              <div className="s3in-header">
                  <span className="gold-badge">EKSKLUSIF UNTUK MITRA</span>
                  <h2 className="s3in-title">Bergabung Bersama Kami dengan<br /><span className="gold-text">Sistem "3-IN"</span></h2>
                  <p className="s3in-desc">Anda tidak akan berjuang sendirian. PT. Golden Tour Haramain telah merancang ekosistem pendampingan bisnis yang terstruktur dan terbukti berhasil.</p>
              </div>

              <div className="s3in-grid">
                  {/* Kartu 1 */}
                  <div className="s3in-card">
                      <div className="s3in-watermark">01</div>
                      <div className="s3in-icon">📖</div>
                      <div className="s3in-content">
                          <h3>DIAJARIN <br /><span>(Mentorship Terpadu)</span></h3>
                          <p>Mitra akan mendapatkan pembekalan komprehensif. Mulai dari penguasaan <em>Product Knowledge</em>, strategi pemasaran efektif, <em>Public Speaking</em>, hingga optimasi kampanye digital (Meta & TikTok Ads).</p>
                      </div>
                  </div>

                  {/* Kartu 2 */}
                  <div className="s3in-card">
                      <div className="s3in-watermark">02</div>
                      <div className="s3in-icon">🤝</div>
                      <div className="s3in-content">
                          <h3>DISUKSESIN <br /><span>(Inkubasi Bisnis)</span></h3>
                          <p>Kami mendedikasikan tim khusus untuk membimbing Anda mencapai target kesuksesan. Syaratnya sederhana: Anda memiliki komitmen untuk belajar dan disiplin mengikuti sistem operasional kami.</p>
                      </div>
                  </div>

                  {/* Kartu 3 */}
                  <div className="s3in-card">
                      <div className="s3in-watermark">03</div>
                      <div className="s3in-icon">✈️</div>
                      <div className="s3in-content">
                          <h3>DIUMROHIN <br /><span>(Reward Spiritual)</span></h3>
                          <p>Raih kesempatan luar biasa untuk menjejakkan kaki di Tanah Suci bersama PT Golden Tour Haramain. Apresiasi ini diberikan melalui pencapaian bonus kinerja mitra atau dengan kualifikasi sebagai <em>Tour Leader</em>.</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Seksi 4: Potensi Pendapatan */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION KOMISI & REWARD --- */
        .mitra-komisi-section {
            position: relative;
            background-color: #060d09; /* Sangat gelap, nyaris hitam agar elegan */
            padding: 7rem 5%;
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow: hidden;
            border-radius: 3rem;
            margin-bottom: 3rem;
        }

        /* Bias Cahaya (Menciptakan kedalaman) */
        .komisi-bg-flare {
            position: absolute;
            top: -20%;
            right: -10%;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(16, 38, 24, 0.2) 40%, transparent 70%);
            filter: blur(50px);
            z-index: 1;
            pointer-events: none;
        }

        .komisi-container {
            position: relative;
            z-index: 2;
            max-width: 1100px;
            margin: 0 auto;
        }

        /* Header */
        .komisi-header {
            text-align: center;
            margin-bottom: 4rem;
        }

        .komisi-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            color: #ffffff;
            margin-bottom: 1rem;
            margin-top: 1rem;
        }

        .komisi-desc {
            color: #a3b8aa;
            font-size: 1.05rem;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* Grid Layout (2 Kolom) */
        .komisi-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        /* Panel Kiri & Kanan */
        .komisi-panel {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }

        .panel-title-area {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 2.5rem;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            padding-bottom: 1.5rem;
        }

        .panel-icon {
            font-size: 2rem;
            background: rgba(212, 175, 55, 0.1);
            padding: 12px;
            border-radius: 15px;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .panel-title-area h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.5rem;
            line-height: 1.2;
        }

        .panel-title-area h3 span {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.9rem;
            color: #D4AF37;
            font-weight: normal;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* Desain Daftar Komisi (Kiri) */
        .komisi-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .komisi-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
            padding: 20px 25px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .komisi-item:hover {
            border-color: rgba(212, 175, 55, 0.3);
            transform: translateX(5px);
        }

        /* Highlight Paket Insani */
        .highlight-item {
            background: linear-gradient(90deg, rgba(212,175,55,0.05) 0%, rgba(0,0,0,0.3) 100%);
            border-left: 4px solid #D4AF37;
        }

        .paket-info h4 {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 4px;
        }

        .paket-info span {
            color: #7b8e83;
            font-size: 0.85rem;
        }

        .paket-harga {
            color: #D4AF37;
            font-size: 1.25rem;
            font-weight: 700;
            font-family: 'Plus Jakarta Sans', sans-serif;
            letter-spacing: 0.5px;
        }

        /* Desain Reward Ekstra (Kanan) */
        .reward-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .reward-card {
            padding: 25px;
            border-radius: 16px;
            transition: all 0.3s ease;
        }

        /* Box Reward Cream/Gold (Bonus Prestasi) */
        .premium-reward {
            background: #fdfaf0; /* Warna cream premium */
            border: 1px solid #e6d39a;
            box-shadow: 0 10px 20px rgba(212, 175, 55, 0.1);
        }

        .premium-reward h4 {
            color: #102618; /* Hijau gelap */
        }

        .premium-reward p {
            color: #334238;
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .premium-reward strong {
            color: #b58d20;
            font-size: 1.1rem;
        }

        /* Box Grand Reward (Bonus 90 Jamaah) */
        .special-reward {
            background: rgba(0, 0, 0, 0.4);
            border: 1px dashed rgba(212, 175, 55, 0.4);
        }

        .special-reward h4 {
            color: #ffffff;
        }

        .special-reward p {
            color: #a3b8aa;
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .special-reward strong {
            color: #D4AF37;
        }

        .special-reward .note {
            display: block;
            margin-top: 8px;
            font-size: 0.8rem;
            color: #7b8e83;
            font-style: italic;
        }

        .reward-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }

        .reward-star, .reward-crown {
            font-size: 1.2rem;
        }

        /* Responsif */
        @media (max-width: 992px) {
            .komisi-grid { grid-template-columns: 1fr; }
            .komisi-panel { padding: 2rem; }
        }
      `}} />
      <section className="mitra-komisi-section" id="komisi-section">
          {/* Bias cahaya latar belakang */}
          <div className="komisi-bg-flare"></div>

          <div className="komisi-container">
              <div className="komisi-header">
                  <span className="gold-badge">PROFIT SHARE & REWARD</span>
                  <h2 className="komisi-title">Skema Profitabilitas <span className="gold-text">Eksklusif</span></h2>
                  <p className="komisi-desc">Berikut adalah transparansi ilustrasi Ujroh (Bagi Hasil) dan bonus pencapaian yang akan menjadi hak Anda sebagai representatif resmi PT Golden Tour Haramain.</p>
              </div>

              <div className="komisi-grid">
                  {/* PANEL KIRI: KOMISI LANGSUNG */}
                  <div className="komisi-panel">
                      <div className="panel-title-area">
                          <div className="panel-icon">💰</div>
                          <h3>Komisi Penjualan <br /><span>(Per Jemaah)</span></h3>
                      </div>
                      
                      <div className="komisi-list">
                          <div className="komisi-item">
                              <div className="paket-info">
                                  <h4>Paket Harmoni</h4>
                                  <span>Program Umrah Reguler</span>
                              </div>
                              <div className="paket-harga">Rp 2.000.000</div>
                          </div>

                          <div className="komisi-item">
                              <div className="paket-info">
                                  <h4>Paket Madani</h4>
                                  <span>Program Umrah Premium</span>
                              </div>
                              <div className="paket-harga">Rp 2.500.000</div>
                          </div>

                          <div className="komisi-item highlight-item">
                              <div className="paket-info">
                                  <h4>Paket Insani</h4>
                                  <span>Program Umrah VIP/Plus</span>
                              </div>
                              <div className="paket-harga">Rp 3.000.000</div>
                          </div>
                      </div>
                  </div>

                  {/* PANEL KANAN: REWARD EKSTRA */}
                  <div className="komisi-panel">
                      <div className="panel-title-area">
                          <div className="panel-icon">🏆</div>
                          <h3>Reward & Pencapaian <br /><span>(Keuntungan Tambahan)</span></h3>
                      </div>

                      <div className="reward-list">
                          {/* Bonus Prestasi (Highlight Cream/Gold) */}
                          <div className="reward-card premium-reward">
                              <div className="reward-header">
                                  <span className="reward-star">⭐</span>
                                  <h4>Bonus Prestasi</h4>
                              </div>
                              <p>Dapatkan tambahan bonus kelipatan sebesar <strong>Rp 1.500.000</strong> untuk setiap akumulasi keberangkatan sepuluh (10) jemaah dalam satu grup.</p>
                          </div>

                          {/* Bonus Spesial (Dark Glass) */}
                          <div className="reward-card special-reward">
                              <div className="reward-header">
                                  <span className="reward-crown">👑</span>
                                  <h4>Grand Reward 90 Jemaah</h4>
                              </div>
                              <p>Kumpulkan akumulasi keberangkatan total 90 jemaah (tanpa batas waktu & berlaku kelipatan) untuk mendapatkan <strong>Penghargaan Spesial Ibadah Umrah Gratis</strong> <span className="note">(Benefit tidak dapat diuangkan)</span>.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Seksi 5: Jenjang Prestasi */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION PENGHARGAAN MITRA --- */
        .mitra-award-section {
            background-color: #08160e; /* Hijau Deep Matcha yang kaya */
            padding: 7rem 5%;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border-top: 1px solid rgba(212, 175, 55, 0.1);
            border-radius: 3rem;
            margin-bottom: 3rem;
        }

        .award-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header Area */
        .award-header {
            text-align: center;
            margin-bottom: 5rem;
        }

        .award-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-bottom: 1rem;
        }

        .award-title .gold-text { color: #D4AF37; }

        .award-desc {
            color: #a3b8aa;
            font-size: 1.05rem;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* Grid 4 Kolom */
        .award-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
        }

        /* Kartu Penghargaan (Base Style) */
        .award-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            padding: 3rem 2rem;
            text-align: center;
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            /* Efek gradasi halus di bagian bawah kartu */
            background-image: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3) 100%);
        }

        .award-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 3px;
            transition: all 0.4s ease;
        }

        /* Ikon / Pin Area */
        .award-icon-box {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 2.5rem;
            transition: all 0.4s ease;
            /* Shadow ke dalam agar ikon terlihat seperti koin/pin timbul */
            box-shadow: inset 0 5px 15px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.3);
        }

        .award-card h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.4rem;
            margin-bottom: 0.8rem;
            color: #ffffff;
            letter-spacing: 0.5px;
        }

        .award-target {
            font-size: 0.9rem;
            color: #8fa697;
            background: rgba(0, 0, 0, 0.4);
            display: inline-block;
            padding: 6px 15px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* --- STYLING KHUSUS PER TIER --- */

        /* 1. SILVER */
        .tier-silver .award-icon-box { background: linear-gradient(135deg, #e0e0e0, #9e9e9e); }
        .tier-silver h3 { color: #e0e0e0; }
        .tier-silver:hover { border-color: rgba(224, 224, 224, 0.5); box-shadow: 0 15px 35px rgba(224, 224, 224, 0.1); transform: translateY(-10px); }
        .tier-silver::before { background: #e0e0e0; }

        /* 2. GOLD */
        .tier-gold .award-icon-box { background: linear-gradient(135deg, #ffe066, #d4af37); }
        .tier-gold h3 { color: #d4af37; }
        .tier-gold:hover { border-color: rgba(212, 175, 55, 0.5); box-shadow: 0 15px 35px rgba(212, 175, 55, 0.15); transform: translateY(-10px); }
        .tier-gold::before { background: #d4af37; }

        /* 3. PLATINUM */
        .tier-platinum .award-icon-box { background: linear-gradient(135deg, #f5f7fa, #c3cfe2); }
        .tier-platinum h3 { color: #c3cfe2; }
        .tier-platinum:hover { border-color: rgba(195, 207, 226, 0.5); box-shadow: 0 15px 35px rgba(195, 207, 226, 0.15); transform: translateY(-10px); }
        .tier-platinum::before { background: #c3cfe2; }

        /* 4. DIAMOND */
        .tier-diamond .award-icon-box { background: linear-gradient(135deg, #a1c4fd, #c2e9fb); }
        .tier-diamond h3 { color: #a1c4fd; }
        .tier-diamond:hover { border-color: rgba(161, 196, 253, 0.5); box-shadow: 0 15px 35px rgba(161, 196, 253, 0.2); transform: translateY(-10px); }
        .tier-diamond::before { background: #a1c4fd; }

        /* Responsif */
        @media (max-width: 992px) {
            .award-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        }
        @media (max-width: 600px) {
            .award-grid { grid-template-columns: 1fr; max-width: 350px; margin: 0 auto; }
        }
      `}} />
      <section className="mitra-award-section">
          <div className="award-container">
              <div className="award-header">
                  <span className="gold-badge">REKOGNISI & APRESIASI</span>
                  <h2 className="award-title">Tingkatan Prestasi <span className="gold-text">Mitra Eksekutif</span></h2>
                  <p className="award-desc">Kami sangat menghargai setiap dedikasi Anda. Capai tingkatan prestasi berikut dan nikmati eksklusivitas penghargaan dari PT. Golden Tour Haramain.</p>
              </div>

              <div className="award-grid">
                  {/* TIER 1: SILVER */}
                  <div className="award-card tier-silver">
                      <div className="award-icon-box">
                          <div className="pin-icon">🥈</div>
                      </div>
                      <h3>Silver Executive</h3>
                      <div className="award-target">Pencapaian 1 - 50 Jemaah</div>
                  </div>

                  {/* TIER 2: GOLD */}
                  <div className="award-card tier-gold">
                      <div className="award-icon-box">
                          <div className="pin-icon">🥇</div>
                      </div>
                      <h3>Gold Privilege</h3>
                      <div className="award-target">Pencapaian 51 - 150 Jemaah</div>
                  </div>

                  {/* TIER 3: PLATINUM */}
                  <div className="award-card tier-platinum">
                      <div className="award-icon-box">
                          <div className="pin-icon">🎖️</div>
                      </div>
                      <h3>Platinum Elite</h3>
                      <div className="award-target">Pencapaian 151 - 300 Jemaah</div>
                  </div>

                  {/* TIER 4: DIAMOND */}
                  <div className="award-card tier-diamond">
                      <div className="award-icon-box">
                          <div className="pin-icon">💎</div>
                      </div>
                      <h3>Diamond Crown</h3>
                      <div className="award-target">Pencapaian 300+ Jemaah</div>
                  </div>
              </div>
          </div>
      </section>

      {/* Seksi 6: Kisah Sukses & Motivasi */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION PESAN DIREKTUR --- */
        .mitra-director-section {
            background-color: #050a07; /* Latar sangat gelap agar kartu menonjol */
            padding: 5rem 5% 8rem;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border-radius: 3rem;
            margin-bottom: 3rem;
        }

        .director-container {
            max-width: 1000px;
            margin: 0 auto;
        }

        /* Kartu Eksekutif (Glassmorphism Premium) */
        .director-card {
            position: relative;
            background: linear-gradient(135deg, rgba(20, 43, 27, 0.8) 0%, rgba(10, 23, 15, 0.9) 100%);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 30px;
            padding: 4rem;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
            overflow: hidden;
            display: flex;
            align-items: center;
        }

        /* Watermark Tanda Kutip (Efek Majalah) */
        .quote-watermark {
            position: absolute;
            top: -40px;
            right: 40px;
            font-family: 'Playfair Display', serif;
            font-size: 25rem;
            color: rgba(212, 175, 55, 0.03); /* Emas yang sangat pudar */
            line-height: 1;
            pointer-events: none;
            z-index: 1;
        }

        .director-content {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 50px;
            width: 100%;
        }

        /* Bingkai Foto Mewah */
        .director-visual {
            flex-shrink: 0;
        }

        .image-frame {
            width: 220px;
            height: 220px;
            border-radius: 50%;
            padding: 10px; /* Jarak untuk cincin emas */
            background: linear-gradient(45deg, #D4AF37, #AA771C); /* Cincin luar solid gold */
            position: relative;
            box-shadow: 0 15px 35px rgba(212, 175, 55, 0.2);
        }

        .image-frame::after {
            content: '';
            position: absolute;
            top: -10px; left: -10px; right: -10px; bottom: -10px;
            border: 1px dashed rgba(212, 175, 55, 0.5);
            border-radius: 50%;
            animation: spin 20s linear infinite; /* Animasi putar sangat lambat & halus */
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }

        .image-placeholder {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #0d1c12; /* Warna matcha gelap untuk isi foto sementara */
            display: flex;
            justify-content: center;
            align-items: center;
            border: 4px solid #050a07; /* Garis pemisah antara foto dan cincin emas */
            overflow: hidden;
            position: relative;
            z-index: 10;
        }

        .image-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .user-icon {
            font-size: 5rem;
            color: #a3b8aa;
        }

        /* Area Teks */
        .director-text-area {
            flex-grow: 1;
        }

        .director-gold-subtitle {
            display: block;
            color: #D4AF37;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 1.5rem;
        }

        .director-quote {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            color: #ffffff;
            line-height: 1.4;
            margin: 0 0 2rem 0;
            font-style: italic;
        }

        .highlight-gold {
            color: #D4AF37;
            font-weight: bold;
        }

        /* Profil & Identitas */
        .director-identity {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 1.5rem;
        }

        .director-name {
            color: #ffffff;
            font-size: 1.5rem;
            margin-bottom: 0.3rem;
            font-weight: 700;
        }

        .director-title {
            color: #a3b8aa;
            font-size: 1rem;
            margin-bottom: 1.2rem;
        }

        /* Lencana Kehormatan (Menggantikan teks dalam kurung) */
        .story-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #e6d39a;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }

        /* Responsif untuk layar kecil */
        @media (max-width: 768px) {
            .director-content {
                flex-direction: column;
                text-align: center;
                gap: 30px;
            }
            .director-card { padding: 2.5rem; }
            .director-quote { font-size: 1.6rem; }
            .quote-watermark { font-size: 15rem; top: 10px; right: 20px; }
        }
      `}} />
      <section className="mitra-director-section">
          <div className="director-container">
              <div className="director-card">
                  {/* Tanda Kutip Watermark Raksasa */}
                  <div className="quote-watermark">"</div>

                  <div className="director-content">
                      {/* Sisi Kiri: Profil Visual */}
                      <div className="director-visual">
                          <div className="image-frame">
                              <div className="image-placeholder">
                                  <img src={direkturImg} alt="Ustadz Ahmad Daud" />
                              </div>
                          </div>
                      </div>

                      {/* Sisi Kanan: Pesan & Identitas */}
                      <div className="director-text-area">
                          <span className="director-gold-subtitle">PESAN DARI DIREKTUR KAMI</span>
                          
                          <blockquote className="director-quote">
                              "Siapapun kamu, Apapun Profesimu, <br />
                              <span className="highlight-gold">Kamu BISA UMROH!</span>"
                          </blockquote>
                          
                          <div className="director-identity">
                              <h4 className="director-name">Ustadz Ahmad Daud</h4>
                              <p className="director-title">Direktur Utama PT. Golden Tour Haramain</p>
                              {/* Lencana Kisah Inspiratif */}
                              <div className="story-badge">
                                  <span className="badge-icon">🌟</span> Kisah Inspiratif: Dari Tukang Ojek Menuju Baitullah
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Seksi 7: Penawaran Promo & Pendaftaran */}
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION INVESTASI KEMITRAAN --- */
        .mitra-investment-section {
            background-color: #060d09; /* Latar gelap Deep Matcha */
            padding: 6rem 5% 8rem;
            font-family: 'Plus Jakarta Sans', sans-serif;
            position: relative;
            border-radius: 3rem;
        }

        .investment-container {
            max-width: 900px;
            margin: 0 auto;
        }

        /* Header Area */
        .investment-header {
            text-align: center;
            margin-bottom: 4rem;
        }

        .gold-badge {
            display: inline-block;
            background: rgba(212, 175, 55, 0.1);
            color: #D4AF37;
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 2px;
            border: 1px solid rgba(212, 175, 55, 0.4);
            margin-bottom: 1.5rem;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.15);
        }

        .investment-title {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            color: #ffffff;
            margin-bottom: 1rem;
        }

        .investment-title .gold-text { color: #D4AF37; }

        .investment-desc {
            color: #a3b8aa;
            font-size: 1.1rem;
            line-height: 1.6;
        }

        /* Kartu Investasi (Glassmorphism Premium) */
        .investment-card-wrapper {
            position: relative;
            /* Efek pendaran di belakang kartu */
            box-shadow: 0 0 100px rgba(212, 175, 55, 0.05); 
            border-radius: 30px;
        }

        .investment-card {
            background: linear-gradient(180deg, rgba(20, 43, 27, 0.8) 0%, rgba(5, 10, 7, 0.95) 100%);
            border: 1px solid rgba(212, 175, 55, 0.25);
            border-radius: 30px;
            padding: 4rem;
            backdrop-filter: blur(20px);
            text-align: center;
        }

        /* Bagian Harga */
        .price-normal {
            color: #7b8e83;
            font-size: 1.1rem;
            text-decoration: line-through;
            margin-bottom: 0.5rem;
        }

        .price-special {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 5rem;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 0.5rem;
            text-shadow: 0 5px 15px rgba(212, 175, 55, 0.2);
        }

        .price-special .currency {
            font-size: 2.5rem;
            vertical-align: top;
            margin-right: 5px;
        }

        .price-special .suffix {
            font-size: 2.5rem;
        }

        .price-note {
            background: rgba(212, 175, 55, 0.1);
            color: #e6d39a;
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }

        /* Garis Pemisah */
        .luxury-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
            margin: 3rem 0;
        }

        /* Daftar Fasilitas */
        .benefits-title {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            font-weight: 500;
        }

        .benefits-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            text-align: left;
            margin-bottom: 3rem;
        }

        .benefit-item {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #c0d1c6;
            font-size: 1.05rem;
            padding: 15px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .benefit-item:hover {
            background: rgba(212, 175, 55, 0.05);
            border-color: rgba(212, 175, 55, 0.2);
            transform: translateX(5px);
        }

        .check-icon {
            background: #D4AF37;
            color: #050a07;
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            font-size: 0.8rem;
            font-weight: bold;
            flex-shrink: 0;
        }

        .highlight-benefit {
            border-color: rgba(212, 175, 55, 0.4);
            background: rgba(212, 175, 55, 0.05);
        }

        /* Area Tombol Aksi */
        .action-text {
            color: #8fa697;
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
        }

        .contact-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
        }

        .btn-wa-gold {
            display: flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07;
            padding: 16px 35px;
            border-radius: 50px;
            font-weight: 700;
            text-decoration: none;
            font-size: 1.05rem;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
        }

        .btn-wa-gold:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);
        }

        .btn-wa-outline {
            display: flex;
            align-items: center;
            gap: 10px;
            background: transparent;
            color: #D4AF37;
            padding: 16px 35px;
            border-radius: 50px;
            font-weight: 700;
            text-decoration: none;
            font-size: 1.05rem;
            border: 2px solid #D4AF37;
            transition: all 0.3s ease;
        }

        .btn-wa-outline:hover {
            background: rgba(212, 175, 55, 0.1);
            transform: translateY(-3px);
        }

        /* Responsif Mobile */
        @media (max-width: 768px) {
            .investment-card { padding: 2.5rem 1.5rem; }
            .price-special { font-size: 3.5rem; }
            .benefits-grid { grid-template-columns: 1fr; }
            .contact-buttons { flex-direction: column; }
            .btn-wa-gold, .btn-wa-outline { width: 100%; justify-content: center; }
        }
      `}} />
      <section className="mitra-investment-section">
          <div className="investment-container">
              <div className="investment-header">
                  {/* Menggunakan istilah Smart Investment agar terdengar lebih B2B */}
                  <span className="gold-badge">SMART INVESTMENT PASS</span>
                  <h2 className="investment-title">Investasi Kemitraan <span className="gold-text">Resmi</span></h2>
                  <p className="investment-desc">Mulai perjalanan bisnis travel umroh Anda dengan dukungan infrastruktur operasional lengkap dan perlindungan legalitas yang terjamin penuh.</p>
              </div>

              <div className="investment-card-wrapper">
                  <div className="investment-card">
                      {/* Bagian Harga */}
                      <div className="pricing-header">
                          <div className="price-normal">Lisensi Normal: Rp 1.000.000,-</div>
                          <div className="price-special">
                              <span className="currency">Rp</span> 350.000<span className="suffix">,-</span>
                          </div>
                          <div className="price-note">Kemitraan Seumur Hidup (Sekali Bayar)</div>
                      </div>

                      {/* Garis Pemisah Mewah */}
                      <div className="luxury-divider"></div>

                      {/* Daftar Fasilitas */}
                      <div className="benefits-container">
                          <h4 className="benefits-title">Fasilitas Fisik & Legalitas yang Anda Dapatkan:</h4>
                          <div className="benefits-grid">
                              <div className="benefit-item">
                                  <div className="check-icon">✓</div> Spanduk Kemitraan Resmi
                              </div>
                              <div className="benefit-item">
                                  <div className="check-icon">✓</div> ID Card (Tanda Pengenal)
                              </div>
                              <div className="benefit-item">
                                  <div className="check-icon">✓</div> Kartu Nama Eksklusif
                              </div>
                              <div className="benefit-item">
                                  <div className="check-icon">✓</div> Brosur Cetak Pemasaran
                              </div>
                              <div className="benefit-item">
                                  <div className="check-icon">✓</div> Form Pendaftaran Fisik
                              </div>
                              <div className="benefit-item highlight-benefit">
                                  <div className="check-icon">✓</div> MOU (Perjanjian Kerjasama Legal)
                              </div>
                          </div>
                      </div>

                      {/* Tombol Kontak (Representatif) */}
                      <div className="action-buttons-area">
                          <p className="action-text">Pilih Representatif PT Golden Tour Haramain untuk proses verifikasi:</p>
                          <div className="contact-buttons">
                              <a href="https://wa.me/6282283201103?text=Halo%20Admin%2C%20saya%20ingin%20mengambil%20Promo%20Kemitraan%20Rp%20350.000%20dari%20Golden%20Travel" target="_blank" rel="noopener noreferrer" className="btn-wa-gold">
                                  <span className="wa-icon"><MessageSquare className="w-5 h-5" /></span> Representatif 1
                              </a>
                              <a href="https://wa.me/6282288308220?text=Halo%20Admin%2C%20saya%20ingin%20mengambil%20Promo%20Kemitraan%20Rp%20350.000%20dari%20Golden%20Travel" target="_blank" rel="noopener noreferrer" className="btn-wa-outline">
                                  <span className="wa-icon"><MessageSquare className="w-5 h-5" /></span> Representatif 2
                              </a>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
}

function MitraRegister() {
  const logoImg = useLogo();
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pendaftaran berhasil dikirim. Tim kami akan memverifikasi data Anda dalam 1x24 jam.');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* --- SECTION PENDAFTARAN MITRA --- */
        .mitra-register-section {
            background-color: #050a07; /* Latar paling gelap */
            padding: 5rem 5% 8rem;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border-radius: 2rem;
            margin-top: 2rem;
        }

        .register-container {
            max-width: 900px;
            margin: 0 auto;
        }

        .register-header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .register-header h2 {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-bottom: 1rem;
        }

        .register-header .gold-text { color: #D4AF37; }

        .register-header p {
            color: #a3b8aa;
            font-size: 1.05rem;
        }

        /* KARTU FORMULIR (Ini yang menyelamatkan form dari kegelapan) */
        .register-card {
            background: #102116; /* Hijau matcha yang lebih terang dari background luar */
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 24px;
            padding: 4rem;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        /* Layout Baris (Grid) */
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            text-align: left;
        }

        .full-width {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            color: #c0d1c6;
            font-size: 0.95rem;
            margin-bottom: 0.8rem;
            font-weight: 500;
        }

        .required { color: #D4AF37; }
        .optional { color: #66756b; font-size: 0.8rem; font-weight: normal; }

        /* STYLE KOLOM INPUT */
        .form-group input, 
        .form-group select, 
        .form-group textarea {
            width: 100%;
            /* Mengubah kotak input menjadi sedikit terang agar kontras */
            background: rgba(255, 255, 255, 0.05); 
            border: 1px solid rgba(212, 175, 55, 0.3);
            padding: 16px;
            border-radius: 12px;
            color: #ffffff;
            font-size: 1rem;
            font-family: inherit;
            outline: none;
            transition: all 0.3s ease;
        }

        .form-group select {
            appearance: none;
            cursor: pointer;
        }

        .form-group select option {
            background: #102116;
            color: #fff;
        }

        /* Efek saat kolom sedang diisi (Menyala Emas) */
        .form-group input:focus, 
        .form-group select:focus, 
        .form-group textarea:focus {
            background: rgba(212, 175, 55, 0.05);
            border-color: #D4AF37;
            box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
        }

        /* AREA UPLOAD KTP (Berdasarkan image_7e3a13) */
        .upload-area {
            position: relative;
            width: 100%;
            border: 2px dashed rgba(212, 175, 55, 0.5);
            background: rgba(212, 175, 55, 0.03);
            border-radius: 15px;
            padding: 3rem 2rem;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .upload-area:hover {
            background: rgba(212, 175, 55, 0.08);
            border-color: #D4AF37;
        }

        .file-input {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            opacity: 0;
            cursor: pointer;
            height: 100%;
        }

        .upload-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            filter: grayscale(1) sepia(1) hue-rotate(10deg) saturate(3); /* Membuat emoji bernuansa emas */
        }

        .upload-text {
            color: #ffffff;
            font-size: 1.05rem;
            margin-bottom: 0.5rem;
        }

        .upload-text strong { color: #D4AF37; }

        .upload-hint {
            color: #8fa697;
            font-size: 0.85rem;
        }

        /* CHECKBOX SYARAT & KETENTUAN */
        .terms-checkbox {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            color: #a3b8aa;
            font-size: 0.9rem;
            line-height: 1.5;
            cursor: pointer;
            margin-top: 1rem;
            text-align: left;
        }

        .terms-checkbox a {
            color: #D4AF37;
            text-decoration: underline;
        }

        /* TOMBOL KIRIM */
        .form-submit-area {
            margin-top: 3rem;
            display: flex;
            justify-content: flex-end; /* Memposisikan tombol ke kanan */
        }

        .btn-submit-gold {
            background: linear-gradient(45deg, #D4AF37, #b58d20);
            color: #050a07;
            border: none;
            padding: 16px 40px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(212, 175, 55, 0.25);
        }

        .btn-submit-gold:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
        }

        /* Responsif Mobile */
        @media (max-width: 768px) {
            .register-card { padding: 2.5rem 1.5rem; }
            .form-row { grid-template-columns: 1fr; gap: 15px; }
            .form-submit-area { justify-content: center; }
            .btn-submit-gold { width: 100%; justify-content: center; }
        }
      `}} />

      <section className="mitra-register-section" id="daftar-mitra">
          <div className="register-container">
              <div className="register-header">
                  <h2>Formulir Pendaftaran <span className="gold-text">Mitra</span></h2>
                  <p>Lengkapi data di bawah ini untuk proses verifikasi kemitraan resmi PT. Golden Tour Haramain.</p>
              </div>

              <div className="register-card">
                  <form className="register-form" onSubmit={handleRegister}>
                      {/* Baris 1: Nama & Instansi */}
                      <div className="form-row">
                          <div className="form-group">
                              <label>Nama Lengkap Sesuai KTP <span className="required">*</span></label>
                              <input type="text" placeholder="Masukkan nama lengkap Anda" required />
                          </div>
                          <div className="form-group">
                              <label>Nama Instansi / Perusahaan <span className="optional">(Opsional)</span></label>
                              <input type="text" placeholder="Contoh: PT. Maju Berkah" />
                          </div>
                      </div>

                      {/* Baris 2: Kontak */}
                      <div className="form-row">
                          <div className="form-group">
                              <label>Email Aktif <span className="required">*</span></label>
                              <input type="email" placeholder="email@domain.com" required />
                          </div>
                          <div className="form-group">
                              <label>Nomor WhatsApp <span className="required">*</span></label>
                              <input type="tel" placeholder="0812-xxxx-xxxx" required />
                          </div>
                      </div>

                      {/* Baris 3: Lokasi & Kategori */}
                      <div className="form-row">
                          <div className="form-group">
                              <label>Kota / Kabupaten Domisili <span className="required">*</span></label>
                              <input type="text" placeholder="Contoh: Batam Kota" required />
                          </div>
                          <div className="form-group">
                              <label>Kategori Kemitraan <span className="required">*</span></label>
                              <select required defaultValue="">
                                  <option value="" disabled>Pilih Kategori Kemitraan...</option>
                                  <option value="cabang">Kantor Cabang Daerah</option>
                                  <option value="agen">Agen Resmi</option>
                                  <option value="freelance">Mitra Lepas (Freelance)</option>
                              </select>
                          </div>
                      </div>

                      {/* Baris 4: Alamat Penuh */}
                      <div className="form-group full-width">
                          <label>Alamat Lengkap Sesuai KTP <span className="required">*</span></label>
                          <textarea rows={3} placeholder="Nama Jalan, RT/RW, Kelurahan, Kecamatan..." required></textarea>
                      </div>

                      {/* Baris 5: Upload KTP */}
                      <div className="form-group full-width">
                          <label>Upload KTP (JPG/PNG/PDF) <span className="required">*</span></label>
                          <div className="upload-area">
                              <div className="upload-icon">📄</div>
                              <div className="upload-text"><strong>Klik untuk upload file</strong> atau tarik dan lepas di sini</div>
                              <div className="upload-hint">Maksimal ukuran file 5MB</div>
                              <input type="file" className="file-input" required />
                          </div>
                      </div>

                      {/* Persetujuan */}
                      <div className="form-group full-width">
                          <label className="terms-checkbox">
                              <input type="checkbox" required />
                              <span className="checkmark"></span>
                              Saya menyatakan bahwa data yang diisi adalah benar dan menyetujui <a href="#">Syarat & Ketentuan</a> kemitraan PT Golden Tour Haramain.
                          </label>
                      </div>

                      {/* Tombol Kirim */}
                      <div className="form-submit-area">
                          <button type="submit" className="btn-submit-gold">Kirim Pendaftaran <span>→</span></button>
                      </div>
                  </form>
              </div>
          </div>
      </section>
    </>
  );
}
