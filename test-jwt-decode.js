import jwt from 'jsonwebtoken';
const token = jwt.sign({ user_id: '123', sub: '123', email: 'test@test.com' }, 'secret');
const decoded = jwt.decode(token);
console.log(decoded);
