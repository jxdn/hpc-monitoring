import React from 'react';
import { useClusterStats } from '../hooks/usePbsData';
import StatCard from '../components/dashboard/StatCard';
import Card from '../components/dashboard/Card';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useClusterStats(30000); // Refresh every 30 seconds

  if (loading) {
    return <div className="loading">Loading cluster statistics...</div>;
  }

  if (error) {
    return <div className="error">Error loading data: {error.message}</div>;
  }

  if (!stats) {
    return <div className="error">No data available</div>;
  }

  return (
    <div className="dashboard">
      <h1>Cluster Overview</h1>

      <div className="stats-grid">
        <StatCard
          title="Total Nodes"
          value={stats.totalNodes}
          icon="🖥️"
          color="primary"
        />
        <StatCard
          title="Busy Nodes"
          value={stats.busyNodes}
          icon="⚡"
          color="success"
        />
        <StatCard
          title="Free Nodes"
          value={stats.freeNodes}
          icon="✓"
          color="primary"
        />
        <StatCard
          title="Down Nodes"
          value={stats.downNodes}
          icon="⚠️"
          color="error"
        />
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon="💼"
          color="primary"
        />
        <StatCard
          title="Running Jobs"
          value={stats.runningJobs}
          icon="▶️"
          color="success"
        />
        <StatCard
          title="Queued Jobs"
          value={stats.queuedJobs}
          icon="⏸️"
          color="warning"
        />
        <StatCard
          title="GPU Utilization"
          value={`${stats.gpuUtilization.toFixed(1)}%`}
          icon="🎮"
          color={stats.gpuUtilization > 80 ? 'error' : stats.gpuUtilization > 50 ? 'warning' : 'success'}
        />
      </div>

      <div className="dashboard-content">
        <Card title="Resource Overview">
          <div className="resource-info">
            <div className="resource-item">
              <span className="resource-label">Total GPUs:</span>
              <span className="resource-value">{stats.totalGpus}</span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Used GPUs:</span>
              <span className="resource-value">{stats.usedGpus}</span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Available GPUs:</span>
              <span className="resource-value">{stats.totalGpus - stats.usedGpus}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
