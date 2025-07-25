const express = require('express');
const winston = require('winston');
const db = require('../lib/database');

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(health);
  } catch (error) {
    winston.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Detailed health check with database
router.get('/detailed', async (req, res) => {
  try {
    const dbHealth = await db.checkHealth();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Check if all systems are healthy
    if (dbHealth.postgresql === 'error' || dbHealth.redis === 'error') {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    winston.error('Detailed health check failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message 
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await db.checkHealth();
    
    res.json({
      success: true,
      database: dbHealth
    });
  } catch (error) {
    winston.error('Database health check failed:', error);
    res.status(500).json({ 
      error: 'Database health check failed',
      message: error.message 
    });
  }
});

// System info
router.get('/system', (req, res) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      pid: process.pid,
      title: process.title,
      argv: process.argv,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    };

    res.json({
      success: true,
      system: systemInfo
    });
  } catch (error) {
    winston.error('System info check failed:', error);
    res.status(500).json({ 
      error: 'System info check failed',
      message: error.message 
    });
  }
});

// API status
router.get('/api', (req, res) => {
  try {
    const apiStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        chat: 'operational',
        threads: 'operational',
        collaboration: 'operational',
        health: 'operational'
      },
      features: {
        ai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        database: 'connected',
        redis: 'connected',
        websockets: 'operational'
      }
    };

    res.json({
      success: true,
      api: apiStatus
    });
  } catch (error) {
    winston.error('API status check failed:', error);
    res.status(500).json({ 
      error: 'API status check failed',
      message: error.message 
    });
  }
});

module.exports = router; 