import api, { route } from '@forge/api';

class JiraService {
  constructor() {
    this.mcpEnabled = process.env.NODE_ENV === 'production';
    this.baseUrl = process.env.JIRA_BASE_URL;
  }

  async updateTicketWithMeetingContext(ticketKey, meetingData) {
    try {
      console.log(`Updating ticket ${ticketKey} with meeting context`);

      // Try MCP first, then fallback to REST API
      if (this.mcpEnabled) {
        try {
          return await this.updateViaMCP(ticketKey, meetingData);
        } catch (mcpError) {
          console.warn('MCP update failed, falling back to REST API:', mcpError);
          return await this.updateViaRestAPI(ticketKey, meetingData);
        }
      } else {
        return await this.updateViaRestAPI(ticketKey, meetingData);
      }

    } catch (error) {
      console.error('Error updating Jira ticket:', error);
      throw error;
    }
  }

  async updateViaMCP(ticketKey, meetingData) {
    // This would integrate with the MCP client in production
    // For now, we'll simulate the MCP call structure
    
    const mcpPayload = {
      server: 'jira-mcp',
      tool: 'add_comment',
      arguments: {
        issue_key: ticketKey,
        comment: this.formatMeetingComment(meetingData),
        properties: {
          meetingId: meetingData.id,
          source: 'meetingsync'
        }
      }
    };

    console.log('MCP payload:', mcpPayload);
    
    // In a real implementation, this would call the MCP server
    // For now, we'll fall back to REST API
    throw new Error('MCP not available in this environment');
  }

  async updateViaRestAPI(ticketKey, meetingData) {
    try {
      const comment = this.formatMeetingComment(meetingData);
      
      // Use Forge API instead of direct fetch for proper authentication
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${ticketKey}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'panel',
                  attrs: {
                    panelType: 'info'
                  },
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: '🎙️ Meeting Context Added',
                          marks: [{ type: 'strong' }]
                        }
                      ]
                    },
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: comment
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            properties: {
              meetingId: meetingData.id,
              source: 'meetingsync'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Successfully updated ${ticketKey} via REST API`);
      return result;

    } catch (error) {
      console.error('REST API update failed:', error);
      throw error;
    }
  }

  formatMeetingComment(meetingData) {
    let comment = `📅 Meeting: ${meetingData.title}\n`;
    comment += `⏰ Date: ${new Date(meetingData.start_time).toLocaleString()}\n`;
    
    if (meetingData.duration_minutes) {
      comment += `⏱️ Duration: ${meetingData.duration_minutes} minutes\n`;
    }

    if (meetingData.participants && meetingData.participants.length > 0) {
      comment += `👥 Participants: ${meetingData.participants.join(', ')}\n`;
    }

    comment += '\n';

    // Add processed insights
    const processedData = typeof meetingData.processed_data === 'string' 
      ? JSON.parse(meetingData.processed_data) 
      : meetingData.processed_data;

    if (processedData) {
      if (processedData.summary) {
        comment += `📝 Summary:\n${processedData.summary}\n\n`;
      }

      if (processedData.actionItems && processedData.actionItems.length > 0) {
        comment += '✅ Action Items:\n';
        processedData.actionItems.forEach(item => {
          comment += `• ${item}\n`;
        });
        comment += '\n';
      }

      if (processedData.keyDecisions && processedData.keyDecisions.length > 0) {
        comment += '🎯 Key Decisions:\n';
        processedData.keyDecisions.forEach(decision => {
          comment += `• ${decision}\n`;
        });
        comment += '\n';
      }
    }

    comment += '_Added automatically by MeetingSync_';
    return comment;
  }

  async getTicketDetails(ticketKey) {
    try {
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${ticketKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get ticket details: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting ticket details:', error);
      throw error;
    }
  }

  async searchTickets(query) {
    try {
      const jql = `text ~ "${query}" OR summary ~ "${query}"`;
      
      // Use Forge API with proper authentication instead of direct fetch
      // This endpoint is now included in the external.fetch.client permissions
      const response = await api.asUser().requestJira(route`/rest/api/3/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          jql: jql,
          maxResults: 20,
          fields: ['key', 'summary', 'status', 'assignee']
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result = await response.json();
      return result.issues || [];

    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    }
  }

  async updateTicketStatus(ticketKey, statusId, comment) {
    try {
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${ticketKey}/transitions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            transition: {
              id: statusId
            },
            update: {
              comment: [{
                add: {
                  body: {
                    type: 'doc',
                    version: 1,
                    content: [{
                      type: 'paragraph',
                      content: [{
                        type: 'text',
                        text: comment
                      }]
                    }]
                  }
                }
              }]
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.status}`);
      }

      console.log(`Updated status for ${ticketKey}`);
      return true;

    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }
}

export default JiraService;