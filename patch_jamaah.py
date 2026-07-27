import re

with open("src/pages/DashboardJamaah.tsx", "r") as f:
    content = f.read()

# 1. State for paxData
state_replacement = """  const paxCount = userConsultation?.paxCount || 1;
  const [paxDataList, setPaxDataList] = useState<any[]>([]);

  useEffect(() => {
    if (userConsultation && userConsultation.paxData) {
      setPaxDataList(userConsultation.paxData);
    } else if (userConsultation) {
      // Initialize with empty data based on paxCount
      const initial = Array.from({ length: paxCount }).map((_, i) => (
        i === 0 ? { 
          name: userConsultation.name, 
          phone: userConsultation.phone,
          email: userConsultation.email 
        } : {}
      ));
      setPaxDataList(initial);
    }
  }, [userConsultation?.paxData, paxCount]);

  const handlePaxDataChange = (idx: number, field: string, value: string) => {
    const updated = [...paxDataList];
    if (!updated[idx]) updated[idx] = {};
    updated[idx][field] = value;
    setPaxDataList(updated);
  };

  const handleSaveBiodata = () => {
    if (userConsultation) {
      updateConsultation({ ...userConsultation, paxData: paxDataList });
      alert("Biodata semua jamaah berhasil disimpan!");
    }
  };"""

content = content.replace("  const paxCount = userConsultation?.paxCount || 1;", state_replacement)

# 2. Inputs inside the loop
# We will use regex to find and replace the loop body to include values and onChanges.

loop_replacement = """                  {Array.from({ length: paxCount }).map((_, idx) => (
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
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.name || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Induk Kependudukan (NIK)</label>
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.nik || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'nik', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Kelamin</label>
                              <select 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none"
                                value={paxDataList[idx]?.gender || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'gender', e.target.value)}
                              >
                                <option value="">Pilih</option>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tempat Lahir</label>
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.birthPlace || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'birthPlace', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Lahir</label>
                              <input 
                                type="date" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.birthDate || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'birthDate', e.target.value)}
                              />
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4">Kontak & Alamat</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor HP / WhatsApp</label>
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.phone || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'phone', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                              <input 
                                type="email" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.email || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'email', e.target.value)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap</label>
                              <textarea 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                rows={3}
                                value={paxDataList[idx]?.address || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'address', e.target.value)}
                              ></textarea>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="font-bold text-xl text-gray-900 mb-6 border-b border-gray-200 pb-4">Data Paspor</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Paspor</label>
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.passport || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'passport', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Kantor Penerbit</label>
                              <input 
                                type="text" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.passportOffice || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'passportOffice', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Terbit</label>
                              <input 
                                type="date" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.passportIssueDate || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'passportIssueDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Berakhir</label>
                              <input 
                                type="date" 
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 outline-none" 
                                value={paxDataList[idx]?.passportExpiryDate || ''}
                                onChange={(e) => handlePaxDataChange(idx, 'passportExpiryDate', e.target.value)}
                              />
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  ))}

                  <div className="pt-6">
                    <button 
                      onClick={handleSaveBiodata}
                      className="w-full md:w-auto px-8 bg-matcha-900 hover:bg-matcha-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-matcha-900/20"
                    >
                      Simpan Semua Biodata Jamaah
                    </button>
                  </div>"""

pattern = re.compile(r'                  \{Array\.from\(\{ length: paxCount \}\)\.map\(\(_, idx\) => \(.*?</button>\s*</div>', re.DOTALL)
content = pattern.sub(loop_replacement, content)

with open("src/pages/DashboardJamaah.tsx", "w") as f:
    f.write(content)

print("Done")
