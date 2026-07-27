async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/packages/14d2eeef-132c-4b93-b531-d08503bd3504', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Paket Umroh Reguler 9 Hari Updated', description: ['test'], price: 100, duration: '9', type: 'umroh' })
    });
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
