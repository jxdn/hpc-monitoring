import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, AreaChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [gpuUsageByUser, setGpuUsageByUser] = useState<any[]>([]);
  const [gpuUsageLoading, setGpuUsageLoading] = useState<boolean>(true);
  const [jobStatsLast7Days, setJobStatsLast7Days] = useState<any[]>([]);
  const [jobStatsLoading, setJobStatsLoading] = useState<boolean>(true);
  const [aisgWaitTime, setAisgWaitTime] = useState<any[]>([]);
  const [aisgWaitTimeLoading, setAisgWaitTimeLoading] = useState<boolean>(true);
  const [nusitWaitTime, setNusitWaitTime] = useState<any[]>([]);
  const [nusitWaitTimeLoading, setNusitWaitTimeLoading] = useState<boolean>(true);
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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  useEffect(() => {
    const fetchGPUUsageByUser = async () => {
      try {
        setGpuUsageLoading(true);
        const data = await pbsApi.getGPUUsageByUser();
        setGpuUsageByUser(data);
      } catch (error) {
        console.error('Error fetching GPU usage by user:', error);
      } finally {
        setGpuUsageLoading(false);
      }
    };

    fetchGPUUsageByUser();
    const interval = setInterval(fetchGPUUsageByUser, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJobStatsLast7Days = async () => {
      try {
        setJobStatsLoading(true);
        const xdmodTimeRange = timeRange === '24h' ? '1d' : timeRange as '1d' | '7d' | '30d';
        const data = await pbsApi.getJobStatsLast7Days(xdmodTimeRange);
        console.log('Job stats data received:', data);
        setJobStatsLast7Days(data);
      } catch (error) {
        console.error('Error fetching job stats:', error);
      } finally {
        setJobStatsLoading(false);
      }
    };

    fetchJobStatsLast7Days();
    const interval = setInterval(fetchJobStatsLast7Days, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  useEffect(() => {
    const fetchAISGWaitTime = async () => {
      try {
        setAisgWaitTimeLoading(true);
        const xdmodTimeRange = timeRange === '24h' ? '1d' : timeRange as '1d' | '7d' | '30d';
        const data = await pbsApi.getAISGWaitTime(xdmodTimeRange);
        setAisgWaitTime(data);
      } catch (error) {
        console.error('Error fetching AISG wait time:', error);
      } finally {
        setAisgWaitTimeLoading(false);
      }
    };

    fetchAISGWaitTime();
    const interval = setInterval(fetchAISGWaitTime, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  useEffect(() => {
    const fetchNUSITWaitTime = async () => {
      try {
        setNusitWaitTimeLoading(true);
        const xdmodTimeRange = timeRange === '24h' ? '1d' : timeRange as '1d' | '7d' | '30d';
        const data = await pbsApi.getNUSITWaitTime(xdmodTimeRange);
        setNusitWaitTime(data);
      } catch (error) {
        console.error('Error fetching NUS IT wait time:', error);
      } finally {
        setNusitWaitTimeLoading(false);
      }
    };

    fetchNUSITWaitTime();
    const interval = setInterval(fetchNUSITWaitTime, 120000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Fetch all time ranges for static summary boxes
  useEffect(() => {
    const fetchAllWaitTimeSummaries = async () => {
      try {
        setSummaryLoading(true);

        // Fetch all AISG time ranges
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
    const interval = setInterval(fetchAllWaitTimeSummaries, 120000);
    return () => clearInterval(interval);
  }, []);

  // Fetch monthly GPU hours
  useEffect(() => {
    const fetchMonthlyGPUHours = async () => {
      try {
        setMonthlyGPUHoursLoading(true);
        setMonthlyGPUHoursError(null);
        const data = await pbsApi.getMonthlyGPUHours();
        setMonthlyGPUHours(data);
      } catch (error) {
        console.error('Error fetching monthly GPU hours:', error);
        setMonthlyGPUHoursError('Unable to load GPU hours data. Historical data may not be available.');
      } finally {
        setMonthlyGPUHoursLoading(false);
      }
    };

    fetchMonthlyGPUHours();
    const interval = setInterval(fetchMonthlyGPUHours, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Generate sample data indicator
  const isSampleData = monthlyGPUHours.length > 0 && monthlyGPUHours[0].month === 'Feb 2024';

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

  // Static queue definitions (must match database exactly)
  const AISG_QUEUES = ['AISG_debug', 'AISG_large', 'AISG_guest'];
  const NUSIT_QUEUES = ['interactive', 'medium', 'small', 'large', 'special'];

  // Helper function to determine wait time status
  const getWaitTimeStatus = (value: string): 'good' | 'warning' | 'danger' => {
    if (value === 'NA') return 'good';
    const minutes = parseFloat(value.replace(' min', ''));
    if (minutes < 30) return 'good';
    if (minutes <= 60) return 'warning';
    return 'danger';
  };

  // Helper function to get wait time class
  const getWaitTimeClass = (status: 'good' | 'warning' | 'danger'): string => {
    if (status === 'good') return 'stat-value good';
    if (status === 'warning') return 'stat-value warning';
    return 'stat-value danger';
  };

  // Helper function to calculate average wait time statistics table data
  const getAverageWaitTimeTableData = (
    aisgData: any[],
    nusitData: any[],
    timeRangeLabel: string
  ) => {
    // Calculate TOTAL wait time and TOTAL job count for each queue (not average of averages)
    const aisgStats = aisgData.reduce((acc, item) => {
      if (!acc[item.queueName]) {
        acc[item.queueName] = { totalWaitTime: 0, totalJobs: 0 };
      }
      // Calculate total wait time: daily avg * daily job count
      acc[item.queueName].totalWaitTime += (item.avgWaitMinutes * item.numJobs);
      acc[item.queueName].totalJobs += item.numJobs;
      return acc;
    }, {} as Record<string, { totalWaitTime: number; totalJobs: number }>);

    const nusitStats = nusitData.reduce((acc, item) => {
      if (!acc[item.queueName]) {
        acc[item.queueName] = { totalWaitTime: 0, totalJobs: 0 };
      }
      // Calculate total wait time: daily avg * daily job count
      acc[item.queueName].totalWaitTime += (item.avgWaitMinutes * item.numJobs);
      acc[item.queueName].totalJobs += item.numJobs;
      return acc;
    }, {} as Record<string, { totalWaitTime: number; totalJobs: number }>);

    // Get all queue stats
    const getQueueStat = (queueName: string, stats: Record<string, { totalWaitTime: number; totalJobs: number }>, type: 'aisg' | 'nusit') => {
      const queueStats = stats[queueName];
      const displayValue = queueStats && queueStats.totalJobs > 0
        ? `${(queueStats.totalWaitTime / queueStats.totalJobs).toFixed(1)} min`
        : 'NA';
      const status = getWaitTimeStatus(displayValue);
      return {
        queueType: type === 'aisg' ? 'AISG' : 'NUS IT',
        queueName: queueName,
        averageWaitTime: displayValue,
        status: status,
        timeRange: timeRangeLabel
      };
    };

    // Combine all queue data
    const allQueues = [
      ...AISG_QUEUES.map(q => getQueueStat(q, aisgStats, 'aisg')),
      ...NUSIT_QUEUES.map(q => getQueueStat(q, nusitStats, 'nusit'))
    ];

    return allQueues;
  };

  // Combine all time range data into a single table
  const getCombinedWaitTimeTableData = () => {
    return [
      ...getAverageWaitTimeTableData(aisgWaitTime1d, nusitWaitTime1d, 'Yesterday'),
      ...getAverageWaitTimeTableData(aisgWaitTime7d, nusitWaitTime7d, 'Last 7 Days'),
      ...getAverageWaitTimeTableData(aisgWaitTime30d, nusitWaitTime30d, 'Last 30 Days')
    ];
  };

  if (nodesLoading || jobsLoading || statsLoading) {
    return <div className="loading">Loading cluster dashboard...</div>;
  }

  if (!stats || !jobs) {
    return <div className="error">No data available</div>;
  }

  // Define nodes to exclude (hopper-1 to hopper-6)
  const excludedNodes = ['hopper-1', 'hopper-2', 'hopper-3', 'hopper-4', 'hopper-5', 'hopper-6'];
  const filteredNodes = nodes.filter(n => !excludedNodes.includes(n.name));

  // Calculate GPU occupation rates
  const filteredTotalGPUs = filteredNodes.reduce((sum, n) => sum + n.totalGpus, 0);
  const filteredUsedGPUs = filteredNodes.reduce((sum, n) => sum + n.usedGpus, 0);
  const gpuOccupationRate = filteredTotalGPUs > 0 ? (filteredUsedGPUs / filteredTotalGPUs) * 100 : 0;

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
          title="GPU Occupation rate (exc. 1-6)"
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
            {isSampleData && (
              <div style={{ padding: '10px', backgroundColor: '#fef3c7', borderRadius: '4px', marginBottom: '10px', color: '#92400e', fontSize: '14px' }}>
                ⚠️ Sample data - Unable to connect to database. Showing example data.
              </div>
            )}
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
                fill="#3b82f6"
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
              stroke="#10b981"
              strokeWidth={3}
              name="Running"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="queuedJobs"
              stroke="#f59e0b"
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
              formatter={(value: any) => [Number(value).toFixed(1), '']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Overall (exc. 1-6)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="aisg"
              stroke="#10b981"
              strokeWidth={3}
              name="AISG"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nonAisg"
              stroke="#f59e0b"
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
      <Card title="Job Completion History">
        {jobStatsLoading ? (
          <div className="loading">Loading job statistics...</div>
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
                stroke="#10b981"
                strokeWidth={3}
                name="Total GPU Hours"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Wait Time Summary Stats - Table Display */}
      <Card title="Average Wait Time per Queue" className="wait-time-title-card">
        {summaryLoading ? (
          <div className="loading">Loading summaries...</div>
        ) : (
          <div className="average-wait-time-table-container">
            <table className="average-wait-time-table">
              <thead>
                <tr>
                  <th>Time Range</th>
                  <th>Queue Type</th>
                  <th>Queue Name</th>
                  <th>Average Wait Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {getCombinedWaitTimeTableData().map((row, index) => (
                  <tr key={`${row.timeRange}-${row.queueName}-${index}`}>
                    <td className="time-range-cell">{row.timeRange}</td>
                    <td className="queue-type-cell">{row.queueType}</td>
                    <td className="queue-name-cell">{row.queueName}</td>
                    <td className="wait-time-cell">
                      <span className={`wait-time-badge wait-time-badge-${row.status}`}>
                        {row.averageWaitTime}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge-${row.status}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Additional Tables */}
      <div className="centered-tables">
        <Card title="AISG Wait Time">
          <WaitTimeTableWithPagination data={aisgWaitTime} loading={aisgWaitTimeLoading} />
        </Card>

        <Card title="NUS IT Wait Time">
          <WaitTimeTableWithPagination data={nusitWaitTime} loading={nusitWaitTimeLoading} />
        </Card>

        {/* GPU Usage by User Table */}
        <Card title="GPU Usage by User (Last 7 Days)">
          <GPUUsageTable data={gpuUsageByUser} loading={gpuUsageLoading} />
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
