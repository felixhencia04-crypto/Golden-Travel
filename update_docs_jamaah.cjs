const fs = require('fs');
const file = 'src/pages/DashboardJamaah.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleUploadDocument = \(docName: string, e: React.ChangeEvent<HTMLInputElement>\) => \{\s*if \(e.target.files && e.target.files\[0\] && userConsultation\) \{\s*const currentDocs = userConsultation.documents \|\| \{\};\s*const updatedDocs = \{\s*\.\.\.currentDocs,\s*\[docName\]: e.target.files\[0\].name\s*\};\s*const updated = \{\s*\.\.\.userConsultation,\s*documents: updatedDocs\s*\};\s*updateConsultation\(updated\);\s*alert\(\`Dokumen \$\{docName\} berhasil diunggah\.\`\);\s*\}\s*\};/g;

const replacement = `const handleUploadDocument = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
