import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { 
      path: '/', 
      label: 'Global Status',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16V12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M11 16V8" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M15 16V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M19 16V10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      path: '/hardware', 
      label: 'Hardware Status',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-label">Navigation</span>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-label">{item.label}</span>
            {isActive(item.path) && <div className="nav-active-indicator" />}
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="footer-content">
          <div className="footer-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="footer-text">
            <span className="footer-title">HPC Monitor</span>
            <span className="footer-version">v2.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
