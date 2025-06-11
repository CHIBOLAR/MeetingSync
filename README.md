# MeetingSync for Jira

AI-powered meeting intelligence that seamlessly integrates with Jira workflows using Atlassian Forge platform.

## 🎯 Overview

MeetingSync transforms meeting discussions into actionable Jira updates by automatically detecting ticket mentions and providing contextual meeting intelligence directly within Jira issues.

## ✨ Features

### Basic Edition ("Runs on Atlassian" Compliant)
- ✅ Manual transcript upload and processing
- ✅ Basic meeting context extraction without external AI
- ✅ Full data residency compliance
- ✅ Secure for regulated industries

### AI-Powered Edition (Future)
- 🔮 Full Whisper speech-to-text integration
- 🔮 Claude-powered meeting analysis and insights
- 🔮 Advanced speaker identification
- 🔮 Real-time processing capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- Atlassian Forge CLI
- Jira Cloud instance (admin access required)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CHIBOLAR/MeetingSync.git
   cd MeetingSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Forge**
   ```bash
   forge login
   ```

4. **Deploy to development**
   ```bash
   forge deploy
   ```

5. **Install on your Jira site**
   ```bash
   forge install --site your-site.atlassian.net
   ```

## 🏗️ Project Structure

```
meetingsync-for-jira/
├── src/
│   ├── frontend/          # UI Kit React components
│   └── backend/           # Forge functions and resolvers
├── sql/                   # Database schema and migrations
├── static/                # Static resources (if needed)
├── scripts/               # Development and deployment scripts
├── manifest.yml           # Forge app configuration
└── package.json          # Node.js dependencies
```

## 🔧 Development

### Local Development
```bash
# Start development tunnel
forge tunnel

# Watch for changes and auto-deploy
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Validate Forge manifest
forge lint
```

## 📝 Usage

1. **Navigate** to any Jira issue
2. **Look for** the "Meeting Context" panel on the right sidebar
3. **Upload** your meeting transcript (text file)
4. **Review** automatically detected ticket mentions and context
5. **View** meeting history for each ticket

### Supported Transcript Formats
- Plain text files (.txt)
- Markdown files (.md)
- Future: Audio files (.mp3, .wav, .m4a)

### Ticket Detection
The app automatically detects ticket mentions in these formats:
- `PROJ-123` (standard Jira format)
- `PROJECT-456` (any project key)
- Case insensitive: `proj-123`, `Proj-123`

## 🛠️ Configuration

### Manifest Configuration
Key settings in `manifest.yml`:
- **Jira Issue Panel**: Displays meeting context
- **Permissions**: Read/write Jira work, app storage
- **"Runs on Atlassian"**: No external API calls for compliance

### Environment Variables
- `FORGE_EMAIL`: Your Atlassian account email
- `FORGE_API_TOKEN`: Your Atlassian API token

## 🔒 Security & Compliance

- ✅ **"Runs on Atlassian" Badge**: Basic edition qualifies
- ✅ **Data Residency**: Automatic compliance via Forge infrastructure
- ✅ **Zero Egress**: No external API calls in basic edition
- ✅ **Encryption**: All data encrypted at rest and in transit

## 📊 Architecture

### Technology Stack
- **Platform**: Atlassian Forge (Serverless FaaS)
- **Runtime**: Node.js 18.x
- **Database**: Forge SQL (MySQL/TiDB compatible)
- **Frontend**: UI Kit with React components
- **Authentication**: Forge-managed OAuth

### Data Flow
1. User uploads meeting transcript
2. Text processing extracts ticket mentions
3. Meeting context stored in Forge SQL
4. Results displayed in Jira issue panel
5. Historical context accumulated over time

## 🚀 Deployment

### Development Environment
```bash
forge deploy -e development
forge install --site your-dev-site.atlassian.net -e development
```

### Production Environment
```bash
forge deploy -e production
forge install --site your-prod-site.atlassian.net -e production
```

### CI/CD Pipeline
See `.github/workflows/` for automated deployment workflows.

## 📈 Roadmap

### Phase 1: Basic Edition (Current)
- [x] Forge app infrastructure
- [x] Jira issue panel integration
- [ ] Text transcript processing
- [ ] Ticket mention detection
- [ ] Meeting context display

### Phase 2: AI Integration
- [ ] Whisper speech-to-text
- [ ] Claude-powered analysis
- [ ] Advanced insights extraction
- [ ] Real-time processing

### Phase 3: Enterprise Features
- [ ] Team analytics
- [ ] Custom integrations
- [ ] Advanced reporting
- [ ] SSO support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Test on real Jira instances

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Forge Documentation](https://developer.atlassian.com/platform/forge/)
- **Issues**: [GitHub Issues](https://github.com/CHIBOLAR/MeetingSync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CHIBOLAR/MeetingSync/discussions)
- **Community**: [Atlassian Developer Community](https://community.developer.atlassian.com/)

## 🏆 Acknowledgments

- Built on [Atlassian Forge](https://developer.atlassian.com/platform/forge/)
- Inspired by the need for better meeting-to-ticket workflows
- Thanks to the Atlassian developer community

---

**Made with ❤️ for better meeting intelligence in Jira**