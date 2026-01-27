# Migration to Prometheus Data Source

This document describes the architectural change from direct PBS command execution to Prometheus-based monitoring.

## Overview

The HPC Monitoring system has been refactored to use **Prometheus** as the data source instead of directly executing PBS commands. This provides better scalability, historical data, and separation of concerns.

## Architecture Change

### Before (PBS Commands)
```
Frontend → Backend → SSH/Direct PBS Commands → Parse Output → JSON Response
```

### After (Prometheus)
```
PBS Pro → pbs-exporter → Prometheus → Backend API → Frontend
          (scrapes)      (stores)     (queries)
```

## Key Changes

### 1. Data Source
- **Old**: Direct execution of `qstat`, `pbsnodes`, etc.
- **New**: HTTP queries to Prometheus API at `http://192.168.12.2:9090`

### 2. Dependencies
- **Removed**: `ssh2` (no longer needed)
- **Added**: Uses existing `axios` for HTTP requests

### 3. Environment Configuration

**Old `.env`**:
```env
PBS_SSH_HOST=hopper2
PBS_SSH_USER=zidni
PBS_SSH_KEY_PATH=~/.ssh/id_rsa
PBS_QSTAT_CMD=qstat
```

**New `.env`**:
```env
PROMETHEUS_URL=http://192.168.12.2:9090
PROMETHEUS_TIMEOUT=10000
```

### 4. Backend Services

**New Files**:
- `backend/src/services/prometheusService.js` - Prometheus API client
- Queries Prometheus for metrics
- Transforms metrics to PBS data format

**Modified Files**:
- `backend/src/services/pbsService.js` - Now uses prometheusService
- `backend/src/config/env.js` - Prometheus configuration
- `backend/src/server.js` - Updated analytics endpoints
- `backend/package.json` - Updated dependencies

**Removed Files**:
- `backend/src/utils/commandExecutor.js` - No longer needed

## Prometheus Metrics

The system uses these metrics from [pbs-exporter](https://github.com/jxdn/pbs-exporter):

### Job Metrics
- `qstat_total_r_jobs` - Running jobs
- `qstat_total_q_jobs` - Queued jobs
- `qstat_total_h_jobs` - Held jobs
- `qstat_running_jobs_by_user` - Jobs per user
- `qstat_running_jobs_by_queue` - Jobs per queue

### Node Metrics
- `pbs_node_state` - Node states (free/busy/down/offline)
- `pbs_node_cpus_total` / `pbs_node_cpus_used` - CPU metrics
- `pbs_node_mem_total` / `pbs_node_mem_used` - Memory metrics
- `pbs_node_count_*` - Node count aggregates

## Important Limitations

### 1. No Individual Job Details ⚠️
Prometheus provides **aggregated metrics only**.

**Not Available:**
- Individual job IDs, names, owners
- Per-job resource allocation
- Job submission/start/end times
- Job-specific details

**Available:**
- Total job counts by status
- Jobs grouped by user/queue
- Aggregated statistics
- Historical trends

The `/api/jobs/:id` endpoint now returns an error explaining this limitation.

### 2. No Job Control Operations ⚠️
Job management operations are not available:
- `DELETE /api/jobs/:id` (qdel)
- `POST /api/jobs/:id/hold` (qhold)
- `POST /api/jobs/:id/release` (qrls)

**Workarounds:**
- Execute PBS commands directly on the server
- Set up a separate job control API
- Use PBS CLI tools

These endpoints now return descriptive error messages.

### 3. Node Details Available ✅
Full node information is available:
- Node states
- CPU utilization per node
- Memory usage per node
- Node-specific metrics

## API Response Changes

### GET /api/jobs

**Old Response (Array of Jobs)**:
```json
[
  {
    "id": "1234.server",
    "name": "job_name",
    "user": "username",
    "status": "R",
    "queue": "workq",
    "cpus": 16,
    ...
  }
]
```

**New Response (Aggregated Summary)**:
```json
{
  "summary": {
    "total": 65,
    "running": 42,
    "queued": 20,
    "hold": 3
  },
  "byUser": [
    { "user": "user1", "count": 25 },
    { "user": "user2", "count": 17 }
  ],
  "byQueue": [
    { "queue": "workq", "count": 40 },
    { "queue": "gpu", "count": 25 }
  ]
}
```

### GET /api/nodes (No Change)
Node endpoints continue to return individual node details.

### GET /api/analytics/* (Enhanced)
Analytics endpoints now use real Prometheus historical data instead of mock data.

## Setup Requirements

### 1. Prometheus Server
- Must be accessible at `http://192.168.12.2:9090`
- Should have retention configured for historical data
- Firewall rules must allow backend access

### 2. PBS Exporter
Install and configure [pbs-exporter](https://github.com/jxdn/pbs-exporter):

```bash
# Install pbs-exporter
git clone https://github.com/jxdn/pbs-exporter
cd pbs-exporter
# Follow installation instructions
```

Configure Prometheus to scrape pbs-exporter:
```yaml
scrape_configs:
  - job_name: 'pbs'
    static_configs:
      - targets: ['localhost:9100']  # pbs-exporter port
```

### 3. Backend Configuration
Update `.env`:
```env
PROMETHEUS_URL=http://192.168.12.2:9090
```

### 4. Install Dependencies
```bash
cd backend
npm install  # Will install axios and other dependencies
```

## Testing

### 1. Check Prometheus
```bash
curl http://192.168.12.2:9090/-/healthy
```

### 2. Check Metrics
```bash
curl "http://192.168.12.2:9090/api/v1/query?query=qstat_total_r_jobs"
```

### 3. Start Backend
```bash
cd backend
npm run dev
```

### 4. Test API
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/jobs
curl http://localhost:5000/api/nodes
curl http://localhost:5000/api/stats/cluster
```

## Migration Checklist

- [x] Install and configure pbs-exporter
- [x] Configure Prometheus to scrape pbs-exporter
- [x] Verify metrics are available in Prometheus
- [x] Update backend `.env` with `PROMETHEUS_URL`
- [x] Install backend dependencies (`npm install`)
- [x] Test backend API endpoints
- [x] Update frontend if needed (API responses changed for `/api/jobs`)
- [x] Remove old SSH configuration from `.env`
- [x] Test analytics endpoints with real historical data

## Rollback Plan

If needed to rollback to PBS commands:

1. Restore old files from git:
   - `backend/src/utils/commandExecutor.js`
   - Old versions of `pbsService.js`, `env.js`, `server.js`

2. Restore `.env` with SSH configuration

3. Reinstall old dependencies:
   ```bash
   npm install ssh2
   ```

4. Restart backend

## Benefits of Prometheus

✅ **Scalability**: No direct PBS server load
✅ **Historical Data**: Built-in time-series storage
✅ **Reliability**: Prometheus handles scraping/retries
✅ **Separation of Concerns**: Monitoring decoupled from PBS
✅ **Grafana Integration**: Can add Grafana dashboards
✅ **Alerting**: Use Prometheus alerting rules
✅ **Query Language**: Powerful PromQL for analytics

## Trade-offs

⚠️ **No Individual Job Details**: Only aggregated metrics
⚠️ **No Job Control**: Cannot delete/hold/release jobs via API
⚠️ **Additional Components**: Requires pbs-exporter and Prometheus
⚠️ **Network Dependency**: Requires network access to Prometheus

## Next Steps

1. **Frontend Updates**: Adapt Jobs page to display aggregated data
2. **Job Control**: Consider separate API for job operations
3. **Grafana**: Set up Grafana dashboards for operators
4. **Alerting**: Configure Prometheus alerts for critical conditions
5. **Monitoring**: Monitor the backend API itself

## Support

For issues:
- Check backend logs
- Verify Prometheus connectivity
- Check pbs-exporter status
- Review [backend/README.md](backend/README.md)

## References

- [pbs-exporter](https://github.com/jxdn/pbs-exporter)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Prometheus HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)
