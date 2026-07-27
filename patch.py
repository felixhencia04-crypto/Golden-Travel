import re

with open("src/pages/DashboardJamaah.tsx", "r") as f:
    content = f.read()

replacement = """          {/* BIODATA TAB */}
          {activeTab === 'biodata' && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="max-w-4xl">
                <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">Biodata & Paspor</h2>
                <p className="text-gray-500 mb-10 text-lg">Informasi ini akan digunakan untuk keperluan manifest penerbangan dan pengajuan Visa.</p>
                <div className="space-y-16">
                  {Array.from({ length: paxCount }).map((_, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-3xl p-8 bg-gray-50/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gold-400 text-white font-bold py-1 px-4 rounded-bl-2xl">
                        Jamaah {idx + 1}
                      </div>
                      <div className="space-y-12">
                        <section>
                          <h3 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-matcha-900 text-white flex items-center justify-center mr-3 text-sm">{idx + 1}</span>
                            Data Pribadi (Sesuai KTP)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" defaultValue={idx === 0 ? userConsultation?.name : ''} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Induk Kependudukan (NIK)</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                              <select className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none">
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tempat Lahir</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Lahir</label>
                              <input type="date" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4">Kontak & Alamat</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor HP / WhatsApp</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" defaultValue={idx === 0 ? userConsultation?.phone : ''} />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                              <input type="email" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" defaultValue={idx === 0 ? userConsultation?.email : ''} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap</label>
                              <textarea className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" rows={3}></textarea>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4">Data Paspor</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Paspor</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Kantor Penerbit</label>
                              <input type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Terbit</label>
                              <input type="date" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Berakhir</label>
                              <input type="date" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" />
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  ))}

                  <div className="pt-6">
                    <button className="w-full md:w-auto px-8 bg-matcha-900 hover:bg-matcha-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-matcha-900/20">
                      Simpan Semua Biodata Jamaah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
"""

# Extract text between {/* BIODATA TAB */} and {/* PERSYARATAN TAB */}
import re
pattern = re.compile(r'          {/\* BIODATA TAB \*/}.*?(?=          {/\* PERSYARATAN TAB \*/})', re.DOTALL)
new_content = pattern.sub(replacement, content)

with open("src/pages/DashboardJamaah.tsx", "w") as f:
    f.write(new_content)

print("Done")
