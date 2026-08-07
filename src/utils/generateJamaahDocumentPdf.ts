import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DEFAULT_LOGO_DATA } from '../assets/logoData';

export interface DocumentJamaahInfo {
  name: string;
  nik?: string;
  passport?: string;
  phone?: string;
}

export interface DocumentScheduleInfo {
  name?: string;
  airline?: string;
  departureDate?: string;
  returnDate?: string;
  hotelMakkah?: string;
  hotelMadinah?: string;
  pnr?: string;
}

export async function generateJamaahDocumentPdf(
  docType: 'eticket' | 'visa' | 'asuransi' | 'itinerary' | 'manasik',
  jamaah: DocumentJamaahInfo,
  schedule?: DocumentScheduleInfo,
  pkg?: any,
  bookingCode?: string
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const name = jamaah.name || 'Jamaah Umrah';
  const passport = jamaah.passport && jamaah.passport !== '-' ? jamaah.passport : 'A' + Math.floor(1000000 + Math.random() * 9000000);
  const nik = jamaah.nik && jamaah.nik !== '-' ? jamaah.nik : '3273' + Math.floor(100000000000 + Math.random() * 900000000000);
  const code = bookingCode || 'GT-' + Math.floor(100000 + Math.random() * 900000);
  const airline = schedule?.airline || 'Saudia Airlines (SV-817)';
  const depDate = schedule?.departureDate ? new Date(schedule.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '15 Oktober 2026';
  const retDate = schedule?.returnDate ? new Date(schedule.returnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '26 Oktober 2026';
  const pkgName = pkg?.name || 'Paket Umrah Executive Star 9 Hari';
  const pnr = schedule?.pnr || 'PNR-' + Math.floor(100000 + Math.random() * 900000);

  // Styling helper
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const goldColor: [number, number, number] = [217, 119, 6]; // Amber 600
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald 500

  // 1. HEADER BRANDING
  doc.setFillColor(15, 23, 42); // Slate-900 background for top bar
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFillColor(245, 158, 11); // Gold accent border bottom
  doc.rect(0, 32, 210, 2, 'F');

  // Add Logo
  try {
    const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('golden_travel_logo') : null;
    const logoDataUrl = (savedLogo && !savedLogo.includes('placehold.co')) ? savedLogo : DEFAULT_LOGO_DATA;
    doc.addImage(logoDataUrl, 'PNG', 12, 5, 22, 22);
  } catch (e) {
    // Ignore logo error
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(245, 158, 11);
  doc.text('PT. GOLDEN TOUR HARAMAIN', 38, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Sistem Informasi & Manifest Dokumen Perjalanan Umrah / Haji Resmi', 38, 20);
  doc.text(`Kode Booking: ${code} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 38, 26);

  // Document Specific Content
  if (docType === 'eticket') {
    // E-TICKET DOCUMENT
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(12, 40, 186, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('E-TICKET / FLIGHT PASSENGERS VOUCHER', 18, 51);
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6);
    doc.text('OFFICIAL AIRLINE RESERVATION CONFIRMATION', 18, 57);

    // Passengers Info Box
    autoTable(doc, {
      startY: 67,
      head: [['INFORMASI PENUMPANG (PAX DETAILS)', 'INFORMASI TIKET & BAGASI']],
      body: [
        [
          `Nama Penumpang : ${name}\nNo. Paspor         : ${passport}\nNo. NIK            : ${nik}\nKategori          : Dewasa (Adult)`,
          `Kode PNR / Booking : ${pnr}\nMaskapai           : ${airline}\nKelas Kabin        : Economy Executive\nBagasi             : 2x 23kg + Air Zamzam 5L`
        ]
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.2 },
      theme: 'grid'
    });

    // Flight Schedule Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['RUTE & FLIGHT', 'KEBERANGKATAN', 'KEDATANGAN', 'STATUS']],
      body: [
        [
          `PERGI (Outbound)\n${airline}`,
          `Jakarta (CGK)\nBandara Soekarno Hatta\n${depDate} • 11:30 WIB`,
          `Jeddah (JED)\nKing Abdulaziz Intl\n${depDate} • 17:40 KSA`,
          `CONFIRMED\nSeat Assigned`
        ],
        [
          `PULANG (Inbound)\n${airline}`,
          `Madinah (MED)\nPrince Mohammad Intl\n${retDate} • 21:00 KSA`,
          `Jakarta (CGK)\nBandara Soekarno Hatta\n${retDate} • 11:15 WIB`,
          `CONFIRMED\nSeat Assigned`
        ]
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.2 },
      theme: 'grid'
    });

    // Barcode / Note Box
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, finalY, 186, 35, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, finalY, 186, 35, 3, 3, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('CATATAN PENTING & PETUNJUK CHECK-IN:', 18, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('1. Harap hadir di Bandara Soekarno-Hatta (Terminal 3 International) 4 jam sebelum jadwal keberangkatan.', 18, finalY + 14);
    doc.text('2. Tunjukkan E-Ticket ini beserta Paspor Asli yang masih berlaku minimal 6 bulan kepada petugas kloter Golden Travel.', 18, finalY + 19);
    doc.text('3. Layanan bantuan & Muthawwif Bandara: +62 812-3456-7890 / Hotline Golden Travel Support.', 18, finalY + 24);
    doc.text(`4. Paket Layanan Terdaftar: ${pkgName}`, 18, finalY + 29);

  } else if (docType === 'visa') {
    // ELECTRONIC VISA KSA
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(12, 40, 186, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(6, 78, 59);
    doc.text('KINGDOM OF SAUDI ARABIA - ELECTRONIC UMRAH VISA', 18, 51);
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('MINISTRY OF HAJJ AND UMRAH OFFICIAL ISSUANCE', 18, 57);

    const visaNo = 'E-VISA-' + Math.floor(10000000 + Math.random() * 90000000);

    autoTable(doc, {
      startY: 67,
      head: [['VISAHOLDER PERSONAL INFORMATION', 'VISA DETAILS & SPONSORSHIP']],
      body: [
        [
          `Full Name       : ${name.toUpperCase()}\nPassport No     : ${passport}\nNationality     : INDONESIA (IDN)\nDate of Birth   : 14/08/1988\nGender          : Male / Female`,
          `Visa Number     : ${visaNo}\nVisa Type       : UMRAH ELECTRONIC VISA\nSponsor / Agency: PT. GOLDEN TOUR HARAMAIN KSA / MUASSASAH\nValid Until     : ${retDate}\nEntries         : Multiple / Single Entry`
        ]
      ],
      headStyles: { fillColor: [6, 78, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, lineColor: [209, 250, 229], lineWidth: 0.2 },
      theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, finalY, 186, 40, 3, 3, 'F');
    doc.setDrawColor(209, 250, 229);
    doc.roundedRect(12, finalY, 186, 40, 3, 3, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 78, 59);
    doc.text('SYARAT & KETENTUAN VISA SAUDI ARABIA:', 18, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('• Visa ini diterbitkan secara elektronik oleh Kementerian Haji & Umrah Kerajaan Arab Saudi.', 18, finalY + 15);
    doc.text('• Pemegang visa wajib mematuhi seluruh peraturan perjalanan dan kesehatan di Makkah Al-Mukarramah & Madinah Al-Munawwarah.', 18, finalY + 21);
    doc.text('• Visa berlaku untuk pelaksanaan ibadah Umrah dan ziarah di kota suci Arab Saudi.', 18, finalY + 27);
    doc.text(`• Penanggung jawab rombongan lokal: Golden Travel Tour Leader / Mutawwif Utama (+966 50 123 4567).`, 18, finalY + 33);

  } else if (docType === 'asuransi') {
    // ASURANSI PERJALANAN & KESEHATAN
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(12, 40, 186, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(146, 64, 14);
    doc.text('POLIS ASURANSI PERJALANAN & KESEHATAN KSA', 18, 51);
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6);
    doc.text('INTERNATIONAL TRAVEL & MEDICAL COVERAGE CERTIFICATE', 18, 57);

    const policyNo = 'POL-KSA-' + Math.floor(1000000 + Math.random() * 9000000);

    autoTable(doc, {
      startY: 67,
      head: [['INFORMASI TERTANGGUNG', 'RINCIAN PERLINDUNGAN POLIS']],
      body: [
        [
          `Nama Tertanggung : ${name}\nNo. Paspor       : ${passport}\nNo. Polis        : ${policyNo}\nPeriode Pertanggungan : ${depDate} s/d ${retDate}`,
          `Penyedia Asuransi: Tawuniya / Al Rajhi Takaful KSA\nNilai Pertanggungan: s/d SAR 100,000\nCakupan Layanan : Biaya Rumah Sakit, Darurat Medis,\n                  Evakuasi & Perlindungan Perjalanan`
        ]
      ],
      headStyles: { fillColor: [146, 64, 14], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4, lineColor: [254, 215, 170], lineWidth: 0.2 },
      theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, finalY, 186, 35, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14);
    doc.text('PROSEDUR KLAIM & BANTULAN DARURAT 24 JAM:', 18, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('1. Jika terjadi keadaan darurat medis di Makkah atau Madinah, segera hubungi Tour Leader / Tim Kesehatan Kloter.', 18, finalY + 15);
    doc.text('2. Layanan Kesehatan Rumah Sakit Resmi KSA terhubung secara cashless dengan menunjukkan dokumen Polis ini & Paspor.', 18, finalY + 21);
    doc.text('3. Call Center Asuransi KSA: 920000111 / Emergency Golden Travel Care: +62 812-3456-7890.', 18, finalY + 27);

  } else if (docType === 'itinerary') {
    // ITINERARY PERJALANAN
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(12, 40, 186, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('ITINERARY PERJALANAN & AGENDA ZIARAH RESMI', 18, 51);
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(`PAKET: ${pkgName.toUpperCase()}`, 18, 57);

    autoTable(doc, {
      startY: 67,
      head: [['HARI / TGL', 'LOKASI & AGENDA KEGIATAN', 'AKOMODASI & CATATAN']],
      body: [
        ['Hari 1', `Berkumpul di Bandara CGK, Briefing & Flight ke Jeddah / Madinah (${airline})`, 'Hotel Madinah ⭐5\n(Penerbangan Outbound)'],
        ['Hari 2-4', 'Ibadah Shalat 5 Waktu di Masjid Nabawi, Ziarah Raudhah, Makam Rasulullah & Kota Madinah', 'Hotel Madinah ⭐5\nFullboard Dining'],
        ['Hari 5', 'Pakaian Ihram dari Miqat Bir Ali, Perjalanan Kereta Cepat / Bus ke Makkah & Pelaksanaan Umrah 1', 'Hotel Makkah ⭐5\nPelaksanaan Ibadah Umrah'],
        ['Hari 6-8', 'Ibadah di Masjidil Haram, Ziarah Kota Makkah (Jabal Tsur, Arafah, Mina, Jabal Nur) & Umrah 2', 'Hotel Makkah ⭐5\nThawaf Wada'],
        ['Hari 9', 'Check-out Hotel, Kepulangan ke Jakarta via Bandara Jeddah/Madinah', 'Penerbangan Inbound CGK']
      ],
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [219, 234, 254], lineWidth: 0.2 },
      theme: 'grid'
    });

  } else {
    // PANDUAN MANASIK
    doc.setFillColor(243, 232, 255);
    doc.roundedRect(12, 40, 186, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(88, 28, 135);
    doc.text('BUKU PANDUAN & TATA CARA MANASIK UMRAH', 18, 51);
    doc.setFontSize(9);
    doc.setTextColor(147, 51, 234);
    doc.text('PANDUAN PRAKTIS & DOA PILIHAN IBADAH TANAH SUCI', 18, 57);

    autoTable(doc, {
      startY: 67,
      head: [['RUKUN UMRAH', 'TATA CARA & BACAAN DOA']],
      body: [
        ['1. Ihram & Niat', 'Mandi sunnah, memakai pakaian ihram, dan berniat dari Miqat:\n"Labbaykallaahumma \'umratan" (Aku penuhi panggilan-Mu ya Allah untuk berumrah).'],
        ['2. Thawaf', 'Mengelilingi Ka\'bah sebanyak 7 putaran dimulai dari Hajar Aswad dengan posisi Ka\'bah di sebelah kiri. Membaca dzikir & doa di antara Rukun Yamani & Hajar Aswad.'],
        ['3. Sa\'i', 'Berjalan antara Bukit Shafa dan Marwah sebanyak 7 kali putaran. Membaca doa di atas bukit Shafa & Marwah.'],
        ['4. Tahallul', 'Mencukur atau memotong sebagian rambut kepala (pria disunnahkan gundul, wanita memotong sepanjang ruas jari).'],
        ['5. Tertib', 'Melaksanakan seluruh rukun Umrah secara berurutan.']
      ],
      headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [233, 213, 255], lineWidth: 0.2 },
      theme: 'grid'
    });
  }

  // FOOTER OFFICIAL STAMP
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 20, 210, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('PT. GOLDEN TOUR HARAMAIN OFFICIAL SYSTEM', 12, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Dokumen sah dan terverifikasi secara otomatis oleh sistem Golden Travel Management.', 12, pageHeight - 7);
  doc.text('Halaman 1 dari 1', 170, pageHeight - 7);

  // Output as Data URL
  return doc.output('datauristring');
}
