import React from 'react';
import { useJobs } from '../hooks/usePbsData';
import Card from '../components/dashboard/Card';
import StatCard from '../components/dashboard/StatCard';
import './Jobs.css';

const Jobs: React.FC = () => {
  const { jobs, loading, error } = useJobs(30000); // Refresh every 30 seconds

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="error">Error loading jobs: {error.message}</div>;
  }

  if (!jobs) {
    return <div className="loading">No data available</div>;
  }

  // Handle the aggregated data format from Prometheus
  const summary = jobs.summary;
  const byUser = jobs.byUser;
  const byQueue = jobs.byQueue;

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Jobs Overview</h1>
        <p className="jobs-subtitle">Aggregated job statistics from Prometheus</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Jobs"
          value={summary.total}
          trend={{ value: 0, isPositive: true }}
          icon="📊"
        />
        <StatCard
          title="Running Jobs"
          value={summary.running}
          trend={{ value: 0, isPositive: true }}
          icon="▶️"
        />
        <StatCard
          title="Queued Jobs"
          value={summary.queued}
          trend={{ value: 0, isPositive: false }}
          icon="⏸️"
        />
        <StatCard
          title="On Hold"
          value={summary.hold}
          trend={{ value: 0, isPositive: false }}
          icon="⏹️"
        />
      </div>

      {/* Jobs by User */}
      <Card>
        <h2>Jobs by User</h2>
        <div className="jobs-table-container">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Running Jobs</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {byUser.length === 0 ? (
                <tr>
                  <td colSpan={3} className="no-data">No job data available</td>
                </tr>
              ) : (
                byUser
                  .sort((a, b) => b.count - a.count)
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.user}</td>
                      <td>{item.count}</td>
                      <td>
                        <div className="percentage-bar">
                          <div
                            className="percentage-fill"
                            style={{ width: `${(item.count / summary.running * 100)}%` }}
                          />
                          <span>{((item.count / summary.running) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Jobs by Queue */}
      <Card>
        <h2>Jobs by Queue</h2>
        <div className="jobs-table-container">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Queue Name</th>
                <th>Running Jobs</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {byQueue.length === 0 ? (
                <tr>
                  <td colSpan={3} className="no-data">No queue data available</td>
                </tr>
              ) : (
                byQueue
                  .filter(item => item.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.queue}</td>
                      <td>{item.count}</td>
                      <td>
                        <div className="percentage-bar">
                          <div
                            className="percentage-fill"
                            style={{ width: `${(item.count / summary.running * 100)}%` }}
                          />
                          <span>{((item.count / summary.running) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="jobs-info-banner">
        <p>
          <strong>Note:</strong> Individual job details are not available when using Prometheus as the data source.
          Only aggregated statistics are shown. See the backend documentation for more information.
        </p>
      </div>
    </div>
  );
};

export default Jobs;
