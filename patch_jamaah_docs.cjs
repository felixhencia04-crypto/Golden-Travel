const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');

const target = `                {[
                  { name: 'E-Visa Umroh', status: 'pending', desc: 'Menunggu proses persetujuan Kedutaan Arab Saudi' },
                  { name: 'E-Ticket Pesawat', status: 'pending', desc: 'Akan diterbitkan H-14 sebelum keberangkatan' },
                  { name: 'Voucher Hotel', status: 'pending', desc: 'Akan diterbitkan H-7 sebelum keberangkatan' },
                  { name: 'ID Card Jamaah', status: 'ready', desc: 'Siap dicetak dan digunakan' },
                  { name: 'Panduan Manasik', status: 'ready', desc: 'Buku panduan digital PDF' },
                ].map((doc, i) => (`;

const isRegistered = "userConsultation?.status === 'registered' || userConsultation?.status === 'departed'";
const replacement = `                {[
                  { name: 'E-Visa Umroh', status: ${isRegistered} ? 'ready' : 'pending', desc: ${isRegistered} ? 'E-Visa telah diterbitkan.' : 'Menunggu proses persetujuan Kedutaan Arab Saudi' },
                  { name: 'E-Ticket Pesawat', status: ${isRegistered} ? 'ready' : 'pending', desc: ${isRegistered} ? 'E-Ticket siap diunduh.' : 'Akan diterbitkan H-14 sebelum keberangkatan' },
                  { name: 'Voucher Hotel', status: ${isRegistered} ? 'ready' : 'pending', desc: ${isRegistered} ? 'Voucher telah rilis.' : 'Akan diterbitkan H-7 sebelum keberangkatan' },
                  { name: 'ID Card Jamaah', status: 'ready', desc: 'Siap dicetak dan digunakan' },
                  { name: 'Panduan Manasik', status: 'ready', desc: 'Buku panduan digital PDF' },
                ].map((doc, i) => (`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/DashboardJamaah.tsx', content, 'utf8');
  console.log("Replaced mock docs.");
} else {
  console.log("Mock docs not found.");
}
