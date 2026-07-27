import fetch from 'node-fetch';
const base64Str = 'data:image/png;base64,' + 'A'.repeat(2.7 * 1024 * 1024);
fetch('http://localhost:3000/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4NDNkMjE2LTM0ODAtNDMwOS04YjU5LTdhZjQ4Mzk2OGVhMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzg0OTk2MDE0fQ.xs29DDBAfYnq8VtHWhyrNz9NSZC5eTnZEWPLu1jJjkU'
  },
  body: JSON.stringify({
    registrationId: "8b40b408-c300-452f-aad0-9cda11d8aa49",
    paymentType: "dp1",
    amount: "4500000",
    proofUrl: base64Str
  })
}).then(r => r.text()).then(console.log).catch(console.error);
