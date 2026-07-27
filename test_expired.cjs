const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, 'secret', { expiresIn: '-1h' });
try {
  jwt.verify(token, 'secret');
} catch (e) {
  console.log(e.name, e.message);
}
