# Docker Setup Guide

This guide explains how to run the HPC Monitoring application using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Service URLs](#service-urls)
- [Volumes and Data Persistence](#volumes-and-data-persistence)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- At least 4GB of RAM available for Docker
- At least 10GB of disk space

To check your versions:
```bash
docker --version
docker-compose --version
```

## Quick Start

### Development Mode (with hot-reload)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env and configure for Docker
# Set PROMETHEUS_URL=http://victoriametrics:8428
# Set MYSQL_HOST=mysql
# Set API_HOST=0.0.0.0

# 3. Start all services
./docker-start-dev.sh

# Or manually:
docker-compose --profile dev up --build
```

Frontend: http://localhost:3000
Backend API: http://localhost:3001
VictoriaMetrics: http://localhost:9090

### Production Mode (optimized build)

```bash
# 1. Configure .env for production
cp .env.example .env
# Update environment variables as needed

# 2. Start all services in background
./docker-start-prod.sh

# Or manually:
docker-compose --profile prod up --build -d
```

## Architecture

The Docker setup includes the following services:

### Services

1. **VictoriaMetrics** (`victoriametrics`)
   - Time-series database for Prometheus metrics
   - 60-day data retention
   - Port: 9090 (maps to internal 8428)

2. **MySQL** (`mysql`)
   - XDMoD database
   - Database: `modw`
   - Port: 6033 (maps to internal 3306)

3. **Backend API** (`backend` / `backend-prod`)
   - Node.js + Express server
   - Includes Puppeteer for PDF generation
   - Port: 3001

4. **Frontend** (`frontend` / `frontend-prod`)
   - React + Vite application
   - Port: 3000

### Network

All services communicate via a bridge network: `hpc-monitoring-network`

Service names are used for inter-service communication:
- Backend → VictoriaMetrics: `http://victoriametrics:8428`
- Backend → MySQL: `mysql:3306`
- Frontend → Backend: `http://backend:3001` (internal)

## Configuration

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

#### Key Docker-specific variables:

```env
# Application
NODE_ENV=development              # or production
BUILD_TARGET=development          # or production

# API
API_PORT=3001
API_HOST=0.0.0.0                 # Required for Docker
CORS_ORIGIN=http://localhost:3000

# VictoriaMetrics (Docker service name)
PROMETHEUS_URL=http://victoriametrics:8428

# MySQL (Docker service name)
MYSQL_HOST=mysql
MYSQL_PORT=3306                   # Internal port
MYSQL_USER=root
MYSQL_PASSWORD=rootpassword       # Change in production!
MYSQL_DATABASE=modw
```

## Development Mode

Development mode enables:
- **Hot-reload** for both frontend and backend
- Source code mounted as volumes
- Nodemon for backend auto-restart
- Vite dev server for frontend
- Detailed logging

### Starting Development Mode

```bash
./docker-start-dev.sh
```

Or manually:
```bash
docker-compose --profile dev up --build
```

### Testing Hot-Reload

**Frontend:**
1. Edit any file in `src/` (e.g., `src/App.tsx`)
2. Save the file
3. Browser refreshes automatically

**Backend:**
1. Edit any file in `backend/src/` (e.g., `backend/src/server.js`)
2. Save the file
3. Nodemon restarts the server automatically

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f victoriametrics
docker-compose logs -f mysql
```

## Production Mode

Production mode features:
- Optimized builds (minified, tree-shaken)
- No source code mounts
- Node runs directly (no nodemon)
- Vite preview server for frontend
- Runs in background (detached)

### Starting Production Mode

```bash
./docker-start-prod.sh
```

Or manually:
```bash
docker-compose --profile prod up --build -d
```

### Checking Service Status

```bash
docker-compose ps
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend-prod

# Frontend only
docker-compose logs -f frontend-prod
```

### Stopping Services

```bash
./docker-stop.sh
```

Or manually:
```bash
docker-compose down
```

## Service URLs

When all services are running:

| Service         | URL                        | Description                |
|-----------------|----------------------------|----------------------------|
| Frontend        | http://localhost:3000      | Dashboard UI               |
| Backend API     | http://localhost:3001      | REST API                   |
| Health Check    | http://localhost:3001/api/health | Backend health check |
| VictoriaMetrics | http://localhost:9090      | Metrics database UI        |
| MySQL           | localhost:6033             | Database (via MySQL client)|

### Connecting to MySQL

From your host machine:
```bash
mysql -h 127.0.0.1 -P 6033 -u root -p
# Password: rootpassword (or your configured password)
```

From within Docker network:
```bash
docker exec -it hpc-mysql mysql -u root -p modw
```

## Volumes and Data Persistence

### Named Volumes

Data persists across container restarts:

| Volume                      | Purpose                        |
|-----------------------------|--------------------------------|
| `hpc-victoriametrics-data`  | VictoriaMetrics time-series    |
| `hpc-mysql-data`            | MySQL database files           |
| `hpc-backend-cache`         | Backend cache directory        |
| `hpc-backend-logs`          | Backend log files              |
| `hpc-backend-node-modules`  | Backend dependencies (dev)     |
| `hpc-frontend-node-modules` | Frontend dependencies (dev)    |

### Viewing Volumes

```bash
docker volume ls | grep hpc
```

### Backing Up Data

**VictoriaMetrics:**
```bash
docker run --rm -v hpc-victoriametrics-data:/data -v $(pwd):/backup ubuntu tar czf /backup/vm-backup.tar.gz /data
```

**MySQL:**
```bash
docker exec hpc-mysql mysqldump -u root -prootpassword modw > mysql-backup.sql
```

### Restoring Data

**MySQL:**
```bash
docker exec -i hpc-mysql mysql -u root -prootpassword modw < mysql-backup.sql
```

### Cleaning Volumes

⚠️ **Warning:** This will delete all data!

```bash
./docker-clean.sh
```

Or manually:
```bash
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

If you get "port is already allocated" error:

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :9090, :6033

# Stop conflicting service or change port in .env
```

### Permission Denied on Scripts

```bash
chmod +x docker-start-dev.sh docker-start-prod.sh docker-stop.sh docker-clean.sh
```

### Container Keeps Restarting

Check logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

Common issues:
- Missing `.env` file → Copy from `.env.example`
- Wrong environment variables → Check Docker service names
- VictoriaMetrics/MySQL not ready → Services have health checks, wait a moment

### PDF Generation Fails

Puppeteer in Docker requires specific system libraries. The backend Dockerfile includes all necessary dependencies. If it still fails:

```bash
# Check backend logs
docker-compose logs backend

# Verify Chromium is installed
docker exec hpc-backend chromium --version
```

### Database Connection Failed

Check MySQL is running:
```bash
docker-compose ps mysql
```

Verify environment variables:
```bash
docker-compose exec backend printenv | grep MYSQL
```

Should show:
- `MYSQL_HOST=mysql`
- `MYSQL_PORT=3306`
- `MYSQL_DATABASE=modw`

### VictoriaMetrics No Data

1. Check VictoriaMetrics is running:
   ```bash
   curl http://localhost:9090/api/v1/status/config
   ```

2. Verify retention period:
   ```bash
   docker-compose logs victoriametrics | grep retention
   ```

3. Check backend can connect:
   ```bash
   docker-compose exec backend curl http://victoriametrics:8428/health
   ```

### Cannot Access Frontend

1. Check container is running:
   ```bash
   docker-compose ps frontend
   ```

2. Check logs for errors:
   ```bash
   docker-compose logs frontend
   ```

3. Verify port mapping:
   ```bash
   docker port hpc-frontend
   ```

## Advanced Usage

### Building Without Cache

```bash
docker-compose build --no-cache
```

### Running Specific Services

```bash
# Only start VictoriaMetrics and MySQL
docker-compose up victoriametrics mysql

# Only rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Accessing Container Shell

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MySQL
docker-compose exec mysql bash
```

### Viewing Resource Usage

```bash
docker stats
```

### Custom docker-compose Override

Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      LOG_LEVEL: debug
    ports:
      - "3002:3001"  # Custom port mapping
```

### Running Tests in Container

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

### Updating Dependencies

```bash
# Backend
docker-compose exec backend npm update

# Frontend
docker-compose exec frontend npm update

# Rebuild images
docker-compose build
```

## Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose ps

# Manual health check - Backend
curl http://localhost:3001/api/health

# Manual health check - VictoriaMetrics
curl http://localhost:9090/api/v1/status/config

# Manual health check - MySQL
docker-compose exec mysql mysqladmin ping -h localhost -u root -prootpassword
```

## Maintenance

### Viewing Disk Usage

```bash
docker system df
```

### Cleaning Up Unused Resources

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

### Updating Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest
docker-compose build --pull
```

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default passwords** in production
3. **Use strong passwords** for MySQL
4. **Restrict CORS_ORIGIN** in production to your actual domain
5. **Run containers as non-root** (backend production already does this)
6. **Keep base images updated** - Rebuild periodically

## Performance Tuning

### Allocate More Memory to Docker

Docker Desktop → Settings → Resources → Memory (recommended: 6GB+)

### Optimize Volume Performance

For development on macOS, use `:delegated` flag (already configured):
```yaml
volumes:
  - ./backend:/app:delegated
```

### Production Build Optimization

The Dockerfiles already implement:
- Multi-stage builds to minimize image size
- Layer caching for faster builds
- Only production dependencies in final images

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: Check `.env` file
3. Review this documentation
4. Check service health: `docker-compose ps`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [Puppeteer in Docker](https://pptr.dev/guides/docker)
