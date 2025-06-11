const Resolver = require('@forge/resolver');
const { storage } = require('@forge/api');

const resolver = new Resolver();

resolver.define('getMeetingContext', async (req) => {
  try {
    console.log('Getting meeting context for request:', req);

    // Get current Jira context
    const context = req.context;
    const issueId = context.extension.issue.id;
    const issueKey = context.extension.issue.key;

    console.log(`Loading meetings for issue: ${issueKey} (${issueId})`);

    // Get meetings related to this ticket
    const issueStorageKey = `meetings_${issueKey}`;
    const meetingIds = await storage.get(issueStorageKey) || [];
    
    const meetings = [];
    for (const meetingId of meetingIds) {
      const storageKey = `meeting_${issueKey}_${meetingId}`;
      const meetingData = await storage.get(storageKey);
      if (meetingData) {
        meetings.push(meetingData);
      }
    }

    return {
      success: true,
      issueId,
      issueKey,
      meetings: meetings || []
    };

  } catch (error) {
    console.error('Error getting meeting context:', error);
    return {
      success: false,
      error: error.message,
      meetings: []
    };
  }
});

resolver.define('uploadMeetingFile', async (req) => {
  try {
    console.log('Processing file upload:', req);

    const { transcript, metadata } = req.payload || {};
    const context = req.context;
    const issueKey = context.extension.issue.key;

    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log(`Processing transcript for issue: ${issueKey}`);

    // Create meeting record
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingData = {
      id: meetingId,
      title: `Meeting for ${issueKey}`,
      issueKey,
      transcript,
      uploadedAt: new Date().toISOString(),
      metadata: metadata || {}
    };

    // Basic processing: extract ticket mentions
    const ticketMentions = extractTicketMentions(transcript);
    const summary = generateBasicSummary(transcript);
    
    meetingData.ticketMentions = ticketMentions;
    meetingData.summary = summary;

    // Store the meeting
    const storageKey = `meeting_${issueKey}_${meetingId}`;
    await storage.set(storageKey, meetingData);
    
    // Update the meetings list for this issue
    const issueStorageKey = `meetings_${issueKey}`;
    let issueMeetings = await storage.get(issueStorageKey) || [];
    issueMeetings.push(meetingId);
    await storage.set(issueStorageKey, issueMeetings);

    return {
      success: true,
      meeting: meetingData,
      message: 'Meeting processed successfully'
    };

  } catch (error) {
    console.error('Error uploading meeting file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Helper functions
function extractTicketMentions(transcript) {
  const ticketPattern = /\b[A-Z]{2,10}-\d+\b/g;
  const mentions = transcript.match(ticketPattern) || [];
  return [...new Set(mentions)];
}

function generateBasicSummary(transcript) {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length <= 3) {
    return transcript.trim();
  }
  
  const summary = [
    sentences[0],
    ...sentences.slice(1).filter(s => 
      s.toLowerCase().includes('decision') ||
      s.toLowerCase().includes('action') ||
      s.toLowerCase().includes('next') ||
      s.toLowerCase().includes('ticket') ||
      s.toLowerCase().includes('issue')
    ).slice(0, 2)
  ].join('. ') + '.';
  
  return summary.trim();
}

module.exports = resolver;
