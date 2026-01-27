import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pbsApi } from '../services/pbsApi';
import { useNodes, useJobs, useClusterStats } from '../hooks/usePbsData';
import StatCard from '../components/dashboard/StatCard';
import GaugeCard from '../components/dashboard/GaugeCard';
import NodeHeatmap from '../components/dashboard/NodeHeatmap';
import Card from '../components/dashboard/Card';
import GPUUsageTable from '../components/dashboard/GPUUsageTable';
import JobStatsTableWithPagination from '../components/dashboard/JobStatsTableWithPagination';
import WaitTimeTableWithPagination from '../components/dashboard/WaitTimeTableWithPagination';
import './ClusterDashboard.css';

const ClusterDashboard: React.FC = () => {
  const { nodes, loading: nodesLoading } = useNodes(30000);
  const { jobs, loading: jobsLoading } = useJobs(30000);
  const { stats, loading: statsLoading } = useClusterStats(30000);
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

  // Separate state for all time ranges for static summary
  const [aisgWaitTime1d, setAisgWaitTime1d] = useState<any[]>([]);
  const [aisgWaitTime7d, setAisgWaitTime7d] = useState<any[]>([]);
  const [aisgWaitTime30d, setAisgWaitTime30d] = useState<any[]>([]);
  const [nusitWaitTime1d, setNusitWaitTime1d] = useState<any[]>([]);
  const [nusitWaitTime7d, setNusitWaitTime7d] = useState<any[]>([]);
  const [nusitWaitTime30d, setNusitWaitTime30d] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [timeRange, setTimeRange] = useState<string>('30d');
  const [xdmodTimeRange, setXdmodTimeRange] = useState<'1d' | '7d' | '30d'>('30d');
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
        const data = await pbsApi.getJobStats(timeRange);
        setJobHistory(data);
      } catch (error) {
        console.error('Error fetching job history:', error);
      }
    };

    fetchJobHistory();
    const interval = setInterval(fetchJobHistory, 60000);
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
    const interval = setInterval(fetchGPUOccupationHistory, 60000);
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
    const interval = setInterval(fetchGPUUsageByUser, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJobStatsLast7Days = async () => {
      try {
        setJobStatsLoading(true);
        const data = await pbsApi.getJobStatsLast7Days(xdmodTimeRange);
        setJobStatsLast7Days(data);
      } catch (error) {
        console.error('Error fetching job stats:', error);
      } finally {
        setJobStatsLoading(false);
      }
    };

    fetchJobStatsLast7Days();
    const interval = setInterval(fetchJobStatsLast7Days, 60000);
    return () => clearInterval(interval);
  }, [xdmodTimeRange]);

  useEffect(() => {
    const fetchAISGWaitTime = async () => {
      try {
        setAisgWaitTimeLoading(true);
        const data = await pbsApi.getAISGWaitTime(xdmodTimeRange);
        setAisgWaitTime(data);
      } catch (error) {
        console.error('Error fetching AISG wait time:', error);
      } finally {
        setAisgWaitTimeLoading(false);
      }
    };

    fetchAISGWaitTime();
    const interval = setInterval(fetchAISGWaitTime, 60000);
    return () => clearInterval(interval);
  }, [xdmodTimeRange]);

  useEffect(() => {
    const fetchNUSITWaitTime = async () => {
      try {
        setNusitWaitTimeLoading(true);
        const data = await pbsApi.getNUSITWaitTime(xdmodTimeRange);
        setNusitWaitTime(data);
      } catch (error) {
        console.error('Error fetching NUS IT wait time:', error);
      } finally {
        setNusitWaitTimeLoading(false);
      }
    };

    fetchNUSITWaitTime();
    const interval = setInterval(fetchNUSITWaitTime, 60000);
    return () => clearInterval(interval);
  }, [xdmodTimeRange]);

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
    const interval = setInterval(fetchAllWaitTimeSummaries, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch monthly GPU hours
  useEffect(() => {
    const fetchMonthlyGPUHours = async () => {
      try {
        setMonthlyGPUHoursLoading(true);
        const data = await pbsApi.getMonthlyGPUHours();
        setMonthlyGPUHours(data);
      } catch (error) {
        console.error('Error fetching monthly GPU hours:', error);
      } finally {
        setMonthlyGPUHoursLoading(false);
      }
    };

    fetchMonthlyGPUHours();
    const interval = setInterval(fetchMonthlyGPUHours, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
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

  // Static queue definitions (must match database exactly)
  const AISG_QUEUES = ['AISG_debug', 'AISG_large', 'AISG_guest'];
  const NUSIT_QUEUES = ['interactive', 'medium', 'small', 'large', 'special'];

  // Helper function to create queue summary cards with static queues
  const createQueueSummaryCards = (
    aisgData: any[],
    nusitData: any[],
    keyPrefix: string
  ) => {
    // Calculate stats from data
    const aisgStats = aisgData.reduce((acc, item) => {
      if (!acc[item.queueName]) {
        acc[item.queueName] = { total: 0, count: 0 };
      }
      acc[item.queueName].total += item.avgWaitMinutes;
      acc[item.queueName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const nusitStats = nusitData.reduce((acc, item) => {
      if (!acc[item.queueName]) {
        acc[item.queueName] = { total: 0, count: 0 };
      }
      acc[item.queueName].total += item.avgWaitMinutes;
      acc[item.queueName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Create cards for all static queues
    return [
      ...AISG_QUEUES.map(queue => {
        const stats = aisgStats[queue];
        const displayValue = stats
          ? `${(stats.total / stats.count).toFixed(1)} min`
          : 'NA';

        return (
          <div key={`${keyPrefix}-aisg-${queue}`} className="summary-card">
            <div className="summary-label">{queue}</div>
            <div className="summary-value">{displayValue}</div>
            <div className="summary-period">AISG</div>
          </div>
        );
      }),
      ...NUSIT_QUEUES.map(queue => {
        const stats = nusitStats[queue];
        const displayValue = stats
          ? `${(stats.total / stats.count).toFixed(1)} min`
          : 'NA';

        return (
          <div key={`${keyPrefix}-nusit-${queue}`} className="summary-card">
            <div className="summary-label">{queue}</div>
            <div className="summary-value">{displayValue}</div>
            <div className="summary-period">NUS IT</div>
          </div>
        );
      })
    ];
  };

  if (nodesLoading || jobsLoading || statsLoading) {
    return <div className="loading">Loading cluster dashboard...</div>;
  }

  if (!stats || !jobs) {
    return <div className="error">No data available</div>;
  }

  // Calculate GPU occupation rates
  const totalGPUs = stats.totalGpus;
  const usedGPUs = stats.usedGpus;
  const gpuOccupationRate = totalGPUs > 0 ? (usedGPUs / totalGPUs) * 100 : 0;

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
        <h1>Cluster Overview</h1>
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
          title="NON-AISG Occ. rate"
          value={nonAisgOccupation}
        />
        <GaugeCard
          title="AISG Occ. rate"
          value={aisgOccupation}
        />
      </div>

      {/* Monthly GPU Hours Chart */}
      <Card title="GPU Hours: Total (Last 2 Years)">
        {monthlyGPUHoursLoading ? (
          <div className="loading">Loading monthly GPU hours...</div>
        ) : (
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
          <div className="job-status-grid">
            <div className="status-item">
              <span className="status-label">Total</span>
              <span className="status-value">{jobs.summary.total}</span>
            </div>
            <div className="status-item">
              <span className="status-label">R (Running)</span>
              <span className="status-value">{jobs.summary.running}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Q (Queued)</span>
              <span className="status-value">{jobs.summary.queued}</span>
            </div>
            <div className="status-item">
              <span className="status-label">H (Hold)</span>
              <span className="status-value">{jobs.summary.hold}</span>
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

        <Card title="Node status">
          <div className="node-status-grid">
            <div className="status-item">
              <span className="status-label">Available</span>
              <span className="status-value">{stats.freeNodes}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Busy</span>
              <span className="status-value">{stats.busyNodes}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Down</span>
              <span className="status-value">{stats.downNodes}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Job History Chart */}
      <Card title="Total running job">
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

      {/* XDMoD Tables Time Range Selector */}
      <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Historical Data (XDMoD)</h2>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${xdmodTimeRange === '1d' ? 'active' : ''}`}
            onClick={() => setXdmodTimeRange('1d')}
          >
            Last Day
          </button>
          <button
            className={`time-range-btn ${xdmodTimeRange === '7d' ? 'active' : ''}`}
            onClick={() => setXdmodTimeRange('7d')}
          >
            Last 7 Days
          </button>
          <button
            className={`time-range-btn ${xdmodTimeRange === '30d' ? 'active' : ''}`}
            onClick={() => setXdmodTimeRange('30d')}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Job Status Chart */}
      <Card title="Job Completion History">
        {jobStatsLoading ? (
          <div className="loading">Loading job statistics...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobStatsLast7Days.map(item => ({
              date: new Date(item.jobDate).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
              numJobs: item.numJobs,
              totalGpuHours: parseFloat(item.totalGpuHours)
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

      {/* Wait Time Summary Stats - Static for All Time Ranges */}
      <div className="wait-time-summary-section">
        <h3 className="summary-section-title">Average Wait Time per Queue</h3>

        {summaryLoading ? (
          <div className="summary-loading">Loading summaries...</div>
        ) : (
          <>
            {/* Yesterday (1 Day) */}
            <div className="time-range-group">
              <h4 className="time-range-group-title">Yesterday</h4>
              <div className="queue-summary-grid">
                {createQueueSummaryCards(aisgWaitTime1d, nusitWaitTime1d, '1d')}
              </div>
            </div>

            {/* Last 7 Days */}
            <div className="time-range-group">
              <h4 className="time-range-group-title">Last 7 Days</h4>
              <div className="queue-summary-grid">
                {createQueueSummaryCards(aisgWaitTime7d, nusitWaitTime7d, '7d')}
              </div>
            </div>

            {/* Last 30 Days */}
            <div className="time-range-group">
              <h4 className="time-range-group-title">Last 30 Days</h4>
              <div className="queue-summary-grid">
                {createQueueSummaryCards(aisgWaitTime30d, nusitWaitTime30d, '30d')}
              </div>
            </div>
          </>
        )}
      </div>

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
