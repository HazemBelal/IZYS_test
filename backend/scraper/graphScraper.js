import fetch from 'node-fetch';

async function scrapeGraphData(eventId) {
  try {
    // Use the modern API endpoint with query params
    const url = `https://www.forexfactory.com/calendar/graph/${eventId}?limit=400&site_id=1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch graph data from ForexFactory: ${response.status} ${response.statusText}`);
    }

    // The API now returns JSON directly
    const jsonData = await response.json();

    if (jsonData && jsonData.data && Array.isArray(jsonData.data.events)) {
      console.log(`✅ Parsed graph data as JSON for event ${eventId}`);
      return jsonData.data.events;
    } else {
      console.error('❌ Invalid JSON structure received for graph data:', jsonData);
      throw new Error('Invalid JSON structure for graph data.');
    }
  } catch (error) {
    console.error(`Error scraping graph data for event ${eventId}:`, error);
    throw error;
  }
}

export { scrapeGraphData }; 