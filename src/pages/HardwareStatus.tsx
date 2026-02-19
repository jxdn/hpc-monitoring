import React from 'react';
import { useNodes, useJobs, useClusterStats } from '../hooks/usePbsData';
import Card from '../components/dashboard/Card';
import NodeHeatmap from '../components/dashboard/NodeHeatmap';
import './HardwareStatus.css';

const HardwareStatus: React.FC = () => {
  const { nodes, loading: nodesLoading } = useNodes(60000);
  const { jobs, loading: jobsLoading } = useJobs(60000);
  const { stats, loading: statsLoading } = useClusterStats(60000);

  if (nodesLoading || jobsLoading || statsLoading) {
    return <div className="loading">Loading hardware status...</div>;
  }

  if (!nodes || !jobs || !stats) {
    return <div className="error">No hardware data available</div>;
  }

  const aisgNodes = nodes.filter(n =>
    ['hopper-46', 'hopper-43', 'hopper-45', 'hopper-44', 'hopper-42',
     'hopper-41', 'hopper-40', 'hopper-39', 'hopper-38', 'hopper-37',
     'hopper-36', 'hopper-34', 'hopper-33', 'hopper-32', 'hopper-31', 'hopper-35'].includes(n.name)
  );

  const nonAisgNodes = nodes.filter(n => !aisgNodes.some(a => a.name === n.name));

  const totalGPUs = nodes.reduce((sum, n) => sum + n.totalGpus, 0);
  const usedGPUs = nodes.reduce((sum, n) => sum + n.usedGpus, 0);
  const availableGPUs = totalGPUs - usedGPUs;

  const totalMemory = nodes.reduce((sum, n) => sum + parseFloat(n.totalMemory.replace('tb', '').trim()), 0);
  const usedMemory = nodes.reduce((sum, n) => sum + parseFloat(n.usedMemory.replace('tb', '').trim()), 0);
  const availableMemory = totalMemory - usedMemory;

  const nodeJobsData = nodes.map(n => ({
    name: n.name,
    value: n.jobs.length,
    maxValue: 8,
  }));

  const nodeGPUUsageData = nodes.map(n => ({
    name: n.name,
    value: n.usedGpus,
    maxValue: n.totalGpus,
  }));

  const nodeGPUAvailData = nodes.map(n => ({
    name: n.name,
    value: n.totalGpus - n.usedGpus,
    maxValue: n.totalGpus,
  }));

  return (
    <div className="hardware-status">
      <div className="hardware-header">
        <h1>Hardware Status</h1>
        <div className="header-stats">
          <span>Nodes: {nodes.length}</span>
          <span>Total GPUs: {totalGPUs}</span>
        </div>
      </div>

      <div className="hardware-overview">
        <Card title="GPU Overview">
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Total GPUs</span>
              <span className="overview-value">{totalGPUs}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Used GPUs</span>
              <span className="overview-value used">{usedGPUs}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Available GPUs</span>
              <span className="overview-value available">{availableGPUs}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Utilization</span>
              <span className="overview-value">{((usedGPUs / totalGPUs) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card title="Memory Overview">
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Total Memory</span>
              <span className="overview-value">{totalMemory} TB</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Used Memory</span>
              <span className="overview-value used">{usedMemory} TB</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Available Memory</span>
              <span className="overview-value available">{availableMemory} TB</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Utilization</span>
              <span className="overview-value">{((usedMemory / totalMemory) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="hardware-groups">
        <Card title="AISG Nodes">
          <div className="group-stats">
            <span>Total: {aisgNodes.length}</span>
            <span>GPUs: {aisgNodes.reduce((sum, n) => sum + n.totalGpus, 0)}</span>
            <span>Used: {aisgNodes.reduce((sum, n) => sum + n.usedGpus, 0)}</span>
          </div>
          <div className="node-list">
            {aisgNodes.map(node => (
              <div key={node.name} className="node-card">
                <div className="node-name">{node.name}</div>
                <div className="node-info">
                  <span>GPUs: {node.usedGpus}/{node.totalGpus}</span>
                  <span>Jobs: {node.jobs.length}</span>
                </div>
                <div className="node-state">{node.state}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="NUS IT Nodes">
          <div className="group-stats">
            <span>Total: {nonAisgNodes.length}</span>
            <span>GPUs: {nonAisgNodes.reduce((sum, n) => sum + n.totalGpus, 0)}</span>
            <span>Used: {nonAisgNodes.reduce((sum, n) => sum + n.usedGpus, 0)}</span>
          </div>
          <div className="node-list">
            {nonAisgNodes.map(node => (
              <div key={node.name} className="node-card">
                <div className="node-name">{node.name}</div>
                <div className="node-info">
                  <span>GPUs: {node.usedGpus}/{node.totalGpus}</span>
                  <span>Jobs: {node.jobs.length}</span>
                </div>
                <div className="node-state">{node.state}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h2>Jobs per Node</h2>
      <NodeHeatmap
        title=""
        nodes={nodeJobsData}
        valueLabel="Jobs"
      />

      <h2>GPU Usage - Realtime</h2>
      <NodeHeatmap
        title=""
        nodes={nodeGPUUsageData}
        valueLabel="GPUs"
      />

      <h2>GPU Availability - Realtime</h2>
      <NodeHeatmap
        title=""
        nodes={nodeGPUAvailData}
        valueLabel="GPUs Available"
        isAvailability={true}
      />
    </div>
  );
};

export default HardwareStatus;