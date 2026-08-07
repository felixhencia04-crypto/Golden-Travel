import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE UNCAUGHT ERROR:', err.message));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHTML = await page.$eval('#root', el => el.innerHTML).catch(() => 'Failed to get root');
  console.log('ROOT HTML LENGTH:', rootHTML.length);
  
  await browser.close();
})();
