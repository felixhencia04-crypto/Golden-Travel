const { execSync } = require('child_process');
try {
  console.log(execSync('npm run db:push').toString());
} catch (e) {
  console.error(e.stdout ? e.stdout.toString() : e.message);
  console.error(e.stderr ? e.stderr.toString() : '');
}
