import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface MitraUserExport {
  id: string;
  name: string;
  email: string;
  noWa: string;
  statusAkun: string;
  createdAt: string;
  profile?: {
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    alamatLengkap?: string;
    namaBank?: string;
    noRekening?: string;
    namaPemilikRekening?: string;
    namaLengkap?: string;
    npwp?: string;
    jenisKelamin?: string;
    statusPerkawinan?: string;
    pekerjaan?: string;
    provinsi?: string;
    kota?: string;
    kecamatan?: string;
    kodePos?: string;
    reviewNotes?: string;
  };
  documents?: {
    id: string;
    documentType: 'foto_ktp' | 'selfie_ktp' | 'npwp' | 'buku_tabungan' | 'bukti_transfer';
    fileUrl: string;
    status: string;
  }[];
}

// Convert image URL or Base64 to Blob
const fetchImageBlob = async (url: string): Promise<{ blob: Blob; extension: string }> => {
  if (url.startsWith('data:')) {
    const mimeMatch = url.match(/data:(.*?);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mime.split('/')[1] || 'jpg';
    
    const base64Data = url.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return { blob: new Blob([byteArray], { type: mime }), extension: ext };
  }

  const response = await fetch(url);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  return { blob, extension: ext };
};

/**
 * Generate & Download complete PDF for Mitra (Identitas, Legalitas, & Rekening Komisi)
 */
export const exportMitraToPdf = (mitra: MitraUserExport) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [6, 78, 59]; // Emerald 900 #064e3b
  const goldColor: [number, number, number] = [212, 175, 55]; // Gold #D4AF37
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate 800

  const name = mitra.profile?.namaLengkap || mitra.name || 'Mitra Golden Travel';
  const profile = mitra.profile || {};

  // --- Header Banner ---
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold accent bar
  doc.setFillColor(...goldColor);
  doc.rect(0, 36, 210, 2, 'F');

  // Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PT GOLDEN TOUR HARAMAIN', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(243, 229, 171); // Light Gold
  doc.text('BERKAS DOKUMEN BIODATA, LEGALITAS & REKENING KOMISI MITRA AGEN', 14, 22);

  doc.setFontSize(8);
  doc.setTextColor(200, 225, 215);
  doc.text(`ID Registrasi: ${mitra.id}  |  Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 29);

  // Status Badge on Header
  const statusLabel = mitra.statusAkun === 'active' 
    ? 'TERVERIFIKASI (AKTIF)' 
    : mitra.statusAkun === 'pending_verification' 
    ? 'MENUNGGU VERIFIKASI' 
    : mitra.statusAkun === 'rejected'
    ? 'DITOLAK'
    : 'BELUM LENGKAP';

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${statusLabel}`, 196, 20, { align: 'right' });

  let currentY = 46;

  // Title Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`DATA PROFIL MITRA: ${name.toUpperCase()}`, 14, currentY);
  currentY += 6;

  // --- 1. DATA IDENTITAS & LEGALITAS ---
  autoTable(doc, {
    startY: currentY,
    head: [[{ content: '1. DATA IDENTITAS & LEGALITAS MITRA', colSpan: 2, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } }]],
    body: [
      ['Nama Lengkap (Sesuai KTP)', name],
      ['Nomor Induk Kependudukan (NIK)', profile.nik || '-'],
      ['Nomor Pokok Wajib Pajak (NPWP)', profile.npwp || '-'],
      ['Tempat, Tanggal Lahir', `${profile.tempatLahir || '-'}, ${profile.tanggalLahir || '-'}`],
      ['Jenis Kelamin', profile.jenisKelamin || '-'],
      ['Status Perkawinan', profile.statusPerkawinan || '-'],
      ['Pekerjaan Saat Ini', profile.pekerjaan || '-'],
      ['Email Terdaftar', mitra.email || '-'],
      ['Nomor WhatsApp', mitra.noWa || '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', textColor: darkTextColor, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto', textColor: darkTextColor }
    },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- 2. ALAMAT & DOMISILI ---
  autoTable(doc, {
    startY: currentY,
    head: [[{ content: '2. ALAMAT & LOKASI DOMISILI MITRA', colSpan: 2, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } }]],
    body: [
      ['Provinsi', profile.provinsi || '-'],
      ['Kota / Kabupaten', profile.kota || '-'],
      ['Kecamatan', profile.kecamatan || '-'],
      ['Kode Pos', profile.kodePos || '-'],
      ['Alamat Lengkap (KTP)', profile.alamatLengkap || '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', textColor: darkTextColor, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto', textColor: darkTextColor }
    },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- 3. REKENING PEMBAYARAN KOMISI ---
  autoTable(doc, {
    startY: currentY,
    head: [[{ content: '3. REKENING PEMBAYARAN KOMISI & BONUS MITRA', colSpan: 2, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } }]],
    body: [
      ['Nama Bank Penerbit', profile.namaBank || '-'],
      ['Nomor Rekening Bank', profile.noRekening || '-'],
      ['Nama Pemilik Rekening', profile.namaPemilikRekening || profile.namaLengkap || name || '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', textColor: darkTextColor, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto', textColor: darkTextColor }
    },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- 4. STATUS LAMPIRAN BERKAS ---
  const docTypesMap: Record<string, string> = {
    foto_ktp: 'Foto KTP Asli',
    selfie_ktp: 'Selfie Memegang KTP',
    npwp: 'Kartu NPWP',
    buku_tabungan: 'Halaman Depan Buku Tabungan',
    bukti_transfer: 'Bukti Transfer Administrasi (Rp 350.000)'
  };

  const docRows = (mitra.documents || []).map(d => [
    docTypesMap[d.documentType] || d.documentType,
    d.status === 'verified' ? 'Telah Diunggah & Terverifikasi' : 'Telah Diunggah (Pending)',
    'Tersedia di Sistem Storage'
  ]);

  if (docRows.length === 0) {
    docRows.push(['Lampiran Berkas', 'Belum Diunggah', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [
      [{ content: '4. LAMPIRAN BERKAS & DOKUMEN LEGALITAS', colSpan: 3, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 } }],
      ['Jenis Dokumen', 'Status Upload', 'Keterangan']
    ],
    body: docRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Prevent overlap if near bottom page margin
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // --- 5. VERIFICATION & FOOTER SIGNATURE ---
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 38, 3, 3, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('CATATAN / EVALUASI VERIFIKATOR ADMIN:', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const noteText = profile.reviewNotes || 'Dokumen dan identitas telah diperiksa sesuai dengan ketentuan keagenan PT Golden Tour Haramain.';
  doc.text(doc.splitTextToSize(noteText, 174), 18, currentY + 13);

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkTextColor);
  doc.text('Diperiksa Oleh:', 25, currentY + 28);
  doc.text('Disetujui Oleh:', 130, currentY + 28);

  doc.setFont('helvetica', 'normal');
  doc.text('Tim Compliance & Legal', 25, currentY + 33);
  doc.text('Head of Agency / Partnership', 130, currentY + 33);

  // Footer note on bottom of every page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Dokumen ini dicetak secara otomatis dari Sistem Admin PT Golden Tour Haramain. Keabsahan data sesuai rekaman database resmi. Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  // Trigger Save
  const cleanFilename = name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Data_Identitas_Rekening_Mitra_${cleanFilename}.pdf`);
};

/**
 * Generate & Download ZIP archive containing all document images
 */
export const exportMitraDocumentsZip = async (mitra: MitraUserExport): Promise<number> => {
  const zip = new JSZip();

  const name = mitra.profile?.namaLengkap || mitra.name || 'Mitra';
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const profile = mitra.profile || {};

  // 1. Add Summary Text File
  const summaryContent = `=====================================================
BERKAS LAMPIRAN & LEGALITAS MITRA AGEN
PT GOLDEN TOUR HARAMAIN
=====================================================
ID Registrasi       : ${mitra.id}
Nama Lengkap        : ${name}
NIK                 : ${profile.nik || '-'}
NPWP                : ${profile.npwp || '-'}
Email               : ${mitra.email || '-'}
WhatsApp            : ${mitra.noWa || '-'}
-----------------------------------------------------
REKENING PEMBAYARAN KOMISI:
Nama Bank           : ${profile.namaBank || '-'}
Nomor Rekening      : ${profile.noRekening || '-'}
Pemilik Rekening    : ${profile.namaPemilikRekening || profile.namaLengkap || name}
-----------------------------------------------------
Status Akun         : ${mitra.statusAkun.toUpperCase()}
Tanggal Export ZIP  : ${new Date().toLocaleString('id-ID')}
=====================================================
`;

  zip.file(`00_Info_Ringkasan_Mitra_${cleanName}.txt`, summaryContent);

  const docNamesMap: Record<string, { label: string; prefix: string }> = {
    foto_ktp: { label: 'Foto_KTP', prefix: '01' },
    selfie_ktp: { label: 'Selfie_dengan_KTP', prefix: '02' },
    npwp: { label: 'Kartu_NPWP', prefix: '03' },
    buku_tabungan: { label: 'Halaman_Buku_Tabungan', prefix: '04' },
    bukti_transfer: { label: 'Bukti_Transfer_Administrasi', prefix: '05' }
  };

  const documents = mitra.documents || [];
  let addedCount = 0;

  for (const doc of documents) {
    if (!doc.fileUrl) continue;

    try {
      const { blob, extension } = await fetchImageBlob(doc.fileUrl);
      const info = docNamesMap[doc.documentType] || { label: doc.documentType, prefix: '05' };
      const filename = `${info.prefix}_${info.label}_${cleanName}.${extension}`;

      zip.file(filename, blob);
      addedCount++;
    } catch (err) {
      console.error(`Failed to load document image [${doc.documentType}]:`, err);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `Berkas_Lampiran_${cleanName}_${mitra.id.substring(0, 8)}.zip`);

  return addedCount;
};
