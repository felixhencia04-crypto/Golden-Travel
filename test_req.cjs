const http = require('http');
const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026', { expiresIn: '1d' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/jamaah/registration',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log('Response:', res.statusCode, data); });
});

req.on('error', e => { console.error('Error:', e); });
req.end();
