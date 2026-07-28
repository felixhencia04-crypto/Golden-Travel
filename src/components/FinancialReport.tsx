import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, Loader2, TrendingUp, Wallet, Banknote, 
  Calendar, Search, Filter, ArrowUpRight, FileText,
  RefreshCw, CheckCircle, ShieldCheck, Printer, User
} from 'lucide-react';
import { api } from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialReportProps {
  consultations?: any[];
  packages?: any[];
}

export default function FinancialReport({ consultations = [], packages = [] }: FinancialReportProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'dp1' | 'dp2' | 'pelunasan' | 'full'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadReports();
  }, [consultations]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch from server API
      let serverData: any[] = [];
      try {
        serverData = await api.getFinancialReport();
      } catch (err) {
        console.warn('Could not fetch server financial report, relying on prop consultations:', err);
      }

      // 2. Extract approved payments from consultations prop
      const propPayments: any[] = (consultations || []).flatMap((c: any) => {
        const pkg = (packages || []).find((p: any) => p.id === c.packageId || p.name === c.packageName);
        const basePrice = Number(pkg?.price || 0);
        const paxCount = Number(c.paxCount || 1);
        const packagePrice = basePrice * paxCount;
        const payments = c.payments || [];

        return payments
          .filter((p: any) => p.status === 'approved')
          .map((p: any) => ({
            id: p.id || `prop-${c.id}-${p.paymentType}-${p.amount}`,
            amount: Number(p.amount || 0),
            paymentType: p.paymentType || p.type || 'dp1',
            status: 'approved',
            createdAt: p.createdAt || p.date || new Date().toISOString(),
            userName: c.name || 'Jamaah',
            userPhone: c.phone || '-',
            userEmail: c.email || '-',
            packageName: c.packageName || pkg?.name || 'Paket Umroh',
            packagePrice: packagePrice,
            proofUrl: p.proofUrl || ''
          }));
      });

      // 3. Combine and deduplicate by payment ID or signature
      const combinedMap = new Map<string, any>();

      // Add prop payments
      propPayments.forEach(item => {
        combinedMap.set(String(item.id), item);
      });

      // Add server payments (overwrite or append if new)
      if (Array.isArray(serverData)) {
        serverData.forEach(item => {
          if (item.status === 'approved' || !item.status) {
            const key = String(item.id || `server-${item.registrationId}-${item.amount}`);
            combinedMap.set(key, {
              ...item,
              amount: Number(item.amount || 0),
              status: 'approved',
              userName: item.userName || 'Jamaah',
              packageName: item.packageName || 'Paket Umroh'
            });
          }
        });
      }

      const allList = Array.from(combinedMap.values()).sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setReports(allList);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stage aggregates
  const dp1Payments = reports.filter(r => r.paymentType === 'dp1' || r.paymentType === 'dp');
  const dp1Sum = dp1Payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const dp2Payments = reports.filter(r => r.paymentType === 'dp2' || r.paymentType === 'cicilan');
  const dp2Sum = dp2Payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const pelunasanPayments = reports.filter(r => r.paymentType === 'pelunasan');
  const pelunasanSum = pelunasanPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const fullPayments = reports.filter(r => r.paymentType === 'full' || r.paymentType === 'pelunasan_full');
  const fullSum = fullPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Stage Filter
      if (stageFilter === 'dp1' && !(r.paymentType === 'dp1' || r.paymentType === 'dp')) return false;
      if (stageFilter === 'dp2' && !(r.paymentType === 'dp2' || r.paymentType === 'cicilan')) return false;
      if (stageFilter === 'pelunasan' && r.paymentType !== 'pelunasan') return false;
      if (stageFilter === 'full' && !(r.paymentType === 'full' || r.paymentType === 'pelunasan_full')) return false;

      // Period Filter
      if (periodFilter === 'month') {
        const itemDate = new Date(r.createdAt || 0);
        const now = new Date();
        if (itemDate.getMonth() !== now.getMonth() || itemDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (periodFilter === 'year') {
        const itemDate = new Date(r.createdAt || 0);
        const now = new Date();
        if (itemDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (periodFilter === 'custom' || customStartDate || customEndDate) {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const itemDate = new Date(r.createdAt || 0);
          if (itemDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          const itemDate = new Date(r.createdAt || 0);
          if (itemDate > end) return false;
        }
      }

      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (r.userName || '').toLowerCase().includes(q);
        const pkgMatch = (r.packageName || '').toLowerCase().includes(q);
        const typeMatch = (r.paymentType || '').toLowerCase().includes(q);
        if (!nameMatch && !pkgMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [reports, stageFilter, periodFilter, searchTerm, customStartDate, customEndDate]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredReports.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredReports]);

  const totalRevenue = useMemo(() => {
    return reports.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [reports]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStageBadge = (type: string) => {
    if (type === 'dp1' || type === 'dp') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">Setoran DP 1</span>;
    }
    if (type === 'dp2' || type === 'cicilan') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">Setoran DP 2</span>;
    }
    if (type === 'pelunasan') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Pelunasan Sisa</span>;
    }
    if (type === 'full' || type === 'pelunasan_full') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100">Pelunasan Full</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100">{type.toUpperCase()}</span>;
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Header Banner
      doc.setFillColor(31, 58, 43); // Dark Matcha #1F3A2B
      doc.rect(0, 0, pageWidth, 34, 'F');

      // Accent Line (Gold)
      doc.setFillColor(212, 175, 55); // #D4AF37
      doc.rect(0, 34, pageWidth, 1.5, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('PT GOLDEN TOUR HARAMAIN', 14, 15);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Laporan Resmi Keuangan & Arus Kas Masuk Setoran Jamaah', 14, 22);
      doc.text('Izin PPIU/PIHK Resmi | Umroh & Hajj Special Services', 14, 27);

      // Doc info top right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DOKUMEN RESMI', pageWidth - 14, 15, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`Ref: FIN-LAP-${new Date().getTime().toString().slice(-6)}`, pageWidth - 14, 20, { align: 'right' });
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`, pageWidth - 14, 25, { align: 'right' });

      // 2. Summary Box Card
      doc.setFillColor(245, 247, 245); // Light neutral gray/matcha
      doc.setDrawColor(210, 222, 213);
      doc.roundedRect(14, 40, pageWidth - 28, 30, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(31, 58, 43);
      doc.text('RINGKASAN EKSEKUTIF KEUANGAN', 18, 47);

      // Metadata items
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      
      const filterStageText = stageFilter === 'all' ? 'Semua Tahap' : stageFilter === 'dp1' ? 'Setoran DP 1' : stageFilter === 'dp2' ? 'Setoran DP 2' : stageFilter === 'pelunasan' ? 'Pelunasan Sisa' : 'Pelunasan Full';
      let periodText = 'Semua Waktu';
      if (periodFilter === 'month') {
        periodText = 'Bulan Ini';
      } else if (periodFilter === 'year') {
        periodText = 'Tahun Ini';
      } else if (periodFilter === 'custom' || customStartDate || customEndDate) {
        const startStr = customStartDate ? new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Awal';
        const endStr = customEndDate ? new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';
        periodText = `${startStr} s/d ${endStr}`;
      }

      doc.text(`Periode: ${periodText}   |   Filter Tahap: ${filterStageText}   |   Jumlah Transaksi: ${filteredReports.length} Invoice`, 18, 53);

      // Highlight Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(31, 58, 43);
      doc.text(`Total Kas Masuk Valid: ${formatCurrency(totalFilteredRevenue)}`, 18, 62);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`(Rata-rata setoran per transaksi: ${formatCurrency(totalFilteredRevenue / (filteredReports.length || 1))})`, 18, 66.5);

      // 3. Table Column & Data Preparation
      const tableColumns = [
        { header: 'No', dataKey: 'no' },
        { header: 'Tanggal', dataKey: 'date' },
        { header: 'Nama Jamaah', dataKey: 'userName' },
        { header: 'Paket Umroh', dataKey: 'packageName' },
        { header: 'Tahap Pembayaran', dataKey: 'stage' },
        { header: 'Nominal Setoran', dataKey: 'amount' }
      ];

      const tableRows = filteredReports.map((report, idx) => {
        let stageLabel = 'DP 1';
        if (report.paymentType === 'dp2' || report.paymentType === 'cicilan') stageLabel = 'DP 2';
        else if (report.paymentType === 'pelunasan') stageLabel = 'Pelunasan Sisa';
        else if (report.paymentType === 'full' || report.paymentType === 'pelunasan_full') stageLabel = 'Pelunasan Full';

        return {
          no: idx + 1,
          date: report.createdAt ? new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
          userName: report.userName || 'Jamaah',
          packageName: report.packageName || 'Paket Umroh',
          stage: stageLabel,
          amount: formatCurrency(Number(report.amount || 0))
        };
      });

      // Execute autoTable
      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: 74,
        margin: { left: 14, right: 14, bottom: 20 },
        theme: 'striped',
        headStyles: {
          fillColor: [31, 58, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [40, 40, 40]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 248]
        },
        columnStyles: {
          no: { halign: 'center', cellWidth: 10 },
          date: { halign: 'center', cellWidth: 26 },
          userName: { halign: 'left', cellWidth: 42, fontStyle: 'bold' },
          packageName: { halign: 'left' },
          stage: { halign: 'center', cellWidth: 30 },
          amount: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
        },
        foot: [
          [
            { content: '', colSpan: 3 },
            { content: 'TOTAL KAS MASUK TERVERIFIKASI', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: formatCurrency(totalFilteredRevenue), styles: { halign: 'right', fontStyle: 'bold', fillColor: [226, 235, 229], textColor: [31, 58, 43] } }
          ]
        ],
        footStyles: {
          fillColor: [240, 245, 241],
          textColor: [31, 58, 43],
          fontSize: 8.5
        },
        didDrawPage: (data) => {
          // Footer on every page
          doc.setDrawColor(220, 220, 220);
          doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text('PT Golden Tour Haramain — Dokumen Laporan Keuangan Audit Internal', 14, pageHeight - 7);
          
          const pageStr = `Halaman ${data.pageNumber} dari ${(doc as any).internal.getNumberOfPages()}`;
          doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }
      });

      // 4. Signature Block
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 150;
      let startSignY = finalY + 12;

      // Check page overflow for signature block
      if (startSignY + 40 > pageHeight - 15) {
        doc.addPage();
        startSignY = 25;
      }

      const signRightX = pageWidth - 65;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(`Batam, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signRightX, startSignY);
      doc.text('Disetujui & Disahkan oleh,', signRightX, startSignY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 58, 43);
      doc.text('Departemen Keuangan & Akuntansi', signRightX, startSignY + 10);

      // Signature Name & Role (without stamp box)
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 58, 43);
      doc.text('AHMAD DAUD', signRightX, startSignY + 32);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Head of Finance & Treasury', signRightX, startSignY + 37);

      // Save PDF
      doc.save(`Laporan_Keuangan_GoldenTourHaramain_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Gagal mengunduh laporan PDF. Silakan coba beberapa saat lagi.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-matcha-600" />
        <p className="text-xs font-bold text-gray-500">Memuat Laporan Keuangan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-matcha-50 text-matcha-800 border border-matcha-100 inline-flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Audit Terverifikasi
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Keuangan & Arus Kas</h2>
          <p className="text-sm text-gray-500 mt-1">Rekapitulasi setoran dana jamaah terverifikasi secara real-time.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={loadReports}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-matcha-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-matcha-950 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            Cetak PDF / Laporan
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pendapatan Valid</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[11px] text-gray-500 mt-1">{reports.length} Transaksi Disetujui</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Bukti / Invoice</p>
            <h3 className="text-2xl font-bold text-gray-900">{reports.length} <span className="text-sm font-medium text-gray-500">Bukti Transfer</span></h3>
            <p className="text-[11px] text-gray-500 mt-1">Lolos Verifikasi Keuangan</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-gold-100 text-gold-700 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rata-Rata Setoran</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue / (reports.length || 1))}</h3>
            <p className="text-[11px] text-gray-500 mt-1">Per Bukti Pembayaran</p>
          </div>
        </div>
      </div>

      {/* Breakdown Summary Per Tahap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Setoran DP 1</span>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(dp1Sum)}</p>
          <span className="text-[10px] text-gray-400">{dp1Payments.length} Transaksi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Setoran DP 2</span>
          <p className="text-lg font-bold text-indigo-700">{formatCurrency(dp2Sum)}</p>
          <span className="text-[10px] text-gray-400">{dp2Payments.length} Transaksi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pelunasan Sisa</span>
          <p className="text-lg font-bold text-emerald-700">{formatCurrency(pelunasanSum)}</p>
          <span className="text-[10px] text-gray-400">{pelunasanPayments.length} Transaksi</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pelunasan Full</span>
          <p className="text-lg font-bold text-green-700">{formatCurrency(fullSum)}</p>
          <span className="text-[10px] text-gray-400">{fullPayments.length} Transaksi</span>
        </div>
      </div>

      {/* Cash Flow Table & Controls */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-matcha-50 text-matcha-700 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Rincian Arus Kas Masuk</h3>
              <p className="text-xs text-gray-500">Menampilkan {filteredReports.length} dari total {reports.length} transaksi</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage filter buttons */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setStageFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${stageFilter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setStageFilter('dp1')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${stageFilter === 'dp1' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                DP 1
              </button>
              <button 
                onClick={() => setStageFilter('dp2')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${stageFilter === 'dp2' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                DP 2
              </button>
              <button 
                onClick={() => setStageFilter('pelunasan')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${stageFilter === 'pelunasan' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Pelunasan Sisa
              </button>
              <button 
                onClick={() => setStageFilter('full')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${stageFilter === 'full' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Full
              </button>
            </div>

            {/* Period filter */}
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={periodFilter} 
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPeriodFilter(val);
                  if (val !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl outline-none focus:border-matcha-600 cursor-pointer shadow-sm"
              >
                <option value="all">Semua Waktu</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
                <option value="custom">📅 Kustom Tanggal (Tgl/Bln/Thn)</option>
              </select>

              {(periodFilter === 'custom' || customStartDate || customEndDate) && (
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-matcha-300 shadow-sm text-xs">
                  <Calendar className="w-3.5 h-3.5 text-matcha-700 ml-1" />
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Dari:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setPeriodFilter('custom');
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-800 outline-none focus:border-matcha-600 font-medium"
                    />
                  </div>
                  <span className="text-gray-300 font-bold">-</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Sampai:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setPeriodFilter('custom');
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-gray-800 outline-none focus:border-matcha-600 font-medium"
                    />
                  </div>
                  {(customStartDate || customEndDate) && (
                    <button
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setPeriodFilter('all');
                      }}
                      className="text-gray-400 hover:text-red-500 px-1 font-bold text-xs"
                      title="Reset Filter Tanggal"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari transaksi / jamaah..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-matcha-600 outline-none text-xs w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Jamaah</th>
                <th className="p-4">Paket Perjalanan</th>
                <th className="p-4">Tahap Pembayaran</th>
                <th className="p-4 text-right">Nominal Setoran</th>
                <th className="p-4 text-center">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-600 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{report.userName}</p>
                      <p className="text-[11px] text-gray-400">{report.userPhone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gray-800">{report.packageName}</p>
                      {report.packagePrice > 0 && (
                        <p className="text-[10px] text-gray-400">Total Tagihan: {formatCurrency(report.packagePrice)}</p>
                      )}
                    </td>
                    <td className="p-4">
                      {getStageBadge(report.paymentType)}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-matcha-900 text-sm">
                        {formatCurrency(Number(report.amount || 0))}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 uppercase border border-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                    Tidak ada transaksi arus kas masuk yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredReports.length > 0 && (
              <tfoot>
                <tr className="bg-matcha-50/50 font-bold border-t border-gray-200 text-xs">
                  <td colSpan={4} className="p-4 text-gray-800 uppercase tracking-wider">
                    Total Arus Kas Masuk Terfilter ({filteredReports.length} Transaksi)
                  </td>
                  <td className="p-4 text-right text-matcha-900 text-sm font-mono">
                    {formatCurrency(totalFilteredRevenue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
