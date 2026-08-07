import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const seedSnippet = `
      // Seed gallery if empty
      try {
        const galleryCount = await db.select({ count: sql\`count(*)\` }).from(schema.gallery_photos);
        if (Number(galleryCount[0].count) === 0) {
          console.log("Seeding gallery photos...");
          const defaultPhotos = [
            { title: "Thawaf Khusyuk & Sa\\'i Jemaah VIP Ring 1", imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80" },
            { title: "Kajian Sirah Nabawiyah Eksklusif", imageUrl: "https://images.unsplash.com/photo-1580238053495-b9720401fd45?auto=format&fit=crop&w=1200&q=80" },
            { title: "Pelepasan Haru Jemaah VIP", imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=1200&q=80" },
            { title: "Perjalanan Kereta Cepat Haramain", imageUrl: "https://images.unsplash.com/photo-1561383827-046ee9fec886?auto=format&fit=crop&w=1200&q=80" },
            { title: "City Tour Jabal Magnet & Al-Ula", imageUrl: "https://images.unsplash.com/photo-1623512903741-9fb12a912bb1?auto=format&fit=crop&w=1200&q=80" },
            { title: "Tenda AC VIP & Sofa Bed Armuzna", imageUrl: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80" },
            { title: "Penerbangan Direct Flight Saudia Airlines", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80" }
          ];
          const ws = await db.query.workspaces.findFirst();
          if (ws) {
            for (const p of defaultPhotos) {
              await db.insert(schema.gallery_photos).values({
                workspaceId: ws.id,
                title: p.title,
                imageUrl: p.imageUrl
              });
            }
          }
        }
      } catch (err) {
        console.error("Error seeding gallery:", err);
      }
`;

const insertIndex = code.indexOf('console.log(`Server running on http://0.0.0.0:${PORT}`);');
if (insertIndex > -1) {
  code = code.substring(0, insertIndex) + seedSnippet + code.substring(insertIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Success seed setup");
} else {
  console.log("Not found insert target");
}
