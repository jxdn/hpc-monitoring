import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ClusterDashboard from './pages/ClusterDashboard';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Nodes from './pages/Nodes';
import Analytics from './pages/Analytics';

const App: React.FC = () => {
  return (
    <Router basename="/status">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ClusterDashboard />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
