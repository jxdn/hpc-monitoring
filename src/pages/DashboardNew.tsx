import React from 'react';
import StatCard from '../components/dashboard/StatCardNew';
import { LayoutDashboard, Cpu, Activity, BarChart3, Zap, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  // Sample data - replace with actual API calls
  const stats = [
    {
      title: 'Total Jobs',
      value: '1,234',
      icon: <LayoutDashboard className="w-6 h-6 text-white" />,
      trend: 'up',
      trendValue: '+12.5%',
      color: 'purple' as const
    },
    {
      title: 'Active Nodes',
      value: '42',
      icon: <Cpu className="w-6 h-6 text-white" />,
      trend: 'up',
      trendValue: '+3',
      color: 'blue' as const
    },
    {
      title: 'GPU Utilization',
      value: '87%',
      icon: <Zap className="w-6 h-6 text-white" />,
      trend: 'up',
      trendValue: '+5.2%',
      color: 'green' as const
    },
    {
      title: 'Avg Wait Time',
      value: '12m',
      icon: <Clock className="w-6 h-6 text-white" />,
      trend: 'down',
      trendValue: '-3.1%',
      color: 'orange' as const
    }
  ];

  const jobData = [
    { time: '00:00', jobs: 45, queued: 12 },
    { time: '04:00', jobs: 52, queued: 8 },
    { time: '08:00', jobs: 78, queued: 15 },
    { time: '12:00', jobs: 95, queued: 22 },
    { time: '16:00', jobs: 88, queued: 18 },
    { time: '20:00', jobs: 65, queued: 10 },
    { time: '24:00', jobs: 48, queued: 7 }
  ];

  const gpuUsageData = [
    { name: 'Node 1', usage: 92 },
    { name: 'Node 2', usage: 85 },
    { name: 'Node 3', usage: 78 },
    { name: 'Node 4', usage: 95 },
    { name: 'Node 5', usage: 82 },
    { name: 'Node 6', usage: 88 }
  ];

  return (
    <div className="animate-fade-in">
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
            <p className="text-sm text-gray-600">Real-time job execution statistics</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={jobData}>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">GPU Utilization</h3>
            <p className="text-sm text-gray-600">Average GPU usage across cluster</p>
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
              <tr>
                <td className="font-bold text-yellow-600">#1</td>
                <td className="font-semibold text-purple-600">user1</td>
                <td>245</td>
                <td className="font-semibold">1,234.5 h</td>
                <td>8.2</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-600">#2</td>
                <td className="font-semibold text-gray-700">user2</td>
                <td>198</td>
                <td>987.3 h</td>
                <td>6.4</td>
              </tr>
              <tr>
                <td className="font-bold text-orange-600">#3</td>
                <td className="font-semibold text-gray-700">user3</td>
                <td>187</td>
                <td>854.2 h</td>
                <td>5.8</td>
              </tr>
              <tr>
                <td className="text-gray-500">#4</td>
                <td className="text-gray-600">user4</td>
                <td>156</td>
                <td>732.1 h</td>
                <td>4.9</td>
              </tr>
              <tr>
                <td className="text-gray-500">#5</td>
                <td className="text-gray-600">user5</td>
                <td>143</td>
                <td>698.7 h</td>
                <td>5.1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;