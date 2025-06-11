import React, { useState } from 'react';
import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Form,
  FileUpload,
  Spinner,
  EmptyState,
  Badge,
  Section
} from '@atlaskit/ui-kit'; // Adjust import path as needed

const MeetingContextPanel = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [meetings, setMeetings] = useState([]);

  const handleFileUpload = async (event) => {
    // Add your file upload logic here
    setUploading(true);
    try {
      // Process file upload
      console.log('File uploaded:', event.target.files[0]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Stack space="medium">
        {showUploadForm && (
          <Section>
            <Box padding="medium" backgroundColor="N10">
              <Stack space="medium">
                <Heading size="small">Upload Meeting Transcript</Heading>
                <Form onSubmit={handleFileUpload}>
                  <FileUpload
                    label="Meeting File"
                    accept=".txt,.mp3,.wav,.m4a"
                    onChange={handleFileUpload}
                    isRequired
                  />
                  <Text size="small" color="N400">
                    Supported formats: Text files (.txt) or Audio files (.mp3, .wav, .m4a)
                  </Text>
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

// Helper functions moved outside component for reusability
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

export default MeetingContextPanel;