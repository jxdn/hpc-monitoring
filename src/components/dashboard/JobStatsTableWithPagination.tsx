import React, { useState, useMemo } from 'react';
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

type SortField = 'jobDate' | 'numJobs' | 'totalGpuHours';
type SortOrder = 'asc' | 'desc';

const JobStatsTableWithPagination: React.FC<JobStatsTableProps> = ({ data, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('jobDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 10;

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => {
      let compareA: any = a[sortField];
      let compareB: any = b[sortField];

      if (sortField === 'totalGpuHours') {
        compareA = parseFloat(a.totalGpuHours);
        compareB = parseFloat(b.totalGpuHours);
      } else if (sortField === 'jobDate') {
        compareA = new Date(a.jobDate).getTime();
        compareB = new Date(b.jobDate).getTime();
      }

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="data-table-loading">Loading job statistics...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="data-table-empty">No job statistics available</div>;
  }

  return (
    <div className="data-table-wrapper">
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('jobDate')} className="sortable">
                Date {sortField === 'jobDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('numJobs')} className="sortable">
                Jobs {sortField === 'numJobs' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalGpuHours')} className="sortable">
                Total GPU Hours {sortField === 'totalGpuHours' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={row.jobDate}>
                <td className="date-cell">{formatDate(row.jobDate)}</td>
                <td className="number-cell">{row.numJobs}</td>
                <td className="number-cell highlight">{row.totalGpuHours}</td>
              </tr>
            ))}
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
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedData.length} items)
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobStatsTableWithPagination;
