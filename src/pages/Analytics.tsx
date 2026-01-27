import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { pbsApi } from '../services/pbsApi';
import Card from '../components/dashboard/Card';
import './Analytics.css';

type TimeRange = '1h' | '24h' | '7d' | '30d';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [resourceData, setResourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobs, resources] = await Promise.all([
          pbsApi.getJobStats(timeRange),
          pbsApi.getResourceUtilization(timeRange),
        ]);
        setJobStats(jobs);
        setResourceData(resources);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <div className="time-range-selector">
          {(['1h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <Card title="Job Statistics">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="timestamp"
                stroke="#a0a0a0"
                tick={{ fill: '#a0a0a0' }}
              />
              <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="runningJobs"
                stroke="#10b981"
                strokeWidth={2}
                name="Running Jobs"
              />
              <Line
                type="monotone"
                dataKey="queuedJobs"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Queued Jobs"
              />
              <Line
                type="monotone"
                dataKey="completedJobs"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Completed Jobs"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Resource Utilization">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="timestamp"
                stroke="#a0a0a0"
                tick={{ fill: '#a0a0a0' }}
              />
              <YAxis stroke="#a0a0a0" tick={{ fill: '#a0a0a0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="gpuUtilization"
                fill="#3b82f6"
                name="GPU Utilization (%)"
              />
              <Bar
                dataKey="memoryUtilization"
                fill="#8b5cf6"
                name="Memory Utilization (%)"
              />
              <Bar
                dataKey="nodeUtilization"
                fill="#10b981"
                name="Node Utilization (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
