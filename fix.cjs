const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');

const target = `  const handleUploadPayment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      let nextStep: 'none' | 'dp1' | 'dp2' | 'lunas' = 'dp1';
      if (userConsultation.paymentStep === 'dp1') nextStep = 'dp2';
      else if (userConsultation.paymentStep === 'dp2') nextStep = 'lunas';
      else if (userConsultation.paymentStep === 'lunas') nextStep = 'lunas';
      
      const updated = {
        ...userConsultation,
        paymentProofUrl: URL.createObjectURL(e.target.files[0]),
        pendingPaymentStep: nextStep,
      };
      updateConsultation(updated);
      alert(\`Bukti pembayaran berhasil diupload. Mohon menunggu verifikasi dari admin.\`);
    }
  };`;

const replacement = `  const handleUploadPayment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userConsultation) {
      const file = e.target.files[0];
      let nextStep: 'none' | 'dp1' | 'dp2' | 'lunas' = 'dp1';
      if (userConsultation.paymentStep === 'dp1') nextStep = 'dp2';
      else if (userConsultation.paymentStep === 'dp2') nextStep = 'lunas';
      else if (userConsultation.paymentStep === 'lunas') nextStep = 'lunas';
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = {
          ...userConsultation,
          paymentProofUrl: reader.result as string,
          pendingPaymentStep: nextStep,
        };
        updateConsultation(updated);
        alert(\`Bukti pembayaran berhasil diupload. Mohon menunggu verifikasi dari admin.\`);
      };
      reader.readAsDataURL(file);
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/DashboardJamaah.tsx', content, 'utf8');
