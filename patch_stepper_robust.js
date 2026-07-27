import fs from 'fs';
const content = `import React from 'react';
import { 
  Check, 
  Clock, 
  Briefcase, 
  FileText, 
  UploadCloud, 
  Wallet, 
  PlaneTakeoff, 
  Flag 
} from 'lucide-react';

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
  selectedPackageName,
}: RegistrationStepperProps) {
  
  const steps = [
    { id: 'package', label: 'Pilih Paket', tab: 'katalog_paket', icon: Briefcase },
    { id: 'bio', label: 'Isi Biodata', tab: 'biodata', icon: FileText },
    { id: 'docs', label: 'Upload Dokumen', tab: 'dokumen', icon: UploadCloud },
    { id: 'payment', label: 'Pembayaran', tab: 'pembayaran', icon: Wallet },
    { id: 'prep', label: 'Persiapan', tab: 'persiapan_keberangkatan', icon: PlaneTakeoff },
    { id: 'done', label: 'Selesai', tab: 'persiapan_keberangkatan', icon: Flag },
  ];

  let currentIdx = 0;
  switch (currentStatus) {
    case 'package_selected': currentIdx = 1; break;
    case 'bio_filled': currentIdx = 2; break;
    case 'documents_uploaded': currentIdx = 3; break;
    case 'dp1_paid':
    case 'dp2_paid':
      currentIdx = 3; // Still in payment phase until fully paid
      break;
    case 'fully_paid': currentIdx = 4; break;
    case 'visa_ticket_ready': currentIdx = 5; break;
    default: currentIdx = 0;
  }
  
  if (!selectedPackageName) {
      currentIdx = 0;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-8">Progress Pendaftaran</h3>
      
      <div className="flex items-start justify-between min-w-[700px] lg:min-w-full w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentIdx;
          const isActive = index === currentIdx;
          const isLineCompleted = currentIdx > index;
          
          // Check if waiting for Admin Verification
          const isWaitingDocs = isActive && step.id === 'docs' && isDocumentPending;
          const isWaitingPayment = isActive && step.id === 'payment' && pendingPaymentStep;

          let badgeContent = null;
          if (isWaitingDocs || isWaitingPayment) {
            badgeContent = (
              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200 text-[10px] font-semibold mt-2 text-center leading-tight">
                <Clock className="w-3 h-3" /> Verifikasi
              </span>
            );
          } else if (isActive) {
            badgeContent = (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-semibold mt-2 text-center leading-tight">
                Aktif
              </span>
            );
          } else if (isCompleted) {
             badgeContent = (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 text-[10px] font-semibold mt-2 text-center leading-tight">
                <Check className="w-3 h-3" /> Selesai
              </span>
            );
          }

          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Column */}
              <div 
                className="flex flex-col items-center group cursor-pointer z-10 w-28 shrink-0" 
                onClick={() => onNavigate(step.tab)}
              >
                {/* Circle */}
                <div 
                  className={\`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10 shadow-sm border-2 \${
                    isCompleted 
                      ? 'bg-green-500 text-white border-green-500' 
                      : (isWaitingDocs || isWaitingPayment)
                        ? 'bg-yellow-50 text-yellow-600 border-yellow-400'
                        : isActive 
                          ? 'bg-white text-blue-600 border-blue-500 ring-4 ring-blue-50' 
                          : 'bg-white border-gray-200 text-gray-400'
                  }\`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>

                {/* Text Label & Badge */}
                <div className="mt-4 flex flex-col items-center text-center">
                  <p className={\`text-xs font-bold leading-snug \${(isActive || isCompleted) ? 'text-gray-900' : 'text-gray-400'}\`}>
                    {step.label}
                  </p>
                  {badgeContent}
                </div>
              </div>

              {/* Connecting Line (except for last item) */}
              {index !== steps.length - 1 && (
                <div className={\`flex-1 h-1.5 mt-5 mx-2 rounded-full transition-colors duration-500 \${isLineCompleted ? 'bg-green-500' : 'bg-gray-100'}\`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/RegistrationStepper.tsx', content);
