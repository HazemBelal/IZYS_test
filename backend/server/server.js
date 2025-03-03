import express from "express";
import cors from "cors";
import redis from "redis";
import rateLimit from "express-rate-limit";
import mysql from "mysql2"; // <-- NEW import for MySQL
import { scrapeTradingViewSymbols } from "../scraper/SymbolsScraper.js";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Redis client for caching
const redisClient = redis.createClient();

// Handle Redis connection errors
redisClient.on("error", (err) => console.error("Redis error:", err));

// Connect to Redis
redisClient
  .connect()
  .then(() => {
    console.log("✅ Connected to Redis");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to Redis:", err);
  });

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// ▼▼ NEW: MySQL Database connection for login ▼▼
const db = mysql.createConnection({
  host: "mysql-merlet.alwaysdata.net",
  user: "merlet",
  password: "IzysQ4141",
  database: "merlet_288288288",
});
db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
  } else {
    console.log("✅ Connected to MySQL for login");
  }
});
// ▲▲ NEW: MySQL Database connection for login ▲▲

// Store scraped symbols in memory (fallback if Redis fails)
let scrapedSymbols = {};

// Pre-fetch symbols every 5 minutes
const preFetchSymbols = () => {
  const categories = ["forex", "crypto", "stocks", "bonds"];
  categories.forEach((category) => {
    scrapeTradingViewSymbols(category, (symbols) => {
      const cacheKey = `symbols:${category}`;

      // Cache ALL symbols in Redis
      redisClient
        .setEx(cacheKey, 300, JSON.stringify(symbols))
        .then(() =>
          console.log(`📦 Cached ${symbols.length} symbols for ${category}`)
        )
        .catch((err) =>
          console.error(`❌ Failed to cache symbols for ${category}:`, err)
        );

      // Ensure scrapedSymbols is an array
      if (!Array.isArray(scrapedSymbols[category])) {
        scrapedSymbols[category] = [];
      }

      // Add ALL symbols to scrapedSymbols
      scrapedSymbols[category] = symbols;
    });
  });
};

// Start pre-fetching on server start and every 5 minutes
preFetchSymbols();
setInterval(preFetchSymbols, 5 * 60 * 1000);

// SSE endpoint for streaming symbols
app.get("/api/symbols/stream", (req, res) => {
  const { category } = req.query;
  console.log("🔗 New SSE connection for category:", category);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Ensure scrapedSymbols is an array
  if (!Array.isArray(scrapedSymbols[category])) {
    scrapedSymbols[category] = [];
  }

  // Trigger scraping for the new category
  scrapeTradingViewSymbols(category, (symbols) => {
    console.log("📦 Scraped symbols:", symbols.length);

    // Ensure no duplicates
    const uniqueSymbols = symbols.filter((symbol) => {
      const key = `${symbol.symbol}-${symbol.exchange}`;
      return !scrapedSymbols[category].some(
        (s) => `${s.symbol}-${s.exchange}` === key
      );
    });

    console.log("📦 Unique symbols to send:", uniqueSymbols.length);

    // Add new symbols to scrapedSymbols
    scrapedSymbols[category] = [
      ...scrapedSymbols[category],
      ...uniqueSymbols,
    ];

    // Send ALL symbols to the frontend
    if (symbols.length > 0) {
      console.log("📤 Sending symbols to frontend via SSE...");
      res.write(`data: ${JSON.stringify(symbols)}\n\n`);
      console.log("📦 Sent symbols to the frontend:", symbols.length);
    }
  }).catch((error) => {
    console.error("❌ Error during scraping:", error);
    res.write(`data: ${JSON.stringify({ error: "Failed to scrape symbols" })}\n\n`);
  });

  // Cleanup on client disconnect
  req.on("close", () => {
    console.log("Client disconnected from SSE stream");
  });
});

// API Route: Receive symbol batches
app.post("/api/symbols/batch", (req, res) => {
  try {
    const { batch, category } = req.body;

    if (!batch || !Array.isArray(batch) || !category) {
      return res
        .status(400)
        .json({ error: "Invalid batch data or category." });
    }

    if (!Array.isArray(scrapedSymbols[category])) {
      scrapedSymbols[category] = [];
    }

    // Filter out duplicates
    const uniqueBatch = batch.filter((symbol) => {
      const key = `${symbol.symbol}-${symbol.exchange}`;
      return !scrapedSymbols[category].some(
        (s) => `${s.symbol}-${s.exchange}` === key
      );
    });

    // Add the unique batch
    scrapedSymbols[category] = [
      ...scrapedSymbols[category],
      ...uniqueBatch,
    ];
    console.log(
      `📦 Received batch. Total symbols for ${category}: ${scrapedSymbols[category].length}`
    );

    res
      .status(200)
      .json({ success: true, totalSymbols: scrapedSymbols[category].length });
  } catch (error) {
    console.error("❌ Error processing symbol batch:", error);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

// API Route: Get symbols by category
app.get("/api/symbols", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ error: "Category is required." });
    }

    const cacheKey = `symbols:${category}`;
    // Check Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const symbols = JSON.parse(cachedData);
      console.log(`📦 Total symbols in Redis for ${category}: ${symbols.length}`);
      return res.json({ symbols });
    }

    // Fallback to in-memory
    if (scrapedSymbols[category]) {
      console.log(
        `📦 Total symbols in memory for ${category}: ${scrapedSymbols[category].length}`
      );
      return res.json({ symbols: scrapedSymbols[category] });
    }

    // If no cache, scrape
    const symbols = await new Promise((resolve, reject) => {
      scrapeTradingViewSymbols(category, (scraped) => {
        resolve(scraped);
      });
    });

    console.log(`📦 Total symbols scraped for ${category}: ${symbols.length}`);
    return res.json({ symbols });
  } catch (error) {
    console.error(`❌ Error fetching TradingView symbols:`, error);
    res
      .status(500)
      .json({ error: "Internal server error. Please try again later." });
  }
});

// ▼▼ NEW: Add the /login route with MySQL verification ▼▼
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const query = "SELECT * FROM Login WHERE userLogin = ? AND passLogin = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error during login query:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res
        .status(401)
        .json({ message: "Invalid username or password" });
    }
  });
});
// ▲▲ NEW: Add the /login route with MySQL verification ▲▲

// Start the server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
