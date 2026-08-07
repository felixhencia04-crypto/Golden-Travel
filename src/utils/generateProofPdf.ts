import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

async function getLoadedImage(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.trim()) return resolve(null);
    let targetUrl = url.trim();

    if (targetUrl.startsWith('iVBORw')) {
      targetUrl = 'data:image/png;base64,' + targetUrl;
    } else if (targetUrl.startsWith('/9j/')) {
      targetUrl = 'data:image/jpeg;base64,' + targetUrl;
    } else if (targetUrl.startsWith('/')) {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      if (token && targetUrl.includes('/api/') && !targetUrl.includes('token=')) {
        targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'token=' + token;
      }
      targetUrl = window.location.origin + targetUrl;
    }

    // If it's a data URL image (including SVG)
    if (targetUrl.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve({
              dataUrl,
              width: canvas.width,
              height: canvas.height,
            });
            return;
          }
        } catch (err) {
          console.warn('Canvas conversion error:', err);
        }
        resolve({
          dataUrl: targetUrl,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => resolve(null);
      img.src = targetUrl;
      return;
    }

    // HTTP / HTTPS URL
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            dataUrl,
            width: canvas.width,
            height: canvas.height,
          });
          return;
        }
      } catch (err) {
        // CORS fallback
        resolve({
          dataUrl: targetUrl,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      }
    };
    img.onerror = () => resolve(null);
    img.src = targetUrl;
  });
}

export async function generateProofPdf(jamaah: any, transaction: any) {
  if (!transaction) {
    toast.error('Data transaksi tidak ditemukan');
    return;
  }

  const toastId = toast.loading('Memproses dokumen PDF bukti transfer...');

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Raw IDs and Codes
    const rawId = String(transaction.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortCode = rawId.length > 8 ? rawId.slice(0, 8) : (rawId || 'TRX888');
    const txDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    const yearMonth = `${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    const docNo = `PROOF/GTH/${yearMonth}/${shortCode}`;

    // 1. Header Banner (Dark Matcha Theme)
    doc.setFillColor(31, 58, 43); // #1F3A2B
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
    doc.text('Sistem Arsip & Verifikasi Bukti Setoran Keuangan Jamaah', 14, 27);

    // Right Header Info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BUKTI TRANSFER RESMI', pageWidth - 14, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`No. Dokumen: ${docNo}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 25, { align: 'right' });

    // 2. Status Badge Card
    const isVerified = ['approved', 'VERIFIED'].includes(transaction.status);
    const isRejected = ['rejected', 'REJECTED'].includes(transaction.status);
    
    let statusText = 'PENDING VERIFIKASI';
    let statusBg = [254, 243, 199]; // yellow
    let statusFg = [146, 64, 14];

    if (isVerified) {
      statusText = 'TERVERIFIKASI & SAH';
      statusBg = [220, 252, 231]; // green
      statusFg = [22, 101, 52];
    } else if (isRejected) {
      statusText = 'SETORAN DITOLAK';
      statusBg = [254, 226, 226]; // red
      statusFg = [153, 27, 27];
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(14, 42, pageWidth - 28, 14, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(statusFg[0], statusFg[1], statusFg[2]);
    doc.text(`STATUS VERIFIKASI: ${statusText}`, 18, 51);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID Transaksi: ${transaction.id || '-'}`, pageWidth - 18, 51, { align: 'right' });

    // 3. Payment Stage Label
    let stageLabel = 'Setoran DP 1 (Pendaftaran)';
    const pType = String(transaction.paymentType || transaction.type || 'dp1').toLowerCase();
    if (pType === 'dp2' || pType === 'cicilan') stageLabel = 'Setoran DP 2 (Booking Seat)';
    else if (pType === 'pelunasan') stageLabel = 'Pelunasan Sisa Paket';
    else if (pType === 'full' || pType === 'pelunasan_full') stageLabel = 'Pelunasan Full Paket';

    const amountNum = Number(transaction.amount || 0);
    const amountStr = `Rp ${amountNum.toLocaleString('id-ID')}`;

    // 4. Details Table
    autoTable(doc, {
      startY: 60,
      margin: { left: 14, right: 14 },
      head: [['PARAMETER TRANSAKSI', 'RINCIAN DATA SETORAN']],
      body: [
        ['Nama Jamaah', jamaah.userName || jamaah.name || 'Jamaah Umroh'],
        ['Email / No. HP', `${jamaah.userEmail || jamaah.email || '-'} / ${jamaah.phone || '-'}`],
        ['Paket Umroh', jamaah.packageName || 'Paket Umroh Reguler'],
        ['Tahap Setoran', stageLabel],
        ['Nominal Setoran', amountStr],
        ['Tanggal Waktu Transfer', txDate.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['Catatan / Alasan Admin', transaction.adminNotes || transaction.rejectionReason || 'Tidak ada catatan tambahan'],
      ],
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
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 248] },
        1: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.row.index === 4 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9.5;
          data.cell.styles.textColor = [31, 58, 43];
          data.cell.styles.fillColor = [226, 235, 229];
        }
      },
    });

    let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 120;

    // 5. Image / Evidence Preview Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 58, 43);
    doc.text('LAMPIRAN BUKTI TRANSFER ASLI', 14, currentY);

    currentY += 4;

    let proofUrl = transaction.proofUrl || 
                   transaction.proof_url || 
                   transaction.proofFile || 
                   transaction.proof_file || 
                   transaction.proof || 
                   transaction.receiptUrl || 
                   transaction.attachment || 
                   transaction.url || 
                   transaction.image;

    if (!proofUrl && transaction.id) {
      proofUrl = `/api/payments/${transaction.id}/proof`;
    }

    let loadedImg = proofUrl ? await getLoadedImage(proofUrl) : null;

    if (loadedImg && loadedImg.dataUrl) {
      // Container box dimensions
      const maxBoxW = pageWidth - 28; // 182mm
      const maxBoxH = pageHeight - currentY - 30; // remaining space minus footer margin
      const targetBoxH = Math.min(105, Math.max(70, maxBoxH));

      // Draw Frame Box
      doc.setFillColor(250, 251, 250);
      doc.setDrawColor(220, 225, 220);
      doc.roundedRect(14, currentY, maxBoxW, targetBoxH, 3, 3, 'FD');

      // Calculate aspect ratio fit
      const imgRatio = loadedImg.width / loadedImg.height;
      let renderW = maxBoxW - 8;
      let renderH = renderW / imgRatio;

      if (renderH > targetBoxH - 8) {
        renderH = targetBoxH - 8;
        renderW = renderH * imgRatio;
      }

      const renderX = 14 + (maxBoxW - renderW) / 2;
      const renderY = currentY + (targetBoxH - renderH) / 2;

      try {
        doc.addImage(loadedImg.dataUrl, 'PNG', renderX, renderY, renderW, renderH);
      } catch (imgErr) {
        console.error('Failed to embed image into PDF:', imgErr);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(120, 120, 120);
        doc.text('Bukti transfer terverifikasi digital.', 18, currentY + 15);
      }

      currentY += targetBoxH + 8;
    } else {
      // No image attached or image unavailable fallback box
      const maxBoxW = pageWidth - 28;
      const targetBoxH = 35;
      doc.setFillColor(250, 251, 250);
      doc.setDrawColor(220, 225, 220);
      doc.roundedRect(14, currentY, maxBoxW, targetBoxH, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Lampiran fisik bukti transfer tersimpan pada sistem database.', 18, currentY + 14);
      doc.text(`Tahap Setoran: ${stageLabel} • Nominal: ${amountStr}`, 18, currentY + 22);
      currentY += targetBoxH + 8;
    }

    // 6. Official Footer & Verification Stamp
    const footerY = Math.max(currentY, pageHeight - 32);

    // Footer divider
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(31, 58, 43);
    doc.text('PT. GOLDEN TOUR HARAMAIN - TIM KEUANGAN & VERIFIKASI JAMAAH', 14, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Dokumen ini merupakan bukti fisik digital yang sah dan dikeluarkan oleh sistem informasi PT. Golden Tour Haramain.', 14, footerY + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('DIGITAL VERIFIED DOCUMENT', pageWidth - 14, footerY, { align: 'right' });

    // Save File
    const nameClean = (jamaah.userName || jamaah.name || 'Jamaah').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Bukti_Transfer_${nameClean}_${shortCode}.pdf`;

    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success('Bukti transfer berhasil diunduh sebagai PDF!');
  } catch (error) {
    console.error('Gagal membuat PDF bukti transfer:', error);
    toast.dismiss(toastId);
    toast.error('Gagal mengunduh PDF bukti transfer.');
  }
}
