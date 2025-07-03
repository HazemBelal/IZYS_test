import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import os from 'os';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';            // ← new
import net from 'net';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
import {
  scrapeLatestNews,
  scrapeBreakingNews,
  scrapeCryptoNews,
  scrapeStockMarketNews,
  scrapeCommoditiesNews,
  scrapeCurrenciesNews,
  scrapeEconomyNews,
  scrapeEconomicIndicatorsNews,
  scrapePoliticsNews,
  scrapeWorldNews,
  scrapeCompanyNews,
  scrapeNewsDetails,
} from '../scraper/newsScraper.js';

import { scrapeForexFactoryRange } from '../scraper/calendarScraper.js';
import symbolScraperModule from '../scraper/SymbolsScraper.js';


// 1) Use local Redis on your VPS (or override via ENV) 
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'; 
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379; 
 
// 2) Build a standard Redis URL 
const REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`;

// 3) Create the client, forcing IPv6
const redisClient = createClient({
  url: REDIS_URL,
  socket: { family: 6 }
});

redisClient
  .on('connect',      () => console.log('Redis → connect'))
  .on('ready',        () => console.log('Redis → ready'))
  .on('reconnecting', () => console.log('Redis → reconnecting'))
  .on('error',        e  => console.error('Redis → error', e));

// 4) Connect once
try {
  await redisClient.connect();
  console.log('✅ Connected to AlwaysData Redis at', REDIS_URL);
} catch (err) {
  console.error('❌ Redis connection FAILED:', err);
  // optionally fall back to an in‑memory stub here if you really need to
}

// --------------------------
// Now wire that into your app config
// --------------------------
const app = express();
const PORT = process.env.PORT || 5000;

const config = {
  // **IMPORTANT**: point at the same URL above
  redis: { url: REDIS_URL },
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: "merlet",
    password: "IzysQ4141",
    database: "merlet_288288288",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secure-jwt-secret',
    expiresIn: '1h'
  }
};

let dbPool;





// --------------------------
// Initialize MySQL with error handling
// --------------------------
try {
  dbPool = mysql.createPool(config.mysql);
  await dbPool.query('SELECT 1');
  console.log('✅ Connected to MySQL');
} catch (err) {
  console.error('❌ Could not connect to MySQL – exiting:', err); 
  process.exit(1);
}

// --------------------------
// Import symbol scraper
// --------------------------
let symbolScraper;
try {
  const module = await import('../scraper/SymbolsScraper.js');
  symbolScraper = module.default || module.scrapeFinancialSymbols || module.symbolScraper;
  console.log('✅ Symbol scraper loaded successfully');
} catch (err) {
  console.error('❌ Failed to load symbol scraper:', err);
  process.exit(1);
}

// --------------------------
// Middleware
// --------------------------
app.use(cors({
  origin: [
    'https://merlet.alwaysdata.net',
    'http://merlet.alwaysdata.net'
    // 'http://localhost:5173', // removed for production
    // 'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Set Content Security Policy (CSP) for news requests if needed
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' https://*.investing.com",
      "connect-src 'self' http://31.97.154.112:5000 https://*.investing.com", // removed localhost/127.0.0.1
      "media-src 'self' https://*.investing.com data:",
      "img-src 'self' https://*.investing.com data:",
      "script-src 'self' https://s3.tradingview.com",
      "script-src-elem 'self' https://s3.tradingview.com",
      "style-src 'self' https://fonts.googleapis.com",
      "style-src-elem 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-src 'self' https://*.tradingview.com https://tradingview-widget.com https://*.tradingview-widget.com"
    ].join('; ')
  );
  next();
});

// --------------------------
// Database operations and symbol service
// --------------------------
const symbolService = {
  async init() {
    try {
      // Create symbols table if not exists
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS financial_symbols (
          id VARCHAR(50) PRIMARY KEY,
          symbol VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          type VARCHAR(20),
          category VARCHAR(20),
          exchange VARCHAR(20),
          currency VARCHAR(10),
          country VARCHAR(50),
          sector VARCHAR(50),
          industry VARCHAR(50),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category),
          INDEX idx_type (type)
        )
      `);
      
      // Create users table if not exists
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create dashboard_widgets table if not exists
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS dashboard_widgets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          widget_type VARCHAR(50) NOT NULL,
          symbol VARCHAR(50) NOT NULL,
          name VARCHAR(100),
          script_src TEXT,
          config JSON,
          pos_x INT,
          pos_y INT,
          width INT,
          height INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      console.log('✅ Database tables initialized');
    } catch (err) {
      console.error('❌ Failed to initialize database tables:', err);
      throw err;
    }
  },

  async getAllSymbols() {
    try {
      const [symbols] = await dbPool.query('SELECT * FROM financial_symbols');
      return symbols;
    } catch (err) {
      console.error('❌ Failed to get symbols:', err);
      throw err;
    }
  },

  async refreshSymbols() {
    try {
      // Delegate entirely to the JSON-scanner scraper, 
      // which now upserts directly into MySQL. 
      const symbols = await symbolScraper.scrapeAll(); 
 
      // Bust Redis caches so the front-end sees the new data. 
      for (const cat of ["forex","crypto","stocks","bonds","index","futures"]) { 
        await redisClient.del(`symbols:${cat}`); 
      } 
 
      return symbols;
    } catch (err) {
      console.error('❌ Failed to refresh symbols:', err);
      throw err;
    }
  }
};

// --------------------------
// Authentication Service
// --------------------------
const authService = {
  async login(userLogin, passLogin) {
    try {
      if (!userLogin?.trim()) throw new Error('Login ID is required');
      if (!passLogin?.trim()) throw new Error('Password is required');
  
      // Find user (adjust table name if needed)
      const [users] = await dbPool.query(
        'SELECT id, userLogin, passLogin FROM Login WHERE userLogin = ? LIMIT 1',
        [userLogin.trim()]
      );
  
      if (!users.length) {
        console.warn(`Failed login attempt for: ${userLogin}`);
        throw new Error('Invalid credentials');
      }
  
      const user = users[0];

      // 1) Trim and normalize inputs
      const reqPass = passLogin.trim();
      const dbPass  = user.passLogin.trim();
      
      // 2) Debug‐log the exact strings & lengths
      console.log(
        "→ [login] reqPass:", JSON.stringify(reqPass), "len:", reqPass.length
      );
      console.log(
        "→ [login] dbPass :", JSON.stringify(dbPass),  "len:", dbPass.length
      );
      
      // 3) Compare, using bcrypt if the stored value is hashed
      const isHashed = dbPass.startsWith('$2a$') || dbPass.startsWith('$2b$');
      let passwordValid;
      if (isHashed) {
        passwordValid = await bcrypt.compare(reqPass, dbPass);
      } else {
        passwordValid = reqPass === dbPass;
      }
      
      console.log(
        `→ bcrypt.compare returned:`, passwordValid
      );
      
      if (!passwordValid) {
        console.warn(`Password mismatch for: ${userLogin}`);
        throw new Error('Invalid credentials');
      }
      const token = this.generateToken(user);
      console.log(`Successful login for: ${userLogin}`);
      return {
        token,
        user: {
          id: user.id,
          userLogin: user.userLogin
        }
      };
    } catch (err) {
      console.error('Login error:', { user: userLogin, error: err.message, timestamp: new Date().toISOString() });
      throw err;
    }
  },

  async register(userLogin, passLogin) {
    try {
      if (!userLogin?.trim()) throw new Error('Login ID is required');
      if (!passLogin?.trim()) throw new Error('Password is required');
      //if (passLogin.length < 8) throw new Error('Password must be at least 8 characters');
      //if (userLogin.length < 3) throw new Error('Login ID must be at least 3 characters');

      const [existing] = await dbPool.query(
        'SELECT id FROM Login WHERE userLogin = ? LIMIT 1',
        [userLogin.trim()]
      );
      if (existing.length) {
        throw new Error('Login ID already exists');
      }
      const passwordHash = await bcrypt.hash(passLogin, 12);
      const [result] = await dbPool.query(
        'INSERT INTO Login (userLogin, passLogin) VALUES (?, ?)',
        [userLogin.trim(), passwordHash]
      );
      console.log(`New user registered: ${userLogin}`);
      return { id: result.insertId, userLogin: userLogin.trim() };
    } catch (err) {
      console.error('Registration error:', { user: userLogin, error: err.message, timestamp: new Date().toISOString() });
      throw err;
    }
  },

  async upgradePassword(userId, plainPassword) {
    const hash = await bcrypt.hash(plainPassword, 12);
    await dbPool.query('UPDATE Login SET passLogin = ? WHERE id = ?', [hash, userId]);
    console.log(`Upgraded password for user ${userId} to hashed format`);
  },

  generateToken(user) {
    return jwt.sign(
      { userId: user.id, userLogin: user.userLogin, iat: Math.floor(Date.now() / 1000), role: 'user' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn, algorithm: 'HS256' }
    );
  }
};

// --------------------------
// Logging Middleware
// --------------------------
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ==========================================================
// Symbols Endpoints
// ==========================================================
app.get('/api/symbols', async (req, res) => {
  try {
    const { category } = req.query;
    const cacheKey = category ? `symbols:${category}` : 'symbols:all';
    const cachedSymbols = await redisClient.get(cacheKey);
    if (cachedSymbols) {
      console.log(`Returning cached symbols for: ${cacheKey}`);
      return res.json({ symbols: JSON.parse(cachedSymbols) });
    }
    let query, params;
    if (category) {
      query = `
        SELECT *
        FROM financial_symbols
        WHERE category = ?
        ORDER BY order_index ASC
      `;
      params = [category];
    } else {
      query = `
        SELECT *
        FROM financial_symbols
        ORDER BY order_index ASC
      `;
      params = [];
    }
    const [symbols] = await dbPool.query(query, params);
    await redisClient.setEx(cacheKey, 21600, JSON.stringify(symbols));
    return res.json({ symbols });
  } catch (err) {
    console.error("Failed to fetch symbols by order:", err);
    return res.status(500).json({ error: 'Failed to fetch symbols', details: err.message });
  }
});

app.post('/api/symbols/refresh', async (req, res) => {
  try {
    const symbols = await symbolService.refreshSymbols();
    res.json({ success: true, count: symbols.length, message: `Successfully refreshed ${symbols.length} symbols` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh symbols', details: err.message });
  }
});

app.get('/api/symbols/paginated', async (req, res) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    if (!category) return res.status(400).json({ error: 'Category parameter is required' });
    const offset = (page - 1) * limit;
    const [symbols] = await dbPool.query('SELECT * FROM financial_symbols WHERE category = ? LIMIT ? OFFSET ?', [category, parseInt(limit), offset]);
    res.json({ symbols, hasMore: symbols.length === parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch symbols', details: err.message });
  }
});

app.get('/api/symbols/search', async (req, res) => {
  const { category, q } = req.query;
  if (!category || !q) return res.status(400).json({ error: 'Category and query are required' });
  try {
    const [symbols] = await dbPool.query(
      'SELECT * FROM financial_symbols WHERE category = ? AND (symbol LIKE ? OR description LIKE ?) LIMIT 100',
      [category, `%${q}%`, `%${q}%`]
    );
    res.json({ symbols });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search symbols', details: err.message });
  }
});

app.get('/api/symbols/stream', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'Category parameter is required' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    const [initialSymbols] = await dbPool.query('SELECT * FROM financial_symbols WHERE category = ? LIMIT 100', [category]);
    res.write(`data: ${JSON.stringify(initialSymbols)}\n\n`);
    const updateInterval = setInterval(async () => {
      const [newSymbols] = await dbPool.query('SELECT * FROM financial_symbols WHERE category = ? ORDER BY RAND() LIMIT 5', [category]);
      if (newSymbols.length) res.write(`data: ${JSON.stringify(newSymbols)}\n\n`);
    }, 5000);
    req.on('close', () => { clearInterval(updateInterval); res.end(); });
  } catch (err) {
    console.error('SSE error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'SSE connection failed' });
  }
});

// ==========================================================
// Authentication Endpoints
// ==========================================================
app.post('/api/login', async (req, res) => {
  console.log("← /api/login received:", req.body);
  try {
    const { userLogin, passLogin } = req.body;
    if (!userLogin || !passLogin) {
      return res
        .status(400)
        .json({ error: 'userLogin and passLogin are required' });
    }
    // calls authService.login against your Login table
    const authData = await authService.login(userLogin, passLogin);
    res.json(authData);
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    //if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const user = await authService.register(username, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
});

// ==========================================================
// NEWS & CALENDAR Endpoints (Scraping Integration)
// ==========================================================
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'latest'; // Default category is 'latest'
  const page = parseInt(req.query.page) || 1; // Default page number is 1
  if (page < 1 || isNaN(page)) return res.status(400).json({ error: 'Invalid page number.' });
  const categoryToScraper = {
    latest: scrapeLatestNews,
    'breaking-news': scrapeBreakingNews,
    cryptocurrency: scrapeCryptoNews,
    'stock-markets': scrapeStockMarketNews,
    commodities: scrapeCommoditiesNews,
    currencies: scrapeCurrenciesNews,
    economy: scrapeEconomyNews,
    'economic-indicators': scrapeEconomicIndicatorsNews,
    politics: scrapePoliticsNews,
    world: scrapeWorldNews,
    'company-news': scrapeCompanyNews,
  };
  const scraper = categoryToScraper[category];
  if (!scraper) return res.status(400).json({ error: 'Invalid category provided.' });
  try {
    const { newsItems, totalPages } = await scraper(page);
    if (newsItems.length === 0)
      return res.status(404).json({ message: `No news found for category: ${category} on page: ${page}` });
    res.status(200).json({ newsItems, totalPages });
  } catch (error) {
    console.error(`Error fetching news for category: ${category}, page: ${page}`, error);
    res.status(500).json({ error: `Error fetching news for category: ${category}. Please try again later.` });
  }
});

// GET /api/news/detail - Scrape detailed content for a specific news item
app.get('/api/news/detail', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided for news detail.' });
  try {
    const newsDetails = await scrapeNewsDetails(decodeURIComponent(url));
    res.status(200).json(newsDetails);
  } catch (error) {
    console.error(`Error fetching news details for URL: ${url}`, error);
    res.status(500).json({ error: 'Error fetching news details. Please try again later.' });
  }
});

// GET /api/calendar - Scrape the economic calendar based on a timeframe
app.get('/api/calendar', async (req, res) => {
  const { timeframe } = req.query;
  if (!timeframe || typeof timeframe !== 'string')
    return res.status(400).json({ error: 'Please provide a valid timeframe.' });
  try {
    const events = await scrapeForexFactoryRange(timeframe);
    if (events.length === 0)
      return res.status(404).json({ error: `No events found for the specified timeframe: ${timeframe}` });
    res.status(200).json({ events });
  } catch (error) {
    console.error(`Error fetching calendar data for timeframe: ${timeframe}`, error);
    res.status(500).json({ error: 'Error fetching calendar data. Please try again later.' });
  }
});

// ==========================================================
// Background News Refresh (Every 30 Minutes)
// ==========================================================
const MAX_PAGES = 5;  // Increase this value to scrape more pages per category
const refreshCategories = [
  { name: 'latest', fn: scrapeLatestNews },
  { name: 'breaking-news', fn: scrapeBreakingNews },
  { name: 'cryptocurrency', fn: scrapeCryptoNews },
  { name: 'stock-markets', fn: scrapeStockMarketNews },
  { name: 'commodities', fn: scrapeCommoditiesNews },
  { name: 'currencies', fn: scrapeCurrenciesNews },
  { name: 'economy', fn: scrapeEconomyNews },
  { name: 'economic-indicators', fn: scrapeEconomicIndicatorsNews },
  { name: 'politics', fn: scrapePoliticsNews },
  { name: 'world', fn: scrapeWorldNews },
  { name: 'company-news', fn: scrapeCompanyNews },
];

cron.schedule('*/30 * * * *', async () => {
  console.log(`Starting scheduled news refresh at ${new Date()}`);
  for (const category of refreshCategories) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const data = await category.fn(page);
        console.log(`Refreshed category "${category.name}" page ${page} with ${data.newsItems.length} items`);
      } catch (err) {
        console.error(`Error refreshing category "${category.name}" page ${page}:`, err);
      }
    }
  }
  console.log(`Scheduled news refresh completed at ${new Date()}`);
});

// Weekly cron job to refresh symbols every Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('Starting weekly symbol refresh...');
  try {
    await symbolService.refreshSymbols();
    console.log('Weekly symbol refresh complete.');
  } catch (err) {
    console.error('Weekly symbol refresh failed:', err);
  }
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const iface = nets[name];
    if (!iface) continue;            // skip if undefined
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}


// ==========================================================
// Start Server and Graceful Shutdown
// ==========================================================
const CATEGORY_MAP = symbolScraperModule.CATEGORY_MAP || {
  forex:       'forex',
  crypto:      'crypto',
  stocks:      'stock',
  actions:     'stock',
  bonds:       'bonds',
  commodities: 'futures',
  indices:     'index'
};

async function ensureSymbolsInDb() {
  // For each category, check if there are any symbols in the DB
  for (const category of Object.keys(CATEGORY_MAP)) {
    const [rows] = await dbPool.query('SELECT COUNT(*) as count FROM financial_symbols WHERE category = ?', [category]);
    if (rows[0].count === 0) {
      console.log(`No symbols found in DB for category '${category}', scraping and populating...`);
      await symbolScraperModule.scrapeTradingViewSymbols(category);
      console.log(`Symbols for '${category}' populated.`);
    } else {
      console.log(`Symbols already present in DB for category '${category}', skipping initial scrape.`);
    }
  }
}

async function startServer() {
  try {
    // Initialize required services before starting the server
    await symbolService.init();
    await ensureSymbolsInDb();

    // Use HOST from environment with a default fallback
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server accessible via:
- http://localhost:${PORT}
- http://127.0.0.1:${PORT}
- Your local IP: http://${getLocalIp()}:${PORT}`);
    });

    return server;
  } catch (err) {
    console.error('❌ Server initialization failed:', err);
    process.exit(1);
  }
}
app.use(express.static(path.join(__dirname, '../../dist'), { 
  setHeaders: (res, filePath) => { 
    if (filePath.endsWith('.js')) { 
      res.setHeader('Content-Type', 'application/javascript'); 
    } 
  }, 
})); 
 
// client-side routing catch-all (ignore /api/*) 
app.get(/^\/(?!api\/).*/, (req, res) => { 
  res.sendFile(path.join(__dirname, '../../dist/index.html')); 
});
startServer();

// ==========================================================
// Graceful Shutdown
// ==========================================================
process.on('SIGTERM', async () => {
  try {
    await redisClient.quit();
    await dbPool.end();
    console.log('🛑 Server shutdown gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

// --------------------------
// JWT Middleware for widgets endpoints
// --------------------------
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
}

// ==========================================================
// Widgets Endpoints (CRUD)
// ==========================================================
app.get('/api/widgets', requireAuth, async (req, res) => {
  try {
    const [widgets] = await dbPool.query(
      'SELECT * FROM dashboard_widgets WHERE user_id = ?',
      [req.userId]
    );
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch widgets', details: err.message });
  }
});

app.post('/api/widgets', requireAuth, async (req, res) => {
  try {
    const { widget_type, symbol, name, script_src, config, position } = req.body;
    if (!widget_type || !symbol || !position) {
      return res.status(400).json({ error: 'widget_type, symbol, and position are required' });
    }
    const { x, y, width, height } = position;
    const [result] = await dbPool.query(
      'INSERT INTO dashboard_widgets (user_id, widget_type, symbol, name, script_src, config, pos_x, pos_y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, widget_type, symbol, name, script_src, JSON.stringify(config), x, y, width, height]
    );
    const [widgetRows] = await dbPool.query('SELECT * FROM dashboard_widgets WHERE id = ?', [result.insertId]);
    res.status(201).json(widgetRows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add widget', details: err.message });
  }
});

app.put('/api/widgets/:id', requireAuth, async (req, res) => {
  try {
    const widgetId = req.params.id;
    const { position, config, name } = req.body;
    // Only allow update if widget belongs to user
    const [widgets] = await dbPool.query('SELECT * FROM dashboard_widgets WHERE id = ? AND user_id = ?', [widgetId, req.userId]);
    if (!widgets.length) return res.status(404).json({ error: 'Widget not found' });
    const updates = [];
    const params = [];
    if (position) {
      updates.push('pos_x = ?', 'pos_y = ?', 'width = ?', 'height = ?');
      params.push(position.x, position.y, position.width, position.height);
    }
    if (config) {
      updates.push('config = ?');
      params.push(JSON.stringify(config));
    }
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(widgetId, req.userId);
    await dbPool.query(
      `UPDATE dashboard_widgets SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    const [updatedRows] = await dbPool.query('SELECT * FROM dashboard_widgets WHERE id = ?', [widgetId]);
    res.json(updatedRows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update widget', details: err.message });
  }
});

app.delete('/api/widgets/:id', requireAuth, async (req, res) => {
  try {
    const widgetId = req.params.id;
    // Only allow delete if widget belongs to user
    const [widgets] = await dbPool.query('SELECT * FROM dashboard_widgets WHERE id = ? AND user_id = ?', [widgetId, req.userId]);
    if (!widgets.length) return res.status(404).json({ error: 'Widget not found' });
    await dbPool.query('DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?', [widgetId, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete widget', details: err.message });
  }
});

// Bulk delete all widgets for the current user
app.delete('/api/widgets', requireAuth, async (req, res) => {
  try {
    await dbPool.query('DELETE FROM dashboard_widgets WHERE user_id = ?', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear dashboard', details: err.message });
  }
});
