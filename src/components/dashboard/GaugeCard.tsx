import React from 'react';
import './GaugeCard.css';

interface GaugeCardProps {
  title: string;
  value: number;
  unit?: string;
}

const GaugeCard: React.FC<GaugeCardProps> = ({ title, value, unit = '%' }) => {
  const getValueInfo = (val: number) => {
    if (val > 90) return { 
      level: 'critical', 
      color: '#ef4444', 
      glowColor: 'rgba(239, 68, 68, 0.4)',
      label: 'Critical' 
    };
    if (val > 75) return { 
      level: 'high', 
      color: '#f59e0b', 
      glowColor: 'rgba(245, 158, 11, 0.4)',
      label: 'High' 
    };
    if (val > 50) return { 
      level: 'medium', 
      color: '#06b6d4', 
      glowColor: 'rgba(6, 182, 212, 0.4)',
      label: 'Medium' 
    };
    return { 
      level: 'low', 
      color: '#10b981', 
      glowColor: 'rgba(16, 185, 129, 0.4)',
      label: 'Normal' 
    };
  };

  const { level, color, glowColor, label } = getValueInfo(value);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`gauge-card gauge-${level}`}>
      <div className="gauge-header">
        <span className="gauge-title">{title}</span>
        <span className={`gauge-badge badge-${level}`}>{label}</span>
      </div>
      
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 160 160">
          <defs>
            <linearGradient id={`gradient-${level}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={level === 'low' ? '#34d399' : level === 'medium' ? '#22d3ee' : level === 'high' ? '#fbbf24' : '#f87171'} />
            </linearGradient>
            <filter id={`glow-${level}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle
            className="gauge-track"
            cx="80"
            cy="80"
            r="70"
          />
          <circle
            className="gauge-progress"
            cx="80"
            cy="80"
            r="70"
            stroke={`url(#gradient-${level})`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>
        
        <div className="gauge-center">
          <span className="gauge-value">{value.toFixed(1)}</span>
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>
      
      <div className="gauge-footer">
        <div className="gauge-markers">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeCard;
