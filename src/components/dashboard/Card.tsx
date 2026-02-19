import React from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  compact?: boolean;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', variant = 'default', compact = false }) => {
  return (
    <div className={`card card-${variant} ${className}`}>
      {title && (
        <div className={`card-header${compact ? ' compact' : ''}`}>
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className={`card-body${compact ? ' compact' : ''}`}>{children}</div>
    </div>
  );
};

export default Card;
