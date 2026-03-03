import axios from 'axios';
import type { Node, Queue, ClusterStats, AggregatedJobData, JobStats, ResourceUtilization } from '../types/pbs';

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

export const vandaApi = {
  // Jobs
  async getJobs(): Promise<AggregatedJobData> {
    const response = await api.get<AggregatedJobData>('/vanda/jobs');
    return response.data;
  },

  // Nodes
  async getNodes(): Promise<Node[]> {
    const response = await api.get<Node[]>('/vanda/nodes');
    return response.data;
  },

  // Queues
  async getQueues(): Promise<Queue[]> {
    const response = await api.get<Queue[]>('/vanda/queues');
    return response.data;
  },

  // Cluster Stats
  async getClusterStats(): Promise<ClusterStats> {
    const response = await api.get<ClusterStats>('/vanda/stats/cluster');
    return response.data;
  },

  // Analytics (VictoriaMetrics)
  async getJobStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<JobStats[]> {
    const response = await api.get<JobStats[]>('/vanda/analytics/jobs', {
      params: { timeRange },
    });
    return response.data;
  },

  async getResourceUtilization(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ResourceUtilization[]> {
    const response = await api.get<ResourceUtilization[]>('/vanda/analytics/resources', {
      params: { timeRange },
    });
    return response.data;
  },

  // Single overall GPU occupation gauge (no AISG/NUS-IT split for Vanda)
  async getGPUOccupation(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<Array<{ timestamp: string; overall: number }>> {
    const response = await api.get<Array<{ timestamp: string; overall: number }>>('/vanda/analytics/gpu-occupation', {
      params: { timeRange },
    });
    return response.data;
  },

  // Analytics (XDMoD / MySQL)
  async getGPUUsageByUser(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    username: string;
    numJobs: number;
    totalGpusUsed: number;
    avgGpusPerJob: string;
    totalGpuHours: string;
    avgGpuHoursPerJob: string;
  }>> {
    const response = await api.get('/vanda/analytics/gpu-usage-by-user', {
      params: { timeRange },
    });
    return response.data;
  },

  async getCPUUsageByUser(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    username: string;
    numJobs: number;
    totalCpusUsed: number;
    avgCpusPerJob: string;
    totalCpuHours: string;
    avgCpuHoursPerJob: string;
  }>> {
    const response = await api.get('/vanda/analytics/cpu-usage-by-user', {
      params: { timeRange },
    });
    return response.data;
  },

  async getJobStatsLast7Days(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    jobDate: string;
    numJobs: number;
    totalGpuHours: string;
  }>> {
    const response = await api.get('/vanda/analytics/job-stats', {
      params: { timeRange },
    });
    return response.data;
  },

  // GPU queue wait time for Vanda (batch_gpu, gpu, gpu_amd, interactive_gpu)
  async getAISGWaitTime(timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    date: string;
    queueName: string;
    numJobs: number;
    totalGpuHours: number;
    avgGpuHoursPerJob: number;
    avgWaitMinutes: number;
  }>> {
    const response = await api.get('/vanda/analytics/aisg-wait-time', {
      params: { timeRange },
    });
    return response.data;
  },

  // Vanda has no NUS-IT queues — always returns []
  async getNUSITWaitTime(_timeRange: '1d' | '7d' | '30d' = '7d'): Promise<Array<{
    date: string;
    queueName: string;
    numJobs: number;
    totalGpuHours: number;
    avgGpuHoursPerJob: number;
    avgWaitMinutes: number;
  }>> {
    return [];
  },

  async getMonthlyGPUHours(): Promise<Array<{
    month: string;
    gpuHours: string;
  }>> {
    const response = await longTimeoutApi.get('/vanda/analytics/monthly-gpu-hours');
    return response.data;
  },
};

export default vandaApi;
