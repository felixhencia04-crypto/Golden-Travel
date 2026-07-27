import fetch from 'node-fetch';
fetch('http://localhost:3000/api/payments/495b778c-3318-43e1-a05b-61ffd8a1e488/verify', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + 'invalid'
  },
  body: JSON.stringify({ status: 'approved' })
}).then(r => r.text()).then(console.log).catch(console.error);
