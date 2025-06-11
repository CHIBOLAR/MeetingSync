import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Enhanced validation utilities
const validateIssueKey = (issueKey) => {
  if (!issueKey || typeof issueKey !== 'string') {
    throw new Error('Valid issue key is required');
  }
  const issueKeyPattern = /^[A-Z]+-\d+$/;
  if (!issueKeyPattern.test(issueKey.trim())) {
    throw new Error('Invalid issue key format. Expected format: PROJECT-123');
  }
  return true;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Rate limiter for API calls
const rateLimiter = new Map();
const isRateLimited = (key, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, []);
  }
  
  const requests = rateLimiter.get(key).filter(time => time > windowStart);
  
  if (requests.length >= limit) {
    return true;
  }
  
  requests.push(now);
  rateLimiter.set(key, requests);
  return false;
};

/**
 * Enhanced getMeetingContext with better data management
 */
resolver.define('getMeetingContext', async (req) => {
  console.log('getMeetingContext called:', req);
  
  try {
    const { issueKey, accountId } = req.payload || {};
    
    // Rate limiting
    if (isRateLimited(`getMeetingContext:${accountId}`, 30, 60000)) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.'
      };
    }
    
    // Validation
    validateIssueKey(issueKey);
    
    const storageKey = `meetings:${issueKey}`;
    let meetingData = await storage.get(storageKey);
    
    if (!meetingData) {
      // Create comprehensive demo data
      meetingData = {
        issueKey: issueKey,
        totalMeetings: 3,
        lastSync: new Date().toISOString(),
        syncHistory: [
          { timestamp: new Date().toISOString(), type: 'initial', count: 3 }
        ],
        meetings: [
          {
            id: `meeting-${Date.now()}-1`,
            title: sanitizeInput(`Sprint Planning for ${issueKey}`),
            platform: 'Zoom',
            date: new Date().toISOString(),
            duration: 60,
            participants: [
              { name: 'John Doe', email: 'john.doe@company.com', role: 'Product Owner' },
              { name: 'Jane Smith', email: 'jane.smith@company.com', role: 'Scrum Master' },
              { name: 'Alex Chen', email: 'alex.chen@company.com', role: 'Developer' }
            ],
            summary: 'Comprehensive sprint planning session covering user stories, acceptance criteria, and sprint goals. Discussed technical implementation approach and identified potential blockers.',
            actionItems: [
              { task: 'Review user story acceptance criteria', assignee: 'John Doe', status: 'pending' },
              { task: 'Prepare development environment setup', assignee: 'Alex Chen', status: 'pending' },
              { task: 'Schedule design review meeting', assignee: 'Jane Smith', status: 'pending' }
            ],
            keyDecisions: [
              'Agreed to use microservices architecture',
              'Sprint duration set to 2 weeks',
              'Daily standups at 9:00 AM'
            ],
            attachments: ['sprint-backlog.pdf', 'user-stories.xlsx'],
            sentiment: 'positive',
            tags: ['planning', 'sprint', 'backlog']
          },
          {
            id: `meeting-${Date.now()}-2`,
            title: 'Technical Architecture Review',
            platform: 'Teams',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            duration: 45,
            participants: [
              { name: 'Tech Lead', email: 'tech.lead@company.com', role: 'Technical Lead' },
              { name: 'System Architect', email: 'architect@company.com', role: 'Architect' },
              { name: 'Senior Developer', email: 'senior.dev@company.com', role: 'Developer' }
            ],
            summary: 'Deep dive into technical implementation details. Reviewed proposed architecture, identified potential risks, and established coding standards.',
            actionItems: [
              { task: 'Create technical documentation', assignee: 'Tech Lead', status: 'in-progress' },
              { task: 'Set up CI/CD pipeline', assignee: 'Senior Developer', status: 'pending' },
              { task: 'Review security requirements', assignee: 'System Architect', status: 'completed' }
            ],
            keyDecisions: [
              'Use Docker for containerization',
              'Implement automated testing',
              'Weekly code reviews mandatory'
            ],
            attachments: ['architecture-diagram.png', 'tech-stack.md'],
            sentiment: 'neutral',
            tags: ['technical', 'architecture', 'review']
          },
          {
            id: `meeting-${Date.now()}-3`,
            title: 'Stakeholder Feedback Session',
            platform: 'Google Meet',
            date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            duration: 30,
            participants: [
              { name: 'Product Manager', email: 'pm@company.com', role: 'Product Manager' },
              { name: 'UX Designer', email: 'ux@company.com', role: 'Designer' },
              { name: 'Customer Success', email: 'cs@company.com', role: 'Customer Success' }
            ],
            summary: 'Gathered feedback from key stakeholders on proposed features. Discussed user experience concerns and prioritized feature requests.',
            actionItems: [
              { task: 'Update user interface mockups', assignee: 'UX Designer', status: 'completed' },
              { task: 'Revise feature priority matrix', assignee: 'Product Manager', status: 'pending' }
            ],
            keyDecisions: [
              'Prioritize mobile responsiveness',
              'Include accessibility features',
              'Launch with MVP feature set'
            ],
            attachments: ['feedback-summary.docx'],
            sentiment: 'positive',
            tags: ['stakeholder', 'feedback', 'ux']
          }
        ]
      };
      
      await storage.set(storageKey, meetingData);
      console.log(`Initialized meeting data for ${issueKey}`);
    }
    
    return {
      success: true,
      data: meetingData,
      meta: {
        totalMeetings: meetingData.meetings.length,
        lastUpdated: new Date().toISOString(),
        issueKey: issueKey
      }
    };
    
  } catch (error) {
    console.error('getMeetingContext error:', error);
    return {
      success: false,
      message: error.message || 'Failed to load meeting context',
      error: {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
});

/**
 * Enhanced syncMeetings with better simulation and history tracking
 */
resolver.define('syncMeetings', async (req) => {
  console.log('syncMeetings called:', req);
  
  try {
    const { issueKey, accountId, platform = 'Teams' } = req.payload || {};
    
    // Rate limiting
    if (isRateLimited(`syncMeetings:${accountId}`, 5, 60000)) {
      return {
        success: false,
        message: 'Sync rate limit exceeded. Please wait before syncing again.'
      };
    }
    
    validateIssueKey(issueKey);
    
    const storageKey = `meetings:${issueKey}`;
    let meetingData = await storage.get(storageKey) || {
      issueKey: issueKey,
      meetings: [],
      totalMeetings: 0,
      lastSync: null,
      syncHistory: []
    };
    
    // Simulate finding new meetings from external platforms
    const syncedMeeting = {
      id: `sync-${platform.toLowerCase()}-${Date.now()}`,
      title: sanitizeInput(`${platform} Sync: Discussion for ${issueKey}`),
      platform: platform,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random within last week
      duration: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      participants: [
        { name: 'Synced User', email: 'synced.user@company.com', role: 'Participant' },
        { name: 'Remote Attendee', email: 'remote@company.com', role: 'Attendee' }
      ],
      summary: `Automatically synced meeting from ${platform}. Discussion covered progress updates, blockers, and next steps for ${issueKey}.`,
      actionItems: [
        { task: 'Follow up on synced action items', assignee: 'Team Lead', status: 'pending' },
        { task: 'Review automated meeting notes', assignee: 'Attendees', status: 'pending' }
      ],
      keyDecisions: [
        'Agreed to continue current approach',
        'Next sync scheduled for next week'
      ],
      sentiment: 'neutral',
      tags: ['synced', platform.toLowerCase(), 'auto-generated'],
      source: 'external-sync'
    };
    
    // Add to meetings and update metadata
    meetingData.meetings.unshift(syncedMeeting);
    meetingData.totalMeetings = meetingData.meetings.length;
    meetingData.lastSync = new Date().toISOString();
    
    // Track sync history
    if (!meetingData.syncHistory) meetingData.syncHistory = [];
    meetingData.syncHistory.unshift({
      timestamp: new Date().toISOString(),
      type: 'manual-sync',
      platform: platform,
      count: 1,
      meetingId: syncedMeeting.id
    });
    
    // Keep only last 10 sync history entries
    if (meetingData.syncHistory.length > 10) {
      meetingData.syncHistory = meetingData.syncHistory.slice(0, 10);
    }
    
    await storage.set(storageKey, meetingData);
    
    return {
      success: true,
      message: `Successfully synced! Added 1 new meeting from ${platform}.`,
      data: meetingData,
      syncDetails: {
        platform: platform,
        newMeetings: 1,
        totalMeetings: meetingData.meetings.length,
        syncTime: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('syncMeetings error:', error);
    return {
      success: false,
      message: error.message || 'Failed to sync meetings',
      error: {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
});

/**
 * Enhanced addMeeting with comprehensive meeting creation
 */
resolver.define('addMeeting', async (req) => {
  console.log('addMeeting called:', req);
  
  try {
    const { issueKey, accountId, meetingData: inputData = {} } = req.payload || {};
    
    // Rate limiting
    if (isRateLimited(`addMeeting:${accountId}`, 10, 60000)) {
      return {
        success: false,
        message: 'Add meeting rate limit exceeded. Please try again later.'
      };
    }
    
    validateIssueKey(issueKey);
    
    const storageKey = `meetings:${issueKey}`;
    let meetingData = await storage.get(storageKey) || {
      issueKey: issueKey,
      meetings: [],
      totalMeetings: 0,
      lastSync: null,
      syncHistory: []
    };
    
    // Create comprehensive meeting object
    const newMeeting = {
      id: `manual-${Date.now()}`,
      title: sanitizeInput(inputData.title || `Manual Meeting Entry for ${issueKey}`),
      platform: sanitizeInput(inputData.platform || 'Manual'),
      date: inputData.date || new Date().toISOString(),
      duration: inputData.duration || 30,
      participants: inputData.participants || [
        { name: 'Current User', email: 'current.user@company.com', role: 'Organizer' }
      ],
      summary: sanitizeInput(inputData.summary || 
        `Meeting manually added through Jira panel for ${issueKey}. Please update with actual meeting details and outcomes.`),
      actionItems: inputData.actionItems || [
        { task: 'Add meeting details and agenda', assignee: 'Organizer', status: 'pending' },
        { task: 'Update participants list', assignee: 'Organizer', status: 'pending' },
        { task: 'Record key decisions and outcomes', assignee: 'Team', status: 'pending' }
      ],
      keyDecisions: inputData.keyDecisions || [
        'Meeting created manually - please add decisions'
      ],
      sentiment: 'neutral',
      tags: inputData.tags || ['manual', 'user-created'],
      source: 'manual-entry',
      createdBy: accountId,
      createdAt: new Date().toISOString()
    };
    
    // Add to meetings
    meetingData.meetings.unshift(newMeeting);
    meetingData.totalMeetings = meetingData.meetings.length;
    meetingData.lastSync = new Date().toISOString();
    
    // Track in sync history
    if (!meetingData.syncHistory) meetingData.syncHistory = [];
    meetingData.syncHistory.unshift({
      timestamp: new Date().toISOString(),
      type: 'manual-add',
      count: 1,
      meetingId: newMeeting.id,
      addedBy: accountId
    });
    
    await storage.set(storageKey, meetingData);
    
    return {
      success: true,
      message: 'Meeting added successfully! You can edit the details as needed.',
      data: meetingData,
      addedMeeting: {
        id: newMeeting.id,
        title: newMeeting.title,
        platform: newMeeting.platform
      }
    };
    
  } catch (error) {
    console.error('addMeeting error:', error);
    return {
      success: false,
      message: error.message || 'Failed to add meeting',
      error: {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
});

/**
 * New resolver: Get meeting analytics and insights
 */
resolver.define('getMeetingAnalytics', async (req) => {
  console.log('getMeetingAnalytics called:', req);
  
  try {
    const { issueKey, accountId, timeframe = '30d' } = req.payload || {};
    
    validateIssueKey(issueKey);
    
    const storageKey = `meetings:${issueKey}`;
    const meetingData = await storage.get(storageKey);
    
    if (!meetingData || !meetingData.meetings) {
      return {
        success: true,
        data: {
          totalMeetings: 0,
          totalDuration: 0,
          averageDuration: 0,
          platformBreakdown: {},
          sentimentAnalysis: {},
          actionItemsStats: { total: 0, completed: 0, pending: 0 }
        }
      };
    }
    
    const meetings = meetingData.meetings;
    
    // Calculate analytics
    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;
    
    // Platform breakdown
    const platformBreakdown = {};
    meetings.forEach(m => {
      platformBreakdown[m.platform] = (platformBreakdown[m.platform] || 0) + 1;
    });
    
    // Sentiment analysis
    const sentimentAnalysis = {};
    meetings.forEach(m => {
      const sentiment = m.sentiment || 'neutral';
      sentimentAnalysis[sentiment] = (sentimentAnalysis[sentiment] || 0) + 1;
    });
    
    // Action items stats
    let totalActionItems = 0;
    let completedActionItems = 0;
    meetings.forEach(m => {
      if (m.actionItems && Array.isArray(m.actionItems)) {
        totalActionItems += m.actionItems.length;
        completedActionItems += m.actionItems.filter(item => 
          item.status === 'completed'
        ).length;
      }
    });
    
    return {
      success: true,
      data: {
        totalMeetings,
        totalDuration,
        averageDuration,
        platformBreakdown,
        sentimentAnalysis,
        actionItemsStats: {
          total: totalActionItems,
          completed: completedActionItems,
          pending: totalActionItems - completedActionItems
        },
        timeframe,
        generatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('getMeetingAnalytics error:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate analytics',
      error: {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
});

// Export the resolver as the handler
export const handler = resolver.getDefinitions();