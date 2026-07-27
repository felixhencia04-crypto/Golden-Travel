import fs from 'fs';

// 1. Update RegistrationStepper.tsx
let stepperContent = fs.readFileSync('src/components/RegistrationStepper.tsx', 'utf8');

stepperContent = stepperContent.replace(
  '  pendingPaymentStep?: string;',
  '  pendingPaymentStep?: string;\n  computedPaymentStep?: string;'
);

stepperContent = stepperContent.replace(
  '  selectedPackageName,',
  '  selectedPackageName,\n  computedPaymentStep,'
);

const newSwitchLogic = `
  // Override based on currentStatus for realistic flow
  switch (currentStatus) {
    case 'bio_filled': currentIdx = Math.max(currentIdx, 2); break;
    case 'documents_uploaded': currentIdx = Math.max(currentIdx, 3); break;
    case 'dp1_paid': currentIdx = Math.max(currentIdx, 4); break;
    case 'dp2_paid': currentIdx = Math.max(currentIdx, 5); break;
    case 'fully_paid': currentIdx = Math.max(currentIdx, 6); break;
    case 'visa_ticket_ready': currentIdx = Math.max(currentIdx, 7); break;
  }
  
  if (computedPaymentStep === 'dp1' || computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') currentIdx = Math.max(currentIdx, 4);
  if (computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') currentIdx = Math.max(currentIdx, 5);
  if (computedPaymentStep === 'lunas') currentIdx = Math.max(currentIdx, 6);
`;

stepperContent = stepperContent.replace(
  /  \/\/ Override based on currentStatus for realistic flow[\s\S]*?case 'visa_ticket_ready': currentIdx = Math\.max\(currentIdx, 7\); break;\n  \}/,
  newSwitchLogic
);

fs.writeFileSync('src/components/RegistrationStepper.tsx', stepperContent);

// 2. Update DashboardJamaah.tsx
let dashContent = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');
dashContent = dashContent.replace(
  'pendingPaymentStep={pendingPaymentStep}',
  'pendingPaymentStep={pendingPaymentStep}\n                    computedPaymentStep={computedPaymentStep}'
);
fs.writeFileSync('src/pages/DashboardJamaah.tsx', dashContent);

console.log("Stepper updated");
