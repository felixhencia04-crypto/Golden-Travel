import fs from 'fs';

const updatedContent = `import React from 'react';
import { Check, UploadCloud } from 'lucide-react';

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
  selectedPackageName = "Umroh Reguler 9 Hari", // fallback
  paxCount = 1,
}: RegistrationStepperProps) {
  
  let currentIdx = 0;
  switch (currentStatus) {
    case 'package_selected': currentIdx = 1; break;
    case 'bio_filled': currentIdx = 2; break;
    case 'documents_uploaded': currentIdx = 3; break;
    case 'dp1_paid': currentIdx = 4; break;
    case 'dp2_paid': currentIdx = 5; break;
    case 'fully_paid': currentIdx = 6; break;
    case 'visa_ticket_ready': currentIdx = 7; break;
    default: currentIdx = 0;
  }
  
  if (!selectedPackageName && currentStatus !== 'package_selected' && currentStatus !== 'bio_filled' && currentStatus !== 'documents_uploaded') {
      currentIdx = 0; // If no package, we are at step 0 usually, but let's trust currentIdx calculation based on currentStatus.
  }

  const dp1Price = 1500000;
  const dp1Total = dp1Price * paxCount;

  const steps = [
    { 
      id: 'package', 
      title: 'Pilih Paket Perjalanan', 
      tab: 'katalog_paket',
      renderContent: (isCompleted: boolean, isActive: boolean) => (
        <div className="mt-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Paket Terpilih:</span>
            <span className="text-sm font-bold text-gray-900">{selectedPackageName || 'Belum dipilih'}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Jumlah Berangkat:</span>
            <span className="text-sm font-bold text-gray-900">{paxCount} Jamaah</span>
          </div>
        </div>
      )
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
              <span className="text-sm font-medium text-gray-900">x {paxCount} Jamaah</span>
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

  return (
    <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Progress Pendaftaran Jamaah</h3>
      
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentIdx;
          const isActive = index === currentIdx;
          const isUpcoming = index > currentIdx;
          const isLast = index === steps.length - 1;

          // Connecting line styling
          let lineColor = "border-gray-200";
          if (isCompleted) {
             // If this step is completed, the line to the next step should be gold
             lineColor = "border-yellow-500";
          }

          return (
            <div key={step.id} className="relative flex gap-6 group cursor-pointer" onClick={() => onNavigate(step.tab)}>
              
              {/* Left Column: Circle & Line */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div 
                  className={\`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 transition-colors duration-300 \${
                    isCompleted 
                      ? 'bg-yellow-500 text-white' 
                      : isActive 
                        ? 'bg-gray-900 text-white ring-4 ring-gray-200' 
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                  }\`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Vertical Line */}
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
                  
                  {/* Status Badge */}
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

                {/* Optional Data Card Content */}
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
  );
}
`;

fs.writeFileSync('src/components/RegistrationStepper.tsx', updatedContent);
