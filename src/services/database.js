import { storage } from '@forge/api';
import { v4 as uuidv4 } from 'uuid';

class DatabaseService {
  constructor() {
    // In a real Forge SQL environment, this would use the SQL API
    // For now, we'll use Forge storage as a fallback
    this.useForgeSQL = process.env.FORGE_SQL_ENABLED === 'true';
  }

  async query(sql, params = []) {
    if (this.useForgeSQL) {
      // Use Forge SQL when available
      return await this.executeSQL(sql, params);
    } else {
      // Fallback to storage-based simulation
      return await this.simulateQuery(sql, params);
    }
  }

  async executeSQL(sql, params) {
    try {
      // This would use the Forge SQL API when available
      // const result = await sql.query(sql, params);
      // return result.rows;
      
      console.log('Forge SQL query:', sql, params);
      throw new Error('Forge SQL not available in this environment');
      
    } catch (error) {
      console.error('Forge SQL error:', error);
      throw error;
    }
  }

  async simulateQuery(sql, params) {
    try {
      // Simple simulation for development/testing
      console.log('Simulating SQL query:', sql, params);
      
      if (sql.includes('SELECT') && sql.includes('meetings')) {
        return await this.simulateSelectMeetings(params);
      } else if (sql.includes('SELECT') && sql.includes('ticket_mentions')) {
        return await this.simulateSelectTicketMentions(params);
      }
      
      return [];
      
    } catch (error) {
      console.error('Query simulation error:', error);
      return [];
    }
  }

  async simulateSelectMeetings(params) {
    try {
      // Get all meetings from storage
      const meetingKeys = await storage.query()
        .where('key', 'startsWith', 'meeting:')
        .getMany();
      
      const meetings = [];
      
      for (const item of meetingKeys.results) {
        const meeting = item.value;
        if (meeting && this.matchesParams(meeting, params)) {
          meetings.push(meeting);
        }
      }
      
      return meetings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      
    } catch (error) {
      console.error('Error simulating meetings query:', error);
      return [];
    }
  }

  async simulateSelectTicketMentions(params) {
    try {
      const mentionKeys = await storage.query()
        .where('key', 'startsWith', 'ticket_mention:')
        .getMany();
      
      const mentions = [];
      
      for (const item of mentionKeys.results) {
        const mention = item.value;
        if (mention && this.matchesParams(mention, params)) {
          mentions.push(mention);
        }
      }
      
      return mentions;
      
    } catch (error) {
      console.error('Error simulating ticket mentions query:', error);
      return [];
    }
  }

  async insert(table, data) {
    if (this.useForgeSQL) {
      return await this.insertSQL(table, data);
    } else {
      return await this.insertStorage(table, data);
    }
  }

  async insertSQL(table, data) {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      
      // This would use Forge SQL API
      console.log('SQL insert:', sql, values);
      throw new Error('Forge SQL not available in this environment');
      
    } catch (error) {
      console.error('SQL insert error:', error);
      throw error;
    }
  }

  async insertStorage(table, data) {
    try {
      const id = data.id || uuidv4();
      const key = `${table}:${id}`;
      
      const record = {
        ...data,
        id,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await storage.set(key, record);
      console.log(`Inserted into ${table}:`, record);
      
      return { id, ...record };
      
    } catch (error) {
      console.error('Storage insert error:', error);
      throw error;
    }
  }

  async update(table, id, data) {
    if (this.useForgeSQL) {
      return await this.updateSQL(table, id, data);
    } else {
      return await this.updateStorage(table, id, data);
    }
  }

  async updateSQL(table, id, data) {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      
      console.log('SQL update:', sql, values);
      throw new Error('Forge SQL not available in this environment');
      
    } catch (error) {
      console.error('SQL update error:', error);
      throw error;
    }
  }

  async updateStorage(table, id, data) {
    try {
      const key = `${table}:${id}`;
      const existing = await storage.get(key);
      
      if (!existing) {
        throw new Error(`Record not found: ${key}`);
      }
      
      const updated = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString()
      };
      
      await storage.set(key, updated);
      console.log(`Updated ${table}:`, updated);
      
      return updated;
      
    } catch (error) {
      console.error('Storage update error:', error);
      throw error;
    }
  }

  async findById(table, id) {
    if (this.useForgeSQL) {
      return await this.findByIdSQL(table, id);
    } else {
      return await this.findByIdStorage(table, id);
    }
  }

  async findByIdSQL(table, id) {
    try {
      const sql = `SELECT * FROM ${table} WHERE id = ?`;
      const results = await this.executeSQL(sql, [id]);
      return results[0] || null;
      
    } catch (error) {
      console.error('SQL findById error:', error);
      return null;
    }
  }

  async findByIdStorage(table, id) {
    try {
      const key = `${table}:${id}`;
      return await storage.get(key);
      
    } catch (error) {
      console.error('Storage findById error:', error);
      return null;
    }
  }

  async findMeetingsByTicket(ticketId) {
    try {
      if (this.useForgeSQL) {
        const sql = `
          SELECT DISTINCT m.* 
          FROM meetings m 
          JOIN ticket_mentions tm ON m.id = tm.meeting_id 
          WHERE tm.ticket_id = ?
          ORDER BY m.start_time DESC
        `;
        return await this.executeSQL(sql, [ticketId]);
      } else {
        // Storage-based fallback
        const mentionKeys = await storage.query()
          .where('key', 'startsWith', 'ticket_mention:')
          .getMany();
        
        const meetingIds = new Set();
        
        for (const item of mentionKeys.results) {
          const mention = item.value;
          if (mention && mention.ticket_id === ticketId) {
            meetingIds.add(mention.meeting_id);
          }
        }
        
        const meetings = [];
        for (const meetingId of meetingIds) {
          const meeting = await this.findByIdStorage('meetings', meetingId);
          if (meeting) {
            meetings.push(meeting);
          }
        }
        
        return meetings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      }
      
    } catch (error) {
      console.error('Error finding meetings by ticket:', error);
      return [];
    }
  }

  async getMeetingContext(ticketId) {
    try {
      const meetings = await this.findMeetingsByTicket(ticketId);
      const context = [];
      
      for (const meeting of meetings) {
        // Get ticket mentions for this meeting
        const mentions = await this.getTicketMentions(meeting.id, ticketId);
        
        context.push({
          meeting,
          mentions: mentions || []
        });
      }
      
      return context;
      
    } catch (error) {
      console.error('Error getting meeting context:', error);
      return [];
    }
  }

  async getTicketMentions(meetingId, ticketId = null) {
    try {
      if (this.useForgeSQL) {
        const sql = ticketId 
          ? `SELECT * FROM ticket_mentions WHERE meeting_id = ? AND ticket_id = ?`
          : `SELECT * FROM ticket_mentions WHERE meeting_id = ?`;
        const params = ticketId ? [meetingId, ticketId] : [meetingId];
        return await this.executeSQL(sql, params);
      } else {
        // Storage-based fallback
        const mentionKeys = await storage.query()
          .where('key', 'startsWith', 'ticket_mention:')
          .getMany();
        
        const mentions = [];
        
        for (const item of mentionKeys.results) {
          const mention = item.value;
          if (mention && mention.meeting_id === meetingId) {
            if (!ticketId || mention.ticket_id === ticketId) {
              mentions.push(mention);
            }
          }
        }
        
        return mentions;
      }
      
    } catch (error) {
      console.error('Error getting ticket mentions:', error);
      return [];
    }
  }

  matchesParams(record, params) {
    // Simple parameter matching for simulation
    // In real SQL, this would be handled by the query itself
    if (!params || params.length === 0) {
      return true;
    }
    
    // This is a simplified matcher - would need more sophisticated logic for real use
    return true;
  }

  async delete(table, id) {
    try {
      if (this.useForgeSQL) {
        const sql = `DELETE FROM ${table} WHERE id = ?`;
        return await this.executeSQL(sql, [id]);
      } else {
        const key = `${table}:${id}`;
        await storage.delete(key);
        return true;
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  async initializeTables() {
    if (!this.useForgeSQL) {
      console.log('Using storage-based simulation - no table initialization needed');
      return;
    }
    
    // SQL table creation for when Forge SQL is available
    const tables = [
      `CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        jira_config JSON NOT NULL,
        tier ENUM('basic', 'ai', 'enterprise') DEFAULT 'basic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(36) PRIMARY KEY,
        team_id VARCHAR(36),
        title VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        transcript_text TEXT,
        processed_data JSON,
        participants JSON,
        meeting_type VARCHAR(50),
        processing_status ENUM('pending', 'processing', 'completed', 'failed'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS ticket_mentions (
        id VARCHAR(36) PRIMARY KEY,
        meeting_id VARCHAR(36) NOT NULL,
        ticket_id VARCHAR(50) NOT NULL,
        discussion_summary TEXT,
        action_items JSON,
        key_decisions JSON,
        sentiment_score DECIMAL(3,2),
        mcp_update_status ENUM('pending', 'success', 'failed'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    ];
    
    try {
      for (const tableSQL of tables) {
        await this.executeSQL(tableSQL);
      }
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing tables:', error);
      throw error;
    }
  }
}

export default DatabaseService;