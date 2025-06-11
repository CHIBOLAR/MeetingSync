import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import { view } from '@forge/bridge';

const MeetingPanel = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    initializePanel();
  }, []);

  const initializePanel = async () => {
    try {
      // Get Jira context
      const jiraContext = await view.getContext();
      setContext(jiraContext);
      
      // Load meeting data for this issue
      const issueKey = jiraContext?.extension?.issue?.key || 'DEMO-123';
      await loadMeetingData(issueKey);
      
    } catch (err) {
      console.error('Initialization error:', err);
      setError(`Initialization failed: ${err.message}`);
      setLoading(false);
    }
  };

  const loadMeetingData = async (issueKey) => {
    try {
      setLoading(true);
      const response = await invoke('meeting-context-func', {
        action: 'load',
        issueKey: issueKey
      });
      
      if (response.success) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError(`Failed to load meetings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!context?.extension?.issue?.key) return;
    
    try {
      setSyncing(true);
      const response = await invoke('sync-meetings-func', {
        issueKey: context.extension.issue.key
      });
      
      if (response.success) {
        await loadMeetingData(context.extension.issue.key);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!context?.extension?.issue?.key) return;
    
    try {
      const response = await invoke('add-meeting-func', {
        issueKey: context.extension.issue.key
      });
      
      if (response.success) {
        await loadMeetingData(context.extension.issue.key);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(`Failed to add meeting: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px' }}>⏳</div>
        <div>Loading meeting context...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
        <button 
          onClick={() => loadMeetingData(context?.extension?.issue?.key || 'DEMO-123')}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 style={{ margin: 0 }}>Meeting Context</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ 
              backgroundColor: '#e3f2fd', 
              color: '#1976d2',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {data?.totalMeetings || 0} meetings
            </span>
            {data?.lastSync && (
              <span style={{ 
                backgroundColor: '#f5f5f5', 
                color: '#666',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Synced: {new Date(data.lastSync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSync}
            disabled={syncing}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              opacity: syncing ? 0.6 : 1
            }}
          >
            {syncing ? 'Syncing...' : 'Sync Meetings'}
          </button>
          <button 
            onClick={handleAddMeeting}
            style={{
              backgroundColor: 'transparent',
              color: '#1976d2',
              border: '1px solid #1976d2',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Meeting Note
          </button>
          <button 
            onClick={() => loadMeetingData(context?.extension?.issue?.key || 'DEMO-123')}
            style={{
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ddd',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Meeting List */}
      {data?.meetings?.length > 0 ? (
        <div style={{ marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Meeting</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Platform</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.meetings.map(meeting => (
                <tr key={meeting.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <strong>{meeting.title}</strong>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {new Date(meeting.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <span style={{ 
                      backgroundColor: '#f0f0f0', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {meeting.platform}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {meeting.duration}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          color: '#1976d2',
          padding: '16px', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div><strong>No meetings found for this issue.</strong></div>
          <div>Click "Add Meeting Note" to create a manual entry or "Sync Meetings" to fetch from connected platforms.</div>
        </div>
      )}

      {/* Meeting Details */}
      {data?.meetings?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4>Recent Meeting Summary</h4>
          {data.meetings.slice(0, 1).map(meeting => (
            <div key={meeting.id} style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '12px', 
              borderRadius: '4px',
              border: '1px solid #eee'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{meeting.title}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                {meeting.summary}
              </div>
              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div>
                  <strong>Action Items:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {meeting.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && context && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          Debug: Issue {context.extension?.issue?.key || 'N/A'} | Environment: {process.env.NODE_ENV}
        </div>
      )}
    </div>
  );
};

export default MeetingPanel;
