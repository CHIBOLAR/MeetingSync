// src/resolvers/index.js - Fixed backend handlers
import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Main meeting context handler
resolver.define('meeting-context-func', async (req) => {
  console.log('Meeting context function called:', req.payload);
  
  try {
    const { action, issueKey } = req.payload;
    
    if (action === 'load') {
      return await loadMeetingData(issueKey);
    }
    
    return {
      success: false,
      message: 'Unknown action'
    };
    
  } catch (error) {
    console.error('Error in meeting-context-func:', error);
    return {
      success: false,
      message: `Handler error: ${error.message}`,
      data: {
        meetings: [],
        lastSync: null,
        totalMeetings: 0
      }
    };
  }
});

// Sync meetings handler
resolver.define('sync-meetings-func', async (req) => {
  console.log('Sync meetings action triggered');

  try {
    const { issueKey } = req.payload;
    const syncTime = new Date().toISOString();

    // Update storage with sync time
    const existingData = await storage.get(`meeting-${issueKey}`) || {};
    const updatedData = {
      ...existingData,
      lastSync: syncTime
    };

    await storage.set(`meeting-${issueKey}`, updatedData);

    return {
      success: true,
      message: `Meetings synced at ${new Date(syncTime).toLocaleString()}`
    };
    
  } catch (error) {
    console.error('Error syncing meetings:', error);
    return {
      success: false,
      message: `Sync failed: ${error.message}`
    };
  }
});

// Add meeting handler
resolver.define('add-meeting-func', async (req) => {
  console.log('Add meeting action triggered');

  try {
    const { issueKey } = req.payload;
    
    const newMeeting = {
      id: Date.now().toString(),
      title: `Manual meeting for ${issueKey}`,
      date: new Date().toISOString(),
      platform: 'Manual Entry',
      participants: ['current.user@company.com'],
      duration: 0,
      summary: 'Meeting added manually',
      actionItems: []
    };

    const existingData = await storage.get(`meeting-${issueKey}`) || { meetings: [] };
    existingData.meetings = existingData.meetings || [];
    existingData.meetings.push(newMeeting);
    existingData.totalMeetings = existingData.meetings.length;

    await storage.set(`meeting-${issueKey}`, existingData);

    return {
      success: true,
      message: 'Meeting note added successfully'
    };

  } catch (error) {
    console.error('Error adding meeting:', error);
    return {
      success: false,
      message: `Failed to add meeting: ${error.message}`
    };
  }
});

// Helper function to load meeting data
async function loadMeetingData(issueKey) {
  try {
    const meetingData = await storage.get(`meeting-${issueKey}`) || {};
    
    // Default meeting context structure
    const defaultContext = {
      meetings: [],
      lastSync: null,
      totalMeetings: 0
    };

    const contextData = { ...defaultContext, ...meetingData };

    // If no meetings exist, use sample data
    if (contextData.meetings.length === 0) {
      const sampleMeetings = [
        {
          id: '1',
          title: `Discussion for ${issueKey}`,
          date: new Date().toISOString(),
          platform: 'Teams',
          participants: ['john.doe@company.com', 'jane.smith@company.com'],
          duration: 30,
          summary: 'Discussed implementation approach and timeline',
          actionItems: [
            'Review technical specifications',
            'Schedule follow-up meeting',
            'Update issue status'
          ]
        }
      ];
      
      contextData.meetings = sampleMeetings;
      contextData.totalMeetings = sampleMeetings.length;
      contextData.lastSync = new Date().toISOString();
      
      // Save sample data
      await storage.set(`meeting-${issueKey}`, contextData);
    }

    return {
      success: true,
      data: contextData
    };
    
  } catch (error) {
    console.error('Error loading meeting data:', error);
    return {
      success: false,
      message: `Load failed: ${error.message}`,
      data: {
        meetings: [],
        lastSync: null,
        totalMeetings: 0
      }
    };
  }
}

export const handler = resolver.getDefinitions();
