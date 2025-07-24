import axios from 'axios';
import { loadTradingViewCookies, formatCookies } from './cookieHelper.js';

const NEWS_LIST_API = 'https://news-mediator.tradingview.com/news-flow/v2/news';
const NEWS_DETAIL_API = 'https://news-headlines.tradingview.com/v3/story';

const FETCH_TIMEOUT = 30000;

/**
 * Fetches the list of news articles from TradingView's API.
 * @param {string[]} markets - An array of markets to filter by (e.g., ['stock', 'crypto']).
 * @param {string[]} [countries] - An optional array of country codes to filter by (e.g., ['US', 'IN']).
 * @returns {Promise<Object>} - The API response containing the list of news items.
 */
export async function getNewsList(markets = ['stock', 'crypto', 'forex', 'indices', 'futures', 'etf', 'bond', 'economy'], countries = []) {
  
  // Manually build the query string to exactly match the API's expected format
  const params = new URLSearchParams({
    client: 'screener',
    streaming: 'true',
  });
  params.append('filter', 'lang:en');
  if (markets.length > 0) {
    // CRITICAL: The API requires market filters to be alphabetically sorted.
    markets.sort();
    params.append('filter', `market:${markets.join(',')}`);
  }
  if (countries.length > 0) {
    // CRITICAL: The API also requires country filters to be alphabetically sorted.
    countries.sort();
    params.append('filter', `market_country:${countries.join(',')}`);
  }

  const finalUrl = `${NEWS_LIST_API}?${params.toString()}`;
  console.log('--- Calling TradingView News API ---');
  console.log('Final URL:', finalUrl);

  const cookies = await loadTradingViewCookies();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Referer': 'https://www.tradingview.com/',
  };

  if (cookies.length > 0) {
    headers['Cookie'] = formatCookies(cookies);
  }

  try {
    // Pass the fully constructed URL directly to axios, without a 'params' object
    const response = await axios.get(finalUrl, {
      headers,
      timeout: FETCH_TIMEOUT,
    });
    return response.data;
  } catch (error) {
    console.error('--- Detailed Axios Error ---');
    console.error('Request URL:', error.config?.url);
    console.error('Request Headers:', JSON.stringify(error.config?.headers, null, 2));
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Authentication error (401/403). Your TradingView session cookies might be invalid or expired. Please run the login script again.');
      }
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('--- End Detailed Axios Error ---');

    throw error;
  }
}

/**
 * Fetches the detailed content of a single news story.
 * @param {string} storyId - The ID of the story to fetch.
 * @returns {Promise<Object>} - The API response containing the story details.
 */
export async function getNewsDetail(storyId) {
  if (!storyId) {
    throw new Error('Story ID is required.');
  }
  
  const params = {
    id: storyId,
    lang: 'en',
  };
  
  const cookies = await loadTradingViewCookies();
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Referer': 'https://www.tradingview.com/',
  };

  if (cookies.length > 0) {
    headers['Cookie'] = formatCookies(cookies);
  }

  try {
    const response = await axios.get(NEWS_DETAIL_API, {
      params,
      headers,
      timeout: FETCH_TIMEOUT,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching TradingView news detail for ID ${storyId}:`, error.message);
    if (error.response?.status === 401) {
        console.error('Authentication error. Your TradingView session cookies might be invalid or expired. Please run the login script again.');
    }
    throw error;
  }
} 