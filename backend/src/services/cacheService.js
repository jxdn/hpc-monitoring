/**
 * Cache Service
 * Handles static file caching for XDMoD query results
 */

const fs = require('fs').promises;
const path = require('path');
const schedule = require('node-schedule');
const xdmodService = require('./xdmodService');
const prometheusService = require('./prometheusService');

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
    // =========================================================
    // HOPPER caches
    // =========================================================

    // GPU Usage by User
    try {
      const data = await xdmodService.getGPUUsageByUser(1, 'hopper');
      await writeCache('gpu-usage-by-user-1d', data);
    } catch (error) {
      console.error('Error updating gpu-usage-by-user-1d:', error.message);
    }

    try {
      const data = await xdmodService.getGPUUsageByUser(7, 'hopper');
      await writeCache('gpu-usage-by-user-7d', data);
    } catch (error) {
      console.error('Error updating gpu-usage-by-user-7d:', error.message);
    }

    try {
      const data = await xdmodService.getGPUUsageByUser(30, 'hopper');
      await writeCache('gpu-usage-by-user-30d', data);
    } catch (error) {
      console.error('Error updating gpu-usage-by-user-30d:', error.message);
    }

    // Job Stats
    try {
      const data = await xdmodService.getJobStatsLast7Days(1, 'hopper');
      await writeCache('job-stats-1d', data);
    } catch (error) {
      console.error('Error updating job-stats-1d:', error.message);
    }

    try {
      const data = await xdmodService.getJobStatsLast7Days(7, 'hopper');
      await writeCache('job-stats-7d', data);
    } catch (error) {
      console.error('Error updating job-stats-7d:', error.message);
    }

    try {
      const data = await xdmodService.getJobStatsLast7Days(30, 'hopper');
      await writeCache('job-stats-30d', data);
    } catch (error) {
      console.error('Error updating job-stats-30d:', error.message);
    }

    // AISG Wait Time
    try {
      const data = await xdmodService.getAISGWaitTime(1, 'hopper');
      await writeCache('aisg-wait-time-1d', data);
    } catch (error) {
      console.error('Error updating aisg-wait-time-1d:', error.message);
    }

    try {
      const data = await xdmodService.getAISGWaitTime(7, 'hopper');
      await writeCache('aisg-wait-time-7d', data);
    } catch (error) {
      console.error('Error updating aisg-wait-time-7d:', error.message);
    }

    try {
      const data = await xdmodService.getAISGWaitTime(30, 'hopper');
      await writeCache('aisg-wait-time-30d', data);
    } catch (error) {
      console.error('Error updating aisg-wait-time-30d:', error.message);
    }

    // NUS IT Wait Time
    try {
      const data = await xdmodService.getNUSITWaitTime(1, 'hopper');
      await writeCache('nusit-wait-time-1d', data);
    } catch (error) {
      console.error('Error updating nusit-wait-time-1d:', error.message);
    }

    try {
      const data = await xdmodService.getNUSITWaitTime(7, 'hopper');
      await writeCache('nusit-wait-time-7d', data);
    } catch (error) {
      console.error('Error updating nusit-wait-time-7d:', error.message);
    }

    try {
      const data = await xdmodService.getNUSITWaitTime(30, 'hopper');
      await writeCache('nusit-wait-time-30d', data);
    } catch (error) {
      console.error('Error updating nusit-wait-time-30d:', error.message);
    }

    // Monthly GPU Hours
    try {
      const data = await xdmodService.getMonthlyGPUHours('hopper');
      await writeCache('monthly-gpu-hours', data);
    } catch (error) {
      console.error('Error updating monthly-gpu-hours:', error.message);
    }

    // =========================================================
    // VANDA caches
    // =========================================================

    // GPU Usage by User
    try {
      const data = await xdmodService.getGPUUsageByUser(1, 'vanda');
      await writeCache('vanda-gpu-usage-by-user-1d', data);
    } catch (error) {
      console.error('Error updating vanda-gpu-usage-by-user-1d:', error.message);
    }

    try {
      const data = await xdmodService.getGPUUsageByUser(7, 'vanda');
      await writeCache('vanda-gpu-usage-by-user-7d', data);
    } catch (error) {
      console.error('Error updating vanda-gpu-usage-by-user-7d:', error.message);
    }

    try {
      const data = await xdmodService.getGPUUsageByUser(30, 'vanda');
      await writeCache('vanda-gpu-usage-by-user-30d', data);
    } catch (error) {
      console.error('Error updating vanda-gpu-usage-by-user-30d:', error.message);
    }

    // CPU Usage by User
    try {
      const data = await xdmodService.getCPUUsageByUser(1, 'vanda');
      await writeCache('vanda-cpu-usage-by-user-1d', data);
    } catch (error) {
      console.error('Error updating vanda-cpu-usage-by-user-1d:', error.message);
    }

    try {
      const data = await xdmodService.getCPUUsageByUser(7, 'vanda');
      await writeCache('vanda-cpu-usage-by-user-7d', data);
    } catch (error) {
      console.error('Error updating vanda-cpu-usage-by-user-7d:', error.message);
    }

    try {
      const data = await xdmodService.getCPUUsageByUser(30, 'vanda');
      await writeCache('vanda-cpu-usage-by-user-30d', data);
    } catch (error) {
      console.error('Error updating vanda-cpu-usage-by-user-30d:', error.message);
    }

    // Job Stats
    try {
      const data = await xdmodService.getJobStatsLast7Days(1, 'vanda');
      await writeCache('vanda-job-stats-1d', data);
    } catch (error) {
      console.error('Error updating vanda-job-stats-1d:', error.message);
    }

    try {
      const data = await xdmodService.getJobStatsLast7Days(7, 'vanda');
      await writeCache('vanda-job-stats-7d', data);
    } catch (error) {
      console.error('Error updating vanda-job-stats-7d:', error.message);
    }

    try {
      const data = await xdmodService.getJobStatsLast7Days(30, 'vanda');
      await writeCache('vanda-job-stats-30d', data);
    } catch (error) {
      console.error('Error updating vanda-job-stats-30d:', error.message);
    }

    // GPU Queue Wait Time (maps to "AISG" slot for Vanda: batch_gpu, gpu, gpu_amd, interactive_gpu)
    try {
      const data = await xdmodService.getAISGWaitTime(1, 'vanda');
      await writeCache('vanda-aisg-wait-time-1d', data);
    } catch (error) {
      console.error('Error updating vanda-aisg-wait-time-1d:', error.message);
    }

    try {
      const data = await xdmodService.getAISGWaitTime(7, 'vanda');
      await writeCache('vanda-aisg-wait-time-7d', data);
    } catch (error) {
      console.error('Error updating vanda-aisg-wait-time-7d:', error.message);
    }

    try {
      const data = await xdmodService.getAISGWaitTime(30, 'vanda');
      await writeCache('vanda-aisg-wait-time-30d', data);
    } catch (error) {
      console.error('Error updating vanda-aisg-wait-time-30d:', error.message);
    }

    // Monthly GPU Hours
    try {
      const data = await xdmodService.getMonthlyGPUHours('vanda');
      await writeCache('vanda-monthly-gpu-hours', data);
    } catch (error) {
      console.error('Error updating vanda-monthly-gpu-hours:', error.message);
    }

    // =========================================================
    // Hardware & Power (shared, not cluster-specific)
    // =========================================================

    try {
      await prometheusService.updateHardwareStatusCache();
    } catch (error) {
      console.error('Error updating hardware status:', error.message);
    }

    try {
      await prometheusService.updatePowerStatusCache();
    } catch (error) {
      console.error('Error updating power status:', error.message);
    }

    // =========================================================
    // Executive Summary (cross-cluster statistics)
    // =========================================================

    try {
      const data = await xdmodService.getTotalJobsByCluster();
      await writeCache('total-jobs-by-cluster', data);
      console.log('Cache updated: total-jobs-by-cluster');
    } catch (error) {
      console.error('Error updating total-jobs-by-cluster:', error.message);
    }

    try {
      const data = await xdmodService.getTotalCpuHoursByCluster();
      await writeCache('total-cpu-hours-by-cluster', data);
      console.log('Cache updated: total-cpu-hours-by-cluster');
    } catch (error) {
      console.error('Error updating total-cpu-hours-by-cluster:', error.message);
    }

    try {
      const data = await xdmodService.getTotalGpuHoursByCluster();
      await writeCache('total-gpu-hours-by-cluster', data);
      console.log('Cache updated: total-gpu-hours-by-cluster');
    } catch (error) {
      console.error('Error updating total-gpu-hours-by-cluster:', error.message);
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

  // Schedule hourly updates at the top of every hour
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Running scheduled cache update...');
    await updateAllCaches();
  });

  // Schedule hardware status updates every 3 minutes
  schedule.scheduleJob('*/3 * * * *', async () => {
    try {
      await prometheusService.updateHardwareStatusCache();
    } catch (error) {
      console.error('Error in scheduled hardware status update:', error.message);
    }
  });

  // Schedule power status updates every 3 minutes
  schedule.scheduleJob('*/3 * * * *', async () => {
    try {
      await prometheusService.updatePowerStatusCache();
    } catch (error) {
      console.error('Error in scheduled power status update:', error.message);
    }
  });

  console.log('Cache service initialized. Hourly updates scheduled at :00 of every hour.');
  console.log('Hardware and power status updates scheduled every 3 minutes.');
}

module.exports = {
  initializeCacheService,
  updateAllCaches,
  readCache,
  writeCache,
};
