# Quick Start Guide

## Prerequisites

You need to install Node.js and npm first. Visit https://nodejs.org/ to download and install Node.js (which includes npm).

Verify installation:
```bash
node --version
npm --version
```

## Installation Steps

1. Install all dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and visit: `http://localhost:3000`

## Development Mode with Mock Data

Since you don't have a backend API yet, you can temporarily modify the services to use mock data:

### Option 1: Use Mock Data Directly

Edit `src/services/pbsApi.ts` and replace the API calls with mock data imports:

```typescript
import { mockJobs, mockNodes, mockQueues, mockClusterStats, mockJobStats, mockResourceUtilization } from '../utils/mockData';

export const pbsApi = {
  async getJobs(): Promise<Job[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockJobs;
  },

  async getNodes(): Promise<Node[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockNodes;
  },

  // ... similar for other methods
};
```

### Option 2: Create a Mock Server

Use json-server or MSW (Mock Service Worker) to create a mock API server.

#### Using json-server:

1. Install json-server:
```bash
npm install -D json-server
```

2. Create a `db.json` file with mock data

3. Add to package.json scripts:
```json
"mock-server": "json-server --watch db.json --port 5000"
```

4. Run both servers:
```bash
# Terminal 1
npm run mock-server

# Terminal 2
npm run dev
```

## Next Steps

### 1. Build the Backend API

You need to create a backend that:
- Connects to your PBS Pro server
- Executes PBS commands (qstat, pbsnodes, etc.)
- Parses output and returns JSON
- Provides REST endpoints matching the API in `src/services/pbsApi.ts`

Recommended technologies:
- **Node.js + Express**: Fast and JavaScript-based
- **Python + Flask/FastAPI**: Great for system commands
- **Go**: High performance

### 2. Backend API Endpoints Required

```
GET  /api/jobs              - List all jobs
GET  /api/jobs/:id          - Get job details
DELETE /api/jobs/:id        - Delete job
POST /api/jobs/:id/hold     - Hold job
POST /api/jobs/:id/release  - Release job

GET  /api/nodes             - List all nodes
GET  /api/nodes/:id         - Get node details

GET  /api/queues            - List all queues

GET  /api/stats/cluster     - Get cluster statistics

GET  /api/analytics/jobs?timeRange={range}      - Job statistics over time
GET  /api/analytics/resources?timeRange={range} - Resource utilization over time
```

### 3. PBS Pro Commands Reference

Your backend should execute and parse these PBS commands:

```bash
# List jobs
qstat -f -F json

# List nodes
pbsnodes -a -F json

# List queues
qstat -Q -f -F json

# Job operations
qdel <job_id>          # Delete job
qhold <job_id>         # Hold job
qrls <job_id>          # Release job
```

### 4. Connect to Your PBS Server

Update the backend API URL in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://your-pbs-server:5000',
      changeOrigin: true,
    },
  },
}
```

## Project Structure

```
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/   # Dashboard widgets
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components (routes)
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions & mock data
│   └── styles/          # Global styles
├── public/              # Static assets
└── Configuration files
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Customization

### Styling
- Modify CSS variables in `src/styles/index.css`
- Colors, fonts, spacing can be adjusted globally

### Auto-refresh Intervals
- Dashboard: 30 seconds (default)
- Jobs page: 30 seconds (default)
- Nodes page: 30 seconds (default)

Modify the refresh interval in each page component's `useJobs()`, `useNodes()`, etc. hooks.

### Add New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Add routes in `src/App.tsx`
4. Add API methods in `src/services/pbsApi.ts`
5. Create hooks if needed in `src/hooks/`

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, modify the port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change to any available port
}
```

### API Connection Issues
Check:
1. Backend server is running
2. Proxy configuration in `vite.config.ts` is correct
3. CORS is properly configured on the backend
4. Network connectivity to PBS server

### Build Errors
Run:
```bash
npm install
npm run build
```

If errors persist, delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Getting Help

- Check the main README.md for detailed documentation
- Review the code comments in source files
- PBS Pro documentation: https://www.pbspro.org/

Happy coding!
