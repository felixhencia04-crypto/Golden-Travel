async function run() {
  const fetch = (await import('node-fetch')).default;
  try {
    const res = await fetch('http://localhost:3000/api/admin/packages/14d2eeef-132c-4b93-b531-d08503bd3504', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'mock-admin': 'true' }
    });
    console.log(res.status, await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
