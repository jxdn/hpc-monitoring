import React from 'react';
import './GaugeCard.css';

interface GaugeCardProps {
  title: string;
  value: number;
  unit?: string;
}

const GaugeCard: React.FC<GaugeCardProps> = ({ title, value, unit = '%' }) => {
  const getValueInfo = (val: number) => {
    if (val > 90) return { className: 'critical', color: '#ef4444', label: 'Critical' };
    if (val > 80) return { className: 'high', color: '#f97316', label: 'High' };
    if (val > 50) return { className: 'medium', color: '#eab308', label: 'Medium' };
    return { className: 'low', color: '#10b981', label: 'Normal' };
  };

  const { className, color, label } = getValueInfo(value);

  return (
    <div className={`gauge-card gauge-${className}`}>
      <div className="gauge-header">
        <h3 className="gauge-title">{title}</h3>
        <span className={`gauge-status status-${className}`}>{label}</span>
      </div>
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            className="gauge-bg"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`}
            className="gauge-fill"
          />
        </svg>
        <div className="gauge-value">
          <span className="gauge-number">{value.toFixed(1)}</span>
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeCard;
