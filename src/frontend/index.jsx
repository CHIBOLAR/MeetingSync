import React, { useState, useEffect } from 'react';
import ForgeReconciler, { 
  Box, 
  Text, 
  Button, 
  Heading, 
  Stack, 
  Form,
  TextArea,
  SectionMessage,
  Spinner,
  Badge
} from '@forge/react';
import { invoke } from '@forge/bridge';

const MeetingContextPanel = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [uploading, setUploading] = useState(false);
  const [issueId, setIssueId] = useState(null);

  useEffect(() => {
    loadMeetingContext();
  }, []);

  const loadMeetingContext = async () => {
    try {
      setLoading(true);
      // Get current issue context
      const context = await invoke('bridge').getContext();
      const currentIssueId = context?.extension?.issue?.key;
      setIssueId(currentIssueId);
      
      // Load meeting data for this issue
      const result = await invoke('getMeetingContext', {
        issueId: currentIssueId
      });
      
      setMeetings(result.meetings || []);
    } catch (error) {
      console.error('Error loading meeting context:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMeeting = async (formData) => {
    try {
      setUploading(true);
      const result = await invoke('uploadMeeting', {
        transcript: formData.transcript,
        issueId: issueId
      });
      
      if (result.success) {
        await loadMeetingContext();
        setShowUpload(false);
        setTranscript('');
      }
    } catch (error) {
      console.error('Error uploading meeting:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box padding="space.200">
        <Stack space="space.100" alignItems="center">
          <Spinner size="medium" />
          <Text>Loading meeting context...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Box>
          <Heading level="h3">Meeting Context</Heading>
          <Text color="color.text.subtle">
            Meetings that discussed {issueId}
          </Text>
        </Box>

        {!showUpload && (
          <Button 
            appearance="primary" 
            onClick={() => setShowUpload(true)}
          >
            Add Meeting
          </Button>
        )}

        {showUpload && (
          <Box>
            <Form onSubmit={handleUploadMeeting}>
              <Stack space="space.100">
                <Heading level="h4">Upload Meeting Transcript</Heading>
                <TextArea
                  name="transcript"
                  placeholder="Paste your meeting transcript here..."
                  value={transcript}
                  onChange={(value) => setTranscript(value)}
                  isRequired
                />
                <Stack direction="horizontal" space="space.100">
                  <Button 
                    type="submit" 
                    appearance="primary"
                    isLoading={uploading}
                    isDisabled={!transcript.trim()}
                  >
                    {uploading ? 'Processing...' : 'Upload'}
                  </Button>
                  <Button 
                    appearance="subtle" 
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </Box>
        )}

        {meetings.length === 0 ? (
          <SectionMessage appearance="information">
            <Text>No meetings found for this issue yet.</Text>
          </SectionMessage>
        ) : (
          <Stack space="space.150">
            {meetings.map((meeting) => (
              <Box 
                key={meeting.id}
                padding="space.150"
                backgroundColor="color.background.neutral"
              >
                <Stack space="space.100">
                  <Stack direction="horizontal" space="space.100">
                    <Heading level="h5">{meeting.title}</Heading>
                    <Badge text={meeting.date} />
                  </Stack>
                  
                  <Text size="small" color="color.text.subtle">
                    Participants: {meeting.participants.join(', ')}
                  </Text>
                  
                  <Text>{meeting.summary}</Text>
                  
                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                    <Box>
                      <Text weight="medium">Action Items:</Text>
                      <Stack space="space.050">
                        {meeting.actionItems.map((item, index) => (
                          <Text key={index} size="small">• {item}</Text>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <MeetingContextPanel />
  </React.StrictMode>
);