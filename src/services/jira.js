import { requestJira } from '@forge/bridge';
import api, { route } from '@forge/api';

class JiraService {
  constructor() {
    this.apiBaseUrl = '/rest/api/3';
  }

  /**
   * Get issue details by key
   */
  async getIssue(issueKey) {
    try {
      const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issue ${issueKey}: ${response.status}`);
      }

      const issue = await response.json();
      
      return {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status,
        assignee: issue.fields.assignee,
        reporter: issue.fields.reporter,
        priority: issue.fields.priority,
        issueType: issue.fields.issuetype,
        project: issue.fields.project,
        created: issue.fields.created,
        updated: issue.fields.updated,
        labels: issue.fields.labels || [],
        components: issue.fields.components || []
      };

    } catch (error) {
      console.error(`Error fetching issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Add comment to a Jira issue
   */
  async addComment(issueKey, commentBody, visibility = null) {
    try {
      const comment = {
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: commentBody
                }
              ]
            }
          ]
        }
      };

      if (visibility) {
        comment.visibility = visibility;
      }

      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${issueKey}/comment`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(comment)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add comment to ${issueKey}: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Comment added to ${issueKey}:`, result.id);
      
      return result;

    } catch (error) {
      console.error(`Error adding comment to ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Add meeting context comment to issue
   */
  async addMeetingContextComment(issueKey, meetingData) {
    try {
      const formattedComment = this.formatMeetingComment(meetingData);
      return await this.addComment(issueKey, formattedComment);

    } catch (error) {
      console.error(`Error adding meeting context to ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Format meeting data into a Jira comment
   */
  formatMeetingComment(meetingData) {
    const { meeting, mentions, actionItems, keyDecisions } = meetingData;
    
    let comment = `🎯 **Meeting Context: ${meeting.title}**\n`;
    comment += `📅 Date: ${new Date(meeting.start_time).toLocaleDateString()}\n\n`;
    
    if (mentions && mentions.length > 0) {
      comment += `**Discussion Summary:**\n`;
      mentions.forEach(mention => {
        if (mention.discussion_summary) {
          comment += `• ${mention.discussion_summary}\n`;
        }
      });
      comment += `\n`;
    }
    
    if (actionItems && actionItems.length > 0) {
      comment += `**Action Items:**\n`;
      actionItems.forEach(item => {
        const responsible = item.responsible ? ` (@${item.responsible})` : '';
        comment += `• ${item.action}${responsible}\n`;
      });
      comment += `\n`;
    }
    
    if (keyDecisions && keyDecisions.length > 0) {
      comment += `**Key Decisions:**\n`;
      keyDecisions.forEach(decision => {
        comment += `• ${decision.decision}\n`;
      });
      comment += `\n`;
    }
    
    comment += `*Added automatically by MeetingSync*`;
    
    return comment;
  }

  /**
   * Search issues by JQL
   */
  async searchIssues(jql, fields = ['key', 'summary', 'status'], maxResults = 50) {
    try {
      const params = new URLSearchParams({
        jql: jql,
        fields: fields.join(','),
        maxResults: maxResults.toString()
      });

      const response = await api.asUser().requestJira(
        route`/rest/api/3/search?${params}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`JQL search failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        issues: result.issues || [],
        total: result.total || 0,
        maxResults: result.maxResults || maxResults
      };

    } catch (error) {
      console.error('Error searching issues:', error);
      throw error;
    }
  }

  /**
   * Get issues by project
   */
  async getProjectIssues(projectKey, maxResults = 100) {
    const jql = `project = ${projectKey} ORDER BY updated DESC`;
    return await this.searchIssues(jql, ['key', 'summary', 'status', 'assignee'], maxResults);
  }

  /**
   * Validate issue key format
   */
  validateIssueKey(issueKey) {
    const pattern = /^[A-Z]{2,10}-\d+$/;
    return pattern.test(issueKey);
  }

  /**
   * Check if issue exists
   */
  async issueExists(issueKey) {
    try {
      if (!this.validateIssueKey(issueKey)) {
        return false;
      }

      await this.getIssue(issueKey);
      return true;

    } catch (error) {
      if (error.message.includes('404')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueKey, maxResults = 50) {
    try {
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${issueKey}/comment?maxResults=${maxResults}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch comments for ${issueKey}: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        comments: result.comments || [],
        total: result.total || 0,
        maxResults: result.maxResults || maxResults
      };

    } catch (error) {
      console.error(`Error fetching comments for ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Update issue field
   */
  async updateIssueField(issueKey, fieldUpdates) {
    try {
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${issueKey}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: fieldUpdates
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update issue ${issueKey}: ${response.status}`);
      }

      console.log(`Updated issue ${issueKey} fields:`, Object.keys(fieldUpdates));
      return true;

    } catch (error) {
      console.error(`Error updating issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Add labels to issue
   */
  async addLabelsToIssue(issueKey, newLabels) {
    try {
      const issue = await this.getIssue(issueKey);
      const existingLabels = issue.labels || [];
      
      // Merge and deduplicate labels
      const allLabels = [...new Set([...existingLabels, ...newLabels])];
      
      await this.updateIssueField(issueKey, {
        labels: allLabels
      });

      console.log(`Added labels to ${issueKey}:`, newLabels);
      return allLabels;

    } catch (error) {
      console.error(`Error adding labels to ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Transition issue (change status)
   */
  async transitionIssue(issueKey, transitionId, comment = null) {
    try {
      const transitionData = {
        transition: {
          id: transitionId
        }
      };

      if (comment) {
        transitionData.update = {
          comment: [{
            add: {
              body: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: comment
                      }
                    ]
                  }
                ]
              }
            }
          }]
        };
      }

      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${issueKey}/transitions`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transitionData)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to transition issue ${issueKey}: ${response.status}`);
      }

      console.log(`Transitioned issue ${issueKey} with transition ID: ${transitionId}`);
      return true;

    } catch (error) {
      console.error(`Error transitioning issue ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Get available transitions for issue
   */
  async getAvailableTransitions(issueKey) {
    try {
      const response = await api.asUser().requestJira(
        route`/rest/api/3/issue/${issueKey}/transitions`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get transitions for ${issueKey}: ${response.status}`);
      }

      const result = await response.json();
      
      return result.transitions || [];

    } catch (error) {
      console.error(`Error getting transitions for ${issueKey}:`, error);
      throw error;
    }
  }

  /**
   * Get current user information - Now with proper read:jira-user scope
   */
  async getCurrentUser() {
    try {
      // This endpoint now has the required read:jira-user scope in manifest.yml
      const response = await api.asUser().requestJira(route`/rest/api/3/myself`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get current user: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  /**
   * Bulk update multiple issues with meeting context
   */
  async bulkUpdateWithMeetingContext(ticketMentions, meetingData) {
    const results = [];
    
    for (const mention of ticketMentions) {
      try {
        const exists = await this.issueExists(mention.ticketId);
        
        if (exists) {
          const commentResult = await this.addMeetingContextComment(
            mention.ticketId, 
            {
              meeting: meetingData.meeting,
              mentions: [mention],
              actionItems: meetingData.actionItems,
              keyDecisions: meetingData.keyDecisions
            }
          );

          results.push({
            ticketId: mention.ticketId,
            success: true,
            commentId: commentResult.id
          });

          // Add meeting label
          await this.addLabelsToIssue(mention.ticketId, ['meeting-discussed']);

        } else {
          results.push({
            ticketId: mention.ticketId,
            success: false,
            error: 'Issue not found'
          });
        }

      } catch (error) {
        results.push({
          ticketId: mention.ticketId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default JiraService;