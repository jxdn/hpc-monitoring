export interface Job {
  id: string;
  name: string;
  user: string;
  status: 'Q' | 'R' | 'H' | 'E' | 'F'; // Queued, Running, Hold, Exiting, Finished
  queue: string;
  nodes: number;
  cpus: number;
  memory: string;
  walltime: string;
  elapsedTime: string;
  submissionTime: string;
  startTime?: string;
  endTime?: string;
}

// Aggregated job data from Prometheus (not individual jobs)
export interface AggregatedJobData {
  summary: {
    total: number;
    running: number;
    queued: number;
    hold: number;
  };
  byUser: Array<{
    user: string;
    count: number;
  }>;
  byQueue: Array<{
    queue: string;
    count: number;
  }>;
}

export interface Node {
  id: string;
  name: string;
  state: 'free' | 'busy' | 'down' | 'offline' | 'job-exclusive';
  totalCpus: number;
  usedCpus: number;
  totalGpus: number;
  usedGpus: number;
  totalMemory: string;
  usedMemory: string;
  jobs: string[];
  properties: string[];
}

export interface Queue {
  name: string;
  enabled: boolean;
  started: boolean;
  totalJobs: number;
  runningJobs: number;
  queuedJobs: number;
  maxRunning?: number;
  priority: number;
}

export interface ClusterStats {
  totalNodes: number;
  busyNodes: number;
  freeNodes: number;
  downNodes: number;
  totalJobs: number;
  runningJobs: number;
  queuedJobs: number;
  totalGpus: number;
  usedGpus: number;
  gpuUtilization: number;
}

export interface JobStats {
  timestamp: string;
  totalJobs: number;
  runningJobs: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface ResourceUtilization {
  timestamp: string;
  gpuUtilization: number;
  memoryUtilization: number;
  nodeUtilization: number;
}
