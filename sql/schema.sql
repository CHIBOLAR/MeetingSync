-- MeetingSync for Jira Database Schema
-- Compatible with Forge SQL (MySQL/TiDB)

-- Teams table for organization and configuration
CREATE TABLE teams (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    jira_config JSON NOT NULL,
    tier ENUM('basic', 'ai', 'enterprise') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teams_tier (tier),
    INDEX idx_teams_created (created_at)
);

-- Meetings table for transcript storage and processing
CREATE TABLE meetings (
    id VARCHAR(36) PRIMARY KEY,
    team_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    transcript_text LONGTEXT,
    processed_data JSON,
    participants JSON,
    meeting_type VARCHAR(50) DEFAULT 'general',
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    audio_file_path VARCHAR(500),
    duration_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_meetings_team (team_id),
    INDEX idx_meetings_status (processing_status),
    INDEX idx_meetings_start_time (start_time),
    FULLTEXT INDEX idx_meetings_transcript (transcript_text)
);

-- Ticket mentions table for Jira integration
CREATE TABLE ticket_mentions (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    ticket_id VARCHAR(50) NOT NULL,
    discussion_summary TEXT,
    action_items JSON,
    key_decisions JSON,
    sentiment_score DECIMAL(3,2) DEFAULT 0.0,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    mcp_update_status ENUM('pending', 'success', 'failed', 'skipped') DEFAULT 'pending',
    update_attempts INT DEFAULT 0,
    last_update_attempt TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_ticket_mentions_meeting (meeting_id),
    INDEX idx_ticket_mentions_ticket (ticket_id),
    INDEX idx_ticket_mentions_status (mcp_update_status),
    UNIQUE KEY uk_meeting_ticket (meeting_id, ticket_id)
);

-- Processing queue for async operations
CREATE TABLE processing_queue (
    id VARCHAR(36) PRIMARY KEY,
    task_type ENUM('transcript_analysis', 'audio_processing', 'jira_update') NOT NULL,
    payload JSON NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    priority INT DEFAULT 5,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_queue_status (status),
    INDEX idx_queue_scheduled (scheduled_at),
    INDEX idx_queue_priority (priority)
);

-- App configuration and settings
CREATE TABLE app_config (
    id VARCHAR(36) PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- Insert default configuration
INSERT INTO app_config (id, config_key, config_value, description) VALUES
(UUID(), 'processing_limits', '{"max_file_size_mb": 50, "max_duration_hours": 4}', 'File processing limits'),
(UUID(), 'ai_settings', '{"enabled": true, "model_config": {"temperature": 0.3, "max_tokens": 2000}}', 'AI processing configuration'),
(UUID(), 'jira_settings', '{"auto_update": true, "comment_prefix": "[MeetingSync]", "max_retries": 3}', 'Jira integration settings');