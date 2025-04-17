// cookieHelper.js
import fs from 'fs';

export function loadCookies() {
  try {
    // Read the JSON file that contains the cookies
    const cookiesRaw = fs.readFileSync('investing-cookies.json', 'utf-8');
    const cookies = JSON.parse(cookiesRaw);
    return cookies;
  } catch (error) {
    console.error('Error loading cookies:', error);
    return [];
  }
}

export function formatCookies(cookies) {
  // Convert the cookie objects into a single header string:
  // "cookieName1=cookieValue1; cookieName2=cookieValue2; ..."
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}
