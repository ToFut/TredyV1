const { Pool } = require('pg');
const Redis = require('ioredis');
const winston = require('winston');

// Create a logger instance for this module
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'flowchat-database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  // Don't exit the process, just log the error
});

// Handle Redis errors
redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

// Health check function
async function checkHealth() {
  try {
    // Test PostgreSQL connection
    const pgClient = await pool.connect();
    await pgClient.query('SELECT 1');
    pgClient.release();
    
    // Test Redis connection
    await redis.ping();
    
    return {
      postgresql: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Health check failed:', error);
    return {
      postgresql: 'error',
      redis: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Database utilities
const db = {
  // Query with automatic connection management
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.info('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Query error:', { text, error: error.message });
      // Return null instead of throwing error to allow graceful degradation
      return null;
    }
  },

  // Get a client for transactions
  async getClient() {
    return await pool.connect();
  },

  // Transaction helper
  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Redis operations
  redis: {
    async get(key) {
      try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        winston.error('Redis get error:', error);
        return null;
      }
    },

    async set(key, value, ttl = null) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl) {
          await redis.setex(key, ttl, serialized);
        } else {
          await redis.set(key, serialized);
        }
        return true;
      } catch (error) {
        winston.error('Redis set error:', error);
        return false;
      }
    },

    async del(key) {
      try {
        await redis.del(key);
        return true;
      } catch (error) {
        winston.error('Redis del error:', error);
        return false;
      }
    },

    async exists(key) {
      try {
        return await redis.exists(key);
      } catch (error) {
        winston.error('Redis exists error:', error);
        return false;
      }
    },

    async hset(key, field, value) {
      try {
        await redis.hset(key, field, JSON.stringify(value));
        return true;
      } catch (error) {
        winston.error('Redis hset error:', error);
        return false;
      }
    },

    async hget(key, field) {
      try {
        const value = await redis.hget(key, field);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        winston.error('Redis hget error:', error);
        return null;
      }
    },

    async hgetall(key) {
      try {
        const values = await redis.hgetall(key);
        const result = {};
        for (const [field, value] of Object.entries(values)) {
          result[field] = JSON.parse(value);
        }
        return result;
      } catch (error) {
        winston.error('Redis hgetall error:', error);
        return {};
      }
    }
  },

  // Health check
  checkHealth,

  // Close connections
  async close() {
    await pool.end();
    await redis.quit();
  }
};

module.exports = db; 