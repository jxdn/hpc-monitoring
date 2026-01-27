import React from 'react';
import './DataTable.css';

interface JobStatsData {
  jobDate: string;
  numJobs: number;
  totalGpuHours: string;
}

interface JobStatsTableProps {
  data: JobStatsData[];
  loading?: boolean;
}

const JobStatsTable: React.FC<JobStatsTableProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="data-table-loading">Loading job statistics...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="data-table-empty">No job statistics available</div>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Jobs</th>
            <th>Total GPU Hours</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.jobDate}>
              <td className="date-cell">{row.jobDate}</td>
              <td className="number-cell">{row.numJobs}</td>
              <td className="number-cell highlight">{row.totalGpuHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobStatsTable;
