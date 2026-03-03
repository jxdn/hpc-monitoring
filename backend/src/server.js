/**
 * Express API Server for PBS Pro Monitoring
 */

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const config = require('./config/env');
const pbsService = require('./services/pbsService');
const xdmodService = require('./services/xdmodService');
const cacheService = require('./services/cacheService');
const pdfService = require('./services/pdfService');
const prometheusService = require('./services/prometheusService');

const app = express();
const cache = new NodeCache({ stdTTL: config.cache.ttl / 1000 });

// Middleware
app.use(cors({ origin: config.api.corsOrigin }));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/jobs
 * Get all jobs
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const cacheKey = 'jobs';
    let jobs = cache.get(cacheKey);

    if (!jobs) {
      jobs = await pbsService.getJobs();
      cache.set(cacheKey, jobs);
    }

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:id
 * Get specific job details
 */
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await pbsService.getJob(req.params.id);
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await pbsService.deleteJob(req.params.id);
    cache.del('jobs'); // Invalidate cache
    res.json({ message: `Job ${req.params.id} deleted successfully` });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:id/hold
 * Hold a job
 */
app.post('/api/jobs/:id/hold', async (req, res) => {
  try {
    await pbsService.holdJob(req.params.id);
    cache.del('jobs'); // Invalidate cache
    res.json({ message: `Job ${req.params.id} held successfully` });
  } catch (error) {
    console.error('Error holding job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jobs/:id/release
 * Release a job
 */
app.post('/api/jobs/:id/release', async (req, res) => {
  try {
    await pbsService.releaseJob(req.params.id);
    cache.del('jobs'); // Invalidate cache
    res.json({ message: `Job ${req.params.id} released successfully` });
  } catch (error) {
    console.error('Error releasing job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/nodes
 * Get all nodes
 */
app.get('/api/nodes', async (req, res) => {
  try {
    const cacheKey = 'nodes';
    let nodes = cache.get(cacheKey);

    if (!nodes) {
      nodes = await pbsService.getNodes();
      cache.set(cacheKey, nodes);
    }

    res.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats/cluster
 * Get cluster statistics
 */
app.get('/api/stats/cluster', async (req, res) => {
  try {
    const cacheKey = 'cluster-stats';
    let stats = cache.get(cacheKey);

    if (!stats) {
      stats = await pbsService.getClusterStats();
      cache.set(cacheKey, stats);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching cluster stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queues
 * Get queue information
 */
app.get('/api/queues', async (req, res) => {
  try {
    const cacheKey = 'queues';
    let queues = cache.get(cacheKey);

    if (!queues) {
      queues = await pbsService.getQueues();
      cache.set(cacheKey, queues);
    }

    res.json(queues);
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hardware/status
 * Get hardware health status from iDRAC SNMP metrics
 */
app.get('/api/hardware/status', async (req, res) => {
  try {
    const data = prometheusService.getCachedHardwareStatus();
    
    if (!data) {
      return res.status(503).json({ error: 'Hardware status not yet initialized' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching hardware status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hardware/power
 * Get current power consumption per node
 */
app.get('/api/hardware/power', async (req, res) => {
  try {
    const data = prometheusService.getCachedPowerStatus();
    
    if (!data) {
      return res.status(503).json({ error: 'Power status not yet initialized' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching power status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hardware/power/history
 * Get power consumption history
 * Query params: range (1d, 7d, 30d)
 */
app.get('/api/hardware/power/history', async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const data = await prometheusService.getPowerHistory(range);
    res.json(data);
  } catch (error) {
    console.error('Error fetching power history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/jobs
 * Get job statistics over time from Prometheus
 * Query params: timeRange (1h, 24h, 7d, 30d)
 */
app.get('/api/analytics/jobs', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const data = await pbsService.getJobAnalytics(timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error fetching job analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/resources
 * Get resource utilization over time from Prometheus
 * Query params: timeRange (1h, 24h, 7d, 30d)
 */
app.get('/api/analytics/resources', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const data = await pbsService.getResourceAnalytics(timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error fetching resource analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/gpu-occupation
 * Get average GPU occupation rates for node groups
 * Query params: timeRange (24h, 7d, 30d)
 */
app.get('/api/analytics/gpu-occupation', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const data = await pbsService.getGPUOccupation(timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error fetching GPU occupation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/gpu-usage-by-user
 * Get GPU usage statistics by user from cached data
 * Shows top 7 users by total GPU hours
 * Query params: timeRange (1d, 7d, 30d)
 */
 app.get('/api/analytics/gpu-usage-by-user', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `gpu-usage-by-user-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching GPU usage by user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/job-stats
 * Get job statistics from cached data
 * Query params: timeRange (1d, 7d, 30d)
 */
app.get('/api/analytics/job-stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `job-stats-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);

    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/aisg-wait-time
 * Get AISG queue wait time statistics from cached data
 * Query params: timeRange (1d, 7d, 30d)
 */
app.get('/api/analytics/aisg-wait-time', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `aisg-wait-time-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);

    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching AISG wait time:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/nusit-wait-time
 * Get NUS IT queue wait time statistics from cached data
 * Query params: timeRange (1d, 7d, 30d)
 */
app.get('/api/analytics/nusit-wait-time', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `nusit-wait-time-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);

    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching NUS IT wait time:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/monthly-gpu-hours
 * Get monthly GPU hours for the last 2 years
 */
app.get('/api/analytics/monthly-gpu-hours', async (req, res) => {
  try {
    // Try to read from cache first
    const cachedData = await cacheService.readCache('monthly-gpu-hours');
    if (cachedData) {
      return res.json(cachedData);
    }

    // If no cache, fetch from database
    const data = await xdmodService.getMonthlyGPUHours('hopper');
    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly GPU hours:', error);
    res.json([]);
  }
});

app.get('/api/analytics/total-jobs-by-cluster', async (req, res) => {
  try {
    const data = await cacheService.readCache('total-jobs-by-cluster');
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching total jobs by cluster:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/total-cpu-hours-by-cluster', async (req, res) => {
  try {
    const data = await cacheService.readCache('total-cpu-hours-by-cluster');
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching total CPU hours by cluster:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/total-gpu-hours-by-cluster', async (req, res) => {
  try {
    const data = await cacheService.readCache('total-gpu-hours-by-cluster');
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching total GPU hours by cluster:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/executive-summary', async (req, res) => {
  try {
    const [jobsCache, cpuCache, gpuCache] = await Promise.all([
      cacheService.readCache('total-jobs-by-cluster'),
      cacheService.readCache('total-cpu-hours-by-cluster'),
      cacheService.readCache('total-gpu-hours-by-cluster'),
    ]);

    const [hopperStats, vandaStats] = await Promise.all([
      pbsService.getClusterStats(),
      pbsService.getClusterStats(VANDA_JOB_NAME),
    ]);

    const hopperJobs = jobsCache?.find(d => d.cluster === 'hopper')?.totalJobs || 0;
    const vandaJobs = jobsCache?.find(d => d.cluster === 'vanda')?.totalJobs || 0;
    const hopperCpuHours = cpuCache?.find(d => d.cluster === 'hopper')?.totalCpuHours || 0;
    const vandaCpuHours = cpuCache?.find(d => d.cluster === 'vanda')?.totalCpuHours || 0;
    const hopperGpuHours = gpuCache?.find(d => d.cluster === 'hopper')?.totalGpuHours || 0;
    const vandaGpuHours = gpuCache?.find(d => d.cluster === 'vanda')?.totalGpuHours || 0;

    const hopperWeightedUtil = (hopperStats.cpuUtilization * hopperStats.totalCpus + hopperStats.gpuUtilization * hopperStats.totalGpus) / (hopperStats.totalCpus + hopperStats.totalGpus);
    const vandaWeightedUtil = (vandaStats.cpuUtilization * vandaStats.totalCpus + vandaStats.gpuUtilization * vandaStats.totalGpus) / (vandaStats.totalCpus + vandaStats.totalGpus);

    res.json({
      hopper: {
        totalJobs: hopperJobs,
        totalCpuHours: hopperCpuHours,
        totalGpuHours: hopperGpuHours,
        runningJobs: hopperStats.runningJobs,
        queuedJobs: hopperStats.queuedJobs,
        cpuUtilization: hopperStats.cpuUtilization,
        gpuUtilization: hopperStats.gpuUtilization,
        totalCpus: hopperStats.totalCpus,
        totalGpus: hopperStats.totalGpus,
        totalNodes: hopperStats.totalNodes,
        weightedUtilization: hopperWeightedUtil,
      },
      vanda: {
        totalJobs: vandaJobs,
        totalCpuHours: vandaCpuHours,
        totalGpuHours: vandaGpuHours,
        runningJobs: vandaStats.runningJobs,
        queuedJobs: vandaStats.queuedJobs,
        cpuUtilization: vandaStats.cpuUtilization,
        gpuUtilization: vandaStats.gpuUtilization,
        totalCpus: vandaStats.totalCpus,
        totalGpus: vandaStats.totalGpus,
        totalNodes: vandaStats.totalNodes,
        weightedUtilization: vandaWeightedUtil,
      },
    });
  } catch (error) {
    console.error('Error fetching executive summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/download-pdf
 * Generate and download dashboard as PDF
 * Query params:
 *   - url: The URL of the page to render (required)
 */
app.get('/api/download-pdf', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('PDF download requested for URL:', url);

    // Generate PDF from the dashboard
    const pdfBuffer = await pdfService.generateDashboardPDF(url);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="hpc-dashboard-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer as binary data
    res.end(pdfBuffer, 'binary');

    console.log('PDF sent successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: `Failed to generate PDF: ${error.message}` });
  }
});

/**
 * POST /api/analytics/refresh-cache
 * Manually trigger cache update (for testing/admin purposes)
 */
app.post('/api/analytics/refresh-cache', async (req, res) => {
  try {
    await cacheService.updateAllCaches();
    res.json({ message: 'Cache updated successfully' });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// VANDA CLUSTER ENDPOINTS (/api/vanda/*)
// =============================================================================
const VANDA_JOB_NAME = 'pbs-exporter-vanda';

app.get('/api/vanda/jobs', async (req, res) => {
  try {
    const cacheKey = 'vanda-jobs';
    let jobs = cache.get(cacheKey);
    if (!jobs) {
      jobs = await pbsService.getJobs(VANDA_JOB_NAME);
      cache.set(cacheKey, jobs);
    }
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching Vanda jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/nodes', async (req, res) => {
  try {
    const cacheKey = 'vanda-nodes';
    let nodes = cache.get(cacheKey);
    if (!nodes) {
      nodes = await pbsService.getNodes(VANDA_JOB_NAME);
      cache.set(cacheKey, nodes);
    }
    res.json(nodes);
  } catch (error) {
    console.error('Error fetching Vanda nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/stats/cluster', async (req, res) => {
  try {
    const cacheKey = 'vanda-cluster-stats';
    let stats = cache.get(cacheKey);
    if (!stats) {
      stats = await pbsService.getClusterStats(VANDA_JOB_NAME);
      cache.set(cacheKey, stats);
    }
    res.json(stats);
  } catch (error) {
    console.error('Error fetching Vanda cluster stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/queues', async (req, res) => {
  try {
    const cacheKey = 'vanda-queues';
    let queues = cache.get(cacheKey);
    if (!queues) {
      queues = await pbsService.getQueues(VANDA_JOB_NAME);
      cache.set(cacheKey, queues);
    }
    res.json(queues);
  } catch (error) {
    console.error('Error fetching Vanda queues:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/jobs', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const data = await pbsService.getJobAnalytics(timeRange, VANDA_JOB_NAME);
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda job analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/gpu-occupation', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const data = await prometheusService.getSimpleGPUOccupation(timeRange, VANDA_JOB_NAME);
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda GPU occupation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/gpu-usage-by-user', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `vanda-gpu-usage-by-user-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda GPU usage by user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/job-stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `vanda-job-stats-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda job stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/aisg-wait-time', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `vanda-aisg-wait-time-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda wait time:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/nusit-wait-time', async (req, res) => {
  // Vanda has no NUS-IT queues — always return empty array
  res.json([]);
});

app.get('/api/vanda/analytics/cpu-usage-by-user', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const cacheKey = `vanda-cpu-usage-by-user-${timeRange}`;
    const data = await cacheService.readCache(cacheKey);
    if (!data) {
      return res.status(503).json({ error: 'Cache not available, please try again later' });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda CPU usage by user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vanda/analytics/monthly-gpu-hours', async (req, res) => {
  try {
    const cachedData = await cacheService.readCache('vanda-monthly-gpu-hours');
    if (cachedData) {
      return res.json(cachedData);
    }
    const data = await xdmodService.getMonthlyGPUHours('vanda');
    res.json(data);
  } catch (error) {
    console.error('Error fetching Vanda monthly GPU hours:', error);
    res.json([]);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.api.port;
app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  HPC Monitoring API Server (Prometheus)                  ║
╚══════════════════════════════════════════════════════════╝

  Environment: ${config.nodeEnv}
  Data Source: Prometheus at ${config.prometheus.url}
  Server: http://${config.api.host}:${PORT}
  Health: http://${config.api.host}:${PORT}/api/health

  Ready to accept connections...
  `);

  // Initialize cache service
  await cacheService.initializeCacheService();
});
