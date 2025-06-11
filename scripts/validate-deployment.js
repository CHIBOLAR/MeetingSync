#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 MeetingSync Deployment Validation\n');

// Check required files
const requiredFiles = [
  'manifest.yml',
  'package.json',
  'src/frontend/meeting-context.jsx',
  'src/resolvers/meeting-context.js',
  'src/services/MeetingService.js',
  'src/services/JiraService.js'
];

console.log('📁 Checking required files...');
let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Check manifest structure
console.log('\n📋 Validating manifest.yml...');
try {
  const manifestContent = fs.readFileSync('manifest.yml', 'utf8');
  
  const checks = [
    ['modules.jira.issuePanel', manifestContent.includes('issuePanel')],
    ['meeting-context-panel', manifestContent.includes('meeting-context-panel')],
    ['storage:app scope', manifestContent.includes('storage:app')],
    ['nodejs18.x runtime', manifestContent.includes('nodejs18.x')]
  ];
  
  checks.forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
} catch (error) {
  console.log('❌ Error reading manifest.yml:', error.message);
  filesOk = false;
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    '@forge/api',
    '@forge/react', 
    '@forge/bridge',
    'uuid'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      filesOk = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  filesOk = false;
}

// Final status
console.log('\n🎯 Deployment Readiness:');
if (filesOk) {
  console.log('✅ Ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Run: forge register');
  console.log('2. Run: forge deploy --environment development');
  console.log('3. Run: forge install --site your-site.atlassian.net');
} else {
  console.log('❌ Not ready - fix the issues above first');
}

console.log('\n📖 See deploy-guide.md for detailed instructions');
