import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import NodeCache from 'node-cache';

// Constants
const FETCH_TIMEOUT = 10000; // 10 seconds timeout for fetch requests
const RETRY_DELAY = 10000; // 10 seconds delay between retries
const MAX_RETRIES = 3; // Maximum number of retries for failed requests
const CACHE_TTL = 600; // Cache time-to-live in seconds (10 minutes)

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Helper function to introduce a delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Random User-Agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// Proxy rotation (optional)
const PROXY_LIST = process.env.PROXY_LIST?.split(',') || []; // Set your proxy list in environment variables
let proxyIndex = 0;

const getNextProxy = () => {
  if (PROXY_LIST.length === 0) return null;
  proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
  return PROXY_LIST[proxyIndex];
};

// Base URLs for different news categories
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

/**
 * Fetches a URL with timeout, retry logic, and proxy rotation.
 * @param {string} url - The URL to fetch.
 * @param {number} retries - Number of retries left.
 * @returns {Promise<Response>} - The fetch response.
 */
async function fetchWithTimeout(url, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers = {
      'User-Agent': getRandomUserAgent(),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://www.investing.com/',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    };

    const options = {
      signal: controller.signal,
      headers,
    };

    // Add proxy if configured
    const proxyUrl = getNextProxy();
    if (proxyUrl) {
      options.agent = new HttpsProxyAgent(proxyUrl);
    }

    const response = await fetch(url, options);
    clearTimeout(timeout);

    // Check for CAPTCHA or blocking
    const body = await response.text();
    if (body.includes('CAPTCHA') || body.includes('blocked')) {
      throw new Error('Blocked by CAPTCHA or anti-bot measure');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeout);
    console.error(`Error fetching ${url}:`, error.message);

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
 * Scrapes news articles from a specified category URL.
 * @param {string} url - The base URL of the news category.
 * @param {number} page - The page number to scrape.
 * @returns {Promise<{newsItems: Array, totalPages: number}>} - Scraped news items and total pages.
 */
async function scrapeGeneralNews(url, page = 1) {
  const cacheKey = `${url}-${page}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const fullUrl = `${url}/${page}`;
    const response = await fetchWithTimeout(fullUrl);
    const body = await response.text();
    const $ = cheerio.load(body);
    const newsItems = [];

    // Extract news items
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

      if (title && articleUrl) {
        newsItems.push({ title, url: articleUrl, imageUrl, description, timestamp, author });
      }
    });

    // Extract total pages for pagination
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
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error scraping general news:', error.message);
    return { newsItems: [], totalPages: 1 };
  }
}

// Specialized scraper for Breaking News with stock data
export async function scrapeBreakingNews(page = 1) {
  const url = `${CATEGORY_URLS.breakingNews}/${page}`;
  try {
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
        });
      }
    });

    return { newsItems, totalPages: 1 }; // No pagination for breaking news
  } catch (error) {
    console.error('Error scraping Breaking News:', error);
    return { newsItems: [], totalPages: 1 };
  }
}

// Scrape detailed content from a specific article URL
export async function scrapeNewsDetails(url) {
  try {
    if (!url || url === 'No URL available') {
      throw new Error('Invalid URL provided');
    }

    const response = await fetchWithTimeout(url);
    const body = await response.text();
    const $ = cheerio.load(body);

    const articleImage = $('div.mb-5.mt-4.sm\\:mt-8.md\\:mb-8 img').attr('src') || '';
    const contentElements = $('div.article_WYSIWYG__O0uhw').children();
    let articleContent = '';

    contentElements.each((_, element) => {
      const tag = $(element).prop('tagName').toLowerCase();
      const htmlContent = $(element).html();

      if (tag === 'img' && $(element).attr('src') === articleImage) return; // Skip duplicate image

      if (tag === 'h2') articleContent += `<h2>${htmlContent}</h2>`;
      else if (tag === 'p') articleContent += `<p>${htmlContent}</p>`;
      else if (tag === 'a') articleContent += `<a href="${$(element).attr('href')}" class="text-blue-600 hover:underline">${htmlContent}</a>`;
      else if (tag === 'strong') articleContent += `<strong>${htmlContent}</strong>`;
      else articleContent += `<div>${htmlContent}</div>`;
    });

    return { content: articleContent || 'No detailed content available', articleImage };
  } catch (error) {
    console.error(`Error scraping news details from ${url}:`, error);
    return { content: 'No detailed content available', articleImage: '' };
  }
}

// Export functions for specific categories
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