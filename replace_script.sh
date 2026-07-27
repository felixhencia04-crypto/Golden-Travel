sed -i '/{\/\* Seksi 7: Penawaran Promo & Pendaftaran \*\/}/,/<\/section>/c\
      {/* Seksi 7: Penawaran Promo & Pendaftaran */}\
      <style dangerouslySetInnerHTML={{__html: `\
        /* --- SECTION INVESTASI KEMITRAAN --- */\
        .mitra-investment-section {\
            background-color: #060d09; /* Latar gelap Deep Matcha */\
            padding: 6rem 5% 8rem;\
            font-family: '\''Plus Jakarta Sans'\'', sans-serif;\
            position: relative;\
            border-radius: 3rem;\
        }\
\
        .investment-container {\
            max-width: 900px;\
            margin: 0 auto;\
        }\
\
        /* Header Area */\
        .investment-header {\
            text-align: center;\
            margin-bottom: 4rem;\
        }\
\
        .gold-badge {\
            display: inline-block;\
            background: rgba(212, 175, 55, 0.1);\
            color: #D4AF37;\
            padding: 8px 20px;\
            border-radius: 30px;\
            font-size: 0.85rem;\
            font-weight: 700;\
            letter-spacing: 2px;\
            border: 1px solid rgba(212, 175, 55, 0.4);\
            margin-bottom: 1.5rem;\
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.15);\
        }\
\
        .investment-title {\
            font-family: '\''Playfair Display'\'', serif;\
            font-size: 3rem;\
            color: #ffffff;\
            margin-bottom: 1rem;\
        }\
\
        .investment-title .gold-text { color: #D4AF37; }\
\
        .investment-desc {\
            color: #a3b8aa;\
            font-size: 1.1rem;\
            line-height: 1.6;\
        }\
\
        /* Kartu Investasi (Glassmorphism Premium) */\
        .investment-card-wrapper {\
            position: relative;\
            /* Efek pendaran di belakang kartu */\
            box-shadow: 0 0 100px rgba(212, 175, 55, 0.05); \
            border-radius: 30px;\
        }\
\
        .investment-card {\
            background: linear-gradient(180deg, rgba(20, 43, 27, 0.8) 0%, rgba(5, 10, 7, 0.95) 100%);\
            border: 1px solid rgba(212, 175, 55, 0.25);\
            border-radius: 30px;\
            padding: 4rem;\
            backdrop-filter: blur(20px);\
            text-align: center;\
        }\
\
        /* Bagian Harga */\
        .price-normal {\
            color: #7b8e83;\
            font-size: 1.1rem;\
            text-decoration: line-through;\
            margin-bottom: 0.5rem;\
        }\
\
        .price-special {\
            font-family: '\''Playfair Display'\'', serif;\
            color: #D4AF37;\
            font-size: 5rem;\
            font-weight: 700;\
            line-height: 1;\
            margin-bottom: 0.5rem;\
            text-shadow: 0 5px 15px rgba(212, 175, 55, 0.2);\
        }\
\
        .price-special .currency {\
            font-size: 2.5rem;\
            vertical-align: top;\
            margin-right: 5px;\
        }\
\
        .price-special .suffix {\
            font-size: 2.5rem;\
        }\
\
        .price-note {\
            background: rgba(212, 175, 55, 0.1);\
            color: #e6d39a;\
            display: inline-block;\
            padding: 6px 16px;\
            border-radius: 20px;\
            font-size: 0.9rem;\
            font-weight: 500;\
        }\
\
        /* Garis Pemisah */\
        .luxury-divider {\
            height: 1px;\
            background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);\
            margin: 3rem 0;\
        }\
\
        /* Daftar Fasilitas */\
        .benefits-title {\
            color: #ffffff;\
            font-size: 1.1rem;\
            margin-bottom: 2rem;\
            font-weight: 500;\
        }\
\
        .benefits-grid {\
            display: grid;\
            grid-template-columns: 1fr 1fr;\
            gap: 20px;\
            text-align: left;\
            margin-bottom: 3rem;\
        }\
\
        .benefit-item {\
            display: flex;\
            align-items: center;\
            gap: 12px;\
            color: #c0d1c6;\
            font-size: 1.05rem;\
            padding: 15px;\
            background: rgba(255, 255, 255, 0.02);\
            border-radius: 12px;\
            border: 1px solid rgba(255, 255, 255, 0.05);\
            transition: all 0.3s ease;\
        }\
\
        .benefit-item:hover {\
            background: rgba(212, 175, 55, 0.05);\
            border-color: rgba(212, 175, 55, 0.2);\
            transform: translateX(5px);\
        }\
\
        .check-icon {\
            background: #D4AF37;\
            color: #050a07;\
            width: 24px;\
            height: 24px;\
            display: flex;\
            justify-content: center;\
            align-items: center;\
            border-radius: 50%;\
            font-size: 0.8rem;\
            font-weight: bold;\
            flex-shrink: 0;\
        }\
\
        .highlight-benefit {\
            border-color: rgba(212, 175, 55, 0.4);\
            background: rgba(212, 175, 55, 0.05);\
        }\
\
        /* Area Tombol Aksi */\
        .action-text {\
            color: #8fa697;\
            font-size: 0.95rem;\
            margin-bottom: 1.5rem;\
        }\
\
        .contact-buttons {\
            display: flex;\
            justify-content: center;\
            gap: 20px;\
        }\
\
        .btn-wa-gold {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            background: linear-gradient(45deg, #D4AF37, #AA771C);\
            color: #050a07;\
            padding: 16px 35px;\
            border-radius: 50px;\
            font-weight: 700;\
            text-decoration: none;\
            font-size: 1.05rem;\
            transition: all 0.3s ease;\
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);\
        }\
\
        .btn-wa-gold:hover {\
            transform: translateY(-3px);\
            box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);\
        }\
\
        .btn-wa-outline {\
            display: flex;\
            align-items: center;\
            gap: 10px;\
            background: transparent;\
            color: #D4AF37;\
            padding: 16px 35px;\
            border-radius: 50px;\
            font-weight: 700;\
            text-decoration: none;\
            font-size: 1.05rem;\
            border: 2px solid #D4AF37;\
            transition: all 0.3s ease;\
        }\
\
        .btn-wa-outline:hover {\
            background: rgba(212, 175, 55, 0.1);\
            transform: translateY(-3px);\
        }\
\
        /* Responsif Mobile */\
        @media (max-width: 768px) {\
            .investment-card { padding: 2.5rem 1.5rem; }\
            .price-special { font-size: 3.5rem; }\
            .benefits-grid { grid-template-columns: 1fr; }\
            .contact-buttons { flex-direction: column; }\
            .btn-wa-gold, .btn-wa-outline { width: 100%; justify-content: center; }\
        }\
      `}} />\
      <section className="mitra-investment-section">\
          <div className="investment-container">\
              <div className="investment-header">\
                  {/* Menggunakan istilah Smart Investment agar terdengar lebih B2B */}\
                  <span className="gold-badge">SMART INVESTMENT PASS</span>\
                  <h2 className="investment-title">Investasi Kemitraan <span className="gold-text">Resmi</span></h2>\
                  <p className="investment-desc">Mulai perjalanan bisnis travel umroh Anda dengan dukungan infrastruktur operasional lengkap dan perlindungan legalitas yang terjamin penuh.</p>\
              </div>\
\
              <div className="investment-card-wrapper">\
                  <div className="investment-card">\
                      {/* Bagian Harga */}\
                      <div className="pricing-header">\
                          <div className="price-normal">Lisensi Normal: Rp 1.000.000,-</div>\
                          <div className="price-special">\
                              <span className="currency">Rp</span> 350.000<span className="suffix">,-</span>\
                          </div>\
                          <div className="price-note">Kemitraan Seumur Hidup (Sekali Bayar)</div>\
                      </div>\
\
                      {/* Garis Pemisah Mewah */}\
                      <div className="luxury-divider"></div>\
\
                      {/* Daftar Fasilitas */}\
                      <div className="benefits-container">\
                          <h4 className="benefits-title">Fasilitas Fisik & Legalitas yang Anda Dapatkan:</h4>\
                          <div className="benefits-grid">\
                              <div className="benefit-item">\
                                  <div className="check-icon">✓</div> Spanduk Kemitraan Resmi\
                              </div>\
                              <div className="benefit-item">\
                                  <div className="check-icon">✓</div> ID Card (Tanda Pengenal)\
                              </div>\
                              <div className="benefit-item">\
                                  <div className="check-icon">✓</div> Kartu Nama Eksklusif\
                              </div>\
                              <div className="benefit-item">\
                                  <div className="check-icon">✓</div> Brosur Cetak Pemasaran\
                              </div>\
                              <div className="benefit-item">\
                                  <div className="check-icon">✓</div> Form Pendaftaran Fisik\
                              </div>\
                              <div className="benefit-item highlight-benefit">\
                                  <div className="check-icon">✓</div> MOU (Perjanjian Kerjasama Legal)\
                              </div>\
                          </div>\
                      </div>\
\
                      {/* Tombol Kontak (Representatif) */}\
                      <div className="action-buttons-area">\
                          <p className="action-text">Pilih Representatif Golden Travel untuk proses verifikasi:</p>\
                          <div className="contact-buttons">\
                              <a href="https://wa.me/6282283201103?text=Halo%20Admin%2C%20saya%20ingin%20mengambil%20Promo%20Kemitraan%20Rp%20350.000%20dari%20Golden%20Travel" target="_blank" rel="noopener noreferrer" className="btn-wa-gold">\
                                  <span className="wa-icon"><MessageSquare className="w-5 h-5" /></span> Representatif 1\
                              </a>\
                              <a href="https://wa.me/6282288308220?text=Halo%20Admin%2C%20saya%20ingin%20mengambil%20Promo%20Kemitraan%20Rp%20350.000%20dari%20Golden%20Travel" target="_blank" rel="noopener noreferrer" className="btn-wa-outline">\
                                  <span className="wa-icon"><MessageSquare className="w-5 h-5" /></span> Representatif 2\
                              </a>\
                          </div>\
                      </div>\
                  </div>\
              </div>\
          </div>\
      </section>' src/pages/Mitra.tsx
