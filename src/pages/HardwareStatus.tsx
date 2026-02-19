import React from 'react';
import { useHardwareStatus } from '../hooks/usePbsData';
import Card from '../components/dashboard/Card';
import './HardwareStatus.css';

const HardwareStatusPage: React.FC = () => {
  const { hardwareStatus, loading, error } = useHardwareStatus(180000);

  if (loading) {
    return <div className="loading">Loading hardware status...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  if (!hardwareStatus) {
    return <div className="error">No hardware data available</div>;
  }

  const { nodes, summary } = hardwareStatus;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      case 'non-recoverable':
        return '#7c3aed';
      case 'other':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'ok':
        return 'rgba(16, 185, 129, 0.15)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.15)';
      case 'critical':
        return 'rgba(239, 68, 68, 0.15)';
      case 'non-recoverable':
        return 'rgba(124, 58, 237, 0.15)';
      case 'other':
        return 'rgba(59, 130, 246, 0.15)';
      default:
        return 'rgba(107, 114, 128, 0.15)';
    }
  };

  return (
    <div className="hardware-status">
      <div className="hardware-header">
        <h1>Hardware Health Status</h1>
        <div className="header-stats">
          <span>Total Nodes: {summary.total}</span>
        </div>
      </div>

      <div className="health-summary">
        <Card title="Health Summary">
          <div className="summary-grid">
            <div className="summary-item ok">
              <div className="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{summary.ok}</span>
                <span className="summary-label">OK</span>
              </div>
            </div>
            <div className="summary-item warning">
              <div className="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{summary.warning}</span>
                <span className="summary-label">Warning</span>
              </div>
            </div>
            <div className="summary-item critical">
              <div className="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{summary.critical}</span>
                <span className="summary-label">Critical</span>
              </div>
            </div>
            <div className="summary-item unknown">
              <div className="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{summary.unknown + (summary.other || 0)}</span>
                <span className="summary-label">Unknown/Other</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <h2>Global Status Overview</h2>
      <Card title="">
        <div className="node-health-grid">
          {nodes.map((node) => (
            <div
              key={node.node}
              className="health-node"
              style={{
                backgroundColor: getStatusBg(node.status),
                borderColor: getStatusColor(node.status),
              }}
              title={`${node.node}: ${node.statusLabel}`}
            >
              <span className="health-node-name">{node.node}</span>
              <span
                className="health-node-status"
                style={{ color: getStatusColor(node.status) }}
              >
                {node.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {(summary.warning > 0 || summary.critical > 0 || (summary.nonRecoverable || 0) > 0) && (
        <>
          <h2>Problem Nodes</h2>
          <Card title="">
            <div className="problem-nodes-list">
              {nodes
                .filter((n) => n.status === 'warning' || n.status === 'critical' || n.status === 'non-recoverable')
                .map((node) => (
                  <div
                    key={node.node}
                    className="problem-node-card"
                    style={{ borderLeftColor: getStatusColor(node.status) }}
                  >
                    <div className="problem-node-name">{node.node}</div>
                    <div
                      className="problem-node-status"
                      style={{
                        backgroundColor: getStatusBg(node.status),
                        color: getStatusColor(node.status),
                      }}
                    >
                      {node.statusLabel}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default HardwareStatusPage;
