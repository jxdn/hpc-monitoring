/**
 * VictoriaMetrics Service
 * Queries VictoriaMetrics API and transforms metrics to PBS data format
 */

const axios = require('axios');
const config = require('../config/env');

// Create axios client with authentication if provided
const clientConfig = {
  baseURL: config.prometheus.url,
  timeout: config.prometheus.timeout,
  headers: {},
};

// Add authentication headers if configured
if (config.prometheus.token) {
  // Bearer token authentication
  clientConfig.headers['Authorization'] = `Bearer ${config.prometheus.token}`;
} else if (config.prometheus.username && config.prometheus.password) {
  // Basic authentication
  clientConfig.auth = {
    username: config.prometheus.username,
    password: config.prometheus.password,
  };
}

const prometheusClient = axios.create(clientConfig);

/**
 * Query VictoriaMetrics with PromQL
 * @param {string} query - PromQL query string
 * @returns {Promise<Object>} - Query result
 */
async function queryVictoriaMetrics(query) {
  try {
    const response = await prometheusClient.get('/api/v1/query', {
      params: { query },
    });

    if (response.data.status !== 'success') {
      throw new Error(`VictoriaMetrics query failed: ${response.data.error}`);
    }

    return response.data.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`VictoriaMetrics API error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw new Error(`Failed to query VictoriaMetrics: ${error.message}`);
  }
}

/**
 * Query VictoriaMetrics with PromQL range query
 * @param {string} query - PromQL query string
 * @param {number} start - Start timestamp
 * @param {number} end - End timestamp
 * @param {string} step - Query step (e.g., '1m', '5m')
 * @returns {Promise<Object>} - Query result
 */
async function queryVictoriaMetricsRange(query, start, end, step = '5m') {
  try {
    const response = await prometheusClient.get('/api/v1/query_range', {
      params: { query, start, end, step },
    });

    if (response.data.status !== 'success') {
      throw new Error(`VictoriaMetrics range query failed: ${response.data.error}`);
    }

    return response.data.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`VictoriaMetrics API error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw new Error(`Failed to query VictoriaMetrics: ${error.message}`);
  }
}

/**
 * Get job statistics from VictoriaMetrics
 * @returns {Promise<Object>} - Job statistics
 */
async function getJobStats() {
  try {
    const [runningJobs, queuedJobs, holdJobs] = await Promise.all([
      queryVictoriaMetrics('qstat_total_r_jobs'),
      queryVictoriaMetrics('qstat_total_q_jobs'),
      queryVictoriaMetrics('qstat_total_h_jobs'),
    ]);

    return {
      running: runningJobs[0]?.value?.[1] ? parseInt(runningJobs[0].value[1]) : 0,
      queued: queuedJobs[0]?.value?.[1] ? parseInt(queuedJobs[0].value[1]) : 0,
      hold: holdJobs[0]?.value?.[1] ? parseInt(holdJobs[0].value[1]) : 0,
    };
  } catch (error) {
    console.error('Error fetching job stats:', error);
    throw error;
  }
}

/**
 * Get jobs by user from VictoriaMetrics
 * @returns {Promise<Array>} - Jobs by user (top 5 running jobs)
 */
async function getJobsByUser() {
  try {
    const result = await queryVictoriaMetrics('qstat_running_jobs_by_user');

    return result
      .map(item => ({
        user: item.metric.user,
        count: parseInt(item.value[1]),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching jobs by user:', error);
    return [];
  }
}

/**
 * Get jobs by queue from VictoriaMetrics
 * @returns {Promise<Array>} - Jobs by queue
 */
async function getJobsByQueue() {
  try {
    const result = await queryVictoriaMetrics('qstat_running_jobs_by_queue');

    return result
      .map(item => ({
        queue: item.metric.queue,
        count: parseInt(item.value[1]),
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching jobs by queue:', error);
    return [];
  }
}

/**
 * Get node counts from VictoriaMetrics
 * @returns {Promise<Object>} - Node counts
 */
async function getNodeCounts() {
  try {
    const [freeNodes, busyNodes, offlineNodes, downNodes] = await Promise.all([
      queryVictoriaMetrics('pbs_node_count_free'),
      queryVictoriaMetrics('pbs_node_count_busy'),
      queryVictoriaMetrics('pbs_node_count_offline'),
      queryVictoriaMetrics('pbs_node_count_down'),
    ]);

    return {
      free: freeNodes[0]?.value?.[1] ? parseInt(freeNodes[0].value[1]) : 0,
      busy: busyNodes[0]?.value?.[1] ? parseInt(busyNodes[0].value[1]) : 0,
      offline: offlineNodes[0]?.value?.[1] ? parseInt(offlineNodes[0].value[1]) : 0,
      down: downNodes[0]?.value?.[1] ? parseInt(downNodes[0].value[1]) : 0,
    };
  } catch (error) {
    console.error('Error fetching node counts:', error);
    throw error;
  }
}

/**
 * Get node details from VictoriaMetrics
 * @returns {Promise<Array>} - Node details
 */
async function getNodeDetails() {
  try {
    const [nodeStates, gpusTotal, gpusUsed, memTotal, memUsed, nodeJobs] = await Promise.all([
      queryVictoriaMetrics('pbs_node_state'),
      queryVictoriaMetrics('pbs_node_gpus_total'),
      queryVictoriaMetrics('pbs_node_gpus_used'),
      queryVictoriaMetrics('pbs_node_mem_total'),
      queryVictoriaMetrics('pbs_node_mem_used'),
      queryVictoriaMetrics('pbs_node_jobs').catch(() => []), // Fallback to empty array if metric doesn't exist
    ]);

    // Create a map of node data
    const nodeMap = new Map();

    // Process node states
    nodeStates.forEach(item => {
      const nodeName = item.metric.node;
      const stateValue = parseInt(item.value[1]);
      // Map numeric state to string: 0=free, 1=busy, 2=offline, 3=down
      const stateMap = { 0: 'free', 1: 'busy', 2: 'offline', 3: 'down' };

      nodeMap.set(nodeName, {
        id: nodeName,
        name: nodeName,
        state: stateMap[stateValue] || 'unknown',
        totalCpus: 0,
        usedCpus: 0,
        totalGpus: 0,
        usedGpus: 0,
        totalMemory: '0GB',
        usedMemory: '0GB',
        jobs: [],
        properties: [],
      });
    });

    // Add GPU data
    gpusTotal.forEach(item => {
      const nodeName = item.metric.node;
      if (nodeMap.has(nodeName)) {
        nodeMap.get(nodeName).totalGpus = parseInt(item.value[1]);
      }
    });

    gpusUsed.forEach(item => {
      const nodeName = item.metric.node;
      if (nodeMap.has(nodeName)) {
        nodeMap.get(nodeName).usedGpus = parseInt(item.value[1]);
      }
    });

    // Add memory data
    memTotal.forEach(item => {
      const nodeName = item.metric.node;
      if (nodeMap.has(nodeName)) {
        const memBytes = parseInt(item.value[1]);
        nodeMap.get(nodeName).totalMemory = formatBytes(memBytes);
      }
    });

    memUsed.forEach(item => {
      const nodeName = item.metric.node;
      if (nodeMap.has(nodeName)) {
        const memBytes = parseInt(item.value[1]);
        nodeMap.get(nodeName).usedMemory = formatBytes(memBytes);
      }
    });

    // Add jobs per node data
    nodeJobs.forEach(item => {
      const nodeName = item.metric.node;
      const jobCount = parseInt(item.value[1]);
      if (nodeMap.has(nodeName)) {
        // Create dummy job IDs since VictoriaMetrics only provides count
        const jobs = Array.from({ length: jobCount }, (_, i) => `job-${i + 1}`);
        nodeMap.get(nodeName).jobs = jobs;
      }
    });

    return Array.from(nodeMap.values());
  } catch (error) {
    console.error('Error fetching node details:', error);
    throw error;
  }
}

/**
 * Get cluster statistics
 * @returns {Promise<Object>} - Cluster statistics
 */
async function getClusterStats() {
  try {
    const [jobStats, nodeCounts, gpuData] = await Promise.all([
      getJobStats(),
      getNodeCounts(),
      Promise.all([
        queryVictoriaMetrics('sum(pbs_node_gpus_total)'),
        queryVictoriaMetrics('sum(pbs_node_gpus_used)'),
      ]),
    ]);

    const totalGpus = gpuData[0][0]?.value?.[1] ? parseInt(gpuData[0][0].value[1]) : 0;
    const usedGpus = gpuData[1][0]?.value?.[1] ? parseInt(gpuData[1][0].value[1]) : 0;

    return {
      totalNodes: nodeCounts.free + nodeCounts.busy + nodeCounts.offline + nodeCounts.down,
      busyNodes: nodeCounts.busy,
      freeNodes: nodeCounts.free,
      downNodes: nodeCounts.down + nodeCounts.offline,
      totalJobs: jobStats.running + jobStats.queued + jobStats.hold,
      runningJobs: jobStats.running,
      queuedJobs: jobStats.queued,
      totalGpus,
      usedGpus,
      gpuUtilization: totalGpus > 0 ? (usedGpus / totalGpus) * 100 : 0,
    };
  } catch (error) {
    console.error('Error fetching cluster stats:', error);
    throw error;
  }
}

/**
 * Get historical job statistics
 * @param {string} timeRange - Time range (1h, 24h, 7d, 30d)
 * @returns {Promise<Array>} - Historical job statistics
 */
async function getHistoricalJobStats(timeRange = '24h') {
  try {
    const { start, end, step } = parseTimeRange(timeRange);

    const [runningJobs, queuedJobs] = await Promise.all([
      queryVictoriaMetricsRange('qstat_total_r_jobs', start, end, step),
      queryVictoriaMetricsRange('qstat_total_q_jobs', start, end, step),
    ]);

    // Merge the results by timestamp
    const dataMap = new Map();

    if (runningJobs[0]?.values) {
      runningJobs[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        dataMap.set(time, {
          timestamp: time,
          runningJobs: parseInt(value),
          queuedJobs: 0,
          totalJobs: 0,
          completedJobs: Math.floor(Math.random() * 50) + 100, // Mock data
          failedJobs: Math.floor(Math.random() * 5),
        });
      });
    }

    if (queuedJobs[0]?.values) {
      queuedJobs[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        if (dataMap.has(time)) {
          dataMap.get(time).queuedJobs = parseInt(value);
        }
      });
    }

    // Calculate total jobs
    dataMap.forEach(item => {
      item.totalJobs = item.runningJobs + item.queuedJobs;
    });

    return Array.from(dataMap.values());
  } catch (error) {
    console.error('Error fetching historical job stats:', error);
    return [];
  }
}

/**
 * Get historical resource utilization
 * @param {string} timeRange - Time range (1h, 24h, 7d, 30d)
 * @returns {Promise<Array>} - Historical resource utilization
 */
async function getHistoricalResourceStats(timeRange = '24h') {
  try {
    const { start, end, step } = parseTimeRange(timeRange);

    const gpuUtilQuery = '(sum(pbs_node_gpus_used) / sum(pbs_node_gpus_total)) * 100';
    const memUtilQuery = '(sum(pbs_node_mem_used) / sum(pbs_node_mem_total)) * 100';
    const nodeUtilQuery = '(pbs_node_count_busy / (pbs_node_count_free + pbs_node_count_busy)) * 100';

    const [gpuUtil, memUtil, nodeUtil] = await Promise.all([
      queryVictoriaMetricsRange(gpuUtilQuery, start, end, step),
      queryVictoriaMetricsRange(memUtilQuery, start, end, step),
      queryVictoriaMetricsRange(nodeUtilQuery, start, end, step),
    ]);

    // Merge the results by timestamp
    const dataMap = new Map();

    if (gpuUtil[0]?.values) {
      gpuUtil[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        dataMap.set(time, {
          timestamp: time,
          gpuUtilization: parseFloat(value).toFixed(1),
          memoryUtilization: 0,
          nodeUtilization: 0,
        });
      });
    }

    if (memUtil[0]?.values) {
      memUtil[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        if (dataMap.has(time)) {
          dataMap.get(time).memoryUtilization = parseFloat(value).toFixed(1);
        }
      });
    }

    if (nodeUtil[0]?.values) {
      nodeUtil[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        if (dataMap.has(time)) {
          dataMap.get(time).nodeUtilization = parseFloat(value).toFixed(1);
        }
      });
    }

    return Array.from(dataMap.values());
  } catch (error) {
    console.error('Error fetching historical resource stats:', error);
    return [];
  }
}

/**
 * Get historical GPU occupation rates for specific node groups (time series)
 * @param {string} timeRange - Time range (24h, 7d, 30d)
 * @returns {Promise<Array>} - Time series GPU occupation rates
 */
async function getHistoricalGPUOccupation(timeRange = '24h') {
  try {
    const { start, end, step } = parseTimeRange(timeRange);

    // Define node groups
    const aisgNodes = ['hopper-46', 'hopper-43', 'hopper-45', 'hopper-44', 'hopper-42',
                      'hopper-41', 'hopper-40', 'hopper-39', 'hopper-38', 'hopper-37',
                      'hopper-36', 'hopper-34', 'hopper-33', 'hopper-32', 'hopper-31', 'hopper-35'];
    
    // NON-AISG nodes (hopper-07 to hopper-30): 24 nodes × 8 GPUs = 192 GPUs total
    const nonAisgNodes = Array.from({ length: 24 }, (_, i) => i + 7).map(i => 
      i < 10 ? `hopper-0${i}` : `hopper-${i}`
    );

    // Overall GPU occupation rate (excluding hopper-1 to hopper-6)
    const overallQuery = `(
      sum(pbs_node_gpus_used{node!~"hopper-[1-6]"}) /
      sum(pbs_node_gpus_total{node!~"hopper-[1-6]"})
    ) * 100`;

    // AISG GPU occupation rate (hopper-31 to hopper-46)
    const aisgQuery = `(
      sum(pbs_node_gpus_used{node=~"${aisgNodes.join('|')}"}) /
      sum(pbs_node_gpus_total{node=~"${aisgNodes.join('|')}"})
    ) * 100`;

    // NON-AISG GPU occupation rate (hopper-07 to hopper-30 only)
    const nonAisgQuery = `(
      sum(pbs_node_gpus_used{node=~"${nonAisgNodes.join('|')}"}) /
      sum(pbs_node_gpus_total{node=~"${nonAisgNodes.join('|')}"})
    ) * 100`;

    const [overallData, aisgData, nonAisgData] = await Promise.all([
      queryVictoriaMetricsRange(overallQuery, start, end, step),
      queryVictoriaMetricsRange(aisgQuery, start, end, step),
      queryVictoriaMetricsRange(nonAisgQuery, start, end, step),
    ]);

    // Merge the results by timestamp
    const dataMap = new Map();

    if (overallData[0]?.values) {
      overallData[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        dataMap.set(time, {
          timestamp: time,
          overall: parseFloat(value),
          aisg: 0,
          nonAisg: 0,
        });
      });
    }

    if (aisgData[0]?.values) {
      aisgData[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        if (dataMap.has(time)) {
          dataMap.get(time).aisg = parseFloat(value);
        }
      });
    }

    if (nonAisgData[0]?.values) {
      nonAisgData[0].values.forEach(([timestamp, value]) => {
        const time = formatTimestamp(timestamp, timeRange);
        if (dataMap.has(time)) {
          dataMap.get(time).nonAisg = parseFloat(value);
        }
      });
    }

    return Array.from(dataMap.values());
  } catch (error) {
    console.error('Error fetching historical GPU occupation:', error);
    return [];
  }
}

/**
 * Parse time range to start, end, and step
 * @param {string} timeRange - Time range (1h, 24h, 7d, 30d)
 * @returns {Object} - Start, end, and step
 */
function parseTimeRange(timeRange) {
  const now = Math.floor(Date.now() / 1000);
  let start, step;

  switch (timeRange) {
    case '1h':
      start = now - 3600;
      step = '1m';
      break;
    case '24h':
      start = now - 86400;
      step = '5m';
      break;
    case '7d':
      start = now - 604800;
      step = '30m';
      break;
    case '30d':
      start = now - 2592000;
      step = '4h'; // Use 4 hour step to get better data coverage
      break;
    default:
      start = now - 86400;
      step = '5m';
  }

  return { start, end: now, step };
}

/**
 * Format timestamp based on time range
 * @param {number} timestamp - Unix timestamp
 * @param {string} timeRange - Time range
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(timestamp, timeRange) {
  const date = new Date(timestamp * 1000);

  if (timeRange === '1h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (timeRange === '24h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i];
}

module.exports = {
  queryVictoriaMetrics,
  queryVictoriaMetricsRange,
  getJobStats,
  getJobsByUser,
  getJobsByQueue,
  getNodeCounts,
  getNodeDetails,
  getClusterStats,
  getHistoricalJobStats,
  getHistoricalResourceStats,
  getHistoricalGPUOccupation,
};
