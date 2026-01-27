# HPC Monitoring - PBS Pro Dashboard

A modern, real-time monitoring dashboard for PBS Pro workload management system built with React, TypeScript, and Vite.

## Features

- **Dashboard**: Real-time cluster overview with key metrics
  - Node statistics (total, busy, free, down)
  - Job statistics (total, running, queued)
  - CPU utilization monitoring
  - Resource overview

- **Jobs Management**: Comprehensive job monitoring
  - View all jobs with status
  - Filter by running, queued, or completed
  - Job details including resources and walltime
  - Real-time updates

- **Nodes Monitoring**: Detailed node information
  - Node state tracking
  - CPU and memory utilization
  - Visual utilization bars
  - Running jobs per node

- **Analytics**: Historical data visualization
  - Job statistics over time
  - Resource utilization trends
  - Multiple time ranges (1h, 24h, 7d, 30d)
  - Interactive charts

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Styling**: CSS with CSS Variables (McKinsey-inspired design)

### Backend
- **Runtime**: Node.js + Express
- **PBS Integration**: SSH2 (development) / Direct execution (production)
- **Caching**: Node-Cache
- **API**: RESTful JSON API

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- SSH access to PBS server (for development mode)
- PBS Pro installed (for production mode)

## Quick Start

### Frontend Only (with Mock Data)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Note**: Without the backend, the frontend will show errors. See [QUICK_START.md](QUICK_START.md) for using mock data.

### Full Stack (Frontend + Backend)

1. **Configure Environment**

Create and configure `.env` file:
```bash
cp .env.example .env
# Edit .env with your PBS server details
```

For development (SSH to hopper2), the `.env` should contain:
```env
NODE_ENV=development
PBS_SSH_HOST=hopper2
PBS_SSH_USER=zidni
PBS_SSH_KEY_PATH=~/.ssh/id_rsa
```

2. **Install Dependencies**

Frontend:
```bash
npm install
```

Backend:
```bash
cd backend
npm install
cd ..
```

3. **Start Servers**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

4. **Access Application**

Open browser: `http://localhost:3000`

### Docker Setup (Recommended)

The easiest way to run the complete stack with all dependencies:

1. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with Docker-specific settings (see .env.example for details)
```

2. **Start Development Environment**

```bash
./docker-start-dev.sh
```

Or manually:
```bash
docker-compose --profile dev up --build
```

3. **Access Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- VictoriaMetrics: http://localhost:9090
- MySQL: localhost:6033

**Features:**
- ✅ All services included (Frontend, Backend, VictoriaMetrics, MySQL)
- ✅ Hot-reload for both frontend and backend
- ✅ Data persistence across restarts
- ✅ No manual setup required

**Production Mode:**
```bash
./docker-start-prod.sh
```

See [DOCKER.md](DOCKER.md) for detailed Docker documentation, troubleshooting, and advanced usage.

### Deployment

For production deployment on PBS node, see [DEPLOYMENT.md](DEPLOYMENT.md)

## Development

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
HPCMonitoring-openondemand/
├── src/                     # Frontend source code
│   ├── components/
│   │   ├── dashboard/       # Reusable dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── jobs/           # Job-specific components
│   │   ├── nodes/          # Node-specific components
│   │   └── analytics/      # Analytics components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── styles/             # Global styles
│   └── utils/              # Utility functions
│
├── backend/                # Backend API server
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   │   └── env.js
│   │   ├── services/       # PBS business logic
│   │   │   └── pbsService.js
│   │   ├── utils/          # Command executor (SSH/Direct)
│   │   │   └── commandExecutor.js
│   │   └── server.js       # Express server
│   ├── package.json
│   └── README.md
│
├── .env                    # Environment configuration
├── .env.example           # Environment template
├── DEPLOYMENT.md          # Deployment guide
├── QUICK_START.md         # Quick start guide
└── README.md              # This file
```

## API Integration

The application expects a backend API running on `http://localhost:5000` with the following endpoints:

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job details
- `DELETE /api/jobs/:id` - Delete a job
- `POST /api/jobs/:id/hold` - Hold a job
- `POST /api/jobs/:id/release` - Release a job

### Nodes
- `GET /api/nodes` - Get all nodes
- `GET /api/nodes/:id` - Get node details

### Queues
- `GET /api/queues` - Get all queues

### Statistics
- `GET /api/stats/cluster` - Get cluster statistics

### Analytics
- `GET /api/analytics/jobs?timeRange={range}` - Get job statistics
- `GET /api/analytics/resources?timeRange={range}` - Get resource utilization

## Configuration

The API base URL is configured in `vite.config.ts` and defaults to proxying `/api` requests to `http://localhost:5000`. You can modify this in the Vite config:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://your-backend-url',
      changeOrigin: true,
    },
  },
}
```

## Backend Implementation

The backend API is included in the `backend/` directory and provides:

✅ **Dual Execution Modes**:
- Development: SSH to remote PBS server (hopper2)
- Production: Direct execution on PBS node

✅ **Core Features**:
- REST API for all PBS operations
- Job management (list, view, delete, hold, release)
- Node monitoring
- Cluster statistics
- Real-time data with caching

✅ **PBS Commands Supported**:
- `qstat -f -F json` - Job listing
- `pbsnodes -aSj` - Node information
- `qdel`, `qhold`, `qrls` - Job control

See [backend/README.md](backend/README.md) for detailed documentation.

### Environment Configuration

The system uses `.env` file to switch between modes:

**Development Mode** (SSH to hopper2):
```env
NODE_ENV=development
PBS_SSH_HOST=hopper2
PBS_SSH_USER=zidni
PBS_SSH_KEY_PATH=~/.ssh/id_rsa
```

**Production Mode** (Direct execution):
```env
NODE_ENV=production
```

## Future Enhancements

- [ ] Database integration for historical analytics data
- [ ] WebSocket support for real-time updates
- [ ] User authentication and authorization
- [ ] Job submission interface
- [ ] Advanced analytics and reporting
- [ ] Email notifications for job status
- [ ] Mobile responsive design improvements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
