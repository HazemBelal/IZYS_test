import * as cheerio from 'cheerio';
import axios from 'axios';
import { createClient } from 'redis';
import { loadCookies, formatCookies } from './cookieHelper.js';

// --- (Puppeteer has been removed) ---

// Constants
const FETCH_TIMEOUT = 30000; // 30 seconds timeout for HTTP requests
const RETRY_DELAY = 5000;    // 5 seconds delay between retries
const MAX_RETRIES = 3;       // Maximum number of retries for failed requests
const NEWS_CACHE_TTL = 600;  // TTL for news list pages: 10 minutes
const DETAIL_CACHE_TTL = 3600; // TTL for article details: 1 hour

// --- Redis Cache Setup ---
const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err));
(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis for news scraper.');
  } catch (err) {
    console.error('❌ Redis connection for news scraper FAILED:', err);
  }
})();


async function getCache(key) {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
}

async function setCache(key, value, ttl) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis setCache error:', error);
  }
}


// -------------------
// Helper Functions
// -------------------
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:112.0) Gecko/20100101 Firefox/112.0',
];
const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// --- (autoScroll and Puppeteer-specific proxy logic removed) ---

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
    
    // Handle "10 hours ago" format from breaking news
    const hoursAgoMatch = lowerCaseTimestamp.match(/(\d+)\s+hours\s+ago/);
    if (hoursAgoMatch) {
        now.setHours(now.getHours() - parseInt(hoursAgoMatch[1], 10));
        return now;
    }

    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }

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
 * Fetches a URL with timeout, retry logic, and a rotating user-agent using Axios.
 *
 * @param {string} url - The URL to fetch.
 * @param {number} retries - Number of retries left.
 * @returns {Promise<string>} - The HTML content of the page.
 */
async function fetchWithAxios(url, retries = MAX_RETRIES) {
  try {
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.investing.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    
    // Load and format cookies for the Authorization header if needed by the site.
    // For many sites, this isn't necessary for public news.
    const cookies = loadCookies();
    if (cookies.length > 0) {
      headers['Cookie'] = formatCookies(cookies);
    }

    const response = await axios.get(url, { headers, timeout: FETCH_TIMEOUT });
    return response.data;

  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);

    if (retries > 0) {
      console.log(`Retrying... attempts left: ${retries}`);
      await delay(RETRY_DELAY);
      return fetchWithAxios(url, retries - 1);
    } else {
      throw new Error(`Failed to fetch ${url} after ${MAX_RETRIES} retries.`);
    }
  }
}

/**
 * Scrapes news articles from a specified category URL and page number.
 * Uses lightweight Axios and Cheerio for high performance.
 *
 * @param {string} url - The base URL of the news category.
 * @param {number} page - The page number to scrape.
 * @returns {Promise<{newsItems: Array, totalPages: number}>}
 */
async function scrapeGeneralNews(url, page = 1) {
  const cacheKey = `news:${url}-${page}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    console.log(`CACHE HIT for news: ${cacheKey}`);
    return cachedData;
  }
  console.log(`CACHE MISS for news: ${cacheKey}`);

  const fullUrl = page > 1 ? `${url}/${page}` : url;
  const body = await fetchWithAxios(fullUrl);
  const $ = cheerio.load(body);
  const newsItems = [];

  $('article[data-test="article-item"]').each((_, element) => {
    const title = $(element).find('a[data-test="article-title-link"]').text().trim();
    let articleUrl = $(element).find('a[data-test="article-title-link"]').attr('href');
    if (articleUrl && !articleUrl.startsWith('http')) {
      articleUrl = `https://www.investing.com${articleUrl}`;
    }
    const imageUrl = $(element).find('img[data-test="item-image"]').attr('src') || '';
    const description = $(element).find('p[data-test="article-description"]').text().trim() || 'No description available';
    const timestamp = $(element).find('time[data-test="article-publish-date"]').text().trim();
    const author = $(element).find('span[data-test="news-provider-name"]').text().trim() || 'Unknown Author';
    const publishDate = parseTimestamp(timestamp);

    if (title && articleUrl) {
      newsItems.push({ title, url: articleUrl, imageUrl, description, timestamp, author, publishDate: publishDate.toISOString() });
    }
  });

  newsItems.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  let totalPages = 1;
  const paginationSelector = 'div[data-test="pagination"] a:not([data-test="pagination-next"])';
  const lastPageElem = $(paginationSelector).last();
  if (lastPageElem.length > 0) {
      const lastPageText = lastPageElem.text().trim();
      const pageNum = parseInt(lastPageText, 10);
      if (!isNaN(pageNum)) {
          totalPages = pageNum;
      }
  }
  
  const result = { newsItems, totalPages };
  await setCache(cacheKey, result, NEWS_CACHE_TTL);
  return result;
}

/**
 * Scrapes detailed content from a specific article URL using Axios and Cheerio.
 *
 * @param {string} url - The URL of the news article.
 * @returns {Promise<{content: string, articleImage: string}>}
 */
export async function scrapeNewsDetails(url) {
  const cacheKey = `detail:${url}`;
  const cachedDetail = await getCache(cacheKey);
  if (cachedDetail) {
    console.log(`CACHE HIT for detail: ${url}`);
    return cachedDetail;
  }
  console.log(`CACHE MISS for detail: ${url}`);
  
  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL provided for scraping details.');
  }

  const body = await fetchWithAxios(url);
  const $ = cheerio.load(body);

  const articleWrapper = $('div.article_WYSIWYG__O0uhw');

  // Standard content cleanup
  articleWrapper.find('p:contains("3rd party Ad.")').remove();
  articleWrapper.find('a:contains("Unlock ProPicks AI")').closest('p').remove();
  articleWrapper.find('p:contains("remove ads")').remove();
  articleWrapper.find('p').each((_, el) => {
    if ($(el).text().trim() === '' && $(el).find('img').length === 0) {
      $(el).remove();
    }
  });

  const articleImage = $('div.relative.mb-5.mt-4 > img').attr('src') || '';
  const articleContent = articleWrapper.html();

  const result = { content: articleContent || 'No detailed content available', articleImage };
  await setCache(cacheKey, result, DETAIL_CACHE_TTL);
  return result;
}
export async function scrapeBreakingNews(page = 1) {
  const cacheKey = `news:breaking-news-${page}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
      console.log(`CACHE HIT for breaking news: ${cacheKey}`);
      return cachedData;
  }
  console.log(`CACHE MISS for breaking news: ${cacheKey}`);
  
  const url = `${CATEGORY_URLS.breakingNews}`;
  const body = await fetchWithAxios(url);
  const $ = cheerio.load(body);
  const newsItems = [];

  $('div.grid.gap-x-6 > div').each((_, element) => {
    const title = $(element).find('a[data-test="head-title"]').text().trim();
    let articleUrl = $(element).find('a[data-test="head-title"]').attr('href');
    if (articleUrl && !articleUrl.startsWith('http')) {
      articleUrl = `https://www.investing.com${articleUrl}`;
    }

    const timestamp = $(element).find('time').attr('datetime'); // Use datetime for better parsing
    const author = $(element).find('a[data-test="provider-link"]').text().trim() || 'Investing.com';
    const publishDate = parseTimestamp(timestamp);

    if (title && articleUrl) {
      newsItems.push({
        title,
        url: articleUrl,
        imageUrl: '', // No distinct image in this layout
        description: '', // No description
        timestamp: timestamp || new Date().toISOString(),
        author,
        stockData: [],
        publishDate: publishDate.toISOString()
      });
    }
  });
  
  newsItems.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  const result = { newsItems, totalPages: 1 };
  await setCache(cacheKey, result, NEWS_CACHE_TTL);
  return result;
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

// --- No longer exporting fetchWithTimeout ---
