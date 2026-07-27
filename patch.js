import fs from 'fs';
let content = fs.readFileSync('src/pages/DashboardJamaah.tsx', 'utf8');

// Replace file size limit
content = content.replace(/file\.size > 2 \* 1024 \* 1024/, 'file.size > 500 * 1024');
content = content.replace(/Ukuran file maksimal 2MB/, 'Ukuran file maksimal 500KB');

// Replace the input for amount to be read-only
content = content.replace(
  /<input \n                                  type="number"\n                                  placeholder="Contoh: 10000000"\n                                  className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 outline-none focus:border-gray-500 transition-all text-sm"\n                                  value={paymentForm.amount}\n                                  onChange={\(e\) => setPaymentForm\({...paymentForm, amount: e.target.value}\)}\n                                \/>/,
  `<input 
                                  type="text"
                                  readOnly
                                  className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-gray-200 outline-none text-gray-700 font-bold transition-all text-sm cursor-not-allowed"
                                  value={"Rp " + Number(currentPaymentAmount).toLocaleString('id-ID')}
                                />`
);

// We need to make sure handleConfirmPayment uses currentPaymentAmount
content = content.replace(
  /amount: paymentForm.amount,/,
  `amount: currentPaymentAmount.toString(),`
);

// And fix the validation in handleConfirmPayment
content = content.replace(
  /if \(!paymentForm.amount \|\| !paymentForm.proof\) {/,
  `if (!paymentForm.proof) {`
);

// Fix the disabled state of the button
content = content.replace(
  /disabled={!paymentForm.amount \|\| !paymentForm.proof}/,
  `disabled={!paymentForm.proof}`
);

content = content.replace(
  /!paymentForm.amount \|\| !paymentForm.proof \n                                    \? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'/,
  `!paymentForm.proof 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'`
);

fs.writeFileSync('src/pages/DashboardJamaah.tsx', content);
