const fs = require('fs');
const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /              \{\/\* SECTION: Verifikasi Pembayaran \*\/\}/g;

const docsBlock = `              {/* SECTION: Verifikasi Dokumen Persyaratan */}
              <div className="border-t border-gray-100 pt-8 mt-8">
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-gold-500" /> Verifikasi Dokumen Persyaratan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-gray-100">
                  {['KTP Asli', 'Kartu Keluarga (KK)', 'Paspor Asli', 'Pas Foto 4x6', 'Buku Nikah', 'Sertifikat Vaksin'].map((docName, i) => {
                    const isUploaded = selectedJamaah.documents?.[docName];
                    const isBase64 = isUploaded && isUploaded.startsWith('data:');
                    
                    return (
                      <div key={i} className="flex flex-col border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                        <div className="p-3 bg-gray-100 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-800">{docName}</p>
                        </div>
                        <div className="p-3 flex flex-col justify-center items-center h-32 bg-white relative">
                          {isUploaded ? (
                            isBase64 ? (
                              <>
                                <img src={isUploaded} alt={docName} className="w-full h-full object-cover rounded" />
                                <a href={isUploaded} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold rounded">
                                  Lihat Penuh
                                </a>
                              </>
                            ) : (
                              <div className="text-green-600 font-bold text-sm flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1"/> File Tersimpan
                              </div>
                            )
                          ) : (
                            <div className="text-gray-400 text-sm flex flex-col items-center">
                              <X className="w-6 h-6 mb-1"/> Belum diunggah
                            </div>
                          )}
                        </div>
                        {isUploaded && (
                          <div className="p-3 flex gap-2">
                            <button
                               onClick={() => alert('Dokumen disetujui')}
                               className="flex-1 text-xs py-1.5 bg-green-100 text-green-700 font-semibold rounded hover:bg-green-200"
                            >
                              Terima
                            </button>
                            <button
                               onClick={() => {
                                 const newDocs = { ...selectedJamaah.documents };
                                 delete newDocs[docName];
                                 const updated = { ...selectedJamaah, documents: newDocs };
                                 updateConsultation(updated);
                                 setSelectedJamaah(updated);
                                 alert('Dokumen ditolak. Jamaah harus mengupload ulang.');
                               }}
                               className="flex-1 text-xs py-1.5 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: Verifikasi Pembayaran */}`;

content = content.replace(regex, docsBlock);
fs.writeFileSync(file, content, 'utf8');
