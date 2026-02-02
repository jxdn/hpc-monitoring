import React, { useState, useEffect } from 'react';
import StatCard from '../components/dashboard/StatCardNew';
import { LayoutDashboard, Cpu, Activity, BarChart3, Zap, Clock } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pbsApi } from '../services/pbsApi';

const Dashboard = () => {
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [runningJobs, setRunningJobs] = useState<number>(0);
  const [queuedJobs, setQueuedJobs] = useState<number>(0);
  const [activeNodes, setActiveNodes] = useState<number>(0);
  const [gpuUtil, setGpuUtil] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [gpuUsageByUser, setGpuUsageByUser] = useState<any[]>([]);
  const [jobHistory, setJobHistory] = useState<any[]>([]);

  // Fetch real data from backend
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch jobs data
        const jobsData = await pbsApi.getJobs();
        setTotalJobs(jobsData.summary?.total || 0);
        setRunningJobs(jobsData.summary?.running || 0);
        setQueuedJobs(jobsData.summary?.queued || 0);

        // Fetch cluster stats
        const stats = await pbsApi.getClusterStats();
        setActiveNodes(stats.totalNodes || 0);

        // Fetch GPU usage by user
        try {
          const gpuUsage = await pbsApi.getGPUUsageByUser();
          setGpuUsageByUser(gpuUsage);
        } catch (error) {
          console.error('Error fetching GPU usage:', error);
        }

        // Fetch job history
        try {
          const jobStats = await pbsApi.getJobStats('7d');
          const history = jobStats.map(item => ({
            time: new Date(item.jobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            jobs: item.numJobs,
            queued: 0
          }));
          setJobHistory(history);
        } catch (error) {
          console.error('Error fetching job history:', error);
        }

        // Calculate GPU utilization from nodes
        try {
          const nodes = await pbsApi.getNodes();
          const totalGPUs = nodes.reduce((sum, node) => sum + (node.totalGpus || 0), 0);
          const usedGPUs = nodes.reduce((sum, node) => sum + (node.usedGpus || 0), 0);
          const utilization = totalGPUs > 0 ? Math.round((usedGPUs / totalGPUs) * 100) : 0;
          setGpuUtil(utilization);
        } catch (error) {
          console.error('Error calculating GPU utilization:', error);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const gpuUsageData = gpuUsageByUser.slice(0, 6).map(user => ({
    name: user.username,
    usage: parseFloat(user.totalGpuHours) > 0 
      ? Math.min(100, Math.round(parseFloat(user.totalGpuHours) / 100))
      : parseInt(user.numJobs) * 15
  }));

  const stats = [
    {
      title: 'Total Jobs',
      value: formatNumber(totalJobs),
      icon: <Activity className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      trendValue: '+12.5%',
      color: 'purple' as const
    },
    {
      title: 'Running Jobs',
      value: formatNumber(runningJobs),
      icon: <LayoutDashboard className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      trendValue: '+5.2%',
      color: 'blue' as const
    },
    {
      title: 'Active Nodes',
      value: activeNodes.toString(),
      icon: <Cpu className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      trendValue: '+3',
      color: 'green' as const
    },
    {
      title: 'GPU Utilization',
      value: `${gpuUtil}%`,
      icon: <Zap className="w-6 h-6 text-white" />,
      trend: 'up' as const,
      trendValue: '+2.4%',
      color: 'orange' as const
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Real-time HPC cluster monitoring and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Activity Chart */}
        <div className="chart-container">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Job Activity</h3>
            <p className="text-sm text-gray-600">Job execution statistics (last 7 days)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={jobHistory.length > 0 ? jobHistory : [{ time: 'Today', jobs: runningJobs, queued: queuedJobs }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="jobs" 
                stroke="#667eea" 
                fill="url(#colorJobs)" 
                strokeWidth={3}
                name="Running Jobs"
              />
              <Area 
                type="monotone" 
                dataKey="queued" 
                stroke="#764ba2" 
                fill="url(#colorQueued)" 
                strokeWidth={3}
                name="Queued Jobs"
              />
              <defs>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorQueued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#764ba2" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* GPU Usage Chart */}
        <div className="chart-container">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">GPU Usage</h3>
            <p className="text-sm text-gray-600">Top users by GPU hours (last 7 days)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gpuUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`${value}%`, 'GPU Usage']}
              />
              <Bar 
                dataKey="usage" 
                fill="url(#gradient)" 
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="chart-container">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Top GPU Users</h3>
          <p className="text-sm text-gray-600">Highest GPU consumption users (last 7 days)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Jobs</th>
                <th>Total GPU Hours</th>
                <th>Avg GPUs/Job</th>
              </tr>
            </thead>
            <tbody>
              {gpuUsageByUser.length > 0 ? (
                gpuUsageByUser.slice(0, 5).map((user, index) => (
                  <tr key={user.username || index}>
                    <td className="font-bold text-yellow-600">#1</td>
                    <td className="font-semibold text-purple-600">{user.username}</td>
                    <td>{user.numJobs}</td>
                    <td className="font-semibold">{user.totalGpuHours} h</td>
                    <td>{user.avgGpusPerJob}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    No GPU usage data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;