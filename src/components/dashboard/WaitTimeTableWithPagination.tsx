import React, { useState, useMemo } from 'react';
import './DataTable.css';
import './WaitTimeTableWithPagination.css';

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
}

type SortField = 'date' | 'queueName' | 'numJobs' | 'totalGpuHours' | 'avgGpuHoursPerJob' | 'avgWaitMinutes';
type SortOrder = 'asc' | 'desc';

const WaitTimeTableWithPagination: React.FC<WaitTimeTableProps> = ({ data, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => {
      let compareA: any = a[sortField];
      let compareB: any = b[sortField];

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
    return sorted;
  }, [data, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getWaitTimeStatus = (minutes: number): 'good' | 'warning' | 'danger' => {
    if (minutes < 30) return 'good';
    if (minutes <= 60) return 'warning';
    return 'danger';
  };

  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <div className="data-table-loading">Loading wait time data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="data-table-empty">No wait time data available</div>;
  }

  return (
    <div className="data-table-wrapper">
      <div className="data-table-container">
        <table className="data-table wait-time-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('queueName')} className="sortable">
                Queue {sortField === 'queueName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('numJobs')} className="sortable number-header">
                Jobs {sortField === 'numJobs' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalGpuHours')} className="sortable number-header">
                Total GPU Hours {sortField === 'totalGpuHours' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('avgGpuHoursPerJob')} className="sortable number-header">
                Avg GPU Hours/Job {sortField === 'avgGpuHoursPerJob' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('avgWaitMinutes')} className="sortable number-header">
                Avg Wait (min) {sortField === 'avgWaitMinutes' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => {
              const waitStatus = getWaitTimeStatus(row.avgWaitMinutes);
              return (
                <tr key={`${row.date}-${row.queueName}`} className="wait-time-row">
                  <td className="date-cell">{formatDateForDisplay(row.date)}</td>
                  <td className="queue-cell">
                    <span className="queue-badge">{row.queueName}</span>
                  </td>
                  <td className="number-cell">{row.numJobs}</td>
                  <td className="number-cell">{row.totalGpuHours}</td>
                  <td className="number-cell">{row.avgGpuHoursPerJob}</td>
                  <td className="number-cell">
                    <span className={`wait-time-badge wait-time-${waitStatus}`}>
                      {row.avgWaitMinutes}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedData.length} entries)
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default WaitTimeTableWithPagination;