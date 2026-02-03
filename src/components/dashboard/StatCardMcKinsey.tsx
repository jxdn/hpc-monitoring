/**
 * McKinsey-style Stat Card Component
 * Professional, clean design with subtle animations
 */

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'mckinsey-blue' | 'mckinsey-teal' | 'mckinsey-green' | 'mckinsey-orange' | 'mckinsey-gray';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'mckinsey-blue',
  onClick
}) => {
  const getColor = () => {
    const colors = {
      'mckinsey-blue': {
        bg: '#e6f2ff',
        border: '#99c7ff',
        text: '#0066cc',
        hoverBg: '#cce5ff',
        hoverColor: '#0055bb',
        gradient: '#e6f2ff'
      },
      'mckinsey-teal': {
        bg: '#e6fffa',
        border: '#99f6e6',
        text: '#00897b',
        hoverBg: '#b7f4e6',
        hoverColor: '#006666',
        gradient: '#e6fffa'
      },
      'mckinsey-green': {
        bg: '#dcfce7',
        border: '#86efac',
        text: '#00a86e6',
        hoverBg: '#b7f4e6',
        hoverColor: '#00705a',
        gradient: '#dcfce7'
      },
      'mckinsey-orange': {
        bg: '#fef3c7',
        border: '#fcd34d',
        text: '#f59e0b',
        hoverBg: '#fde68a',
        hoverColor: '#d97706',
        gradient: '#fef3c7'
      },
      'mckinsey-gray': {
        bg: '#f5f5f5',
        border: '#d1d5db',
        text: '#6b7280',
        hoverBg: '#e5e5e5',
        hoverColor: '#0f1728',
        gradient: '#f5f5f5'
      }
    };
    return colors[color as keyof typeof colors] || colors['mckinsey-blue'];
  };

  const formatTrendValue = () => {
    if (!trendValue) return '';
    const [number] = trendValue.match(/-?\d+(\.\d+)?/);
    if (!number) return trendValue;
    const numValue = parseFloat(number);
    const isPositive = numValue > 0;
    const isNegative = numValue < 0;
    const isZero = numValue === 0;
    if (isZero) return trendValue;
    return `${isPositive ? '+' : ''}${Math.abs(numValue)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div
      className="stat-card-component"
      onClick={onClick}
      style={{
        backgroundColor: getColor().gradient,
        borderColor: getColor().border,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '24px 28px 24px'
        }}
      >
        <div>
          <p
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: getColor().text,
              fontWeight: '500',
              marginBottom: '8px',
              margin: 0'
            }}
          >
            {title}
          </p>
          <h3
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: getColor().text,
              margin: '0',
              letterSpacing: '-0.01em'
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: getColor().text,
                fontWeight: '400',
                margin: '0',
                opacity: 0.75
              }}
            >
              {subtitle}
            </p>
        </div>
        {icon && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              filter: 'brightness(1)'
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend && trendValue) && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            fontWeight: '500',
            padding: '4px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            marginBottom: 0,
            marginLeft: '24px'
          }}
        >
          <span
            style={{
              color:
                trend === 'up'
                  ? '#00897b'
                  : trend === 'down'
                  ? '#dc2626'
                  : '#6b7280'
            }}
          >
            {getTrendIcon()}
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {formatTrendValue()}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;