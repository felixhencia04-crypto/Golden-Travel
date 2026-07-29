import React from 'react';
import { Link } from 'react-router-dom';
import { useLogo } from '../utils/logo';

export default function Footer() {
  const logoImg = useLogo();

  return (
    <footer className="mitra-footer">
        <div className="footer-container">
            <div className="footer-grid">
                
                {/* KOLOM 1: BRAND & LEGALITAS */}
                <div className="footer-col brand-col">
                    <div className="footer-logo-area">
                        <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain mr-3 rounded-full" />
                        <div className="footer-brand-text">
                            <h3 className="whitespace-nowrap">GOLDEN TOUR HARAMAIN</h3>
                            <span className="whitespace-nowrap">PT. GOLDEN TOUR HARAMAIN</span>
                        </div>
                    </div>
                    <p className="footer-desc">Biro perjalanan Haji dan Umroh terpercaya. Melayani dengan sepenuh hati untuk ibadah yang mabrur dan perjalanan yang berkesan.</p>
                    
                    <div className="footer-legal-box">
                        <strong>PT. GOLDEN TOUR HARAMAIN</strong>
                        <span>Mitra PT. SEDERHANA ALMAIDANI GROUP</span>
                        <span className="licence">Izin PPIU Kemenag RI Terdaftar Resmi</span>
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
                        <li><Link to="/paket-umroh">Paket Umroh Reguler</Link></li>
                        <li><Link to="/paket-umroh">Paket Umroh Plus</Link></li>
                        <li><Link to="/paket-haji">Haji Furoda & Khusus</Link></li>
                        <li><Link to="#">Pembuatan Visa</Link></li>
                    </ul>
                </div>

                {/* KOLOM 3: TAUTAN & PORTAL */}
                <div className="footer-col">
                    <h4>Tautan Cepat</h4>
                    <ul className="footer-links">
                        <li><Link to="#">Tentang Kami</Link></li>
                        <li><Link to="#">Syarat & Ketentuan</Link></li>
                        <li><Link to="#">Kebijakan Privasi</Link></li>
                        <li><Link to="/mitra">Menjadi Mitra</Link></li>
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
                            <p>Komplek Marbella Residence Blok D7 Nomor : 09, Desa/Kelurahan Belian, Kec. Batam Kota, Kota Batam, Provinsi Kepulauan Riau, Kode Pos: 29464</p>
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
                            <p>travelgolden2026@gmail.com</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} PT Golden Tour Haramain Haji & Umroh. Hak Cipta Dilindungi.</p>
            </div>
        </div>
    </footer>
  );
}
