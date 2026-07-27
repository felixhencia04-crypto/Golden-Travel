async function run() {
  const res = await fetch('https://ais-dev-ictbclzw5k4lfgp6fszunb-813853610188.asia-east1.run.app/api/admin/users', {
    headers: { 'Authorization': 'Bearer bad_token' }
  });
  console.log(res.status, await res.text());
}
run();
