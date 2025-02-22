import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

const BASE_URL = 'https://www.forexfactory.com';
const forexFactoryTimezones = [
    { value: "Pacific/Midway", label: "(GMT-11:00) International Date Line West, Midway Island" },
    { value: "Pacific/Pago_Pago", label: "(GMT-11:00) American Samoa" },
    { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii" },
    { value: "America/Adak", label: "(GMT-10:00) Aleutian Islands" },
    { value: "America/Juneau", label: "(GMT-09:00) Alaska" },
    { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time (US & Canada)" },
    { value: "America/Tijuana", label: "(GMT-08:00) Tijuana" },
    { value: "America/Denver", label: "(GMT-07:00) Mountain Time (US & Canada)" },
    { value: "America/Phoenix", label: "(GMT-07:00) Arizona" },
    { value: "America/Mazatlan", label: "(GMT-07:00) Mazatlan" },
    { value: "America/Chihuahua", label: "(GMT-06:00) Chihuahua" },
    { value: "America/Chicago", label: "(GMT-06:00) Central Time (US & Canada)" },
    { value: "America/Regina", label: "(GMT-06:00) Saskatchewan" },
    { value: "America/Mexico_City", label: "(GMT-06:00) Guadalajara, Mexico City" },
    { value: "America/Monterrey", label: "(GMT-06:00) Monterrey" },
    { value: "America/Guatemala", label: "(GMT-06:00) Central America" },
    { value: "America/New_York", label: "(GMT-05:00) Eastern Time (US & Canada)" },
    { value: "America/Bogota", label: "(GMT-05:00) Bogota" },
    { value: "America/Lima", label: "(GMT-05:00) Lima, Quito" },
    { value: "America/Halifax", label: "(GMT-04:00) Atlantic Time (Canada)" },
    { value: "America/Caracas", label: "(GMT-04:00) Caracas" },
    { value: "America/La_Paz", label: "(GMT-04:00) La Paz" },
    { value: "America/Guyana", label: "(GMT-04:00) Georgetown" },
    { value: "America/Puerto_Rico", label: "(GMT-04:00) Puerto Rico" },
    { value: "America/St_Johns", label: "(GMT-03:30) Newfoundland" },
    { value: "America/Santiago", label: "(GMT-03:00) Santiago" },
    { value: "America/Sao_Paulo", label: "(GMT-03:00) Brasilia" },
    { value: "America/Argentina/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
    { value: "America/Montevideo", label: "(GMT-03:00) Montevideo" },
    { value: "America/Godthab", label: "(GMT-02:00) Greenland" },
    { value: "Atlantic/South_Georgia", label: "(GMT-02:00) Mid-Atlantic" },
    { value: "Atlantic/Azores", label: "(GMT-01:00) Azores" },
    { value: "Atlantic/Cape_Verde", label: "(GMT-01:00) Cape Verde Is." },
    { value: "Europe/Dublin", label: "(GMT+00:00) Dublin" },
    { value: "Europe/London", label: "(GMT+00:00) Edinburgh, London" },
    { value: "Europe/Lisbon", label: "(GMT+00:00) Lisbon" },
    { value: "Africa/Monrovia", label: "(GMT+00:00) Monrovia" },
    { value: "Etc/UTC", label: "(GMT+00:00) UTC" },
    { value: "Africa/Casablanca", label: "(GMT+01:00) Casablanca" },
    { value: "Europe/Belgrade", label: "(GMT+01:00) Belgrade" },
    { value: "Europe/Bratislava", label: "(GMT+01:00) Bratislava" },
    { value: "Europe/Budapest", label: "(GMT+01:00) Budapest" },
    { value: "Europe/Ljubljana", label: "(GMT+01:00) Ljubljana" },
    { value: "Europe/Prague", label: "(GMT+01:00) Prague" },
    { value: "Europe/Sarajevo", label: "(GMT+01:00) Sarajevo" },
    { value: "Europe/Skopje", label: "(GMT+01:00) Skopje" },
    { value: "Europe/Warsaw", label: "(GMT+01:00) Warsaw" },
    { value: "Europe/Zagreb", label: "(GMT+01:00) Zagreb" },
    { value: "Europe/Brussels", label: "(GMT+01:00) Brussels" },
    { value: "Europe/Copenhagen", label: "(GMT+01:00) Copenhagen" },
    { value: "Europe/Madrid", label: "(GMT+01:00) Madrid" },
    { value: "Europe/Paris", label: "(GMT+01:00) Paris" },
    { value: "Europe/Amsterdam", label: "(GMT+01:00) Amsterdam" },
    { value: "Europe/Berlin", label: "(GMT+01:00) Berlin, Bern" },
    { value: "Europe/Rome", label: "(GMT+01:00) Rome" },
    { value: "Europe/Stockholm", label: "(GMT+01:00) Stockholm" },
    { value: "Europe/Vienna", label: "(GMT+01:00) Vienna" },
    { value: "Africa/Algiers", label: "(GMT+01:00) West Central Africa" },
    { value: "Europe/Bucharest", label: "(GMT+02:00) Bucharest" },
    { value: "Africa/Cairo", label: "(GMT+02:00) Cairo" },
    { value: "Europe/Helsinki", label: "(GMT+02:00) Helsinki" },
    { value: "Europe/Kiev", label: "(GMT+02:00) Kyiv" },
    { value: "Europe/Riga", label: "(GMT+02:00) Riga" },
    { value: "Europe/Sofia", label: "(GMT+02:00) Sofia" },
    { value: "Europe/Tallinn", label: "(GMT+02:00) Tallinn" },
    { value: "Europe/Vilnius", label: "(GMT+02:00) Vilnius" },
    { value: "Europe/Athens", label: "(GMT+02:00) Athens" },
    { value: "Asia/Jerusalem", label: "(GMT+02:00) Jerusalem" },
    { value: "Africa/Harare", label: "(GMT+02:00) Harare" },
    { value: "Africa/Johannesburg", label: "(GMT+02:00) Pretoria" },
    { value: "Europe/Kaliningrad", label: "(GMT+02:00) Kaliningrad" },
    { value: "Europe/Istanbul", label: "(GMT+03:00) Istanbul" },
    { value: "Europe/Minsk", label: "(GMT+03:00) Minsk" },
    { value: "Europe/Moscow", label: "(GMT+03:00) Moscow, St. Petersburg" },
    { value: "Europe/Volgograd", label: "(GMT+03:00) Volgograd" },
    { value: "Asia/Kuwait", label: "(GMT+03:00) Kuwait" },
    { value: "Asia/Riyadh", label: "(GMT+03:00) Riyadh" },
    { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
    { value: "Asia/Baghdad", label: "(GMT+03:00) Baghdad" },
    { value: "Asia/Tehran", label: "(GMT+03:30) Tehran" },
    { value: "Europe/Samara", label: "(GMT+04:00) Samara" },
    { value: "Asia/Muscat", label: "(GMT+04:00) Abu Dhabi, Muscat" },
    { value: "Asia/Baku", label: "(GMT+04:00) Baku" },
    { value: "Asia/Tbilisi", label: "(GMT+04:00) Tbilisi" },
    { value: "Asia/Yerevan", label: "(GMT+04:00) Yerevan" },
    { value: "Asia/Kabul", label: "(GMT+04:30) Kabul" },
    { value: "Asia/Yekaterinburg", label: "(GMT+05:00) Ekaterinburg" },
    { value: "Asia/Karachi", label: "(GMT+05:00) Islamabad, Karachi" },
    { value: "Asia/Tashkent", label: "(GMT+05:00) Tashkent" },
    { value: "Asia/Almaty", label: "(GMT+05:00) Almaty" },
    { value: "Asia/Kolkata", label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
    { value: "Asia/Colombo", label: "(GMT+05:30) Sri Jayawardenepura" },
    { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu" },
    { value: "Asia/Dhaka", label: "(GMT+06:00) Astana, Dhaka" },
    { value: "Asia/Urumqi", label: "(GMT+06:00) Urumqi" },
    { value: "Asia/Rangoon", label: "(GMT+06:30) Rangoon" },
    { value: "Asia/Novosibirsk", label: "(GMT+07:00) Novosibirsk" },
    { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok, Hanoi" },
    { value: "Asia/Jakarta", label: "(GMT+07:00) Jakarta" },
    { value: "Asia/Krasnoyarsk", label: "(GMT+07:00) Krasnoyarsk" },
    { value: "Asia/Shanghai", label: "(GMT+08:00) Beijing" },
    { value: "Asia/Chongqing", label: "(GMT+08:00) Chongqing" },
    { value: "Asia/Hong_Kong", label: "(GMT+08:00) Hong Kong" },
    { value: "Asia/Kuala_Lumpur", label: "(GMT+08:00) Kuala Lumpur" },
    { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
    { value: "Asia/Taipei", label: "(GMT+08:00) Taipei" },
    { value: "Australia/Perth", label: "(GMT+08:00) Perth" },
    { value: "Asia/Irkutsk", label: "(GMT+08:00) Irkutsk" },
    { value: "Asia/Ulaanbaatar", label: "(GMT+08:00) Ulaanbaatar" },
    { value: "Asia/Seoul", label: "(GMT+09:00) Seoul" },
    { value: "Asia/Tokyo", label: "(GMT+09:00) Osaka, Sapporo, Tokyo" },
    { value: "Asia/Yakutsk", label: "(GMT+09:00) Yakutsk" },
    { value: "Australia/Darwin", label: "(GMT+09:30) Darwin" },
    { value: "Australia/Brisbane", label: "(GMT+10:00) Brisbane" },
    { value: "Asia/Vladivostok", label: "(GMT+10:00) Vladivostok" },
    { value: "Pacific/Guam", label: "(GMT+10:00) Guam" },
    { value: "Pacific/Port_Moresby", label: "(GMT+10:00) Port Moresby" },
    { value: "Australia/Adelaide", label: "(GMT+10:30) Adelaide" },
    { value: "Australia/Melbourne", label: "(GMT+11:00) Canberra, Melbourne" },
    { value: "Australia/Sydney", label: "(GMT+11:00) Sydney" },
    { value: "Australia/Hobart", label: "(GMT+11:00) Hobart" },
    { value: "Asia/Magadan", label: "(GMT+11:00) Magadan" },
    { value: "Asia/Srednekolymsk", label: "(GMT+11:00) Srednekolymsk" },
    { value: "Pacific/Guadalcanal", label: "(GMT+11:00) Solomon Is." },
    { value: "Pacific/Noumea", label: "(GMT+11:00) New Caledonia" },
    { value: "Pacific/Fiji", label: "(GMT+12:00) Fiji" },
    { value: "Asia/Kamchatka", label: "(GMT+12:00) Kamchatka" },
    { value: "Pacific/Majuro", label: "(GMT+12:00) Marshall Is." },
    { value: "Pacific/Auckland", label: "(GMT+13:00) Auckland, Wellington" },
    { value: "Pacific/Tongatapu", label: "(GMT+13:00) Nuku'alofa" },
    { value: "Pacific/Fakaofo", label: "(GMT+13:00) Tokelau Is." },
    { value: "Pacific/Apia", label: "(GMT+13:00) Samoa" },
    { value: "Pacific/Chatham", label: "(GMT+13:45) Chatham Is." },
  ];
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
  async function scrapeForexFactory(timeframeUrl, userTimezone) {
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