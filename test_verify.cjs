const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, 'secret', { expiresIn: '1d' });
try {
  const decoded = jwt.verify(token, 'secret');
  console.log('success', decoded);
} catch (e) {
  console.log('failed', e);
}
