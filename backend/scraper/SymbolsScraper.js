import fetch from 'node-fetch';
import mysql from 'mysql2/promise';

// Base URL for TradingView scanner API
const SCANNER_BASE = 'https://scanner.tradingview.com';

// Map our categories to the correct scanner paths
const CATEGORY_MAP = {
  forex:       'forex',
  crypto:      'crypto',
  stocks:      'stock',       // “actions” live under the same “stock” path
  actions:     'stock',
  bonds:       'bonds',
  commodities: 'commodities',
  futures:     'futures',
  indices:     'index'
};

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: 'merlet',
  password: 'IzysQ4141',
  database: 'merlet_288288288',
};

export const scrapeTradingViewSymbols = async (category) => {
  const path = CATEGORY_MAP[category];
  if (!path) {
    console.warn(`Skipping unsupported category: ${category}`);
    return [];
  }

  const db = await mysql.createConnection(dbConfig);
  try {
    const endpoint = `${SCANNER_BASE}/${path}/scan`;
    const body = {
      filter: [],               // no filters = all symbols
      columns: ['description','name','type']
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(body)
    });

    if (res.status === 404) {
      console.warn(`❌ [${category}] JSON endpoint returned 404 — skipping`);
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];

    // 1) Delete just this category
    await db.query('DELETE FROM financial_symbols WHERE category = ?', [category]);

    // 2) Build upsert values
    const values = data
      .filter(r => typeof r.s === 'string')
      .map((r, idx) => {
        // r.s is like "BINANCE:BTCUSDT", r.d is [ description, name, type ]
        const [exchange, symbol] = r.s.split(':');
        let rawDesc = r.d[0] || '';
        // strip off any " on ... " suffix
        const description = rawDesc.split(' on ')[0].trim();

        // determine currency (forex→USD, crypto→USDT, else USD)
        const currency = category === 'forex' ? 'USD'
                       : category === 'crypto' ? 'USDT'
                       : 'USD';

        return [
          `${exchange}:${symbol}`.replace(/\s+/g,''), // id
          symbol,                                    // symbol
          r.d[1] || symbol,                          // name
          description,                               // description
          category === 'crypto' ? 'cryptocurrency'   // type
            : category === 'forex' ? 'currency'
            : 'stock',
          category,                                  // category
          exchange,                                  // exchange
          currency,                                  // currency
          'Global',                                  // country
          'General',                                 // sector
          'General',                                 // industry
          idx                                        // order_index
        ];
      });

    if (values.length) {
      await db.query(
        `INSERT INTO financial_symbols
           (id, symbol, name, description, type, category, exchange, currency, country, sector, industry, order_index)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           name        = VALUES(name),
           description = VALUES(description),
           exchange    = VALUES(exchange),
           currency    = VALUES(currency),
           order_index = VALUES(order_index),
           last_updated= CURRENT_TIMESTAMP`,
        [values]
      );
    }

    console.log(`💾 [${category}] upserted ${values.length} symbols`);
    return data;

  } catch (err) {
    console.error(`❌ [${category}] scraper error:`, err);
    return [];
  } finally {
    await db.end();
  }
};

/**
 * Scrape all supported categories in turn.
 */
export const scrapeAll = async () => {
  const cats = Object.keys(CATEGORY_MAP);
  let all = [];
  for (const c of cats) {
    console.log(`\n=== Starting scrape for category: ${c}`);
    const res = await scrapeTradingViewSymbols(c);
    all = all.concat(res);
    // throttle 2s between categories
    await new Promise(r => setTimeout(r, 2000));
  }
  return all;
};

export default { scrapeAll, scrapeTradingViewSymbols };
