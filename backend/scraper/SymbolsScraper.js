import puppeteer from "puppeteer";

// Mapping of categories to their respective selectors
const CATEGORY_SELECTORS = {
  forex: "#symbol-search-tabs button#forex",
  crypto: "#symbol-search-tabs button#bitcoin\\,crypto",
  stocks: "#symbol-search-tabs button#stocks",
  bonds: "#symbol-search-tabs button#bond",
  actions: "#symbol-search-tabs button#stocks", // Same as stocks
  commodities: null, // Not handled yet
};

// Helper function to scrape symbols from the current page
const scrapeSymbolsFromPage = async (page, category) => {
  return await page.evaluate((category) => {
    const rows = document.querySelectorAll(".itemRow-oRSs8UQo, .itemRow");
    return Array.from(rows).map((row) => ({
      symbol: row.querySelector(".symbolTitle-oRSs8UQo, .symbolTitle")?.innerText.trim() || "N/A",
      description: row.querySelector(".symbolDescription-oRSs8UQo, .symbolDescription")?.innerText.trim() || "N/A",
      exchange: row.querySelector(".exchangeName-oRSs8UQo, .exchangeName")?.innerText.trim() || "N/A",
      category: category, // Include the category in the symbol data
    }));
  }, category);
};

// Helper function to scroll the symbols list and wait for new symbols to load
const scrollAndWaitForNewSymbols = async (page) => {
  await page.evaluate(() => {
    const container = document.querySelector(".scrollContainer-dlewR1s1");
    if (container) {
      container.scrollBy(0, 1000); // Scroll by a larger distance
    }
  });

  // Check if the spinner exists
  const spinnerExists = await page.evaluate(() => {
    return !!document.querySelector(".spinnerContainer-dlewR1s1");
  });

  if (spinnerExists) {
    // Wait for the spinner to disappear (indicating new items are loaded)
    try {
      await page.waitForFunction(
        () => {
          const spinner = document.querySelector(".spinnerContainer-dlewR1s1");
          return !spinner || spinner.style.display === "none";
        },
        { timeout: 10000 } // Increased timeout to 10 seconds
      );
    } catch (error) {
      console.log("⚠️ Spinner did not disappear within the timeout. Continuing...");
    }
  } else {
    // If the spinner doesn't exist, wait for a fixed amount of time
    console.log("⚠️ Spinner not found. Waiting for 2 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
};

// Main function to scrape TradingView symbols
export const scrapeTradingViewSymbols = async (category, onSymbolsScraped) => {
  if (!CATEGORY_SELECTORS[category]) {
    throw new Error(`Invalid category: ${category}`);
  }

  const url = "https://www.tradingview.com/";
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  try {
    // Navigate to TradingView with retries
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`✅ Loading TradingView: ${url}`);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        break; // Exit the retry loop if successful
      } catch (error) {
        retries--;
        console.error(`❌ Navigation failed. Retries left: ${retries}`, error);
        if (retries === 0) throw error;
      }
    }

    // Click the search box
    console.log("✅ Waiting for search box...");
    await page.waitForSelector(".js-header-search-button", { timeout: 30000 });
    await page.click(".js-header-search-button");
    console.log("✅ Clicked search box");

    // Wait for the search panel to load
    console.log("✅ Waiting for search panel...");
    await page.waitForSelector("#symbol-search-tabs", { timeout: 30000 });
    console.log("✅ Search panel loaded");

    // Select the category
    const categorySelector = CATEGORY_SELECTORS[category];
    console.log(`✅ Selecting category: ${category}`);
    await page.waitForSelector(categorySelector, { timeout: 30000 });
    await page.evaluate((selector) => document.querySelector(selector)?.click(), categorySelector);
    console.log(`✅ Selected category: ${category}`);

    // Wait for the symbols list to load
    console.log("✅ Waiting for symbols list...");
    await page.waitForSelector(".listContainer-dlewR1s1, .listItems, .scrollContainer-dlewR1s1", { timeout: 30000 });
    console.log("✅ Symbols list detected");

    const uniqueSymbols = new Map(); // Use a Map to ensure uniqueness based on symbol + exchange
    let prevNumSymbols = 0;
    let sameCount = 0;

    while (true) {
      // Scrape symbols from the current page
      const newSymbols = await scrapeSymbolsFromPage(page, category);

      // Add new symbols to the Map, using symbol + exchange as the key
      newSymbols.forEach((symbol) => {
        const key = `${symbol.symbol}-${symbol.exchange}`;
        if (!uniqueSymbols.has(key)) {
          uniqueSymbols.set(key, symbol);
        }
      });

      console.log(`✅ Scraped ${uniqueSymbols.size} unique symbols so far...`);

      // Send the symbols to the callback function
      if (onSymbolsScraped) {
        onSymbolsScraped(Array.from(uniqueSymbols.values()));
      }

      // Scroll and wait for new symbols to load
      await scrollAndWaitForNewSymbols(page);

      // Check if new symbols have been loaded
      const newNumSymbols = await page.evaluate(() => document.querySelectorAll(".itemRow-oRSs8UQo, .itemRow").length);

      if (newNumSymbols === prevNumSymbols) {
        sameCount++;
        if (sameCount >= 3) {
          console.log("✅ No more symbols to load. Finished scrolling.");
          break;
        }
      } else {
        sameCount = 0;
      }

      prevNumSymbols = newNumSymbols;
    }

    const finalSymbols = Array.from(uniqueSymbols.values());
    console.log(`✅ Finished scraping. Total unique symbols: ${finalSymbols.length}`);
    return finalSymbols;
  } catch (error) {
    console.error("❌ Error scraping TradingView:", error);
    return [];
  } finally {
    await browser.close();
  }
};