# Quick Start Guide

All configurations are already saved. Use the appropriate command based on your needs:

## Development Mode

Start both frontend and backend with hot reload:

```bash
./start-dev.sh
```

- Frontend: http://localhost:3000/status/
- Backend: http://localhost:3003/api/
- Logs: `tail -f frontend.log` or `tail -f backend.log`
- Stop: Press `Ctrl+C` or run `./stop-all.sh`

## Production Mode

Start optimized production servers:

```bash
./start-prod.sh
```

- Frontend: http://localhost:3000/status/
- Backend: http://localhost:3003/api/
- Logs: `tail -f frontend.log` or `tail -f backend.log`
- Stop: Press `Ctrl+C` or run `./stop-all.sh`

## Systemd Service (Auto-start on boot)

To run as system services that auto-start on boot:

```bash
# Copy service files to systemd
sudo cp hpc-monitoring-backend.service /etc/systemd/system/
sudo cp hpc-monitoring-frontend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable hpc-monitoring-backend
sudo systemctl enable hpc-monitoring-frontend

# Start services
sudo systemctl start hpc-monitoring-backend
sudo systemctl start hpc-monitoring-frontend

# Check status
sudo systemctl status hpc-monitoring-backend
sudo systemctl status hpc-monitoring-frontend

# View logs
sudo journalctl -u hpc-monitoring-backend -f
sudo journalctl -u hpc-monitoring-frontend -f
```

## Stop All Applications

```bash
./stop-all.sh
```

## Configuration

All configurations are pre-configured in:
- `.env` - Backend API configuration (port 3003, CORS origin)
- `vite.config.ts` - Frontend configuration (base path /status/, port 3000)
- `nginx.conf` - Reverse proxy configuration

### Ports
- Frontend: 3000
- Backend: 3003

### URLs
- Nginx proxy: https://hopper2.nus.edu.sg/status/
- Direct frontend: http://localhost:3000/status/
- Direct backend: http://localhost:3003/api/
- Health check: http://localhost:3003/api/health

No configuration changes needed!