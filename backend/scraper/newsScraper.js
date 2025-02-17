import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import NodeCache from 'node-cache';

// Constants
const FETCH_TIMEOUT = 10000; // 10 seconds timeout
const RETRY_DELAY = 10000; // 10 seconds delay between retries
const MAX_RETRIES = 3; // Max retries for failed requests
const CACHE_TTL = 600; // Cache time-to-live in seconds (10 minutes)

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Helper function to introduce a delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random User-Agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// Proxy rotation (optional)
const PROXY_LIST = process.env.PROXY_LIST?.split(',') || [];
let proxyIndex = 0;

const getNextProxy = () => {
  if (PROXY_LIST.length === 0) return null;
  proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
  return PROXY_LIST[proxyIndex];
};

/**
 * Fetches a URL with timeout, retry logic, and proxy rotation.
 * @param {string} url - The URL to fetch.
 * @param {number} retries - Number of retries left.
 * @returns {Promise<string>} - The HTML response.
 */
async function fetchWithTimeout(url, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Pragma': 'no-cache',
    };

    const options = {
      signal: controller.signal,
      headers,
    };

    // Add proxy if available
    const proxyUrl = getNextProxy();
    if (proxyUrl) {
      options.agent = new HttpsProxyAgent(proxyUrl);
    }

    const response = await fetch(url, options);
    clearTimeout(timeout);

    if (response.status === 403) {
      throw new Error(`403 Forbidden - Blocked by Investing.com`);
    }
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeout);
    console.error(`Error fetching ${url}:`, error.message);

    if (retries > 0) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds... (${retries} attempts left)`);
      await delay(RETRY_DELAY);
      return fetchWithTimeout(url, retries - 1);
    } else {
      throw new Error(`Failed to fetch ${url} after retries.`);
    }
  }
}
/**
 * Scrapes news articles from a specified category URL.
 * @param {string} url - The base URL of the news category.
 * @returns {Promise<{newsItems: Array, totalPages: number}>} - Scraped news items and total pages.
 */
async function scrapeGeneralNews(url) {
  const cacheKey = url;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetchWithTimeout(url);
    const $ = cheerio.load(response);
    const newsItems = [];

    $('div.news-analysis-v2_content__z0iLP, div.border-b').each((_, el) => {
      const titleElement = $(el).find('a');
      const title = titleElement.text().trim();
      let articleUrl = titleElement.attr('href');

      if (articleUrl && !articleUrl.startsWith('http')) {
        articleUrl = `https://www.investing.com${articleUrl}`;
      }

      const description = $(el).find('p[data-test="article-description"]').text().trim() || 'No description available';
      const timestamp = $(el).find('time[data-test="article-publish-date"]').text().trim() || 'Unknown time';
      const author = $(el).find('span[data-test="news-provider-name"]').text().trim() || 'Investing.com';

      if (title && articleUrl) {
        newsItems.push({ title, url: articleUrl, description, timestamp, author });
      }
    });

    const result = { newsItems, totalPages: 1 };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error scraping news:`, error.message);
    return { newsItems: [], totalPages: 1 };
  }
}

/**
 * Scrapes detailed content from a news article.
 * @param {string} articleUrl - The URL of the news article.
 * @returns {Promise<{title: string, content: string, author: string, date: string}>}
 */
export async function scrapeNewsDetails(articleUrl) {
  try {
    const response = await fetchWithTimeout(articleUrl);
    const $ = cheerio.load(response);

    const title = $('h1.articleHeader').text().trim();
    const content = $('div.WYSIWYG.articlePage').text().trim();
    const author = $('span[data-test="news-provider-name"]').text().trim() || 'Investing.com';
    const date = $('time[data-test="article-publish-date"]').text().trim() || 'Unknown Date';

    if (!title || !content) {
      throw new Error('Failed to scrape article details.');
    }

    return { title, content, author, date };
  } catch (error) {
    console.error(`Error scraping article details from ${articleUrl}:`, error.message);
    return { title: '', content: '', author: '', date: '' };
  }
}

// Exported scrapers
export const scrapeLatestNews = () => scrapeGeneralNews('https://www.investing.com/news/latest-news');
export const scrapeBreakingNews = () => scrapeGeneralNews('https://www.investing.com/news/headlines');
export const scrapeCryptoNews = () => scrapeGeneralNews('https://www.investing.com/news/cryptocurrency-news');
export const scrapeStockMarketNews = () => scrapeGeneralNews('https://www.investing.com/news/stock-market-news');
export const scrapeCommoditiesNews = () => scrapeGeneralNews('https://www.investing.com/news/commodities-news');
export const scrapeCurrenciesNews = () => scrapeGeneralNews('https://www.investing.com/news/forex-news');
export const scrapeEconomyNews = () => scrapeGeneralNews('https://www.investing.com/news/economy');
export const scrapeEconomicIndicatorsNews = () => scrapeGeneralNews('https://www.investing.com/news/economic-indicators');
export const scrapePoliticsNews = () => scrapeGeneralNews('https://www.investing.com/news/politics');
export const scrapeWorldNews = () => scrapeGeneralNews('https://www.investing.com/news/world-news');
export const scrapeCompanyNews = () => scrapeGeneralNews('https://www.investing.com/news/company-news');
