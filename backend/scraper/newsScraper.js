import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import httpsProxyAgentPkg from 'https-proxy-agent';
import { createClient } from 'redis';
import { loadCookies, formatCookies } from './cookieHelper.js';

// --- Puppeteer Browser Management ---
let browserInstance = null;
async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) return browserInstance;

    console.log('🚀 Launching new persistent Puppeteer browser instance...');
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        // '--disable-gpu',        // Often not needed and can be unstable
        // '--single-process'     // Known to cause instability in persistent mode
    ];
    browserInstance = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args
    });

    browserInstance.on('disconnected', () => {
        console.log('Puppeteer browser disconnected. It will be relaunched on next request.');
        browserInstance = null;
    });

    return browserInstance;
}
// ---

// Constants
const FETCH_TIMEOUT = 60000; // 60 seconds timeout for page load
const RETRY_DELAY = 10000;   // 10 seconds delay between retries
const MAX_RETRIES = 3;       // Maximum number of retries for failed requests
const NEWS_CACHE_TTL = 600;  // TTL for news list pages: 10 minutes
const DETAIL_CACHE_TTL = 3600; // TTL for article details: 1 hour
const { HttpsProxyAgent } = httpsProxyAgentPkg;

// --- Redis Cache Setup ---
const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
await redisClient.connect();

async function getCache(key) {
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
}

async function setCache(key, value, ttl) {
  await redisClient.setEx(key, ttl, JSON.stringify(value));
}

// -------------------
// Helper Functions
// -------------------
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:112.0) Gecko/20100101 Firefox/112.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
];
const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

const PROXY_LIST = process.env.PROXY_LIST?.split(',') || [];
let proxyIndex = 0;
const getNextProxy = () => {
  if (PROXY_LIST.length === 0) return null;
  proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
  return PROXY_LIST[proxyIndex];
};

// A helper function to scroll the page slowly to trigger all lazy-loading
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

/**
 * Parses relative timestamps like "5 minutes ago" into Date objects.
 * @param {string} timestamp - The string to parse.
 * @returns {Date} - A Date object representing the absolute time.
 */
function parseTimestamp(timestamp) {
    const now = new Date();
    if (!timestamp) return now;

    const lowerCaseTimestamp = timestamp.toLowerCase();

    if (lowerCaseTimestamp.includes('just now')) {
        return now;
    }

    const minutesMatch = lowerCaseTimestamp.match(/(\d+)\s*m(inute)?s?\s*ago/);
    if (minutesMatch) {
        now.setMinutes(now.getMinutes() - parseInt(minutesMatch[1], 10));
        return now;
    }

    const hoursMatch = lowerCaseTimestamp.match(/(\d+)\s*h(our)?s?\s*ago/);
    if (hoursMatch) {
        now.setHours(now.getHours() - parseInt(hoursMatch[1], 10));
        return now;
    }

    // Handle full date formats like "MMM DD, YYYY" or "YYYY-MM-DD"
    // This is a simple attempt; a robust library might be better for more formats.
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Default to now if parsing fails, to avoid sorting errors
    return now;
}

const CATEGORY_URLS = {
  latest: 'https://www.investing.com/news/latest-news',
  breakingNews: 'https://www.investing.com/news/headlines',
  cryptocurrency: 'https://www.investing.com/news/cryptocurrency-news',
  stockMarkets: 'https://www.investing.com/news/stock-market-news',
  commodities: 'https://www.investing.com/news/commodities-news',
  currencies: 'https://www.investing.com/news/forex-news',
  economy: 'https://www.investing.com/news/economy',
  economicIndicators: 'https://www.investing.com/news/economic-indicators',
  politics: 'https://www.investing.com/news/politics',
  world: 'https://www.investing.com/news/world-news',
  companyNews: 'https://www.investing.com/news/company-news',
};

// -------------------
// Scraper Functions
// -------------------

/**
 * Fetches a URL with timeout, retry logic, and proxy rotation.
 * Uses Puppeteer in headless mode to load the page and dismiss the login popup.
 * Returns a pseudo-response object with a text() method.
 *
 * @param {string} url - The URL to fetch.
 * @param {number} retries - Number of retries left.
 * @returns {Promise<Object>} - Pseudo-response with a text() method.
 */
async function fetchWithTimeout(url, retries = MAX_RETRIES) {
  let page = null;
  // Note: Proxy rotation is disabled when using a persistent browser instance
  // as proxies must be set at browser launch.
  // const proxyUrl = getNextProxy();

  try {
    // 1) Get the persistent browser instance
    const browser = await getBrowser();

    // 2) open a page and set headers / user agent
    page = await browser.newPage();

    // --- Start: Request Interception to block non-essential resources ---
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
    // --- End: Request Interception ---

    await page.setUserAgent(getRandomUserAgent());
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.investing.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    // 3) optionally load saved cookies
    const cookies = loadCookies();
    if (cookies.length) {
      await page.setCookie(...cookies);
    }

    // 4) navigate with timeout
    console.log(`Attempting to fetch URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: FETCH_TIMEOUT });
    console.log(`Page loaded: ${url}`);

    // Scroll to bottom to trigger any lazy-loaded content
    await autoScroll(page);

    // 5) dismiss any login popup
    await delay(500);
    const modal = await page.$('div[role="dialog"]');
    if (modal) {
      console.log("Login popup detected; clicking outside to dismiss.");
      await page.mouse.click(10, 10);
      await delay(500);
    } else {
      console.log("No login popup detected; proceeding.");
    }

    // 6) grab the HTML and return
    const html = await page.content();
    console.log(`Fetched content length: ${html.length}`);
    await page.close(); // Close the page, not the browser
    return { text: async () => html };
  } catch (error) {
    // ensure page is closed on error
    if (page) await page.close().catch(e => console.error("Error closing page on failure:", e.message));

    console.error(`Error fetching ${url}:`, error.message);

    // If the browser crashed, force a full restart on the next attempt
    if (error.message.includes('Protocol error') && browserInstance) {
        console.log('Browser has likely crashed. Attempting to close and nullify the instance.');
        await browserInstance.close().catch(e => console.error("Error closing crashed browser instance:", e.message));
        browserInstance = null;
    }

    // retry logic
    if (retries > 0) {
      console.log(`Retrying... attempts left: ${retries}`);
      await delay(RETRY_DELAY);
      return fetchWithTimeout(url, retries - 1);
    } else {
      throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} retries.`);
    }
  }
}

/**
 * Scrapes news articles from a specified category URL and page number.
 * Uses Redis caching to speed up responses.
 *
 * @param {string} url - The base URL of the news category.
 * @param {number} page - The page number to scrape.
 * @returns {Promise<{newsItems: Array, totalPages: number}>}
 */
async function scrapeGeneralNews(url, page = 1) {
  const cacheKey = `${url}-${page}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) return cachedData;

  const fullUrl = `${url}/${page}`;
  const response = await fetchWithTimeout(fullUrl);
  const body = await response.text();
  const $ = cheerio.load(body);
  const newsItems = [];

  $('article[data-test="article-item"]').each((_, element) => {
    const title = $(element).find('a[data-test="article-title-link"]').text().trim();
    let articleUrl = $(element).find('a[data-test="article-title-link"]').attr('href');
    if (articleUrl && !articleUrl.startsWith('http')) {
      articleUrl = `https://www.investing.com${articleUrl}`;
    }
    const imageUrl = $(element).find('img[data-test="item-image"]').attr('src') || $(element).find('img').attr('src') || '';
    const description = $(element).find('p[data-test="article-description"]').text().trim() || 'No description available';
    const timestamp = $(element).find('time[data-test="article-publish-date"]').text().trim();
    const author = $(element).find('span[data-test="news-provider-name"]').text().trim() || 'Unknown Author';
    const publishDate = parseTimestamp(timestamp);

    if (title && articleUrl) {
      newsItems.push({ title, url: articleUrl, imageUrl, description, timestamp, author, publishDate: publishDate.toISOString() });
    }
  });

  // Sort news items by publish date, newest first
  newsItems.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  let totalPages = 1;
  const paginationElement = $('.mb-4.flex.select-none.justify-between');
  if (paginationElement.length) {
    const lastPageLink = paginationElement.find('a').last().attr('href');
    if (lastPageLink) {
      const pageMatch = lastPageLink.match(/\/(\d+)$/);
      if (pageMatch && pageMatch[1]) {
        totalPages = parseInt(pageMatch[1], 10);
      }
    }
  }

  const result = { newsItems, totalPages };
  await setCache(cacheKey, result, NEWS_CACHE_TTL);
  return result;
}

/**
 * Scrapes detailed content from a specific article URL.
 * Uses the Puppeteer-based fetchWithTimeout with cookies and dismiss popup simulation.
 * Caches the result in Redis.
 *
 * @param {string} url - The URL of the news article.
 * @returns {Promise<{content: string, articleImage: string}>}
 */
export async function scrapeNewsDetails(url) {
  const cacheKey = `detail-${url}`;
  const cachedDetail = await getCache(cacheKey);
  if (cachedDetail) return cachedDetail;

  if (!url || url === 'No URL available') {
    throw new Error('Invalid URL provided');
  }
  const response = await fetchWithTimeout(url);
  const body = await response.text();
  const $ = cheerio.load(body);

  // Remove any residual login/sign-up modal markup
  $('div[role="dialog"]').remove();
  $('[data-test="sign-up-dialog"]').remove();

  const articleWrapper = $('div.article_WYSIWYG__O0uhw');

  // --- Start Content Cleanup ---
  // 1. Remove specific ad text and "ProPicks" promotions
  articleWrapper.find('p:contains("3rd party Ad.")').remove();
  articleWrapper.find('a:contains("Unlock ProPicks AI")').closest('p').remove();
  articleWrapper.find('p:contains("remove ads")').remove();

  // 2. Remove empty paragraphs to clean up whitespace
  articleWrapper.find('p').each((_, el) => {
    if ($(el).text().trim() === '' && $(el).find('img').length === 0) {
      $(el).remove();
    }
  });
  // --- End Content Cleanup ---

  const articleImage = $('div.mb-5.mt-4.sm\\:mt-8.md\\:mb-8 img').attr('src') || '';
  const articleContent = articleWrapper.html(); // Get the cleaned HTML

  const result = { content: articleContent || 'No detailed content available', articleImage };
  await setCache(cacheKey, result, DETAIL_CACHE_TTL);
  return result;
}
export async function scrapeBreakingNews(page = 1) {
  const url = `${CATEGORY_URLS.breakingNews}/${page}`;
  const response = await fetchWithTimeout(url);
  const body = await response.text();
  const $ = cheerio.load(body);
  const newsItems = [];

  $('div.border-b').each((_, element) => {
    const title = $(element).find('a.text-sm.font-semibold').text().trim();
    let articleUrl = $(element).find('a.text-sm.font-semibold').attr('href');
    if (articleUrl && !articleUrl.startsWith('http')) {
      articleUrl = `https://www.investing.com${articleUrl}`;
    }

    const timestamp = $(element).find('time').text().trim();
    const author = $(element).find('span[title]').text().trim() || 'Unknown Author';
    const publishDate = parseTimestamp(timestamp);

    const stockData = [];
    $(element).find('.news-headlines-list-item_related-pairs__A0Hws div').each((_, stockElement) => {
      const stockName = $(stockElement).find('a span').first().text().trim();
      const stockChange = $(stockElement).find('span.flex-none').text().trim();
      const stockColor = $(stockElement).find('span').hasClass('text-positive-main') ? 'green' : 'red';

      if (stockName && stockChange) {
        stockData.push({ stockName, stockChange, stockColor });
      }
    });

    const imageUrl = $(element).find('img').first().attr('src') || '';
    if (title && articleUrl) {
      newsItems.push({
        title,
        url: articleUrl,
        imageUrl,
        timestamp,
        author,
        stockData,
        publishDate: publishDate.toISOString()
      });
    }
  });

  // Sort news items by publish date, newest first
  newsItems.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  return { newsItems, totalPages: 1 }; // No pagination for breaking news
}
// Export category-specific functions
export const scrapeLatestNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.latest, page);
export const scrapeCryptoNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.cryptocurrency, page);
export const scrapeStockMarketNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.stockMarkets, page);
export const scrapeCommoditiesNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.commodities, page);
export const scrapeCurrenciesNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.currencies, page);
export const scrapeEconomyNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.economy, page);
export const scrapeEconomicIndicatorsNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.economicIndicators, page);
export const scrapePoliticsNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.politics, page);
export const scrapeWorldNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.world, page);
export const scrapeCompanyNews = (page = 1) => scrapeGeneralNews(CATEGORY_URLS.companyNews, page);

// Export the main fetch function (if needed separately)
export { fetchWithTimeout };
