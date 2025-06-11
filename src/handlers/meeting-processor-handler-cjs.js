const { storage } = require('@forge/api');

// Simple meeting processing handler
module.exports = async function processMessageHandler(req) {
  console.log('Meeting processing request:', req);
  
  try {
    const { transcript, issueKey } = req.payload || {};
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }
    
    // Basic processing
    const ticketMentions = extractTicketMentions(transcript);
    const summary = generateBasicSummary(transcript);
    const actionItems = extractActionItems(transcript);
    
    const result = {
      ticketMentions,
      summary,
      actionItems,
      processedAt: new Date().toISOString()
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        result
      })
    };
  } catch (error) {
    console.error('Meeting processing error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

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
      s.toLowerCase().includes('next')
    ).slice(0, 2)
  ].join('. ') + '.';
  
  return summary.trim();
}

function extractActionItems(transcript) {
  const actionWords = ['todo', 'action', 'need to', 'should', 'will', 'must', 'assign'];
  const sentences = transcript.split(/[.!?]+/);
  
  return sentences
    .filter(sentence => 
      actionWords.some(word => 
        sentence.toLowerCase().includes(word)
      )
    )
    .slice(0, 5) // Limit to top 5 action items
    .map(item => item.trim())
    .filter(item => item.length > 10);
}
