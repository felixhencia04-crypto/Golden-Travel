const jwt = require('jsonwebtoken');
try {
  jwt.verify("not.a.token", 'secret');
} catch (e) {
  console.log(e.name, e.message);
}
