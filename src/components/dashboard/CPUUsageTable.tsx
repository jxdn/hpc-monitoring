import React from 'react';
import './CPUUsageTable.css';

interface CPUUsageData {
  username: string;
  numJobs: number;
  totalCpusUsed: number;
  avgCpusPerJob: string;
  totalCpuHours: string;
  avgCpuHoursPerJob: string;
}

interface CPUUsageTableProps {
  data: CPUUsageData[];
  loading?: boolean;
}

const CPUUsageTable: React.FC<CPUUsageTableProps> = ({ data, loading }) => {
  const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    }
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'k';
    }
    return n.toFixed(0);
  };

  const formatHours = (hours: string): string => {
    const h = parseFloat(hours);
    if (h >= 1000000) {
      return (h / 1000000).toFixed(1) + 'M';
    }
    if (h >= 1000) {
      return (h / 1000).toFixed(1) + 'k';
    }
    return h.toFixed(1);
  };

  if (loading) {
    return (
      <div className="cpu-usage-loading">
        <div className="loading-spinner"></div>
        Loading CPU usage data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="cpu-usage-empty">No CPU usage data available for the selected time range</div>;
  }

  return (
    <div className="cpu-usage-table-container">
      <table className="cpu-usage-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Jobs</th>
            <th>Total CPUs</th>
            <th>Avg CPUs/Job</th>
            <th>Total CPU Hours</th>
            <th>Avg CPU Hours/Job</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.username} className={index < 3 ? 'top-user' : ''}>
              <td className="number-cell rank-cell">#{index + 1}</td>
              <td className="username-cell">{row.username}</td>
              <td className="number-cell">{formatNumber(row.numJobs)}</td>
              <td className="number-cell">{formatNumber(row.totalCpusUsed)}</td>
              <td className="number-cell">{row.avgCpusPerJob}</td>
              <td className="number-cell highlight">{formatHours(row.totalCpuHours)}</td>
              <td className="number-cell">{row.avgCpuHoursPerJob}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CPUUsageTable;
