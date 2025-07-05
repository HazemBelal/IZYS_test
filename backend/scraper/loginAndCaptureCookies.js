// loginAndCaptureCookies.js
import puppeteer from 'puppeteer';
import fs           from 'fs';

// re-use your delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // 1) Go to Investing.com
  await page.goto('https://www.investing.com', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // 2) Dismiss GDPR/consent banner
  try {
    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
    await page.click('#onetrust-accept-btn-handler');
    console.log('✔️ Closed consent banner');
  } catch {
    console.log('ℹ️  No consent banner found');
  }

  // 3) Dismiss newsletter pop-up
  try {
    await page.waitForSelector('.newsletterPopUp .popupCloseIcon', { timeout: 5000 });
    await page.click('.newsletterPopUp .popupCloseIcon');
    console.log('✔️ Closed newsletter pop-up');
  } catch {
    console.log('ℹ️  No newsletter pop-up found');
  }

  // 4) Wait 2 seconds for any page JS to settle
  await delay(2000);

  // 5) Capture cookies
  const cookies = await page.cookies();
  fs.writeFileSync(
    'investing-cookies.json',
    JSON.stringify(cookies, null, 2)
  );
  console.log(`💾 Saved ${cookies.length} cookies to investing-cookies.json`);

  await browser.close();
})();
