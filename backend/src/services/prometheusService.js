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
    const [runningByQueue, queuedByQueue] = await Promise.all([
      queryVictoriaMetrics('qstat_running_jobs_by_queue').catch(() => []),
      queryVictoriaMetrics('qstat_que_by_queue').catch(() => []),
    ]);

    const queueMap = new Map();

    runningByQueue.forEach(item => {
      const queueName = item.metric.queue;
      queueMap.set(queueName, {
        queue: queueName,
        count: parseInt(item.value[1]) || 0,
        running: parseInt(item.value[1]) || 0,
        queued: 0,
      });
    });

    queuedByQueue.forEach(item => {
      const queueName = item.metric.queue;
      const queuedCount = parseInt(item.value[1]) || 0;
      if (queueMap.has(queueName)) {
        queueMap.get(queueName).queued = queuedCount;
        queueMap.get(queueName).count += queuedCount;
      } else {
        queueMap.set(queueName, {
          queue: queueName,
          count: queuedCount,
          running: 0,
          queued: queuedCount,
        });
      }
    });

    return Array.from(queueMap.values()).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching jobs by queue:', error);
    return [];
  }
}

/**
 * Get queue information with running/queued jobs
 * Uses the same data as getJobsByQueue since qstat_running_jobs_by_queue already has per-queue counts
 * @returns {Promise<Array>} - Queue details
 */
async function getQueues() {
  try {
    // Use the same query that's working for getJobsByQueue
    const runningByQueue = await queryVictoriaMetrics('qstat_running_jobs_by_queue');
    
    console.log('Running by queue data:', runningByQueue);

    const queues = runningByQueue.map(item => ({
      name: item.metric.queue,
      enabled: true,
      started: true,
      totalJobs: parseInt(item.value[1]) || 0,
      runningJobs: parseInt(item.value[1]) || 0,
      queuedJobs: 0, // We don't have queued by queue metric, derive from total
      priority: 0,
    })).sort((a, b) => b.totalJobs - a.totalJobs);

    console.log('Processed queues:', queues);
    return queues;
  } catch (error) {
    console.error('Error fetching queues:', error);
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

let hardwareStatusHistory = [];
const HARDWARE_STATUS_HISTORY_SIZE = 5;
let lastKnownUptimes = new Map();

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

async function getHardwareStatus() {
  try {
    const [statusResult, uptimeResult] = await Promise.all([
      queryVictoriaMetrics('globalSystemStatus'),
      queryVictoriaMetrics('systemPowerUpTime'),
    ]);
    
    const statusMap = { '1': 'other', '2': 'unknown', '3': 'ok', '4': 'warning', '5': 'critical', '6': 'non-recoverable' };
    const statusLabelMap = { '1': 'Other', '2': 'Unknown', '3': 'OK', '4': 'Warning', '5': 'Critical', '6': 'Non-Recoverable' };
    
    const allNodes = Array.from({ length: 46 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `hopper-0${num}` : `hopper-${num}`;
    });
    
    const nodeStatusMap = new Map();
    statusResult.forEach(item => {
      const instance = item.metric.instance || item.metric.node || item.metric.host;
      if (instance) {
        let nodeName = instance.split(':')[0].split('.')[0];
        const statusValue = item.value[1];
        nodeStatusMap.set(nodeName, {
          node: nodeName,
          status: statusMap[statusValue] || 'unknown',
          statusLabel: statusLabelMap[statusValue] || 'Unknown',
          statusValue: parseInt(statusValue) || 0,
          uptimeSeconds: lastKnownUptimes.get(nodeName) || 0,
          uptimeFormatted: formatUptime(lastKnownUptimes.get(nodeName) || 0),
        });
      }
    });
    
    uptimeResult.forEach(item => {
      const instance = item.metric.instance;
      if (instance) {
        let nodeName = instance.split(':')[0].split('.')[0];
        const uptimeSeconds = parseInt(item.value[1]) || 0;
        if (uptimeSeconds > 0) {
          lastKnownUptimes.set(nodeName, uptimeSeconds);
        }
        if (nodeStatusMap.has(nodeName)) {
          const currentUptime = uptimeSeconds > 0 ? uptimeSeconds : (lastKnownUptimes.get(nodeName) || 0);
          nodeStatusMap.get(nodeName).uptimeSeconds = currentUptime;
          nodeStatusMap.get(nodeName).uptimeFormatted = formatUptime(currentUptime);
        } else {
          const currentUptime = uptimeSeconds > 0 ? uptimeSeconds : (lastKnownUptimes.get(nodeName) || 0);
          nodeStatusMap.set(nodeName, {
            node: nodeName,
            status: 'unknown',
            statusLabel: 'No Data',
            statusValue: -1,
            uptimeSeconds: currentUptime,
            uptimeFormatted: formatUptime(currentUptime),
          });
        }
      }
    });
    
    const nodes = allNodes.map(nodeName => {
      if (nodeStatusMap.has(nodeName)) {
        return nodeStatusMap.get(nodeName);
      }
      const lastUptime = lastKnownUptimes.get(nodeName) || 0;
      return {
        node: nodeName,
        status: 'unknown',
        statusLabel: 'No Data',
        statusValue: -1,
        uptimeSeconds: lastUptime,
        uptimeFormatted: formatUptime(lastUptime),
      };
    });
    
    const summary = {
      ok: nodes.filter(n => n.status === 'ok').length,
      warning: nodes.filter(n => n.status === 'warning').length,
      critical: nodes.filter(n => n.status === 'critical').length,
      unknown: nodes.filter(n => n.status === 'unknown').length,
      other: nodes.filter(n => n.status === 'other').length,
      nonRecoverable: nodes.filter(n => n.status === 'critical' && n.statusLabel === 'Non-Recoverable').length,
      total: nodes.length,
    };
    
    return { nodes, summary };
  } catch (error) {
    console.error('Error fetching hardware status:', error);
    throw error;
  }
}

async function updateHardwareStatusCache() {
  try {
    const newStatus = await getHardwareStatus();
    hardwareStatusHistory.unshift(newStatus);
    if (hardwareStatusHistory.length > HARDWARE_STATUS_HISTORY_SIZE) {
      hardwareStatusHistory.pop();
    }
    console.log('Hardware status cache updated:', newStatus.summary);
    return newStatus;
  } catch (error) {
    console.error('Error updating hardware status cache:', error);
    throw error;
  }
}

function getCachedHardwareStatus() {
  if (hardwareStatusHistory.length === 0) {
    return null;
  }
  
  const allNodes = Array.from({ length: 46 }, (_, i) => {
    const num = i + 1;
    return num < 10 ? `hopper-0${num}` : `hopper-${num}`;
  });
  
  const mergedNodes = allNodes.map(nodeName => {
    const statuses = hardwareStatusHistory
      .map(h => h.nodes.find(n => n.node === nodeName))
      .filter(n => n && n.status !== 'unknown');
    
    if (statuses.length === 0) {
      const lastUptime = lastKnownUptimes.get(nodeName) || 0;
      return {
        node: nodeName,
        status: 'unknown',
        statusLabel: 'No Data',
        statusValue: -1,
        uptimeSeconds: lastUptime,
        uptimeFormatted: formatUptime(lastUptime),
      };
    }
    
    const severityOrder = ['critical', 'non-recoverable', 'warning', 'other', 'ok'];
    for (const severity of severityOrder) {
      const found = statuses.find(s => s.status === severity);
      if (found) {
        if (!found.uptimeSeconds || found.uptimeSeconds === 0) {
          const lastUptime = lastKnownUptimes.get(nodeName) || 0;
          found.uptimeSeconds = lastUptime;
          found.uptimeFormatted = formatUptime(lastUptime);
        }
        return found;
      }
    }
    
    return statuses[0];
  });
  
  const summary = {
    ok: mergedNodes.filter(n => n.status === 'ok').length,
    warning: mergedNodes.filter(n => n.status === 'warning').length,
    critical: mergedNodes.filter(n => n.status === 'critical').length,
    unknown: mergedNodes.filter(n => n.status === 'unknown').length,
    other: mergedNodes.filter(n => n.status === 'other').length,
    nonRecoverable: mergedNodes.filter(n => n.status === 'critical' && n.statusLabel === 'Non-Recoverable').length,
    total: mergedNodes.length,
  };
  
  return { nodes: mergedNodes, summary };
}

let powerStatusHistory = [];
const POWER_STATUS_HISTORY_SIZE = 3;

async function getPowerStatus() {
  try {
    const result = await queryVictoriaMetrics('redfish_power_powercontrol_power_consumed_watts');
    
    const allNodes = Array.from({ length: 46 }, (_, i) => {
      const num = i + 1;
      return num < 10 ? `hopper-0${num}` : `hopper-${num}`;
    });
    
    const nodePowerMap = new Map();
    result.forEach(item => {
      const source = item.metric.source;
      if (source) {
        const watts = parseInt(item.value[1]) || 0;
        nodePowerMap.set(source, {
          node: source,
          watts: watts,
        });
      }
    });
    
    const nodes = allNodes.map(nodeName => {
      if (nodePowerMap.has(nodeName)) {
        return nodePowerMap.get(nodeName);
      }
      return {
        node: nodeName,
        watts: 0,
      };
    });
    
    const total = nodes.reduce((sum, n) => sum + n.watts, 0);
    
    return {
      nodes,
      total,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching power status:', error);
    throw error;
  }
}

async function updatePowerStatusCache() {
  try {
    const newStatus = await getPowerStatus();
    powerStatusHistory.unshift(newStatus);
    if (powerStatusHistory.length > POWER_STATUS_HISTORY_SIZE) {
      powerStatusHistory.pop();
    }
    console.log('Power status cache updated:', { total: newStatus.total, nodes: newStatus.nodes.length });
    return newStatus;
  } catch (error) {
    console.error('Error updating power status cache:', error);
    throw error;
  }
}

function getCachedPowerStatus() {
  if (powerStatusHistory.length === 0) {
    return null;
  }
  
  const allNodes = Array.from({ length: 46 }, (_, i) => {
    const num = i + 1;
    return num < 10 ? `hopper-0${num}` : `hopper-${num}`;
  });
  
  const mergedNodes = allNodes.map(nodeName => {
    for (const status of powerStatusHistory) {
      const node = status.nodes.find(n => n.node === nodeName);
      if (node && node.watts > 0) {
        return node;
      }
    }
    return {
      node: nodeName,
      watts: 0,
    };
  });
  
  const total = mergedNodes.reduce((sum, n) => sum + n.watts, 0);
  
  return {
    nodes: mergedNodes,
    total,
    timestamp: powerStatusHistory[0]?.timestamp || new Date().toISOString(),
  };
}

async function getPowerHistory(timeRange = '7d') {
  try {
    const { start, end, step } = parsePowerTimeRange(timeRange);
    
    const query = 'sum(redfish_power_powercontrol_power_consumed_watts)';
    const result = await queryVictoriaMetricsRange(query, start, end, step);
    
    if (!result[0]?.values) {
      return [];
    }
    
    return result[0].values.map(([timestamp, value]) => ({
      timestamp: formatPowerTimestamp(timestamp, timeRange),
      total: Math.round(parseFloat(value)),
    }));
  } catch (error) {
    console.error('Error fetching power history:', error);
    return [];
  }
}

function parsePowerTimeRange(timeRange) {
  const now = Math.floor(Date.now() / 1000);
  let start, end, step;
  
  switch (timeRange) {
    case 'yesterday':
      start = now - 2 * 86400;
      end = now - 86400;
      step = '1h';
      break;
    case '1d':
      start = now - 86400;
      step = '1h';
      break;
    case '7d':
      start = now - 604800;
      step = '6h';
      break;
    case '30d':
      start = now - 2592000;
      step = '1d';
      break;
    default:
      start = now - 604800;
      step = '6h';
  }
  
  return { start, end: end || now, step };
}

function formatPowerTimestamp(timestamp, timeRange) {
  const date = new Date(timestamp * 1000);
  
  if (timeRange === '1d') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (timeRange === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

module.exports = {
  queryVictoriaMetrics,
  queryVictoriaMetricsRange,
  getJobStats,
  getJobsByUser,
  getJobsByQueue,
  getQueues,
  getNodeCounts,
  getNodeDetails,
  getClusterStats,
  getHistoricalJobStats,
  getHistoricalResourceStats,
  getHistoricalGPUOccupation,
  getHardwareStatus,
  updateHardwareStatusCache,
  getCachedHardwareStatus,
  getPowerStatus,
  updatePowerStatusCache,
  getCachedPowerStatus,
  getPowerHistory,
};
