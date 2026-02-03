import axios from 'axios';
import type { Job, Node, Queue, ClusterStats, JobStats, ResourceUtilization, AggregatedJobData } from '../types/pbs';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const longTimeoutApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pbsApi = {
  // Jobs (now returns aggregated data from Prometheus)
  async getJobs(): Promise<AggregatedJobData> {
    const response = await api.get<AggregatedJobData>('/jobs');
    return response.data;
  },

  async getJob(jobId: string): Promise<Job> {
    const response = await api.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/jobs/${jobId}`);
  },

  async holdJob(jobId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/hold`);
  },

  async releaseJob(jobId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/release`);
  },

  // Nodes
  async getNodes(): Promise<Node[]> {
    const response = await api.get<Node[]>('/nodes');
    return response.data;
  },

  async getNode(nodeId: string): Promise<Node> {
    const response = await api.get<Node>(`/nodes/${nodeId}`);
    return response.data;
  },

  // Queues
  async getQueues(): Promise<Queue[]> {
    const response = await api.get<Queue[]>('/queues');
    return response.data;
  },

  // Cluster Stats
  async getClusterStats(): Promise<ClusterStats> {
    const response = await api.get<ClusterStats>('/stats/cluster');
    return response.data;
  },

  // Analytics
  async getJobStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<JobStats[]> {
    const response = await api.get<JobStats[]>('/analytics/jobs', {
      params: { timeRange },
    });
    return response.data;
  },

  async getResourceUtilization(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ResourceUtilization[]> {
    const response = await api.get<ResourceUtilization[]>('/analytics/resources', {
      params: { timeRange },
    });
    return response.data;
  },

  async getGPUOccupation(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<Array<{ timestamp: string; overall: number; aisg: number; nonAisg: number }>> {
    const response = await api.get<Array<{ timestamp: string; overall: number; aisg: number; nonAisg: number }>>('/analytics/gpu-occupation', {
      params: { timeRange },
    });
    return response.data;
  },

  async getGPUUsageByUser(): Promise<Array<{
    username: string;
    numJobs: number;
    totalGpusUsed: number;
    avgGpusPerJob: string;
    totalGpuHours: string;
    avgGpuHoursPerJob: string;
  }>> {
    const response = await api.get('/analytics/gpu-usage-by-user');
    return response.data;
  },

  async getJobStatsLast7Days(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    jobDate: string;
    numJobs: number;
    totalGpuHours: string;
  }>> {
    const response = await api.get('/analytics/job-stats', {
      params: { timeRange },
    });
    return response.data;
  },

  async getAISGWaitTime(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    date: string;
    queueName: string;
    numJobs: number;
    totalGpuHours: number;
    avgGpuHoursPerJob: number;
    avgWaitMinutes: number;
  }>> {
    const response = await api.get('/analytics/aisg-wait-time', {
      params: { timeRange },
    });
    return response.data;
  },

  async getNUSITWaitTime(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    date: string;
    queueName: string;
    numJobs: number;
    totalGpuHours: number;
    avgGpuHoursPerJob: number;
    avgWaitMinutes: number;
  }>> {
    const response = await api.get('/analytics/nusit-wait-time', {
      params: { timeRange },
    });
    return response.data;
  },

  async getMonthlyGPUHours(): Promise<Array<{
    month: string;
    gpuHours: string;
  }>> {
    const response = await longTimeoutApi.get('/analytics/monthly-gpu-hours');
    return response.data;
  },
};

export default pbsApi;
