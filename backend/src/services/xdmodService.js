/**
 * XDMoD Database Service
 * Queries the XDMoD MySQL database for job and usage statistics
 */

const mysql = require('mysql2/promise');
const config = require('../config/env');

// Create connection pool
const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  connectionLimit: config.mysql.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    return false;
  }
}

/**
  * Check if a table exists in the database
 * @param {string} tableName - Name of the XDMoD table
 * @returns {Promise<boolean>}
 */
async function tableExists(tableName) {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM information_schema.tables
       WHERE table_schema = 'modw' AND table_name = ?`,
      [tableName]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

/**
  * Find available tables with wait time or job data
 * @returns {Promise<Object>}
 */
async function findAvailableTables() {
  try {
    const [rows] = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'modw'
       AND (table_name LIKE '%job%' OR table_name LIKE '%wait%')
       ORDER BY table_name`
    );
    const tables = rows.map(row => row.table_name);
    console.log('Available job/wait tables:', tables);
    return { tables, jobfactTables: tables.filter(t => t.includes('jobfact')), jobTaskTable: tables.find(t => t === 'job_tasks') };
  } catch (error) {
    console.error('Error finding available tables:', error);
    return { tables: [], jobfactTables: [], jobTaskTable: null };
  }
}

/**
   * GPU usage statistics by user for the last N days
   * @param {number} days - Number of days (1, 7, or 30)
   * @param {string} resource - Resource code: 'hopper' or 'vanda'
   * @returns {Promise<Array>}
  */
async function getGPUUsageByUser(days = 7, resource = 'hopper') {
  try {
    const query = `
      SELECT
        sa.username,
        COUNT(*) AS num_jobs,
        COALESCE(SUM(jt.gpu_count), 0) AS total_gpus_used,
        COALESCE(AVG(jt.gpu_count), 0) AS avg_gpus_per_job,
        COALESCE(SUM(jt.gpu_time), 0) / 3600.0 AS total_gpu_hours,
        COALESCE(AVG(jt.gpu_time), 0) / 3600.0 AS avg_gpu_hours_per_job
      FROM
        modw.job_tasks jt
        JOIN modw.systemaccount sa ON jt.systemaccount_id = sa.id
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL ${days} DAY
        AND jt.gpu_count > 0
        AND rf.code = '${resource}'
      GROUP BY
        sa.username
      ORDER BY
        total_gpu_hours DESC
      LIMIT 7
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      username: row.username,
      numJobs: parseInt(row.num_jobs),
      totalGpusUsed: parseInt(row.total_gpus_used),
      avgGpusPerJob: parseFloat(row.avg_gpus_per_job).toFixed(2),
      totalGpuHours: parseFloat(row.total_gpu_hours).toFixed(2),
      avgGpuHoursPerJob: parseFloat(row.avg_gpu_hours_per_job).toFixed(2),
    }));
  } catch (error) {
    console.error('Error fetching GPU usage by user:', error);
    throw error;
  }
}

async function getCPUUsageByUser(days = 7, resource = 'hopper') {
  try {
    const query = `
      SELECT
        sa.username,
        COUNT(*) AS num_jobs,
        COALESCE(SUM(jt.processor_count), 0) AS total_cpus_used,
        COALESCE(AVG(jt.processor_count), 0) AS avg_cpus_per_job,
        COALESCE(SUM(jt.cpu_time), 0) / 3600.0 AS total_cpu_hours,
        COALESCE(AVG(jt.cpu_time), 0) / 3600.0 AS avg_cpu_hours_per_job
      FROM
        modw.job_tasks jt
        JOIN modw.systemaccount sa ON jt.systemaccount_id = sa.id
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL ${days} DAY
        AND jt.processor_count > 0
        AND rf.code = '${resource}'
      GROUP BY
        sa.username
      ORDER BY
        total_cpu_hours DESC
      LIMIT 7
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      username: row.username,
      numJobs: parseInt(row.num_jobs),
      totalCpusUsed: parseInt(row.total_cpus_used),
      avgCpusPerJob: parseFloat(row.avg_cpus_per_job).toFixed(2),
      totalCpuHours: parseFloat(row.total_cpu_hours).toFixed(2),
      avgCpuHoursPerJob: parseFloat(row.avg_cpu_hours_per_job).toFixed(2),
    }));
  } catch (error) {
    console.error('Error fetching CPU usage by user:', error);
    throw error;
  }
}

/**
   * Job statistics for the last N days
  * @param {number} days - Number of days (1, 7, or 30)
  * @param {string} resource - Resource code: 'hopper' or 'vanda'
  * @returns {Promise<Array>}
  */
async function getJobStatsLast7Days(days = 7, resource = 'hopper') {
  try {
    const query = `
      SELECT
        DATE(FROM_UNIXTIME(jt.end_time_ts)) AS job_date,
        COUNT(*) AS num_jobs,
        COALESCE(SUM(jt.gpu_time), 0) / 3600.0 AS total_gpu_hours
      FROM
        modw.job_tasks jt
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL ${days} DAY
        AND jt.gpu_count > 0
        AND rf.code = '${resource}'
      GROUP BY
        job_date
      ORDER BY
        job_date DESC
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      jobDate: row.job_date,
      numJobs: parseInt(row.num_jobs),
      totalGpuHours: parseFloat(row.total_gpu_hours).toFixed(2),
    }));
  } catch (error) {
    console.error(`Error fetching job stats for last ${days} days:`, error);
    throw error;
  }
}

/**
 * NUS IT queue wait time statistics (Hopper only)
 * For Vanda, returns empty array (no NUS-IT queues)
 * @param {number} days - Number of days (1, 7, or 30)
 * @param {string} resource - Resource code: 'hopper' or 'vanda'
 * @returns {Promise<Array>}
 */
async function getNUSITWaitTime(days = 7, resource = 'hopper') {
  if (resource === 'vanda') {
    return [];
  }

  try {
    const query = `
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(jt.end_time_ts), '%Y-%m-%d') AS date,
        jr.queue AS queue_name,
        COUNT(DISTINCT jt.job_id) AS num_jobs,
        ROUND(SUM(jt.gpu_time) / 3600.0, 1) AS total_gpu_hours,
        ROUND(SUM(jt.gpu_time) / COUNT(*) / 3600.0, 1) AS avg_gpu_hours_per_job,
        ROUND(AVG(jt.waitduration / 60.0), 1) AS avg_wait_minutes
      FROM
        modw.job_tasks jt
        INNER JOIN modw.job_records jr ON jt.job_record_id = jr.job_record_id
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL ${days} DAY
        AND jt.gpu_count > 0
        AND rf.code = '${resource}'
        AND jr.queue IN ('small', 'interactive', 'medium', 'special', 'large')
      GROUP BY
        date, jr.queue
      ORDER BY
        date DESC, jr.queue
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      date: row.date,
      queueName: row.queue_name,
      numJobs: parseInt(row.num_jobs),
      totalGpuHours: parseFloat(row.total_gpu_hours),
      avgGpuHoursPerJob: parseFloat(row.avg_gpu_hours_per_job),
      avgWaitMinutes: parseFloat(row.avg_wait_minutes),
    }));
  } catch (error) {
    console.error(`Error fetching NUS IT wait time for ${days} days:`, error);
    throw error;
  }
}

/**
 * AISG queue wait time statistics
 * For Hopper: AISG_large, AISG_debug, AISG_guest queues
 * For Vanda: GPU queues (batch_gpu, gpu, gpu_amd, interactive_gpu)
 * @param {number} days - Number of days (1, 7, or 30)
 * @param {string} resource - Resource code: 'hopper' or 'vanda'
 * @returns {Promise<Array>}
 */
async function getAISGWaitTime(days = 7, resource = 'hopper') {
  const queues = resource === 'vanda'
    ? "'batch_gpu', 'gpu', 'gpu_amd', 'interactive_gpu'"
    : "'AISG_large', 'AISG_debug', 'AISG_guest'";

  try {
    const query = `
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(jt.end_time_ts), '%Y-%m-%d') AS date,
        jr.queue AS queue_name,
        COUNT(DISTINCT jt.job_id) AS num_jobs,
        ROUND(SUM(jt.gpu_time) / 3600.0, 1) AS total_gpu_hours,
        ROUND(SUM(jt.gpu_time) / COUNT(*) / 3600.0, 1) AS avg_gpu_hours_per_job,
        ROUND(AVG(jt.waitduration / 60.0), 1) AS avg_wait_minutes
      FROM
        modw.job_tasks jt
        INNER JOIN modw.job_records jr ON jt.job_record_id = jr.job_record_id
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL ${days} DAY
        AND jt.gpu_count > 0
        AND rf.code = '${resource}'
        AND jr.queue IN (${queues})
      GROUP BY
        date, jr.queue
      ORDER BY
        date DESC, jr.queue
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      date: row.date,
      queueName: row.queue_name,
      numJobs: parseInt(row.num_jobs),
      totalGpuHours: parseFloat(row.total_gpu_hours),
      avgGpuHoursPerJob: parseFloat(row.avg_gpu_hours_per_job),
      avgWaitMinutes: parseFloat(row.avg_wait_minutes),
    }));
  } catch (error) {
    console.error(`Error fetching AISG wait time for ${days} days:`, error);
    throw error;
  }
}

/**
 * Monthly GPU hours for the last 2 years
 * @param {string} resource - Resource code: 'hopper' or 'vanda'
 * @returns {Promise<Array>}
 */
async function getMonthlyGPUHours(resource = 'hopper') {
  try {
    const query = `
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(jt.end_time_ts), '%b %Y') AS month,
        SUM(jt.gpu_count * (jt.end_time_ts - jt.start_time_ts) / 3600.0) AS gpu_hours,
        SUM(jt.cpu_time / 3600.0) AS cpu_hours
      FROM
        modw.job_tasks jt
        INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE
        jt.end_time_ts >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 2 YEAR))
        AND rf.code = '${resource}'
      GROUP BY
        DATE_FORMAT(FROM_UNIXTIME(jt.end_time_ts), '%Y-%m')
      ORDER BY
        FROM_UNIXTIME(jt.end_time_ts)
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      month: row.month,
      gpuHours: parseFloat(row.gpu_hours || 0).toFixed(1),
      cpuHours: parseFloat(row.cpu_hours || 0).toFixed(1),
    }));
  } catch (error) {
    console.error('Error fetching monthly resource hours:', error);
    throw error;
  }
}

/**
  * Close database connection pool
  */
async function closePool() {
  await pool.end();
}

async function getTotalJobsByCluster() {
  try {
    const query = `
      SELECT 
        rf.code AS cluster,
        rf.name AS cluster_name,
        COUNT(*) AS total_jobs
      FROM modw.job_tasks jt
      JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE rf.code IN ('hopper', 'vanda')
      GROUP BY rf.code, rf.name
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      cluster: row.cluster,
      clusterName: row.cluster_name,
      totalJobs: parseInt(row.total_jobs),
    }));
  } catch (error) {
    console.error('Error fetching total jobs by cluster:', error);
    throw error;
  }
}

async function getTotalCpuHoursByCluster() {
  try {
    const query = `
      SELECT 
        rf.code AS cluster,
        rf.name AS cluster_name,
        SUM(jt.cpu_time) / 3600.0 AS total_cpu_hours
      FROM modw.job_tasks jt
      JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE rf.code IN ('hopper', 'vanda')
      GROUP BY rf.code, rf.name
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      cluster: row.cluster,
      clusterName: row.cluster_name,
      totalCpuHours: parseFloat(row.total_cpu_hours),
    }));
  } catch (error) {
    console.error('Error fetching total CPU hours by cluster:', error);
    throw error;
  }
}

async function getTotalGpuHoursByCluster() {
  try {
    const query = `
      SELECT 
        rf.code AS cluster,
        rf.name AS cluster_name,
        SUM(jt.gpu_time) / 3600.0 AS total_gpu_hours
      FROM modw.job_tasks jt
      JOIN modw.resourcefact rf ON jt.resource_id = rf.id
      WHERE rf.code IN ('hopper', 'vanda')
      GROUP BY rf.code, rf.name
    `;

    const [rows] = await pool.query(query);

    return rows.map(row => ({
      cluster: row.cluster,
      clusterName: row.cluster_name,
      totalGpuHours: parseFloat(row.total_gpu_hours),
    }));
  } catch (error) {
    console.error('Error fetching total GPU hours by cluster:', error);
    throw error;
  }
}

module.exports = {
  testConnection,
  tableExists,
  findAvailableTables,
  getGPUUsageByUser,
  getCPUUsageByUser,
  getJobStatsLast7Days,
  getAISGWaitTime,
  getNUSITWaitTime,
  getMonthlyGPUHours,
  getTotalJobsByCluster,
  getTotalCpuHoursByCluster,
  getTotalGpuHoursByCluster,
  closePool,
};
