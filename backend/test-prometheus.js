/**
 * Prometheus Connection Test Script
 * Run: node test-prometheus.js
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://192.168.12.2:9090';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  Prometheus Connection Diagnostics                       ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log(`Testing connection to: ${PROMETHEUS_URL}\n`);

async function testConnection() {
  const tests = [
    {
      name: 'Health Check',
      url: `${PROMETHEUS_URL}/-/healthy`,
      description: 'Testing Prometheus health endpoint',
    },
    {
      name: 'Ready Check',
      url: `${PROMETHEUS_URL}/-/ready`,
      description: 'Testing Prometheus ready endpoint',
    },
    {
      name: 'API Metadata',
      url: `${PROMETHEUS_URL}/api/v1/status/config`,
      description: 'Testing API access',
    },
    {
      name: 'Query Test',
      url: `${PROMETHEUS_URL}/api/v1/query?query=up`,
      description: 'Testing metric query',
    },
  ];

  for (const test of tests) {
    console.log(`\n[${test.name}]`);
    console.log(`  URL: ${test.url}`);
    console.log(`  Description: ${test.description}`);

    try {
      const response = await axios.get(test.url, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });

      console.log(`  ✅ Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('  ✅ Success!');
      } else if (response.status === 401) {
        console.log('  ⚠️  Authentication required (401)');
        console.log('  💡 Prometheus requires authentication.');
        console.log('  💡 Add PROMETHEUS_USERNAME and PROMETHEUS_PASSWORD to .env');
      } else if (response.status === 403) {
        console.log('  ❌ Forbidden (403)');
        console.log('  💡 Possible causes:');
        console.log('     - IP-based access control');
        console.log('     - Authentication required');
        console.log('     - CORS policy');
        console.log('     - Reverse proxy configuration');
      } else if (response.status === 404) {
        console.log('  ⚠️  Endpoint not found (404)');
        console.log('  💡 Prometheus might be running on a different path');
      } else {
        console.log(`  ⚠️  Unexpected status: ${response.status}`);
      }

      if (response.headers) {
        console.log(`  Headers:`);
        if (response.headers['www-authenticate']) {
          console.log(`    WWW-Authenticate: ${response.headers['www-authenticate']}`);
        }
        if (response.headers['content-type']) {
          console.log(`    Content-Type: ${response.headers['content-type']}`);
        }
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('  ❌ Connection refused');
        console.log('  💡 Prometheus is not running or not accessible at this URL');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('  ❌ Connection timeout');
        console.log('  💡 Network issue or firewall blocking the connection');
      } else if (error.code === 'ENOTFOUND') {
        console.log('  ❌ Host not found');
        console.log('  💡 DNS resolution failed - check the hostname');
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('Diagnostics complete!\n');
  console.log('Common Solutions:');
  console.log('1. Check Prometheus is running: systemctl status prometheus');
  console.log('2. Verify firewall rules allow access to port 9090');
  console.log('3. Check Prometheus config for web.listen-address');
  console.log('4. If behind reverse proxy, check proxy configuration');
  console.log('5. Add authentication credentials if required');
  console.log('\nFor authentication, add to .env:');
  console.log('  PROMETHEUS_USERNAME=your_username');
  console.log('  PROMETHEUS_PASSWORD=your_password');
  console.log('  # or');
  console.log('  PROMETHEUS_TOKEN=your_bearer_token');
}

testConnection().catch(console.error);
