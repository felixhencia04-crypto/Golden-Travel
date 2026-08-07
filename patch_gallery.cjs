const fs = require('fs');
let code = fs.readFileSync('src/components/DepartureGalleryShowcase.tsx', 'utf8');

const fetchLogic = `
  const [items, setItems] = useState<GalleryItem[]>(GALLERY_ITEMS);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('/api/cms/gallery/photos');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
             const mapped = data.map((p: any) => ({
                id: p.id,
                title: p.title || 'Momen Keberangkatan',
                category: 'keberangkatan',
                categoryLabel: 'Galeri',
                imageUrl: p.imageUrl,
                location: 'Bandara / Hotel / Tanah Suci',
                hijriDate: '',
                gregorianDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'}) : '',
                batchName: 'Jemaah',
                jemaahCount: 45,
                description: p.description || '',
                likesCount: Math.floor(Math.random() * 500) + 100
             }));
             setItems(mapped);
          }
        }
      } catch (error) {
        console.error('Failed to fetch gallery', error);
      }
    };
    fetchGallery();
  }, []);
`;

code = code.replace(
  "  const [activeTab, setActiveTab] = useState<string>('semua');",
  fetchLogic + "\n  const [activeTab, setActiveTab] = useState<string>('semua');"
);

code = code.replaceAll("GALLERY_ITEMS", "items");
// Wait, replacing all might affect the declaration "export const GALLERY_ITEMS".
// Let's replace selectively.

fs.writeFileSync('src/components/DepartureGalleryShowcase.tsx', code);
