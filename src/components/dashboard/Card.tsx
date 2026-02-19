import React from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
}

const Card: React.FC<CardProps> = ({ title, children, className = '', variant = 'default' }) => {
  return (
    <div className={`card card-${variant} ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
