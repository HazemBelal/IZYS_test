// cookieHelper.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COOKIE_FILE_PATH = path.join(__dirname, 'investing-cookies.json');
const TRADINGVIEW_COOKIE_PATH = path.join(__dirname, 'tradingview-cookies.json');


// Function to load cookies from a file
export function loadCookies(filePath = COOKIE_FILE_PATH) {
  try {
    const cookiesJson = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(cookiesJson);
  } catch (error) {
    console.error('Error loading cookies:', error);
    return [];
  }
}

// New function specifically for loading TradingView cookies
export async function loadTradingViewCookies() {
  try {
    const cookiesJson = await fs.promises.readFile(TRADINGVIEW_COOKIE_PATH, 'utf8');
    return JSON.parse(cookiesJson);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️ tradingview-cookies.json not found. Some news features may not work. Please run the login script.');
    } else {
      console.error('Error loading TradingView cookies:', error);
    }
    return [];
  }
}

// Function to save cookies to a file
export function saveCookies(cookies, filePath = COOKIE_FILE_PATH) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
    console.log(`Cookies saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

export function formatCookies(cookies) {
  // Convert the cookie objects into a single header string:
  // "cookieName1=cookieValue1; cookieName2=cookieValue2; ..."
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}
