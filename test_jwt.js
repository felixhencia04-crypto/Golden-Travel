const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, 'secret');
const decoded = jwt.decode(token);
console.log(decoded);
