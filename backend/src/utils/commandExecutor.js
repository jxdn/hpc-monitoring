/**
 * Command Executor
 * Handles execution of PBS commands in both development (SSH) and production (direct) modes
 */

const { exec } = require('child_process');
const { Client } = require('ssh2');
const { promisify } = require('util');
const fs = require('fs');
const config = require('../config/env');

const execAsync = promisify(exec);

/**
 * Execute command via SSH
 * @param {string} command - Command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeViaSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        stream.on('close', (code, signal) => {
          conn.end();
          if (code !== 0) {
            reject(new Error(`Command failed with exit code ${code}: ${errorOutput}`));
          } else {
            resolve(output);
          }
        });

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
      });
    });

    conn.on('error', (err) => {
      reject(new Error(`SSH connection error: ${err.message}`));
    });

    // Connect with SSH key or password
    const connectionConfig = {
      host: config.ssh.host,
      port: config.ssh.port,
      username: config.ssh.username,
    };

    if (config.ssh.privateKeyPath) {
      // Use SSH key authentication
      try {
        const privateKey = fs.readFileSync(
          config.ssh.privateKeyPath.replace('~', require('os').homedir())
        );
        connectionConfig.privateKey = privateKey;
      } catch (err) {
        return reject(new Error(`Failed to read SSH key: ${err.message}`));
      }
    } else if (config.ssh.password) {
      // Use password authentication (not recommended)
      connectionConfig.password = config.ssh.password;
    } else {
      return reject(new Error('No SSH authentication method configured'));
    }

    conn.connect(connectionConfig);
  });
}

/**
 * Execute command directly on the local system
 * @param {string} command - Command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeDirect(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.warn('Command stderr:', stderr);
    }
    return stdout;
  } catch (error) {
    throw new Error(`Command execution failed: ${error.message}`);
  }
}

/**
 * Execute PBS command based on environment
 * @param {string} command - Command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeCommand(command) {
  const startTime = Date.now();

  try {
    let output;

    if (config.isDevelopment) {
      console.log(`[SSH] Executing: ${command}`);
      output = await executeViaSSH(command);
    } else {
      console.log(`[Direct] Executing: ${command}`);
      output = await executeDirect(command);
    }

    const duration = Date.now() - startTime;
    console.log(`Command completed in ${duration}ms`);

    return output;
  } catch (error) {
    console.error(`Command execution error: ${error.message}`);
    throw error;
  }
}

/**
 * Execute qstat command
 * @param {string} flags - Additional flags for qstat
 * @returns {Promise<string>} - qstat output
 */
async function executeQstat(flags = '-f -F json') {
  const command = `${config.pbs.qstat} ${flags}`;
  return executeCommand(command);
}

/**
 * Execute pbsnodes command
 * @param {string} flags - Additional flags for pbsnodes
 * @returns {Promise<string>} - pbsnodes output
 */
async function executePbsnodes(flags = '-aSj') {
  const command = `${config.pbs.pbsnodes} ${flags}`;
  return executeCommand(command);
}

/**
 * Delete a job
 * @param {string} jobId - Job ID to delete
 * @returns {Promise<string>} - Command output
 */
async function executeQdel(jobId) {
  const command = `${config.pbs.qdel} ${jobId}`;
  return executeCommand(command);
}

/**
 * Hold a job
 * @param {string} jobId - Job ID to hold
 * @returns {Promise<string>} - Command output
 */
async function executeQhold(jobId) {
  const command = `${config.pbs.qhold} ${jobId}`;
  return executeCommand(command);
}

/**
 * Release a job
 * @param {string} jobId - Job ID to release
 * @returns {Promise<string>} - Command output
 */
async function executeQrls(jobId) {
  const command = `${config.pbs.qrls} ${jobId}`;
  return executeCommand(command);
}

module.exports = {
  executeCommand,
  executeQstat,
  executePbsnodes,
  executeQdel,
  executeQhold,
  executeQrls,
};
