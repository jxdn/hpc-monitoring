import React from 'react';
import './NodeHeatmap.css';

interface NodeData {
  name: string;
  value: number;
  maxValue: number;
}

interface NodeHeatmapProps {
  title: string;
  nodes: NodeData[];
  valueLabel?: string;
  isAvailability?: boolean;
}

const NodeHeatmap: React.FC<NodeHeatmapProps> = ({ title, nodes, valueLabel = 'Jobs', isAvailability = false }) => {
  const getColorData = (value: number, maxValue: number) => {
    if (maxValue === 0) {
      return {
        bg: 'rgba(6, 182, 212, 0.3)',
        border: 'rgba(6, 182, 212, 0.6)',
        text: '#22d3ee',
        glow: 'rgba(6, 182, 212, 0.4)'
      };
    }

    const ratio = isAvailability ? (1 - value / maxValue) : (value / maxValue);

    if (ratio === 0) {
      return {
        bg: 'rgba(6, 182, 212, 0.25)',
        border: 'rgba(6, 182, 212, 0.5)',
        text: '#22d3ee',
        glow: 'rgba(6, 182, 212, 0.3)'
      };
    }
    if (ratio <= 0.2) {
      return {
        bg: 'rgba(16, 185, 129, 0.25)',
        border: 'rgba(16, 185, 129, 0.5)',
        text: '#34d399',
        glow: 'rgba(16, 185, 129, 0.3)'
      };
    }
    if (ratio <= 0.4) {
      return {
        bg: 'rgba(59, 130, 246, 0.25)',
        border: 'rgba(59, 130, 246, 0.5)',
        text: '#60a5fa',
        glow: 'rgba(59, 130, 246, 0.3)'
      };
    }
    if (ratio <= 0.6) {
      return {
        bg: 'rgba(139, 92, 246, 0.25)',
        border: 'rgba(139, 92, 246, 0.5)',
        text: '#a78bfa',
        glow: 'rgba(139, 92, 246, 0.3)'
      };
    }
    if (ratio <= 0.8) {
      return {
        bg: 'rgba(245, 158, 11, 0.25)',
        border: 'rgba(245, 158, 11, 0.5)',
        text: '#fbbf24',
        glow: 'rgba(245, 158, 11, 0.3)'
      };
    }
    return {
      bg: 'rgba(239, 68, 68, 0.25)',
      border: 'rgba(239, 68, 68, 0.5)',
      text: '#f87171',
      glow: 'rgba(239, 68, 68, 0.3)'
    };
  };

  const getTextValue = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'Free';

    if (isAvailability) {
      if (value === 0) return 'Full';
      if (value === maxValue) return value.toString();
      return value.toString();
    } else {
      if (value === maxValue) return 'Full';
      return value.toString();
    }
  };

  const formatNodeName = (name: string) => {
    const match = name.match(/hopper-(\d+)/);
    if (match) {
      const number = parseInt(match[1]);
      return `hopper-${number.toString().padStart(2, '0')}`;
    }
    return name;
  };

  return (
    <div className="node-heatmap-container">
      {title && <h3 className="heatmap-title">{title}</h3>}
      <div className="node-heatmap">
        {nodes.map((node) => {
          const displayName = formatNodeName(node.name);
          const colorData = getColorData(node.value, node.maxValue);
          
          return (
            <div
              key={node.name}
              className="node-cell"
              style={{
                background: colorData.bg,
                borderColor: colorData.border,
                color: colorData.text,
                '--cell-glow': colorData.glow
              } as React.CSSProperties}
              title={`${displayName}: ${node.value}/${node.maxValue} ${valueLabel}`}
            >
              <div className="node-name">{displayName}</div>
              <div className="node-value">{getTextValue(node.value, node.maxValue)}</div>
            </div>
          );
        })}
      </div>
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(6, 182, 212, 0.25)', borderColor: 'rgba(6, 182, 212, 0.5)' }}></div>
          <span>Free</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.5)' }}></div>
          <span>Low</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(59, 130, 246, 0.25)', borderColor: 'rgba(59, 130, 246, 0.5)' }}></div>
          <span>Medium</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(139, 92, 246, 0.25)', borderColor: 'rgba(139, 92, 246, 0.5)' }}></div>
          <span>High</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.5)' }}></div>
          <span>Busy</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.5)' }}></div>
          <span>Full</span>
        </div>
      </div>
    </div>
  );
};

export default NodeHeatmap;
