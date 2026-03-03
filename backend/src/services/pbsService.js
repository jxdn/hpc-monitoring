/**
 * PBS Service
 * Business logic for PBS Pro data - now using Prometheus as data source
 */

const prometheusService = require('./prometheusService');

async function getJobs(jobName) {
  try {
    const [jobStats, jobsByUser, jobsByQueue] = await Promise.all([
      prometheusService.getJobStats(jobName),
      prometheusService.getJobsByUser(jobName),
      prometheusService.getJobsByQueue(jobName),
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

async function getJob(jobId) {
  throw new Error(
    'Individual job details are not available when using Prometheus data source. ' +
    'Only aggregated job statistics are provided by pbs-exporter. ' +
    'Please check the Jobs summary or query PBS directly for specific job details.'
  );
}

async function getNodes(jobName) {
  try {
    return await prometheusService.getNodeDetails(jobName);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    throw error;
  }
}

async function getNode(nodeId, jobName) {
  try {
    const nodes = await prometheusService.getNodeDetails(jobName);
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

async function getQueues(jobName) {
  try {
    return await prometheusService.getQueues(jobName);
  } catch (error) {
    console.error('Error fetching queues:', error);
    return [];
  }
}

async function getClusterStats(jobName) {
  try {
    return await prometheusService.getClusterStats(jobName);
  } catch (error) {
    console.error('Error fetching cluster stats:', error);
    throw error;
  }
}

async function getJobAnalytics(timeRange = '24h', jobName) {
  try {
    return await prometheusService.getHistoricalJobStats(timeRange, jobName);
  } catch (error) {
    console.error('Error fetching job analytics:', error);
    throw error;
  }
}

async function getResourceAnalytics(timeRange = '24h', jobName) {
  try {
    return await prometheusService.getHistoricalResourceStats(timeRange, jobName);
  } catch (error) {
    console.error('Error fetching resource analytics:', error);
    throw error;
  }
}

async function getGPUOccupation(timeRange = '24h', jobName) {
  try {
    return await prometheusService.getHistoricalGPUOccupation(timeRange, jobName);
  } catch (error) {
    console.error('Error fetching GPU occupation:', error);
    throw error;
  }
}

async function deleteJob(jobId) {
  throw new Error(
    'Job control operations (delete, hold, release) are not available when using Prometheus data source. ' +
    'These operations require direct PBS command execution. ' +
    'Please use PBS commands directly (qdel, qhold, qrls) or set up a separate job control API.'
  );
}

async function holdJob(jobId) {
  throw new Error(
    'Job control operations (delete, hold, release) are not available when using Prometheus data source. ' +
    'These operations require direct PBS command execution. ' +
    'Please use PBS commands directly (qdel, qhold, qrls) or set up a separate job control API.'
  );
}

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
