import puppeteer from "puppeteer";
import mysql from "mysql2/promise";

// Database configuration
const dbConfig = {
  host: "mysql-merlet.alwaysdata.net",
  user: "merlet",
  password: "IzysQ4141",
  database: "merlet_288288288"
};

// Mapping of categories to selectors (from your old code)
const CATEGORY_SELECTORS = {
  forex: "#symbol-search-tabs button#forex",
  crypto: "#symbol-search-tabs button#bitcoin\\,crypto",
  stocks: "#symbol-search-tabs button#stocks",
  bonds: "#symbol-search-tabs button#bond",
  actions: "#symbol-search-tabs button#stocks",
  commodities: null
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrapes symbols from the current page using the old CSS classes.
const scrapeSymbolsFromPage = async (page, category) => {
  return await page.evaluate((category) => {
    const rows = document.querySelectorAll(".itemRow-oRSs8UQo, .itemRow");
    return Array.from(rows).map(row => ({
      symbol: row.querySelector(".symbolTitle-oRSs8UQo, .symbolTitle")?.innerText.trim() || "N/A",
      description: row.querySelector(".symbolDescription-oRSs8UQo, .symbolDescription")?.innerText.trim() || "N/A",
      exchange: row.querySelector(".exchangeName-oRSs8UQo, .exchangeName")?.innerText.trim() || "N/A",
      category: category
    }));
  }, category);
};

// Scrolls the container and waits a fixed delay for new symbols to load.
const scrollAndWaitForNewSymbols = async (page) => {
  await page.evaluate(() => {
    const container = document.querySelector(".scrollContainer-dlewR1s1");
    if (container) {
      // Scroll directly to bottom
      container.scrollTop = container.scrollHeight;
    }
  });
  await delay(2000);
};

export const scrapeTradingViewSymbols = async (category, onSymbolsScraped) => {
  if (!CATEGORY_SELECTORS[category]) {
    throw new Error(`Invalid category: ${category}`);
  }
  
  // Connect to database
  const db = await mysql.createConnection(dbConfig);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to TradingView with retries.
    let retries = 3;
    while (retries > 0) {
      try {
        console.log("🌐 Navigating to TradingView...");
        await page.goto("https://www.tradingview.com/", {
          waitUntil: "networkidle2",
          timeout: 60000
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
      }
    }
    
    console.log("🔍 Waiting for search button...");
    await page.waitForSelector(".js-header-search-button", { timeout: 30000 });
    await page.click(".js-header-search-button");
    await delay(1000);
    
    console.log("⏳ Waiting for search panel (#symbol-search-tabs)...");
    await page.waitForSelector("#symbol-search-tabs", { timeout: 30000 });
    console.log("✅ Search panel loaded");
    
    const catSelector = CATEGORY_SELECTORS[category];
    console.log(`🏷️ Selecting category: ${category}`);
    await page.waitForSelector(catSelector, { timeout: 30000 });
    await page.evaluate((selector) => {
      const btn = document.querySelector(selector);
      if (btn) btn.click();
    }, catSelector);
    await delay(1000);
    
    console.log("⏳ Waiting for symbols list...");
    await page.waitForSelector(".itemRow-oRSs8UQo, .itemRow", { timeout: 30000 });
    console.log("✅ Symbols list detected");
    
    // --- New logic for updating only the given category ---
    // Delete only existing symbols in this category.
    await db.query("DELETE FROM financial_symbols WHERE category = ?", [category]);
    console.log(`🧹 Cleared existing symbols for category: ${category}`);
    
    // --- End new logic ---
    
    // Set up a map to capture unique symbols and their DOM order.
    const uniqueSymbols = new Map();
    let prevNumSymbols = await page.evaluate(() =>
      document.querySelectorAll(".itemRow-oRSs8UQo, .itemRow").length
    );
    let sameCount = 0;
    const maxScrollAttempts = 20;
    let scrollAttempt = 0;
    
    while (scrollAttempt < maxScrollAttempts) {
      const newSymbols = await scrapeSymbolsFromPage(page, category);
      newSymbols.forEach(symbol => {
        const key = `${symbol.symbol}-${symbol.exchange}`;
        if (!uniqueSymbols.has(key)) {
          uniqueSymbols.set(key, symbol);
        }
      });
      
      const currentCount = await page.evaluate(() =>
        document.querySelectorAll(".itemRow-oRSs8UQo, .itemRow").length
      );
      console.log(`Scraped ${uniqueSymbols.size} unique symbols so far (DOM count: ${currentCount})`);
      
      if (currentCount - prevNumSymbols < 5) {
        sameCount++;
      } else {
        sameCount = 0;
      }
      prevNumSymbols = currentCount;
      
      if (sameCount >= 3) {
        console.log("✅ No significant increase detected after several scrolls. Finishing scrolling.");
        break;
      }
      
      scrollAttempt++;
      await scrollAndWaitForNewSymbols(page);
      
      if (onSymbolsScraped) {
        onSymbolsScraped(Array.from(uniqueSymbols.values()));
      }
    }
    
    // Capture the DOM order – the order in which the symbols were scraped.
    const finalSymbols = Array.from(uniqueSymbols.values()).map((s, idx) => ({
      ...s,
      _domIndex: idx
    }));
    console.log(`✅ Finished scraping. Total unique symbols: ${finalSymbols.length}`);
    
    // Map scraped symbols for insertion into the table. Make sure your table has an "order_index" column.
    const values = finalSymbols.map(s => [
      `${s.exchange}:${s.symbol}`.replace(/\s+/g, ''),
      s.symbol,
      s.symbol,            // Using symbol as default for name
      s.description,
      category === "crypto" ? "cryptocurrency" : (category === "forex" ? "currency" : "stock"),
      category,
      s.exchange,
      category === "forex" ? "USD" : "USDT",
      "Global",            // Default country value
      "General",           // Default sector value
      "General",           // Default industry value
      s._domIndex          // Order index from the page
    ]);
    
    await db.query(
      `INSERT INTO financial_symbols 
       (id, symbol, name, description, type, category, exchange, currency, country, sector, industry, order_index)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         exchange = VALUES(exchange),
         currency = VALUES(currency),
         order_index = VALUES(order_index),
         last_updated = CURRENT_TIMESTAMP`,
      [values]
    );
    console.log(`💾 Saved ${finalSymbols.length} symbols into the 'financial_symbols' table for category: ${category}`);
    
    return finalSymbols;
  } catch (error) {
    console.error("❌ Error scraping TradingView:", error);
    return [];
  } finally {
    await page.close();
    await browser.close();
    await db.end();
    console.log("🧹 Cleaned up scraping session");
  }
};

export const scrapeAll = async () => {
  const categories = ["forex", "crypto", "stocks", "bonds"];
  let allSymbols = [];
  for (const category of categories) {
    console.log(`\n=== Starting scrape for category: ${category} ===`);
    const symbols = await scrapeTradingViewSymbols(category);
    allSymbols = allSymbols.concat(symbols);
    await delay(2000);
  }
  return allSymbols;
};

export default {
  scrapeAll,
  scrapeTradingViewSymbols
};
