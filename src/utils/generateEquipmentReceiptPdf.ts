import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function generateEquipmentReceiptPdf(jamaah: any, status: any, gender: 'L' | 'P') {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const isMale = gender === 'L';
    const jamaahName = jamaah?.name || jamaah?.userName || 'Jamaah Umroh';
    const packageName = jamaah?.packageName || 'Paket Umroh Reguler';
    const phone = jamaah?.phone || jamaah?.userPhone || '-';
    const email = jamaah?.email || jamaah?.userEmail || '-';

    // Receipt / Document Number
    const rawId = String(jamaah?.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortCode = rawId.length > 6 ? rawId.slice(0, 6) : (rawId || 'LKP888');
    const today = new Date();
    const docNo = `TTP/GTH/${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}/${shortCode}`;

    // 1. Header Banner
    doc.setFillColor(31, 58, 43); // Dark Matcha #1F3A2B
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Gold Accent Line
    doc.setFillColor(212, 175, 55); // #D4AF37
    doc.rect(0, 36, pageWidth, 1.5, 'F');

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Layanan Penyelenggara Perjalanan Ibadah Umrah & Haji Khusus', 14, 22);
    doc.text('Formulir & Tanda Terima Penyerahan Perlengkapan Jamaah', 14, 27);

    // Right Header Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TANDA TERIMA PERLENGKAPAN', pageWidth - 14, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Dokumen: ${docNo}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`Tanggal Cetak: ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 25, { align: 'right' });

    // 2. Jamaah Info Box
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(14, 42, pageWidth - 28, 26, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 58, 43);
    doc.text(`NAMA JAMAAH: ${jamaahName.toUpperCase()}`, 18, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Kategori Paket: ${packageName}`, 18, 56);
    doc.text(`No. Kontak: ${phone} | Email: ${email}`, 18, 62);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isMale ? 22 : 153, isMale ? 101 : 27, isMale ? 52 : 27);
    doc.text(`KATEGORI PERLENGKAPAN: ${isMale ? 'PRIA (LAKI-LAKI)' : 'WANITA (PEREMPUAN)'}`, pageWidth - 18, 50, { align: 'right' });

    // 3. Equipment Table
    const tableBody = [
      [
        '1',
        'Koper Utama & Tas Travel',
        '• Koper Bagasi Hardcase 24 Inch\n• Koper Kabin 20 Inch\n• Tas Paspor & ID Card Sling Bag',
        status?.koper ? 'SUDAH DISERAHKAN' : 'BELUM DISERAHKAN',
      ],
      [
        '2',
        isMale ? 'Pakaian Ibadah Utama (Pria)' : 'Pakaian Ibadah Utama (Wanita)',
        isMale
          ? '• Set Kain Ihram Katun Premium (2 Lembar)\n• Sabuk Ihram Putih / Hijau Khusus'
          : '• Set Mukena Premium Travel\n• Bergo / Kerudung Seragam Travel',
        status?.ihram ? 'SUDAH DISERAHKAN' : 'BELUM DISERAHKAN',
      ],
      [
        '3',
        'Seragam Batik & Buku Panduan',
        '• Kain Seragam Batik Resmi Jamaah\n• Buku Doa Manasik & Panduan Perjalanan Umroh\n• Syal & Bag Tag Golden Tour Haramain',
        status?.mukena ? 'SUDAH DISERAHKAN' : 'BELUM DISERAHKAN',
      ],
    ];

    autoTable(doc, {
      startY: 72,
      margin: { left: 14, right: 14 },
      head: [['NO', 'KATEGORI ITEM', 'RINCIAN PERLENGKAPAN JAMAAH', 'STATUS PENYERAHAN']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 58, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 42, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const val = data.cell.raw;
          if (val === 'SUDAH DISERAHKAN') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [220, 252, 231];
          } else {
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fillColor = [254, 226, 226];
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 140;

    // Staff Assignee Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Petugas / Staf Penyerah: ${status?.assignee || 'Staf Operasional Keberangkatan'}`, 14, finalY);

    // Signatures Section
    const sigY = finalY + 15;
    const leftColX = 55;
    const rightColX = pageWidth - 55;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(31, 58, 43);
    doc.text('Petugas Operasional', leftColX, sigY, { align: 'center' });
    doc.text('Penerima / Jamaah', rightColX, sigY, { align: 'center' });

    const nameY = sigY + 26;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 58, 43);
    doc.text(status?.assignee || 'Staf Golden Travel', leftColX, nameY, { align: 'center' });
    doc.text(jamaahName, rightColX, nameY, { align: 'center' });

    // Footer
    const footerY = pageHeight - 15;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(31, 58, 43);
    doc.text('PT. GOLDEN TOUR HARAMAIN - TIM OPERASIONAL KEBERANGKATAN', 14, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Tanda terima resmi ini dicetak dari Sistem Informasi Keberangkatan PT. Golden Tour Haramain.', 14, footerY + 4);

    const cleanName = jamaahName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Tanda_Terima_Perlengkapan_${cleanName}.pdf`);
    toast.success('PDF Tanda Terima Perlengkapan berhasil diunduh!');
  } catch (err) {
    console.error('Failed to generate equipment receipt PDF:', err);
    toast.error('Gagal membuat PDF Tanda Terima Perlengkapan');
  }
}
