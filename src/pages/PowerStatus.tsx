import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePowerStatus, usePowerHistory } from '../hooks/usePbsData';
import Card from '../components/dashboard/Card';
import './HardwareStatus.css';

type TimeRange = '1d' | '7d' | '30d';

const PowerStatusPage: React.FC = () => {
  const [powerTimeRange, setPowerTimeRange] = useState<TimeRange>('7d');
  const { powerStatus, loading: powerLoading, error: powerError } = usePowerStatus(180000);
  const { powerHistory, loading: historyLoading } = usePowerHistory(powerTimeRange);

  if (powerLoading) {
    return <div className="loading">Loading power status...</div>;
  }

  if (powerError) {
    return <div className="error">Error: {powerError.message}</div>;
  }

  if (!powerStatus) {
    return <div className="error">No power data available</div>;
  }

  const getPowerColor = (watts: number) => {
    if (watts === 0) return '#6b7280';
    if (watts < 3000) return '#10b981';
    if (watts <= 5000) return '#f59e0b';
    return '#ef4444';
  };

  const getPowerBg = (watts: number) => {
    if (watts === 0) return 'rgba(107, 114, 128, 0.15)';
    if (watts < 3000) return 'rgba(16, 185, 129, 0.15)';
    if (watts <= 5000) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(239, 68, 68, 0.15)';
  };

  const formatPower = (watts: number) => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`;
    }
    return `${watts} W`;
  };

  const avgPower = powerHistory.length > 0
    ? Math.round(powerHistory.reduce((sum, p) => sum + p.total, 0) / powerHistory.length)
    : 0;
  const maxPower = powerHistory.length > 0
    ? Math.max(...powerHistory.map(p => p.total))
    : 0;
  const minPower = powerHistory.length > 0
    ? Math.min(...powerHistory.map(p => p.total))
    : 0;

  return (
    <div className="hardware-status">
      <div className="hardware-header">
        <h1>Power Consumption</h1>
        <div className="header-stats">
          <span>Total Nodes: {powerStatus.nodes.length}</span>
        </div>
      </div>

      <div className="health-summary">
        <Card title="Power Summary">
          <div className="summary-grid">
            <div className="summary-item power">
              <div className="summary-icon" style={{ color: '#10b981' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{formatPower(powerStatus.total)}</span>
                <span className="summary-label">Current</span>
              </div>
            </div>
            <div className="summary-item power">
              <div className="summary-icon" style={{ color: '#3b82f6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{formatPower(avgPower)}</span>
                <span className="summary-label">Average</span>
              </div>
            </div>
            <div className="summary-item power">
              <div className="summary-icon" style={{ color: '#ef4444' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{formatPower(maxPower)}</span>
                <span className="summary-label">Peak</span>
              </div>
            </div>
            <div className="summary-item power">
              <div className="summary-icon" style={{ color: '#6b7280' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
              </div>
              <div className="summary-content">
                <span className="summary-value">{formatPower(minPower)}</span>
                <span className="summary-label">Minimum</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <h2>Power Consumption Trend</h2>
      <Card title="">
        <div className="power-controls">
          <div className="time-range-selector">
            <button
              className={powerTimeRange === '1d' ? 'active' : ''}
              onClick={() => setPowerTimeRange('1d')}
            >
              Today
            </button>
            <button
              className={powerTimeRange === '7d' ? 'active' : ''}
              onClick={() => setPowerTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              className={powerTimeRange === '30d' ? 'active' : ''}
              onClick={() => setPowerTimeRange('30d')}
            >
              30 Days
            </button>
          </div>
        </div>

        {!historyLoading && powerHistory.length > 0 && (
          <div className="power-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={powerHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}kW`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value: number) => [formatPower(value), 'Power']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Total Power"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <h2>Per-Node Power Consumption</h2>
      <Card title="">
        <div className="node-health-grid">
          {powerStatus.nodes.map((node) => (
            <div
              key={node.node}
              className="health-node"
              style={{
                backgroundColor: getPowerBg(node.watts),
                borderColor: getPowerColor(node.watts),
              }}
              title={`${node.node}: ${formatPower(node.watts)}`}
            >
              <span className="health-node-name">{node.node}</span>
              <span
                className="health-node-status"
                style={{ color: getPowerColor(node.watts) }}
              >
                {formatPower(node.watts)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PowerStatusPage;
