# Contributing to MeetingSync for Jira

Thank you for your interest in contributing to MeetingSync! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- Atlassian Forge CLI installed globally
- Git for version control
- A Jira Cloud instance for testing

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up Forge CLI: `forge login`
5. Deploy to development: `forge deploy`

## 🔄 Development Workflow

### Branch Strategy
- `master`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Emergency fixes

### Making Changes
1. Create a feature branch from `develop`
2. Make your changes following our coding standards
3. Write or update tests as needed
4. Test thoroughly on a real Jira instance
5. Submit a pull request

## 📝 Coding Standards

### JavaScript/React
- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable and function names
- Write JSDoc comments for complex functions
- Keep functions small and focused

### Forge-Specific Guidelines
- Follow Atlassian's Forge best practices
- Use UI Kit components when possible
- Minimize external dependencies
- Ensure "Runs on Atlassian" compliance for basic features

### File Structure
```
src/
├── frontend/          # UI Kit React components
│   ├── components/    # Reusable components
│   └── index.jsx     # Main entry point
├── resolvers/         # Forge resolver functions
├── handlers/          # Function handlers
└── services/          # Business logic services
```

## 🧪 Testing

### Required Tests
- Unit tests for all business logic
- Integration tests for Forge functions
- Manual testing on real Jira instances
- Performance testing for large files

### Running Tests
```bash
npm test           # Run unit tests
npm run test:e2e   # Run end-to-end tests
forge lint         # Validate Forge configuration
```

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] Feature tested on real Jira instance
- [ ] No breaking changes (or clearly documented)

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots/Videos
(If applicable)

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:
- Jira instance details (Cloud/Server version)
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Forge CLI version
- Error messages or logs

### Feature Requests
For new features, please provide:
- Use case description
- Proposed solution
- Alternative solutions considered
- Implementation complexity estimate

## 📚 Documentation

### Code Documentation
- Write clear comments for complex logic
- Update README for new features
- Document configuration changes
- Include examples for new APIs

### User Documentation
- Update user guides for new features
- Include screenshots for UI changes
- Document any breaking changes
- Provide migration guides when needed

## 🔒 Security

### Security Guidelines
- Never commit secrets or API keys
- Follow Atlassian security best practices
- Report security issues privately
- Test permission boundaries

### Data Privacy
- Respect user data privacy
- Follow GDPR guidelines
- Implement data retention policies
- Document data flows

## 🎯 Project Goals

### Short Term
- Stable Basic Edition with core features
- "Runs on Atlassian" compliance
- Excellent user experience
- Comprehensive documentation

### Long Term
- AI-powered meeting analysis
- Multi-product integration
- Advanced analytics
- Enterprise features

## 💬 Communication

### Channels
- GitHub Issues for bugs and features
- GitHub Discussions for questions
- Pull Request comments for code review
- Email for security issues

### Response Times
We aim to respond to:
- Security issues: Within 24 hours
- Bug reports: Within 48 hours
- Feature requests: Within 1 week
- Pull requests: Within 3 days

## 🏆 Recognition

Contributors will be:
- Listed in project credits
- Mentioned in release notes
- Invited to beta testing
- Considered for maintainer roles

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MeetingSync! 🚀