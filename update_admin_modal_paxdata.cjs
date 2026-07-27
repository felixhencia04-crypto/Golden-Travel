const fs = require('fs');
const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<h5 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Jamaah \{idx \+ 1\}<\/h5>.*?<\/div>\s*<\/div>/s;

const newBlock = `<h5 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Jamaah {idx + 1}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
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
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Alamat Lengkap</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.address || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Telepon</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.phone || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.email || 'Belum diisi'}</p>
                        </div>
                        <div className="col-span-4 mt-2 mb-1 border-t border-gray-200 pt-2">
                          <p className="text-sm font-bold text-gray-800">Data Paspor</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nomor Paspor</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.passport || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Kantor Penerbit</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.passportOffice || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tanggal Terbit</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.passportIssueDate || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tanggal Berakhir</p>
                          <p className="font-medium text-sm">{selectedJamaah.paxData?.[idx]?.passportExpiryDate || 'Belum diisi'}</p>
                        </div>
                      </div>
                    </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync(file, content, 'utf8');
