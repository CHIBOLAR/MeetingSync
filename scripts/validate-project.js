#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

console.log('🔍 MeetingSync Project Validation\n');

// Required files and directories
const requiredStructure = [
  'src/frontend/index.jsx',
  'src/frontend/components/MeetingPanel.jsx',
  'src/index.js',
  'manifest.yml',
  'package.json'
];

// Critical dependencies
const requiredDependencies = [
  '@forge/api',
  '@forge/bridge', 
  '@forge/react',
  '@forge/resolver',
  'react'
];

let validationPassed = true;
let issues = [];
let warnings = [];

// Check project structure
console.log('📁 Checking project structure...');
requiredStructure.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    issues.push(`Missing required file: ${file}`);
    validationPassed = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDependencies.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`✅ ${dep} (${allDeps[dep]})`);
    } else {
      console.log(`❌ Missing: ${dep}`);
      issues.push(`Missing dependency: ${dep}`);
      validationPassed = false;
    }
  });
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  issues.push('Cannot read package.json');
  validationPassed = false;
}

// Check manifest.yml
console.log('\n📋 Checking manifest configuration...');
try {
  const manifestContent = fs.readFileSync('manifest.yml', 'utf8');
  const manifest = yaml.load(manifestContent);
  
  // Check for required modules
  if (manifest.modules && manifest.modules['jira:issuePanel']) {
    console.log('✅ Jira issue panel module configured');
  } else {
    console.log('❌ Missing Jira issue panel module');
    issues.push('Manifest missing jira:issuePanel module');
    validationPassed = false;
  }
  
  // Check for required permissions
  if (manifest.permissions && manifest.permissions.scopes) {
    const requiredScopes = ['storage:app', 'read:jira-work', 'write:jira-work'];
    const currentScopes = manifest.permissions.scopes;
    
    requiredScopes.forEach(scope => {
      if (currentScopes.includes(scope)) {
        console.log(`✅ Scope: ${scope}`);
      } else {
        console.log(`⚠️  Missing scope: ${scope}`);
        warnings.push(`Consider adding scope: ${scope}`);
      }
    });
  } else {
    console.log('❌ No permissions configured');
    issues.push('Manifest missing permissions section');
    validationPassed = false;
  }
  
  // Check resource path
  if (manifest.resources && manifest.resources[0] && manifest.resources[0].path === 'src/frontend') {
    console.log('✅ Frontend resource path configured correctly');
  } else {
    console.log('❌ Frontend resource path misconfigured');
    issues.push('Resource path should be "src/frontend"');
    validationPassed = false;
  }
  
} catch (error) {
  console.log(`❌ Error reading manifest.yml: ${error.message}`);
  issues.push('Cannot read manifest.yml');
  validationPassed = false;
}

// Check backend resolver
console.log('\n⚙️  Checking backend resolver...');
try {
  const resolverContent = fs.readFileSync('src/index.js', 'utf8');
  
  if (resolverContent.includes('meeting-context-func')) {
    console.log('✅ Meeting context resolver defined');
  } else {
    console.log('❌ Missing meeting-context-func resolver');
    issues.push('Backend missing meeting-context-func resolver');
    validationPassed = false;
  }
  
  if (resolverContent.includes('export const handler')) {
    console.log('✅ Handler export found');
  } else {
    console.log('❌ Missing handler export');
    issues.push('Backend missing handler export');
    validationPassed = false;
  }
  
} catch (error) {
  console.log(`❌ Error reading src/index.js: ${error.message}`);
  issues.push('Cannot read backend resolver');
  validationPassed = false;
}

// Check frontend component
console.log('\n🎨 Checking frontend component...');
try {
  const frontendContent = fs.readFileSync('src/frontend/index.jsx', 'utf8');
  
  if (frontendContent.includes('ForgeReconciler.render')) {
    console.log('✅ Forge reconciler configured');
  } else {
    console.log('❌ Missing Forge reconciler');
    issues.push('Frontend missing ForgeReconciler.render');
    validationPassed = false;
  }
  
  if (frontendContent.includes('MeetingPanel')) {
    console.log('✅ MeetingPanel component imported');
  } else {
    console.log('❌ Missing MeetingPanel import');
    issues.push('Frontend missing MeetingPanel component');
    validationPassed = false;
  }
  
} catch (error) {
  console.log(`❌ Error reading frontend: ${error.message}`);
  issues.push('Cannot read frontend files');
  validationPassed = false;
}

// Environment checks
console.log('\n🌍 Environment checks...');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    console.log(`✅ Node.js version: ${nodeVersion}`);
  } else {
    console.log(`❌ Node.js version too old: ${nodeVersion} (requires 18+)`);
    issues.push('Node.js version must be 18 or higher');
    validationPassed = false;
  }
} catch (error) {
  warnings.push('Could not check Node.js version');
}

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('✅ Dependencies installed');
} else {
  console.log('⚠️  Dependencies not installed');
  warnings.push('Run "npm install" to install dependencies');
}

// Generate validation report
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION REPORT');
console.log('='.repeat(50));

if (validationPassed) {
  console.log('🎉 PROJECT VALIDATION PASSED!');
  console.log('\n✅ Your MeetingSync project is ready for development');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Run "forge tunnel" to start development');
  console.log('   2. Test the app in your Jira instance');
  console.log('   3. Run "forge deploy" when ready');
  
} else {
  console.log('❌ PROJECT VALIDATION FAILED!');
  console.log('\n💥 Critical issues:');
  issues.forEach(issue => console.log(`   • ${issue}`));
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Additional warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n🔧 Fix these issues before proceeding:');
  console.log('   1. Address all critical issues above');
  console.log('   2. Run "npm install" if dependencies are missing');
  console.log('   3. Re-run this validation script');
  
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
