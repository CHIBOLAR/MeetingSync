const { storage } = require('@forge/api');

// Handle CORS preflight requests
function handleOptionsRequest() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    },
    body: ''
  };
}

// Process the actual meeting upload
async function uploadMeetingHandler(req) {
  console.log('Processing meeting upload...', req);
  
  try {
    const { issueKey, transcript, metadata } = req.payload || {};
    
    if (!transcript) {
      throw new Error('No transcript content provided');
    }
    
    if (!issueKey) {
      throw new Error('Issue key is required');
    }
    
    // Create meeting record
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingData = {
      id: meetingId,
      issueKey,
      transcript,
      processedAt: new Date().toISOString(),
      metadata: metadata || {}
    };
    
    // Extract ticket mentions from transcript
    const ticketMentions = extractTicketMentions(transcript);
    const summary = generateBasicSummary(transcript);
    
    // Add processed data
    meetingData.ticketMentions = ticketMentions;
    meetingData.summary = summary;
    
    // Store in Forge storage
    const storageKey = `meeting_${issueKey}_${meetingId}`;
    await storage.set(storageKey, meetingData);
    
    // Also store in a list for the issue
    const issueStorageKey = `meetings_${issueKey}`;
    let issueMeetings = await storage.get(issueStorageKey) || [];
    issueMeetings.push(meetingId);
    await storage.set(issueStorageKey, issueMeetings);
    
    console.log('Meeting processed successfully:', meetingId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        meetingId,
        summary,
        ticketMentions,
        message: 'Meeting uploaded and processed successfully'
      })
    };
    
  } catch (error) {
    console.error('Upload processing error:', error);
    
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}

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

// Main handler
module.exports = async function handler(req) {
  console.log('Upload request received:', {
    method: req.method,
    headers: req.headers ? Object.keys(req.headers) : 'none',
    hasBody: Boolean(req.body),
    hasPayload: Boolean(req.payload),
    timestamp: new Date().toISOString()
  });
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return handleOptionsRequest();
    }
    
    // Only allow POST for uploads
    if (req.method !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.'
        })
      };
    }
    
    // Process the upload
    return await uploadMeetingHandler(req);
  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};
