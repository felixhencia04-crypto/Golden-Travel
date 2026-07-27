const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');

// Replace "Status Ringkas"
content = content.replace(/<h4 className="text-gray-600 font-medium text-sm mb-1">Kelengkapan Dokumen<\/h4>\s*<p className="font-bold text-gray-900 text-xl">2 dari 5 Selesai<\/p>/g,
`<h4 className="text-gray-600 font-medium text-sm mb-1">Kelengkapan Dokumen</h4>
                    <p className="font-bold text-gray-900 text-xl">{Object.keys(userConsultation?.documents || {}).length} dari 6 Diunggah</p>`);

// Update step statuses
content = content.replace(/\{ id: 'persyaratan', status: 'Upload Dokumen Persyaratan', done: userConsultation\?.status === 'document', desc: 'KTP, KK, Paspor, dan dokumen pendukung lainnya\.' \},/g,
`{ id: 'persyaratan', status: 'Upload Dokumen Persyaratan', done: Object.keys(userConsultation?.documents || {}).length > 0, desc: 'KTP, KK, Paspor, dan dokumen pendukung lainnya.' },`);

content = content.replace(/\{ id: 'dokumen', status: 'Verifikasi & Terbit Dokumen Final', done: false, desc: 'Visa, Tiket, dan ID Card akan diterbitkan oleh admin\.' \},/g,
`{ id: 'dokumen', status: 'Verifikasi Data oleh Admin', done: userConsultation?.status === 'verified' || userConsultation?.status === 'registered' || userConsultation?.status === 'departed', desc: 'Admin memverifikasi semua pembayaran dan dokumen Anda.' },
                      { id: 'dokumen', status: 'Visa & Tiket Diterbitkan', done: userConsultation?.status === 'registered' || userConsultation?.status === 'departed', desc: 'Visa, Tiket, dan ID Card telah diterbitkan oleh admin.' },`);

// Add Admin Status Banner
const statusBanner = `
              {/* Admin Status Banner */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Status Pendaftaran (Dari Admin)</h3>
                    <p className="text-gray-500 text-sm">Status resmi pendaftaran Anda di sistem Golden Travel.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-4 py-2 text-sm font-bold rounded-xl bg-blue-100 text-blue-700 uppercase tracking-wide">
                    {userConsultation?.status?.replace('_', ' ') || 'NEW'}
                  </span>
                </div>
              </div>
`;

content = content.replace(/\{\/\* Status Ringkas \*\/\}/g, statusBanner + '\n              {/* Status Ringkas */}');

fs.writeFileSync('src/pages/DashboardJamaah.tsx', content, 'utf8');
