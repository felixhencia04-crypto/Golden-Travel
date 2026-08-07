import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateJamaahBiodataPdf = (jamaah: any, paxIdx: number) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const PRIMARY_COLOR: [number, number, number] = [26, 54, 38];
  const GOLD_COLOR: [number, number, number] = [202, 160, 83];
  const TEXT_DARK: [number, number, number] = [30, 41, 59];
  const LIGHT_BG: [number, number, number] = [248, 250, 252];

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

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 215, 0); // Gold text
  doc.text('BIODATA JAMAAH', pageWidth - 14, 17, { align: 'right' });

  const rawId = String(jamaah.id || jamaah.docId || 'REG-001');
  const regNo = rawId.length >= 8 ? `REG-GTH-${rawId.slice(0, 8).toUpperCase()}` : `REG-GTH-${rawId.toUpperCase()}`;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`No. Registrasi: ${regNo}`, pageWidth - 14, 23, { align: 'right' });

  const pax = jamaah.paxData?.[paxIdx] || {};
  const jamaahName = pax.fullName || pax.name || 'Belum Diisi';

  let yPos = 40;

  // 2. Summary Box (Paket & Status)
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 22, 3, 3, 'FD');

  const regDate = jamaah.createdAt ? new Date(jamaah.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  
  doc.text('INFORMASI PROGRAM & PAKET', 18, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paket: ${jamaah.package?.name || jamaah.packageName || jamaah.packageTitle || 'Belum Pilih Paket'}`, 18, yPos + 11);
  const depDate = jamaah.schedule?.departureDate ? new Date(jamaah.schedule.departureDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Segera Ditentukan';
  doc.text(`Keberangkatan: ${depDate}`, 18, yPos + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('TANGGAL DAFTAR', 105, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${regDate}`, 105, yPos + 11);

  yPos += 30;

  // --- INFORMASI UTAMA (PEMESAN) ---
  const ordererName = jamaah.name || jamaah.ordererName || jamaah.paxData?.[0]?.fullName || jamaah.paxData?.[0]?.name || jamaah.user?.name || '-';
  const ordererPhone = jamaah.phone || jamaah.ordererPhone || jamaah.paxData?.[0]?.phone || jamaah.user?.phone || '-';
  const ordererEmail = jamaah.email || jamaah.ordererEmail || jamaah.paxData?.[0]?.email || jamaah.user?.email || '-';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('INFORMASI UTAMA (PEMESAN)', 14, yPos);
  
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    body: [
      ['Nama Pemesan', ordererName],
      ['Nomor HP / WA', ordererPhone],
      ['Email', ordererEmail]
    ],
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 1.2, lineColor: [226, 232, 240], lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] } }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('DATA DIRI & PASPOR', 14, yPos);
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
  yPos += 8;

  const paxDetails = [
    ['Nama Lengkap', jamaahName],
    ['NIK', pax.nik || '-'],
    ['Tempat, Tanggal Lahir', `${pax.pob || '-'}, ${pax.dob || '-'}`],
    ['Jenis Kelamin', pax.gender || '-'],
    ['Status Pernikahan', `${pax.maritalStatus || '-'}${pax.spouseName ? ` (${pax.spouseName})` : ''}`],
    ['Alamat Lengkap', pax.address || '-'],
    ['Telepon', pax.phone || (paxIdx === 0 ? (jamaah.phone || jamaah.ordererPhone || jamaah.user?.phone || '-') : '-')],
    ['Email', pax.email || (paxIdx === 0 ? (jamaah.email || jamaah.ordererEmail || jamaah.user?.email || '-') : '-')],
    ['', ''], // separator
    ['Nomor Paspor', pax.passportNo || '-'],
    ['Kantor Penerbit Paspor', pax.passportOffice || '-'],
    ['Tanggal Terbit', pax.passportIssueDate || '-'],
    ['Tanggal Berakhir', pax.passportExpiryDate || '-'],
    ['', ''], // separator
    ['Nama Kontak Darurat', pax.emergencyName || '-'],
    ['Hubungan Kontak Darurat', pax.emergencyRelation || '-'],
    ['Telepon Kontak Darurat', pax.emergencyPhone || '-'],
    ['', ''], // separator
    ['Riwayat Medis', pax.medicalHistory === 'Lainnya' ? (pax.medicalHistoryDetails || 'Lainnya') : (pax.medicalHistory || 'Sehat / Tidak ada')]
  ];

  autoTable(doc, {
    startY: yPos,
    body: paxDetails,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [71, 85, 105] },
      1: { cellWidth: 120 }
    },
    didDrawCell: (data) => {
      // Add visual separation
      if (data.row.raw[0] === '' && data.row.raw[1] === '') {
        doc.setDrawColor(226, 232, 240);
        doc.line(data.cell.x, data.cell.y + data.cell.height / 2, data.cell.x + 180, data.cell.y + data.cell.height / 2);
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Signatures
  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = 30;
  }
  
  const dateToday = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  
  // Right Signature
  const signatureCenterX = pageWidth - 45;
  doc.text(`Batam, ${dateToday}`, signatureCenterX, yPos, { align: 'center' });
  doc.text('Calon Jamaah,', signatureCenterX, yPos + 5, { align: 'center' });
  doc.text('( ______________________ )', signatureCenterX, yPos + 22, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text(jamaahName, signatureCenterX, yPos + 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('PT. Golden Tour Haramain — Cetak Biodata Jamaah', 14, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const fileNameName = jamaahName.replace(/\s+/g, '_');
  doc.save(`Biodata_${fileNameName}_${regNo}.pdf`);
};
