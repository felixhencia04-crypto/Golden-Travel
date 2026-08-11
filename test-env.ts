import http from 'http';
http.get('http://localhost:3000/src/main.tsx', (res) => {
  console.log(res.headers);
});
