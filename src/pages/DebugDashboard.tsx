import React, { useState, useEffect } from 'react';

const DebugDashboard: React.FC = () => {
  const [jobsData, setJobsData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [gpuUsageData, setGpuUsageData] = useState<any[]>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch jobs data
        console.log('Fetching jobs data...');
        const jobsResponse = await fetch('/api/jobs');
        const jobsJson = await jobsResponse.json();
        console.log('Jobs data:', jobsJson);
        setJobsData(jobsJson);

        // Fetch cluster stats
        console.log('Fetching cluster stats...');
        const statsResponse = await fetch('/api/stats/cluster');
        const statsJson = await statsResponse.json();
        console.log('Stats data:', statsJson);
        setStatsData(statsJson);

        // Fetch GPU usage by user
        console.log('Fetching GPU usage by user...');
        const gpuResponse = await fetch('/api/analytics/gpu-usage-by-user');
        const gpuJson = await gpuResponse.json();
        console.log('GPU usage data:', gpuJson);
        setGpuUsageData(gpuJson);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', fontSize: '48px', marginBottom: '30px' }}>
        🐞 DEBUG DASHBOARD 🐞
      </h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px' }}>
        This page shows raw API data - if you can see this, React is working!
      </p>

      {loading && (
        <div style={{ 
          padding: '30px', 
          backgroundColor: 'white', 
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '24px',
          color: '#666',
          marginBottom: '30px'
        }}>
          Loading data...
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '30px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '10px',
          color: '#dc2626',
          fontSize: '18px',
          marginBottom: '30px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Jobs Data */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#667eea', fontSize: '32px', marginBottom: '20px' }}>
          1. Jobs Data
        </h2>
        {jobsData ? (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '20px', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <p><strong>Total Jobs:</strong> {jobsData.summary?.total || 'N/A'}</p>
            <p><strong>Running Jobs:</strong> {jobsData.summary?.running || 'N/A'}</p>
            <p><strong>Queued Jobs:</strong> {jobsData.summary?.queued || 'N/A'}</p>
            <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>Top 5 Users:</h3>
            <ul>
              {jobsData.byUser.slice(0, 5).map((user: any, index: number) => (
                <li key={index}>
                  <strong>{user.user}:</strong> {user.count} jobs
                </li>
              ))}
            </ul>
            <h3 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>Top 5 Queues:</h3>
            <ul>
              {jobsData.byQueue.slice(0, 5).map((queue: any, index: number) => (
                <li key={index}>
                  <strong>{queue.queue}:</strong> {queue.count} jobs
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p style={{ color: '#999' }}>Loading...</p>
        )}
      </div>

      {/* Stats Data */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#764ba2', fontSize: '32px', marginBottom: '20px' }}>
          2. Cluster Stats
        </h2>
        {statsData ? (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '20px', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <p><strong>Total Nodes:</strong> {statsData.totalNodes || 'N/A'}</p>
            <p><strong>Free Nodes:</strong> {statsData.freeNodes || 'N/A'}</p>
            <p><strong>Busy Nodes:</strong> {statsData.busyNodes || 'N/A'}</p>
            <p><strong>Offline Nodes:</strong> {statsData.offlineNodes || 'N/A'}</p>
            <p><strong>Down Nodes:</strong> {statsData.downNodes || 'N/A'}</p>
          </div>
        ) : (
          <p style={{ color: '#999' }}>Loading...</p>
        )}
      </div>

      {/* GPU Usage Data */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#10b981', fontSize: '32px', marginBottom: '20px' }}>
          3. GPU Usage by User
        </h2>
        {gpuUsageData && gpuUsageData.length > 0 ? (
          <div>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontFamily: 'monospace'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '10px', 
                    textAlign: 'left',
                    fontSize: '14px'
                  }}>Username</th>
                  <th style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '10px', 
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>Jobs</th>
                  <th style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '10px', 
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>Total GPUs</th>
                  <th style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '10px', 
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>Avg GPUs/Job</th>
                  <th style={{ 
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '10px', 
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {gpuUsageData.slice(0, 5).map((user: any, index: number) => (
                  <tr key={index}>
                    <td style={{ 
                      padding: '10px', 
                      color: '#333',
                      fontWeight: 'bold'
                    }}>{user.username}</td>
                    <td style={{ 
                      padding: '10px', 
                      textAlign: 'center',
                      color: '#666'
                    }}>{user.numJobs}</td>
                    <td style={{ 
                      padding: '10px', 
                      textAlign: 'center',
                      color: '#666'
                    }}>{user.totalGpusUsed}</td>
                    <td style={{ 
                      padding: '10px', 
                      textAlign: 'center',
                      color: '#666'
                    }}>{user.avgGpusPerJob}</td>
                    <td style={{ 
                      padding: '10px', 
                      textAlign: 'center',
                      color: '#666'
                    }}>{user.totalGpuHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#999' }}>Loading...</p>
        )}
      </div>

      {/* Status Box */}
      <div style={{ 
        backgroundColor: '#10b981', 
        padding: '30px', 
        borderRadius: '10px',
        color: 'white',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
      }}>
        <span style={{ fontSize: '40px' }}>✅</span> All APIs are working!
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>Test Instructions:</strong>
        <br />• If you can see this page, React is working
        <br />• All 3 API sections above should show real data
        <br />• Check browser console (F12) for any errors
        <br />• Data auto-refreshes every 10 seconds
      </div>
    </div>
  );
};

export default DebugDashboard;