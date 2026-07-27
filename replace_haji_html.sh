sed -i '1627,1675c\
      {/* SECTION PAKET HAJI */}\
      <section className="mitra-haji-section" id="pilihan-haji">\
          {/* Efek Pendaran Cahaya Latar */}\
          <div className="haji-bg-glow"></div>\
\
          <div className="haji-container">\
              {/* Header & Tombol Navigasi Slider */}\
              <div className="haji-header-flex">\
                  <div className="haji-header-text">\
                      <span className="gold-badge">PROGRAM HAJI RESMI & EKSKLUSIF</span>\
                      <h2 className="haji-title">Perjalanan Suci Menuju Baitullah <br/><span className="gold-text">Tanpa Batas Kenyamanan</span></h2>\
                      <p className="haji-desc">Wujudkan niat suci berhaji dengan kepastian keberangkatan dan bimbingan syariat sesuai sunnah bersama PT. Golden Tour Haramain.</p>\
                  </div>\
                  {/* Tombol Navigasi Kiri Kanan */}\
                  <div className="slider-nav-buttons">\
                      <button className="slider-btn haji-prev" aria-label="Sebelumnya" onClick={handleHajiPrev}>❮</button>\
                      <button className="slider-btn haji-next" aria-label="Selanjutnya" onClick={handleHajiNext}>❯</button>\
                  </div>\
              </div>\
\
              {/* Wadah Slider (Carousel Track) */}\
              <div className="haji-slider-wrapper">\
                  <div className="haji-track" id="hajiTrack" ref={hajiTrackRef}>\
                      \
                      {/* KARTU 1: HAJI KHUSUS (ONH PLUS) */}\
                      <div className="package-card">\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Haji Khusus" />\
                              <div className="duration-badge">26 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Haji Khusus (ONH Plus)</h3>\
                              <div className="package-price"><span className="currency">USD</span> 14.500 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Kuota Resmi Kementerian Agama RI</li>\
                                  <li><span className="icon-check">✓</span> Makkah: Fairmont / Pullman (5⭐)</li>\
                                  <li><span className="icon-check">✓</span> Madinah: Oberoi / Movenpick (5⭐)</li>\
                                  <li><span className="icon-check">✓</span> Tenda Maktab VIP & Kereta Cepat</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-outline">Konsultasi Kuota</a>\
                          </div>\
                      </div>\
\
                      {/* KARTU 2: HAJI FURODA (VIP - TANPA ANTRI) */}\
                      <div className="package-card featured-card">\
                          <div className="ribbon-fav"><span>TANPA ANTRI</span></div>\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Haji Furoda" />\
                              <div className="duration-badge">24 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Haji Furoda (Visa Mujamalah)</h3>\
                              <div className="package-price"><span className="currency">Mulai USD</span> 21.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Berangkat Tahun Berjalan (Tanpa Antri)</li>\
                                  <li><span className="icon-check">✓</span> Visa Mujamalah Resmi Kerajaan Saudi</li>\
                                  <li><span className="icon-check">✓</span> Hotel Bintang 5 Plor Pelataran Haram</li>\
                                  <li><span className="icon-check">✓</span> Tenda AC Khusus Jemaah Furoda</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-solid">Amankan Kursi</a>\
                          </div>\
                      </div>\
\
                      {/* KARTU 3: HAJI EKSKLUSIF AR-RAUDAH */}\
                      <div className="package-card">\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80" alt="Haji Ar-Raudah" />\
                              <div className="duration-badge">30 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Haji Ar-Raudah (Elite)</h3>\
                              <div className="package-price"><span className="currency">USD</span> 25.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Penerbangan First / Business Class</li>\
                                  <li><span className="icon-check">✓</span> Akomodasi Suite Room View Ka'\''bah</li>\
                                  <li><span className="icon-check">✓</span> Muthawif & Pembimbing Pribadi</li>\
                                  <li><span className="icon-check">✓</span> Fasilitas Transportasi Mercedes VIP</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-outline">Konsultasi Kuota</a>\
                          </div>\
                      </div>\
\
                  </div>\
              </div>\
          </div>\
      </section>' src/pages/Home.tsx
