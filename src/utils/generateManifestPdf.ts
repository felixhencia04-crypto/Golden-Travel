import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateManifestPdf = (jamaahList: any[], mitraFilter: string) => {
  if (!jamaahList || jamaahList.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // Slate 900
  const ACCENT_COLOR: [number, number, number] = [20, 184, 166]; // Teal 500
  const SECONDARY_COLOR: [number, number, number] = [26, 54, 38]; // Deep Green

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('MANIFEST DATA CALON JAMAAH', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const filterText = mitraFilter === 'all' ? 'Seluruh Mitra Penanggung Jawab' : `Mitra: ${mitraFilter}`;
  doc.text(`Filter: ${filterText} | Total: ${jamaahList.length} Jamaah`, 14, 21);

  doc.setFontSize(8);
  const dateToday = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Dicetak pada: ${dateToday}`, pageWidth - 14, 16, { align: 'right' });
  doc.text('PT. GOLDEN TOUR HARAMAIN', pageWidth - 14, 21, { align: 'right' });

  // Table Data Preparation
  const tableData = jamaahList.map((j, index) => [
    index + 1,
    j.userName || '-',
    j.nik || '-',
    j.pasporNo || '-',
    j.userPhone || '-',
    j.packageName || '-',
    j.mitraName || '-',
    j.statusBiodata === 'verified' ? 'TERVERIFIKASI' : 'PENDING'
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['No', 'Nama Lengkap Jamaah', 'NIK KTP', 'No. Paspor', 'No. HP/WA', 'Paket Umroh', 'Mitra', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { 
      fillColor: PRIMARY_COLOR, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 50 },
      6: { cellWidth: 40 },
      7: { halign: 'center', cellWidth: 25 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.raw as string;
        if (status === 'TERVERIFIKASI') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }
    }
  });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Dokumen ini dihasilkan secara otomatis oleh Portal Admin Golden Tour Haramain.', 14, pageHeight - 10);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  const fileName = `Manifest_Jamaah_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
