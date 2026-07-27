const fs = require('fs');
const file = 'src/pages/DashboardJamaah.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const handleUploadDocument = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      const currentDocs = userConsultation.documents || {};
      const updatedDocs = {
        ...currentDocs,
        [docName]: e.target.files[0].name
      };
      const updated = {
        ...userConsultation,
        documents: updatedDocs
      };
      updateConsultation(updated);
    }
  };`;

const replacement = `  const handleUploadDocument = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentDocs = userConsultation.documents || {};
        const updatedDocs = {
          ...currentDocs,
          [docName]: reader.result as string
        };
        const updated = {
          ...userConsultation,
          documents: updatedDocs
        };
        updateConsultation(updated);
        alert(\`Dokumen \${docName} berhasil diunggah.\`);
      };
      reader.readAsDataURL(file);
    }
  };`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Success");
} else {
    console.log("Not found");
}
