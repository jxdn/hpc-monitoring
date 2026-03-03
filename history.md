# Development History

## 2026-03-03 Session

### Vanda Dashboard CPU Occupation Rate
- **File:** `backend/src/services/prometheusService.js`
  - Added CPU metrics query to `getClusterStats()`: `pbs_node_cpus_total` and `pbs_node_cpus_used`
  - Returns `totalCpus`, `usedCpus`, `cpuUtilization` in cluster stats response

- **File:** `src/pages/Vanda.tsx`
  - Added CPU occupation gauge alongside GPU occupation gauge
  - Derived `cpuOccupationRate` from `stats.cpuUtilization`

### Monthly Resource Hours Charts

#### Backend Changes
- **File:** `backend/src/services/xdmodService.js`
  - Modified `getMonthlyGPUHours()` SQL query to include `cpu_time` calculation
  - Returns both `gpuHours` and `cpuHours` per month

#### Vanda Dashboard
- **File:** `src/pages/Vanda.tsx`
  - Split into 2 separate cards: "GPU Hours: Total (Last 2 Years)" and "CPU Hours: Total (Last 2 Years)"
  - Each card has full-width bar chart with 400px height
  - Y-axis normalization: `< 1k` → as-is, `>= 1k` → `k`, `>= 1M` → `M`

#### Hopper Dashboard
- **File:** `src/pages/ClusterDashboard.tsx`
  - Same changes as Vanda: 2 separate full-width cards for GPU and CPU hours
  - Same Y-axis normalization logic

### Queue Status - Remove Wait Time
- **File:** `src/components/dashboard/QueueDetailsCard.tsx`
  - Added optional `showWaitTime` prop (default: `true`)
  - Conditionally renders wait time badge based on prop

- **File:** `src/pages/Vanda.tsx`
  - Pass `showWaitTime={false}` to QueueDetailsCard
  - Removed `getLatestWaitTimeForQueue()` function and related wait time data

- **File:** `src/pages/ClusterDashboard.tsx`
  - Pass `showWaitTime={false}` to QueueDetailsCard
  - Removed `getLatestWaitTimeForQueue()` function

### Vanda Queue List Update
- **File:** `src/pages/Vanda.tsx`
  - Removed `auto` and `auto_free` from `VANDA_KNOWN_QUEUES`
  - Now shows 10 queues instead of 12

### CPU Usage by User (Vanda Only)

#### Backend Changes
- **File:** `backend/src/services/xdmodService.js`
  - Added `getCPUUsageByUser(days, resource)` function
  - Queries `processor_count` and `cpu_time` from `job_tasks` table
  - Returns: `username`, `numJobs`, `totalCpusUsed`, `avgCpusPerJob`, `totalCpuHours`, `avgCpuHoursPerJob`

- **File:** `backend/src/services/cacheService.js`
  - Added cache keys: `vanda-cpu-usage-by-user-1d`, `vanda-cpu-usage-by-user-7d`, `vanda-cpu-usage-by-user-30d`

- **File:** `backend/src/server.js`
  - Added endpoint: `GET /api/vanda/analytics/cpu-usage-by-user?timeRange=7d`

#### Frontend Changes
- **File:** `src/components/dashboard/CPUUsageTable.tsx` (new)
  - Table component with columns: Rank, Username, Jobs, Total CPUs, Avg CPUs/Job, Total CPU Hours, Avg CPU Hours/Job
  - Green color theme to distinguish from GPU table

- **File:** `src/components/dashboard/CPUUsageTable.css` (new)
  - Styling matching GPUUsageTable but with green accent color (#10b981)

- **File:** `src/services/vandaApi.ts`
  - Added `getCPUUsageByUser(timeRange)` method

- **File:** `src/pages/Vanda.tsx`
  - Imported `CPUUsageTable` component
  - Added state: `cpuUsageData1d`, `cpuUsageData7d`, `cpuUsageData30d`, `cpuUsageTimeRange`
  - Added `useEffect` to fetch CPU usage data
  - Added helper functions: `getCpuUsageData()`, `getCpuUsageTimeRangeLabel()`
  - Added new Card with CPUUsageTable below GPU Usage card

---

## Files Modified Summary

### Backend
- `backend/src/services/prometheusService.js` - CPU metrics in cluster stats
- `backend/src/services/xdmodService.js` - CPU hours in monthly data, new CPU usage function
- `backend/src/services/cacheService.js` - CPU usage cache keys for Vanda
- `backend/src/server.js` - CPU usage API endpoint for Vanda

### Frontend
- `src/pages/Vanda.tsx` - CPU gauge, split GPU/CPU hours charts, CPU usage table, queue list update
- `src/pages/ClusterDashboard.tsx` - Split GPU/CPU hours charts, remove wait time
- `src/components/dashboard/QueueDetailsCard.tsx` - Optional wait time display
- `src/components/dashboard/CPUUsageTable.tsx` (new) - CPU usage table component
- `src/components/dashboard/CPUUsageTable.css` (new) - CPU usage table styles
- `src/services/vandaApi.ts` - CPU usage API method
