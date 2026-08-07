import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const videoDeleteRegex = /const handleDelete = async \(id: string\) => \{\n\s*if \(!confirm\('Hapus video ini\?'\)\) return;\n\s*try \{\n\s*await api\.delete\(\`\/api\/cms\/gallery\/videos\/\$\{id\}\`\);\n\s*toast\.success\('Video dihapus'\);\n\s*fetchVideos\(\);\n\s*\} catch \(error\) \{\n\s*toast\.error\('Gagal menghapus video'\);\n\s*\}\n\s*\};/;

const newVideoDelete = `
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(\`/api/cms/gallery/videos/\${deleteConfirmId}\`);
      toast.success('Video dihapus');
      fetchVideos();
    } catch (error) {
      toast.error('Gagal menghapus video');
    } finally {
      setDeleteConfirmId(null);
    }
  };
`;

const oldVideoButton = /onClick=\{\(\) => handleDelete\(video\.id\)\}/g;
const newVideoButton = `onClick={() => setDeleteConfirmId(video.id)}`;
const videoReturnRegex = /(function CMSVideoGallery\(\) \{[\s\S]*?return \(\n\s*<div className="p-6">)/;

const videoConfirmMarkup = `
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Video"
        message="Apakah Anda yakin ingin menghapus video ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />`;

if (videoDeleteRegex.test(code)) {
  code = code.replace(videoDeleteRegex, newVideoDelete);
  code = code.replace(oldVideoButton, newVideoButton);
  code = code.replace(videoReturnRegex, "$1" + videoConfirmMarkup);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success video gallery");
} else {
  console.log("Video Gallery Regex not found");
}
