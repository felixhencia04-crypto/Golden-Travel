const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const anchor = `                </div>
              )}
            </div>
          )}
          {activeTab === 'dashboard' && (`

const newCode = `                </div>
              )}
              {activeOpsTab === 'dokumen_final' && (
                <div className="space-y-6">
                  <div className="bg-white shadow-md rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white shadow-md border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <th className="p-5">Nama Jamaah</th>
                          <th className="p-5">E-Ticket</th>
                          <th className="p-5">Visa</th>
                          <th className="p-5">Asuransi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {consultations.filter(c => c.status === 'payment' || c.paymentStep === 'lunas').map(c => {
                          return (
                            <tr key={c.id} className="hover:bg-white/20 transition-colors">
                              <td className="p-5">
                                <p className="font-bold text-gray-900">{c.name || 'Tanpa Nama'}</p>
                                <p className="text-[10px] text-gray-600">{c.packageName}</p>
                              </td>
                              <td className="p-5">
                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200" onClick={() => {
                                  const url = prompt('Masukkan URL E-Ticket (PDF/Image):');
                                  if (url) uploadFinalDocument(c.id, 'eticket', url);
                                }}>+ E-Ticket</button>
                              </td>
                              <td className="p-5">
                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200" onClick={() => {
                                  const url = prompt('Masukkan URL Visa (PDF/Image):');
                                  if (url) uploadFinalDocument(c.id, 'visa', url);
                                }}>+ Visa</button>
                              </td>
                              <td className="p-5">
                                <button className="px-3 py-1 bg-gray-100 rounded-lg text-xs hover:bg-gray-200" onClick={() => {
                                  const url = prompt('Masukkan URL Asuransi (PDF/Image):');
                                  if (url) uploadFinalDocument(c.id, 'asuransi', url);
                                }}>+ Asuransi</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'dashboard' && (`

if (code.includes(anchor)) {
  code = code.replace(anchor, newCode);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log("Dokumen final tab added");
} else {
  console.log("Could not find anchor");
}
