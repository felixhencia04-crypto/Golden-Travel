import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Download, Plane, Scroll, ShieldCheck, 
  ChevronDown, CheckCircle2, Clock, FolderX, AlertCircle, Check, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { filterJamaahForCurrentMitra, getScopedKey } from '../../utils/mitraStorage';

interface MitraDokumenKeberangkatanProps {
  jamaahList: any[];
  onRefresh?: () => void;
}

export default function MitraDokumenKeberangkatan({ jamaahList, onRefresh }: MitraDokumenKeberangkatanProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen to custom event when Admin updates document status
  useEffect(() => {
    const handleSync = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('mitra_jamaah_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mitra_jamaah_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const activeJamaahList = useMemo(() => {
    try {
      const stored = localStorage.getItem('mitra_jamaah_database');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = filterJamaahForCurrentMitra(parsed);
          if (filtered.length > 0) return filtered;
        }
      }

      const scopedKey = getScopedKey('mitra_saved_pax_list');
      const savedPax = localStorage.getItem(scopedKey);
      if (savedPax) {
        const parsedPax = JSON.parse(savedPax);
        if (Array.isArray(parsedPax) && parsedPax.length > 0) {
          return parsedPax.filter(j => j.userName && j.userName.trim() !== '');
        }
      }
    } catch (e) {}

    if (jamaahList && jamaahList.length > 0) {
      return filterJamaahForCurrentMitra(jamaahList);
    }

    return [];
  }, [jamaahList, refreshTrigger]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedJamaah = activeJamaahList[selectedIndex] || activeJamaahList[0];

  // Helper to extract normalize 3 documents: Tiket, Visa, Polis
  const getJamaahIssuedDocs = (j: any) => {
    if (!j) return { tiket: false, visa: false, polis: false };
    const docs = j.issuedDocs || {};
    return {
      tiket: docs.tiket ?? docs.tiketPesawat ?? true,
      visa: docs.visa ?? docs.visaUmroh ?? true,
      polis: docs.polis ?? docs.polisAsuransi ?? true,
    };
  };

  const issuedStatus = getJamaahIssuedDocs(selectedJamaah);

  // --- PDF GENERATORS FOR THE 3 DOCUMENTS --- //

  // 1. E-Tiket Flight PDF
  const generateTiketPDF = (j: any) => {
    if (!j) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("SAUDIA AIRLINES & GARUDA INDONESIA", 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Official Electronic Flight Ticket / E-Tiket Penerbangan Ibadah Umrah", 14, 19);
    doc.text("PT. Golden Tour Haramain | PPIU / PIHK Official Flight Services", 14, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(245, 158, 11);
    doc.text("CONFIRMED / ISSUED", pageWidth - 14, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`PNR / Kode Booking: SV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, pageWidth - 14, 19, { align: "right" });
    doc.text(`Tanggal Terbit: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 24, { align: "right" });

    doc.setFillColor(217, 119, 6);
    doc.rect(0, 32, pageWidth, 2, 'F');

    // Passenger Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, pageWidth - 28, 26, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`NAMA PENUMPANG : ${(j.userName || 'JEMAAH').toUpperCase()}`, 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIK: ${j.nik || '-'}`, 20, 54);
    doc.text(`Nomor Paspor: ${j.passportNumber || j.noPaspor || 'A-8921731'}`, 20, 59);

    doc.text(`Paket Umroh: ${j.packageName || 'Paket Executive Barokah'}`, 120, 54);
    doc.text(`Mitra Penanggung Jawab: ${j.mitraName || 'Mitra Travel'}`, 120, 59);

    // Flight Table
    autoTable(doc, {
      startY: 72,
      margin: { left: 14, right: 14 },
      head: [['RUTE PENERBANGAN', 'MASKAPAI & FLIGHT NO.', 'KEBERANGKATAN', 'TIBAM DI DESTINASI', 'KELAS & BAGASI']],
      body: [
        [
          'JAKARTA (CGK)\n➔ JEDDAH (JED)',
          'Saudia Airlines\nSV-819 (Direct Flight)',
          '10 Sep 2026\nPukul 11.30 WIB',
          '10 Sep 2026\nPukul 17.20 AST',
          'Economy Executive\nBagasi 2x23 KG'
        ],
        [
          'MADINAH (MED)\n➔ JAKARTA (CGK)',
          'Saudia Airlines\nSV-818 (Direct Flight)',
          '22 Sep 2026\nPukul 21.00 AST',
          '23 Sep 2026\nPukul 10.15 WIB',
          'Economy Executive\nBagasi 2x23 KG + Air Zamzam 5L'
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 4, valign: 'middle' },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Catatan penting
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(14, finalY + 8, pageWidth - 28, 18, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text("PETUNJUK KETENTUAN PENERBANGAN:", 18, finalY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text("1. Mohon hadir di Bandara Soekarno-Hatta Terminal 3 Internasional 4 jam sebelum jadwal keberangkatan.", 18, finalY + 18);
    doc.text("2. Tunjukkan e-tiket ini bersama Paspor Asli yang masih berlaku minimal 6 bulan saat proses Check-in Counter.", 18, finalY + 22);

    doc.save(`E_Tiket_Flight_${(j.userName || 'Jamaah').replace(/\s+/g, '_')}.pdf`);
    toast.success(`E-Tiket Flight untuk ${j.userName} berhasil diunduh (PDF)!`);
  };

  // 2. E-Visa Umrah PDF
  const generateVisaPDF = (j: any) => {
    if (!j) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner (Green KSA)
    doc.setFillColor(22, 101, 52); // green-800
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("KINGDOM OF SAUDI ARABIA - MINISTRY OF HAJJ & UMRAH", 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Electronic Visa / Visa Elektronik Resmi Ibadah Umrah", 14, 19);
    doc.text("Sistem Pengesahan Dokumentasi Kerajaan Arab Saudi & Kemenag RI", 14, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("VISA APPROVED", pageWidth - 14, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`No. Visa: 8092${Math.floor(100000 + Math.random() * 900000)}`, pageWidth - 14, 19, { align: "right" });
    doc.text(`Berlaku s/d: 10 Des 2026`, pageWidth - 14, 24, { align: "right" });

    doc.setFillColor(217, 119, 6);
    doc.rect(0, 32, pageWidth, 2, 'F');

    // Details Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, pageWidth - 28, 30, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`PILGRIM FULL NAME : ${(j.userName || 'JEMAAH').toUpperCase()}`, 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nationality: INDONESIA (IDN)`, 20, 54);
    doc.text(`Passport No: ${j.passportNumber || j.noPaspor || 'A-8921731'}`, 20, 59);
    doc.text(`Gender: ${(j.jenisKelamin || j.gender || '').toString().toLowerCase().includes('p') ? 'FEMALE' : 'MALE'}`, 20, 64);

    doc.text(`Sponsor / PPIU: PT. GOLDEN TOUR HARAMAIN`, 115, 54);
    doc.text(`Visa Type: UMRAH ENTRY VISA (MULTIPLE)`, 115, 59);
    doc.text(`Duration of Stay: 30 DAYS`, 115, 64);

    autoTable(doc, {
      startY: 76,
      margin: { left: 14, right: 14 },
      head: [['PARAMETER DOKUMEN', 'KETERANGAN RESMI VERIFIKASI']],
      body: [
        ['Status Otentikasi', 'VERIFIED & REGISTERED AT KSA PORTAL'],
        ['Nomor Registrasi MOFA', `MOFA-KSA-${Date.now().toString().slice(-8)}`],
        ['Provider Umrah KSA', 'AL-HARAMAIN EXPRESS FOR UMRAH SERVICES'],
        ['Asuransi Kesehatan KSA', 'COVERED BY TAWUNIYA INSURANCE (COVID & ALL MEDICAL)'],
        ['Port of Entry', 'JEDDAH (JED) / MADINAH (MED) AIRPORT'],
        ['Mitra Penyelenggara', j.mitraName || 'Mitra Penanggung Jawab']
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3.5 }
    });

    doc.save(`E_Visa_Umrah_${(j.userName || 'Jamaah').replace(/\s+/g, '_')}.pdf`);
    toast.success(`E-Visa Umrah untuk ${j.userName} berhasil diunduh (PDF)!`);
  };

  // 3. Polis Asuransi Perjalanan PDF
  const generatePolisPDF = (j: any) => {
    if (!j) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner (Teal / Emerald)
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("POLIS ASURANSI PERJALANAN IBADAH SYARIAH", 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Proteksi Kesehatan, Jiwa, Keselamatan & Bagasi Jamaah Umrah & Haji", 14, 19);
    doc.text("PT. Asuransi Jiwa Syariah Indonesia & PT. Golden Tour Haramain", 14, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(254, 240, 138);
    doc.text("ACTIVE COVERAGE", pageWidth - 14, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`No. Polis: AS-SYR-${Date.now().toString().slice(-6)}`, pageWidth - 14, 19, { align: "right" });
    doc.text(`Periode Cover: 30 Hari Perjalanan`, pageWidth - 14, 24, { align: "right" });

    doc.setFillColor(217, 119, 6);
    doc.rect(0, 32, pageWidth, 2, 'F');

    // Jamaah Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 40, pageWidth - 28, 24, 3, 3, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`NAMA TERANGGUNG : ${(j.userName || 'JEMAAH').toUpperCase()}`, 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIK Jamaah: ${j.nik || '-'}`, 20, 54);
    doc.text(`Paket Umroh: ${j.packageName || 'Paket Executive Barokah'}`, 20, 59);

    doc.text(`Mitra Penanggung Jawab: ${j.mitraName || 'Mitra Travel'}`, 115, 54);
    doc.text(`Status Proteksi: FULL COVERED (RUMAH SAKIT SAUDI)`, 115, 59);

    autoTable(doc, {
      startY: 70,
      margin: { left: 14, right: 14 },
      head: [['JENIS MANFAAT PROTEKSI SYARIAH', 'NILAI PERTANGGUNGAN MAX', 'KETERANGAN BANTUAN']],
      body: [
        ['Biaya Perawatan Medis & Rawat Inap RS Saudi', 'USD 100,000 (Full Cover)', 'Bantuan darurat di Makkah, Madinah & Jeddah'],
        ['Evakuasi Medis Darurat & Ambulans', 'USD 50,000', 'Layanan transportasi medis antar kota Saudi'],
        ['Santunan Meninggal Dunia / Kecelakaan', 'Rp 100,000,000', 'Santunan jiwa kepada ahli waris jamaah'],
        ['Kerusakan / Kehilangan Bagasi Koper', 'Rp 10,000,000', 'Penggantian barang sesuai ketentuan klaim'],
        ['Keterlambatan Penerbangan (>6 Jam)', 'Rp 3,000,000', 'Kompensasi akomodasi darurat bandara']
      ],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3.5 }
    });

    doc.save(`Polis_Asuransi_${(j.userName || 'Jamaah').replace(/\s+/g, '_')}.pdf`);
    toast.success(`Polis Asuransi untuk ${j.userName} berhasil diunduh (PDF)!`);
  };

  const handleDownloadSingle = (docType: 'tiket' | 'visa' | 'polis', isApproved: boolean) => {
    if (!selectedJamaah) return;
    if (!isApproved) {
      toast.warning(`Dokumen ini belum disetujui/diterbitkan oleh Admin untuk ${selectedJamaah.userName}. Mohon hubungi Admin.`);
      return;
    }

    // Check if Admin uploaded a custom PDF file for this document slot
    const uploadedFile = selectedJamaah.docFiles?.[docType];
    if (uploadedFile && uploadedFile.data) {
      try {
        const link = document.createElement('a');
        link.href = uploadedFile.data;
        link.download = uploadedFile.name || `${docType.toUpperCase()}_${(selectedJamaah.userName || 'Jamaah').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Berhasil mengunduh file PDF "${uploadedFile.name}" dari Admin!`);
        return;
      } catch (err) {
        toast.error('Gagal membuka file PDF upload. Mencoba template bawaan...');
      }
    }

    // Fallback to generated PDF template
    if (docType === 'tiket') generateTiketPDF(selectedJamaah);
    else if (docType === 'visa') generateVisaPDF(selectedJamaah);
    else if (docType === 'polis') generatePolisPDF(selectedJamaah);
  };

  const handleDownloadAll = () => {
    if (!selectedJamaah) return;
    
    let count = 0;
    if (issuedStatus.tiket) { generateTiketPDF(selectedJamaah); count++; }
    if (issuedStatus.visa) { generateVisaPDF(selectedJamaah); count++; }
    if (issuedStatus.polis) { generatePolisPDF(selectedJamaah); count++; }

    if (count === 0) {
      toast.error(`Belum ada dokumen yang disetujui/diterbitkan Admin untuk ${selectedJamaah.userName}.`);
    } else {
      toast.success(`Berhasil mengunduh ${count} dokumen keberangkatan untuk ${selectedJamaah.userName}!`);
    }
  };

  if (activeJamaahList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto mt-8">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200 shadow-inner">
          <FolderX className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 font-playfair">Belum Ada Dokumen Keberangkatan</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Belum ada calon jemaah terdaftar pada akun Mitra Anda. Silakan daftarkan calon jemaah terlebih dahulu melalui menu <span className="font-bold text-slate-800">Biodata Calon Jemaah</span>.
          </p>
        </div>
      </div>
    );
  }

  // Define the 3 required documents
  const docsList = [
    {
      key: 'tiket' as const,
      title: 'Tiket',
      fullTitle: 'E-Tiket Flight Saudia / Garuda',
      type: 'Tiket Pesawat PP',
      desc: 'Jakarta (CGK) ➔ Jeddah (JED) & Madinah (MED) ➔ Jakarta (CGK)',
      icon: Plane,
      isApproved: issuedStatus.tiket,
    },
    {
      key: 'visa' as const,
      title: 'Visa',
      fullTitle: 'E-Visa Umrah KSA Ministry',
      type: 'Visa Resmi Arab Saudi',
      desc: 'Visa Ibadah Umrah Multiple Entry • KSA Ministry Approved',
      icon: Scroll,
      isApproved: issuedStatus.visa,
    },
    {
      key: 'polis' as const,
      title: 'Polis',
      fullTitle: 'Polis Asuransi Perjalanan Syariah',
      type: 'Asuransi Jiwa & Kesehatan',
      desc: 'Proteksi Rawat Inap RS Saudi, Bagasi & Kecelakaan Syariah',
      icon: ShieldCheck,
      isApproved: issuedStatus.polis,
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Jamaah Selector & Bulk Download */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Calon Jemaah Binaan</div>
            <div className="relative mt-1">
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="w-full md:w-80 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:border-emerald-600 transition-all appearance-none cursor-pointer pr-10"
              >
                {activeJamaahList.map((j, idx) => (
                  <option key={j.id || idx} value={idx}>
                    {j.userName || j.name || `Jamaah ${idx + 1}`} ({j.packageName || 'Paket Ibadah'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadAll}
          className="px-6 py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-black text-xs transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" /> Unduh Dokumen Disetujui (PDF)
        </button>
      </div>

      {/* SLEEK DARK NAVY PILL BAR MATCHING USER REQUEST SCREENSHOT */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl md:rounded-full p-2.5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
          
          {/* Item 1: Tiket */}
          <div className="flex items-center gap-2 bg-[#0f1d2a] border border-emerald-900/60 rounded-xl md:rounded-full p-2.5 px-4 justify-between transition-all hover:border-emerald-500/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <Plane className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-100 truncate">Tiket</span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                issuedStatus.tiket ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'
              }`} />
            </div>
            <button
              onClick={() => handleDownloadSingle('tiket', issuedStatus.tiket)}
              disabled={!issuedStatus.tiket}
              className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                issuedStatus.tiket
                  ? 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border-emerald-700/60 hover:text-white'
                  : 'bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed'
              }`}
              title={issuedStatus.tiket ? "Unduh E-Tiket PDF" : "Menunggu persetujuan admin"}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Item 2: Visa */}
          <div className="flex items-center gap-2 bg-[#0f1d2a] border border-emerald-900/60 rounded-xl md:rounded-full p-2.5 px-4 justify-between transition-all hover:border-emerald-500/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-100 truncate">Visa</span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                issuedStatus.visa ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'
              }`} />
            </div>
            <button
              onClick={() => handleDownloadSingle('visa', issuedStatus.visa)}
              disabled={!issuedStatus.visa}
              className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                issuedStatus.visa
                  ? 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border-emerald-700/60 hover:text-white'
                  : 'bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed'
              }`}
              title={issuedStatus.visa ? "Unduh E-Visa PDF" : "Menunggu persetujuan admin"}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Item 3: Polis */}
          <div className="flex items-center gap-2 bg-[#0f1d2a] border border-emerald-900/60 rounded-xl md:rounded-full p-2.5 px-4 justify-between transition-all hover:border-emerald-500/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <Scroll className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-100 truncate">Polis</span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                issuedStatus.polis ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'
              }`} />
            </div>
            <button
              onClick={() => handleDownloadSingle('polis', issuedStatus.polis)}
              disabled={!issuedStatus.polis}
              className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                issuedStatus.polis
                  ? 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border-emerald-700/60 hover:text-white'
                  : 'bg-slate-800/40 text-slate-600 border-slate-700/40 cursor-not-allowed'
              }`}
              title={issuedStatus.polis ? "Unduh Polis PDF" : "Menunggu persetujuan admin"}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* DETAILED DOCUMENTS GRID FOR THE 3 ITEMS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {docsList.map((doc) => {
          const IconComponent = doc.icon;
          return (
            <div 
              key={doc.key}
              className={`bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 ${
                doc.isApproved ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-2xl border ${
                    doc.isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  {doc.isApproved ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 bg-emerald-100 text-emerald-800 border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DISERETUJUI / TERBIT
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> PROSES ADMIN
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.type}</div>
                <h3 className="font-playfair font-bold text-slate-900 text-base mt-0.5">{doc.fullTitle}</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{doc.desc}</p>

                {/* Uploaded File Indicator if uploaded by Admin */}
                {selectedJamaah?.docFiles?.[doc.key] ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">📄</span>
                      <div className="truncate">
                        <div className="font-bold truncate">{selectedJamaah.docFiles[doc.key].name}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Di-upload Admin • {selectedJamaah.docFiles[doc.key].size}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400">
                  {doc.isApproved ? 'Status: Siap Diunduh' : 'Status: Menunggu Approve'}
                </span>
                
                <button
                  onClick={() => handleDownloadSingle(doc.key, doc.isApproved)}
                  disabled={!doc.isApproved}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    doc.isApproved
                      ? 'bg-emerald-900 hover:bg-emerald-800 text-amber-300'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Unduh PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
