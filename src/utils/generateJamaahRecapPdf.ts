import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Consultation } from '../types';

interface RecapPdfOptions {
  title?: string;
  filterPackage?: string;
  filterStatus?: string;
  searchKeyword?: string;
}

export const generateJamaahRecapPdf = (jamaahList: Consultation[], options?: RecapPdfOptions) => {
  const doc = new jsPDF({
    orientation: 'landscape',
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
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(...GOLD_COLOR);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 225, 230);
  doc.text('Travel Umroh & Haji Plus Terpercaya — Laporan Executive Database Jamaah', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 215, 0); // Gold text
  doc.text('REKAPAN DATABASE JAMAAH', pageWidth - 14, 14, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Dicetak pada: ${printDate} WIB`, pageWidth - 14, 20, { align: 'right' });

  // 2. Summary Box (KPI Cards)
  let yPos = 35;

  const totalJamaah = jamaahList.length;
  const totalPax = jamaahList.reduce((acc, curr) => acc + (curr.paxData?.length || curr.paxCount || 1), 0);
  const totalLunas = jamaahList.filter(c => c.paymentStep === 'lunas').length;
  const totalDp = jamaahList.filter(c => c.paymentStep === 'dp1' || c.paymentStep === 'dp2').length;
  const totalBelumDp = jamaahList.filter(c => !c.paymentStep || c.paymentStep === 'none').length;

  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 18, 3, 3, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);

  // Col 1: Total Registrasi
  doc.text(`Total Registrasi: ${totalJamaah} Pemesan`, 20, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Total Individu (Pax): ${totalPax} Jamaah`, 20, yPos + 13);

  // Col 2: Status Pembayaran Breakdowns
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status Lunas: ${totalLunas} Pemesan`, 100, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`DP (DP1/DP2): ${totalDp}  |  Belum DP: ${totalBelumDp}`, 100, yPos + 13);

  // Col 3: Filter Info
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Kriteria Filter Report:', 180, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const filterPkgText = options?.filterPackage && options.filterPackage !== 'all' ? options.filterPackage : 'Semua Paket';
  const filterStatText = options?.filterStatus && options.filterStatus !== 'all' ? options.filterStatus : 'Semua Status';
  doc.text(`Paket: ${filterPkgText}  |  Status: ${filterStatText}`, 180, yPos + 13);

  yPos += 24;

  // 3. Table of Rekapan Jamaah
  const tableData = jamaahList.map((item, index) => {
    const bio = item.paxData?.[0] || {};
    const primaryName = item.name || bio.fullName || 'Tanpa Nama';
    const nik = bio.nik || '-';
    const phone = bio.phone || item.phone || '-';
    const email = item.accountEmail || item.email || '-';
    const pkgName = item.packageName || item.packageId || 'Belum Pilih Paket';
    const paxCount = item.paxData?.length || item.paxCount || 1;
    
    // Rincian nama seluruh pax dalam grup
    let paxDetails = '';
    if (item.paxData && item.paxData.length > 0) {
      paxDetails = '\n' + item.paxData.map((p, i) => `   ${i + 1}. ${p.fullName || 'Jamaah ' + (i+1)}`).join('\n');
    }

    const nameCell = `${primaryName}${paxDetails ? '\n[Rincian ' + paxCount + ' Pax]:' + paxDetails : ''}`;

    let statusPay = 'Belum DP';
    if (item.paymentStep === 'lunas') statusPay = 'Lunas';
    else if (item.paymentStep === 'dp2') statusPay = 'DP 2 Terbayar';
    else if (item.paymentStep === 'dp1') statusPay = 'DP 1 Terbayar';

    const regDate = item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : (item.date || '-');

    return [
      (index + 1).toString(),
      nameCell,
      `NIK: ${nik}\nHP: ${phone}`,
      `Email: ${email}`,
      pkgName,
      `${paxCount} Pax`,
      statusPay,
      regDate
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Nama Jamaah / Pemesan', 'NIK & No. WA', 'Email Akun', 'Paket Umroh/Haji', 'Jumlah', 'Status Bayar', 'Tgl Registrasi']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 40, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
      7: { cellWidth: 28, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === 'Lunas') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        } else if (val.includes('DP')) {
          data.cell.styles.textColor = [161, 98, 7]; // Yellow/Gold
        } else {
          data.cell.styles.textColor = [185, 28, 28]; // Red
        }
      }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Signatures Section at bottom
  if (finalY > pageHeight - 45) {
    doc.addPage();
    finalY = 25;
  }

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);

  const leftCenterX = pageWidth / 4;
  doc.text('Dibuat & Diverifikasi Oleh,', leftCenterX, finalY, { align: 'center' });
  doc.text('PT. Golden Tour Haramain', leftCenterX, finalY + 5, { align: 'center' });
  doc.text('( ______________________ )', leftCenterX, finalY + 25, { align: 'center' });
  doc.text('Staff Administrasi & CRM', leftCenterX, finalY + 30, { align: 'center' });

  const rightCenterX = (pageWidth / 4) * 3;
  doc.text(`Batam, ${todayStr}`, rightCenterX, finalY, { align: 'center' });
  doc.text('Mengetahui / Disetujui,', rightCenterX, finalY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Manajemen Operations', rightCenterX, finalY + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('( Stempel & Tanda Tangan )', rightCenterX, finalY + 30, { align: 'center' });

  // 5. Page numbering on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('PT. Golden Tour Haramain — Laporan Rekapan Database Jamaah Dokumen Resmi', 14, pageHeight - 7);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().split('T')[0];
  doc.save(`Rekapan_Database_Jamaah_GoldenTour_${dateSlug}.pdf`);
};

export const generateDepartureManifestPdf = (
  jamaahList: Consultation[],
  options?: { filterPackage?: string; filterStatus?: string; filterDate?: string; title?: string }
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const BRAND_DARK: [number, number, number] = [11, 71, 46]; // Deep Green
  const GOLD_PRIMARY: [number, number, number] = [212, 160, 23];
  const TEXT_DARK: [number, number, number] = [30, 41, 59];
  const BRAND_GREEN: [number, number, number] = [22, 101, 52]; // Professional Green for text

  // Header Box
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(...GOLD_PRIMARY);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('MANIFEST & REKAPITULASI JAMAAH BERANGKAT', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text('PT. GOLDEN TOUR HARAMAIN — DOKUMEN MANIFEST RESMI EMBARKASI / KEBERANGKATAN', 14, 20);

  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Dicetak: ${nowStr}`, pageWidth - 14, 13, { align: 'right' });

  let yPos = 35;

  const filterPkgText = options?.filterPackage && options.filterPackage !== 'all' ? options.filterPackage : 'Semua Paket';
  const filterStatText = options?.filterStatus && options.filterStatus !== 'all' ? options.filterStatus : 'Semua Status';
  const filterDateText = options?.filterDate && options.filterDate !== 'all' ? options.filterDate : 'Semua Bulan';
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Laporan Manifest Jamaah (Filter: ${filterPkgText} | Status: ${filterStatText} | Bulan: ${filterDateText})`, 14, yPos);
  
  yPos += 6;

  // Flatten individual pax
  const flatPaxList: Array<{
    no: number;
    fullName: string;
    nik: string;
    gender: string;
    pobDob: string;
    passportNo: string;
    passportExpiry: string;
    pkgName: string;
    statusPay: string;
    accountOwner: string;
    phone: string;
    regDate: string;
  }> = [];

  let paxCounter = 1;

  jamaahList.forEach((group) => {
    const pkg = group.packageName || group.packageId || 'Belum Pilih Paket';
    let payStr = 'Belum DP';
    if (group.paymentStep === 'lunas') payStr = 'LUNAS';
    else if (group.paymentStep === 'dp2') payStr = 'DP 2';
    else if (group.paymentStep === 'dp1') payStr = 'DP 1';

    const pList = group.paxData && group.paxData.length > 0 ? group.paxData : [{
      fullName: group.name,
      nik: group.paxData?.[0]?.nik || '-',
      phone: group.phone,
      gender: '-',
      pob: '-',
      dob: '-',
      passportNo: '-',
      passportExpiryDate: '-'
    }];

    pList.forEach((pax: any, idx: number) => {
      const isLead = idx === 0;
      let fullNameStr = (pax.fullName || pax.userName || pax.namaLengkap || pax.name || '').trim();
      
      if (!fullNameStr || (group.isMitra && fullNameStr.toLowerCase() === (group.name || '').toLowerCase())) {
        fullNameStr = group.isMitra ? 'Jamaah Mitra' : (group.name || `Jamaah #${paxCounter}`);
      }

      let paxDisplay = fullNameStr;
      if (group.isMitra) {
        paxDisplay = `${fullNameStr} (Mitra: ${group.mitraName || group.name})`;
      } else if (isLead && fullNameStr === group.name) {
        paxDisplay = `${fullNameStr} (Pemesan)`;
      }

      flatPaxList.push({
        no: paxCounter++,
        fullName: paxDisplay,
        nik: pax.nik || group.paxData?.[0]?.nik || '-',
        gender: pax.gender === 'L' ? 'Laki-Laki' : pax.gender === 'P' ? 'Perempuan' : pax.gender || '-',
        pobDob: (pax.pob || pax.dob) ? `${pax.pob || ''}${pax.dob ? ', ' + pax.dob : ''}` : '-',
        passportNo: pax.passportNo || '-',
        passportExpiry: pax.passportExpiryDate || pax.passportExpiry || '-',
        pkgName: pkg,
        statusPay: payStr,
        accountOwner: group.isMitra ? `Mitra: ${group.mitraName || group.name}` : (group.name || '-'),
        phone: pax.phone || group.phone || '-',
        regDate: group.createdAt ? new Date(group.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (group.date || '-')
      });
    });
  });

  const tableData = flatPaxList.map(item => [
    item.no.toString(),
    item.fullName,
    item.regDate,
    item.nik,
    item.gender,
    item.pobDob,
    item.passportNo,
    item.passportExpiry,
    item.pkgName,
    item.statusPay,
    item.phone
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['NO', 'NAMA JAMAAH', 'TGL DAFTAR', 'NIK', 'L/P', 'TEMPAT, TGL LAHIR', 'NO PASPOR', 'EXPIRE PASPOR', 'PAKET TRAVEL', 'STATUS', 'NO WHATSAPP']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: TEXT_DARK,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 32, halign: 'center' },
      6: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 30, halign: 'center' },
      9: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 26, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: function(data) {
      // Color columns "NO" and "NAMA JAMAAH" green
      if (data.section === 'body' && (data.column.index === 0 || data.column.index === 1)) {
        data.cell.styles.textColor = BRAND_GREEN;
      }

      if (data.section === 'body' && data.column.index === 9) {
        const val = data.cell.raw as string;
        if (val === 'LUNAS') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val.includes('DP')) {
          data.cell.styles.textColor = [161, 98, 7];
        } else {
          data.cell.styles.textColor = [185, 28, 28];
        }
      }
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  if (finalY > pageHeight - 45) {
    doc.addPage();
    finalY = 25;
  }

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);

  // Left Signature Block
  const leftCenterX = pageWidth / 4;
  doc.text('Dibuat & Diverifikasi Oleh,', leftCenterX, finalY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('PT. Golden Tour Haramain', leftCenterX, finalY + 6, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.text('( __________________________ )', leftCenterX, finalY + 30, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Staff Administrasi & CRM', leftCenterX, finalY + 35, { align: 'center' });

  // Right Signature Block
  const rightCenterX = (pageWidth / 4) * 3;
  doc.setFontSize(9);
  doc.text(`Batam, ${todayStr}`, rightCenterX, finalY, { align: 'center' });
  doc.text('Mengetahui / Disetujui,', rightCenterX, finalY + 6, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Manajemen Operations', rightCenterX, finalY + 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('( Stempel & Tanda Tangan )', rightCenterX, finalY + 35, { align: 'center' });

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('PT. Golden Tour Haramain — Document Manifest Official Manifest Departure List', 14, pageHeight - 7);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().split('T')[0];
  doc.save(`Manifest_Jamaah_Berangkat_GoldenTour_${dateSlug}.pdf`);
};
