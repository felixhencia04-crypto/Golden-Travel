async function run() {
  const res = await fetch('http://localhost:3000/api/admin/packages/123', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log(res.status, await res.text());
}
run();
