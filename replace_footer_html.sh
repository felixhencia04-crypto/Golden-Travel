sed -i '1930,1991c\
      <footer className="mitra-footer">\
          <div className="footer-container">\
              <div className="footer-grid">\
                  \
                  {/* KOLOM 1: BRAND & LEGALITAS */}\
                  <div className="footer-col brand-col">\
                      <div className="footer-logo-area">\
                          <div className="footer-logo-icon">🕌</div>\
                          <div className="footer-brand-text">\
                              <h3>Golden Travel</h3>\
                              <span>PT. GOLDEN TOUR HARAMAIN</span>\
                          </div>\
                      </div>\
                      <p className="footer-desc">Biro perjalanan Haji dan Umroh terpercaya. Melayani dengan sepenuh hati untuk ibadah yang mabrur dan perjalanan yang berkesan.</p>\
                      \
                      <div className="footer-legal-box">\
                          <strong>PT. GOLDEN TOUR HARAMAIN</strong>\
                          <span>Mitra PT. SEDERHANA ALMAIDANI GROUP</span>\
                          <span className="licence">Izin PPIU: 08012300040570002</span>\
                      </div>\
\
                      <div className="footer-socials">\
                          <a href="#" className="social-icon" aria-label="Instagram">📷</a>\
                          <a href="#" className="social-icon" aria-label="Facebook">📘</a>\
                          <a href="#" className="social-icon" aria-label="YouTube">▶</a>\
                      </div>\
                  </div>\
\
                  {/* KOLOM 2: LAYANAN KAMI */}\
                  <div className="footer-col">\
                      <h4>Layanan Kami</h4>\
                      <ul className="footer-links">\
                          <li><a href="#">Paket Umroh Reguler</a></li>\
                          <li><a href="#">Paket Umroh Plus</a></li>\
                          <li><a href="#">Haji Furoda & Khusus</a></li>\
                          <li><a href="#">Pembuatan Visa</a></li>\
                      </ul>\
                  </div>\
\
                  {/* KOLOM 3: TAUTAN & PORTAL */}\
                  <div className="footer-col">\
                      <h4>Tautan Cepat</h4>\
                      <ul className="footer-links">\
                          <li><a href="#">Tentang Kami</a></li>\
                          <li><a href="#">Syarat & Ketentuan</a></li>\
                          <li><a href="#">Kebijakan Privasi</a></li>\
                          <li><a href="#">Menjadi Mitra</a></li>\
                      </ul>\
                      <h4 className="sub-heading">Portal Akses</h4>\
                      <ul className="footer-links">\
                          <li><a href="#">Login Jamaah</a></li>\
                          <li><a href="#">Login Mitra</a></li>\
                          <li><a href="#">Login Admin</a></li>\
                      </ul>\
                  </div>\
\
                  {/* KOLOM 4: HUBUNGI KAMI */}\
                  <div className="footer-col">\
                      <h4>Hubungi Kami</h4>\
                      <div className="contact-info-list">\
                          <div className="contact-item">\
                              <span className="contact-icon">📍</span>\
                              <p>Jl. Gatot Subroto No. 123, Jakarta Selatan, Indonesia 12950</p>\
                          </div>\
                          <div className="contact-item">\
                              <span className="contact-icon">📞</span>\
                              <div>\
                                  <p>0822-8320-1103 <span className="note">(Konsultasi 1)</span></p>\
                                  <p>0822-8830-8220 <span className="note">(Konsultasi 2)</span></p>\
                              </div>\
                          </div>\
                          <div className="contact-item">\
                              <span className="contact-icon">✉️</span>\
                              <p>info@goldentravel.com</p>\
                          </div>\
                      </div>\
                  </div>\
\
              </div>\
\
              {/* COPYRIGHT BAR */}\
              <div className="footer-bottom">\
                  <p>&copy; {new Date().getFullYear()} Golden Travel Haji & Umroh. Hak Cipta Dilindungi.</p>\
              </div>\
          </div>\
      </footer>\
' src/pages/Home.tsx
