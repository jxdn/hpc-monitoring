import React from 'react';
import './MetricRowCard.css';

interface SecondaryStat {
  label: string;
  value: string | number;
}

interface MetricColumn {
  label: string;
  color: string;
  primaryValue: string | number;
  secondaryStats?: SecondaryStat[];
}

interface MetricRowCardProps {
  title: string;
  columns: MetricColumn[];
}

const MetricRowCard: React.FC<MetricRowCardProps> = ({ title, columns }) => {
  return (
    <div className="metric-row-card">
      <div className="metric-row-card-header">
        <h3 className="metric-row-card-title">{title}</h3>
      </div>
      <div className="metric-columns">
        {columns.map((column, index) => (
          <div 
            key={column.label} 
            className={`metric-column ${index < columns.length - 1 ? 'has-border' : ''}`}
          >
            <div className="column-header" style={{ color: column.color }}>
              {column.label}
            </div>
            <div className="column-primary">
              <span className="primary-value" style={{ color: column.color }}>{column.primaryValue}</span>
            </div>
            {column.secondaryStats && column.secondaryStats.length > 0 && (
              <div className="column-secondary">
                {column.secondaryStats.map((stat, statIndex) => (
                  <div key={statIndex} className="secondary-stat">
                    <span className="secondary-value">{stat.value}</span>
                    <span className="secondary-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricRowCard;
