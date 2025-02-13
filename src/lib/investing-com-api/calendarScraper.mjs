import puppeteer from 'puppeteer';

export async function callInvestingCalendar(pptrLaunchOptions = {}) {
  const browser = await puppeteer.launch({ ...pptrLaunchOptions, headless: true });
  const page = await browser.newPage();

  const url = `https://www.investing.com/economic-calendar/`;
  console.log(`Fetching calendar data from: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Adjust the selectors to correctly capture the information
  const events = await page.evaluate(() => {
    const rows = document.querySelectorAll('.js-event-item'); // Correct selector for economic events
    const data = [];

    rows.forEach(row => {
      const date = row.querySelector('.first.left.time')?.textContent.trim() || 'N/A'; // Fetch date/time info
      const country = row.querySelector('.left.flagCur img')?.getAttribute('title') || 'N/A'; // Fetch country name from flag title
      const event = row.querySelector('.event')?.textContent.trim() || 'N/A'; // Event name
      const importance = row.querySelector('.sentiment')?.getAttribute('title') || 'N/A'; // Importance level
      const time = row.querySelector('.first.left.time')?.textContent.trim() || 'N/A'; // Event time
      const forecast = row.querySelector('.fore')?.textContent.trim() || 'N/A'; // Forecast value
      const previous = row.querySelector('.prev')?.textContent.trim() || 'N/A'; // Previous value
      const actual = row.querySelector('.act')?.textContent.trim() || 'N/A'; // Actual value

      data.push({ date, country, event, importance, time, forecast, previous, actual });
    });

    return data;
  });

  await browser.close();
  console.log("Successfully fetched calendar data", events);
  return events;
}
