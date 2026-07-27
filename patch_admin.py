import re

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

state_replacement = """  const [activeTransaksiTab, setActiveTransaksiTab] = useState('pembayaran');
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [editingTransaksi, setEditingTransaksi] = useState<any>(null);
  const [selectedJamaah, setSelectedJamaah] = useState<any>(null);
  const [isJamaahDetailsModalOpen, setIsJamaahDetailsModalOpen] = useState(false);"""

content = content.replace("  const [activeTransaksiTab, setActiveTransaksiTab] = useState('invoice');\n  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);\n  const [editingTransaksi, setEditingTransaksi] = useState<any>(null);", state_replacement)

# Update crm_jamaah table to click and open details
crm_jamaah_replacement = """                      {consultations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            Belum ada data jamaah
                          </td>
                        </tr>
                      ) : (
                        consultations.map(cons => (
                          <tr key={cons.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => { setSelectedJamaah(cons); setIsJamaahDetailsModalOpen(true); }}>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-900 hover:text-matcha-700">{cons.name}</div>
                              <div className="text-gray-500 text-xs mt-1">{cons.phone}</div>
                              <div className="text-gray-500 text-xs">{cons.email || '-'}</div>
                            </td>
                            <td className="py-4 px-4 text-gray-600">
                              {cons.packageName}
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                {cons.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {cons.paymentProofUrl ? (
                                <a href={cons.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline flex items-center mb-1" onClick={(e) => e.stopPropagation()}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Bukti Pembayaran
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400 block mb-1">Belum ada pembayaran</span>
                              )}
                              
                              {cons.documents && Object.keys(cons.documents).length > 0 ? (
                                <div className="text-xs text-blue-600">
                                  {Object.keys(cons.documents).length} dokumen diupload
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Belum ada dokumen</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <select 
                                className="text-xs border border-gray-200 rounded-lg p-2 bg-white outline-none focus:ring-1 focus:ring-gold-500"
                                value={cons.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); updateConsultationStatus(cons.id, e.target.value as any); }}
                              >
                                <option value="new">Konsultasi (New)</option>
                                <option value="followed_up">Followed Up</option>
                                <option value="payment">Menunggu Pembayaran</option>
                                <option value="document">Upload Dokumen</option>
                                <option value="verified">Verified (Lunas & Lengkap)</option>
                                <option value="registered">Registered</option>
                                <option value="departed">Departed</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}"""

pattern = re.compile(r'                      {consultations\.length === 0 \?\s*\(.*?\) : \(\s*consultations\.map.*?\) \)\s*\)}', re.DOTALL)
content = pattern.sub(crm_jamaah_replacement, content)


# Transaksi list replacement
transaksi_replacement = """                <div className="flex flex-wrap gap-2 border-b border-gray-100 mb-6">
                  {['pembayaran', 'konfirmasi', 'riwayat', 'refund'].map(cat => (
                    <button key={cat} onClick={() => setActiveTransaksiTab(cat)} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTransaksiTab === cat ? 'border-matcha-600 text-matcha-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-4 font-medium border-b border-gray-100 rounded-tl-lg">ID Transaksi / Nama Jamaah</th>
                        <th className="p-4 font-medium border-b border-gray-100">Total Nominal</th>
                        <th className="p-4 font-medium border-b border-gray-100">Status & Jenis</th>
                        <th className="p-4 font-medium border-b border-gray-100 text-right rounded-tr-lg">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultations.filter(c => c.paymentStep && c.paymentStep !== 'none').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            Belum ada transaksi
                          </td>
                        </tr>
                      ) : consultations.filter(c => c.paymentStep && c.paymentStep !== 'none').map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 cursor-pointer" onClick={() => { setEditingTransaksi(c); setIsTransaksiModalOpen(true); }}>
                          <td className="p-4">
                            <p className="font-medium text-gray-900 hover:text-matcha-700">{c.id.split('-').pop()?.toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{c.name} • {c.packageName}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-gray-900">
                              {c.paymentStep === 'dp1' ? 'Rp 1.500.000' : 
                               c.paymentStep === 'dp2' ? 'Rp 5.000.000' : 
                               c.paymentStep === 'lunas' ? 'Lunas' : 'Belum Ditentukan'}
                            </p>
                            <p className="text-xs text-gray-500">{c.date || '-'}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              c.status === 'payment' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {c.status === 'payment' ? 'Menunggu Pembayaran / Verifikasi' : 'Terverifikasi'}
                            </span>
                            <span className="block mt-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 rounded-full w-fit">
                              {c.paymentStep?.toUpperCase()}
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
                    </tbody>
                  </table>
                </div>"""

pattern_transaksi = re.compile(r'                <div className="flex flex-wrap gap-2 border-b border-gray-100 mb-6">.*?(?=              </div>\s*</div>\s*</div>\s*\)\s*}\s*{activeTab === \'user_management\')', re.DOTALL)
content = pattern_transaksi.sub(transaksi_replacement + '\n              </div>\n', content)

# Inject Jamaah and Transaksi Modals at the end (before last </div>)
modals_replacement = """      {/* Modal Detail Jamaah */}
      {isJamaahDetailsModalOpen && selectedJamaah && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-xl text-gray-900">Detail Jamaah: {selectedJamaah.name}</h3>
              <button onClick={() => setIsJamaahDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-sm text-gray-500">Paket</p>
                  <p className="font-bold text-gray-900">{selectedJamaah.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {selectedJamaah.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Pax</p>
                  <p className="font-bold text-gray-900">{selectedJamaah.paxCount || 1} Orang</p>
                </div>
                <button 
                  onClick={() => alert('Mencetak formulir pendaftaran jamaah...')}
                  className="flex items-center px-4 py-2 bg-matcha-600 text-white rounded-lg text-sm font-medium hover:bg-matcha-700 transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak Formulir
                </button>
              </div>

              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gold-500" /> Data Pemesan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                    <p className="font-medium">{selectedJamaah.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Telepon / WA</p>
                    <p className="font-medium">{selectedJamaah.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium">{selectedJamaah.email || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Catatan Tambahan</p>
                    <p className="font-medium text-sm">{selectedJamaah.message || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gold-500" /> Biodata & Paspor (Pax)
                </h4>
                <div className="space-y-4">
                  {Array.from({ length: selectedJamaah.paxCount || 1 }).map((_, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h5 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Jamaah {idx + 1}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nama Lengkap Sesuai KTP</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.name || (idx === 0 ? selectedJamaah.name : 'Belum diisi')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">NIK</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.nik || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Jenis Kelamin</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.gender || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nomor Paspor</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.passport || 'Belum diisi'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}
      {isTransaksiModalOpen && editingTransaksi && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">Detail Transaksi: {editingTransaksi.name}</h3>
              <button onClick={() => setIsTransaksiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">ID Transaksi</p>
                  <p className="font-bold text-gray-900">TRX-{editingTransaksi.id.split('-').pop()?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Jenis Transaksi</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {editingTransaksi.paymentStep?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Paket</p>
                  <p className="font-medium text-gray-900">{editingTransaksi.packageName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {editingTransaksi.paymentStep === 'dp1' ? 'Rp 1.500.000' : 
                     editingTransaksi.paymentStep === 'dp2' ? 'Rp 5.000.000' : 'Menunggu Pelunasan'}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Bukti Pembayaran</h4>
                {editingTransaksi.paymentProofUrl ? (
                  <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center">
                    <img src={editingTransaksi.paymentProofUrl} alt="Bukti Transfer" className="max-h-64 object-contain rounded mb-4" />
                    <a href={editingTransaksi.paymentProofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Lihat Gambar Penuh
                    </a>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium">
                    Belum ada bukti pembayaran yang diunggah
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    updateConsultationStatus(editingTransaksi.id, 'verified');
                    setIsTransaksiModalOpen(false);
                    alert('Pembayaran berhasil disetujui!');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Setujui Pembayaran
                </button>
                <button 
                  onClick={() => {
                    alert('Pembayaran ditolak.');
                    setIsTransaksiModalOpen(false);
                  }}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-bold transition-colors"
                >
                  Tolak Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", modals_replacement)

# Import missing icons
import_replacement = """import { 
  Users, Package, Calendar, Settings, FileText, FileCheck, Image as ImageIcon,
  MoreVertical, Edit2, Trash2, Plus, X, Search, ChevronRight, Upload, Globe,
  Shield, CreditCard, PieChart, Activity, Bell, FileBox, Tag, Quote, Printer
} from 'lucide-react';"""

content = re.sub(r'import\s*\{\s*Users.*?from\s*\'lucide-react\';', import_replacement, content, flags=re.DOTALL)

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)

print("Done")
