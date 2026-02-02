/**
 * Cache Service
 * Handles static file caching for XDMoD query results
 */

const fs = require('fs').promises;
const path = require('path');
const schedule = require('node-schedule');
const xdmodService = require('./xdmodService');

const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
}

/**
 * Write data to cache file
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 */
async function writeCache(key, data) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: data
    }, null, 2));
    console.log(`Cache updated: ${key}`);
  } catch (error) {
    console.error(`Error writing cache for ${key}:`, error);
  }
}

/**
 * Read data from cache file
 * @param {string} key - Cache key
 * @returns {Promise<*>} Cached data
 */
async function readCache(key) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const cached = JSON.parse(content);
    return cached.data;
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Update all caches
 */
async function updateAllCaches() {
  console.log('Starting cache update...');

  try {
    // GPU Usage by User (last 7 days - default)
    const gpuUsageByUser = await xdmodService.getGPUUsageByUser();
    await writeCache('gpu-usage-by-user', gpuUsageByUser);

    // Job Stats for different time ranges
try {
      const jobStats1d = await xdmodService.getJobStatsLast7Days(1);
      await writeCache('job-stats-1d', jobStats1d);
    } catch (error) {
      console.error('Error updating job-stats-1d:', error.message);
    }

    try {
      const jobStats7d = await xdmodService.getJobStatsLast7Days(7);
      await writeCache('job-stats-7d', jobStats7d);
    } catch (error) {
      console.error('Error updating job-stats-7d:', error.message);
    }

    try {
      const jobStats30d = await xdmodService.getJobStatsLast7Days(30);
      await writeCache('job-stats-30d', jobStats30d);
    } catch (error) {
      console.error('Error updating job-stats-30d:', error.message);
    }

    // AISG Wait Time for different time ranges
    try {
      const aisgWaitTime1d = await xdmodService.getAISGWaitTime(1);
      await writeCache('aisg-wait-time-1d', aisgWaitTime1d);
    } catch (error) {
      console.error('Error updating aisg-wait-time-1d:', error.message);
    }

    try {
      const aisgWaitTime7d = await xdmodService.getAISGWaitTime(7);
      await writeCache('aisg-wait-time-7d', aisgWaitTime7d);
    } catch (error) {
      console.error('Error updating aisg-wait-time-7d:', error.message);
    }

    try {
      const aisgWaitTime30d = await xdmodService.getAISGWaitTime(30);
      await writeCache('aisg-wait-time-30d', aisgWaitTime30d);
    } catch (error) {
      console.error('Error updating aisg-wait-time-30d:', error.message);
    }

    // NUS IT Wait Time for different time ranges
    try {
      const nusitWaitTime1d = await xdmodService.getNUSITWaitTime(1);
      await writeCache('nusit-wait-time-1d', nusitWaitTime1d);
    } catch (error) {
      console.error('Error updating nusit-wait-time-1d:', error.message);
    }

    try {
      const nusitWaitTime7d = await xdmodService.getNUSITWaitTime(7);
      await writeCache('nusit-wait-time-7d', nusitWaitTime7d);
    } catch (error) {
      console.error('Error updating nusit-wait-time-7d:', error.message);
    }

    try {
      const nusitWaitTime30d = await xdmodService.getNUSITWaitTime(30);
      await writeCache('nusit-wait-time-30d', nusitWaitTime30d);
    } catch (error) {
      console.error('Error updating nusit-wait-time-30d:', error.message);
    }

    console.log('Cache update completed successfully');
  } catch (error) {
    console.error('Error updating caches:', error);
  }
}

/**
 * Initialize cache service
 */
async function initializeCacheService() {
  await ensureCacheDir();

  // Update cache immediately on startup
  console.log('Initializing cache service...');
  await updateAllCaches();

  // Schedule daily updates at 2 AM
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('Running scheduled cache update...');
    await updateAllCaches();
  });

  console.log('Cache service initialized. Daily updates scheduled at 2:00 AM.');
}

module.exports = {
  initializeCacheService,
  updateAllCaches,
  readCache,
  writeCache,
};
