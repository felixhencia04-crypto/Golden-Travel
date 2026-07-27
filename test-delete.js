async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/packages/561fcfa3-1632-4d43-ac9b-7ff13d25260a', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + 'dummy_admin_token' }
    });
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
