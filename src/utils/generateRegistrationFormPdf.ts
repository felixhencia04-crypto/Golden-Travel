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
  doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 15);

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

  // Column 1: Paket Informasi
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('INFORMASI PROGRAM & PAKET', 18, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Paket: ${jamaah.packageName || jamaah.packageTitle || 'Paket Umroh/Haji'}`, 18, yPos + 11);

  // Column 2: Status & Jumlah Pax
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('STATUS & PESANAN', 105, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  const paymentStatusText = (!jamaah.paymentStep || jamaah.paymentStep === 'none') ? 'Belum DP' : jamaah.paymentStep === 'dp1' ? 'DP 1 Terbayar' : jamaah.paymentStep === 'dp2' ? 'DP 2 Terbayar' : 'Lunas';
  doc.text(`Status Pembayaran: ${paymentStatusText}`, 105, yPos + 11);
  const paxCount = jamaah.paxCount || (jamaah.paxData?.length) || 1;
  doc.text(`Jumlah Pax: ${paxCount} Orang   |   Tgl Daftar: ${regDate}`, 105, yPos + 16);

  yPos += 25; // Reduced from 30

  // 3. Section 1: Data Pemesan / Penanggung Jawab (Mitra Agen)
  doc.setFontSize(9.5); // Reduced from 10
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('I. DATA MITRA PENANGGUNG JAWAB', 14, yPos);
  doc.setDrawColor(...GOLD_COLOR);
  doc.setLineWidth(0.4);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 6;

  const ordererName = jamaah.mitraName || jamaah.ordererName || jamaah.name || 'Mitra Agen Resmi';
  const ordererPhone = jamaah.mitraPhone || jamaah.ordererPhone || '081298765432';
  const ordererNotes = jamaah.ordererNotes || `Didaftarkan melalui Portal Mitra Resmi - ${ordererName}`;

  const ordererData = [
    ['Nama Mitra / Agen', ordererName],
    ['Telepon / WhatsApp', ordererPhone],
    ['Catatan Pendaftaran', ordererNotes]
  ];

  autoTable(doc, {
    startY: yPos,
    body: ordererData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [71, 85, 105] },
      1: { cellWidth: 120 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 6; // Reduced from 10

  // 4. Section 2: Data Jamaah (Pax Data)
  doc.setFontSize(9.5); // Reduced from 10
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('II. BIODATA LENGKAP & DOKUMEN JAMAAH', 14, yPos);
  doc.setDrawColor(...GOLD_COLOR);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 6; // Reduced from 8

  const rawPaxList = (jamaah.paxData && jamaah.paxData.length > 0)
    ? jamaah.paxData
    : (jamaah.paxDataList && jamaah.paxDataList.length > 0)
    ? jamaah.paxDataList
    : [jamaah];

  rawPaxList.forEach((pax: any, index: number) => {
    // Check for page overflow
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    const name = pax.userName || pax.fullName || pax.name || `Jamaah ${index + 1}`;
    
    // Header for individual jamaah
    doc.setFillColor(...LIGHT_BG);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`DATA JAMAAH #${index + 1}: ${name.toUpperCase()}`, 18, yPos + 5.5);
    yPos += 10;

    const nik = pax.nik || '-';
    const gender = pax.jenisKelamin || pax.gender || '-';
    const pob = pax.tempatLahir || pax.pob || '-';
    const dob = pax.tanggalLahir || pax.dob || '-';
    const pobDobStr = (pob !== '-' || dob !== '-') ? `${pob}, ${dob}` : '-';
    
    const rawMaritalStatus = pax.statusPernikahan || pax.maritalStatus || '-';
    const spouseName = pax.namaPasangan || pax.spouseName || '';
    let maritalStatusStr = rawMaritalStatus;
    if (rawMaritalStatus.toLowerCase().includes('menikah') && spouseName) {
      maritalStatusStr = `Menikah (Pasangan: ${spouseName})`;
    }

    const job = pax.pekerjaan || pax.occupation || '-';
    const phone = pax.userPhone || pax.phone || '-';
    const address = pax.alamatLengkap || pax.address || '-';
    
    // Paspor Data
    const pasporNo = pax.pasporNo || pax.passportNo || '-';
    const pasporNama = pax.pasporNama || pax.passportName || pax.userName || '-';
    const pasporTempat = pax.pasporTempat || pax.passportOffice || '-';
    const pasporExpired = pax.pasporTglExpired || pax.pasporExpired || pax.passportExpiryDate || '-';
    
    // Emergency
    const eName = pax.kontakDaruratNama || pax.emergencyName || '-';
    const eRel = pax.kontakDaruratHubungan || pax.emergencyRelation || '-';
    const ePhone = pax.kontakDaruratPhone || pax.emergencyPhone || '-';
    const emergencyStr = (eName !== '-' || ePhone !== '-') ? `${eName} (${eRel}) - ${ePhone}` : '-';

    // Medis
    const rawMed = pax.riwayatMedisPenyakit || pax.medicalHistory || 'Sehat / Tidak ada';
    const medList = Array.isArray(rawMed) ? rawMed.join(', ') : String(rawMed);
    const medDetail = pax.riwayatMedisDetail || pax.medicalHistoryDetails || '';
    const medicalStr = medDetail ? `${medList} (Detail: ${medDetail})` : medList;

    const paxDetails = [
      ['NAMA LENGKAP (KTP)', name],
      ['NIK KTP', nik],
      ['TEMPAT, TGL LAHIR', pobDobStr],
      ['JENIS KELAMIN', gender],
      ['STATUS PERNIKAHAN', maritalStatusStr],
      ['PEKERJAAN', job],
      ['NO. WHATSAPP / HP', phone],
      ['ALAMAT DOMISILI', address],
      ['NOMOR PASPOR RI', pasporNo],
      ['NAMA DI PASPOR', pasporNama],
      ['MASA BERLAKU PASPOR', pasporExpired],
      ['KONTAK DARURAT', emergencyStr],
      ['RIWAYAT KESEHATAN', medicalStr]
    ];

    autoTable(doc, {
      startY: yPos,
      body: paxDetails,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        1: { cellWidth: 125 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 6; // Reduced from 10
  });

  // 5. Terms & Signatures (Grouped to stay on same page)
  const estimatedTermsHeight = 25; // Reduced
  const estimatedSignaturesHeight = 35; // Reduced
  const totalNeededHeight = estimatedTermsHeight + estimatedSignaturesHeight;

  if (yPos > pageHeight - totalNeededHeight) {
    // Only add page if we are really low on space
    if (yPos > pageHeight - (totalNeededHeight / 1.5)) {
      doc.addPage();
      yPos = 20;
    }
  }

  doc.setFontSize(8.5); // Slightly smaller
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('III. PERNYATAAN & KETENTUAN PENDAFTARAN', 14, yPos);
  doc.line(14, yPos + 1.5, pageWidth - 14, yPos + 1.5);

  yPos += 5; // Reduced from 6

  doc.setFontSize(7); // Smaller font for terms
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const terms = [
    '1. Seluruh data biodata dan dokumen yang diserahkan adalah sah dan dapat dipertanggungjawabkan.',
    '2. Paspor jamaah wajib memiliki masa berlaku minimal 7 bulan sebelum tanggal keberangkatan.',
    '3. Pelunasan biaya perjalanan wajib diselesaikan sesuai batas waktu yang telah ditentukan oleh travel.',
    '4. Pembatalan pendaftaran tunduk pada syarat dan ketentuan kebijakan pengembalian biaya PT. Golden Tour Haramain.'
  ];

  terms.forEach(term => {
    doc.text(term, 14, yPos);
    yPos += 3.5; // Reduced from 4
  });

  yPos += 4; // Reduced from 6

  // Signatures
  const dateToday = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8); // Smaller signature text
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);

  // Left Signature
  const rawPaxListForSig = (jamaah.paxData && jamaah.paxData.length > 0)
    ? jamaah.paxData
    : (jamaah.paxDataList && jamaah.paxDataList.length > 0)
    ? jamaah.paxDataList
    : [jamaah];

  const primaryJamaahName = 
    rawPaxListForSig[0]?.fullName || 
    rawPaxListForSig[0]?.userName || 
    rawPaxListForSig[0]?.name || 
    jamaah.userName || 
    jamaah.name || 
    jamaah.ordererName || 
    'Calon Jamaah';

  const leftCenterX = 45;
  doc.text('Pemesan / Calon Jamaah,', leftCenterX, yPos + 5, { align: 'center' });
  doc.text('( ______________________ )', leftCenterX, yPos + 28, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(primaryJamaahName, leftCenterX, yPos + 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Right Signature
  const rightCenterX = pageWidth - 45;
  doc.text(`Batam, ${dateToday}`, rightCenterX, yPos + 5, { align: 'center' });
  doc.text('PT. Golden Tour Haramain,', rightCenterX, yPos + 10, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Petugas Administrasi', rightCenterX, yPos + 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('( Stempel & Tanda Tangan )', rightCenterX, yPos + 34, { align: 'center' });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('PT. Golden Tour Haramain — Formulir Pendaftaran Jamaah Digital Resmi', 14, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const fileNameName = (jamaah.ordererName || jamaah.name || 'Jamaah').replace(/\s+/g, '_');
  doc.save(`Formulir_Pendaftaran_${fileNameName}_${regNo}.pdf`);
};
