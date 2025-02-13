import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

const BASE_URL = 'https://www.forexfactory.com';

/**
 * Fetch and match the user's timezone with ForexFactory's available timezones.
 * @param {string} userTimezone - User's detected timezone
 * @returns {Promise<string>} - Matched ForexFactory timezone
 */
async function getForexFactoryTimezone(userTimezone) {
    try {
        console.log(`🔍 Detecting ForexFactory equivalent for user's timezone: ${userTimezone}`);
        const response = await fetch(`${BASE_URL}/timezone`);
        const body = await response.text();
        const $ = cheerio.load(body);

        let matchedTimezone = $("select#time_zone_standalone option")
            .filter((_, el) => $(el).text().includes(userTimezone))
            .attr("value");

        return matchedTimezone || "Etc/UTC";
    } catch (error) {
        console.error("❌ Error fetching ForexFactory timezone:", error);
        return "Etc/UTC";
    }
}

/**
 * Scrape the ForexFactory calendar based on the given timeframe and timezone.
 * @param {string} timeframeUrl - URL path for the specific timeframe
 * @param {string} userTimezone - User's detected timezone
 * @returns {Promise<Array>} - List of economic events
 */
async function scrapeForexFactory(timeframeUrl,userTimezone) {
    try {
        const forexFactoryTimezone = await getForexFactoryTimezone(userTimezone);
        console.log(`🌍 Using ForexFactory timezone: ${forexFactoryTimezone} for scraping.`);

        const response = await fetch(`${BASE_URL}${timeframeUrl}`);
        const body = await response.text();
        const $ = cheerio.load(body);

        const events = [];
        let currentDay = null;

        $('table.calendar__table tbody').each((_, tbody) => {
            $(tbody).find('tr').each((_, row) => {
                if ($(row).hasClass('calendar__row--day-breaker')) {
                    currentDay = $(row).text().trim();
                    return;
                }

                const rawTime = $(row).find('td.calendar__time').text().trim();
                const time = convertTimeToUserTimezone(rawTime, forexFactoryTimezone, userTimezone);

                const currency = $(row).find('td.calendar__currency').text().trim();
                const event = $(row).find('td.calendar__event .calendar__event-title').text().trim();

                const impactElement = $(row).find('td.calendar__impact span');
                const impactClass = impactElement.attr('class') || '';
                const impact = getImpactLevel(impactClass);

                const actual = extractData($(row).find('td.calendar__actual span'));
                const forecast = extractData($(row).find('td.calendar__forecast span'));
                const previous = extractData($(row).find('td.calendar__previous span'));

                if (event) {
                    events.push({
                        date: currentDay || 'N/A',
                        time: time || 'N/A',
                        timezone: userTimezone,
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
                    });
                }
            });
        });

        return events;
    } catch (error) {
        console.error('❌ Error scraping ForexFactory:', error);
        return [];
    }
}

/**
 * Convert ForexFactory time to the user's timezone.
 * @param {string} rawTime - The time string from ForexFactory (e.g., "3:37pm")
 * @param {string} forexFactoryTimezone - The timezone used by ForexFactory
 * @param {string} userTimezone - The user's local timezone
 * @returns {string} - Converted time in HH:mm format
 */
function convertTimeToUserTimezone(rawTime, forexFactoryTimezone, userTimezone) {
    if (!rawTime || rawTime.toLowerCase() === 'all day') return 'All Day';

    const parsedTime = moment.tz(rawTime, 'h:mma', forexFactoryTimezone);
    return parsedTime.clone().tz(userTimezone).format('HH:mm');
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
 * Scrapes the ForexFactory calendar for a specific timeframe.
 * @param {string} timeframe - Timeframe to scrape ("today", "tomorrow", "thisWeek", etc.)
 * @param {string} userTimezone - User's timezone for conversion
 * @returns {Promise<Array>} - List of economic events
 */
async function scrapeForexFactoryRange(timeframe, userTimezone = 'UTC') {
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

    const urlPart = urlMap[timeframe] || '/calendar?day=today';
    console.log(`📅 Scraping for timeframe: ${timeframe} (URL: ${urlPart}) in timezone: ${userTimezone}`);

    return await scrapeForexFactory(urlPart, userTimezone);
}

export { scrapeForexFactoryRange };
