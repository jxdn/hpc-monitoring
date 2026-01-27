import React from 'react';
import { useNodes } from '../hooks/usePbsData';
import Card from '../components/dashboard/Card';
import './Nodes.css';

const Nodes: React.FC = () => {
  const { nodes, loading, error } = useNodes(30000); // Refresh every 30 seconds

  if (loading) {
    return <div className="loading">Loading nodes...</div>;
  }

  if (error) {
    return <div className="error">Error loading nodes: {error.message}</div>;
  }

  const getStateBadge = (state: string) => {
    const stateMap: Record<string, { className: string }> = {
      free: { className: 'state-free' },
      busy: { className: 'state-busy' },
      down: { className: 'state-down' },
      offline: { className: 'state-offline' },
      'job-exclusive': { className: 'state-exclusive' },
    };
    const { className } = stateMap[state] || { className: '' };
    return <span className={`state-badge ${className}`}>{state}</span>;
  };

  const calculateUtilization = (used: number, total: number) => {
    return ((used / total) * 100).toFixed(1);
  };

  return (
    <div className="nodes-page">
      <div className="nodes-header">
        <h1>Nodes</h1>
        <div className="nodes-stats">
          <span>Total: {nodes.length}</span>
          <span>Free: {nodes.filter(n => n.state === 'free').length}</span>
          <span>Busy: {nodes.filter(n => n.state === 'busy').length}</span>
          <span>Down: {nodes.filter(n => n.state === 'down').length}</span>
        </div>
      </div>

      <Card>
        <div className="nodes-table-container">
          <table className="nodes-table">
            <thead>
              <tr>
                <th>Node Name</th>
                <th>State</th>
                <th>GPUs (Used/Total)</th>
                <th>GPU Utilization</th>
                <th>Memory (Used/Total)</th>
                <th>Running Jobs</th>
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">No nodes found</td>
                </tr>
              ) : (
                nodes.map((node) => (
                  <tr key={node.id}>
                    <td>{node.name}</td>
                    <td>{getStateBadge(node.state)}</td>
                    <td>
                      {node.usedGpus} / {node.totalGpus}
                    </td>
                    <td>
                      <div className="utilization-bar">
                        <div
                          className="utilization-fill"
                          style={{
                            width: `${calculateUtilization(node.usedGpus, node.totalGpus)}%`,
                          }}
                        />
                        <span className="utilization-text">
                          {calculateUtilization(node.usedGpus, node.totalGpus)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {node.usedMemory} / {node.totalMemory}
                    </td>
                    <td>{node.jobs.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Nodes;
