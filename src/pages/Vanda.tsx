import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { vandaApi } from '../services/vandaApi';
import GaugeCard from '../components/dashboard/GaugeCard';
import NodeHeatmap from '../components/dashboard/NodeHeatmap';
import Card from '../components/dashboard/Card';
import GPUUsageTable from '../components/dashboard/GPUUsageTable';
import CPUUsageTable from '../components/dashboard/CPUUsageTable';
import WaitTimeTableWithPagination from '../components/dashboard/WaitTimeTableWithPagination';
import QueueDetailsCard from '../components/dashboard/QueueDetailsCard';
import './ClusterDashboard.css';

// ---------------------------------------------------------------------------
// Vanda cluster constants (discovered from VictoriaMetrics)
// ---------------------------------------------------------------------------

// GPU nodes: gn-a40-001..067, gn-a40-072..102 (gaps 068-071 not in cluster)
// 98 nodes × 2 A40 GPUs = 196 total GPUs
const VANDA_GPU_NODE_NAMES: string[] = [
  ...Array.from({ length: 67 }, (_, i) => {
    const n = i + 1;
    return `gn-a40-${String(n).padStart(3, '0')}`;
  }),
  ...Array.from({ length: 31 }, (_, i) => {
    const n = i + 72;
    return `gn-a40-${String(n).padStart(3, '0')}`;
  }),
];

// All 10 queues on Vanda (excluding auto and auto_free)
const VANDA_KNOWN_QUEUES = [
  'batch_cpu', 'batch_gpu',
  'cpu_parallel', 'cpu_serial', 'gpu', 'gpu_amd',
  'interactive_cpu', 'interactive_gpu', 'large_mem', 'workq',
];

// GPU-bearing queues (used for wait time display)
const VANDA_GPU_QUEUE_LIST = [
  { name: 'batch_gpu', type: 'GPU' },
  { name: 'gpu', type: 'GPU' },
  { name: 'gpu_amd', type: 'GPU' },
  { name: 'interactive_gpu', type: 'GPU' },
];

// ---------------------------------------------------------------------------

const VandaDashboard: React.FC = () => {
  // Real-time state (from VictoriaMetrics via vandaApi)
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);
  const [jobs, setJobs] = useState<any>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [gpuOccupationHistory, setGpuOccupationHistory] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // XDMoD state
  const [jobStatsLast7Days, setJobStatsLast7Days] = useState<any[]>([]);
  const [jobStatsLoading, setJobStatsLoading] = useState(true);
  const [jobStatsError, setJobStatsError] = useState<string | null>(null);
  const [jobStatsTimeRange, setJobStatsTimeRange] = useState<'1d' | '7d' | '30d'>('7d');

  const [monthlyGPUHours, setMonthlyGPUHours] = useState<any[]>([]);
  const [monthlyGPUHoursLoading, setMonthlyGPUHoursLoading] = useState(true);
  const [monthlyGPUHoursError, setMonthlyGPUHoursError] = useState<string | null>(null);

  const [gpuUsageData1d, setGpuUsageData1d] = useState<any[]>([]);
  const [gpuUsageData7d, setGpuUsageData7d] = useState<any[]>([]);
  const [gpuUsageData30d, setGpuUsageData30d] = useState<any[]>([]);
  const [gpuUsageTimeRange, setGpuUsageTimeRange] = useState<'1d' | '7d' | '30d'>('7d');

  const [cpuUsageData1d, setCpuUsageData1d] = useState<any[]>([]);
  const [cpuUsageData7d, setCpuUsageData7d] = useState<any[]>([]);
  const [cpuUsageData30d, setCpuUsageData30d] = useState<any[]>([]);
  const [cpuUsageTimeRange, setCpuUsageTimeRange] = useState<'1d' | '7d' | '30d'>('7d');

  // Wait time (AISG slot → GPU queues for Vanda)
  const [waitTime1d, setWaitTime1d] = useState<any[]>([]);
  const [waitTime7d, setWaitTime7d] = useState<any[]>([]);
  const [waitTime30d, setWaitTime30d] = useState<any[]>([]);
  const [summaryTimeRange, setSummaryTimeRange] = useState<string>('Yesterday');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [mergedWaitTimeTimeRange, setMergedWaitTimeTimeRange] = useState<'1d' | '7d' | '30d'>('7d');

  // -------------------------------------------------------------------------
  // Clock
  // -------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSGT = (date: Date) => {
    return new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(date);
  };

  // -------------------------------------------------------------------------
  // Real-time data fetches
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        setNodesLoading(true);
        const data = await vandaApi.getNodes();
        setNodes(data);
      } catch (e) {
        console.error('Error fetching Vanda nodes:', e);
      } finally {
        setNodesLoading(false);
      }
    };
    fetchNodes();
    const interval = setInterval(fetchNodes, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        const data = await vandaApi.getJobs();
        setJobs(data);
      } catch (e) {
        console.error('Error fetching Vanda jobs:', e);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await vandaApi.getClusterStats();
        setStats(data);
      } catch (e) {
        console.error('Error fetching Vanda cluster stats:', e);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJobHistory = async () => {
      try {
        const data = await vandaApi.getJobStats(timeRange as '30d' | '1h' | '24h' | '7d');
        setJobHistory(data);
      } catch (e) {
        console.error('Error fetching Vanda job history:', e);
      }
    };
    fetchJobHistory();
    const interval = setInterval(fetchJobHistory, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  useEffect(() => {
    const fetchGPUOccupation = async () => {
      try {
        const data = await vandaApi.getGPUOccupation(timeRange as '24h' | '7d' | '30d');
        setGpuOccupationHistory(data);
      } catch (e) {
        console.error('Error fetching Vanda GPU occupation history:', e);
      }
    };
    fetchGPUOccupation();
    const interval = setInterval(fetchGPUOccupation, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // -------------------------------------------------------------------------
  // XDMoD data fetches
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchJobStats = async () => {
      try {
        setJobStatsLoading(true);
        const data = await vandaApi.getJobStatsLast7Days(jobStatsTimeRange);
        setJobStatsLast7Days(data);
        setJobStatsError(data.length === 0 ? 'No job statistics data available' : null);
      } catch (e) {
        setJobStatsError('Failed to fetch job statistics');
      } finally {
        setJobStatsLoading(false);
      }
    };
    fetchJobStats();
    const interval = setInterval(fetchJobStats, 60000);
    return () => clearInterval(interval);
  }, [jobStatsTimeRange]);

  useEffect(() => {
    const fetchMonthlyGPUHours = async () => {
      try {
        setMonthlyGPUHoursLoading(true);
        const data = await vandaApi.getMonthlyGPUHours();
        setMonthlyGPUHours(data);
        setMonthlyGPUHoursError(data.length === 0 ? 'No GPU hours data available' : null);
      } catch (e) {
        setMonthlyGPUHoursError('Failed to fetch monthly GPU hours');
      } finally {
        setMonthlyGPUHoursLoading(false);
      }
    };
    fetchMonthlyGPUHours();
    const interval = setInterval(fetchMonthlyGPUHours, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchGPUUsage = async () => {
      try {
        const [d1d, d7d, d30d] = await Promise.all([
          vandaApi.getGPUUsageByUser('1d'),
          vandaApi.getGPUUsageByUser('7d'),
          vandaApi.getGPUUsageByUser('30d'),
        ]);
        setGpuUsageData1d(d1d);
        setGpuUsageData7d(d7d);
        setGpuUsageData30d(d30d);
      } catch (e) {
        console.error('Error fetching Vanda GPU usage data:', e);
      }
    };
    fetchGPUUsage();
    const interval = setInterval(fetchGPUUsage, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCPUUsage = async () => {
      try {
        const [c1d, c7d, c30d] = await Promise.all([
          vandaApi.getCPUUsageByUser('1d'),
          vandaApi.getCPUUsageByUser('7d'),
          vandaApi.getCPUUsageByUser('30d'),
        ]);
        setCpuUsageData1d(c1d);
        setCpuUsageData7d(c7d);
        setCpuUsageData30d(c30d);
      } catch (e) {
        console.error('Error fetching Vanda CPU usage data:', e);
      }
    };
    fetchCPUUsage();
    const interval = setInterval(fetchCPUUsage, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWaitTime = async () => {
      try {
        setSummaryLoading(true);
        const [w1d, w7d, w30d] = await Promise.all([
          vandaApi.getAISGWaitTime('1d'),
          vandaApi.getAISGWaitTime('7d'),
          vandaApi.getAISGWaitTime('30d'),
        ]);
        setWaitTime1d(w1d);
        setWaitTime7d(w7d);
        setWaitTime30d(w30d);
      } catch (e) {
        console.error('Error fetching Vanda wait time:', e);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchWaitTime();
    const interval = setInterval(fetchWaitTime, 120000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------------------
  // Helper functions
  // -------------------------------------------------------------------------
  const getGpuUsageData = () => {
    if (gpuUsageTimeRange === '1d') return gpuUsageData1d;
    if (gpuUsageTimeRange === '30d') return gpuUsageData30d;
    return gpuUsageData7d;
  };

  const getGpuUsageTimeRangeLabel = () => {
    if (gpuUsageTimeRange === '1d') return 'Yesterday';
    if (gpuUsageTimeRange === '30d') return 'Last 30 Days';
    return 'Last 7 Days';
  };

  const getCpuUsageData = () => {
    if (cpuUsageTimeRange === '1d') return cpuUsageData1d;
    if (cpuUsageTimeRange === '30d') return cpuUsageData30d;
    return cpuUsageData7d;
  };

  const getCpuUsageTimeRangeLabel = () => {
    if (cpuUsageTimeRange === '1d') return 'Yesterday';
    if (cpuUsageTimeRange === '30d') return 'Last 30 Days';
    return 'Last 7 Days';
  };

  const getJobStatsTimeRangeLabel = () => {
    if (jobStatsTimeRange === '1d') return 'Yesterday';
    if (jobStatsTimeRange === '30d') return 'Last 30 Days';
    return 'Last 7 Days';
  };

  const getCurrentWaitData = () => {
    if (summaryTimeRange === 'Yesterday') return waitTime1d;
    if (summaryTimeRange === '30 Days') return waitTime30d;
    return waitTime7d;
  };

  const getMergedWaitTimeData = () => {
    const data = mergedWaitTimeTimeRange === '1d' ? waitTime1d
      : mergedWaitTimeTimeRange === '30d' ? waitTime30d
      : waitTime7d;
    return data.map((item: any) => ({ ...item, queueType: 'GPU Queue' }));
  };

  const getMergedWaitTimeTimeRangeLabel = () => {
    if (mergedWaitTimeTimeRange === '1d') return 'Yesterday';
    if (mergedWaitTimeTimeRange === '30d') return 'Last 30 Days';
    return 'Last 7 Days';
  };

  const getWaitTimeStatus = (minutes: number): 'good' | 'warning' | 'danger' => {
    if (minutes === 0) return 'good';
    if (minutes < 120) return 'good';
    if (minutes < 480) return 'warning';
    return 'danger';
  };

  const getWaitTimeStatusLabel = (status: string) => {
    if (status === 'good') return 'Low';
    if (status === 'warning') return 'Medium';
    if (status === 'danger') return 'High';
    return 'Unknown';
  };

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getDaysCount = () => {
    if (summaryTimeRange === 'Yesterday') return 1;
    if (summaryTimeRange === '30 Days') return 30;
    return 7;
  };

  const getWaitTimeSummary = () => {
    const data = getCurrentWaitData();
    if (data.length === 0) return null;

    const daysCount = getDaysCount();
    const queueMap = new Map<string, any>();

    data.forEach((item: any) => {
      const key = item.queueName;
      if (!queueMap.has(key)) {
        queueMap.set(key, { queueName: item.queueName, totalWaitTime: 0, totalJobs: 0, totalGpuHours: 0, entries: 0 });
      }
      const q = queueMap.get(key);
      q.totalWaitTime += parseFloat(item.avgWaitMinutes || 0);
      q.totalJobs += (item.numJobs || 0);
      q.totalGpuHours += (item.totalGpuHours || 0);
      q.entries++;
    });

    const existingQueues = Array.from(queueMap.values());

    const queues = VANDA_GPU_QUEUE_LIST.map(fq => {
      const existing = existingQueues.find(q => q.queueName === fq.name);
      if (existing) {
        return {
          queueType: 'GPU Queue',
          queueName: existing.queueName,
          averageWaitTime: (existing.totalWaitTime / daysCount).toFixed(2),
          formattedWaitTime: formatWaitTime(existing.totalWaitTime / daysCount),
          status: getWaitTimeStatus(existing.totalWaitTime / daysCount),
          numJobs: existing.totalJobs,
          totalGpuHours: existing.totalGpuHours.toFixed(2),
        };
      }
      return {
        queueType: 'GPU Queue',
        queueName: fq.name,
        averageWaitTime: '0',
        formattedWaitTime: '0min',
        status: 'good' as const,
        numJobs: 0,
        totalGpuHours: '0',
      };
    });

    const overallAvg = queues.length > 0
      ? queues.reduce((sum, q) => sum + parseFloat(q.averageWaitTime), 0) / queues.length
      : 0;

    const totalJobs = queues.reduce((sum, q) => sum + q.numJobs, 0);
    const totalGpuHours = queues.reduce((sum, q) => sum + parseFloat(q.totalGpuHours), 0);

    return {
      overallAvg: formatWaitTime(overallAvg),
      totalJobs,
      totalGpuHours: totalGpuHours.toFixed(2),
      status: getWaitTimeStatus(overallAvg),
      queues,
    };
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  if (nodesLoading || jobsLoading || statsLoading) {
    return <div className="loading">Loading Vanda cluster dashboard...</div>;
  }

  if (!stats || !jobs) {
    return <div className="error">No data available</div>;
  }

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const gpuOccupationRate = stats.gpuUtilization ?? 0;
  const cpuOccupationRate = stats.cpuUtilization ?? 0;
  const topUsers = jobs.byUser?.slice(0, 5) ?? [];
  const topQueues = (jobs.byQueue ?? []).filter((q: any) => q.count > 0).slice(0, 5);

  // Queue details — all 10 known Vanda queues
  const queueDetails = VANDA_KNOWN_QUEUES.map(queueName => {
    const queueData = jobs.byQueue?.find((q: any) => q.queue === queueName);
    const running = queueData?.running || 0;
    const queued = queueData?.queued || 0;
    return {
      name: queueName,
      running,
      queued,
      total: running + queued,
      queueType: undefined,
    };
  });

  // Heatmap data
  const nodeCpuUsageData = nodes.map(n => ({ name: n.name, value: n.usedCpus, maxValue: n.totalCpus }));
  const gpuNodes = nodes.filter(n => VANDA_GPU_NODE_NAMES.includes(n.name));
  const nodeGPUUsageData = gpuNodes.map(n => ({ name: n.name, value: n.usedGpus, maxValue: n.totalGpus }));
  const nodeGPUAvailData = gpuNodes.map(n => ({ name: n.name, value: n.totalGpus - n.usedGpus, maxValue: n.totalGpus }));

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="cluster-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Vanda Cluster Overview</h1>
          <div className="refresh-indicator">
            <span className="refresh-icon">↻</span>
            <span className="refresh-text">Auto-refresh every 2 minutes</span>
          </div>
        </div>
        <div className="dashboard-time">
          <span className="time-label">Singapore Time (SGT)</span>
          <span className="time-value">{formatSGT(currentTime)}</span>
        </div>
      </div>

      {/* CPU and GPU Occupation gauges for Vanda */}
      <div className="gauge-grid">
        <GaugeCard title="CPU Occupation Rate" value={cpuOccupationRate} />
        <GaugeCard title="GPU Occupation Rate (A40)" value={gpuOccupationRate} />
      </div>

      {/* Queue Details */}
      <QueueDetailsCard queues={queueDetails} title="Queue Status - Real-time" showWaitTime={false} />

      {/* Monthly GPU Hours Chart */}
      <Card title="GPU Hours: Total (Last 2 Years)" className="gpu-hours-card">
        {monthlyGPUHoursLoading ? (
          <div className="loading">Loading monthly GPU hours...</div>
        ) : monthlyGPUHoursError ? (
          <div className="error">{monthlyGPUHoursError}</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyGPUHours.map(item => ({ 
              month: item.month, 
              GPU: parseFloat(item.gpuHours) || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => {
                  const num = parseFloat(value) || 0;
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                  return num.toString();
                }}
                label={{ value: 'GPU Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: '#f8fafc' }}
                formatter={(value: any) => {
                  const numVal = parseFloat(value) || 0;
                  if (numVal >= 1000000) return [`${(numVal / 1000000).toFixed(1)}M`, 'GPU Hours'];
                  if (numVal >= 1000) return [`${(numVal / 1000).toFixed(1)}k`, 'GPU Hours'];
                  return [numVal.toString(), 'GPU Hours'];
                }}
              />
              <Bar dataKey="GPU" fill="#3b82f6" name="GPU Hours" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Monthly CPU Hours Chart */}
      <Card title="CPU Hours: Total (Last 2 Years)" className="cpu-hours-card">
        {monthlyGPUHoursLoading ? (
          <div className="loading">Loading monthly CPU hours...</div>
        ) : monthlyGPUHoursError ? (
          <div className="error">{monthlyGPUHoursError}</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyGPUHours.map(item => ({ 
              month: item.month, 
              CPU: parseFloat(item.cpuHours) || 0
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => {
                  const num = parseFloat(value) || 0;
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                  return num.toString();
                }}
                label={{ value: 'CPU Hours', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: '#f8fafc' }}
                formatter={(value: any) => {
                  const numVal = parseFloat(value) || 0;
                  if (numVal >= 1000000) return [`${(numVal / 1000000).toFixed(1)}M`, 'CPU Hours'];
                  if (numVal >= 1000) return [`${(numVal / 1000).toFixed(1)}k`, 'CPU Hours'];
                  return [numVal.toString(), 'CPU Hours'];
                }}
              />
              <Bar dataKey="CPU" fill="#10b981" name="CPU Hours" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Stats Row */}
      <div className="stats-row">
        <Card title="Queue - Statistic" compact>
          <div className="queue-stats">
            {topQueues.map((q: any) => (
              <div key={q.queue} className="queue-stat-item">
                <span className="queue-name">{q.queue}</span>
                <span className="queue-count">{q.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Job Status" compact>
          <div className="job-stats">
            <div className="stat-item"><span className="stat-name">Total</span><span className="stat-count">{jobs.summary.total}</span></div>
            <div className="stat-item"><span className="stat-name">Running (R)</span><span className="stat-count running">{jobs.summary.running}</span></div>
            <div className="stat-item"><span className="stat-name">Queued (Q)</span><span className="stat-count queued">{jobs.summary.queued}</span></div>
            <div className="stat-item"><span className="stat-name">Hold (H)</span><span className="stat-count held">{jobs.summary.hold}</span></div>
          </div>
        </Card>
        <Card title="USER and Total jobs" compact>
          <div className="user-stats">
            {topUsers.map((u: any) => (
              <div key={u.user} className="user-stat-item">
                <span className="user-name">{u.user}</span>
                <span className="user-count">{u.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Node Status" compact>
          <div className="node-stats">
            <div className="stat-item"><span className="stat-name">Available</span><span className="stat-count free">{stats.freeNodes}</span></div>
            <div className="stat-item"><span className="stat-name">Busy</span><span className="stat-count busy">{stats.busyNodes}</span></div>
            <div className="stat-item"><span className="stat-name">Down</span><span className="stat-count down">{stats.downNodes}</span></div>
          </div>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="section-header">
        <h2>Real-time Monitoring</h2>
        <div className="time-range-selector">
          <button className={`time-range-btn ${timeRange === '24h' ? 'active' : ''}`} onClick={() => setTimeRange('24h')}>1 Day</button>
          <button className={`time-range-btn ${timeRange === '7d' ? 'active' : ''}`} onClick={() => setTimeRange('7d')}>7 Days</button>
          <button className={`time-range-btn ${timeRange === '30d' ? 'active' : ''}`} onClick={() => setTimeRange('30d')}>30 Days</button>
        </div>
      </div>

      <Card title="Total Running Jobs">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={jobHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fill: '#64748b' }} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: '#f8fafc' }} />
            <Legend />
            <Line type="monotone" dataKey="runningJobs" stroke="#3b82f6" strokeWidth={2.5} name="Running" dot={false} />
            <Line type="monotone" dataKey="queuedJobs" stroke="#f59e0b" strokeWidth={2.5} name="Queued" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="GPU Occupation Rate (A40)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gpuOccupationHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fill: '#64748b' }} />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b' }}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              label={{ value: 'Occupation Rate (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: '#f8fafc' }}
              formatter={(value: any, name: string) => [Number(value).toFixed(1), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2.5} name="Overall" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Historical Data */}
      <div className="section-header">
        <h2>Historical Data (XDMoD)</h2>
      </div>

      <Card>
        <div className="card-header job-stats-card-header">
          <span className="card-title">Job Completion History ({getJobStatsTimeRangeLabel()})</span>
          <div className="time-range-selector">
            <button className={`time-range-btn ${jobStatsTimeRange === '1d' ? 'active' : ''}`} onClick={() => setJobStatsTimeRange('1d')}>Yesterday</button>
            <button className={`time-range-btn ${jobStatsTimeRange === '7d' ? 'active' : ''}`} onClick={() => setJobStatsTimeRange('7d')}>Last 7 Days</button>
            <button className={`time-range-btn ${jobStatsTimeRange === '30d' ? 'active' : ''}`} onClick={() => setJobStatsTimeRange('30d')}>Last 30 Days</button>
          </div>
        </div>
        {jobStatsLoading ? (
          <div className="loading">Loading job statistics...</div>
        ) : jobStatsError ? (
          <div className="error">{jobStatsError}</div>
        ) : jobStatsLast7Days.length === 0 ? (
          <div className="data-table-empty">No job completion data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobStatsLast7Days.map(item => ({
              date: item.jobDate ? new Date(item.jobDate).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }) : 'N/A',
              numJobs: item.numJobs || 0,
              totalGpuHours: parseFloat(item.totalGpuHours || 0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b' }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b' }}
                label={{ value: 'Number of Jobs', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fill: '#64748b' }}
                label={{ value: 'GPU Hours', angle: 90, position: 'insideRight', fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', color: '#f8fafc' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="numJobs" stroke="#3b82f6" strokeWidth={2.5} name="Jobs Completed" dot={{ r: 3, fill: '#3b82f6' }} />
              <Line yAxisId="right" type="monotone" dataKey="totalGpuHours" stroke="#10b981" strokeWidth={2.5} name="Total GPU Hours" dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* GPU Queue Wait Time Summary */}
      <Card className="wait-time-title-card">
        <div className="card-header wait-time-card-header">
          <span className="card-title">Average Wait Time per Queue ({summaryTimeRange})</span>
          <div className="time-range-selector">
            <button className={`time-range-btn ${summaryTimeRange === 'Yesterday' ? 'active' : ''}`} onClick={() => setSummaryTimeRange('Yesterday')}>Yesterday</button>
            <button className={`time-range-btn ${summaryTimeRange === '7 Days' ? 'active' : ''}`} onClick={() => setSummaryTimeRange('7 Days')}>Last 7 Days</button>
            <button className={`time-range-btn ${summaryTimeRange === '30 Days' ? 'active' : ''}`} onClick={() => setSummaryTimeRange('30 Days')}>Last 30 Days</button>
          </div>
        </div>
        {summaryLoading ? (
          <div className="loading">Loading summaries...</div>
        ) : getCurrentWaitData().length === 0 ? (
          <div className="data-table-empty">No queue data available for this time range</div>
        ) : (
          <>
            <div className="wait-time-summary">
              {(() => {
                const summary = getWaitTimeSummary();
                if (!summary) return null;
                return (
                  <div className="wait-time-summary-grid">
                    <div className="summary-card">
                      <div className="summary-label">Overall Average</div>
                      <div className={`summary-value summary-value-${summary.status}`}>{summary.overallAvg}</div>
                      <div className={`summary-status status-badge-${summary.status}`}>{getWaitTimeStatusLabel(summary.status)}</div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">Total Jobs</div>
                      <div className="summary-value">{summary.totalJobs}</div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">Total GPU Hours</div>
                      <div className="summary-value">{summary.totalGpuHours}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="queue-details-grid">
              {(() => {
                const summary = getWaitTimeSummary();
                if (!summary?.queues?.length) return null;
                return summary.queues.map((queue, index) => (
                  <div key={`${queue.queueName}-${index}`} className={`queue-box queue-box-${queue.status}`}>
                    <div className="queue-box-header">
                      <div className="queue-box-name">{queue.queueName}</div>
                      <div className="queue-box-type">{queue.queueType}</div>
                    </div>
                    <div className="queue-box-content">
                      <div className="queue-box-wait-time">{queue.formattedWaitTime}</div>
                      <span className={`status-badge status-badge-${queue.status}`}>{getWaitTimeStatusLabel(queue.status)}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
      </Card>

      {/* Additional Tables */}
      <div className="centered-tables">
        <Card>
          <div className="card-header merged-wait-time-header">
            <span className="card-title">Wait Time ({getMergedWaitTimeTimeRangeLabel()})</span>
            <div className="time-range-selector">
              <button className={`time-range-btn ${mergedWaitTimeTimeRange === '1d' ? 'active' : ''}`} onClick={() => setMergedWaitTimeTimeRange('1d')}>Yesterday</button>
              <button className={`time-range-btn ${mergedWaitTimeTimeRange === '7d' ? 'active' : ''}`} onClick={() => setMergedWaitTimeTimeRange('7d')}>Last 7 Days</button>
              <button className={`time-range-btn ${mergedWaitTimeTimeRange === '30d' ? 'active' : ''}`} onClick={() => setMergedWaitTimeTimeRange('30d')}>Last 30 Days</button>
            </div>
          </div>
          <WaitTimeTableWithPagination data={getMergedWaitTimeData()} loading={false} />
        </Card>

        <Card>
          <div className="card-header gpu-usage-card-header">
            <span className="card-title">GPU Usage by User ({getGpuUsageTimeRangeLabel()})</span>
            <div className="time-range-selector">
              <button className={`time-range-btn ${gpuUsageTimeRange === '1d' ? 'active' : ''}`} onClick={() => setGpuUsageTimeRange('1d')}>Yesterday</button>
              <button className={`time-range-btn ${gpuUsageTimeRange === '7d' ? 'active' : ''}`} onClick={() => setGpuUsageTimeRange('7d')}>Last 7 Days</button>
              <button className={`time-range-btn ${gpuUsageTimeRange === '30d' ? 'active' : ''}`} onClick={() => setGpuUsageTimeRange('30d')}>Last 30 Days</button>
            </div>
          </div>
          <GPUUsageTable data={getGpuUsageData()} loading={false} />
        </Card>

        <Card>
          <div className="card-header gpu-usage-card-header">
            <span className="card-title">CPU Usage by User ({getCpuUsageTimeRangeLabel()})</span>
            <div className="time-range-selector">
              <button className={`time-range-btn ${cpuUsageTimeRange === '1d' ? 'active' : ''}`} onClick={() => setCpuUsageTimeRange('1d')}>Yesterday</button>
              <button className={`time-range-btn ${cpuUsageTimeRange === '7d' ? 'active' : ''}`} onClick={() => setCpuUsageTimeRange('7d')}>Last 7 Days</button>
              <button className={`time-range-btn ${cpuUsageTimeRange === '30d' ? 'active' : ''}`} onClick={() => setCpuUsageTimeRange('30d')}>Last 30 Days</button>
            </div>
          </div>
          <CPUUsageTable data={getCpuUsageData()} loading={false} />
        </Card>
      </div>

      {/* Node Heatmaps */}
      <h2>CPU Usage per Node</h2>
      <NodeHeatmap title="" nodes={nodeCpuUsageData} valueLabel="CPUs" />

      <h2>GPU USAGE HEATMAP - REALTIME (A40 nodes)</h2>
      <NodeHeatmap title="" nodes={nodeGPUUsageData} valueLabel="GPUs" />

      <h2>GPU AVAILABILITY - REALTIME (A40 nodes)</h2>
      <NodeHeatmap title="" nodes={nodeGPUAvailData} valueLabel="GPUs Available" isAvailability={true} />
    </div>
  );
};

export default VandaDashboard;
