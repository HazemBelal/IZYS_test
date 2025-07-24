// loginAndCaptureCookies.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRADINGVIEW_COOKIES_PATH = path.join(__dirname, 'tradingview-cookies.json');
const TRADINGVIEW_LOGIN_URL = 'https://www.tradingview.com/#signin';

/**
 * Launches a browser for the user to log in to TradingView,
 * then captures and saves the session cookies.
 */
async function loginAndCaptureCookies() {
  console.log('🚀 Launching browser for TradingView login...');
  
  const browser = await puppeteer.launch({
    headless: false, // Must be false to allow for manual login
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800'],
  });

  const page = await browser.newPage();
  
  console.log(`Please log in to TradingView in the browser window...`);
  await page.goto(TRADINGVIEW_LOGIN_URL, { waitUntil: 'networkidle2' });

  // Wait for the user to navigate away from the login page, indicating success
  console.log('Waiting for successful login (navigation away from sign-in page)...');
  try {
    await page.waitForNavigation({ timeout: 300000 }); // 5-minute timeout
  } catch (error) {
    console.error('Login timeout. You must complete the login within 5 minutes.');
    await browser.close();
    return;
  }
  
  console.log('✅ Login successful! Adding a 5-second delay to ensure all cookies are set...');
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second hard delay
  
  console.log('Capturing cookies...');
  
  const cookies = await page.cookies();
  
  // Save all cookies for the tradingview.com domain
  const tradingViewCookies = cookies.filter(cookie => cookie.domain.includes('tradingview.com'));

  if (tradingViewCookies.length < 3) { // A basic check
      console.warn('⚠️ Found fewer than 3 cookies for TradingView. The session might not be fully authenticated.');
      console.log('Found cookies:', tradingViewCookies.map(c => c.name));
  }
  
  await fs.writeFile(TRADINGVIEW_COOKIES_PATH, JSON.stringify(tradingViewCookies, null, 2));
  console.log(`🍪 Successfully saved ${tradingViewCookies.length} cookies to ${TRADINGVIEW_COOKIES_PATH}`);


  await browser.close();
}

loginAndCaptureCookies().catch(err => {
  console.error('An error occurred during the cookie capture process:', err);
});
