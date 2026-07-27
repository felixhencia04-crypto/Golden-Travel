const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, 'secret');
const unverifiedDecoded = jwt.decode(token);
console.log(unverifiedDecoded);
