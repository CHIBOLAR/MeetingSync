import React, { useState, useEffect } from 'react';
import { invoke, view } from '@forge/bridge';

const App = () => {
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [issueKey, setIssueKey] = useState(null);
  const [accountId, setAccountId] = useState(null);

  useEffect(() => {
    // Initialize with real Jira context
    const initializeApp = async () => {
      try {
        // Get the actual issue context from Jira
        const context = await view.getContext();
        console.log('Jira context:', context); // Debug log
        
        const currentIssueKey = context.extension.issue.key;
        const currentAccountId = context.accountId;
        
        setIssueKey(currentIssueKey);
        setAccountId(currentAccountId);
        
        await loadMeetingContext(currentIssueKey, currentAccountId);
      } catch (err) {
        console.error('Failed to get Jira context:', err);
        // Fallback to demo mode if context fails
        const demoIssueKey = 'DEMO-123';
        const demoAccountId = 'demo-account-fallback';
        
        setIssueKey(demoIssueKey);
        setAccountId(demoAccountId);
        
        await loadMeetingContext(demoIssueKey, demoAccountId);
      }
    };

    initializeApp();
  }, []);

  const loadMeetingContext = async (key, accId) => {
    if (!key) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the specific function directly with real account ID
      const response = await invoke('getMeetingContext', {
        issueKey: key,
        accountId: accId || accountId || 'fallback-account'
      });
      
      if (response.success) {
        setMeetingData(response.data);
      } else {
        setError(response.message || 'Failed to load meeting context');
      }
    } catch (err) {
      console.error('Error loading meeting context:', err);
      setError('Failed to load meeting context');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMeetings = async () => {
    if (!issueKey || syncing) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      const response = await invoke('syncMeetings', {
        issueKey,
        accountId: accountId || 'fallback-account'
      });
      
      if (response.success) {
        setMeetingData(response.data);
      } else {
        setError(response.message || 'Failed to sync meetings');
      }
    } catch (err) {
      console.error('Error syncing meetings:', err);
      setError('Failed to sync meetings');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!issueKey || adding) return;
    
    setAdding(true);
    setError(null);
    
    try {
      const response = await invoke('addMeeting', {
        issueKey,
        accountId: accountId || 'fallback-account'
      });
      
      if (response.success) {
        setMeetingData(response.data);
      } else {
        setError(response.message || 'Failed to add meeting');
      }
    } catch (err) {
      console.error('Error adding meeting:', err);
      setError('Failed to add meeting');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="panel-container">
        <div className="loading">
          🔄 Loading meeting context...
        </div>
      </div>
    );
  }

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2>📅 Meeting Context</h2>
        {meetingData && (
          <div className="meeting-count">
            {meetingData.totalMeetings} {meetingData.totalMeetings === 1 ? 'meeting' : 'meetings'}
          </div>
        )}
      </div>

      {/* Issue & Account Context */}
      {issueKey && (
        <div className="issue-context">
          📋 Issue: <strong>{issueKey}</strong>
          {accountId && <span className="account-info"> | Account: {accountId.slice(0, 8)}...</span>}
        </div>
      )}

      {error && (
        <div className="error">
          ⚠️ {error}
          <button onClick={() => loadMeetingContext(issueKey, accountId)} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {meetingData?.lastSync && (
        <div className="last-sync">
          🔄 Last synced: {formatDate(meetingData.lastSync)}
        </div>
      )}

      <div className="panel-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleSyncMeetings}
          disabled={syncing}
        >
          {syncing ? '⏳ Syncing...' : '🔄 Sync Meetings'}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleAddMeeting}
          disabled={adding}
        >
          {adding ? '➕ Adding...' : '➕ Add Meeting'}
        </button>
      </div>

      {meetingData && meetingData.meetings && meetingData.meetings.length > 0 ? (
        <div className="meetings-list">
          {meetingData.meetings.map((meeting) => (
            <div key={meeting.id} className="meeting-card">
              <div className="meeting-header">
                <h3 className="meeting-title">{meeting.title}</h3>
                <div className="meeting-platform">{meeting.platform}</div>
              </div>
              
              <div className="meeting-meta">
                <span>📅 {formatDate(meeting.date)}</span>
                <span>⏱️ {formatDuration(meeting.duration)}</span>
                <span>👥 {meeting.participants?.length || 0} participants</span>
              </div>

              {meeting.summary && (
                <div className="meeting-summary">
                  📝 {meeting.summary}
                </div>
              )}

              {meeting.actionItems && meeting.actionItems.length > 0 && (
                <div className="action-items">
                  <h4>📋 Action Items:</h4>
                  <ul>
                    {meeting.actionItems.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No meetings found for this issue</p>
          <p className="empty-subtitle">
            Sync with your meeting platforms or add meetings manually
          </p>
        </div>
      )}
    </div>
  );
};

export default App;