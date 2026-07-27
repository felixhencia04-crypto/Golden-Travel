sed -i '548,564c\
  // Smart Alerts Logic\
  const getSmartAlerts = () => {\
    const alerts = [];\
\
    if (!userConsultation?.paxData || !userConsultation.paxData[0]?.isSubmitted) {\
      alerts.push({ id: '\''biodata'\'', title: '\''Biodata Belum Final'\'', desc: '\''Mohon lengkapi dan submit final data diri Anda.'\'', type: '\''error'\'', completed: false });\
    } else {\
      alerts.push({ id: '\''biodata'\'', title: '\''Biodata Lengkap'\'', desc: '\''Data diri Anda telah disubmit dan tersimpan.'\'', type: '\''success'\'', completed: true });\
    }\
\
    if (!userConsultation?.paymentStep || userConsultation?.paymentStep === '\''none'\'') {\
      alerts.push({ id: '\''pay'\'', title: '\''Menunggu DP 1'\'', desc: '\''Segera lakukan pembayaran DP 1 untuk mengamankan perlengkapan.'\'', type: '\''warning'\'', completed: false });\
    } else if (userConsultation?.paymentStep === '\''dp1'\'') {\
      alerts.push({ id: '\''pay2'\'', title: '\''DP 2 Jatuh Tempo'\'', desc: '\''Batas akhir booking seat adalah 3 hari lagi.'\'', type: '\''warning'\'', completed: false });\
    } else {\
      alerts.push({ id: '\''pay'\'', title: '\''Pembayaran Selesai'\'', desc: '\''Kewajiban pembayaran Anda saat ini telah terpenuhi.'\'', type: '\''success'\'', completed: true });\
    }\
\
    const docCount = Object.keys(userConsultation?.documents || {}).length;\
    if (docCount < 6) {\
      alerts.push({ id: '\''docs'\'', title: '\''Upload Dokumen'\'', desc: `${6 - docCount} dokumen lagi diperlukan untuk pengurusan visa.`, type: '\''info'\'', completed: false });\
    } else {\
      alerts.push({ id: '\''docs'\'', title: '\''Dokumen Lengkap'\'', desc: '\''Seluruh dokumen persyaratan telah diupload.'\'', type: '\''success'\'', completed: true });\
    }\
\
    return alerts;\
  };\
' src/pages/DashboardJamaah.tsx
