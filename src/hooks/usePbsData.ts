import { useState, useEffect } from 'react';
import { pbsApi } from '../services/pbsApi';
import type { Job, Node, Queue, ClusterStats, AggregatedJobData } from '../types/pbs';

export const useJobs = (refreshInterval?: number) => {
  const [jobs, setJobs] = useState<AggregatedJobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    if (refreshInterval) {
      const interval = setInterval(fetchJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { jobs, loading, error, refetch: fetchJobs };
};

export const useNodes = (refreshInterval?: number) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getNodes();
      setNodes(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();

    if (refreshInterval) {
      const interval = setInterval(fetchNodes, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { nodes, loading, error, refetch: fetchNodes };
};

export const useQueues = (refreshInterval?: number) => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getQueues();
      setQueues(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    if (refreshInterval) {
      const interval = setInterval(fetchQueues, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { queues, loading, error, refetch: fetchQueues };
};

export const useClusterStats = (refreshInterval?: number) => {
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getClusterStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (refreshInterval) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
};
