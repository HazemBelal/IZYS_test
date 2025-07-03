import fetch from 'node-fetch';
import mysql from 'mysql2/promise';

// Base URL for TradingView scanner API
const SCANNER_BASE = 'https://scanner.tradingview.com';

// Export CATEGORY_MAP for use in server
export const CATEGORY_MAP = {
  forex:       'forex',
  crypto:      'crypto',
  stocks:      'america',
  actions:     'america',
  bonds:       'bonds',
  commodities: 'futures',
  indices:     'index'
};

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: 'merlet',
  password: 'IzysQ4141',
  database: 'merlet_288288288',
};

// List of major stock exchanges (customize as needed)
const MAJOR_STOCK_EXCHANGES = [
  'NYSE', 'NASDAQ', 'AMEX', 'LSE', 'TSX', 'JPX', 'SSE', 'HKEX', 'SZSE', 'EURONEXT', 'FWB', 'SWX', 'BSE', 'NSE', 'KRX', 'TSE', 'ASX', 'JSE', 'BMV', 'SGX', 'MOEX', 'BME', 'B3', 'BVL', 'BIST', 'BCBA', 'BVC', 'BVB', 'BSE', 'CSE', 'DFM', 'EGX', 'GSE', 'HNX', 'IDX', 'KSE', 'KSE', 'LUX', 'MSE', 'NZX', 'OSE', 'PSE', 'QSE', 'SASE', 'TADAWUL', 'TASE', 'TWSE', 'VSE'
];

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
    if (category === 'stocks' || category === 'actions') {
      // Also clear both stocks and actions if scraping either
      await db.query('DELETE FROM financial_symbols WHERE category = ?', ['actions']);
      await db.query('DELETE FROM financial_symbols WHERE category = ?', ['stocks']);
    }

    // 2) Build upsert values
    let values = [];
    if (category === 'stocks' || category === 'actions') {
      // Separate actions from stocks
      data.filter(r => typeof r.s === 'string').forEach((r, idx) => {
        const [exchange, symbol] = r.s.split(':');
        let rawDesc = r.d[0] || '';
        const description = rawDesc.split(' on ')[0].trim();
        const currency = 'USD';
        // If not a major stock exchange, treat as 'actions', else 'stocks'
        const isAction = !MAJOR_STOCK_EXCHANGES.includes((exchange || '').toUpperCase());
        const dbCategory = isAction ? 'actions' : 'stocks';
        values.push([
          `${exchange}:${symbol}`.replace(/\s+/g,''),
          symbol,
          r.d[1] || symbol,
          description,
          'stock',
          dbCategory,
          exchange,
          currency,
          'Global',
          'General',
          'General',
          idx
        ]);
      });
    } else {
      values = data
        .filter(r => typeof r.s === 'string')
        .map((r, idx) => {
          const [exchange, symbol] = r.s.split(':');
          let rawDesc = r.d[0] || '';
          const description = rawDesc.split(' on ')[0].trim();
          const currency = category === 'forex' ? 'USD'
                            : category === 'crypto' ? 'USDT'
                            : 'USD';
          const dbCategory = category;
          return [
            `${exchange}:${symbol}`.replace(/\s+/g,''),
            symbol,
            r.d[1] || symbol,
            description,
            category === 'crypto' ? 'cryptocurrency'
              : category === 'forex' ? 'currency'
              : 'stock',
            dbCategory,
            exchange,
            currency,
            'Global',
            'General',
            'General',
            idx
          ];
        });
    }

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
