import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

const BASE_URL = 'https://www.forexfactory.com';

/**
 * Scrape the ForexFactory calendar based on the given timeframe in UTC.
 * @param {string} timeframeUrl - URL path for the specific timeframe
 * @returns {Promise<Array>} - List of economic events with UTC timestamps
 */
async function scrapeForexFactory(timeframeUrl) {
  try {
    const response = await fetch(`${BASE_URL}${timeframeUrl}`, {
      headers: {
        // Set cookie to get times in UTC and disable DST, with correct name and encoding
        'Cookie': 'fftimezone=Etc%2FUTC; ff_dst=0',
      }
    });
    const body = await response.text();
    const $ = cheerio.load(body);

    const events = [];
    let currentDay = null;
    let currentTime = null;

    $('table.calendar__table tbody tr').each((_, row) => {
      const $row = $(row);

      // Strategy 1: Check for a day-breaker row to update the date.
      // e.g. <tr class="calendar__row calendar__row--day-breaker">
      const dayBreakerCell = $row.find('td.calendar__cell[colspan="10"]');
      if (dayBreakerCell.length > 0) {
        currentDay = dayBreakerCell.text().trim();
        console.log(`📅 Updated currentDay from day-breaker: "${currentDay}"`);
        return; // This is a day-breaker, not an event row, so we continue.
      }
      
      // Strategy 2: If we are on the first event of a day, it might have the date cell.
      // This is a good fallback, especially for the very first day on the page.
      const dateCell = $row.find('td.calendar__date .date').text().trim();
      if (dateCell) {
        currentDay = dateCell;
        console.log(`📅 Updated currentDay from dateCell: "${currentDay}"`);
      }

      // Time cell - try multiple selectors
      let timeCell = $row.find('td.calendar__time span').text().trim();
      if (!timeCell) {
        timeCell = $row.find('td.calendar__time').text().trim();
      }
      if (!timeCell) {
        timeCell = $row.find('.calendar__time').text().trim();
      }
      if (!timeCell) {
        timeCell = $row.find('td[data-time]').attr('data-time');
      }
      if (!timeCell) {
        timeCell = $row.find('.time').text().trim();
      }
      if (!timeCell) {
        timeCell = $row.find('[class*="time"]').text().trim();
      }
      
      if (timeCell) {
        currentTime = timeCell; // e.g., "1:50am"
        console.log(`⏰ Found time: "${timeCell}"`);
      } else {
        console.log(`⚠️ No time found for row. HTML:`, $row.find('td.calendar__time').html());
      }

      const currency = $row.find('td.calendar__currency').text().trim();
      const event = $row.find('td.calendar__event .calendar__event-title').text().trim();
      const eventId = $row.attr('data-event-id');
      const hasGraph = $row.find('td.calendar__graph a').length > 0;

      // Only proceed if we have a currency, which indicates a valid event row.
      if (!currency) {
        return;
      }
      
      console.log(`📅 Processing event: ${event} | Time: "${currentTime}" | Date: "${currentDay}"`);

      const impactElement = $row.find('td.calendar__impact span');
      const impactClass = impactElement.attr('class') || '';
      const impact = getImpactLevel(impactClass);

      const actual = extractData($row.find('td.calendar__actual span'));
      const forecast = extractData($row.find('td.calendar__forecast span'));
      const previous = extractData($row.find('td.calendar__previous span'));

      // Parse the event's UTC datetime
      let utcTime = null;
      if (currentTime && currentTime.toLowerCase() !== 'all day' && currentDay) {
        // Parse currentDay (e.g., "Tue Jul 8") and currentTime (e.g., "1:50am")
        // to a UTC ISO string for this year
        const now = moment.utc();
        const year = now.year();
        
        console.log(`🔍 Parsing date: "${currentDay} ${year} ${currentTime}"`);
        
        // Try to parse with the current year first
        let dayMoment = moment.utc(`${currentDay} ${year} ${currentTime}`, ['ddd MMM D YYYY h:mma', 'ddd MMM D YYYY H:mm']);
        
        // If the parsed day is in the past (more than 7 days ago), try next year
        if (dayMoment.isValid() && dayMoment.isBefore(now.clone().subtract(7, 'days'))) {
          console.log(`📅 Date is too far in the past, trying next year`);
          dayMoment = moment.utc(`${currentDay} ${year + 1} ${currentTime}`, ['ddd MMM D YYYY h:mma', 'ddd MMM D YYYY H:mm']);
        }
        
        // If still not valid, try previous year
        if (!dayMoment.isValid()) {
          console.log(`📅 Date parsing failed, trying previous year`);
          dayMoment = moment.utc(`${currentDay} ${year - 1} ${currentTime}`, ['ddd MMM D YYYY h:mma', 'ddd MMM D YYYY H:mm']);
        }
        
        if (dayMoment.isValid()) {
          utcTime = dayMoment.toISOString();
          console.log(`✅ Successfully parsed UTC time: ${utcTime}`);
        } else {
          console.log(`❌ Failed to parse date: "${currentDay} ${currentTime}"`);
        }
      } else {
        console.log(`⚠️ Skipping UTC parsing - time: "${currentTime}", day: "${currentDay}"`);
      }

      events.push({
        eventId,
        date: currentDay || 'N/A',
        time: currentTime || 'N/A',
        utcTime: utcTime || null,
        currency: currency || '',
        event,
        impact,
        actual: actual.value,
        actualClass: actual.class,
        actualTitle: actual.title,
        forecast: forecast.value,
        previous: previous.value,
        previousClass: previous.class,
        previousTitle: previous.title,
        hasGraph,
      });
    });

    return events;
  } catch (error) {
    console.error('❌ Error scraping ForexFactory:', error);
    return [];
  }
}

/**
 * Determine event impact level based on class name.
 * @param {string} impactClass - The class attribute from the impact span
 * @returns {string} - Impact level ("high", "medium", "low", "non-economic")
 */
function getImpactLevel(impactClass) {
  if (impactClass.includes('icon--ff-impact-red')) return 'high';
  if (impactClass.includes('icon--ff-impact-ora')) return 'medium';
  if (impactClass.includes('icon--ff-impact-gra')) return 'non-economic';
  return 'low';
}

/**
 * Extract event data (value, class, and title) from a table cell.
 * @param {cheerio.Cheerio} element - Cheerio element representing the table cell
 * @returns {Object} - Extracted values {value, class, title}
 */
function extractData(element) {
  return {
    value: element.text().trim() || '',
    class: element.attr('class') || '',
    title: element.attr('title') || '',
  };
}

/**
 * Scrapes the ForexFactory calendar for a specific timeframe in UTC.
 * @param {string} timeframe - Timeframe to scrape ("today", "tomorrow", "thisWeek", etc.)
 * @returns {Promise<Array>} - List of economic events
 */
async function scrapeForexFactoryRange(timeframe) {
  const urlMap = {
    today: '/calendar?day=today',
    tomorrow: '/calendar?day=tomorrow',
    thisWeek: '/calendar?week=this',
    nextWeek: '/calendar?week=next',
    thisMonth: '/calendar?month=this',
    nextMonth: '/calendar?month=next',
    yesterday: '/calendar?day=yesterday',
    lastWeek: '/calendar?week=last',
    lastMonth: '/calendar?month=last',
  };

  let urlPart = urlMap[timeframe];

  // If the timeframe isn't a preset, check for custom date formats
  if (!urlPart) {
    if (timeframe.startsWith('week-')) {
      const dateStr = timeframe.substring(5); // e.g., "2025-07-13"
      if (moment(dateStr, 'YYYY-MM-DD', true).isValid()) {
        const date = moment(dateStr, 'YYYY-MM-DD');
        const ffDate = `${date.format('MMM').toLowerCase()}${date.format('D')}.${date.format('YYYY')}`;
        urlPart = `/calendar?week=${ffDate}`;
      }
    } else if (moment(timeframe, 'YYYY-MM-DD', true).isValid()) {
      const date = moment(timeframe, 'YYYY-MM-DD');
      const ffDate = `${date.format('MMM').toLowerCase()}${date.format('D')}.${date.format('YYYY')}`;
      urlPart = `/calendar?day=${ffDate}`;
    }
  }
  
  // Fallback to today if no valid timeframe is found
  if (!urlPart) {
    urlPart = '/calendar?day=today';
  }

  console.log(`📅 Scraping for timeframe: ${timeframe} (URL: ${urlPart}) in UTC`);

  return await scrapeForexFactory(urlPart);
}

export { scrapeForexFactoryRange };