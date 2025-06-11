import nlp from 'nlp-compromise';
import Fuse from 'fuse.js';

class TextProcessor {
  constructor() {
    // Initialize fuzzy search for better ticket detection
    this.ticketPattern = /\b([A-Z][A-Z0-9]*-\d+)\b/g;
    this.actionWords = ['will', 'should', 'need to', 'must', 'todo', 'action', 'assign', 'follow up'];
    this.decisionWords = ['decided', 'agreed', 'conclusion', 'final', 'resolved', 'determined'];
  }

  async analyzeTranscript(transcript) {
    try {
      console.log('Analyzing transcript...');
      
      const analysis = {
        ticketMentions: this.extractTicketMentions(transcript),
        summary: this.generateSummary(transcript),
        actionItems: this.extractActionItems(transcript),
        keyDecisions: this.extractKeyDecisions(transcript),
        participants: this.extractParticipants(transcript),
        sentiment: this.analyzeSentiment(transcript),
        topics: this.extractTopics(transcript)
      };

      console.log(`Analysis complete: ${analysis.ticketMentions.length} tickets, ${analysis.actionItems.length} action items`);
      return analysis;

    } catch (error) {
      console.error('Error analyzing transcript:', error);
      throw error;
    }
  }

  extractTicketMentions(transcript) {
    const mentions = [];
    const matches = transcript.match(this.ticketPattern) || [];
    
    // Remove duplicates and analyze context
    const uniqueTickets = [...new Set(matches)];
    
    for (const ticket of uniqueTickets) {
      const context = this.extractTicketContext(transcript, ticket);
      mentions.push({
        ticketId: ticket,
        context: context,
        confidence: this.calculateConfidence(context),
        sentiment: this.analyzeSentiment(context)
      });
    }

    return mentions;
  }

  extractTicketContext(transcript, ticketId) {
    // Find sentences containing the ticket ID
    const sentences = transcript.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      sentence.includes(ticketId)
    );

    // Get surrounding context (previous and next sentences)
    const contextSentences = [];
    sentences.forEach((sentence, index) => {
      if (sentence.includes(ticketId)) {
        // Add previous sentence
        if (index > 0) contextSentences.push(sentences[index - 1]);
        // Add current sentence
        contextSentences.push(sentence);
        // Add next sentence
        if (index < sentences.length - 1) contextSentences.push(sentences[index + 1]);
      }
    });

    return contextSentences.join('. ').trim();
  }

  generateSummary(transcript) {
    try {
      // Use NLP library to extract key sentences
      const doc = nlp(transcript);
      const sentences = doc.sentences().data();
      
      // Score sentences based on keyword frequency and position
      const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        
        // Position score (beginning and end are more important)
        if (index < sentences.length * 0.3) score += 2;
        if (index > sentences.length * 0.7) score += 1;
        
        // Keyword score
        const text = sentence.text.toLowerCase();
        if (this.actionWords.some(word => text.includes(word))) score += 3;
        if (this.decisionWords.some(word => text.includes(word))) score += 3;
        if (this.ticketPattern.test(sentence.text)) score += 2;
        
        // Length score (prefer medium-length sentences)
        const wordCount = sentence.text.split(' ').length;
        if (wordCount >= 10 && wordCount <= 30) score += 1;
        
        return { sentence: sentence.text, score };
      });

      // Select top sentences for summary
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.sentence);

      return topSentences.join(' ');

    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback: return first few sentences
      return transcript.split(/[.!?]+/).slice(0, 2).join('. ');
    }
  }

  extractActionItems(transcript) {
    const actionItems = [];
    const sentences = transcript.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // Look for action-oriented language
      if (this.actionWords.some(word => lowerSentence.includes(word))) {
        // Extract the main action
        const doc = nlp(sentence);
        const verbs = doc.verbs().data();
        
        if (verbs.length > 0) {
          actionItems.push(sentence.trim());
        }
      }
    }

    // Remove duplicates and filter out very short items
    return [...new Set(actionItems)]
      .filter(item => item.length > 10)
      .slice(0, 10); // Limit to 10 items
  }

  extractKeyDecisions(transcript) {
    const decisions = [];
    const sentences = transcript.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // Look for decision-oriented language
      if (this.decisionWords.some(word => lowerSentence.includes(word))) {
        decisions.push(sentence.trim());
      }
    }

    // Remove duplicates and filter
    return [...new Set(decisions)]
      .filter(item => item.length > 10)
      .slice(0, 5); // Limit to 5 decisions
  }

  extractParticipants(transcript) {
    try {
      // Look for speaker patterns like "John:", "Sarah said", etc.
      const speakerPatterns = [
        /^([A-Z][a-z]+):/gm,  // "John:"
        /([A-Z][a-z]+)\s+said/gi,  // "John said"
        /([A-Z][a-z]+)\s+mentioned/gi,  // "John mentioned"
        /([A-Z][a-z]+)\s+asked/gi   // "John asked"
      ];
      
      const participants = new Set();
      
      for (const pattern of speakerPatterns) {
        const matches = transcript.match(pattern) || [];
        for (const match of matches) {
          const name = match.replace(/[:\s]+(said|mentioned|asked).*$/i, '').trim();
          if (name.length > 1 && name.length < 20) {
            participants.add(name);
          }
        }
      }
      
      return Array.from(participants).slice(0, 10); // Limit to 10 participants

    } catch (error) {
      console.error('Error extracting participants:', error);
      return [];
    }
  }

  analyzeSentiment(text) {
    try {
      // Simple sentiment analysis based on keyword scoring
      const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'complete', 'done', 'resolved'];
      const negativeWords = ['bad', 'problem', 'issue', 'fail', 'block', 'stuck', 'difficult', 'concern'];
      
      const lowerText = text.toLowerCase();
      let score = 0;
      
      for (const word of positiveWords) {
        const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
        score += matches * 1;
      }
      
      for (const word of negativeWords) {
        const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
        score -= matches * 1;
      }
      
      // Normalize to -1 to 1 range
      const wordCount = text.split(' ').length;
      return Math.max(-1, Math.min(1, score / Math.max(wordCount * 0.1, 1)));

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 0;
    }
  }

  extractTopics(transcript) {
    try {
      // Extract key phrases and topics
      const doc = nlp(transcript);
      const nouns = doc.nouns().data();
      const topics = [];
      
      // Count noun frequency
      const nounCounts = {};
      for (const noun of nouns) {
        const word = noun.text.toLowerCase();
        if (word.length > 3) { // Filter short words
          nounCounts[word] = (nounCounts[word] || 0) + 1;
        }
      }
      
      // Get top topics
      const sortedTopics = Object.entries(nounCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);
      
      return sortedTopics;

    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }

  calculateConfidence(context) {
    // Simple confidence scoring based on context richness
    const wordCount = context.split(' ').length;
    const hasActionWords = this.actionWords.some(word => 
      context.toLowerCase().includes(word)
    );
    
    let confidence = Math.min(wordCount / 20, 1); // Base score from word count
    if (hasActionWords) confidence += 0.2;
    
    return Math.min(confidence, 1);
  }
}

export default TextProcessor;