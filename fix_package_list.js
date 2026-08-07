import fs from 'fs';
let code = fs.readFileSync('src/components/admin/CMSManager.tsx', 'utf8');

const regexDelete = /const handleDelete = async \(id: string\) => \{\n\s*if \(!confirm\('Apakah Anda yakin ingin menghapus paket ini\?'\)\) return;\n\s*try \{\n\s*await api\.delete\(\`\/admin\/packages\/\$\{id\}\`\);\n\s*toast\.success\('Paket berhasil dihapus'\);\n\s*notifyRealtimeCatalogChange\(\);\n\s*fetchPackages\(\);\n\s*\} catch \(error\) \{\n\s*toast\.error\('Gagal menghapus paket'\);\n\s*\}\n\s*\};/;

const newDelete = `
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(\`/admin/packages/\${deleteConfirmId}\`);
      toast.success('Paket berhasil dihapus');
      notifyRealtimeCatalogChange();
      fetchPackages();
    } catch (error) {
      toast.error('Gagal menghapus paket');
    } finally {
      setDeleteConfirmId(null);
    }
  };
`;

const oldButton = /onClick=\{\(\) => handleDelete\(pkg\.id\)\}/g;

const newButton = `onClick={() => setDeleteConfirmId(pkg.id)}`;

const packageListReturnRegex = /(return \(\n\s*<div className="p-6">)/;

const confirmDialogMarkup = `
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Paket"
        message="Apakah Anda yakin ingin menghapus paket ini? Data tidak dapat dikembalikan."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />`;

if (regexDelete.test(code)) {
  code = code.replace(regexDelete, newDelete);
  code = code.replace(oldButton, newButton);
  code = code.replace(packageListReturnRegex, "$1" + confirmDialogMarkup);
  fs.writeFileSync('src/components/admin/CMSManager.tsx', code);
  console.log("Success package list");
} else {
  console.log("Regex not found");
}

