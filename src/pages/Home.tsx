import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Home() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await api.get('/packages');
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const hajiTrackRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let autoSlide: NodeJS.Timeout;
    const scrollAmount = 380;

    const startAutoSlide = () => {
      autoSlide = setInterval(() => {
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 4000);
    };

    startAutoSlide();

    const handleMouseEnter = () => clearInterval(autoSlide);
    const handleMouseLeave = () => startAutoSlide();

    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(autoSlide);
      track.removeEventListener('mouseenter', handleMouseEnter);
      track.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const hajiTrack = hajiTrackRef.current;
    if (!hajiTrack) return;

    let hajiAutoSlide: NodeJS.Timeout;
    const hajiScrollAmount = 380;

    const startHajiAutoSlide = () => {
      hajiAutoSlide = setInterval(() => {
        if (hajiTrack.scrollLeft + hajiTrack.clientWidth >= hajiTrack.scrollWidth - 10) {
          hajiTrack.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          hajiTrack.scrollBy({ left: hajiScrollAmount, behavior: 'smooth' });
        }
      }, 4500);
    };

    startHajiAutoSlide();

    const handleHajiMouseEnter = () => clearInterval(hajiAutoSlide);
    const handleHajiMouseLeave = () => startHajiAutoSlide();

    hajiTrack.addEventListener('mouseenter', handleHajiMouseEnter);
    hajiTrack.addEventListener('mouseleave', handleHajiMouseLeave);

    return () => {
      clearInterval(hajiAutoSlide);
      hajiTrack.removeEventListener('mouseenter', handleHajiMouseEnter);
      hajiTrack.removeEventListener('mouseleave', handleHajiMouseLeave);
    };
  }, []);

  const handleHajiNext = () => {
    if (hajiTrackRef.current) {
      hajiTrackRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  const handleHajiPrev = () => {
    if (hajiTrackRef.current) {
      hajiTrackRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };


  const handleNext = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 380, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -380, behavior: 'smooth' });
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0D1C15; color: #fff; }
        
        /* Dasar Latar Belakang: HANYA MARMER yang menutupi seluruh layar */
        .hero-section {
            position: relative;
            background-color: #0b1812;
            background-image: url('/Baground Belakang.png.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 4rem 5%;
            z-index: 1;
            overflow: hidden; /* Mencegah gambar bergeser keluar */
        }

        /* Layer Khusus Ka'bah: Diletakkan di atas marmer, di belakang teks */
        .hero-section::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url('/Kakbah.png.png');
            background-size: 70% auto; /* Diperbesar agar megah seperti referensi */
            background-position: right bottom; /* Memaksa Ka'bah ke pojok kanan bawah */
            background-repeat: no-repeat;
            z-index: -1;
            
            /* Trik Masking: Memudarkan langit dan ujung kiri Ka'bah agar marmer terlihat menembus */
            -webkit-mask-image: radial-gradient(circle at 90% 100%, black 30%, transparent 65%);
            mask-image: radial-gradient(circle at 90% 100%, black 30%, transparent 65%);
        }

        /* NAVIGASI */
        .header {
            background-color: #08110c; /* Warna hijau sangat gelap pekat menutupi marmer */
            border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Garis pemisah tipis di bagian bawah */
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 5%;
            position: relative;
            z-index: 10;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-img { width: 50px; height: 50px; border-radius: 50%; border: 1px solid #D4AF37; background-image: url('/logo.png'); background-size: cover; background-position: center; }
        .logo-text h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 2px; }
        .logo-text p { font-size: 0.7rem; color: #D4AF37; letter-spacing: 1px; }
        .menu { display: flex; gap: 2rem; font-size: 0.9rem; }
        .menu a { text-decoration: none; color: #fff; transition: 0.3s; }
        .menu a.active { color: #D4AF37; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5); }
        .btn-login { border: 1px solid #D4AF37; color: #D4AF37; background: transparent; padding: 0.5rem 1.5rem; border-radius: 30px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }

        /* KONTEN TENGAH */
        /* Memperlebar area teks agar elegan dan tidak menumpuk */
        .content {
            text-align: left;
            width: 100%;
            max-width: 900px; 
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-top: 2rem;
        }
        .subtitle {
            justify-content: flex-start; /* Bintang dan teks rata kiri */
            color: #D4AF37; 
            font-size: 0.8rem; 
            font-weight: 600; 
            letter-spacing: 2px; 
            margin-bottom: 1.5rem; 
            display: flex; 
            align-items: center; 
            gap: 8px;
        }
        
        /* JUDUL H1 */
        h1 { 
            font-family: 'Playfair Display', serif; 
            font-size: 3.5rem; 
            line-height: 1.25; 
            margin-bottom: 1.5rem; 
        }
        
        /* Efek Emas Menyala pada Teks H1 */
        h1 .gold-text {
            background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.4));
            font-weight: 700;
        }
        
        .desc {
            text-align: left;
            font-size: 1rem; 
            line-height: 1.6; 
            max-width: 700px; 
            margin-bottom: 2.5rem; 
            color: #e0e0e0;
        }

        /* TOMBOL CTA */
        .cta-group { display: flex; gap: 1.5rem; justify-content: center; margin-top: 2rem; margin-bottom: 4rem; }
        .btn-primary { background-color: #D4AF37; color: #000; padding: 0.8rem 2.5rem; border-radius: 30px; text-decoration: none; font-weight: 600; border: none; font-size: 1rem; }
        .btn-outline { background-color: transparent; border: 1px solid #fff; color: #fff; padding: 0.8rem 2.5rem; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 1rem; }

        /* TRUST BADGE */
        .trust-badges { justify-content: flex-start; gap: 2rem; display: flex; border-top: 1px solid rgba(212, 175, 55, 0.3); border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding: 1.5rem 0; width: 100%; max-width: 800px; }
        .badge { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
        .badge-icon { color: #D4AF37; font-size: 1.2rem; }

        /* WHATSAPP FLOAT */
        .wa-float { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background-color: #25D366; border: 2px solid #D4AF37; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.3s; z-index: 9999; }
        .wa-float:hover { transform: scale(1.1); }

        /* --- ABOUT SECTION --- */
        .about-section {
            background-image: url('/bg-about.png.png');
            background-size: cover;
            background-position: center bottom;
            background-repeat: no-repeat;
            padding: 6rem 5%;
            border-top: 1px solid rgba(212, 175, 55, 0.3);
            position: relative;
        }

        .about-container {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 4rem;
        }

        /* Teks Kiri */
        .about-text {
            flex: 1;
            text-align: left;
            z-index: 2; /* Memastikan teks di atas siluet masjid */
        }

        .about-subtitle {
            color: #D4AF37;
            font-size: 0.85rem;
            letter-spacing: 2px;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .about-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            line-height: 1.2;
            margin-bottom: 1.5rem;
        }

        .about-title .gold-text {
            color: #D4AF37;
        }

        .about-description {
            margin-bottom: 2rem;
        }

        .about-description p {
            color: #c0c0c0;
            line-height: 1.8;
            font-size: 1.05rem;
            margin-bottom: 1rem;
        }

        /* Nilai Inti / Keunggulan */
        .core-values {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .value-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }

        .value-icon {
            background: #D4AF37;
            color: #08110c;
            width: 25px;
            height: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            font-size: 0.8rem;
            font-weight: bold;
            flex-shrink: 0;
            margin-top: 3px;
        }

        .value-text h4 {
            color: #ffffff;
            font-family: 'Playfair Display', serif;
            font-size: 1.1rem;
            margin-bottom: 0.3rem;
        }

        .value-text p {
            color: #a0a0a0;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        /* Tombol Mewah */
        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 30px;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #08110c;
            text-decoration: none;
            font-weight: 700;
            border-radius: 30px;
            transition: all 0.4s ease;
        }

        .btn-primary::after {
            content: '→';
            transition: transform 0.3s ease;
        }

        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
            background: linear-gradient(45deg, #E6C259, #BF8B2E);
        }

        .btn-primary:hover::after {
            transform: translateX(5px);
        }

        /* Gambar Kanan dengan Animasi */
        .about-image-wrapper {
            flex: 1;
            display: flex;
            justify-content: flex-end;
            z-index: 2;
        }

        .arch-frame {
            width: 100%;
            max-width: 400px;
            aspect-ratio: 4/5;
            padding: 2px;
            background: linear-gradient(to bottom, #D4AF37, transparent);
            border-top-left-radius: 200px;
            border-top-right-radius: 200px;
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            transition: transform 0.5s ease, box-shadow 0.5s ease;
        }

        .arch-frame:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(212, 175, 55, 0.2);
        }

        .arch-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s ease;
        }

        .arch-frame:hover img {
            transform: scale(1.1);
        }

        /* --- LEGALITAS SECTION --- */
        .legalitas-section {
            background: linear-gradient(135deg, #050a07 0%, #0a150f 100%);
            /* Pola titik halus untuk tekstur mewah */
            background-image: radial-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px), linear-gradient(135deg, #050a07 0%, #0a150f 100%);
            background-size: 30px 30px, 100% 100%;
            padding: 6rem 5%;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
            text-align: center;
        }
        
        .legalitas-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .legalitas-header {
            max-width: 800px;
            margin: 0 auto 4rem auto;
        }
        
        .legalitas-subtitle {
            color: #D4AF37;
            font-size: 0.85rem;
            letter-spacing: 2px;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .legalitas-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            color: #ffffff;
            line-height: 1.3;
            margin-bottom: 1.5rem;
        }
        
        .legalitas-title .gold-text {
            color: #D4AF37;
        }
        
        .legalitas-description {
            color: #a0a0a0;
            font-size: 1.05rem;
            line-height: 1.7;
        }
        
        /* Grid Kartu Legalitas */
        .legalitas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        
        .legalitas-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-radius: 15px;
            padding: 2.5rem 1.5rem;
            transition: all 0.5s ease;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(5px);
        }
        
        .legalitas-card:hover {
            transform: translateY(-10px);
            border-color: rgba(212, 175, 55, 0.6);
            box-shadow: 0 15px 35px rgba(212, 175, 55, 0.1);
            background: rgba(212, 175, 55, 0.05);
        }
        
        .legalitas-icon {
            margin-bottom: 1.5rem;
        }
        
        .legalitas-card h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }
        
        .legalitas-card p {
            color: #a0a0a0;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }
        
        /* Garis Emas di bawah kartu */
        .card-line {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 3px;
            background: #D4AF37;
            transition: width 0.5s ease;
        }

        .legalitas-card:hover .card-line {
            width: 100%;
        }

        /* --- SECTION PAKET UMROH & SLIDER --- */
        .mitra-packages-section {
            background-color: #050a07; /* Kembali ke Deep Matcha Gelap yang Konsisten */
            padding: 7rem 5%;
            position: relative;
            overflow: hidden;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .packages-bg-glow {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            height: 70%;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, rgba(16, 38, 24, 0.25) 50%, transparent 80%);
            filter: blur(60px);
            z-index: 1;
            pointer-events: none;
        }

        .packages-container {
            position: relative;
            z-index: 2;
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header & Tombol Slider */
        .packages-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 3.5rem;
        }

        .packages-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-top: 1rem;
            line-height: 1.2;
        }

        .packages-title .gold-text { color: #D4AF37; }

        .packages-desc {
            color: #a3b8aa;
            font-size: 1.05rem;
            max-width: 600px;
            margin-top: 0.8rem;
        }

        /* Tombol Kiri Kanan */
        .slider-nav-buttons {
            display: flex;
            gap: 15px;
        }

        .slider-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #D4AF37;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .slider-btn:hover {
            background: #D4AF37;
            color: #050a07;
            transform: scale(1.05);
        }

        /* Slider Wrapper & Track */
        .packages-slider-wrapper {
            position: relative;
            width: 100%;
            overflow: hidden;
            padding: 10px 0 30px 0;
        }

        .packages-track {
            display: flex;
            gap: 30px;
            overflow-x: auto;
            scroll-behavior: smooth;
            scrollbar-width: none; /* Sembunyikan scrollbar Firefox */
            -ms-overflow-style: none; /* Sembunyikan scrollbar IE */
            padding-bottom: 10px;
        }

        .packages-track::-webkit-scrollbar {
            display: none; /* Sembunyikan scrollbar Chrome/Safari */
        }

        /* Desain Kartu Paket */
        .package-card {
            flex: 0 0 350px; /* Lebar tetap setiap kartu */
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .package-card:hover {
            transform: translateY(-8px);
            border-color: rgba(212, 175, 55, 0.4);
            background: rgba(212, 175, 55, 0.03);
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
        }

        /* Kartu Spesial Terfavorit */
        .featured-card {
            border-color: rgba(212, 175, 55, 0.5);
            background: linear-gradient(180deg, rgba(212,175,55,0.05) 0%, rgba(10,23,15,0.9) 100%);
        }

        .ribbon-fav {
            position: absolute;
            top: 20px;
            right: -35px;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07;
            padding: 6px 40px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 1px;
            transform: rotate(45deg);
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
            z-index: 3;
        }

        /* Gambar & Badge Durasi */
        .card-image-box {
            position: relative;
            height: 220px;
            overflow: hidden;
        }

        .card-image-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
        }

        .package-card:hover .card-image-box img {
            transform: scale(1.1);
        }

        .duration-badge {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(5, 10, 7, 0.85);
            border: 1px solid rgba(212, 175, 55, 0.4);
            color: #D4AF37;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            backdrop-filter: blur(5px);
        }

        /* Konten Kartu */
        .card-body {
            padding: 2.5rem 2rem;
        }

        .package-card h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.5rem;
            margin-bottom: 0.8rem;
        }

        .package-price {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 2rem;
        }

        .package-price .currency {
            font-size: 1rem;
            vertical-align: super;
        }

        .package-price .pax {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.85rem;
            color: #8fa697;
            font-weight: normal;
        }

        /* Fitur List */
        .package-features {
            list-style: none;
            padding: 0;
            margin: 0 0 2rem 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .package-features li {
            color: #c0d1c6;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .icon-check {
            color: #D4AF37;
            font-weight: bold;
        }

        /* Tombol Aksi dalam Kartu */
        .btn-card-solid {
            display: block;
            width: 100%;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
            font-weight: bold;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
        }

        .btn-card-solid:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.5);
        }

        .btn-card-outline {
            display: block;
            width: 100%;
            background: transparent;
            color: #ffffff;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
            font-weight: 500;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }

        .btn-card-outline:hover {
            border-color: #D4AF37;
            color: #D4AF37;
            background: rgba(212, 175, 55, 0.05);
        }

        /* Responsif Mobile */
        @media (max-width: 992px) {
            .packages-header-flex {
                flex-direction: column;
                align-items: flex-start;
                gap: 20px;
            }
            .slider-nav-buttons {
                align-self: flex-end;
            }
            .package-card {
                flex: 0 0 300px;
            }
        }

        /* --- SECTION PAKET HAJI --- */
        .mitra-haji-section {
            background-color: #050a07; /* Konsisten dengan tema Deep Matcha Gelap */
            padding: 7rem 5%;
            position: relative;
            overflow: hidden;
            font-family: 'Plus Jakarta Sans', sans-serif;
            border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .haji-bg-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            height: 70%;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(16, 38, 24, 0.3) 50%, transparent 80%);
            filter: blur(60px);
            z-index: 1;
            pointer-events: none;
        }

        .haji-container {
            position: relative;
            z-index: 2;
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Header & Tombol Slider */
        .haji-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 3.5rem;
        }

        .haji-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-top: 1rem;
            line-height: 1.2;
        }

        .haji-title .gold-text { color: #D4AF37; }

        .haji-desc {
            color: #a3b8aa;
            font-size: 1.05rem;
            max-width: 650px;
            margin-top: 0.8rem;
            line-height: 1.6;
        }

        /* Tombol Navigasi Slider */
        .slider-nav-buttons {
            display: flex;
            gap: 15px;
        }

        .slider-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #D4AF37;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .slider-btn:hover {
            background: #D4AF37;
            color: #050a07;
            transform: scale(1.05);
        }

        /* Slider Track */
        .haji-slider-wrapper {
            position: relative;
            width: 100%;
            overflow: hidden;
            padding: 10px 0 30px 0;
        }

        .haji-track {
            display: flex;
            gap: 30px;
            overflow-x: auto;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding-bottom: 10px;
        }

        .haji-track::-webkit-scrollbar {
            display: none;
        }

        /* Kartu Paket Haji */
        .package-card {
            flex: 0 0 360px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.4s ease;
            backdrop-filter: blur(10px);
            position: relative;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }

        .package-card:hover {
            transform: translateY(-8px);
            border-color: rgba(212, 175, 55, 0.4);
            background: rgba(212, 175, 55, 0.03);
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
        }

        /* Kartu Unggulan (Furoda) */
        .featured-card {
            border-color: rgba(212, 175, 55, 0.5);
            background: linear-gradient(180deg, rgba(212,175,55,0.06) 0%, rgba(10,23,15,0.95) 100%);
        }

        .ribbon-fav {
            position: absolute;
            top: 20px;
            right: -40px;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07;
            padding: 6px 45px;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 1px;
            transform: rotate(45deg);
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
            z-index: 3;
        }

        /* Gambar & Badge */
        .card-image-box {
            position: relative;
            height: 220px;
            overflow: hidden;
        }

        .card-image-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
        }

        .package-card:hover .card-image-box img {
            transform: scale(1.1);
        }

        .duration-badge {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(5, 10, 7, 0.85);
            border: 1px solid rgba(212, 175, 55, 0.4);
            color: #D4AF37;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: bold;
            backdrop-filter: blur(5px);
        }

        /* Konten Dalam Kartu */
        .card-body {
            padding: 2.5rem 2rem;
        }

        .package-card h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.5rem;
            margin-bottom: 0.8rem;
        }

        .package-price {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 1.7rem;
            font-weight: 700;
            margin-bottom: 2rem;
        }

        .package-price .currency {
            font-size: 0.95rem;
            vertical-align: super;
        }

        .package-price .pax {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 0.85rem;
            color: #8fa697;
            font-weight: normal;
        }

        /* Daftar Fasilitas */
        .package-features {
            list-style: none;
            padding: 0;
            margin: 0 0 2rem 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .package-features li {
            color: #c0d1c6;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .icon-check {
            color: #D4AF37;
            font-weight: bold;
        }

        /* Tombol Kartu */
        .btn-card-solid {
            display: block;
            width: 100%;
            background: linear-gradient(45deg, #D4AF37, #AA771C);
            color: #050a07;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
            font-weight: bold;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
        }

        .btn-card-solid:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(212, 175, 55, 0.5);
        }

        .btn-card-outline {
            display: block;
            width: 100%;
            background: transparent;
            color: #ffffff;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
            font-weight: 500;
            text-decoration: none;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }

        .btn-card-outline:hover {
            border-color: #D4AF37;
            color: #D4AF37;
            background: rgba(212, 175, 55, 0.05);
        }

        /* Responsif Mobile */
        @media (max-width: 992px) {
            .haji-header-flex {
                flex-direction: column;
                align-items: flex-start;
                gap: 20px;
            }
            .slider-nav-buttons {
                align-self: flex-end;
            }
            .package-card {
                flex: 0 0 300px;
            }
        }

        /* --- GALERI SECTION --- */
        .galeri-section {
            background-color: #08110c; /* Latar belakang gelap */
            padding: 6rem 5%;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
        }
        
        .galeri-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .galeri-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .galeri-subtitle {
            color: #D4AF37;
            font-size: 0.85rem;
            letter-spacing: 2px;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .galeri-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            color: #ffffff;
            margin-bottom: 1rem;
        }
        
        .galeri-desc {
            color: #a0a0a0;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        /* Tombol Filter */
        .galeri-filters {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 3rem;
            flex-wrap: wrap;
        }
        
        .filter-btn {
            background: transparent;
            border: 1px solid rgba(212, 175, 55, 0.3);
            color: #c0c0c0;
            padding: 10px 25px;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            font-size: 0.95rem;
        }
        
        .filter-btn:hover, .filter-btn.active {
            background: #D4AF37;
            color: #08110c;
            border-color: #D4AF37;
            font-weight: bold;
        }
        
        /* Grid Foto */
        .galeri-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 4rem;
        }
        
        .galeri-item {
            position: relative;
            border-radius: 15px;
            overflow: hidden;
            aspect-ratio: 1 / 1; /* Membuat rasio foto kotak sempurna (1:1) */
            cursor: pointer;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        
        .galeri-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
        }
        
        .galeri-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(8, 17, 12, 0.75); /* Lapisan gelap saat disentuh */
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        
        .galeri-item:hover img {
            transform: scale(1.15); /* Efek zoom foto */
        }
        
        .galeri-item:hover .galeri-overlay {
            opacity: 1;
        }
        
        .overlay-text {
            color: #D4AF37;
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: bold;
            transform: translateY(20px);
            transition: transform 0.4s ease;
            text-align: center;
            padding: 0 15px;
        }
        
        .galeri-item:hover .overlay-text {
            transform: translateY(0); /* Teks naik perlahan */
        }
        
        .galeri-footer {
            text-align: center;
        }

        /* --- VIDEO CINEMATIC --- */
        .video-cinematic-container {
            margin-top: 5rem;
            margin-bottom: 3rem;
            text-align: center;
        }
        
        .video-wrapper {
            position: relative;
            max-width: 900px; /* Ukuran proporsional sinematik */
            margin: 0 auto;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            cursor: pointer;
            border: 1px solid rgba(212, 175, 55, 0.3);
            aspect-ratio: 16 / 9;
        }
        
        .video-cover {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.7s ease;
            filter: brightness(0.8); /* Dibuat sedikit redup agar tombol play menonjol */
        }
        
        .video-wrapper:hover .video-cover {
            transform: scale(1.05);
            filter: brightness(0.6);
        }
        
        .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(212, 175, 55, 0.9);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
            z-index: 2;
        }
        
        /* Efek Animasi Gelombang / Pulse pada tombol Play */
        .play-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid #D4AF37;
            animation: pulse-ring 2s infinite;
        }
        
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
        }
        
        .play-icon {
            color: #08110c;
            font-size: 1.8rem;
            margin-left: 5px; /* Menggeser ikon play sedikit ke kanan agar terlihat pas di tengah */
        }
        
        .video-wrapper:hover .play-button {
            transform: translate(-50%, -50%) scale(1.1);
            background: #D4AF37;
        }
        
        .video-info {
            margin-top: 1.5rem;
        }
        
        .video-info h3 {
            color: #ffffff;
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            margin-bottom: 0.5rem;
        }
        
        .video-info p {
            color: #a0a0a0;
            font-size: 1rem;
        }
        /* --- EXECUTIVE FOOTER SECTION --- */
        .mitra-footer {
            background-color: #040906; /* Latar belakang Matcha paling gelap dan pekat */
            color: #a3b8aa;
            padding: 5rem 5% 2rem;
            font-family: 'Inter', sans-serif;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
        }

        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        /* Grid 4 Kolom Simetris */
        .footer-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr 0.9fr 1.1fr;
            gap: 40px;
            margin-bottom: 4rem;
        }

        /* Logo & Brand Area */
        .footer-logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 1.2rem;
        }

        .footer-logo-icon {
            font-size: 2rem;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            padding: 8px 12px;
            border-radius: 12px;
        }

        .footer-brand-text h3 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            font-size: 1.3rem;
            margin: 0;
        }

        .footer-brand-text span {
            font-size: 0.75rem;
            color: #D4AF37;
            letter-spacing: 1.5px;
            font-weight: 700;
        }

        .footer-desc {
            font-size: 0.9rem;
            line-height: 1.6;
            color: #8fa697;
            margin-bottom: 1.5rem;
        }

        /* Kotak Legalitas */
        .footer-legal-box {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 12px 15px;
            border-radius: 12px;
            font-size: 0.8rem;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }

        .footer-legal-box strong {
            color: #ffffff;
            display: block;
        }

        .footer-legal-box span {
            color: #a3b8aa;
            display: block;
        }

        .footer-legal-box .licence {
            color: #D4AF37;
            margin-top: 4px;
            font-family: monospace;
        }

        /* Sosial Media Icons */
        .footer-socials {
            display: flex;
            gap: 10px;
        }

        .social-icon {
            width: 38px;
            height: 38px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .social-icon:hover {
            background: #D4AF37;
            border-color: #D4AF37;
            transform: translateY(-3px);
        }

        /* Heading Kolom */
        .footer-col h4 {
            font-family: 'Playfair Display', serif;
            color: #D4AF37;
            font-size: 1.15rem;
            margin-bottom: 1.5rem;
            letter-spacing: 0.5px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.15);
            padding-bottom: 8px;
        }

        .footer-col .sub-heading {
            margin-top: 2rem;
        }

        /* Tautan Link */
        .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .footer-links li a {
            color: #a3b8aa;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .footer-links li a:hover {
            color: #D4AF37;
            padding-left: 5px; /* Efek geser kecil saat di-hover */
        }

        /* Kontak Informasi List */
        .contact-info-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .contact-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .contact-icon {
            font-size: 1rem;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .contact-item p {
            margin: 0;
            color: #c0d1c6;
        }

        .contact-item .note {
            color: #8fa697;
            font-size: 0.8rem;
        }

        /* Copyright Bar Bawah */
        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 2rem;
            text-align: center;
            font-size: 0.85rem;
            color: #7b8e83;
        }

        /* Responsif Mobile */
        @media (max-width: 992px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }
        }
        @media (max-width: 600px) {
            .footer-grid {
                grid-template-columns: 1fr;
                gap: 30px;
            }
        }
      `}} />
      <header className="header">
          <div className="logo">
              <div className="logo-img"></div>
              <div className="logo-text">

                  <h2>PT GOLDEN TOUR HAROMAIN</h2>
                  <p>PELAYANAN HAJI & UMROH PREMIUM</p>
              </div>
          </div>
          <div className="menu">
              <a href="#" className="active" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: "smooth"}); }}>Beranda</a>
              <a href="#tentang-kami" onClick={(e) => scrollToSection(e, 'tentang-kami')}>Tentang Kami</a>
              <Link to="/legalitas">Legalitas</Link>
              <a href="#pilihan-paket" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>Paket Umroh</a>
              <a href="#pilihan-haji" onClick={(e) => scrollToSection(e, 'pilihan-haji')}>Paket Haji</a>
              <a href="#galeri" onClick={(e) => scrollToSection(e, 'galeri')}>Galeri</a>
              <Link to="/mitra">Kemitraan</Link>
          </div>
          <Link to="/login" className="btn-login" style={{textDecoration: 'none'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
              Masuk
          </Link>
      </header>

      <div className="hero-section">
          <div className="content">
              <div className="subtitle">✨ LANGKAH SUCI MENUJU BAITULLAH</div>
              <h1>Wujudkan Perjalanan Ibadah yang<br/><span className="gold-text">Nyaman, Aman, dan Berkah</span><br/>Bersama PT Golden Tour Haromain</h1>
              <p className="desc">PT Golden Tour Haromain hadir sebagai sahabat perjalanan ibadah Anda. Dengan pelayanan profesional, pembimbing berpengalaman, legalitas resmi, serta fasilitas premium, kami berkomitmen menghadirkan pengalaman Umroh dan Haji yang nyaman, aman, dan penuh kekhusyukan.</p>
              
              <div className="cta-group">
                  <a href="#pilihan-paket" className="btn-primary" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>Lihat Paket</a>
                  <a href="https://wa.me/628123456789" className="btn-outline" target="_blank" rel="noreferrer">Konsultasi Gratis</a>
              </div>

              <div className="trust-badges">
                  <div className="badge"><span className="badge-icon">📄</span> Izin Umroh Resmi</div>
                  <div className="badge"><span className="badge-icon">👤</span> Pembimbing Berpengalaman</div>
                  <div className="badge"><span className="badge-icon">🏢</span> Fasilitas Premium</div>
              </div>
          </div>
      </div>
      
      {/* TENTANG KAMI SECTION */}
      <section className="about-section" id="tentang-kami">
          <div className="about-container">
              {/* Bagian Kiri: Teks */}
              <div className="about-text">
                  <div className="about-subtitle">✨ TENTANG PT. GOLDEN TOUR HARAMAIN</div>
                  <h2 className="about-title">Dedikasi Menjaga Kekhusyukan Ibadah Anda<br/><span className="gold-text">di Tanah Suci</span></h2>
                  
                  <div className="about-description">
                      <p><strong>PT Golden Tour Haromain (PT. Golden Tour Haromain)</strong> didirikan atas dasar niat suci untuk memfasilitasi umat Muslim di Indonesia dalam menunaikan ibadah Umrah dan Haji secara paripurna. Kami hadir bukan sekadar sebagai biro perjalanan, melainkan sebagai mitra spiritual yang mendampingi setiap langkah Anda menuju Baitullah.</p>
                      <p>Dengan berpegang teguh pada tuntunan Sunnah, kami merancang setiap program secara teliti untuk memastikan kenyamanan, keamanan, dan kesempurnaan ibadah Anda.</p>
                  </div>
      
                  {/* Nilai Inti / Keunggulan */}
                  <div className="core-values">
                      <div className="value-item">
                          <div className="value-icon">✓</div>
                          <div className="value-text">
                              <h4>Legalitas & Keamanan Terjamin</h4>
                              <p>Terdaftar resmi di Kemenag RI, memberikan kepastian jadwal keberangkatan 100% tanpa rasa was-was.</p>
                          </div>
                      </div>
                      <div className="value-item">
                          <div className="value-icon">✓</div>
                          <div className="value-text">
                              <h4>Bimbingan Sesuai Sunnah</h4>
                              <p>Ibadah Anda didampingi langsung oleh asatidz dan mutawwif berpengalaman lulusan universitas Timur Tengah.</p>
                          </div>
                      </div>
                      <div className="value-item">
                          <div className="value-icon">✓</div>
                          <div className="value-text">
                              <h4>Fasilitas Premium & Strategis</h4>
                              <p>Akomodasi maskapai penerbangan terbaik dan hotel bintang 4/5 di ring satu untuk menjaga stamina ibadah Anda.</p>
                          </div>
                      </div>
                  </div>
      
                  <a href="#pilihan-paket" className="btn-primary" onClick={(e) => scrollToSection(e, 'pilihan-paket')}>Lihat Profil Perusahaan</a>
              </div>
      
              {/* Bagian Kanan: Foto Bingkai Kubah */}
              <div className="about-image-wrapper">
                  <div className="arch-frame">
                      {/* Pastikan foto jemaah bernama foto-about.jpg.jpeg */}
                      <img src="/foto-about.jpg.jpeg" alt="Tentang PT Golden Tour Haromain" />
                  </div>
              </div>
          </div>
      </section>

      {/* SECTION LEGALITAS & KEAMANAN */}
      <section className="legalitas-section" id="legalitas">
          <div className="legalitas-container">
              <div className="legalitas-header">
                  <div className="legalitas-subtitle">✨ LEGALITAS & SERTIFIKASI RESMI</div>
                  <h2 className="legalitas-title">Keamanan & Kenyamanan Anda<br/><span className="gold-text">Adalah Prioritas Utama</span></h2>
                  <p className="legalitas-description">
                      PT. Golden Tour Haromain telah terdaftar secara resmi dan diawasi langsung oleh Kementerian Agama Republik Indonesia. Kami berkomitmen memberikan kepastian jadwal keberangkatan tanpa keraguan.
                  </p>
              </div>
      
              <div className="legalitas-grid">
                  {/* Kartu 1: PPIU */}
                  <div className="legalitas-card">
                      <div className="legalitas-icon">
                          <img src="https://cdn-icons-png.flaticon.com/512/3514/3514491.png" alt="Izin Umrah" style={{width: '45px', filter: 'brightness(0) saturate(100%) invert(77%) sepia(42%) saturate(583%) hue-rotate(5deg) brightness(96%) contrast(88%)'}} />
                      </div>
                      <h3>Izin Penyelenggara Umrah (PPIU)</h3>
                      <p>SK Kemenag RI No. XXXX Tahun 202X</p>
                      <div className="card-line"></div>
                  </div>
      
                  {/* Kartu 2: PIHK (Haji Khusus) */}
                  <div className="legalitas-card">
                      <div className="legalitas-icon">
                          <img src="https://cdn-icons-png.flaticon.com/512/3514/3514491.png" alt="Izin Haji" style={{width: '45px', filter: 'brightness(0) saturate(100%) invert(77%) sepia(42%) saturate(583%) hue-rotate(5deg) brightness(96%) contrast(88%)'}} />
                      </div>
                      <h3>Izin Penyelenggara Haji Khusus (PIHK)</h3>
                      <p>SK Kemenag RI No. XXXX Tahun 202X</p>
                      <div className="card-line"></div>
                  </div>
      
                  {/* Kartu 3: Asosiasi */}
                  <div className="legalitas-card">
                      <div className="legalitas-icon">
                          <img src="https://cdn-icons-png.flaticon.com/512/6148/6148811.png" alt="Asosiasi" style={{width: '45px', filter: 'brightness(0) saturate(100%) invert(77%) sepia(42%) saturate(583%) hue-rotate(5deg) brightness(96%) contrast(88%)'}} />
                      </div>
                      <h3>Keanggotaan Asosiasi</h3>
                      <p>Terdaftar resmi sebagai anggota AMPHURI / HIMPUH.</p>
                      <div className="card-line"></div>
                  </div>
      
                  {/* Kartu 4: Perusahaan */}
                  <div className="legalitas-card">
                      <div className="legalitas-icon">
                          <img src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png" alt="Legalitas" style={{width: '45px', filter: 'brightness(0) saturate(100%) invert(77%) sepia(42%) saturate(583%) hue-rotate(5deg) brightness(96%) contrast(88%)'}} />
                      </div>
                      <h3>Legalitas Perusahaan</h3>
                      <p>NIB & Akta Pendirian Perusahaan Tersertifikasi.</p>
                      <div className="card-line"></div>
                  </div>
              </div>
          </div>
      </section>

      {/* SECTION PAKET UMRAH */}
      <section className="mitra-packages-section" id="pilihan-paket">
          {/* Efek Pendaran Cahaya Latar */}
          <div className="packages-bg-glow"></div>

          <div className="packages-container">
              {/* Header & Tombol Navigasi Slider */}
              <div className="packages-header-flex">
                  <div className="packages-header-text">
                      <span className="gold-badge">PILIHAN PAKET TERBAIK</span>
                      <h2 className="packages-title">Pilih Perjalanan Ibadah <br/><span className="gold-text">Sesuai Kebutuhan Anda</span></h2>
                      <p className="packages-desc">Nikmati kenyamanan ibadah ke Tanah Suci dengan fasilitas kelas dunia bersama PT. Golden Tour Haromain.</p>
                  </div>
                  {/* Tombol Navigasi Kiri Kanan */}
                  <div className="slider-nav-buttons">
                      <button className="slider-btn prev-btn" aria-label="Sebelumnya" onClick={handlePrev}>❮</button>
                      <button className="slider-btn next-btn" aria-label="Selanjutnya" onClick={handleNext}>❯</button>
                  </div>
              </div>

              {/* Wadah Slider (Carousel Track) */}
              <div className="packages-slider-wrapper">
                  <div className="packages-track" id="packagesTrack" ref={trackRef}>
                      
                      {packages.filter(p => p.type === 'umroh' || !p.type).map((pkg) => (
                          <div key={pkg.id} className="package-card">
                              <div className="card-image-box">
                                  <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} />
                                  <div className="duration-badge">{pkg.duration}</div>
                              </div>
                              <div className="card-body">
                                  <h3>{pkg.name}</h3>
                                  <div className="package-price"><span className="currency">Rp</span> {Number(pkg.price).toLocaleString('id-ID')} <span className="pax">/ pax</span></div>
                                  <div className="package-features-list mt-3 mb-6 space-y-1 text-left">
                                      {Array.isArray(pkg.description) ? (
                                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="text-gold-500 font-bold">✓</span> {line}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-600 line-clamp-3">{pkg.description}</p>
                                      )}
                                  </div>
                                  <Link to="/login" className="btn-card-outline">Lihat Detail Jadwal</Link>
                              </div>
                          </div>
                      ))}

                      {/* FALLBACK/HARDCODED CARDS */}
                      {packages.filter(p => p.type === 'umroh' || !p.type).length === 0 && !loading && (
                        <>
                          <div className="package-card">
                              <div className="card-image-box">
                                  <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Paket Safa" />
                                  <div className="duration-badge">9 Hari</div>
                              </div>
                              <div className="card-body">
                                  <h3>Paket Safa (Reguler)</h3>
                                  <div className="package-price"><span className="currency">Rp</span> 28.500.000 <span className="pax">/ pax</span></div>
                                  <ul className="package-features">
                                      <li><span className="icon-check">✓</span> Saudia Airlines / Garuda</li>
                                      <li><span className="icon-check">✓</span> Makkah: Azka Al Safa (4⭐)</li>
                                      <li><span className="icon-check">✓</span> Madinah: Taiba Front (4⭐)</li>
                                      <li><span className="icon-check">✓</span> Bus Full AC / Kereta Cepat</li>
                                  </ul>
                                  <a href="#booking" className="btn-card-outline">Lihat Detail Jadwal</a>
                              </div>
                          </div>
                          <div className="package-card featured-card">
                              <div className="ribbon-fav"><span>TERFAVORIT</span></div>
                              <div className="card-image-box">
                                  <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Paket Marwa" />
                                  <div className="duration-badge">12 Hari</div>
                              </div>
                              <div className="card-body">
                                  <h3>Paket Marwa (VIP)</h3>
                                  <div className="package-price"><span className="currency">Rp</span> 35.000.000 <span className="pax">/ pax</span></div>
                                  <ul className="package-features">
                                      <li><span className="icon-check">✓</span> Saudia Airlines (Direct)</li>
                                      <li><span className="icon-check">✓</span> Makkah: Pullman ZamZam (5⭐)</li>
                                      <li><span className="icon-check">✓</span> Madinah: Anwar Movenpick (5⭐)</li>
                                      <li><span className="icon-check">✓</span> Kereta Cepat Haramain (VIP)</li>
                                  </ul>
                                  <a href="#booking" className="btn-card-solid">Booking Sekarang</a>
                              </div>
                          </div>
                        </>
                      )}
                      {loading && <div className="p-10 text-center w-full">Memuat paket...</div>}
                  </div>
              </div>
          </div>
      </section>
      {/* SECTION PAKET HAJI */}
      <section className="mitra-haji-section" id="pilihan-haji">
          {/* Efek Pendaran Cahaya Latar */}
          <div className="haji-bg-glow"></div>

          <div className="haji-container">
              {/* Header & Tombol Navigasi Slider */}
              <div className="haji-header-flex">
                  <div className="haji-header-text">
                      <span className="gold-badge">PROGRAM HAJI RESMI & EKSKLUSIF</span>
                      <h2 className="haji-title">Perjalanan Suci Menuju Baitullah <br/><span className="gold-text">Tanpa Batas Kenyamanan</span></h2>
                      <p className="haji-desc">Wujudkan niat suci berhaji dengan kepastian keberangkatan dan bimbingan syariat sesuai sunnah bersama PT. Golden Tour Haromain.</p>
                  </div>
                  {/* Tombol Navigasi Kiri Kanan */}
                  <div className="slider-nav-buttons">
                      <button className="slider-btn haji-prev" aria-label="Sebelumnya" onClick={handleHajiPrev}>❮</button>
                      <button className="slider-btn haji-next" aria-label="Selanjutnya" onClick={handleHajiNext}>❯</button>
                  </div>
              </div>

              {/* Wadah Slider (Carousel Track) */}
              <div className="haji-slider-wrapper">
                  <div className="haji-track" id="hajiTrack" ref={hajiTrackRef}>
                      {/* DYNAMIC HAJI PACKAGES START */}
                      {packages.filter(p => p.type === 'haji').map((pkg) => (
                          <div key={pkg.id} className="package-card">
                              <div className="card-image-box">
                                  <img src={pkg.imageUrl || "https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80"} alt={pkg.name} />
                                  <div className="duration-badge">{pkg.duration}</div>
                              </div>
                              <div className="card-body">
                                  <h3>{pkg.name}</h3>
                                  <div className="package-price"><span className="currency">Rp</span> {Number(pkg.price).toLocaleString('id-ID')} <span className="pax">/ pax</span></div>
                                  <div className="package-features-list mt-3 mb-6 space-y-1 text-left">
                                      {Array.isArray(pkg.description) ? (
                                        pkg.description.slice(0, 4).map((line: string, i: number) => (
                                          <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="text-gold-500 font-bold">✓</span> {line}
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-600 line-clamp-3">{pkg.description}</p>
                                      )}
                                  </div>
                                  <Link to="/login" className="btn-card-outline">Lihat Detail Jadwal</Link>
                              </div>
                          </div>
                      ))}
                      {/* DYNAMIC HAJI PACKAGES END */}

                      {/* KARTU 1: HAJI KHUSUS (ONH PLUS) */}
                      <div className="package-card">
                          <div className="card-image-box">
                              <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Haji Khusus" />
                              <div className="duration-badge">26 Hari</div>
                          </div>
                          <div className="card-body">
                              <h3>Haji Khusus (ONH Plus)</h3>
                              <div className="package-price"><span className="currency">USD</span> 14.500 <span className="pax">/ pax</span></div>
                              
                              <ul className="package-features">
                                  <li><span className="icon-check">✓</span> Kuota Resmi Kementerian Agama RI</li>
                                  <li><span className="icon-check">✓</span> Makkah: Fairmont / Pullman (5⭐)</li>
                                  <li><span className="icon-check">✓</span> Madinah: Oberoi / Movenpick (5⭐)</li>
                                  <li><span className="icon-check">✓</span> Tenda Maktab VIP & Kereta Cepat</li>
                              </ul>
                              
                              <a href="#booking" className="btn-card-outline">Konsultasi Kuota</a>
                          </div>
                      </div>

                      {/* KARTU 2: HAJI FURODA (VIP - TANPA ANTRI) */}
                      <div className="package-card featured-card">
                          <div className="ribbon-fav"><span>TANPA ANTRI</span></div>
                          <div className="card-image-box">
                              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Haji Furoda" />
                              <div className="duration-badge">24 Hari</div>
                          </div>
                          <div className="card-body">
                              <h3>Haji Furoda (Visa Mujamalah)</h3>
                              <div className="package-price"><span className="currency">Mulai USD</span> 21.000 <span className="pax">/ pax</span></div>
                              
                              <ul className="package-features">
                                  <li><span className="icon-check">✓</span> Berangkat Tahun Berjalan (Tanpa Antri)</li>
                                  <li><span className="icon-check">✓</span> Visa Mujamalah Resmi Kerajaan Saudi</li>
                                  <li><span className="icon-check">✓</span> Hotel Bintang 5 Plor Pelataran Haram</li>
                                  <li><span className="icon-check">✓</span> Tenda AC Khusus Jemaah Furoda</li>
                              </ul>
                              
                              <a href="#booking" className="btn-card-solid">Amankan Kursi</a>
                          </div>
                      </div>

                      {/* KARTU 3: HAJI EKSKLUSIF AR-RAUDAH */}
                      <div className="package-card">
                          <div className="card-image-box">
                              <img src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80" alt="Haji Ar-Raudah" />
                              <div className="duration-badge">30 Hari</div>
                          </div>
                          <div className="card-body">
                              <h3>Haji Ar-Raudah (Elite)</h3>
                              <div className="package-price"><span className="currency">USD</span> 25.000 <span className="pax">/ pax</span></div>
                              
                              <ul className="package-features">
                                  <li><span className="icon-check">✓</span> Penerbangan First / Business Class</li>
                                  <li><span className="icon-check">✓</span> Akomodasi Suite Room View Ka'bah</li>
                                  <li><span className="icon-check">✓</span> Muthawif & Pembimbing Pribadi</li>
                                  <li><span className="icon-check">✓</span> Fasilitas Transportasi Mercedes VIP</li>
                              </ul>
                              
                              <a href="#booking" className="btn-card-outline">Konsultasi Kuota</a>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      </section>

      {/* SECTION GALERI */}
      <section className="galeri-section" id="galeri">
          <div className="galeri-container">
              <div className="galeri-header">
                  <div className="galeri-subtitle">✨ JEJAK LANGKAH SPIRITUAL</div>
                  <h2 className="galeri-title">Galeri <span className="gold-text">Keberangkatan</span></h2>
                  <p className="galeri-desc">Kumpulan momen indah dan khusyuk para Tamu Allah yang telah mempercayakan perjalanan sucinya bersama PT Golden Tour Haromain.</p>
              </div>
      
              {/* Tombol Filter Elegan */}
              <div className="galeri-filters">
                  <button className="filter-btn active">Semua Momen</button>
                  <button className="filter-btn">Keberangkatan</button>
                  <button className="filter-btn">Makkah</button>
                  <button className="filter-btn">Madinah</button>
              </div>
      
              {/* Grid Foto */}
              <div className="galeri-grid">
                  {/* Foto 1 */}
                  <div className="galeri-item">
                      {/* Ganti link gambar ini dengan foto asli jemaah Anda nanti */}
                      <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Makkah" />
                      <div className="galeri-overlay">
                          <span className="overlay-text">Khusyuk di Baitullah</span>
                      </div>
                  </div>
                  
                  {/* Foto 2 */}
                  <div className="galeri-item">
                      <img src="https://images.unsplash.com/photo-1565552643954-1a4be7aa0fc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Madinah" />
                      <div className="galeri-overlay">
                          <span className="overlay-text">Ziarah Masjid Nabawi</span>
                      </div>
                  </div>
      
                  {/* Foto 3 */}
                  <div className="galeri-item">
                      <img src="https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Turki" />
                      <div className="galeri-overlay">
                          <span className="overlay-text">City Tour Turki</span>
                      </div>
                  </div>
      
                  {/* Foto 4 */}
                  <div className="galeri-item">
                      <img src="https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Keberangkatan" />
                      <div className="galeri-overlay">
                          <span className="overlay-text">Briefing Bandara</span>
                      </div>
                  </div>
              </div>
      
              {/* Video Cinematic Showcase */}
              <div className="video-cinematic-container">
                  <div className="video-wrapper">
                      {/* Gambar Thumbnail Video (Ganti dengan foto atau cover video Anda) */}
                      <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="Cinematic Profile PT Golden Tour Haromain" className="video-cover" />
                      
                      {/* Tombol Play Beranimasi */}
                      <div className="play-button">
                          <span className="play-icon">▶</span>
                      </div>
                  </div>
                  <div className="video-info">
                      <h3>Kenyamanan Beribadah Bersama PT Golden Tour Haromain</h3>
                      <p>Saksikan cuplikan perjalanan khusyuk para jemaah kami di Tanah Suci.</p>
                  </div>
              </div>

              <div className="galeri-footer">
                  <a href="#" className="btn-primary">Lihat Lebih Banyak Foto</a>
              </div>
          </div>
      </section>

      {/* SECTION FOOTER */}
      <footer className="mitra-footer">
          <div className="footer-container">
              <div className="footer-grid">
                  
                  {/* KOLOM 1: BRAND & LEGALITAS */}
                  <div className="footer-col brand-col">
                      <div className="footer-logo-area">
                          <div className="footer-logo-icon">🕌</div>
                          <div className="footer-brand-text">
                              <h3>PT Golden Tour Haromain</h3>
                              <span>PT. GOLDEN TOUR HARAMAIN</span>
                          </div>
                      </div>
                      <p className="footer-desc">Biro perjalanan Haji dan Umroh terpercaya. Melayani dengan sepenuh hati untuk ibadah yang mabrur dan perjalanan yang berkesan.</p>
                      
                      <div className="footer-legal-box">
                          <strong>PT. GOLDEN TOUR HARAMAIN</strong>
                          <span>Mitra PT. SEDERHANA ALMAIDANI GROUP</span>
                          <span className="licence">Izin PPIU: 08012300040570002</span>
                      </div>

                      <div className="footer-socials">
                          <a href="#" className="social-icon" aria-label="Instagram">📷</a>
                          <a href="#" className="social-icon" aria-label="Facebook">📘</a>
                          <a href="#" className="social-icon" aria-label="YouTube">▶</a>
                      </div>
                  </div>

                  {/* KOLOM 2: LAYANAN KAMI */}
                  <div className="footer-col">
                      <h4>Layanan Kami</h4>
                      <ul className="footer-links">
                          <li><a href="#pilihan-paket">Paket Umroh Reguler</a></li>
                          <li><a href="#pilihan-paket">Paket Umroh Plus</a></li>
                          <li><a href="#pilihan-haji">Haji Furoda & Khusus</a></li>
                          <li><a href="#">Pembuatan Visa</a></li>
                      </ul>
                  </div>

                  {/* KOLOM 3: TAUTAN & PORTAL */}
                  <div className="footer-col">
                      <h4>Tautan Cepat</h4>
                      <ul className="footer-links">
                          <li><a href="#">Tentang Kami</a></li>
                          <li><a href="#">Syarat & Ketentuan</a></li>
                          <li><a href="#">Kebijakan Privasi</a></li>
                          <li><Link to="/mitra/login">Menjadi Mitra</Link></li>
                      </ul>
                      <h4 className="sub-heading">Portal Akses</h4>
                      <ul className="footer-links">
                          <li><Link to="/login">Login Jamaah</Link></li>
                          <li><Link to="/mitra/login">Login Mitra</Link></li>
                          <li><Link to="/admin/login">Login Admin</Link></li>
                      </ul>
                  </div>

                  {/* KOLOM 4: HUBUNGI KAMI */}
                  <div className="footer-col">
                      <h4>Hubungi Kami</h4>
                      <div className="contact-info-list">
                          <div className="contact-item">
                              <span className="contact-icon">📍</span>
                              <p>Jl. Engku Putri No. 123, Batam Center, Batam, Kepulauan Riau 29461</p>
                          </div>
                          <div className="contact-item">
                              <span className="contact-icon">📞</span>
                              <div>
                                  <p>0822-8320-1103 <span className="note">(Konsultasi 1)</span></p>
                                  <p>0822-8830-8220 <span className="note">(Konsultasi 2)</span></p>
                              </div>
                          </div>
                          <div className="contact-item">
                              <span className="contact-icon">✉️</span>
                              <p>info@goldentravel.com</p>
                          </div>
                      </div>
                  </div>

              </div>

              {/* COPYRIGHT BAR */}
              <div className="footer-bottom">
                  <p>&copy; {new Date().getFullYear()} PT Golden Tour Haromain Haji & Umroh. Hak Cipta Dilindungi.</p>
              </div>
          </div>
      </footer>


      <div className="wa-float">
          <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.74.45 3.38 1.23 4.79L2 22l5.35-1.18c1.37.7 2.94 1.1 4.65 1.1 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
      </div>
    </>
  );
}
