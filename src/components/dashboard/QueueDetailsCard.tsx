import React from 'react';
import './QueueDetailsCard.css';

interface QueueDetail {
  name: string;
  running: number;
  queued: number;
  avgWaitMinutes?: number;
  total: number;
  queueType?: 'AISG' | 'NUS-IT';
}

interface QueueDetailsCardProps {
  queues: QueueDetail[];
  title?: string;
}

const QueueDetailsCard: React.FC<QueueDetailsCardProps> = ({ queues, title = 'Queue Details' }) => {
  const getWaitTimeStatus = (minutes?: number): { label: string; className: string } => {
    if (minutes === undefined) return { label: 'N/A', className: 'status-unknown' };
    if (minutes < 15) return { label: `${minutes.toFixed(0)}m`, className: 'status-good' };
    if (minutes < 30) return { label: `${minutes.toFixed(0)}m`, className: 'status-medium' };
    if (minutes < 60) return { label: `${minutes.toFixed(0)}m`, className: 'status-warning' };
    const hours = (minutes / 60).toFixed(1);
    return { label: `${hours}h`, className: 'status-critical' };
  };

  const getUtilizationPercent = (running: number, queued: number): number => {
    const total = running + queued;
    if (total === 0) return 0;
    return Math.min(100, (running / total) * 100);
  };

  const firstRow = queues.slice(0, 5);
  const secondRow = queues.slice(5, 9);

  const renderQueueItem = (queue: QueueDetail) => {
    const waitStatus = getWaitTimeStatus(queue.avgWaitMinutes);
    const utilization = getUtilizationPercent(queue.running, queue.queued);
    
    return (
      <div key={queue.name} className="queue-detail-item">
        <div className="queue-detail-header">
          <div className="queue-name-row">
            <span className="queue-detail-name">{queue.name}</span>
            {queue.queueType && (
              <span className={`queue-type-tag ${queue.queueType.toLowerCase().replace('-', '')}`}>
                {queue.queueType}
              </span>
            )}
          </div>
          <div className={`wait-time-badge ${waitStatus.className}`}>
            <svg viewBox="0 0 24 24" fill="none" className="wait-icon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {waitStatus.label}
          </div>
        </div>
        
        <div className="queue-progress-container">
          <div className="queue-progress-bar">
            <div 
              className="queue-progress-running" 
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
        
        <div className="queue-stats-row">
          <div className="queue-stat">
            <span className="stat-label">Running</span>
            <span className="stat-value running">{queue.running}</span>
          </div>
          <div className="queue-stat">
            <span className="stat-label">Queued</span>
            <span className="stat-value queued">{queue.queued}</span>
          </div>
          <div className="queue-stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{queue.total}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="queue-details-card">
      <div className="queue-details-header">
        <h3 className="queue-details-title">{title}</h3>
        <div className="queue-legend">
          <div className="legend-item">
            <span className="legend-dot running"></span>
            <span>Running</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot queued"></span>
            <span>Queued</span>
          </div>
        </div>
      </div>
      
      <div className="queue-details-row">
        {firstRow.map(renderQueueItem)}
      </div>
      
      {secondRow.length > 0 && (
        <div className="queue-details-row queue-details-row-second">
          {secondRow.map(renderQueueItem)}
          <div className="queue-detail-item queue-placeholder" style={{ visibility: 'hidden' }}></div>
        </div>
      )}
    </div>
  );
};

export default QueueDetailsCard;
