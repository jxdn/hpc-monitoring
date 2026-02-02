import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LayoutNew from './components/layout/LayoutNew';
import Landing from './pages/Landing';
import Dashboard from './pages/DashboardNew';
import ClusterDashboard from './pages/ClusterDashboard';
import Jobs from './pages/Jobs';
import Nodes from './pages/Nodes';
import Analytics from './pages/Analytics';
import DebugDashboard from './pages/DebugDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/debug" element={<DebugDashboard />} />
        <Route path="/" element={<Landing />} />
        <Route path="/" element={<LayoutNew />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cluster" element={<ClusterDashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="nodes" element={<Nodes />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
