import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import os from 'os';
const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  // Updated MySQL configuration for your remote database
  mysql: {
    host: "mysql-merlet.alwaysdata.net",
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

// Initialize Redis with error handling
let redisClient;
try {
  redisClient = createClient(config.redis);
  redisClient.on('error', err => console.error('Redis Error:', err));
  await redisClient.connect();
  console.log('✅ Connected to Redis');
} catch (err) {
  console.error('❌ Failed to connect to Redis:', err);
  // Fallback in-memory cache
  redisClient = {
    get: async () => null,
    set: async () => {},
    setEx: async () => {},
    quit: async () => {}
  };
}

// Initialize MySQL with error handling
let dbPool;
try {
  dbPool = mysql.createPool(config.mysql);
  await dbPool.query('SELECT 1');
  console.log('✅ Connected to MySQL');
} catch (err) {
  console.error('❌ Failed to connect to MySQL:', err);
  // Fallback in-memory storage
  let symbols = [];
  let users = []; // For login functionality fallback
  dbPool = {
    query: async (sql, values) => {
      if (sql.includes('SELECT * FROM financial_symbols')) return [symbols];
      if (sql.includes('SELECT * FROM users')) return [users];
      if (sql.includes('TRUNCATE')) {
        symbols = [];
        return [];
      }
      if (sql.includes('INSERT INTO financial_symbols')) {
        symbols.push(...values[0].map(v => ({
          id: v[0], symbol: v[1], name: v[2], type: v[3], exchange: v[4]
        })));
        return [];
      }
      if (sql.includes('INSERT INTO users')) {
        users.push({
          id: values[0][0],
          username: values[0][1],
          password_hash: values[0][2]
        });
        return [];
      }
      return [];
    },
    end: async () => {}
  };
}

// Import symbol scraper
let symbolScraper;
try {
  const module = await import('../scraper/SymbolsScraper.js');
  symbolScraper = module.scrapeFinancialSymbols;
  console.log('✅ Symbol scraper loaded successfully');
} catch (err) {
  console.error('❌ Failed to load symbol scraper:', err);
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Database operations
const symbolService = {
  async init() {
    try {
      // Create symbols table if not exists
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS financial_symbols (
          id VARCHAR(50) PRIMARY KEY,
          symbol VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(20),
          exchange VARCHAR(20),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      const symbols = await symbolScraper();
      await dbPool.query('TRUNCATE TABLE financial_symbols');
      const values = symbols.map(s => [s.id, s.symbol, s.name, s.type, s.exchange]);
      await dbPool.query(
        'INSERT INTO financial_symbols (id, symbol, name, type, exchange) VALUES ?',
        [values]
      );
      return symbols;
    } catch (err) {
      console.error('❌ Failed to refresh symbols:', err);
      throw err;
    }
  }
};

// Authentication service
const authService = {
  /**
   * Authenticates a user and returns a JWT token
   * @param {string} userLogin - User's login ID
   * @param {string} passLogin - User's password
   * @returns {Promise<{token: string, user: {id: number, userLogin: string}}>}
   * @throws {Error} If authentication fails
   */
  async login(userLogin, passLogin) {
    try {
      // Validate input
      if (!userLogin?.trim()) throw new Error('Login ID is required');
      if (!passLogin?.trim()) throw new Error('Password is required');
  
      // Find user
      const [users] = await dbPool.query(
        'SELECT id, userLogin, passLogin FROM Login WHERE userLogin = ? LIMIT 1',
        [userLogin.trim()]
      );
  
      if (!users.length) {
        console.warn(`Failed login attempt for: ${userLogin}`);
        throw new Error('Invalid credentials');
      }
  
      const user = users[0];
      let passwordValid = false;
  
      // Check if password is hashed (bcrypt format)
      const isHashed = user.passLogin.startsWith('$2a$') || 
                      user.passLogin.startsWith('$2b$');
  
      // Password comparison
      if (isHashed) {
        passwordValid = await bcrypt.compare(passLogin, user.passLogin);
      } else {
        // Plaintext fallback (with auto-upgrade)
        passwordValid = passLogin === user.passLogin;
      }
  
      if (!passwordValid) {
        console.warn(`Password mismatch for: ${userLogin}`);
        throw new Error('Invalid credentials');
      }
  
      // Generate JWT token (don't modify password field)
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
      console.error('Login error:', {
        user: userLogin,
        error: err.message,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  },
  
  
  /**
   * Registers a new user with secure password hashing
   * @param {string} userLogin - New login ID
   * @param {string} passLogin - New password
   * @returns {Promise<{id: number, userLogin: string}>}
   * @throws {Error} If registration fails
   */
  async register(userLogin, passLogin) {
    try {
      // Validate input
      if (!userLogin?.trim()) throw new Error('Login ID is required');
      if (!passLogin?.trim()) throw new Error('Password is required');
      if (passLogin.length < 8) throw new Error('Password must be at least 8 characters');
      if (userLogin.length < 3) throw new Error('Login ID must be at least 3 characters');

      // Check for existing user
      const [existing] = await dbPool.query(
        'SELECT id FROM Login WHERE userLogin = ? LIMIT 1',
        [userLogin.trim()]
      );

      if (existing.length) {
        throw new Error('Login ID already exists');
      }

      // Hash password with strong cost factor
      const passwordHash = await bcrypt.hash(passLogin, 12);

      // Create new user
      const [result] = await dbPool.query(
        'INSERT INTO Login (userLogin, passLogin) VALUES (?, ?)',
        [userLogin.trim(), passwordHash]
      );

      console.log(`New user registered: ${userLogin}`);
      return {
        id: result.insertId,
        userLogin: userLogin.trim()
      };
    } catch (err) {
      console.error('Registration error:', {
        user: userLogin,
        error: err.message,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  },

  /**
   * Upgrades plaintext password to hashed version
   * @private
   */
  async upgradePassword(userId, plainPassword) {
    const hash = await bcrypt.hash(plainPassword, 12);
    await dbPool.query(
      'UPDATE Login SET passLogin = ? WHERE id = ?',
      [hash, userId]
    );
    console.log(`Upgraded password for user ${userId} to hashed format`);
  },

  /**
   * Generates JWT token
   * @private
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        userLogin: user.userLogin,
        iat: Math.floor(Date.now() / 1000),  // Issued at time
        role: 'user'  // You can add additional claims here (e.g., user role)
      },
      config.jwt.secret,  // JWT Secret (from config)
      {
        expiresIn: config.jwt.expiresIn,  // Token expiration time
        algorithm: 'HS256'  // Algorithm for signing the token
      }
    );
  }
  
};

// Routes
app.get('/api/symbols', async (req, res) => {
  try {
    const symbols = await symbolService.getAllSymbols();
    res.json({ symbols });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch symbols',
      details: err.message
    });
  }
});

app.post('/api/symbols/refresh', async (req, res) => {
  try {
    const symbols = await symbolService.refreshSymbols();
    res.json({ 
      success: true, 
      count: symbols.length,
      message: `Successfully refreshed ${symbols.length} symbols`
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to refresh symbols',
      details: err.message
    });
  }
});

// Authentication routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const authData = await authService.login(username, password);
    res.json(authData);
  } catch (err) {
    res.status(401).json({ 
      error: 'Authentication failed',
      details: err.message
    });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const user = await authService.register(username, password);
    res.json({ 
      success: true,
      user
    });
  } catch (err) {
    res.status(400).json({ 
      error: 'Registration failed',
      details: err.message
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database first
    await symbolService.init();
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server accessible via:
      - http://localhost:${PORT}
      - http://127.0.0.1:${PORT}
      - Your local IP: http://${getLocalIp()}:${PORT}`);
    });

    function getLocalIp() {
      return Object.values(os.networkInterfaces())
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address;
    }
    
    // Initial data load (in background)
    symbolService.refreshSymbols()
      .then(symbols => console.log(`✅ Loaded ${symbols.length} symbols`))
      .catch(err => console.error('⚠️ Initial symbol load failed:', err));
    
    return server;
  } catch (err) {
    console.error('❌ Server initialization failed:', err);
    process.exit(1);
  }
}


// Start the server
startServer();

// Graceful shutdown
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