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
  // 1) Connect to database
  const db = await mysql.createConnection(dbConfig);

  // 2) Launch headless Chrome with sandbox disabled
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  });
  const page = await browser.newPage();

  try {
    // 3) Navigate directly to the symbols page
    const url = `https://www.tradingview.com/markets/${category}/symbols/`;
    console.log(`🌐 Navigating to TradingView (${url})…`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".tv-data-table", { timeout: 60000 });

    // 4) Clear old symbols for this category
    await db.query("DELETE FROM financial_symbols WHERE category = ?", [category]);
    console.log(`🧹 Cleared existing symbols for category: ${category}`);

    // 5) Scroll until no more new rows appear
    let lastHeight = 0;
    let scrolls = 0;
    while (true) {
      const height = await page.evaluate("document.body.scrollHeight");
      if (height === lastHeight || scrolls > 20) break;
      lastHeight = height;
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await new Promise(r => setTimeout(r, 1500));
      scrolls++;
      if (onSymbolsScraped) {
        // report progress with whatever's visible so far
        const partial = await page.$$eval(
          ".tv-data-table__tbody .tv-data-table__row",
          rows => rows.map(row => {
            const cells = row.querySelectorAll(".tv-data-table__cell");
            return {
              symbol:      cells[0]?.innerText.trim(),
              description: cells[1]?.innerText.trim(),
              exchange:    cells[2]?.innerText.trim()
            };
          })
        );
        onSymbolsScraped(partial);
      }
    }

    // 6) Extract final list with DOM order index
    const finalSymbols = await page.$$eval(
      ".tv-data-table__tbody .tv-data-table__row",
      (rows) => rows.map((row, idx) => {
        const cells = row.querySelectorAll(".tv-data-table__cell");
        return {
          symbol:      cells[0]?.innerText.trim(),
          description: cells[1]?.innerText.trim(),
          exchange:    cells[2]?.innerText.trim(),
          _domIndex:   idx
        };
      })
    );
    console.log(`✅ Finished scraping. Total unique symbols: ${finalSymbols.length}`);

    // 7) Bulk upsert into MySQL
    const values = finalSymbols.map(s => [
      `${s.exchange}:${s.symbol}`.replace(/\s+/g, ""),
      s.symbol,
      s.symbol,
      s.description,
      category === "crypto" ? "cryptocurrency" :
        (category === "forex" ? "currency" : "stock"),
      category,
      s.exchange,
      category === "forex" ? "USD" : "USDT",
      "Global",
      "General",
      "General",
      s._domIndex
    ]);

    await db.query(
      `INSERT INTO financial_symbols
         (id, symbol, name, description, type, category, exchange, currency, country, sector, industry, order_index)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         name         = VALUES(name),
         description  = VALUES(description),
         exchange     = VALUES(exchange),
         currency     = VALUES(currency),
         order_index  = VALUES(order_index),
         last_updated = CURRENT_TIMESTAMP`,
      [values]
    );
    console.log(`💾 Saved ${finalSymbols.length} symbols into database for category: ${category}`);

    return finalSymbols;

  } catch (error) {
    console.error("❌ Error scraping TradingView:", error);
    return [];
  } finally {
    // 8) Tear down
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
