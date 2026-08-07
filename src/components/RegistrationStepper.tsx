import React, { useState } from 'react';
import { Check, UploadCloud, Plus, Minus, X, Image as ImageIcon, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type RegistrationStatus = string;

interface RegistrationStepperProps {
  currentStatus: RegistrationStatus;
  pendingPaymentStep?: string;
  computedPaymentStep?: string;
  isDocumentPending?: boolean;
  isDocsComplete?: boolean;
  onNavigate: (tabId: string, paymentMode?: 'step' | 'full') => void;
  onResetPackage?: () => void;
  selectedPackageName?: string;
  paxCount?: number;
  packagePrice?: number;
  approvedTotal?: number;
  sisaTagihan?: number;
}

export default function RegistrationStepper({ 
  currentStatus, 
  pendingPaymentStep,
  isDocumentPending,
  isDocsComplete,
  onNavigate,
  onResetPackage,
  selectedPackageName,
  computedPaymentStep,
  paxCount = 1,
  packagePrice = 36000000,
  approvedTotal,
  sisaTagihan,
}: RegistrationStepperProps) {
  
  const navigate = useNavigate();

  // Local state for Step 1 Interactive Flow
  const [selectedPkg, setSelectedPkg] = useState<{name: string, price: number} | null>(
    selectedPackageName ? { name: selectedPackageName, price: 36000000 } : null
  );
  const [pax, setPax] = useState(paxCount);
  
  React.useEffect(() => {
    if (selectedPackageName) {
      setSelectedPkg({ name: selectedPackageName, price: 36000000 });
      setPax(paxCount || 1);
    } else {
      setSelectedPkg(null);
    }
  }, [selectedPackageName, paxCount]);

  let currentIdx = 0;
  const hasSelectedPackage = !!selectedPkg;
  
  if (hasSelectedPackage) {
      currentIdx = 1; 
  }

  // Determine if actually lunas - Must have a package selected and zero/near-zero balance
  const isTrulyLunas = hasSelectedPackage && ((sisaTagihan !== undefined && sisaTagihan <= 100) || computedPaymentStep === 'lunas');

  // Override based on currentStatus for realistic flow
  switch (currentStatus) {
    case 'ISI_BIODATA': currentIdx = Math.max(currentIdx, 1); break;
    case 'UPLOAD_DOKUMEN': currentIdx = Math.max(currentIdx, 2); break;
    case 'VERIFIKASI_DOKUMEN': currentIdx = Math.max(currentIdx, 3); break;
    case 'CICIL_BAYAR': currentIdx = Math.max(currentIdx, 4); break;
    case 'VERIFIKASI_BAYAR': currentIdx = Math.max(currentIdx, 5); break;
    case 'LUNAS': 
      if (isTrulyLunas) {
        currentIdx = Math.max(currentIdx, 6);
      } else {
        currentIdx = Math.max(currentIdx, 5);
      }
      break;
    case 'SIAP_BERANGKAT': 
    case 'BERANGKAT': 
    case 'SELESAI': 
      if (isTrulyLunas) {
        currentIdx = Math.max(currentIdx, 6);
      } else {
        currentIdx = Math.max(currentIdx, 5);
      }
      break;
  }
  
  if (computedPaymentStep === 'dp1' || computedPaymentStep === 'dp2' || isTrulyLunas) currentIdx = Math.max(currentIdx, 4);
  if (computedPaymentStep === 'dp2' || isTrulyLunas) currentIdx = Math.max(currentIdx, 5);
  if (isTrulyLunas) currentIdx = Math.max(currentIdx, 6);

  
  const dp1Price = 1500000;
  const dp1Total = dp1Price * pax;

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
                onClick={(e) => { e.stopPropagation(); onNavigate('katalog_paket'); }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg px-6 py-2.5 shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Cari & Pilih Paket <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        } else {
          // Fase 1: Completed State (Selesai)
          return (
            <div className="mt-4 bg-white p-5 shadow-sm rounded-xl border-l-4 border-yellow-500 border-y border-r border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">PAKET TERPILIH</span>
                  <span className="block text-base font-bold text-gray-900">{selectedPkg.name}</span>
                </div>
                <div className="sm:text-right">
                   <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">JUMLAH BERANGKAT</span>
                   <span className="block text-base font-bold text-gray-900">{pax} Jamaah</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('katalog_paket');
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Ubah Pilihan
                </button>
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedPkg(null);
                    if (onResetPackage) onResetPackage();
                  }}
                  className="text-sm font-semibold text-red-500 hover:text-red-600 hover:underline cursor-pointer transition-colors"
                >
                  Hapus Pilihan
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
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive) {
          return (
            <div className="mt-3">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigate('biodata'); 
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 w-fit transition-all shadow-sm"
              >
                Lengkapi Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        }
        if (isCompleted) {
          return (
            <div className="mt-4 bg-white p-5 shadow-sm rounded-xl border-l-4 border-yellow-500 border-y border-r border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">BIODATA JAMAAH</span>
                  <span className="block text-base font-bold text-gray-900">{paxCount} Jamaah Terisi & Terverifikasi</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('biodata');
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Ubah / Periksa Biodata
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('dokumen');
                  }}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors flex items-center gap-1"
                >
                  Lanjut ke Unggah Dokumen <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }
        return null;
      }
    },
    { 
      id: 'docs', 
      title: 'Unggah Dokumen', 
      desc: 'Upload KTP, KK, dan Paspor untuk proses validasi.',
      tab: 'dokumen',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive && isDocsComplete) {
          return (
            <div className="mt-4 bg-white p-5 shadow-sm rounded-xl border-l-4 border-emerald-500 border-y border-r border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">DOKUMEN SIAP</span>
                  <span className="block text-base font-bold text-gray-900">Seluruh dokumen wajib telah terunggah.</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('dokumen');
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Periksa Dokumen
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('pembayaran');
                  }}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer flex items-center gap-1 group"
                >
                  Lanjut ke Pembayaran <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        }
        if (isActive) {
          return (
            <div className="mt-3">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigate('dokumen'); 
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 w-fit transition-all shadow-sm"
              >
                Unggah Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        }
        if (isCompleted) {
          return (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Seluruh Dokumen Telah Terverifikasi
            </div>
          );
        }
        return null;
      }
    },
    { 
      id: 'dp1', 
      title: 'Pembayaran DP 1 (Perlengkapan)', 
      desc: 'Bayar DP Tahap 1 untuk pengambilan perlengkapan, atau lakukan pelunasan secara full sekaligus.',
      tab: 'pembayaran',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive || isCompleted) {
          return (
            <div className="mt-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Biaya DP 1 (per pax):</span>
                  <span className="text-sm font-medium text-gray-900">Rp {Number(dp1Price).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Jumlah Berangkat:</span>
                  <span className="text-sm font-medium text-gray-900">x {pax} Jamaah</span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total DP 1 Harus Ditransfer:</span>
                  <span className="text-lg font-bold text-yellow-600">Rp {Number(dp1Total).toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              {(isActive || pendingPaymentStep === 'dp1') && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate('pembayaran', 'step'); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    Upload Bukti DP 1
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate('pembayaran', 'full'); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    Opsi Pelunasan Full (100%)
                  </button>
                </div>
              )}
            </div>
          );
        }
        return null;
      }
    },
    { 
      id: 'dp2', 
      title: 'Pembayaran DP 2 (Booking Seat)', 
      desc: 'Pembayaran sebesar Rp 10.000.000 per pax untuk mengamankan tiket pesawat (Booking Seat).',
      tab: 'pembayaran',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive) {
          if (pendingPaymentStep === 'dp2' || pendingPaymentStep === 'DP2') {
            return (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Bukti Pembayaran DP 2 telah diunggah & sedang dalam verifikasi oleh Tim Admin.
              </div>
            );
          }
          return (
            <div className="mt-3 flex flex-wrap gap-2">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigate('pembayaran', 'step'); 
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-xs transition-all shadow-sm cursor-pointer"
              >
                Bayar DP 2 Sekarang
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigate('pembayaran', 'full'); 
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-xs transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Bayar Full Sisa Paket
              </button>
            </div>
          );
        }
        if (isCompleted) {
          return (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              DP 2 (Booking Seat) Terverifikasi & Lunas
            </div>
          );
        }
        return null;
      }
    },
    { 
      id: 'full', 
      title: 'Pembayaran Sisa Pelunasan', 
      desc: 'Pelunasan sisa biaya paket perjalanan sebelum batas waktu yang ditentukan.',
      tab: 'pembayaran',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive) {
          const remainingAmount = sisaTagihan !== undefined && sisaTagihan > 0 
            ? sisaTagihan 
            : Math.max(0, (packagePrice * paxCount) - (approvedTotal || 0));

          if (pendingPaymentStep === 'full' || pendingPaymentStep === 'PELUNASAN' || currentStatus === 'VERIFIKASI_BAYAR') {
            return (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Bukti Pelunasan telah diunggah & sedang dalam verifikasi oleh Tim Admin.
              </div>
            );
          }
          return (
            <div className="mt-3 space-y-2">
              {remainingAmount > 0 && (
                <div className="text-xs font-semibold text-gray-700 bg-amber-50 px-3 py-1.5 rounded-lg inline-block border border-amber-200">
                  Sisa Tagihan Pelunasan: <span className="font-bold text-amber-700">Rp {Number(remainingAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onNavigate('pembayaran', 'full'); 
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Lunasi Sisa Pembayaran Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }
        if (isCompleted) {
          return (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              Pembayaran Sisa Pelunasan Terverifikasi & Lunas
            </div>
          );
        }
        return null;
      }
    },
    { 
      id: 'done', 
      title: 'Selesai & Persiapan Keberangkatan', 
      desc: 'Pendaftaran lunas. Cek jadwal manasik, manifest bus, hotel, dan kumpul keberangkatan.',
      tab: 'persiapan_keberangkatan',
      renderContent: (isCompleted: boolean, isActive: boolean) => {
        if (isActive || isCompleted) {
          return (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                Pendaftaran Umroh Lunas! Selamat mempersiapkan keberangkatan.
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onNavigate('persiapan_keberangkatan'); 
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                Lihat Info Persiapan Keberangkatan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return null;
      }
    },
  ];

  return (
    <div className="pt-2">
      <div className="space-y-0">
          {steps.map((step, index) => {
            let isCompleted = index < currentIdx;
            let isActive = index === currentIdx;
            let isUpcoming = index > currentIdx;

            // Allow DP1 (index 3) to be active concurrently with Dokumen (index 2)
            if (index === 3 && currentIdx === 2) {
              isActive = true;
              isUpcoming = false;
            }

            const isLast = index === steps.length - 1;

            let lineColor = "border-gray-200";
            if (isCompleted) {
               lineColor = "border-yellow-500";
            }

            return (
              <div key={step.id} className={`relative flex gap-6 group ${isUpcoming ? '' : 'cursor-pointer'}`} onClick={() => {
                if (isCompleted || isActive) {
                  onNavigate(step.tab);
                }
              }}>
                
                {/* Left Column: Circle & Line */}
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors duration-300 ${
                      isCompleted 
                        ? 'bg-yellow-500 text-white' 
                        : isActive 
                          ? 'bg-gray-900 text-white ring-4 ring-gray-100' 
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div className={`flex-1 border-l-2 ${lineColor} w-0 my-2 transition-all duration-300 min-h-[40px]`}></div>
                  )}
                </div>

                {/* Right Column: Content */}
                <div className={`flex-1 pb-10 ${isUpcoming ? 'opacity-50 grayscale-[50%]' : 'opacity-100'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className={`text-base font-bold ${(isActive || isCompleted) ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </h4>
                    
                    {isCompleted && (
                      <span className="inline-flex items-center bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-yellow-200">
                        Selesai
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border border-red-200">
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
                    <div className="mt-1">
                      {step.renderContent(isCompleted, isActive)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
}
