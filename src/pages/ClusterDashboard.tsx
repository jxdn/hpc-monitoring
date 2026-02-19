import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pbsApi } from '../services/pbsApi';
import { useNodes, useJobs, useClusterStats } from '../hooks/usePbsData';
import GaugeCard from '../components/dashboard/GaugeCard';
import NodeHeatmap from '../components/dashboard/NodeHeatmap';
import Card from '../components/dashboard/Card';
import GPUUsageTable from '../components/dashboard/GPUUsageTable';
import WaitTimeTableWithPagination from '../components/dashboard/WaitTimeTableWithPagination';
import './ClusterDashboard.css';

const ClusterDashboard: React.FC = () => {
  const { nodes, loading: nodesLoading } = useNodes(60000);
  const { jobs, loading: jobsLoading } = useJobs(60000);
  const { stats, loading: statsLoading } = useClusterStats(60000);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [gpuOccupationHistory, setGpuOccupationHistory] = useState<any[]>([]);
  const [jobStatsLast7Days, setJobStatsLast7Days] = useState<any[]>([]);
  const [jobStatsLoading, setJobStatsLoading] = useState<boolean>(true);
  const [jobStatsError, setJobStatsError] = useState<string | null>(null);
  const [monthlyGPUHours, setMonthlyGPUHours] = useState<any[]>([]);
  const [monthlyGPUHoursLoading, setMonthlyGPUHoursLoading] = useState<boolean>(true);
  const [monthlyGPUHoursError, setMonthlyGPUHoursError] = useState<string | null>(null);

  // Separate state for all time ranges for static summary
  const [aisgWaitTime1d, setAisgWaitTime1d] = useState<any[]>([]);
  const [aisgWaitTime7d, setAisgWaitTime7d] = useState<any[]>([]);
  const [aisgWaitTime30d, setAisgWaitTime30d] = useState<any[]>([]);
  const [nusitWaitTime1d, setNusitWaitTime1d] = useState<any[]>([]);
  const [nusitWaitTime7d, setNusitWaitTime7d] = useState<any[]>([]);
  const [nusitWaitTime30d, setNusitWaitTime30d] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [timeRange, setTimeRange] = useState<string>('30d');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
const [summaryTimeRange, setSummaryTimeRange] = useState<string>('Yesterday');
const [gpuUsageTimeRange, setGpuUsageTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [jobStatsTimeRange, setJobStatsTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [gpuUsageData1d, setGpuUsageData1d] = useState<any[]>([]);
  const [gpuUsageData7d, setGpuUsageData7d] = useState<any[]>([]);
  const [gpuUsageData30d, setGpuUsageData30d] = useState<any[]>([]);
  const [mergedWaitTimeTimeRange, setMergedWaitTimeTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [mergedWaitTime1d, setMergedWaitTime1d] = useState<any[]>([]);
  const [mergedWaitTime7d, setMergedWaitTime7d] = useState<any[]>([]);
  const [mergedWaitTime30d, setMergedWaitTime30d] = useState<any[]>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time in Singapore Time (SGT, UTC+8)
  const formatSGT = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-SG', options).format(date);
  };

  useEffect(() => {
    const fetchJobHistory = async () => {
      try {
        const data = await pbsApi.getJobStats(timeRange as '30d' | '1h' | '24h' | '7d');
        setJobHistory(data);
      } catch (error) {
        console.error('Error fetching job history:', error);
      }
    };

    fetchJobHistory();
    const interval = setInterval(fetchJobHistory, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  useEffect(() => {
    const fetchGPUOccupationHistory = async () => {
      try {
        const data = await pbsApi.getGPUOccupation(timeRange as '24h' | '7d' | '30d');
        setGpuOccupationHistory(data);
      } catch (error) {
        console.error('Error fetching GPU occupation history:', error);
      }
    };

    fetchGPUOccupationHistory();
    const interval = setInterval(fetchGPUOccupationHistory, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Fetch all GPU usage time ranges
  useEffect(() => {
    const fetchAllGPUUsageData = async () => {
      try {
        const [data1d, data7d, data30d] = await Promise.all([
          pbsApi.getGPUUsageByUser('1d'),
          pbsApi.getGPUUsageByUser('7d'),
          pbsApi.getGPUUsageByUser('30d'),
        ]);
        setGpuUsageData1d(data1d);
        setGpuUsageData7d(data7d);
        setGpuUsageData30d(data30d);
      } catch (error) {
        console.error('Error fetching GPU usage data:', error);
      }
    };

    fetchAllGPUUsageData();
    const interval = setInterval(fetchAllGPUUsageData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Get current GPU usage data based on selected time range
  const getGpuUsageData = () => {
    switch (gpuUsageTimeRange) {
      case '1d':
        return gpuUsageData1d;
      case '7d':
        return gpuUsageData7d;
      case '30d':
        return gpuUsageData30d;
      default:
        return gpuUsageData7d;
    }
  };

  const getGpuUsageTimeRangeLabel = () => {
    switch (gpuUsageTimeRange) {
      case '1d':
        return 'Yesterday';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return 'Last 7 Days';
    }
  };

  const getJobStatsTimeRangeLabel = () => {
    switch (jobStatsTimeRange) {
      case '1d':
        return 'Yesterday';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return 'Last 7 Days';
    }
  };

  // Merge wait time data helper
  const mergeWaitTimeData = (aisgData: any[], nusitData: any[]) => {
    return [
      ...aisgData.map(item => ({ ...item, queueType: 'AISG' })),
      ...nusitData.map(item => ({ ...item, queueType: 'NUS IT' }))
    ];
  };

  // Get merged wait time data based on selected time range
  const getMergedWaitTimeData = () => {
    switch (mergedWaitTimeTimeRange) {
      case '1d':
        return mergedWaitTime1d;
      case '7d':
        return mergedWaitTime7d;
      case '30d':
        return mergedWaitTime30d;
      default:
        return mergedWaitTime7d;
    }
  };

const getMergedWaitTimeTimeRangeLabel = () => {
    switch (mergedWaitTimeTimeRange) {
      case '1d':
        return 'Yesterday';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      default:
        return 'Last 7 Days';
    }
  };

  // Fetch all merged wait time data
  useEffect(() => {
    const fetchAllMergedWaitTimeData = async () => {
      try {
        const [aisg1d, aisg7d, aisg30d, nusit1d, nusit7d, nusit30d] = await Promise.all([
          pbsApi.getAISGWaitTime('1d'),
          pbsApi.getAISGWaitTime('7d'),
          pbsApi.getAISGWaitTime('30d'),
          pbsApi.getNUSITWaitTime('1d'),
          pbsApi.getNUSITWaitTime('7d'),
          pbsApi.getNUSITWaitTime('30d'),
        ]);

        setMergedWaitTime1d(mergeWaitTimeData(aisg1d, nusit1d));
        setMergedWaitTime7d(mergeWaitTimeData(aisg7d, nusit7d));
        setMergedWaitTime30d(mergeWaitTimeData(aisg30d, nusit30d));
      } catch (error) {
        console.error('Error fetching merged wait time data:', error);
      }
    };

    fetchAllMergedWaitTimeData();
    const interval = setInterval(fetchAllMergedWaitTimeData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Fetch monthly GPU hours
  useEffect(() => {
    const fetchMonthlyGPUHours = async () => {
      try {
        setMonthlyGPUHoursLoading(true);
        const data = await pbsApi.getMonthlyGPUHours();
        setMonthlyGPUHours(data);
        setMonthlyGPUHoursError(null);
        
        // Check if data has actual content
        if (!data || data.length === 0) {
          setMonthlyGPUHoursError('No GPU hours data available');
        }
      } catch (error) {
        console.error('Error fetching monthly GPU hours:', error);
        setMonthlyGPUHoursError('Failed to fetch monthly GPU hours');
        setMonthlyGPUHoursLoading(false);
      } finally {
        setMonthlyGPUHoursLoading(false);
      }
    };

    fetchMonthlyGPUHours();
    const interval = setInterval(fetchMonthlyGPUHours, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

// Fetch job statistics (7 days by default)
  useEffect(() => {
    const fetchJobStats = async () => {
      try {
        setJobStatsLoading(true);
        const data = await pbsApi.getJobStatsLast7Days(jobStatsTimeRange); // Get data for selected time range
        setJobStatsLast7Days(data);
        setJobStatsError(null);
        
        // Check if data has actual content
        if (!data || data.length === 0) {
          setJobStatsError('No job statistics data available');
        }
      } catch (error) {
        console.error('Error fetching job statistics:', error);
        setJobStatsError('Failed to fetch job statistics');
        setJobStatsLoading(false);
      } finally {
        setJobStatsLoading(false);
      }
    };
    
    fetchJobStats();
    const interval = setInterval(fetchJobStats, 60000); // Refresh every 1 minute
    return () => clearInterval(interval);
  }, [jobStatsTimeRange]);

  // Fetch all wait time summaries for Average Wait Time per Queue table
  useEffect(() => {
    const fetchAllWaitTimeSummaries = async () => {
      try {
        setSummaryLoading(true);

        // Fetch all time ranges for AISG and NUS IT
        const [aisg1d, aisg7d, aisg30d, nusit1d, nusit7d, nusit30d] = await Promise.all([
          pbsApi.getAISGWaitTime('1d'),
          pbsApi.getAISGWaitTime('7d'),
          pbsApi.getAISGWaitTime('30d'),
          pbsApi.getNUSITWaitTime('1d'),
          pbsApi.getNUSITWaitTime('7d'),
          pbsApi.getNUSITWaitTime('30d'),
        ]);

        setAisgWaitTime1d(aisg1d);
        setAisgWaitTime7d(aisg7d);
        setAisgWaitTime30d(aisg30d);
        setNusitWaitTime1d(nusit1d);
        setNusitWaitTime7d(nusit7d);
        setNusitWaitTime30d(nusit30d);
      } catch (error) {
        console.error('Error fetching wait time summaries:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchAllWaitTimeSummaries();
    const interval = setInterval(fetchAllWaitTimeSummaries, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Helper function to format wait time status label
  const getWaitTimeStatusLabel = (status: string) => {
    if (status === 'good') return 'Low';
    if (status === 'warning') return 'Medium';
    if (status === 'danger') return 'High';
    return 'Unknown';
  };

  // Helper function to calculate wait time status based on minutes
  const getWaitTimeStatus = (minutes: number): 'good' | 'warning' | 'danger' => {
    if (minutes === 0) return 'good';
    if (minutes < 120) return 'good';       // < 2 hours is good
    if (minutes < 480) return 'warning';    // < 8 hours is warning
    return 'danger';                     // >= 8 hours is danger
  };

  // Helper function to get data in table format
  const getAverageWaitTimeTableData = (aisgData: any[], nusitData: any[], timeRange: string) => {
    return [
      ...aisgData.map(item => ({
        ...item,
        queueType: 'AISG',
        timeRange: timeRange,
        queueName: item.queueName,
        averageWaitTime: item.avgWaitMinutes,
        numJobs: item.numJobs,
        totalGpuHours: item.totalGpuHours,
        avgGpuHoursPerJob: item.avgGpuHoursPerJob,
        status: getWaitTimeStatus(item.avgWaitMinutes)
      })),
      ...nusitData.map(item => ({
        ...item,
        queueType: 'NUS IT',
        timeRange: timeRange,
        queueName: item.queueName,
        averageWaitTime: item.avgWaitMinutes,
        numJobs: item.numJobs,
        totalGpuHours: item.totalGpuHours,
        avgGpuHoursPerJob: item.avgGpuHoursPerJob,
        status: getWaitTimeStatus(item.avgWaitMinutes)
      }))
    ];
  };

  // Combine all time range data into merged data based on selected time range
  const getCombinedWaitTimeTableData = () => {
    let allData: any[] = [];
    
    if (summaryTimeRange === 'Yesterday') {
      allData = getAverageWaitTimeTableData(aisgWaitTime1d, nusitWaitTime1d, 'Yesterday');
    } else if (summaryTimeRange === '7 Days') {
      allData = getAverageWaitTimeTableData(aisgWaitTime7d, nusitWaitTime7d, 'Last 7 Days');
    } else if (summaryTimeRange === '30 Days') {
      allData = getAverageWaitTimeTableData(aisgWaitTime30d, nusitWaitTime30d, 'Last 30 Days');
    }
    
    return allData;
  };

  // Calculate summary averages instead of showing detailed table
  const getWaitTimeSummary = () => {
    const data = getCombinedWaitTimeTableData();
    if (data.length === 0) return null;

    const overallAvg = data.reduce((sum: number, item: any) => 
      sum + (item.averageWaitTime === 'NA' ? 0 : parseFloat(item.averageWaitTime || 0)), 0
    ) / data.length;

    const aisgData = data.filter((item: any) => item.queueType === 'AISG');
    const aisgAvg = aisgData.length > 0 
      ? aisgData.reduce((sum: number, item: any) => 
          sum + (item.averageWaitTime === 'NA' ? 0 : parseFloat(item.averageWaitTime || 0)), 0
        ) / aisgData.length 
      : 0;

    const nusitData = data.filter((item: any) => item.queueType === 'NUS IT');
    const nusitAvg = nusitData.length > 0 
      ? nusitData.reduce((sum: number, item: any) => 
          sum + (item.averageWaitTime === 'NA' ? 0 : parseFloat(item.averageWaitTime || 0)), 0
        ) / nusitData.length 
      : 0;

    const totalJobs = data.reduce((sum: number, item: any) => sum + (item.numJobs || 0), 0);
    const totalGpuHours = data.reduce((sum: number, item: any) => 
      sum + (item.totalGpuHours || 0), 0
    );

    return {
      overallAvg: formatWaitTime(overallAvg),
      aisgAvg: formatWaitTime(aisgAvg),
      nusitAvg: formatWaitTime(nusitAvg),
      totalJobs,
      totalGpuHours: totalGpuHours.toFixed(2),
      status: getWaitTimeStatus(overallAvg),
      queues: data.map(item => ({
        queueType: item.queueType,
        queueName: item.queueName,
        averageWaitTime: item.averageWaitTime,
        formattedWaitTime: formatWaitTime(parseFloat(item.averageWaitTime || 0)),
        status: item.status,
        numJobs: item.numJobs || 0
      })).sort((a, b) => {
        // Sort by average wait time (longest first)
        const parseTime = (timeStr: string) => {
          if (timeStr === 'NA' || timeStr === undefined) return 0;
          return parseFloat(timeStr || '0');
        };
        return parseTime(b.averageWaitTime) - parseTime(a.averageWaitTime);
      })
    };
  };

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (nodesLoading || jobsLoading || statsLoading) {
    return <div className="loading">Loading cluster dashboard...</div>;
  }

  if (!stats || !jobs) {
    return <div className="error">No data available</div>;
  }

  // Filter nodes for AISG and NON-AISG (based on your Grafana config)
  const aisgNodes = nodes.filter(n =>
    ['hopper-46', 'hopper-43', 'hopper-45', 'hopper-44', 'hopper-42',
     'hopper-41', 'hopper-40', 'hopper-39', 'hopper-38', 'hopper-37',
     'hopper-36', 'hopper-34', 'hopper-33', 'hopper-32', 'hopper-31', 'hopper-35'].includes(n.name)
  );

  const nonAisgNodes = nodes.filter(n => !aisgNodes.some(a => a.name === n.name));

  const aisgTotalGPUs = aisgNodes.reduce((sum, n) => sum + n.totalGpus, 0);
  const aisgUsedGPUs = aisgNodes.reduce((sum, n) => sum + n.usedGpus, 0);
  const aisgOccupation = aisgTotalGPUs > 0 ? (aisgUsedGPUs / aisgTotalGPUs) * 100 : 0;

  // Assuming NON-AISG has 192 GPUs based on your formula
  const nonAisgUsedGPUs = nonAisgNodes.reduce((sum, n) => sum + n.usedGpus, 0);
  const nonAisgOccupation = (nonAisgUsedGPUs / 192) * 100;

  // Calculate GPU occupation rate (exc. 1-6) using formula: ((NUS-IT occ rate * 24) / 4000) + ((AISG Occ. rate * 16) / 4000)
  const gpuOccupationRate = ((nonAisgOccupation * 24) / 4000 + (aisgOccupation * 16) / 4000) * 100;

  // Top 5 users
  const topUsers = jobs.byUser.slice(0, 5);

  // Top 5 queues
  const topQueues = jobs.byQueue.filter(q => q.count > 0).slice(0, 5);

  // Prepare node data for heatmaps
  const nodeJobsData = nodes.map(n => ({
    name: n.name,
    value: n.jobs.length,
    maxValue: 8, // Max jobs per node
  }));

  const nodeGPUUsageData = nodes.map(n => ({
    name: n.name,
    value: n.usedGpus,
    maxValue: n.totalGpus,
  }));

  const nodeGPUAvailData = nodes.map(n => ({
    name: n.name,
    value: n.totalGpus - n.usedGpus,
    maxValue: n.totalGpus,
  }));

  return (
    <div className="cluster-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Cluster Overview</h1>
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

      {/* GPU Occupation Rates */}
      <div className="gauge-grid">
        <GaugeCard
          title="GPU Occupation rate"
          value={gpuOccupationRate}
        />
        <GaugeCard
          title="NUS-IT occ rate"
          value={nonAisgOccupation}
        />
        <GaugeCard
          title="AISG Occ. rate"
          value={aisgOccupation}
        />
      </div>

      {/* Monthly GPU Hours Chart */}
      <Card title="GPU Hours: Total (Last 2 Years)" className="gpu-hours-card">
        {monthlyGPUHoursLoading ? (
          <div className="loading">Loading monthly GPU hours...</div>
        ) : monthlyGPUHoursError ? (
          <div className="error">{monthlyGPUHoursError}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyGPUHours.map(item => ({
              month: item.month,
              gpuHours: parseFloat(item.gpuHours)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                label={{ value: 'GPU Hours: Total', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`${(value / 1000).toFixed(1)}k`, 'GPU Hours']}
              />
              <Bar
                dataKey="gpuHours"
                fill="#1d4ed8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </Card>

      {/* Stats Row */}
      <div className="stats-row">
        <Card title="Queue - Statistic">
          <div className="queue-stats">
            {topQueues.map(q => (
              <div key={q.queue} className="queue-stat-item">
                <span className="queue-name">{q.queue}</span>
                <span className="queue-count">{q.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Job Status">
          <div className="job-stats">
            <div className="stat-item">
              <span className="stat-name">Total</span>
              <span className="stat-count">{jobs.summary.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Running (R)</span>
              <span className="stat-count running">{jobs.summary.running}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Queued (Q)</span>
              <span className="stat-count queued">{jobs.summary.queued}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Hold (H)</span>
              <span className="stat-count held">{jobs.summary.hold}</span>
            </div>
          </div>
        </Card>

        <Card title="USER and Total jobs">
          <div className="user-stats">
            {topUsers.map(u => (
              <div key={u.user} className="user-stat-item">
                <span className="user-name">{u.user}</span>
                <span className="user-count">{u.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Node Status">
          <div className="node-stats">
            <div className="stat-item">
              <span className="stat-name">Available</span>
              <span className="stat-count free">{stats.freeNodes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Busy</span>
              <span className="stat-count busy">{stats.busyNodes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Down</span>
              <span className="stat-count down">{stats.downNodes}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Real-time Charts Section */}
      <div className="section-header">
        <h2>Real-time Monitoring</h2>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === '24h' ? 'active' : ''}`}
            onClick={() => setTimeRange('24h')}
          >
            1 Day
          </button>
          <button
            className={`time-range-btn ${timeRange === '7d' ? 'active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button
            className={`time-range-btn ${timeRange === '30d' ? 'active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Job History Chart */}
      <Card title="Total running job">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={jobHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="runningJobs"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Running"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="queuedJobs"
              stroke="#60a5fa"
              strokeWidth={3}
              name="Queued"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* GPU Occupation History Chart */}
      <Card title="GPU Occupation Rate">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gpuOccupationHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              label={{ value: 'Occupation Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: string) => [Number(value).toFixed(1), name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Overall"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="aisg"
              stroke="#60a5fa"
              strokeWidth={3}
              name="AISG"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nonAisg"
              stroke="#0ea5e9"
              strokeWidth={3}
              name="NON-AISG"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
</Card>

      {/* Historical Data Section */}
      <div className="section-header">
        <h2>Historical Data (XDMoD)</h2>
      </div>

      {/* Job Status Chart */}
      <Card>
        <div className="card-header job-stats-card-header">
          <span className="card-title">Job Completion History ({getJobStatsTimeRangeLabel()})</span>
          <div className="time-range-selector">
            <button
              className={`time-range-btn ${jobStatsTimeRange === '1d' ? 'active' : ''}`}
              onClick={() => setJobStatsTimeRange('1d')}
            >
              Yesterday
            </button>
            <button
              className={`time-range-btn ${jobStatsTimeRange === '7d' ? 'active' : ''}`}
              onClick={() => setJobStatsTimeRange('7d')}
            >
              Last 7 Days
            </button>
            <button
              className={`time-range-btn ${jobStatsTimeRange === '30d' ? 'active' : ''}`}
              onClick={() => setJobStatsTimeRange('30d')}
            >
              Last 30 Days
            </button>
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
              totalGpuHours: parseFloat(item.totalGpuHours || 0)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Number of Jobs', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                label={{ value: 'GPU Hours', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="numJobs"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Jobs Completed"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalGpuHours"
                stroke="#60a5fa"
                strokeWidth={3}
                name="Total GPU Hours"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Wait Time Summary Stats - Summary Display */}
      <Card className="wait-time-title-card">
        <div className="card-header wait-time-card-header">
          <span className="card-title">Average Wait Time per Queue ({summaryTimeRange})</span>
          <div className="time-range-selector">
            <button
              className={`time-range-btn ${summaryTimeRange === 'Yesterday' ? 'active' : ''}`}
              onClick={() => setSummaryTimeRange('Yesterday')}
            >
              Yesterday
            </button>
            <button
              className={`time-range-btn ${summaryTimeRange === '7 Days' ? 'active' : ''}`}
              onClick={() => setSummaryTimeRange('7 Days')}
            >
              Last 7 Days
            </button>
            <button
              className={`time-range-btn ${summaryTimeRange === '30 Days' ? 'active' : ''}`}
              onClick={() => setSummaryTimeRange('30 Days')}
            >
              Last 30 Days
            </button>
          </div>
        </div>
{summaryLoading ? (
          <div className="loading">Loading summaries...</div>
        ) : getCombinedWaitTimeTableData().length === 0 ? (
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
                      <div className={`summary-value summary-value-${summary.status}`}>
                        {summary.overallAvg}
                      </div>
                      <div className={`summary-status status-badge-${summary.status}`}>
                        {getWaitTimeStatusLabel(summary.status)}
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">AISG Average</div>
                      <div className="summary-value">
                        {summary.aisgAvg}
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">NUS IT Average</div>
                      <div className="summary-value">
                        {summary.nusitAvg}
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">Total Jobs</div>
                      <div className="summary-value">
                        {summary.totalJobs}
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-label">Total GPU Hours</div>
                      <div className="summary-value">
                        {summary.totalGpuHours}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="queue-details-grid">
              {(() => {
                const summary = getWaitTimeSummary();
                if (!summary || !summary.queues || summary.queues.length === 0) {
                  return null;
                }
                return summary.queues.map((queue, index) => (
                  <div key={`${queue.queueName}-${index}`} className={`queue-box queue-box-${queue.status}`}>
                    <div className="queue-box-header">
                      <div className="queue-box-name">{queue.queueName}</div>
                      <div className="queue-box-type">{queue.queueType}</div>
                    </div>
                    <div className="queue-box-content">
                      <div className="queue-box-wait-time">{queue.formattedWaitTime}</div>
                      <span className={`status-badge status-badge-${queue.status}`}>
                        {getWaitTimeStatusLabel(queue.status)}
                      </span>
                    </div>
                    <div className="queue-box-meta">
                      <div className="queue-box-meta-item">
                        <span className="meta-label">Jobs:</span>
                        <span className="meta-value">{queue.numJobs}</span>
                      </div>
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
        {/* Merged Wait Time Table */}
        <Card>
          <div className="card-header merged-wait-time-header">
            <span className="card-title">Wait Time ({getMergedWaitTimeTimeRangeLabel()})</span>
            <div className="time-range-selector">
              <button
                className={`time-range-btn ${mergedWaitTimeTimeRange === '1d' ? 'active' : ''}`}
                onClick={() => setMergedWaitTimeTimeRange('1d')}
              >
                Yesterday
              </button>
              <button
                className={`time-range-btn ${mergedWaitTimeTimeRange === '7d' ? 'active' : ''}`}
                onClick={() => setMergedWaitTimeTimeRange('7d')}
              >
                Last 7 Days
              </button>
              <button
                className={`time-range-btn ${mergedWaitTimeTimeRange === '30d' ? 'active' : ''}`}
                onClick={() => setMergedWaitTimeTimeRange('30d')}
              >
                Last 30 Days
              </button>
            </div>
          </div>
          <WaitTimeTableWithPagination data={getMergedWaitTimeData()} loading={false} />
        </Card>

        {/* GPU Usage by User Table */}
        <Card>
          <div className="card-header gpu-usage-card-header">
            <span className="card-title">GPU Usage by User ({getGpuUsageTimeRangeLabel()})</span>
            <div className="time-range-selector">
              <button
                className={`time-range-btn ${gpuUsageTimeRange === '1d' ? 'active' : ''}`}
                onClick={() => setGpuUsageTimeRange('1d')}
              >
                Yesterday
              </button>
              <button
                className={`time-range-btn ${gpuUsageTimeRange === '7d' ? 'active' : ''}`}
                onClick={() => setGpuUsageTimeRange('7d')}
              >
                Last 7 Days
              </button>
              <button
                className={`time-range-btn ${gpuUsageTimeRange === '30d' ? 'active' : ''}`}
                onClick={() => setGpuUsageTimeRange('30d')}
              >
                Last 30 Days
              </button>
            </div>
          </div>
          <GPUUsageTable data={getGpuUsageData()} loading={false} />
        </Card>
      </div>

      {/* Node Heatmaps */}
      <h2>PBS JOB per Node</h2>
      <NodeHeatmap
        title=""
        nodes={nodeJobsData}
        valueLabel="Jobs"
      />

      <h2>GPU USAGE HEATMAP - REALTIME</h2>
      <NodeHeatmap
        title=""
        nodes={nodeGPUUsageData}
        valueLabel="GPUs"
      />

      <h2>GPU AVAILABILITY - REALTIME</h2>
      <NodeHeatmap
        title=""
        nodes={nodeGPUAvailData}
        valueLabel="GPUs Available"
        isAvailability={true}
      />
    </div>
  );
};

export default ClusterDashboard;
