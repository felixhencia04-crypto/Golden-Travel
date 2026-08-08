import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const style = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return 'No root';
    const firstChild = root.firstElementChild;
    if (!firstChild) return 'No first child';
    return firstChild.getAttribute('style') || 'No style';
  });
  console.log('Style:', style);
  await browser.close();
})();
