import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import GlobalStatus from './pages/GlobalStatus';
import ClusterDashboard from './pages/ClusterDashboard';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Nodes from './pages/Nodes';
import Analytics from './pages/Analytics';
import HardwareStatus from './pages/HardwareStatus';
import PowerStatus from './pages/PowerStatus';
import Vanda from './pages/Vanda';

const App: React.FC = () => {
  return (
    <Router basename="/status">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<GlobalStatus />} />
          <Route path="hopper" element={<ClusterDashboard />} />
          <Route path="vanda" element={<Vanda />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="hardware" element={<HardwareStatus />} />
          <Route path="power" element={<PowerStatus />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
