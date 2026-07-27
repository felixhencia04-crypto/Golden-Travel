sed -i '1468,1537c\
      <section className="mitra-packages-section" id="pilihan-paket">\
          {/* Efek Pendaran Cahaya Latar */}\
          <div className="packages-bg-glow"></div>\
\
          <div className="packages-container">\
              {/* Header & Tombol Navigasi Slider */}\
              <div className="packages-header-flex">\
                  <div className="packages-header-text">\
                      <span className="gold-badge">PILIHAN PAKET TERBAIK</span>\
                      <h2 className="packages-title">Pilih Perjalanan Ibadah <br/><span className="gold-text">Sesuai Kebutuhan Anda</span></h2>\
                      <p className="packages-desc">Nikmati kenyamanan ibadah ke Tanah Suci dengan fasilitas kelas dunia bersama PT. Golden Tour Haramain.</p>\
                  </div>\
                  {/* Tombol Navigasi Kiri Kanan */}\
                  <div className="slider-nav-buttons">\
                      <button className="slider-btn prev-btn" aria-label="Sebelumnya" onClick={handlePrev}>❮</button>\
                      <button className="slider-btn next-btn" aria-label="Selanjutnya" onClick={handleNext}>❯</button>\
                  </div>\
              </div>\
\
              {/* Wadah Slider (Carousel Track) */}\
              <div className="packages-slider-wrapper">\
                  <div className="packages-track" id="packagesTrack" ref={trackRef}>\
                      \
                      {/* KARTU 1: SAFA (REGULER) */}\
                      <div className="package-card">\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80" alt="Paket Safa" />\
                              <div className="duration-badge">9 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Paket Safa (Reguler)</h3>\
                              <div className="package-price"><span className="currency">Rp</span> 28.500.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Saudia Airlines / Garuda</li>\
                                  <li><span className="icon-check">✓</span> Makkah: Azka Al Safa (4⭐)</li>\
                                  <li><span className="icon-check">✓</span> Madinah: Taiba Front (4⭐)</li>\
                                  <li><span className="icon-check">✓</span> Bus Full AC / Kereta Cepat</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-outline">Lihat Detail Jadwal</a>\
                          </div>\
                      </div>\
\
                      {/* KARTU 2: MARWA (VIP - TERFAVORI) */}\
                      <div className="package-card featured-card">\
                          <div className="ribbon-fav"><span>TERFAVORIT</span></div>\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1565552403565-5ba2a9539f90?auto=format&fit=crop&w=600&q=80" alt="Paket Marwa" />\
                              <div className="duration-badge">12 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Paket Marwa (VIP)</h3>\
                              <div className="package-price"><span className="currency">Rp</span> 35.000.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Saudia Airlines (Direct)</li>\
                                  <li><span className="icon-check">✓</span> Makkah: Pullman ZamZam (5⭐)</li>\
                                  <li><span className="icon-check">✓</span> Madinah: Anwar Movenpick (5⭐)</li>\
                                  <li><span className="icon-check">✓</span> Kereta Cepat Haramain (VIP)</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-solid">Booking Sekarang</a>\
                          </div>\
                      </div>\
\
                      {/* KARTU 3: UMRAH PLUS TURKI */}\
                      <div className="package-card">\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80" alt="Umrah Plus Turki" />\
                              <div className="duration-badge">15 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Umrah Plus Turki</h3>\
                              <div className="package-price"><span className="currency">Rp</span> 42.500.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Turkish Airlines</li>\
                                  <li><span className="icon-check">✓</span> Makkah & Madinah Hotel (5⭐)</li>\
                                  <li><span className="icon-check">✓</span> City Tour Istanbul & Bursa</li>\
                                  <li><span className="icon-check">✓</span> Opsional: Balon Udara Cappadocia</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-outline">Lihat Detail Jadwal</a>\
                          </div>\
                      </div>\
\
                      {/* KARTU 4: MULTAZAM (EKSKLUSIF) */}\
                      <div className="package-card">\
                          <div className="card-image-box">\
                              <img src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80" alt="Paket Multazam" />\
                              <div className="duration-badge">12 Hari</div>\
                          </div>\
                          <div className="card-body">\
                              <h3>Paket Multazam</h3>\
                              <div className="package-price"><span className="currency">Rp</span> 48.000.000 <span className="pax">/ pax</span></div>\
                              \
                              <ul className="package-features">\
                                  <li><span className="icon-check">✓</span> Emirates / Qatar Airways</li>\
                                  <li><span className="icon-check">✓</span> Hotel Plor Pelataran Haram</li>\
                                  <li><span className="icon-check">✓</span> VIP Lounge Bandara & Eksklusif</li>\
                                  <li><span className="icon-check">✓</span> Muthawif Pribadi Berpengalaman</li>\
                              </ul>\
                              \
                              <a href="#booking" className="btn-card-outline">Lihat Detail Jadwal</a>\
                          </div>\
                      </div>\
\
                  </div>\
              </div>\
          </div>\
      </section>' src/pages/Home.tsx
