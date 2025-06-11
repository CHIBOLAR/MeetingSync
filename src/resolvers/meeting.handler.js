import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Text, 
  Box, 
  Stack, 
  Spinner, 
  Heading,
  Form,
  TextArea,
  FileUpload,
  Badge,
  EmptyState,
  Section
} from '@forge/react';
import { invoke } from '@forge/bridge';

const MeetingContextPanel = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [issueId, setIssueId] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    loadMeetingContext();
  }, []);

  const loadMeetingContext = async () => {
    try {
      setLoading(true);
      const context = await invoke('getMeetingContext');
      setIssueId(context.issueId);
      setMeetings(context.meetings || []);
    } catch (err) {
      console.error('Failed to load meeting context:', err);
      setError('Failed to load meeting context');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      setError(null);
      
      const result = await invoke('uploadMeetingFile', {
        file: file,
        issueId: issueId,
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileName: file.name
        }
      });

      if (result.success) {
        await loadMeetingContext(); // Refresh the meeting list
        setShowUploadForm(false);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload meeting file');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { appearance: 'default', text: 'Pending' },
      processing: { appearance: 'inprogress', text: 'Processing' },
      completed: { appearance: 'success', text: 'Completed' },
      failed: { appearance: 'removed', text: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge appearance={config.appearance} text={config.text} />;
  };

  if (loading) {
    return (
      <Box padding="medium">
        <Stack space="medium" alignItems="center">
          <Spinner size="medium" />
          <Text>Loading meeting context...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="medium">
      <Stack space="medium">
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Heading size="medium">Meeting Context</Heading>
            <Button 
              text="Upload Meeting" 
              appearance="primary"
              onClick={() => setShowUploadForm(!showUploadForm)}
              isDisabled={uploading}
            />
          </Stack>
        </Box>

        {error && (
          <Box padding="small" backgroundColor="R50">
            <Text color="red">⚠️ {error}</Text>
          </Box>
        )}

        {showUploadForm && (
          <Section>
            <Box padding="medium" backgroundColor="N10">
              <Stack space="medium">
                <Heading size="small">Upload Meeting Transcript</Heading>
                <Form onSubmit={(formData) => handleFileUpload(formData.file)}>
                  <FileUpload
                    label="Meeting File"
                    name="file"
                    accept=".txt,.mp3,.wav,.m4a"
                    isRequired
                  />
                  <Text size="small" color="N400">
                    Supported formats: Text files (.txt) or Audio files (.mp3, .wav, .m4a)
                  </Text>
                  <Stack direction="row" space="small">
                    <Button type="submit" appearance="primary" isDisabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button 
                      text="Cancel" 
                      onClick={() => setShowUploadForm(false)}
                      isDisabled={uploading}
                    />
                  </Stack>
                </Form>
              </Stack>
            </Box>
          </Section>
        )}

        {uploading && (
          <Box padding="small" backgroundColor="B50">
            <Stack direction="row" space="small" alignItems="center">
              <Spinner size="small" />
              <Text>Processing meeting file...</Text>
            </Stack>
          </Box>
        )}

        {meetings.length === 0 ? (
          <EmptyState
            header="No meetings found"
            description="Upload a meeting transcript or audio file to see meeting context for this issue."
            primaryAction={
              <Button
                text="Upload First Meeting"
                appearance="primary"
                onClick={() => setShowUploadForm(true)}
              />
            }
          />
        ) : (
          <Stack space="medium">
            {meetings.map((meeting, index) => (
              <MeetingCard key={meeting.id || index} meeting={meeting} />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

const MeetingCard = ({ meeting }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { appearance: 'default', text: 'Pending' },
      processing: { appearance: 'inprogress', text: 'Processing' },
      completed: { appearance: 'success', text: 'Completed' },
      failed: { appearance: 'removed', text: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge appearance={config.appearance} text={config.text} />;
  };

  return (
    <Box padding="medium" backgroundColor="N10">
      <Stack space="small">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" space="small" alignItems="center">
            <Heading size="small">{meeting.title || 'Untitled Meeting'}</Heading>
            {getStatusBadge(meeting.processing_status)}
          </Stack>
          <Button
            text={expanded ? "Show Less" : "Show More"}
            appearance="subtle"
            onClick={() => setExpanded(!expanded)}
          />
        </Stack>

        <Text size="small" color="N400">
          {formatDate(meeting.start_time)} • Duration: {meeting.duration_minutes || 0} min
        </Text>

        {meeting.participants && meeting.participants.length > 0 && (
          <Text size="small">
            Participants: {meeting.participants.join(', ')}
          </Text>
        )}

        {expanded && (
          <Stack space="medium">
            {meeting.discussion_summary && (
              <Box>
                <Text weight="bold" size="small">Discussion Summary:</Text>
                <Text>{meeting.discussion_summary}</Text>
              </Box>
            )}

            {meeting.action_items && meeting.action_items.length > 0 && (
              <Box>
                <Text weight="bold" size="small">Action Items:</Text>
                <Stack space="small">
                  {meeting.action_items.map((item, idx) => (
                    <Text key={idx}>• {item}</Text>
                  ))}
                </Stack>
              </Box>
            )}

            {meeting.key_decisions && meeting.key_decisions.length > 0 && (
              <Box>
                <Text weight="bold" size="small">Key Decisions:</Text>
                <Stack space="small">
                  {meeting.key_decisions.map((decision, idx) => (
                    <Text key={idx}>• {decision}</Text>
                  ))}
                </Stack>
              </Box>
            )}

            {meeting.transcript_text && (
              <Box>
                <Text weight="bold" size="small">Transcript:</Text>
                <Box padding="small" backgroundColor="N20">
                  <Text size="small" style={{ whiteSpace: 'pre-wrap' }}>
                    {meeting.transcript_text.substring(0, 500)}
                    {meeting.transcript_text.length > 500 && '...'}
                  </Text>
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MeetingContextPanel;