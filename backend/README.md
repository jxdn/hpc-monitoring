# HPC Monitoring Backend API - VictoriaMetrics Edition

Backend API server for PBS Pro monitoring system using VictoriaMetrics as the data source via [pbs-exporter](https://github.com/jxdn/pbs-exporter).

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────────┐
│  PBS Pro        │         │ pbs-exporter │         │  VictoriaMetrics    │
│  Scheduler      │────────>│  (metrics)   │────────>│   :8428 or :9090    │
└─────────────────┘         └──────────────┘         └─────────────────────┘
                                                                │
                                                                │ HTTP API (Prometheus-compatible)
                                                                ▼
                                                         ┌───────────────┐
                                                         │  Backend API  │
                                                         │   :3001       │
                                                         └───────────────┘
                                                                │
                                                                ▼
                                                         ┌───────────────┐
                                                         │   Frontend    │
                                                         │   :3000       │
                                                         └───────────────┘
```

## Features

- **VictoriaMetrics Integration**: Queries VictoriaMetrics Prometheus-compatible API for PBS metrics
- **Real-time Metrics**: Job counts, node states, resource utilization
- **Historical Analytics**: Time-series data from VictoriaMetrics
- **RESTful API**: JSON responses for all PBS data
- **Caching**: In-memory caching for improved performance
- **CORS Support**: Configured for frontend integration

## Prerequisites

- Node.js (v16 or higher)
- VictoriaMetrics server running (default: `http://localhost:9090`, or `http://172.18.186.48:8428`)
- [pbs-exporter](https://github.com/jxdn/pbs-exporter) collecting PBS metrics

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in root `.env` file:
```env
# For local VictoriaMetrics (development with port forward)
PROMETHEUS_URL=http://localhost:9090

# For remote VictoriaMetrics (production)
# PROMETHEUS_URL=http://172.18.186.48:8428
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`.

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Jobs
- `GET /api/jobs` - Get aggregated job statistics
  - Returns: Job counts by status, user, and queue
  - Note: Individual job details are NOT available from VictoriaMetrics metrics

### Nodes
- `GET /api/nodes` - List all compute nodes with details
- `GET /api/nodes/:id` - Get specific node details

### Queues
- `GET /api/queues` - List all PBS queues (derived from metrics)

### Cluster Statistics
- `GET /api/stats/cluster` - Get cluster-wide statistics
  - Node counts (free, busy, down)
  - Job counts (running, queued)
  - GPU utilization

### Analytics
- `GET /api/analytics/jobs?timeRange=24h` - Historical job statistics
- `GET /api/analytics/resources?timeRange=24h` - Historical resource utilization

**Time Ranges**: `1h`, `24h`, `7d`, `30d`

## VictoriaMetrics Metrics Used

The backend queries these metrics from pbs-exporter (stored in VictoriaMetrics):

### Job Metrics
- `qstat_total_r_jobs` - Running jobs count
- `qstat_total_q_jobs` - Queued jobs count
- `qstat_total_h_jobs` - Held jobs count
- `qstat_running_jobs_by_user` - Jobs per user
- `qstat_running_jobs_by_queue` - Jobs per queue

### Node Metrics
- `pbs_node_state` - Node state (0=free, 1=busy, 2=offline, 3=down)
- `pbs_node_gpus_total` - Total GPUs per node
- `pbs_node_gpus_used` - Used GPUs per node
- `pbs_node_mem_total` - Total memory per node
- `pbs_node_mem_used` - Used memory per node

### Aggregated Metrics
- `pbs_node_count_free` - Free nodes count
- `pbs_node_count_busy` - Busy nodes count
- `pbs_node_count_offline` - Offline nodes count
- `pbs_node_count_down` - Down nodes count

## Configuration

All configuration is done via environment variables in the root `.env` file:

```env
# VictoriaMetrics Configuration
PROMETHEUS_URL=http://localhost:9090
# Or for remote: http://172.18.186.48:8428
PROMETHEUS_TIMEOUT=10000

# API Server
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Caching
DATA_CACHE_TTL=30000

# Logging
LOG_LEVEL=info
```

## Limitations

### No Individual Job Details
VictoriaMetrics/pbs-exporter provides **aggregated metrics only**, not individual job information.

**What's NOT available:**
- Individual job IDs, names, owners
- Specific job resources (CPUs, memory per job)
- Job submission/start times
- Job walltime and elapsed time

**What IS available:**
- Total job counts by status (running, queued, held)
- Jobs grouped by user and queue
- Aggregated resource utilization
- Historical trends

### No Job Control Operations
Job control operations (qdel, qhold, qrls) are NOT supported via VictoriaMetrics.

**Workarounds:**
1. Execute PBS commands directly on the server
2. Set up a separate job control API with SSH/direct PBS access
3. Use PBS command-line tools

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.js              # Environment configuration
│   ├── services/
│   │   ├── prometheusService.js # VictoriaMetrics API client (Prometheus-compatible)
│   │   └── pbsService.js        # PBS business logic
│   └── server.js                # Express API server
├── package.json
└── README.md
```

## Development

### Adding New Metrics

1. **Check Available Metrics**:
```bash
curl http://localhost:9090/api/v1/label/__name__/values
# Or: curl http://172.18.186.48:8428/api/v1/label/__name__/values
```

2. **Add Query to prometheusService.js**:
```javascript
async function getNewMetric() {
  const result = await queryPrometheus('your_metric_name');
  return result;
}
```

3. **Expose via pbsService.js and server.js**

### Testing VictoriaMetrics Queries

Test queries directly:
```bash
# Get all running jobs
curl "http://localhost:9090/api/v1/query?query=qstat_total_r_jobs"

# Get node states
curl "http://localhost:9090/api/v1/query?query=pbs_node_state"

# Get historical GPU utilization
curl "http://localhost:9090/api/v1/query_range?query=sum(pbs_node_gpus_used)/sum(pbs_node_gpus_total)&start=1706000000&end=1706086400&step=5m"
```

## Troubleshooting

### VictoriaMetrics Connection Failed

**Error**: `Failed to query VictoriaMetrics: connect ECONNREFUSED`

**Solutions**:
- Check VictoriaMetrics is running: `curl http://localhost:9090/-/healthy`
- Verify `PROMETHEUS_URL` in `.env`
- Check network connectivity and port forwarding
- Verify firewall rules

### No Data Returned

**Error**: Empty arrays or zero values

**Solutions**:
- Check pbs-exporter is running and scraping PBS
- Verify metrics in VictoriaMetrics UI: `http://172.18.186.48:8428/vmui/`
- Check pbs-exporter logs
- Ensure PBS commands are accessible to pbs-exporter

### Historical Data Missing

**Error**: Analytics endpoints return empty data

**Solutions**:
- Check VictoriaMetrics retention period
- Verify pbs-exporter has been running for the requested time range
- Try shorter time ranges (1h, 24h)
- Check VictoriaMetrics storage

## Performance Tips

1. **Increase Cache TTL**: For less frequently changing data
   ```env
   DATA_CACHE_TTL=60000  # 1 minute
   ```

2. **Query Optimization**: Use recording rules in VictoriaMetrics for complex queries

3. **Connection Pooling**: Axios automatically handles connection reuse

4. **Compression**: Enable gzip in VictoriaMetrics and Express

## Security Considerations

- VictoriaMetrics should be on a trusted network
- Use firewall rules to restrict VictoriaMetrics access
- Enable authentication in VictoriaMetrics if exposed
- Validate and sanitize query parameters
- Rate limit API endpoints in production

## Monitoring

Monitor the backend itself:
- API response times
- VictoriaMetrics query latencies
- Cache hit rates
- Error rates

Consider adding:
- Application Performance Monitoring (APM)
- Structured logging
- Metrics export for the API itself

## Future Enhancements

- [ ] Database for longer-term historical data
- [ ] WebSocket support for real-time updates
- [ ] Query result pagination
- [ ] Alerting based on VictoriaMetrics alerts
- [ ] Grafana dashboard integration
- [ ] Support for multiple VictoriaMetrics instances

## References

- [pbs-exporter GitHub](https://github.com/jxdn/pbs-exporter)
- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [Prometheus HTTP API (Compatible)](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [PBS Professional Documentation](https://www.pbspro.org/)

## License

MIT
