import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

// Fix CMSGallery
const galleryDeleteRegex = /const handleDelete = async \(id: string\) => \{\n\s*if \(!confirm\('Hapus foto ini\?'\)\) return;\n\s*try \{\n\s*await api\.delete\(\`\/api\/cms\/gallery\/photos\/\$\{id\}\`\);\n\s*toast\.success\('Foto dihapus'\);\n\s*fetchPhotos\(\);\n\s*\} catch \(error\) \{\n\s*toast\.error\('Gagal menghapus foto'\);\n\s*\}\n\s*\};/;

const newGalleryDelete = `
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(\`/api/cms/gallery/photos/\${deleteConfirmId}\`);
      toast.success('Foto dihapus');
      fetchPhotos();
    } catch (error) {
      toast.error('Gagal menghapus foto');
    } finally {
      setDeleteConfirmId(null);
    }
  };
`;

const oldGalleryButton = /onClick=\{\(\) => handleDelete\(photo\.id\)\}/g;
const newGalleryButton = `onClick={() => setDeleteConfirmId(photo.id)}`;
const galleryReturnRegex = /(function CMSGallery\(\) \{[\s\S]*?return \(\n\s*<div className="p-6">)/;

const galleryConfirmMarkup = `
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Foto"
        message="Apakah Anda yakin ingin menghapus foto ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />`;

if (galleryDeleteRegex.test(code)) {
  code = code.replace(galleryDeleteRegex, newGalleryDelete);
  code = code.replace(oldGalleryButton, newGalleryButton);
  code = code.replace(galleryReturnRegex, "$1" + galleryConfirmMarkup);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success gallery");
} else {
  console.log("Gallery Regex not found");
}
