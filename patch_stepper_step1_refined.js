import fs from 'fs';

const content = `import React, { useState } from 'react';
import { Check, UploadCloud, Plus, Minus, X, Image as ImageIcon } from 'lucide-react';

export type RegistrationStatus = 
  | 'package_selected' 
  | 'bio_filled' 
  | 'documents_uploaded' 
  | 'dp1_paid' 
  | 'dp2_paid' 
  | 'fully_paid' 
  | 'visa_ticket_ready';

interface RegistrationStepperProps {
  currentStatus: RegistrationStatus;
  pendingPaymentStep?: string;
  isDocumentPending?: boolean;
  onNavigate: (tabId: string) => void;
  selectedPackageName?: string;
  paxCount?: number;
}

export default function RegistrationStepper({ 
  currentStatus, 
  pendingPaymentStep,
  isDocumentPending,
  onNavigate,
  selectedPackageName: initialPackageName = "",
  paxCount: initialPaxCount = 1,
}: RegistrationStepperProps) {
  
  // Local state for Step 1 Interactive Flow
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<{name: string, price: number} | null>(
    initialPackageName ? { name: initialPackageName, price: 35000000 } : null
  );
  const [pax, setPax] = useState(initialPaxCount);
  
  // Temp state inside modal
  const [tempPkg, setTempPkg] = useState<{name: string, price: number} | null>(selectedPkg);
  const [tempPax, setTempPax] = useState(pax);

  let currentIdx = 0;
  const hasSelectedPackage = !!selectedPkg;
  
  if (hasSelectedPackage) {
      currentIdx = 1; 
  }

  switch (currentStatus) {
    case 'bio_filled': currentIdx = Math.max(currentIdx, 2); break;
    case 'documents_uploaded': currentIdx = Math.max(currentIdx, 3); break;
    case 'dp1_paid': currentIdx = Math.max(currentIdx, 4); break;
    case 'dp2_paid': currentIdx = Math.max(currentIdx, 5); break;
    case 'fully_paid': currentIdx = Math.max(currentIdx, 6); break;
    case 'visa_ticket_ready': currentIdx = Math.max(currentIdx, 7); break;
  }
  
  const dp1Price = 1500000;
  const dp1Total = dp1Price * pax;

  const handleKonfirmasi = () => {
    if (tempPkg) {
      setSelectedPkg(tempPkg);
      setPax(tempPax);
      setIsModalOpen(false);
      
      // Auto-Advance Logic: Automatically triggers transition to Phase 2
      // setTimeout(() => onNavigate('biodata'), 300);
    }
  };

  const steps = [
    { 
      id: 'package', 
      title: 'Pilih Paket Perjalanan', 
      tab: 'katalog_paket',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (!hasSelectedPackage) {
          // Fase 1: Initial State
          return (
            <div className="mt-4">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-6 py-2.5 shadow-sm transition-colors w-full sm:w-auto"
              >
                Cari & Pilih Paket
              </button>
            </div>
          );
        } else {
          // Fase 3: Completed State
          return (
            <div className="mt-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Paket Terpilih</span>
                  <span className="block text-base font-bold text-gray-900">{selectedPkg.name}</span>
                </div>
                <div className="sm:text-right">
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Jumlah Berangkat</span>
                   <span className="block text-base font-bold text-gray-900">{pax} Jamaah</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setTempPkg(selectedPkg); 
                    setTempPax(pax);
                    setIsModalOpen(true); 
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Ubah Pilihan
                </button>
              </div>
            </div>
          );
        }
      }
    },
    { 
      id: 'bio', 
      title: 'Lengkapi Biodata', 
      desc: 'Isi data diri semua jamaah sesuai KTP dan Paspor.',
      tab: 'biodata',
    },
    { 
      id: 'docs', 
      title: 'Unggah Dokumen', 
      desc: 'Upload KTP, KK, dan Paspor untuk proses validasi.',
      tab: 'dokumen',
    },
    { 
      id: 'dp1', 
      title: 'Pembayaran DP 1 (Perlengkapan)', 
      desc: 'Bayar DP Tahap 1 untuk pengambilan perlengkapan (Koper, Seragam, dll).',
      tab: 'pembayaran',
      renderContent: (isCompleted: boolean, isActive: boolean) => (
        <div className="mt-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Biaya DP 1 (per pax):</span>
              <span className="text-sm font-medium text-gray-900">Rp {dp1Price.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Jumlah Berangkat:</span>
              <span className="text-sm font-medium text-gray-900">x {pax} Jamaah</span>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Harus Ditransfer:</span>
              <span className="text-lg font-bold text-yellow-600">Rp {dp1Total.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          {(isActive || pendingPaymentStep === 'dp1') && (
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigate('pembayaran'); }}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Bukti Transfer
            </button>
          )}
        </div>
      )
    },
    { 
      id: 'dp2', 
      title: 'Pembayaran DP 2 (Booking Seat)', 
      desc: 'Pembayaran sebesar Rp 10.000.000 per pax untuk mengamankan tiket pesawat (Booking Seat).',
      tab: 'pembayaran',
    },
    { 
      id: 'full', 
      title: 'Pembayaran Sisa Pelunasan', 
      desc: 'Pelunasan sisa biaya paket perjalanan sebelum batas waktu yang ditentukan.',
      tab: 'pembayaran',
    },
    { 
      id: 'done', 
      title: 'Selesai & Persiapan Keberangkatan', 
      desc: 'Pendaftaran lunas. Cek jadwal manasik, manifest bus, hotel, dan kumpul keberangkatan.',
      tab: 'persiapan_keberangkatan',
    },
  ];

  const catalog = [
    { name: 'Umroh Reguler 9 Hari', date: '25 Agustus 2026', price: 35000000, quota: 5 },
    { name: 'Haji Furoda VIP', date: '10 Mei 2027', price: 250000000, quota: 2 },
  ];

  return (
    <>
      <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-8">Progress Pendaftaran Jamaah</h3>
        
        <div className="space-y-0">
          {steps.map((step, index) => {
            const isCompleted = index < currentIdx;
            const isActive = index === currentIdx;
            const isUpcoming = index > currentIdx;
            const isLast = index === steps.length - 1;

            let lineColor = "border-gray-200";
            if (isCompleted) {
               lineColor = "border-yellow-500";
            }

            return (
              <div key={step.id} className="relative flex gap-6 group cursor-pointer" onClick={() => onNavigate(step.tab)}>
                
                {/* Left Column: Circle & Line */}
                <div className="flex flex-col items-center">
                  <div 
                    className={\`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors duration-300 \${
                      isCompleted 
                        ? 'bg-yellow-500 text-white' 
                        : isActive 
                          ? 'bg-gray-900 text-white ring-4 ring-gray-100' 
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                    }\`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div className={\`flex-1 border-l-2 \${lineColor} w-0 my-2 transition-colors duration-300 min-h-[40px]\`}></div>
                  )}
                </div>

                {/* Right Column: Content */}
                <div className={\`flex-1 pb-10 \${isUpcoming ? 'opacity-60' : 'opacity-100'}\`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className={\`text-base font-bold \${(isActive || isCompleted) ? 'text-gray-900' : 'text-gray-500'}\`}>
                      {step.title}
                    </h4>
                    
                    {isCompleted && (
                      <span className="inline-flex items-center bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-yellow-200">
                        Selesai
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center bg-red-50/50 text-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-red-200/50">
                        Tindakan Diperlukan
                      </span>
                    )}
                  </div>

                  {step.desc && (
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                      {step.desc}
                    </p>
                  )}

                  {step.renderContent && (
                    <div className="mt-2">
                      {step.renderContent(isCompleted, isActive)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fase 2: Katalog Paket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Katalog Paket Tersedia</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 grow">
              {catalog.map((pkg) => {
                const isSelected = tempPkg?.name === pkg.name;
                return (
                  <div 
                    key={pkg.name}
                    onClick={() => setTempPkg(pkg)}
                    className={\`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-4 \${
                      isSelected 
                        ? 'border-yellow-500 ring-2 ring-yellow-500/20 bg-yellow-50/30' 
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }\`}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail Placeholder */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                         <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 leading-tight">{pkg.name}</h4>
                            <span className="inline-flex items-center bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100 whitespace-nowrap ml-2">
                              Sisa Kuota: {pkg.quota} Seat
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Keberangkatan: {pkg.date}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-bold text-yellow-600">Rp {pkg.price.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-normal">/ pax</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Input Inside Selected Card */}
                    {isSelected && (
                      <div className="pt-4 border-t border-yellow-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Jumlah Jamaah
                          </label>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTempPax(Math.max(1, tempPax - 1)); }}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-base font-bold w-6 text-center">{tempPax}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTempPax(Math.min(pkg.quota, tempPax + 1)); }}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="sm:text-right bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                           <span className="block text-xs font-semibold text-gray-500 mb-0.5">Total Harga</span>
                           <span className="block text-lg font-bold text-gray-900">Rp {(pkg.price * tempPax).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-200 transition-colors text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleKonfirmasi}
                disabled={!tempPkg}
                className="px-6 py-2.5 rounded-lg font-bold bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 text-white transition-colors text-sm shadow-sm"
              >
                Pilih Paket Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
`;
fs.writeFileSync('src/components/RegistrationStepper.tsx', content);
