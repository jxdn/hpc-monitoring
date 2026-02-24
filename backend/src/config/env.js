/**
 * Environment Configuration
 * Loads and validates environment variables
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const config = {
  // Environment mode
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // VictoriaMetrics Configuration
  prometheus: {
    url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
    timeout: parseInt(process.env.PROMETHEUS_TIMEOUT) || 10000,
    prefix: process.env.PBS_EXPORTER_PREFIX || '',
    jobName: process.env.PBS_EXPORTER_JOB_NAME || 'pbs-exporter',
    username: process.env.PROMETHEUS_USERNAME,
    password: process.env.PROMETHEUS_PASSWORD,
    token: process.env.PROMETHEUS_TOKEN,
  },

  // API Server
  api: {
    port: parseInt(process.env.API_PORT) || 5000,
    host: process.env.API_HOST || 'localhost',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Cache & Data
  cache: {
    ttl: parseInt(process.env.DATA_CACHE_TTL) || 30000, // 30 seconds
  },

  // Historical Data
  history: {
    enabled: process.env.ENABLE_HISTORY === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/pbs-api.log',
  },

  // MySQL Database (XDMoD)
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 6032,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'modw',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  },
};

// Validation
if (!config.prometheus.url) {
  console.warn('WARNING: PROMETHEUS_URL is not set');
}

module.exports = config;
