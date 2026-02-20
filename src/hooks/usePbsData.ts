import { useState, useEffect } from 'react';
import { pbsApi } from '../services/pbsApi';
import type { Node, Queue, ClusterStats, AggregatedJobData, HardwareStatus, PowerStatus, PowerHistoryPoint } from '../types/pbs';

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

export const useHardwareStatus = (refreshInterval?: number) => {
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHardwareStatus = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getHardwareStatus();
      setHardwareStatus(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardwareStatus();

    if (refreshInterval) {
      const interval = setInterval(fetchHardwareStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { hardwareStatus, loading, error, refetch: fetchHardwareStatus };
};

export const usePowerStatus = (refreshInterval?: number) => {
  const [powerStatus, setPowerStatus] = useState<PowerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPowerStatus = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getPowerStatus();
      setPowerStatus(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerStatus();

    if (refreshInterval) {
      const interval = setInterval(fetchPowerStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { powerStatus, loading, error, refetch: fetchPowerStatus };
};

export const usePowerHistory = (range: 'yesterday' | '1d' | '7d' | '30d' = '7d') => {
  const [powerHistory, setPowerHistory] = useState<PowerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPowerHistory = async () => {
    try {
      setLoading(true);
      const data = await pbsApi.getPowerHistory(range);
      setPowerHistory(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerHistory();
  }, [range]);

  return { powerHistory, loading, error, refetch: fetchPowerHistory };
};
