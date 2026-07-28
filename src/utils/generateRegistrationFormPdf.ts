import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateRegistrationFormPdf = (jamaah: any) => {
  if (!jamaah) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const PRIMARY_COLOR: [number, number, number] = [26, 54, 38]; // Deep Matcha Green #1A3626
  const GOLD_COLOR: [number, number, number] = [202, 160, 83]; // Warm Gold #CAA053
  const TEXT_DARK: [number, number, number] = [30, 41, 59]; // Slate 800
  const LIGHT_BG: [number, number, number] = [248, 250, 252]; // Slate 50

  // 1. Header Banner
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(...GOLD_COLOR);
  doc.rect(0, 32, pageWidth, 2, 'F');

  // Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PT GOLDEN TOUR HARAMAIN', 14, 15);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 230, 230);
  doc.text('Travel Umroh & Haji Plus Terpercaya', 14, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 215, 0); // Gold text
  doc.text('FORMULIR PENDAFTARAN RESMI', pageWidth - 14, 17, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const rawId = String(jamaah.id || jamaah.docId || 'REG-001');
  const regNo = rawId.length >= 8 ? `REG-GTH-${rawId.slice(0, 8).toUpperCase()}` : `REG-GTH-${rawId.toUpperCase()}`;
  doc.text(`No. Registrasi: ${regNo}`, pageWidth - 14, 23, { align: 'right' });

  // 2. Summary Box (Paket & Status)
  let yPos = 40;

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'FD');

  const regDate = jamaah.createdAt ? new Date(jamaah.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);

  // Column 1: Paket & Tipe Kamar
  doc.text('INFORMASI PROGRAM & PAKET', 18, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paket: ${jamaah.packageName || jamaah.packageTitle || 'Paket Umroh/Haji'}`, 18, yPos + 11);
  doc.text(`Tipe Kamar: ${jamaah.roomType ? String(jamaah.roomType).toUpperCase() : 'Quad (Standar)'}`, 18, yPos + 16);

  // Column 2: Status & Jumlah Pax
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS & PESANAN', 105, yPos + 6);
  doc.setFont('helvetica', 'normal');
  const paymentStatusText = (!jamaah.paymentStep || jamaah.paymentStep === 'none') ? 'Belum DP' : jamaah.paymentStep === 'dp1' ? 'DP 1 Terbayar' : jamaah.paymentStep === 'dp2' ? 'DP 2 Terbayar' : 'Lunas';
  doc.text(`Status Pembayaran: ${paymentStatusText}`, 105, yPos + 11);
  const paxCount = jamaah.paxData?.length || jamaah.paxCount || 1;
  doc.text(`Jumlah Pax: ${paxCount} Orang   |   Tgl Daftar: ${regDate}`, 105, yPos + 16);

  yPos += 28;

  // 3. Section 1: Data Pemesan / Penanggung Jawab
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('I. DATA PEMESAN / PENANGGUNG JAWAB', 14, yPos);
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.4);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 6;

  const ordererData = [
    ['Nama Pemesan', jamaah.ordererName || jamaah.name || jamaah.user?.name || '-'],
    ['Telepon / WA', jamaah.ordererPhone || jamaah.phone || jamaah.user?.phone || '-'],
    ['Email', jamaah.ordererEmail || jamaah.email || jamaah.user?.email || '-'],
    ['Catatan Pendaftaran', jamaah.ordererNotes || 'Tidak ada catatan khusus']
  ];

  autoTable(doc, {
    startY: yPos,
    body: ordererData,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [71, 85, 105] },
      1: { cellWidth: 120 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // 4. Section 2: Data Jamaah (Pax Data)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('II. BIODATA JAMAAH & DOKUMEN PASPOR', 14, yPos);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 6;

  const paxList = jamaah.paxData && jamaah.paxData.length > 0 ? jamaah.paxData : [{
    fullName: jamaah.name || jamaah.ordererName,
    nik: jamaah.nik || '-',
    phone: jamaah.phone || jamaah.ordererPhone,
    email: jamaah.email || jamaah.ordererEmail
  }];

  paxList.forEach((pax: any, index: number) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Jamaah ${index + 1}: ${pax.fullName || 'Nama Jamaah'}`, 14, yPos);

    yPos += 3;

    const paxDetails = [
      ['NIK', pax.nik || '-'],
      ['Tempat, Tanggal Lahir', `${pax.pob || '-'}, ${pax.dob || '-'}`],
      ['Jenis Kelamin', pax.gender || '-'],
      ['Status Pernikahan', pax.maritalStatus || '-'],
      ['Alamat Lengkap', pax.address || '-'],
      ['Nomor Paspor', pax.passportNo || '-'],
      ['Kantor Penerbit Paspor', pax.passportOffice || '-'],
      ['Masa Berlaku Paspor', pax.passportExpiryDate || '-'],
      ['Kontak Darurat', `${pax.emergencyName || '-'} (${pax.emergencyRelation || '-'}) - HP: ${pax.emergencyPhone || '-'}`],
      ['Riwayat Medis', pax.medicalHistory === 'Lainnya' ? (pax.medicalHistoryDetails || 'Lainnya') : (pax.medicalHistory || 'Sehat / Tidak ada')]
    ];

    autoTable(doc, {
      startY: yPos,
      body: paxDetails,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8, textColor: [30, 41, 59] },
      headStyles: { fillColor: PRIMARY_COLOR },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [241, 245, 249] },
        1: { cellWidth: 125 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 6;
  });

  // 5. Terms & Signatures
  if (yPos > pageHeight - 65) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('III. PERNYATAAN & KETENTUAN PENDAFTARAN', 14, yPos);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 6;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const terms = [
    '1. Seluruh data biodata dan dokumen yang diserahkan adalah sah dan dapat dipertanggungjawabkan.',
    '2. Paspor jamaah wajib memiliki masa berlaku minimal 7 bulan sebelum tanggal keberangkatan.',
    '3. Pelunasan biaya perjalanan wajib diselesaikan sesuai batas waktu yang telah ditentukan oleh travel.',
    '4. Pembatalan pendaftaran tunduk pada syarat dan ketentuan kebijakan pengembalian biaya PT Golden Tour Haramain.'
  ];

  terms.forEach(term => {
    doc.text(term, 14, yPos);
    yPos += 4;
  });

  yPos += 6;

  // Signatures
  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = 20;
  }

  const dateToday = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);

  // Left Signature
  doc.text('Pemesan / Calon Jamaah,', 25, yPos + 5);
  doc.text('( ______________________ )', 20, yPos + 28);
  doc.text(jamaah.ordererName || jamaah.name || 'Nama Lengkap', 25, yPos + 33);

  // Right Signature
  doc.text(`Batam, ${dateToday}`, pageWidth - 65, yPos + 5);
  doc.text('PT Golden Tour Haramain,', pageWidth - 65, yPos + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('Petugas Administrasi', pageWidth - 65, yPos + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('( Stempel & Tanda Tangan )', pageWidth - 65, yPos + 33);

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('PT Golden Tour Haramain — Formulir Pendaftaran Jamaah Digital Resmi', 14, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const fileNameName = (jamaah.ordererName || jamaah.name || 'Jamaah').replace(/\s+/g, '_');
  doc.save(`Formulir_Pendaftaran_${fileNameName}_${regNo}.pdf`);
};
