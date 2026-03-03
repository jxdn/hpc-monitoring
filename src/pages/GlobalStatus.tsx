import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/dashboard/Card';
import MetricRowCard from '../components/dashboard/MetricRowCard';
import './GlobalStatus.css';

interface ClusterSummary {
  totalJobs: number;
  totalCpuHours: number;
  totalGpuHours: number;
  runningJobs: number;
  queuedJobs: number;
  cpuUtilization: number;
  gpuUtilization: number;
  totalCpus: number;
  totalGpus: number;
  totalNodes: number;
  weightedUtilization: number;
}

interface ExecutiveSummary {
  hopper: ClusterSummary;
  vanda: ClusterSummary;
}

const GlobalStatus: React.FC = () => {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics/executive-summary')
      .then(res => res.json())
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toFixed(0);
  };

  const formatHours = (hours: number): string => {
    if (hours >= 1000000) return (hours / 1000000).toFixed(2) + 'M';
    if (hours >= 1000) return (hours / 1000).toFixed(1) + 'k';
    return hours.toFixed(1);
  };

  const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

  const createChartData = (hopperVal: number, vandaVal: number) => [
    { name: 'Hopper', value: hopperVal },
    { name: 'Vanda', value: vandaVal },
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const renderPieChart = (data: any[], formatter: (v: number) => string, label: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [formatter(value), label]}
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid rgba(148, 163, 184, 0.3)', 
            borderRadius: '8px', 
            color: '#f8fafc',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Legend 
          formatter={(value) => <span style={{ color: '#f8fafc' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return <div className="loading-state">Loading executive summary...</div>;
  }

  if (error || !summary) {
    return <div className="error-state">{error || 'No data available'}</div>;
  }

  const totalJobs = summary.hopper.totalJobs + summary.vanda.totalJobs;
  const totalCpuHours = summary.hopper.totalCpuHours + summary.vanda.totalCpuHours;
  const totalGpuHours = summary.hopper.totalGpuHours + summary.vanda.totalGpuHours;
  const totalRunning = summary.hopper.runningJobs + summary.vanda.runningJobs;
  const totalQueued = summary.hopper.queuedJobs + summary.vanda.queuedJobs;
  const avgCpuUtil = (summary.hopper.cpuUtilization + summary.vanda.cpuUtilization) / 2;
  const avgGpuUtil = (summary.hopper.gpuUtilization + summary.vanda.gpuUtilization) / 2;

  return (
    <div className="global-status-page">
      <div className="executive-summary-header">
        <h1>Executive Summary</h1>
        <p>HPC Cluster Overview - Hopper & Vanda</p>
      </div>

      {/* Row 1: Jobs, Combined Hours, Total Nodes */}
      <div className="pie-charts-row-three">
        <Card title="Job Distribution" className="pie-chart-card">
          {renderPieChart(createChartData(summary.hopper.totalJobs, summary.vanda.totalJobs), formatNumber, 'Jobs')}
        </Card>

        <Card title="Combined Hours (CPU + GPU)" className="pie-chart-card">
          {renderPieChart(
            createChartData(
              summary.hopper.totalCpuHours + summary.hopper.totalGpuHours,
              summary.vanda.totalCpuHours + summary.vanda.totalGpuHours
            ),
            formatHours,
            'Hours'
          )}
        </Card>

        <Card title="Total Nodes" className="pie-chart-card">
          {renderPieChart(createChartData(summary.hopper.totalNodes, summary.vanda.totalNodes), formatNumber, 'Nodes')}
        </Card>
      </div>

      {/* Row 2: Total CPUs, Total GPUs, Utilization */}
      <div className="pie-charts-row-three">
        <Card title="Total CPUs" className="pie-chart-card">
          {renderPieChart(createChartData(summary.hopper.totalCpus, summary.vanda.totalCpus), formatNumber, 'CPUs')}
        </Card>

        <Card title="Total GPUs" className="pie-chart-card">
          {renderPieChart(createChartData(summary.hopper.totalGpus, summary.vanda.totalGpus), formatNumber, 'GPUs')}
        </Card>

        <Card title="Utilization (Weighted Avg)" className="pie-chart-card">
          {renderPieChart(
            createChartData(summary.hopper.weightedUtilization, summary.vanda.weightedUtilization),
            formatPercent,
            'Utilization'
          )}
        </Card>
      </div>

      {/* Jobs Row */}
      <div className="metric-row">
        <MetricRowCard
          title="Jobs"
          columns={[
            {
              label: 'Hopper',
              color: COLORS[0],
              primaryValue: formatNumber(summary.hopper.totalJobs),
              secondaryStats: [
                { label: 'running', value: summary.hopper.runningJobs },
                { label: 'queued', value: summary.hopper.queuedJobs },
              ],
            },
            {
              label: 'Vanda',
              color: COLORS[1],
              primaryValue: formatNumber(summary.vanda.totalJobs),
              secondaryStats: [
                { label: 'running', value: summary.vanda.runningJobs },
                { label: 'queued', value: summary.vanda.queuedJobs },
              ],
            },
            {
              label: 'Total',
              color: COLORS[2],
              primaryValue: formatNumber(totalJobs),
              secondaryStats: [
                { label: 'running', value: totalRunning },
                { label: 'queued', value: totalQueued },
              ],
            },
          ]}
        />
      </div>

      {/* CPU Hours Row */}
      <div className="metric-row">
        <MetricRowCard
          title="CPU Hours"
          columns={[
            {
              label: 'Hopper',
              color: COLORS[0],
              primaryValue: formatHours(summary.hopper.totalCpuHours),
              secondaryStats: [
                { label: 'utilization', value: formatPercent(summary.hopper.cpuUtilization) },
              ],
            },
            {
              label: 'Vanda',
              color: COLORS[1],
              primaryValue: formatHours(summary.vanda.totalCpuHours),
              secondaryStats: [
                { label: 'utilization', value: formatPercent(summary.vanda.cpuUtilization) },
              ],
            },
            {
              label: 'Total',
              color: COLORS[2],
              primaryValue: formatHours(totalCpuHours),
              secondaryStats: [
                { label: 'avg utilization', value: formatPercent(avgCpuUtil) },
              ],
            },
          ]}
        />
      </div>

      {/* GPU Hours Row */}
      <div className="metric-row">
        <MetricRowCard
          title="GPU Hours"
          columns={[
            {
              label: 'Hopper',
              color: COLORS[0],
              primaryValue: formatHours(summary.hopper.totalGpuHours),
              secondaryStats: [
                { label: 'utilization', value: formatPercent(summary.hopper.gpuUtilization) },
              ],
            },
            {
              label: 'Vanda',
              color: COLORS[1],
              primaryValue: formatHours(summary.vanda.totalGpuHours),
              secondaryStats: [
                { label: 'utilization', value: formatPercent(summary.vanda.gpuUtilization) },
              ],
            },
            {
              label: 'Total',
              color: COLORS[2],
              primaryValue: formatHours(totalGpuHours),
              secondaryStats: [
                { label: 'avg utilization', value: formatPercent(avgGpuUtil) },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
};

export default GlobalStatus;
