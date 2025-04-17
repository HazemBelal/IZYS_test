// loginAndCaptureCookies.js
import puppeteer from 'puppeteer';
import fs from 'fs';

// Helper function for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  // Launch the browser (set headless: false so you can see the window)
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  // Navigate to Investing.com. Adjust the URL if you have a specific login page.
  await page.goto('https://www.investing.com', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('Page loaded, please log in or dismiss the popup manually.');

  // Wait 15 seconds for you to interact manually. Adjust the time as needed.
  await delay(15000);

  // Capture cookies from the current session.
  const cookies = await page.cookies();
  console.log('Captured cookies:', cookies);

  // Save the cookies to a file.
  fs.writeFileSync('investing-cookies.json', JSON.stringify(cookies, null, 2));
  console.log('Cookies saved to investing-cookies.json');

  await browser.close();
})();
