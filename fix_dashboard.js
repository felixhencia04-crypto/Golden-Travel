import fs from 'fs';

let content = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');

// 1. Insert computedPaymentStep at the top of the component
content = content.replace(
  "  const userConsultation = registration;",
  `  const userConsultation = registration;
  const paymentsList = (userConsultation as any)?.payments || [];
  const approvedDp1 = paymentsList.some((p: any) => p.paymentType === 'dp1' && p.status === 'approved');
  const approvedDp2 = paymentsList.some((p: any) => p.paymentType === 'dp2' && p.status === 'approved');
  const approvedFull = paymentsList.some((p: any) => p.paymentType === 'full' && p.status === 'approved');
  let computedPaymentStep = 'none';
  if (approvedFull) computedPaymentStep = 'lunas';
  else if (approvedDp2) computedPaymentStep = 'dp2';
  else if (approvedDp1) computedPaymentStep = 'dp1';`
);

// 2. Replace userConsultation?.paymentStep and userConsultation.paymentStep with computedPaymentStep
content = content.replace(/userConsultation\?\.paymentStep/g, 'computedPaymentStep');
content = content.replace(/userConsultation\.paymentStep/g, 'computedPaymentStep');

// 3. Fix the payment submission logic
content = content.replace(
  "if (userConsultation.status === 'dp1_paid') nextPaymentStep = 'dp2';\n        else if (userConsultation.status === 'dp2_paid') nextPaymentStep = 'lunas';",
  `if (computedPaymentStep === 'dp1') nextPaymentStep = 'dp2';
        else if (computedPaymentStep === 'dp2') nextPaymentStep = 'lunas';`
);

// 4. Fix getRegistrationStepIdx
const oldIdxLogic = `    switch (userConsultation?.status) {
      case 'bio_filled': idx = Math.max(idx, 2); break;
      case 'documents_uploaded': idx = Math.max(idx, 3); break;
      case 'dp1_paid': idx = Math.max(idx, 4); break;
      case 'dp2_paid': idx = Math.max(idx, 5); break;
      case 'fully_paid': idx = Math.max(idx, 6); break;
      case 'visa_ticket_ready': idx = Math.max(idx, 7); break;
    }`;
const newIdxLogic = `    if (userConsultation?.paxData && userConsultation.paxData[0]?.isSubmitted) idx = Math.max(idx, 2);
    
    const requiredDocsCount = paxCount * 5;
    const uploadedDocsCount = Array.isArray(userConsultation?.documents) ? userConsultation.documents.length : 0;
    if (uploadedDocsCount >= requiredDocsCount && requiredDocsCount > 0) {
        idx = Math.max(idx, 3);
    }
    
    if (computedPaymentStep === 'dp1' || computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') idx = Math.max(idx, 4);
    if (computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') idx = Math.max(idx, 5);
    if (computedPaymentStep === 'lunas') idx = Math.max(idx, 6);
    
    if (userConsultation?.status === 'visa_ticket_ready') idx = Math.max(idx, 7);`;

content = content.replace(oldIdxLogic, newIdxLogic);

fs.writeFileSync('src/pages/DashboardJamaah.tsx', content);
console.log("DashboardJamaah updated!");
