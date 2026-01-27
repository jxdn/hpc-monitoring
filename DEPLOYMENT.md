# Deployment Guide

This guide explains how to deploy the HPC Monitoring system in both development and production environments.

## Overview

The system supports two execution modes:

1. **Development Mode**: SSH to remote PBS server (hopper2)
2. **Production Mode**: Direct execution on PBS node

## Development Deployment

Development mode is designed for local development where you don't have direct access to the PBS server.

### Requirements
- SSH access to PBS server (hopper2)
- SSH key authentication configured
- Node.js installed on your local machine

### Setup

1. **Configure SSH Access**

First, ensure you can SSH to the PBS server:
```bash
ssh zidni@hopper2
```

If you don't have SSH keys set up:
```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id zidni@hopper2
```

2. **Configure Environment**

Edit `.env` file:
```env
NODE_ENV=development
PBS_SSH_HOST=hopper2
PBS_SSH_PORT=22
PBS_SSH_USER=zidni
PBS_SSH_KEY_PATH=~/.ssh/id_rsa
```

3. **Install Dependencies**

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

4. **Start Development Servers**

Terminal 1 - Backend (SSH mode):
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

5. **Access Application**

Open browser: `http://localhost:3000`

### How Development Mode Works

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │  HTTP   │   Backend    │   SSH   │   hopper2    │
│  (React)     │────────>│  (Express)   │────────>│  PBS Server  │
│ :3000        │         │  :5000       │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                         │
                                │    qstat, pbsnodes      │
                                │<────────────────────────┘
                                │
                         Parse & Return JSON
```

## Production Deployment

Production mode runs directly on the PBS node, providing better performance and security.

### Requirements
- PBS Pro installed and configured
- Node.js installed on PBS node
- User with PBS command permissions

### Setup

1. **Transfer Files to PBS Node**

```bash
# From your local machine
scp -r HPCMonitoring-openondemand zidni@hopper2:~/
```

Or clone from Git:
```bash
ssh zidni@hopper2
git clone <your-repo-url> HPCMonitoring-openondemand
cd HPCMonitoring-openondemand
```

2. **Configure Environment**

Edit `.env` file on the PBS node:
```env
NODE_ENV=production

# No SSH configuration needed in production
PBS_QSTAT_CMD=qstat
PBS_PBSNODES_CMD=pbsnodes
PBS_QDEL_CMD=qdel
PBS_QHOLD_CMD=qhold
PBS_QRLS_CMD=qrls

API_PORT=5000
API_HOST=0.0.0.0  # Listen on all interfaces
```

3. **Install Dependencies**

```bash
# Frontend
npm install
npm run build

# Backend
cd backend
npm install
cd ..
```

4. **Start Production Server**

Using Node:
```bash
cd backend
NODE_ENV=production node src/server.js
```

Using PM2 (recommended):
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name hpc-monitoring-api

# Start frontend (if serving with Node)
cd ..
pm2 start "npm run preview" --name hpc-monitoring-frontend

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup
```

5. **Configure Web Server (Nginx)**

Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/zidni/HPCMonitoring-openondemand/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Apply configuration:
```bash
sudo ln -s /etc/nginx/sites-available/hpc-monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### How Production Mode Works

```
┌──────────────┐         ┌──────────────────────────────┐
│   Browser    │  HTTP   │      PBS Node (hopper2)       │
│              │────────>│                               │
│              │         │  ┌────────┐    ┌──────────┐  │
└──────────────┘         │  │ Nginx  │    │  Backend │  │
                         │  │ :80    │───>│  :5000   │  │
                         │  └────────┘    └──────────┘  │
                         │                      │        │
                         │                      v        │
                         │              qstat, pbsnodes  │
                         │             (direct exec)     │
                         └──────────────────────────────┘
```

## Environment Variables Reference

### Common Variables
```env
# Environment mode (required)
NODE_ENV=development|production

# PBS Commands (optional, defaults shown)
PBS_QSTAT_CMD=qstat
PBS_PBSNODES_CMD=pbsnodes
PBS_QDEL_CMD=qdel
PBS_QHOLD_CMD=qhold
PBS_QRLS_CMD=qrls

# API Configuration
API_PORT=5000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/pbs-api.log
```

### Development Only
```env
# SSH Configuration (only for development)
PBS_SSH_HOST=hopper2
PBS_SSH_PORT=22
PBS_SSH_USER=zidni
PBS_SSH_KEY_PATH=~/.ssh/id_rsa
```

## Security Best Practices

### Development
- ✅ Use SSH key authentication (not passwords)
- ✅ Keep `.env` file secure and never commit it
- ✅ Restrict SSH user permissions on PBS server
- ✅ Use VPN if accessing from external network

### Production
- ✅ Run backend as a dedicated user with minimal permissions
- ✅ Use firewall rules to restrict API access
- ✅ Enable HTTPS with SSL certificates
- ✅ Implement authentication/authorization
- ✅ Regular security updates
- ✅ Monitor logs for suspicious activity

## Monitoring & Maintenance

### Check Status
```bash
# PM2 status
pm2 status

# View logs
pm2 logs hpc-monitoring-api

# Restart services
pm2 restart all
```

### Update Application
```bash
# Pull latest changes
git pull

# Update dependencies
npm install
cd backend && npm install && cd ..

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

### Backup
```bash
# Backup configuration
cp .env .env.backup

# Backup database (if implemented)
cp data/pbs_monitoring.db data/pbs_monitoring.db.backup
```

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port is in use
lsof -i :5000

# Check logs
pm2 logs hpc-monitoring-api

# Check PBS commands are accessible
which qstat pbsnodes
```

**SSH connection fails (development)**
```bash
# Test SSH manually
ssh -v zidni@hopper2

# Check SSH key permissions
ls -la ~/.ssh/id_rsa

# Fix permissions if needed
chmod 600 ~/.ssh/id_rsa
```

**PBS commands not found (production)**
```bash
# Check PBS installation
which qstat

# Add PBS to PATH if needed
export PATH=$PATH:/opt/pbs/bin
```

## Performance Optimization

### Backend
- Increase cache TTL for less frequently changing data
- Implement database for historical data
- Use connection pooling for SSH (development)
- Enable compression for API responses

### Frontend
- Use production build (`npm run build`)
- Enable gzip compression in Nginx
- Configure browser caching
- Use CDN for static assets

## Support

For issues and questions:
- Check the logs: `pm2 logs` or console output
- Review configuration in `.env`
- Test PBS commands manually
- Check network connectivity
- Review backend README.md

## License

MIT
