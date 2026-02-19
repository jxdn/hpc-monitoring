import React from 'react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        {trend && (
          <div className={`stat-trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
            <svg viewBox="0 0 24 24" fill="none" className="trend-icon">
              {trend.isPositive ? (
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M7 7L17 17M17 17H7M17 17V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="stat-glow"></div>
    </div>
  );
};

export default StatCard;
