import React from 'react';
import './GPUUsageTable.css';

interface GPUUsageData {
  username: string;
  numJobs: number;
  totalGpusUsed: number;
  avgGpusPerJob: string;
  totalGpuHours: string;
  avgGpuHoursPerJob: string;
}

interface GPUUsageTableProps {
  data: GPUUsageData[];
  loading?: boolean;
}

const GPUUsageTable: React.FC<GPUUsageTableProps> = ({ data, loading }) => {
  const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'k';
    }
    return n.toFixed(0);
  };

  const formatHours = (hours: string): string => {
    const h = parseFloat(hours);
    if (h >= 1000) {
      return (h / 1000).toFixed(1) + 'k';
    }
    return h.toFixed(1);
  };

  if (loading) {
    return (
      <div className="gpu-usage-loading">
        <div className="loading-spinner"></div>
        Loading GPU usage data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="gpu-usage-empty">No GPU usage data available for the last 7 days</div>;
  }

  return (
    <div className="gpu-usage-table-container">
      <table className="gpu-usage-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Jobs</th>
            <th>Total GPUs</th>
            <th>Avg GPUs/Job</th>
            <th>Total GPU Hours</th>
            <th>Avg GPU Hours/Job</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.username} className={index < 3 ? 'top-user' : ''}>
              <td className="number-cell rank-cell">#{index + 1}</td>
              <td className="username-cell">{row.username}</td>
              <td className="number-cell">{formatNumber(row.numJobs)}</td>
              <td className="number-cell">{formatNumber(row.totalGpusUsed)}</td>
              <td className="number-cell">{row.avgGpusPerJob}</td>
              <td className="number-cell highlight">{formatHours(row.totalGpuHours)}</td>
              <td className="number-cell">{row.avgGpuHoursPerJob}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GPUUsageTable;
