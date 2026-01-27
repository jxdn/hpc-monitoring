/**
 * PBS Service
 * Business logic for PBS Pro data - now using Prometheus as data source
 */

const prometheusService = require('./prometheusService');

/**
 * Get aggregated job summary
 * Note: Prometheus provides aggregated metrics, not individual job details
 * @returns {Promise<Object>} - Job summary with statistics
 */
async function getJobs() {
  try {
    const [jobStats, jobsByUser, jobsByQueue] = await Promise.all([
      prometheusService.getJobStats(),
      prometheusService.getJobsByUser(),
      prometheusService.getJobsByQueue(),
    ]);

    return {
      summary: {
        total: jobStats.running + jobStats.queued + jobStats.hold,
        running: jobStats.running,
        queued: jobStats.queued,
        hold: jobStats.hold,
      },
      byUser: jobsByUser,
      byQueue: jobsByQueue,
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

/**
 * Get specific job details
 * Note: Individual job details are not available from Prometheus metrics
 * This returns a message indicating the limitation
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Error message
 */
async function getJob(jobId) {
  throw new Error(
    'Individual job details are not available when using Prometheus data source. ' +
    'Only aggregated job statistics are provided by pbs-exporter. ' +
    'Please check the Jobs summary or query PBS directly for specific job details.'
  );
}

/**
 * Get all nodes with details
 * @returns {Promise<Array>} - List of nodes with resource information
 */
async function getNodes() {
  try {
    return await prometheusService.getNodeDetails();
  } catch (error) {
    console.error('Error fetching nodes:', error);
    throw error;
  }
}

/**
 * Get specific node details
 * @param {string} nodeId - Node ID
 * @returns {Promise<Object>} - Node details
 */
async function getNode(nodeId) {
  try {
    const nodes = await prometheusService.getNodeDetails();
    const node = nodes.find(n => n.id === nodeId || n.name === nodeId);

    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    return node;
  } catch (error) {
    console.error('Error fetching node:', error);
    throw error;
  }
}

/**
 * Get queue information
 * Note: Queue details are derived from job metrics
 * @returns {Promise<Array>} - List of queues
 */
async function getQueues() {
  try {
    const jobsByQueue = await prometheusService.getJobsByQueue();

    return jobsByQueue.map(q => ({
      name: q.queue,
      enabled: true,
      started: true,
      totalJobs: q.count,
      runningJobs: q.count,
      queuedJobs: 0,
      priority: 100,
    }));
  } catch (error) {
    console.error('Error fetching queues:', error);
    return [];
  }
}

/**
 * Get cluster statistics
 * @returns {Promise<Object>} - Cluster statistics
 */
async function getClusterStats() {
  try {
    return await prometheusService.getClusterStats();
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
async function getJobAnalytics(timeRange = '24h') {
  try {
    return await prometheusService.getHistoricalJobStats(timeRange);
  } catch (error) {
    console.error('Error fetching job analytics:', error);
    throw error;
  }
}

/**
 * Get historical resource utilization
 * @param {string} timeRange - Time range (1h, 24h, 7d, 30d)
 * @returns {Promise<Array>} - Historical resource utilization
 */
async function getResourceAnalytics(timeRange = '24h') {
  try {
    return await prometheusService.getHistoricalResourceStats(timeRange);
  } catch (error) {
    console.error('Error fetching resource analytics:', error);
    throw error;
  }
}

/**
 * Get historical GPU occupation rates for node groups
 * @param {string} timeRange - Time range (24h, 7d, 30d)
 * @returns {Promise<Object>} - Average GPU occupation rates
 */
async function getGPUOccupation(timeRange = '24h') {
  try {
    return await prometheusService.getHistoricalGPUOccupation(timeRange);
  } catch (error) {
    console.error('Error fetching GPU occupation:', error);
    throw error;
  }
}

/**
 * Delete a job
 * Note: Job control operations are not available through Prometheus
 * @param {string} jobId - Job ID to delete
 * @returns {Promise<void>}
 */
async function deleteJob(jobId) {
  throw new Error(
    'Job control operations (delete, hold, release) are not available when using Prometheus data source. ' +
    'These operations require direct PBS command execution. ' +
    'Please use PBS commands directly (qdel, qhold, qrls) or set up a separate job control API.'
  );
}

/**
 * Hold a job
 * Note: Job control operations are not available through Prometheus
 * @param {string} jobId - Job ID to hold
 * @returns {Promise<void>}
 */
async function holdJob(jobId) {
  throw new Error(
    'Job control operations (delete, hold, release) are not available when using Prometheus data source. ' +
    'These operations require direct PBS command execution. ' +
    'Please use PBS commands directly (qdel, qhold, qrls) or set up a separate job control API.'
  );
}

/**
 * Release a job
 * Note: Job control operations are not available through Prometheus
 * @param {string} jobId - Job ID to release
 * @returns {Promise<void>}
 */
async function releaseJob(jobId) {
  throw new Error(
    'Job control operations (delete, hold, release) are not available when using Prometheus data source. ' +
    'These operations require direct PBS command execution. ' +
    'Please use PBS commands directly (qdel, qhold, qrls) or set up a separate job control API.'
  );
}

module.exports = {
  getJobs,
  getJob,
  getNodes,
  getNode,
  getQueues,
  getClusterStats,
  getJobAnalytics,
  getResourceAnalytics,
  getGPUOccupation,
  deleteJob,
  holdJob,
  releaseJob,
};
