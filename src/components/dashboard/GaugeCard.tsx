import React from 'react';
import './GaugeCard.css';

interface GaugeCardProps {
  title: string;
  value: number;
  unit?: string;
}

const GaugeCard: React.FC<GaugeCardProps> = ({ title, value, unit = '%' }) => {
  const getValueClass = (val: number) => {
    if (val > 90) return 'critical-value';
    if (val > 80) return 'high-value';
    if (val > 50) return 'medium-value';
    return 'low-value';
  };

  const getValueColor = (val: number) => {
    if (val > 90) return '#dc2626';      // Red
    if (val > 80) return '#f97316';      // Orange
    if (val > 50) return '#eab308';      // Yellow
    return '#3fb950';                  // Green
  };

  const valueClass = getValueClass(value);
  const color = getValueColor(value);

  return (
    <div className={`gauge-card ${valueClass}`}>
      <h3 className="gauge-title">{title}</h3>
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            className="gauge-bg"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`}
            className="gauge-fill"
          />
        </svg>
        <div className="gauge-value">
          {value.toFixed(1)}{unit}
        </div>
      </div>
    </div>
  );
};

export default GaugeCard;
