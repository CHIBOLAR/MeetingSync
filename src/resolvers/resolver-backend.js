import resolver from '@forge/resolver';
import { storage } from '@forge/api';
import MeetingService from '../services/MeetingService';
import JiraService from '../services/JiraService';

// Initialize services
const meetingService = new MeetingService();
const jiraService = new JiraService();

resolver.define('getMeetingContext', async (req) => {
  try {
    console.log('Getting meeting context for request:', req);
    
    // Get current Jira context
    const context = req.context;
    const issueId = context.extension.issue.id;
    const issueKey = context.extension.issue.key;
    
    console.log(`Loading meetings for issue: ${issueKey} (${issueId})`);
    
    // Get meetings related to this ticket
    const meetings = await meetingService.getMeetingsForTicket(issueKey);
    
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
    
    const { file, issueId, metadata } = req.payload;
    const context = req.context;
    const issueKey = context.extension.issue.key;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    console.log(`Processing file for issue: ${issueKey}`);
    
    // Create meeting record
    const meetingData = {
      title: `Meeting for ${issueKey}`,
      issueKey,
      fileName: file.name,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      metadata
    };
    
    // Process the file based on type
    let processedMeeting;
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Handle text transcript
      const transcript = await file.text();
      processedMeeting = await meetingService.processTextTranscript(transcript, meetingData);
    } else if (file.type.startsWith('audio/')) {
      // Handle audio file
      processedMeeting = await meetingService.processAudioFile(file, meetingData);
    } else {
      throw new Error('Unsupported file type. Please upload .txt or audio files.');
    }
    
    // Update Jira with meeting context
    try {
      await jiraService.updateTicketWithMeetingContext(issueKey, processedMeeting);
    } catch (jiraError) {
      console.warn('Failed to update Jira ticket:', jiraError);
      // Don't fail the whole operation if Jira update fails
    }
    
    return {
      success: true,
      meeting: processedMeeting,
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

resolver.define('refreshMeetingData', async (req) => {
  try {
    const context = req.context;
    const issueKey = context.extension.issue.key;
    
    // Force refresh of meeting data
    const meetings = await meetingService.getMeetingsForTicket(issueKey, true);
    
    return {
      success: true,
      meetings: meetings || []
    };
    
  } catch (error) {
    console.error('Error refreshing meeting data:', error);
    return {
      success: false,
      error: error.message,
      meetings: []
    };
  }
});

resolver.define('deleteMeeting', async (req) => {
  try {
    const { meetingId } = req.payload;
    const context = req.context;
    
    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }
    
    const result = await meetingService.deleteMeeting(meetingId);
    
    return {
      success: true,
      result
    };
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

export default resolver;