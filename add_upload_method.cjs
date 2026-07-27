const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /const updateManifest = async \(/;

const newMethod = `
  const uploadFinalDocument = async (registrationId: string, docType: string, url: string) => {
    try {
      await api.post(\`/admin/final-documents/\${registrationId}\`, { docType, fileUrl: url });
      toast.success('Dokumen berhasil diunggah');
      await refreshData(true);
    } catch (e: any) {
      toast.error('Gagal mengunggah dokumen: ' + e.message);
    }
  };

  const updateManifest = async (`;

code = code.replace(regex, newMethod);
fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("uploadFinalDocument added");
