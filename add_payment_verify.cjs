const fs = require('fs');

const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* Modal Detail Transaksi \*\/\}/g;

const paymentBlock = `              </div>

              {/* SECTION: Verifikasi Pembayaran */}
              <div className="border-t border-gray-100 pt-8 mt-8">
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <Banknote className="w-5 h-5 mr-2 text-gold-500" /> Keuangan & Pembayaran
                </h4>
                
                <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Status Pembayaran Saat Ini</span>
                      <span className="font-bold text-gray-900">
                        {(!selectedJamaah.paymentStep || selectedJamaah.paymentStep === 'none') ? 'Menunggu Pembayaran (Belum DP)' :
                         selectedJamaah.paymentStep === 'dp1' ? 'DP 1 Terbayar' :
                         selectedJamaah.paymentStep === 'dp2' ? 'DP 2 Terbayar' : 'Lunas'}
                      </span>
                    </div>

                    {selectedJamaah.pendingPaymentStep && (
                      <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <span className="text-sm font-medium text-yellow-700">Menunggu Verifikasi</span>
                        <span className="font-bold text-yellow-800">
                          {selectedJamaah.pendingPaymentStep.toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 flex gap-3">
                      {selectedJamaah.pendingPaymentStep ? (
                        <>
                          <button
                            onClick={() => {
                              const updated = {
                                ...selectedJamaah,
                                paymentStep: selectedJamaah.pendingPaymentStep,
                                pendingPaymentStep: undefined
                              };
                              updateConsultation(updated);
                              setSelectedJamaah(updated);
                              alert('Pembayaran berhasil diverifikasi.');
                            }}
                            className="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-green-600 transition"
                          >
                            Verifikasi {selectedJamaah.pendingPaymentStep.toUpperCase()}
                          </button>
                          <button
                            onClick={() => {
                              const updated = {
                                ...selectedJamaah,
                                pendingPaymentStep: undefined,
                                paymentProofUrl: undefined
                              };
                              updateConsultation(updated);
                              setSelectedJamaah(updated);
                              alert('Pembayaran ditolak. Jamaah harus mengupload ulang.');
                            }}
                            className="flex-1 bg-red-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-600 transition"
                          >
                            Tolak Bukti
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Tidak ada pembayaran yang menunggu verifikasi saat ini.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran Terbaru</p>
                    {selectedJamaah.paymentProofUrl ? (
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                        <img src={selectedJamaah.paymentProofUrl} alt="Bukti Pembayaran" className="w-full h-auto max-h-48 object-contain" />
                        <a href={selectedJamaah.paymentProofUrl} target="_blank" rel="noreferrer" className="block w-full text-center py-2 bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200">
                          Lihat Penuh
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 h-32 flex items-center justify-center text-sm text-gray-400">
                        Belum ada bukti upload
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}`;

content = content.replace(regex, paymentBlock);

fs.writeFileSync(file, content, 'utf8');
