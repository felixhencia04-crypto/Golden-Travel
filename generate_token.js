import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: "5843d216-3480-4309-8b59-7af483968ea3", role: 'user' }, 'golden-travel-super-secret-key-2026');
console.log(token);
