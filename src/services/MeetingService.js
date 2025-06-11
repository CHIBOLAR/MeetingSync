import { storage } from '@forge/api';
import { v4 as uuidv4 } from 'uuid';
import TextProcessor from './TextProcessor';
import DatabaseService from './DatabaseService';

class MeetingService {
  constructor() {
    this.textProcessor = new TextProcessor();
    this.db = new DatabaseService();
  }

  async getMeetingsForTicket(ticketKey, forceRefresh = false) {
    try {
      const cacheKey = `meetings:${ticketKey}`;
      
      // Try cache first unless force refresh
      if (!forceRefresh) {
        const cached = await storage.get(cacheKey);
        if (cached) {
          console.log(`Retrieved ${cached.length} meetings from cache for ${ticketKey}`);
          return cached;
        }
      }

      // Query database for meetings mentioning this ticket
      const meetings = await this.db.query(`
        SELECT m.*, tm.discussion_summary, tm.action_items, tm.key_decisions
        FROM meetings m
        LEFT JOIN ticket_mentions tm ON m.id = tm.meeting_id
        WHERE tm.ticket_id = ? OR m.transcript_text LIKE ?
        ORDER BY m.start_time DESC
        LIMIT 20
      `, [ticketKey, `%${ticketKey}%`]);

      // Cache results for 5 minutes
      await storage.set(cacheKey, meetings, { ttl: 300 });
      
      console.log(`Retrieved ${meetings.length} meetings for ${ticketKey}`);
      return meetings;

    } catch (error) {
      console.error('Error getting meetings for ticket:', error);
      return [];
    }
  }

  async processTextTranscript(transcript, meetingData) {
    try {
      console.log('Processing text transcript:', meetingData.fileName);

      // Analyze transcript for ticket mentions and insights
      const analysis = await this.textProcessor.analyzeTranscript(transcript);
      
      // Create meeting record
      const meetingId = uuidv4();
      const meeting = {
        id: meetingId,
        team_id: meetingData.teamId || 'default',
        title: meetingData.title || 'Uploaded Meeting',
        start_time: new Date().toISOString(),
        transcript_text: transcript,
        processed_data: JSON.stringify(analysis),
        participants: JSON.stringify(analysis.participants || []),
        meeting_type: 'uploaded',
        processing_status: 'completed',
        duration_minutes: this.estimateDuration(transcript)
      };

      // Save to database
      await this.db.insert('meetings', meeting);

      // Process ticket mentions
      if (analysis.ticketMentions && analysis.ticketMentions.length > 0) {
        await this.processTicketMentions(meetingId, analysis.ticketMentions, analysis);
      }

      console.log(`Successfully processed meeting ${meetingId}`);
      return meeting;

    } catch (error) {
      console.error('Error processing text transcript:', error);
      throw error;
    }
  }

  async processAudioFile(audioFile, meetingData) {
    try {
      console.log('Processing audio file:', meetingData.fileName);

      // For now, queue for processing (would integrate with Whisper API in production)
      const meetingId = uuidv4();
      const meeting = {
        id: meetingId,
        team_id: meetingData.teamId || 'default',
        title: meetingData.title || 'Audio Meeting',
        start_time: new Date().toISOString(),
        transcript_text: null,
        processed_data: null,
        participants: JSON.stringify([]),
        meeting_type: 'audio',
        processing_status: 'pending',
        audio_file_path: `audio/${meetingId}`,
        duration_minutes: 0
      };

      // Save to database
      await this.db.insert('meetings', meeting);

      // Store audio file
      await storage.set(`audio:${meetingId}`, audioFile);

      // Queue for processing
      await this.queueAudioProcessing(meetingId);

      console.log(`Queued audio meeting ${meetingId} for processing`);
      return meeting;

    } catch (error) {
      console.error('Error processing audio file:', error);
      throw error;
    }
  }

  async processTicketMentions(meetingId, ticketMentions, analysis) {
    try {
      for (const mention of ticketMentions) {
        const ticketMentionRecord = {
          id: uuidv4(),
          meeting_id: meetingId,
          ticket_id: mention.ticketId,
          discussion_summary: mention.context || '',
          action_items: JSON.stringify(analysis.actionItems || []),
          key_decisions: JSON.stringify(analysis.keyDecisions || []),
          sentiment_score: mention.sentiment || 0.0,
          confidence_score: mention.confidence || 0.0,
          mcp_update_status: 'pending'
        };

        await this.db.insert('ticket_mentions', ticketMentionRecord);
      }

      console.log(`Processed ${ticketMentions.length} ticket mentions for meeting ${meetingId}`);
    } catch (error) {
      console.error('Error processing ticket mentions:', error);
      throw error;
    }
  }

  async queueAudioProcessing(meetingId) {
    try {
      const queueItem = {
        id: uuidv4(),
        task_type: 'audio_processing',
        payload: JSON.stringify({ meetingId }),
        status: 'pending',
        priority: 5,
        scheduled_at: new Date().toISOString()
      };

      await this.db.insert('processing_queue', queueItem);
      console.log(`Queued audio processing for meeting ${meetingId}`);
    } catch (error) {
      console.error('Error queueing audio processing:', error);
      throw error;
    }
  }

  async saveMeeting(meetingData) {
    try {
      await this.db.insertOrUpdate('meetings', meetingData, 'id');
      
      // Clear cache for affected tickets
      if (meetingData.ticketMentions) {
        for (const mention of meetingData.ticketMentions) {
          await storage.delete(`meetings:${mention.ticketId}`);
        }
      }

      console.log(`Saved meeting ${meetingData.id}`);
    } catch (error) {
      console.error('Error saving meeting:', error);
      throw error;
    }
  }

  async deleteMeeting(meetingId) {
    try {
      // Get meeting details first
      const meeting = await this.db.findById('meetings', meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Delete related records
      await this.db.delete('ticket_mentions', { meeting_id: meetingId });
      await this.db.delete('meetings', { id: meetingId });

      // Clean up stored files
      await storage.delete(`audio:${meetingId}`);
      await storage.delete(`meeting:${meetingId}:file`);
      await storage.delete(`meeting:${meetingId}:data`);

      console.log(`Deleted meeting ${meetingId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  estimateDuration(transcript) {
    // Rough estimate: average speaking pace is about 150 words per minute
    const wordCount = transcript.split(/\s+/).length;
    return Math.ceil(wordCount / 150);
  }
}

export default MeetingService;