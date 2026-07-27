const fs = require('fs');
let content = fs.readFileSync('src/pages/PackageDetail.tsx', 'utf8');

const regex = /Pesan Anda telah kami terima\. Tim Admin Golden Travel akan segera menghubungi Anda melalui WhatsApp untuk proses selanjutnya\.\s*<\/p>\s*<button className="font-button mt-8 text-gold-600 font-medium hover:underline"\s*>\s*Kirim pesan lain\s*<\/button>/g;

const replacement = `Pesan Anda telah kami terima. Tim Admin Golden Travel akan segera menghubungi Anda melalui WhatsApp untuk proses selanjutnya.
                    </p>
                    <div className="flex gap-4 mt-8">
                      <Link 
                        to="/dashboard"
                        className="font-button text-white bg-matcha-700 hover:bg-matcha-800 px-6 py-3 rounded-xl transition"
                      >
                        Buka Portal Jamaah (Simulasi)
                      </Link>
                      <button 
                        onClick={() => setIsSubmitted(false)}
                        className="font-button text-gold-600 font-medium hover:underline px-6 py-3"
                      >
                        Kembali
                      </button>
                    </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/PackageDetail.tsx', content, 'utf8');
