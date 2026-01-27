import React from 'react';
import './DataTable.css';

interface WaitTimeData {
  date: string;
  queueName: string;
  numJobs: number;
  totalGpuHours: number;
  avgGpuHoursPerJob: number;
  avgWaitMinutes: number;
}

interface WaitTimeTableProps {
  data: WaitTimeData[];
  loading?: boolean;
  title?: string;
}

const WaitTimeTable: React.FC<WaitTimeTableProps> = ({ data, loading, title }) => {
  if (loading) {
    return <div className="data-table-loading">Loading wait time data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="data-table-empty">No wait time data available</div>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Queue</th>
            <th>Jobs</th>
            <th>Total GPU Hours</th>
            <th>Avg GPU Hours/Job</th>
            <th>Avg Wait (min)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={`${row.date}-${row.queueName}`}>
              <td className="date-cell">{row.date}</td>
              <td className="queue-cell">{row.queueName}</td>
              <td className="number-cell">{row.numJobs}</td>
              <td className="number-cell">{row.totalGpuHours}</td>
              <td className="number-cell">{row.avgGpuHoursPerJob}</td>
              <td className="number-cell highlight">{row.avgWaitMinutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WaitTimeTable;
