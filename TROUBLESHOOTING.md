# Troubleshooting Guide

## 403 Forbidden Error from Prometheus

### Error Message
```
Error loading data: Request failed with status code 403
```

This means the backend can connect to Prometheus, but Prometheus is rejecting the request.

### Quick Diagnosis

Run the diagnostic script:
```bash
cd backend
node test-prometheus.js
```

This will test your Prometheus connection and identify the issue.

### Common Causes & Solutions

#### 1. Prometheus Requires Authentication

**Symptoms:**
- 403 error when accessing Prometheus API
- Works in browser if you're already logged in
- Prometheus has `--web.config.file` configured

**Solution:**

Add authentication to your `.env` file:

**Option A: Basic Authentication**
```env
PROMETHEUS_USERNAME=your_username
PROMETHEUS_PASSWORD=your_password
```

**Option B: Bearer Token**
```env
PROMETHEUS_TOKEN=your_bearer_token
```

#### 2. IP-Based Access Control

**Symptoms:**
- 403 error from the backend
- Works when accessing from certain IPs
- Prometheus has firewall rules or nginx proxy

**Solution:**

**Check Prometheus configuration:**
```bash
# Check if Prometheus has IP restrictions
cat /etc/prometheus/prometheus.yml
# or
docker logs prometheus
```

**If behind nginx/reverse proxy:**
```nginx
# Add your backend server IP to allowed list
location /api/v1/ {
    allow 192.168.12.0/24;  # Your network
    allow 127.0.0.1;         # Localhost
    deny all;
}
```

**Update firewall:**
```bash
# Allow backend server IP
sudo ufw allow from 192.168.12.x to any port 9090
```

#### 3. CORS Policy

**Symptoms:**
- 403 error in browser console
- "CORS policy" mentioned in error
- Backend requests work, frontend doesn't

**Solution:**

This shouldn't affect backend→Prometheus requests, but if it does:

**Configure Prometheus CORS:**
```yaml
# prometheus.yml
global:
  ...

# Add CORS configuration
web:
  cors_origin: "*"
  # or specific origins:
  # cors_origin: "http://192.168.12.x:5000"
```

#### 4. Prometheus Web Configuration

**Symptoms:**
- Prometheus has `--web.config.file` flag
- Authentication is configured
- Certificate issues

**Solution:**

Check Prometheus web config:
```yaml
# /etc/prometheus/web-config.yml
basic_auth_users:
  admin: $2y$10$... # bcrypt hash

# or TLS config
tls_server_config:
  cert_file: /path/to/cert.pem
  key_file: /path/to/key.pem
```

Add credentials to `.env`:
```env
PROMETHEUS_USERNAME=admin
PROMETHEUS_PASSWORD=your_password
```

#### 5. Reverse Proxy Configuration

**Symptoms:**
- Prometheus is behind nginx/apache
- Direct access to Prometheus works
- Proxied access returns 403

**Solution:**

**Check nginx configuration:**
```nginx
location /prometheus/ {
    proxy_pass http://localhost:9090/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Add if authentication is needed
    # auth_basic "Prometheus";
    # auth_basic_user_file /etc/nginx/.htpasswd;
}
```

Update `PROMETHEUS_URL`:
```env
PROMETHEUS_URL=http://192.168.12.2/prometheus
```

### Detailed Diagnostics

#### Test Prometheus Directly

```bash
# Test health endpoint (usually no auth required)
curl http://192.168.12.2:9090/-/healthy

# Test API endpoint (may require auth)
curl http://192.168.12.2:9090/api/v1/query?query=up

# Test with authentication
curl -u username:password http://192.168.12.2:9090/api/v1/query?query=up

# Test with bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" http://192.168.12.2:9090/api/v1/query?query=up
```

#### Check Prometheus Logs

```bash
# Systemd
journalctl -u prometheus -f

# Docker
docker logs prometheus -f

# Check for authentication errors
grep "authentication" /var/log/prometheus/prometheus.log
```

#### Verify Network Access

```bash
# Check if Prometheus is listening
sudo netstat -tlnp | grep 9090

# Test connection from backend server
telnet 192.168.12.2 9090

# Check firewall rules
sudo iptables -L -n | grep 9090
# or
sudo ufw status
```

### Step-by-Step Fix

1. **Run diagnostics:**
   ```bash
   cd backend
   node test-prometheus.js
   ```

2. **Based on the output:**

   **If 401 Unauthorized:**
   - Add `PROMETHEUS_USERNAME` and `PROMETHEUS_PASSWORD` to `.env`

   **If 403 Forbidden:**
   - Check IP restrictions in Prometheus config
   - Check firewall rules
   - Check reverse proxy configuration
   - Try accessing Prometheus directly first

   **If Connection Refused:**
   - Check Prometheus is running: `systemctl status prometheus`
   - Check the URL is correct
   - Check firewall allows the port

3. **Test with curl:**
   ```bash
   curl -v http://192.168.12.2:9090/api/v1/query?query=up
   ```

4. **Add authentication if needed:**
   ```env
   # .env
   PROMETHEUS_USERNAME=admin
   PROMETHEUS_PASSWORD=secretpassword
   ```

5. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

### Getting Prometheus Credentials

If you don't have credentials but need them:

#### Option 1: Check Prometheus Config
```bash
cat /etc/prometheus/web-config.yml
# Look for basic_auth_users section
```

#### Option 2: Check Environment
```bash
# If Prometheus is in Docker
docker inspect prometheus | grep -i auth

# Check environment variables
ps aux | grep prometheus
```

#### Option 3: Ask Administrator
Contact your system administrator for Prometheus credentials.

#### Option 4: Disable Authentication (Dev Only)
```bash
# Remove --web.config.file flag from Prometheus startup
# NOT RECOMMENDED for production!

# Edit systemd service
sudo systemctl edit prometheus

# Or edit Docker compose
docker-compose down
# Edit docker-compose.yml to remove web.config.file
docker-compose up -d
```

### Alternative Solutions

#### Option 1: Use Local Prometheus
Run Prometheus locally without authentication:
```bash
docker run -p 9090:9090 prom/prometheus
```

Update `.env`:
```env
PROMETHEUS_URL=http://localhost:9090
```

#### Option 2: Proxy Through Backend
Set up a proxy endpoint in the backend that handles authentication:
```javascript
// Add to backend server.js
app.get('/api/prometheus-proxy', async (req, res) => {
  const prometheusUrl = 'http://192.168.12.2:9090' + req.url.replace('/api/prometheus-proxy', '');
  const response = await axios.get(prometheusUrl, {
    auth: { username: 'admin', password: 'secret' }
  });
  res.json(response.data);
});
```

Update `PROMETHEUS_URL`:
```env
PROMETHEUS_URL=http://localhost:5000/api/prometheus-proxy
```

#### Option 3: SSH Tunnel
Create an SSH tunnel to Prometheus:
```bash
ssh -L 9090:localhost:9090 user@192.168.12.2
```

Update `.env`:
```env
PROMETHEUS_URL=http://localhost:9090
```

### Still Not Working?

1. **Check backend logs:**
   ```bash
   cd backend
   npm run dev
   # Look for detailed error messages
   ```

2. **Enable debug logging:**
   ```env
   LOG_LEVEL=debug
   ```

3. **Check Prometheus UI:**
   - Open `http://192.168.12.2:9090` in browser
   - Try running a query manually
   - Check if authentication is required

4. **Verify pbs-exporter:**
   ```bash
   # Check if pbs-exporter is running and metrics are available
   curl http://192.168.12.2:9090/api/v1/query?query=qstat_total_r_jobs
   ```

### Need More Help?

Include this information when asking for help:
1. Output of `node test-prometheus.js`
2. Backend error logs
3. Prometheus version: `curl http://192.168.12.2:9090/api/v1/status/buildinfo`
4. Network topology (is Prometheus on same network?)
5. Whether you can access Prometheus UI in browser
