const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Replace mapping
  const regex = /const mapped = [^]*?setPackages\(mapped\);/;
  const mappedCode = `const mapped = umrahPackages.map((p: any) => {
                const hotels = (p.hotel || '').split(',').map((s: string) => s.trim());
                const hMakkah = hotels[0] || 'Hotel Pilihan Makkah';
                const hMadinah = hotels[1] || 'Hotel Pilihan Madinah';
                
                return {
                id: p.id,
                name: p.name,
                category: p.type === 'haji' ? 'Haji' : 'Umrah',
                categoryLabel: p.type === 'haji' ? 'Haji' : 'Umrah',
                duration: p.duration || '9 Hari',
                price: Number(p.price) || 0,
                dpAmount: 'DP Rp 5.000.000',
                imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                airline: 'Saudia Airlines',
                hotelMakkah: hMakkah,
                hotelMakkahStars: 5,
                hotelMakkahDistance: '±100m',
                hotelMadinah: hMadinah,
                hotelMadinahStars: 5,
                hotelMadinahDistance: '±100m',
                departureSchedule: p.departureDate ? new Date(p.departureDate).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'}) : 'Lihat Jadwal',
                seatsLeft: p.remainingSeats ?? (p.quota || 45),
                highlights: (p.facilities || '').split(',').map((f:string)=>f.trim()).filter(Boolean),
                includes: Array.isArray(p.description) ? p.description : [],
                excludes: ['Pembuatan Paspor', 'Vaksin Meningitis', 'Pengeluaran Pribadi'],
                itinerary: p.itinerary || []
             }});
             setPackages(mapped);`;

  code = code.replace(regex, mappedCode.replace(/umrahPackages/g, filepath.includes('Haji') ? 'hajiPackages' : 'umrahPackages'));
  
  fs.writeFileSync(filepath, code);
}

patchFile('src/components/PaketUmrahShowcase.tsx');
patchFile('src/components/PaketHajiShowcase.tsx');
