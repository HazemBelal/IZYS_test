import { scrapeForexFactoryRange } from './calendarScraper.js';
import { scrapeGraphData } from './graphScraper.js';

// A simple delay function to be a good web citizen
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Proactively scrapes and caches graph data for upcoming calendar events.
 * @param {import('redis').RedisClientType} redisClient - The connected Redis client instance.
 */
export async function warmGraphCache(redisClient) {
  console.log('📈 Starting cache warming process for graph data...');
  try {
    // Fetch events for the current and next week to ensure good coverage
    const thisWeekEvents = await scrapeForexFactoryRange('thisWeek');
    const nextWeekEvents = await scrapeForexFactoryRange('nextWeek');
    const allEvents = [...thisWeekEvents, ...nextWeekEvents];

    const eventsWithGraphs = allEvents.filter(event => event.hasGraph && event.eventId);

    if (eventsWithGraphs.length === 0) {
      console.log('📈 No upcoming events with graphs found. Cache warming complete.');
      return;
    }

    console.log(`📈 Found ${eventsWithGraphs.length} upcoming events with graphs to cache.`);
    let cachedCount = 0;
    
    for (const event of eventsWithGraphs) {
      const cacheKey = `graph:${event.eventId}`;
      try {
        // Check if the key already exists to avoid re-scraping
        const exists = await redisClient.exists(cacheKey);
        if (exists) {
          // console.log(`CACHE HIT (skipping): ${event.eventId} - ${event.event}`);
          continue;
        }

        console.log(`CACHE MISS (warming): ${event.eventId} - ${event.event}. Scraping...`);
        const graphData = await scrapeGraphData(event.eventId);

        if (graphData && graphData.length > 0) {
          // Cache for 1 week, as historical data doesn't change
          await redisClient.set(cacheKey, JSON.stringify(graphData), { EX: 604800 }); // 604800s = 7 days
          cachedCount++;
        }
        
        // Wait for 1 second between requests to avoid getting blocked
        await delay(1000); 

      } catch (err) {
        console.error(`❌ Error warming cache for event ${event.eventId}:`, err.message);
      }
    }
    console.log(`✅ Cache warming finished. Successfully cached ${cachedCount} new graph events.`);

  } catch (error) {
    console.error('❌ A critical error occurred during the cache warming process:', error);
  }
} 