// src/scraper/calendarScraper.js
const puppeteer = require('puppeteer');

// Function to scrape data from Investing.com economic calendar
async function scrapeEconomicCalendar(fromDate, toDate, importance, timezone) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = 'https://www.investing.com/economic-calendar/';
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Set filters based on the provided parameters
  await page.evaluate(
    (fromDate, toDate, importance, timezone) => {
      document.querySelector('#from-date').value = fromDate;
      document.querySelector('#to-date').value = toDate;
      document.querySelector('#importance').value = importance;
      document.querySelector('#timezone').value = timezone;
      document.querySelector('.filter-button').click(); // Click filter button
    },
    fromDate,
    toDate,
    importance,
    timezone
  );

  // Wait for the content to load after applying filters
  await page.waitForSelector('.economicCalendarTable', { timeout: 10000 });

  // Scrape the data
  const events = await page.evaluate(() => {
    const rows = document.querySelectorAll('.calendar_row');
    const eventData = [];

    rows.forEach((row) => {
      const time = row.querySelector('.first.time').textContent.trim();
      const country = row.querySelector('.flagCur').textContent.trim();
      const event = row.querySelector('.event').textContent.trim();
      const importance = row.querySelector('.sentiment').title || 'Low';
      const actual = row.querySelector('.actual').textContent.trim();
      const forecast = row.querySelector('.forecast').textContent.trim();
      const previous = row.querySelector('.previous').textContent.trim();

      eventData.push({
        time,
        country,
        importance,
        event,
        actual,
        forecast,
        previous,
      });
    });

    return eventData;
  });

  await browser.close();
  return events;
}

module.exports = { scrapeEconomicCalendar };
