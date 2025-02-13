import express from 'express';
import cors from 'cors';
import {
  scrapeLatestNews,
  scrapeBreakingNews,
  scrapeCryptoNews,
  scrapeStockMarketNews,
  scrapeCommoditiesNews,
  scrapeCurrenciesNews,
  scrapeEconomyNews,
  scrapeEconomicIndicatorsNews,
  scrapePoliticsNews,
  scrapeWorldNews,
  scrapeCompanyNews,
  scrapeNewsDetails,
} from '../scraper/newsScraper.js';

import { scrapeForexFactoryRange } from '../scraper/calendarScraper.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.investing.com; media-src 'self' https://*.investing.com data:; img-src 'self' https://*.investing.com data:; script-src 'self'; style-src 'self'"
  );
  next();
});

// Mapping category to corresponding scraper function
const categoryToScraper = {
  latest: scrapeLatestNews,
  'breaking-news': scrapeBreakingNews,
  cryptocurrency: scrapeCryptoNews,
  'stock-markets': scrapeStockMarketNews,
  commodities: scrapeCommoditiesNews,
  currencies: scrapeCurrenciesNews,
  economy: scrapeEconomyNews,
  'economic-indicators': scrapeEconomicIndicatorsNews,
  politics: scrapePoliticsNews,
  world: scrapeWorldNews,
  'company-news': scrapeCompanyNews,
};

// API Route: Scrape news by category and page
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'latest'; // Default to 'latest'
  const page = parseInt(req.query.page) || 1; // Default to page 1

  // Validate page number
  if (page < 1 || isNaN(page)) {
    return res.status(400).json({ error: 'Invalid page number.' });
  }

  // Get the scraper function for the specified category
  const scraper = categoryToScraper[category];
  if (!scraper) {
    return res.status(400).json({ error: 'Invalid category provided.' });
  }

  try {
    // Scrape news data
    const { newsItems, totalPages } = await scraper(page);

    // Check if news items were found
    if (newsItems.length === 0) {
      return res.status(404).json({ message: `No news found for category: ${category} on page: ${page}` });
    }

    // Return success response
    res.status(200).json({ newsItems, totalPages });
  } catch (error) {
    console.error(`Error fetching news for category: ${category}, page: ${page}`, error);
    res.status(500).json({ error: `Error fetching news for category: ${category}. Please try again later.` });
  }
});

// API Route: Scrape detailed content for a specific news item
app.get('/api/news/detail', async (req, res) => {
  const { url } = req.query;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'No URL provided for news detail.' });
  }

  try {
    // Scrape news details
    const newsDetails = await scrapeNewsDetails(decodeURIComponent(url));
    res.status(200).json(newsDetails);
  } catch (error) {
    console.error(`Error fetching news details for URL: ${url}`, error);
    res.status(500).json({ error: 'Error fetching news details. Please try again later.' });
  }
});

// API Route: Scrape the economic calendar based on a timeframe
app.get('/api/calendar', async (req, res) => {
  const { timeframe } = req.query;

  // Validate timeframe
  if (!timeframe || typeof timeframe !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid timeframe.' });
  }

  try {
    // Scrape calendar data
    const events = await scrapeForexFactoryRange(timeframe);

    // Check if events were found
    if (events.length === 0) {
      return res.status(404).json({ error: `No events found for the specified timeframe: ${timeframe}` });
    }

    // Return success response
    res.status(200).json({ events });
  } catch (error) {
    console.error(`Error fetching calendar data for timeframe: ${timeframe}`, error);
    res.status(500).json({ error: 'Error fetching calendar data. Please try again later.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});