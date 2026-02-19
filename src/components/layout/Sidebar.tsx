import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Global Status' },
    { path: '/hardware', label: 'Hardware Status' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-container">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Menu</h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link to={item.path} className={`nav-link ${isActive(item.path) ? 'active' : ''}`}>
                  <span className="nav-label">{item.label}</span>
                  {isActive(item.path) && <span className="nav-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <span className="footer-label">HPC Monitoring</span>
            <span className="footer-version">v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;