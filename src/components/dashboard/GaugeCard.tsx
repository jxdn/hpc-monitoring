import React from 'react';
import './GaugeCard.css';

interface GaugeCardProps {
  title: string;
  value: number;
  unit?: string;
}

const GaugeCard: React.FC<GaugeCardProps> = ({ title, value, unit = '%' }) => {
  const getColor = (val: number) => {
    if (val >= 80) return '#E24D42';
    if (val >= 60) return '#EF843C';
    if (val >= 40) return '#EAB839';
    if (val >= 20) return '#6ED0E0';
    return '#10b981';
  };

  const color = getColor(value);

  return (
    <div className="gauge-card">
      <h3 className="gauge-title">{title}</h3>
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
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
        <div className="gauge-value" style={{ color }}>
          {value.toFixed(1)}{unit}
        </div>
      </div>
    </div>
  );
};

export default GaugeCard;
