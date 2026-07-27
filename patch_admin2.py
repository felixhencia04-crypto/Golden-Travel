import re

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

# Update the Transaksi table to look for pendingPaymentStep OR paymentStep
table_replacement = """                    <tbody>
                      {consultations.filter(c => c.pendingPaymentStep || (c.paymentStep && c.paymentStep !== 'none')).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            Belum ada transaksi
                          </td>
                        </tr>
                      ) : consultations.filter(c => c.pendingPaymentStep || (c.paymentStep && c.paymentStep !== 'none')).map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 cursor-pointer" onClick={() => { setEditingTransaksi(c); setIsTransaksiModalOpen(true); }}>
                          <td className="p-4">
                            <p className="font-medium text-gray-900 hover:text-matcha-700">{c.id.split('-').pop()?.toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{c.name} • {c.packageName}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-gray-900">
                              {(c.pendingPaymentStep || c.paymentStep) === 'dp1' ? 'Rp 1.500.000' : 
                               (c.pendingPaymentStep || c.paymentStep) === 'dp2' ? 'Rp 5.000.000' : 
                               (c.pendingPaymentStep || c.paymentStep) === 'lunas' ? 'Lunas' : 'Belum Ditentukan'}
                            </p>
                            <p className="text-xs text-gray-500">{c.date || '-'}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              c.pendingPaymentStep ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {c.pendingPaymentStep ? 'Menunggu Konfirmasi' : 'Terverifikasi'}
                            </span>
                            <span className="block mt-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 rounded-full w-fit">
                              {(c.pendingPaymentStep || c.paymentStep)?.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end space-x-2">
                              <button onClick={(e) => { e.stopPropagation(); setEditingTransaksi(c); setIsTransaksiModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Detail & Action">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>"""

pattern = re.compile(r'                    <tbody>\s*\{consultations.*?</tbody>', re.DOTALL)
content = pattern.sub(table_replacement, content)

# Update the modal button action
button_replacement = """              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (editingTransaksi.pendingPaymentStep) {
                      updateConsultation({
                        ...editingTransaksi,
                        paymentStep: editingTransaksi.pendingPaymentStep,
                        pendingPaymentStep: undefined,
                        paymentProofUrl: undefined,
                        status: editingTransaksi.pendingPaymentStep === 'lunas' ? 'verified' : 'document'
                      });
                    }
                    setIsTransaksiModalOpen(false);
                    alert('Pembayaran berhasil disetujui!');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Setujui Pembayaran
                </button>
                <button 
                  onClick={() => {
                    updateConsultation({
                        ...editingTransaksi,
                        pendingPaymentStep: undefined,
                        paymentProofUrl: undefined
                    });
                    alert('Pembayaran ditolak.');
                    setIsTransaksiModalOpen(false);
                  }}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-bold transition-colors"
                >
                  Tolak Pembayaran
                </button>
              </div>"""

pattern2 = re.compile(r'              <div className="flex gap-4 pt-4 border-t border-gray-100">.*?</div>\s*</div>\s*</div>\s*</div>\s*\)}', re.DOTALL)
content = pattern2.sub(button_replacement + '\n            </div>\n          </div>\n        </div>\n      )}', content)

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
print("Done")
