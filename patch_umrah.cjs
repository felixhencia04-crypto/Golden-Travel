const fs = require('fs');
let code = fs.readFileSync('src/components/PaketUmrahShowcase.tsx', 'utf8');

const fetchLogic = `
  const [packages, setPackages] = useState<UmrahPackage[]>(DEFAULT_UMRAH_PACKAGES);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/packages');
        if (response.ok) {
          const data = await response.json();
          const umrahPackages = data.filter((p: any) => p.type?.toLowerCase() === 'umroh' || !p.type);
          if (umrahPackages.length > 0) {
             const mapped = umrahPackages.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: 'reguler',
                categoryLabel: 'Umrah',
                duration: p.duration || '9 Hari',
                price: Number(p.price) || 0,
                dpAmount: 'DP Rp 5.000.000',
                imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                airline: 'Saudia Airlines',
                hotelMakkah: p.hotel || 'Hotel Makkah',
                hotelMakkahStars: 5,
                hotelMakkahDistance: '±100m',
                hotelMadinah: 'Hotel Madinah',
                hotelMadinahStars: 5,
                hotelMadinahDistance: '±100m',
                departureSchedule: p.departureDate ? new Date(p.departureDate).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'}) : 'Lihat Jadwal',
                seatsLeft: p.quota || 45,
                highlights: (p.facilities || '').split(',').map((f:string)=>f.trim()).filter(Boolean),
                includes: [],
                excludes: [],
                itinerary: []
             }));
             setPackages(mapped);
          }
        }
      } catch (error) {
        console.error('Failed to fetch packages', error);
      }
    };
    fetchPackages();
  }, []);
`;

code = code.replace(
  "  const [activeCategory, setActiveCategory] = useState<string>('all');",
  fetchLogic + "\n  const [activeCategory, setActiveCategory] = useState<string>('all');"
);

code = code.replace(
  "  const filteredPackages = DEFAULT_UMRAH_PACKAGES.filter(pkg => {",
  "  const filteredPackages = packages.filter(pkg => {"
);

fs.writeFileSync('src/components/PaketUmrahShowcase.tsx', code);
