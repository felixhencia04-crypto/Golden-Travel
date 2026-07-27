import fs from 'fs';

function testLogic() {
  let currentIdx = 3; // e.g. documents_uploaded
  let computedPaymentStep = 'dp1';
  
  if (computedPaymentStep === 'dp1' || computedPaymentStep === 'dp2' || computedPaymentStep === 'lunas') currentIdx = Math.max(currentIdx, 4);
  
  console.log("currentIdx:", currentIdx);
}
testLogic();
