# MeetingSync Deployment Guide

## Current Status ✅
- Project structure complete
- Code implemented and ready
- Forge CLI authenticated (chiragbolarworkspace@gmail.com)
- "Runs on Atlassian" compliant

## Manual Deployment Steps

### Step 1: Open Command Prompt/Terminal
```cmd
cd "C:\MeetingSync\meetingsync-forge\meetingsync-for-jira"
```

### Step 2: Register the App (Interactive)
```cmd
forge register
```
When prompted:
- **App Name**: Enter `MeetingSync for Jira`
- **Description**: Enter `AI-powered meeting intelligence that integrates with Jira workflows`

### Step 3: Deploy to Development
```cmd
forge deploy --environment development
```

### Step 4: Install on Test Site
```cmd
forge install --site your-site.atlassian.net
```
Replace `your-site.atlassian.net` with your actual Jira site URL.

### Step 5: Test the Installation
1. Go to any Jira issue on your site
2. Look for the "Meeting Context" panel on the right side
3. Click "Add Meeting" to test transcript upload

## Quick Test Checklist ✅

### Functional Tests
- [ ] App panel loads in Jira issue view
- [ ] "Add Meeting" button works
- [ ] Can paste transcript text
- [ ] Transcript processes without errors
- [ ] Ticket mentions are detected (e.g., PROJ-123)
- [ ] Meeting appears in history

### Security Tests
- [ ] No external API calls (verify in browser network tab)
- [ ] Data stored securely in Forge storage
- [ ] Error handling works properly

## Development Commands

### During Development
```cmd
# Start development tunnel for live debugging
forge tunnel

# Build the app
forge build

# Run linting
forge lint
```

### For Testing
```cmd
# Deploy to staging
forge deploy --environment staging

# Deploy to production
forge deploy --environment production
```

## Troubleshooting

### Common Issues
1. **App not found**: Make sure you ran `forge register` first
2. **Permission errors**: Check that your Jira site allows Forge apps
3. **Panel not showing**: Refresh the page or check browser console

### Debug Commands
```cmd
# Verbose output for debugging
forge deploy --verbose

# Check app status
forge whoami
```

## Next Steps After Successful Deployment

1. **Test Core Functionality**
   - Upload sample meeting transcripts
   - Verify ticket detection works
   - Check data persistence

2. **Performance Testing**
   - Test with large transcripts
   - Verify response times < 3 seconds
   - Check storage limits

3. **User Acceptance Testing**
   - Get feedback from team members
   - Test across different Jira issues
   - Validate user workflow

4. **Marketplace Preparation** (if desired)
   - Add app description and screenshots
   - Complete security review
   - Publish to Atlassian Marketplace

## Success Metrics to Verify
- ✅ App loads in <3 seconds
- ✅ Transcript processing works
- ✅ Ticket mentions detected accurately
- ✅ No security vulnerabilities
- ✅ "Runs on Atlassian" badge eligible
