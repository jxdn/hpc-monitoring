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
  if (loading) {
    return <div className="gpu-usage-loading">Loading GPU usage data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="gpu-usage-empty">No GPU usage data available</div>;
  }

  return (
    <div className="gpu-usage-table-container">
      <table className="gpu-usage-table">
        <thead>
          <tr>
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
            <tr key={row.username} className={index === 0 ? 'top-user' : ''}>
              <td className="username-cell">{row.username}</td>
              <td className="number-cell">{row.numJobs}</td>
              <td className="number-cell">{row.totalGpusUsed}</td>
              <td className="number-cell">{row.avgGpusPerJob}</td>
              <td className="number-cell highlight">{row.totalGpuHours}</td>
              <td className="number-cell">{row.avgGpuHoursPerJob}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GPUUsageTable;
