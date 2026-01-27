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
  isAvailability?: boolean; // If true, colors are inverted (0 = red/full, max = green/free)
}

const NodeHeatmap: React.FC<NodeHeatmapProps> = ({ title, nodes, valueLabel = 'Jobs', isAvailability = false }) => {
  const getColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return '#10b981'; // green for 0/0 (free)

    // For availability: 0 means full (red), maxValue means free (green)
    // For usage: 0 means free (green), maxValue means full (red)
    const ratio = isAvailability ? (1 - value / maxValue) : (value / maxValue);

    if (ratio === 0) return '#10b981'; // green
    if (ratio <= 0.125) return '#D3F9D8'; // super-light-green
    if (ratio <= 0.25) return '#FEF3C7'; // super-light-yellow
    if (ratio <= 0.375) return '#FCD34D'; // dark-yellow
    if (ratio <= 0.5) return '#EAB839'; // yellow
    if (ratio <= 0.75) return '#EF843C'; // dark-orange
    if (ratio <= 0.875) return '#F87171'; // light-red
    if (ratio < 1) return '#EF4444'; // red
    return '#DC2626'; // dark-red
  };

  const getTextValue = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'Free';

    if (isAvailability) {
      // For availability: 0 available = Full, maxValue available = Free/show number
      if (value === 0) return 'Full';
      if (value === maxValue) return value.toString(); // Show 8 when all are available
      return value.toString();
    } else {
      // For usage: value = maxValue means Full
      if (value === maxValue) return 'Full';
      return value.toString();
    }
  };

  const formatNodeName = (name: string) => {
    // Extract node number and format with leading zero (e.g., "hopper-1" -> "hopper-01")
    const match = name.match(/hopper-(\d+)/);
    if (match) {
      const number = parseInt(match[1]);
      return `hopper-${number.toString().padStart(2, '0')}`;
    }
    return name;
  };

  return (
    <div className="node-heatmap-container">
      <h3 className="heatmap-title">{title}</h3>
      <div className="node-heatmap">
        {nodes.map((node) => {
          const displayName = formatNodeName(node.name);
          return (
            <div
              key={node.name}
              className="node-cell"
              style={{ backgroundColor: getColor(node.value, node.maxValue) }}
              title={`${displayName}: ${node.value}/${node.maxValue} ${valueLabel}`}
            >
              <div className="node-name">{displayName}</div>
              <div className="node-value">{getTextValue(node.value, node.maxValue)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodeHeatmap;
