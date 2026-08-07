import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export interface CommissionPayoutItem {
  id: string;
  mitraUserId: string;
  mitraName: string;
  mitraPhone?: string;
  jamaahName?: string;
  packageName?: string;
  amount: string | number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mitraNotes?: string;
  adminNotes?: string;
  proofOfTransferUrl?: string;
  transferDate?: string;
  createdAt: string;
}

/**
 * Generate PDF Resi / Kwitansi Pencairan Komisi Mitra
 */
export async function generateCommissionReceiptPdf(payout: CommissionPayoutItem) {
  const toastId = toast.loading('Memproses PDF Resi Pencairan Komisi...');

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Formatting helpers
    const rawId = String(payout.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortCode = rawId.length > 8 ? rawId.slice(0, 8) : (rawId || 'KOM888');
    const txDate = payout.createdAt ? new Date(payout.createdAt) : new Date();
    const yearMonth = `${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const docNo = `KW-KOM/GTH/${yearMonth}/${shortCode}`;
    const amountNum = Number(payout.amount || 0);
    const amountFormatted = `Rp ${amountNum.toLocaleString('id-ID')}`;

    // 1. Header Banner (Dark Emerald Theme)
    doc.setFillColor(6, 78, 59); // Emerald 900 #064e3b
    doc.rect(0, 0, pageWidth, 36, 'F');

    // Gold Accent Line
    doc.setFillColor(212, 175, 55); // Gold #D4AF37
    doc.rect(0, 36, pageWidth, 1.5, 'F');

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Layanan Penyelenggara Umrah & Haji Khusus - Divisi Kemitraan', 14, 22);
    doc.text('Bukti Resmi Resi Pencairan Komisi Mitra Binaan', 14, 27);

    // Right Header Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('KWITANSI PENCAIRAN KOMISI', pageWidth - 14, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Dokumen: ${docNo}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 25, { align: 'right' });

    // 2. Status Badge Card
    const isApproved = payout.status === 'APPROVED';
    const isRejected = payout.status === 'REJECTED';

    let statusText = 'PENDING (MENUNGGU VERIFIKASI TRANSFER)';
    let statusBg = [254, 243, 199]; // Amber
    let statusFg = [146, 64, 14];

    if (isApproved) {
      statusText = 'SUDAH DITRANSFER & DISETUJUI ADMIN';
      statusBg = [220, 252, 231]; // Emerald
      statusFg = [22, 101, 52];
    } else if (isRejected) {
      statusText = 'PENGAJUAN DITOLAK';
      statusBg = [254, 226, 226]; // Rose
      statusFg = [153, 27, 27];
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(14, 42, pageWidth - 28, 14, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(statusFg[0], statusFg[1], statusFg[2]);
    doc.text(`STATUS: ${statusText}`, 18, 51);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID Pengajuan: ${payout.id || '-'}`, pageWidth - 18, 51, { align: 'right' });

    // 3. Details Table
    autoTable(doc, {
      startY: 60,
      margin: { left: 14, right: 14 },
      head: [['RINCIAN PARAMETER', 'DATA PENCAIRAN KOMISI MITRA']],
      body: [
        ['Nama Mitra Binaan', payout.mitraName || 'Mitra Golden Travel'],
        ['No. Telepon Mitra', payout.mitraPhone || '-'],
        ['Nama Jemaah Rujukan', payout.jamaahName || 'Semua Jemaah Binaan'],
        ['Jenis Paket Jemaah', payout.packageName || 'Paket Umrah / Haji'],
        ['Bank Tujuan', payout.bankName || '-'],
        ['Nomor Rekening Bank', payout.accountNumber || '-'],
        ['Atas Nama Rekening', payout.accountHolder || '-'],
        ['Nominal Pencairan Komisi', amountFormatted],
        ['Tanggal Pengajuan', txDate.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['Tanggal Selesai Transfer', payout.transferDate ? new Date(payout.transferDate).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'],
        ['Catatan Mitra', payout.mitraNotes || '-'],
        ['Catatan / Referensi Admin', payout.adminNotes || '-'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 248] },
        1: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.row.index === 5 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9.5;
          data.cell.styles.textColor = [6, 78, 59];
          data.cell.styles.fillColor = [226, 235, 229];
        }
      },
    });

    let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 130;

    // 4. Proof of Transfer image embedding (if available)
    if (payout.proofOfTransferUrl && payout.proofOfTransferUrl.startsWith('data:image')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(6, 78, 59);
      doc.text('LAMPIRAN BUKTI TRANSFER BANK ADMIN', 14, currentY);

      currentY += 4;
      const maxBoxW = pageWidth - 28;
      const targetBoxH = 50;

      doc.setFillColor(250, 251, 250);
      doc.setDrawColor(220, 225, 220);
      doc.roundedRect(14, currentY, maxBoxW, targetBoxH, 3, 3, 'FD');

      try {
        doc.addImage(payout.proofOfTransferUrl, 'PNG', 18, currentY + 3, maxBoxW - 8, targetBoxH - 6);
      } catch (err) {
        console.warn('Failed to embed proof image into PDF:', err);
      }

      currentY += targetBoxH + 8;
    }

    // 5. Signatures section
    const signY = Math.max(currentY, pageHeight - 115);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);

    // Left Signature: Mitra
    doc.text('Penerima Komisi (Mitra),', 30, signY);
    doc.line(25, signY + 18, 75, signY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(payout.mitraName || 'Mitra Binaan', 30, signY + 22);

    // Right Signature: Financial Admin
    doc.setFont('helvetica', 'normal');
    doc.text('Finance & Accounting Admin,', pageWidth - 70, signY);
    doc.line(pageWidth - 75, signY + 18, pageWidth - 25, signY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. Golden Tour Haramain', pageWidth - 70, signY + 22);

    // Footer note
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Resi ini merupakan dokumen pencairan komisi resmi yang dihasilkan oleh Sistem Portal Kemitraan PT. Golden Tour Haramain.', 14, pageHeight - 10);

    // Save File
    const nameClean = (payout.mitraName || 'Mitra').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Kwitansi_Komisi_${nameClean}_${shortCode}.pdf`;

    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success('PDF Kwitansi Pencairan Komisi berhasil diunduh!');
  } catch (error) {
    console.error('Gagal membuat PDF Kwitansi Komisi:', error);
    toast.dismiss(toastId);
    toast.error('Gagal mengunduh PDF Kwitansi Komisi.');
  }
}

/**
 * Generate PDF Laporan Rekapitulasi Komisi (Rekap Cair & Pending)
 */
export async function generateCommissionRecapPdf(
  payouts: CommissionPayoutItem[], 
  summary: { totalPending?: number; totalApproved?: number; pendingCount?: number; totalRequests?: number },
  reportTitle = 'Laporan Rekapitulasi Pencairan Komisi Mitra'
) {
  const toastId = toast.loading('Memproses Laporan PDF Rekap Komisi...');

  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFillColor(212, 175, 55); // Gold line
    doc.rect(0, 32, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('PT. GOLDEN TOUR HARAMAIN', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(reportTitle.toUpperCase(), 14, 21);
    doc.text('Laporan Pencairan Komisi Mitra Binaan Terverifikasi & Rekap Finansial', 14, 26);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DOKUMEN REKAPITULASI RESMI', pageWidth - 14, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 20, { align: 'right' });

    // 2. Summary KPI Box
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(14, 38, pageWidth - 28, 16, 3, 3, 'FD');

    const totalApproved = summary.totalApproved || payouts.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPending = summary.totalPending || payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalCount = payouts.length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 78, 59);
    doc.text(`TOTAL KOMISI CAIR (DITRANSFER): Rp ${totalApproved.toLocaleString('id-ID')}`, 20, 48);

    doc.setTextColor(180, 83, 9); // Amber
    doc.text(`TOTAL PENDING TRANSFER: Rp ${totalPending.toLocaleString('id-ID')}`, 130, 48);

    doc.setTextColor(50, 50, 50);
    doc.text(`TOTAL TRANSAKSI: ${totalCount} PERMINTAAN`, 230, 48);

    // 3. Table of Payouts
    const tableBody = payouts.map((p, idx) => [
      (idx + 1).toString(),
      new Date(p.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }),
      p.mitraName || '-',
      p.mitraPhone || '-',
      `${p.bankName} - ${p.accountNumber}\na.n ${p.accountHolder}`,
      `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}`,
      p.status === 'APPROVED' ? 'DITRANSFER' : p.status === 'PENDING' ? 'PENDING' : 'DITOLAK',
      p.transferDate ? new Date(p.transferDate).toLocaleDateString('id-ID') : '-',
      p.adminNotes || p.mitraNotes || '-'
    ]);

    autoTable(doc, {
      startY: 58,
      margin: { left: 14, right: 14 },
      head: [['NO', 'TANGGAL', 'NAMA MITRA', 'NO. HP', 'REKENING TUJUAN', 'NOMINAL KOMISI', 'STATUS', 'TGL TRANSFER', 'CATATAN']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 35, fontStyle: 'bold' },
        3: { cellWidth: 25 },
        4: { cellWidth: 50 },
        5: { cellWidth: 30, fontStyle: 'bold', halign: 'right' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 25 },
        8: { cellWidth: 'auto' }
      },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          const statusText = data.cell.raw;
          if (statusText === 'DITRANSFER') {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = 'bold';
          } else if (statusText === 'PENDING') {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          } else if (statusText === 'DITOLAK') {
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Save PDF File
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Rekap_Komisi_Mitra_${dateStr}.pdf`;

    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success('Laporan Rekap Komisi berhasil diunduh sebagai PDF!');
  } catch (error) {
    console.error('Gagal membuat PDF Rekap Komisi:', error);
    toast.dismiss(toastId);
    toast.error('Gagal mengunduh Laporan Rekap PDF.');
  }
}
