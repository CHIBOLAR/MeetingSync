import nlp from 'nlp-compromise';
import Fuse from 'fuse.js';

class MeetingProcessor {
  constructor() {
    // Configuration for different processing tiers
    this.config = {
      basic: {
        useAI: false,
        maxTranscriptLength: 50000,
        summaryLength: 500
      },
      ai: {
        useAI: true,
        maxTranscriptLength: 100000,
        summaryLength: 1000
      }
    };
  }

  /**
   * Process a meeting transcript and extract ticket mentions and insights
   * @param {string} transcript - The meeting transcript text
   * @param {string} tier - Processing tier: 'basic' or 'ai'
   * @returns {Object} Processed meeting data
   */
  async processMeeting(transcript, tier = 'basic') {
    try {
      console.log(`Processing meeting with tier: ${tier}`);
      
      const config = this.config[tier] || this.config.basic;
      
      // Validate and clean transcript
      const cleanTranscript = this.cleanTranscript(transcript, config.maxTranscriptLength);
      
      // Extract ticket mentions
      const ticketMentions = this.extractTicketMentions(cleanTranscript);
      
      // Generate summary based on tier
      const summary = tier === 'ai' 
        ? await this.generateAISummary(cleanTranscript, config.summaryLength)
        : this.generateBasicSummary(cleanTranscript, config.summaryLength);
      
      // Extract action items
      const actionItems = this.extractActionItems(cleanTranscript);
      
      // Extract key decisions
      const keyDecisions = this.extractKeyDecisions(cleanTranscript);
      
      // Identify participants (if possible)
      const participants = this.identifyParticipants(cleanTranscript);
      
      return {
        transcript: cleanTranscript,
        ticketMentions,
        summary,
        actionItems,
        keyDecisions,
        participants,
        processingTier: tier,
        processedAt: new Date().toISOString(),
        wordCount: cleanTranscript.split(' ').length
      };
      
    } catch (error) {
      console.error('Error processing meeting:', error);
      throw new Error(`Meeting processing failed: ${error.message}`);
    }
  }

  /**
   * Clean and validate transcript text
   */
  cleanTranscript(transcript, maxLength) {
    if (!transcript || typeof transcript !== 'string') {
      throw new Error('Invalid transcript provided');
    }
    
    // Remove excessive whitespace and normalize
    let cleaned = transcript
      .replace(/\s+/g, ' ')
      .trim();
    
    // Truncate if too long
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
      console.warn(`Transcript truncated to ${maxLength} characters`);
    }
    
    return cleaned;
  }

  /**
   * Extract Jira ticket mentions from transcript
   */
  extractTicketMentions(transcript) {
    try {
      // Enhanced regex patterns for ticket detection
      const patterns = [
        /\b([A-Z]{2,10}-\d+)\b/g,  // Standard format: PROJ-123
        /\bticket\s+([A-Z]{2,10}-\d+)/gi,  // "ticket PROJ-123"
        /\bissue\s+([A-Z]{2,10}-\d+)/gi,   // "issue PROJ-123"
        /\b([A-Z]{2,10})\s+(\d+)\b/g       // "PROJ 123" (separated)
      ];
      
      const mentions = new Set();
      const mentionDetails = [];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(transcript)) !== null) {
          let ticketId;
          
          if (match[1] && match[2]) {
            // Handle separated format (PROJ 123)
            ticketId = `${match[1]}-${match[2]}`;
          } else {
            ticketId = match[1];
          }
          
          if (ticketId && !mentions.has(ticketId)) {
            mentions.add(ticketId);
            
            // Extract context around the mention
            const context = this.extractMentionContext(transcript, match.index, ticketId);
            
            mentionDetails.push({
              ticketId,
              context,
              position: match.index,
              confidence: this.calculateMentionConfidence(context, ticketId)
            });
          }
        }
      }
      
      console.log(`Found ${mentions.size} unique ticket mentions:`, Array.from(mentions));
      return mentionDetails;
      
    } catch (error) {
      console.error('Error extracting ticket mentions:', error);
      return [];
    }
  }

  /**
   * Extract context around a ticket mention
   */
  extractMentionContext(transcript, position, ticketId) {
    const contextRadius = 150; // characters before and after
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(transcript.length, position + ticketId.length + contextRadius);
    
    return transcript.substring(start, end).trim();
  }

  /**
   * Calculate confidence score for ticket mention
   */
  calculateMentionConfidence(context, ticketId) {
    let confidence = 0.5; // base confidence
    
    const indicators = [
      /\b(fix|close|resolve|complete|implement|work on|update|review)\b/i,
      /\b(bug|issue|task|story|epic)\b/i,
      /\b(jira|ticket|card)\b/i,
      /\b(assigned|responsible|owner)\b/i
    ];
    
    for (const indicator of indicators) {
      if (indicator.test(context)) {
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate AI-powered summary (placeholder for AI integration)
   */
  async generateAISummary(transcript, maxLength) {
    try {
      // This is a placeholder for AI integration
      // In a real implementation, you'd call an AI service like OpenAI, Claude, etc.
      console.log('AI summary generation not implemented, falling back to basic summary');
      return this.generateBasicSummary(transcript, maxLength);
      
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return this.generateBasicSummary(transcript, maxLength);
    }
  }

  /**
   * Generate basic summary using NLP
   */
  generateBasicSummary(transcript, maxLength) {
    try {
      if (!transcript || transcript.length < 50) {
        return 'Meeting transcript too short to summarize.';
      }

      // Split into sentences
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      if (sentences.length <= 3) {
        return sentences.join('. ').trim() + '.';
      }

      // Score sentences based on keyword frequency and position
      const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        
        // Position score (earlier and later sentences are more important)
        if (index < sentences.length * 0.3) score += 0.3;
        if (index > sentences.length * 0.7) score += 0.2;
        
        // Keyword scoring
        const keywords = ['decided', 'agreed', 'will', 'should', 'must', 'important', 'action', 'next', 'follow', 'issue', 'problem', 'solution'];
        keywords.forEach(keyword => {
          if (sentence.toLowerCase().includes(keyword)) {
            score += 0.1;
          }
        });
        
        // Length penalty for very short or very long sentences
        if (sentence.length < 20 || sentence.length > 200) {
          score -= 0.1;
        }
        
        return { sentence: sentence.trim(), score, index };
      });

      // Select top sentences
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(5, Math.ceil(sentences.length * 0.3)))
        .sort((a, b) => a.index - b.index);

      let summary = topSentences.map(s => s.sentence).join('. ');
      
      // Truncate if too long
      if (summary.length > maxLength) {
        summary = summary.substring(0, maxLength - 3) + '...';
      }

      return summary || 'Unable to generate meaningful summary.';
      
    } catch (error) {
      console.error('Error generating basic summary:', error);
      return 'Error generating summary.';
    }
  }

  /**
   * Extract action items from transcript
   */
  extractActionItems(transcript) {
    try {
      const actionPatterns = [
        /(?:^|\.|;)\s*([^.;]*(?:will|should|must|need to|have to|going to|action|todo|task).*?)(?:\.|;|$)/gi,
        /(?:^|\.|;)\s*([^.;]*(?:follow up|follow-up|next step|action item).*?)(?:\.|;|$)/gi,
        /(?:^|\.|;)\s*([^.;]*(?:assign|responsible|owner|due).*?)(?:\.|;|$)/gi
      ];

      const actions = [];
      
      for (const pattern of actionPatterns) {
        let match;
        while ((match = pattern.exec(transcript)) !== null) {
          const action = match[1].trim();
          
          if (action.length > 10 && action.length < 300) {
            const responsible = this.extractResponsiblePerson(action);
            const confidence = this.calculateActionConfidence(action);
            
            actions.push({
              action,
              responsible,
              confidence,
              context: this.extractActionContext(transcript, match.index)
            });
          }
        }
      }

      return this.removeDuplicateActions(actions)
        .filter(action => action.confidence > 0.3)
        .slice(0, 10); // Limit to top 10 actions
      
    } catch (error) {
      console.error('Error extracting action items:', error);
      return [];
    }
  }

  /**
   * Extract key decisions from transcript
   */
  extractKeyDecisions(transcript) {
    try {
      const decisionPatterns = [
        /(?:^|\.|;)\s*([^.;]*(?:decided|agreed|concluded|determined|resolved).*?)(?:\.|;|$)/gi,
        /(?:^|\.|;)\s*([^.;]*(?:decision|choice|option|approach|solution).*?)(?:\.|;|$)/gi,
        /(?:^|\.|;)\s*([^.;]*(?:we will|team will|going with|chosen|selected).*?)(?:\.|;|$)/gi
      ];

      const decisions = [];
      
      for (const pattern of decisionPatterns) {
        let match;
        while ((match = pattern.exec(transcript)) !== null) {
          const decision = match[1].trim();
          
          if (decision.length > 10 && decision.length < 300) {
            const confidence = this.calculateDecisionConfidence(decision);
            
            decisions.push({
              decision,
              confidence,
              context: this.extractDecisionContext(transcript, match.index)
            });
          }
        }
      }

      return this.removeDuplicateDecisions(decisions)
        .filter(decision => decision.confidence > 0.4)
        .slice(0, 8); // Limit to top 8 decisions
      
    } catch (error) {
      console.error('Error extracting key decisions:', error);
      return [];
    }
  }

  /**
   * Identify participants from transcript
   */
  identifyParticipants(transcript) {
    try {
      const namePatterns = [
        /\b([A-Z][a-z]+)\s+(?:said|mentioned|asked|suggested|noted|stated)/gi,
        /\b([A-Z][a-z]+):\s/g, // Speaker format
        /(?:thanks|thank you)\s+([A-Z][a-z]+)/gi
      ];

      const participants = new Set();
      
      for (const pattern of namePatterns) {
        let match;
        while ((match = pattern.exec(transcript)) !== null) {
          const name = match[1];
          if (name.length > 2 && name.length < 20) {
            participants.add(name);
          }
        }
      }

      return Array.from(participants).slice(0, 10); // Limit to 10 participants
      
    } catch (error) {
      console.error('Error identifying participants:', error);
      return [];
    }
  }

  /**
   * Calculate confidence score for action items
   */
  calculateActionConfidence(action) {
    let confidence = 0.3; // base confidence
    
    const indicators = [
      /\b(will|must|should|need to|have to)\b/i,
      /\b(by|due|deadline|before)\b/i,
      /\b(assign|responsible|owner)\b/i,
      /\b(action|task|todo|follow up)\b/i
    ];
    
    for (const indicator of indicators) {
      if (indicator.test(action)) {
        confidence += 0.15;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score for decisions
   */
  calculateDecisionConfidence(decision) {
    let confidence = 0.4; // base confidence
    
    const indicators = [
      /\b(decided|agreed|concluded|determined)\b/i,
      /\b(final|final decision|consensus)\b/i,
      /\b(approved|accepted|chosen|selected)\b/i,
      /\b(going with|moving forward)\b/i
    ];
    
    for (const indicator of indicators) {
      if (indicator.test(decision)) {
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract context around an action item
   */
  extractActionContext(transcript, position) {
    const contextRadius = 100;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(transcript.length, position + contextRadius);
    
    return transcript.substring(start, end).trim();
  }

  /**
   * Extract context around a decision
   */
  extractDecisionContext(transcript, position) {
    const contextRadius = 100;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(transcript.length, position + contextRadius);
    
    return transcript.substring(start, end).trim();
  }

  /**
   * Extract responsible person from action text
   */
  extractResponsiblePerson(actionText) {
    try {
      const patterns = [
        /\b([A-Z][a-z]+)\s+(?:will|should|must|needs? to)/i,
        /(?:assign|assigned to|responsible|owner)\s+([A-Z][a-z]+)/i,
        /\b([A-Z][a-z]+)\s+(?:is|was)\s+(?:responsible|assigned)/i
      ];

      for (const pattern of patterns) {
        const match = pattern.exec(actionText);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error extracting responsible person:', error);
      return null;
    }
  }

  /**
   * Remove duplicate action items using fuzzy matching
   */
  removeDuplicateActions(actionItems) {
    if (actionItems.length <= 1) return actionItems;
    
    const fuse = new Fuse(actionItems, {
      keys: ['action'],
      threshold: 0.3 // Similarity threshold
    });
    
    const unique = [];
    const processed = new Set();
    
    for (const item of actionItems) {
      if (processed.has(item.action)) continue;
      
      const similar = fuse.search(item.action);
      let bestItem = item;
      
      // Find the best version among similar items
      for (const result of similar) {
        if (result.item.confidence > bestItem.confidence) {
          bestItem = result.item;
        }
        processed.add(result.item.action);
      }
      
      unique.push(bestItem);
    }
    
    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Remove duplicate decisions using fuzzy matching
   */
  removeDuplicateDecisions(decisions) {
    if (decisions.length <= 1) return decisions;
    
    const fuse = new Fuse(decisions, {
      keys: ['decision'],
      threshold: 0.3
    });
    
    const unique = [];
    const processed = new Set();
    
    for (const item of decisions) {
      if (processed.has(item.decision)) continue;
      
      const similar = fuse.search(item.decision);
      let bestItem = item;
      
      for (const result of similar) {
        if (result.item.confidence > bestItem.confidence) {
          bestItem = result.item;
        }
        processed.add(result.item.decision);
      }
      
      unique.push(bestItem);
    }
    
    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate processed meeting data
   */
  validateProcessedData(data) {
    const errors = [];
    
    if (!data.transcript || data.transcript.length < 10) {
      errors.push('Transcript is too short or missing');
    }
    
    if (!data.summary || data.summary.length < 20) {
      errors.push('Summary is too short or missing');
    }
    
    if (!Array.isArray(data.ticketMentions)) {
      errors.push('Ticket mentions must be an array');
    }
    
    if (!Array.isArray(data.actionItems)) {
      errors.push('Action items must be an array');
    }
    
    if (!Array.isArray(data.keyDecisions)) {
      errors.push('Key decisions must be an array');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(data) {
    return {
      transcriptLength: data.transcript?.length || 0,
      wordCount: data.wordCount || 0,
      ticketMentionsCount: data.ticketMentions?.length || 0,
      actionItemsCount: data.actionItems?.length || 0,
      keyDecisionsCount: data.keyDecisions?.length || 0,
      participantsCount: data.participants?.length || 0,
      processingTier: data.processingTier || 'unknown',
      processedAt: data.processedAt
    };
  }

  /**
   * Format processing results for display
   */
  formatForDisplay(data) {
    try {
      this.validateProcessedData(data);
      
      return {
        summary: data.summary,
        ticketMentions: data.ticketMentions.map(mention => ({
          ticketId: mention.ticketId,
          context: mention.context.length > 100 
            ? mention.context.substring(0, 100) + '...'
            : mention.context,
          confidence: Math.round(mention.confidence * 100)
        })),
        actionItems: data.actionItems.map(item => ({
          action: item.action,
          responsible: item.responsible || 'Unassigned',
          confidence: Math.round(item.confidence * 100)
        })),
        keyDecisions: data.keyDecisions.map(decision => ({
          decision: decision.decision,
          confidence: Math.round(decision.confidence * 100)
        })),
        participants: data.participants,
        stats: this.getProcessingStats(data)
      };
      
    } catch (error) {
      console.error('Error formatting for display:', error);
      throw error;
    }
  }

  /**
   * Process meeting for specific ticket context
   */
  async processForTicketContext(transcript, ticketId, tier = 'basic') {
    try {
      // First do general processing
      const generalProcessing = await this.processMeeting(transcript, tier);
      
      // Filter and enhance results for specific ticket
      const relevantMentions = generalProcessing.ticketMentions
        .filter(mention => mention.ticketId === ticketId);
      
      if (relevantMentions.length === 0) {
        return {
          ...generalProcessing,
          ticketSpecific: {
            relevant: false,
            summary: 'This meeting does not appear to discuss the specified ticket.',
            mentions: [],
            actionItems: [],
            keyDecisions: []
          }
        };
      }
      
      // Extract ticket-specific context
      const ticketSpecificSummary = this.generateTicketSpecificSummary(
        transcript, 
        ticketId, 
        relevantMentions
      );
      
      const ticketSpecificActions = this.filterTicketSpecificActions(
        generalProcessing.actionItems, 
        ticketId
      );
      
      const ticketSpecificDecisions = this.filterTicketSpecificDecisions(
        generalProcessing.keyDecisions, 
        ticketId
      );
      
      return {
        ...generalProcessing,
        ticketSpecific: {
          relevant: true,
          summary: ticketSpecificSummary,
          mentions: relevantMentions,
          actionItems: ticketSpecificActions,
          keyDecisions: ticketSpecificDecisions
        }
      };
      
    } catch (error) {
      console.error('Error processing for ticket context:', error);
      throw error;
    }
  }

  /**
   * Generate ticket-specific summary
   */
  generateTicketSpecificSummary(transcript, ticketId, mentions) {
    try {
      const contexts = mentions.map(m => m.context).join(' ');
      const ticketSummary = this.generateBasicSummary(contexts, 300);
      
      return `Discussion about ${ticketId}: ${ticketSummary}`;
      
    } catch (error) {
      console.error('Error generating ticket-specific summary:', error);
      return `Meeting discussed ${ticketId} but summary generation failed.`;
    }
  }

  /**
   * Filter actions related to specific ticket
   */
  filterTicketSpecificActions(actionItems, ticketId) {
    return actionItems.filter(item => 
      item.action.toLowerCase().includes(ticketId.toLowerCase()) ||
      item.action.toLowerCase().includes('ticket') ||
      item.action.toLowerCase().includes('issue')
    );
  }

  /**
   * Filter decisions related to specific ticket
   */
  filterTicketSpecificDecisions(decisions, ticketId) {
    return decisions.filter(decision => 
      decision.decision.toLowerCase().includes(ticketId.toLowerCase()) ||
      decision.decision.toLowerCase().includes('ticket') ||
      decision.decision.toLowerCase().includes('issue')
    );
  }
}

export default MeetingProcessor;