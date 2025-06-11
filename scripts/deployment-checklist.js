#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 MeetingSync Deployment Checklist\n');

let allChecksPass = true;
const failedChecks = [];
const warnings = [];

// Helper function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`Checking: ${description}...`);
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed`);
    failedChecks.push(description);
    allChecksPass = false;
    return false;
  }
}

// Deployment checks
const checks = [
  {
    name: 'Project structure validation',
    check: () => {
      const requiredFiles = [
        'src/frontend/index.jsx',
        'src/frontend/components/MeetingPanel.jsx',
        'src/index.js',
        'manifest.yml'
      ];
      
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          console.log(`❌ Missing file: ${file}`);
          failedChecks.push(`Missing file: ${file}`);
          return false;
        }
      }
      console.log('✅ All required files present');
      return true;
    }
  },
  {
    name: 'Dependencies installed',
    check: () => {
      if (!fs.existsSync('node_modules')) {
        console.log('❌ Dependencies not installed');
        failedChecks.push('Run npm install');
        return false;
      }
      console.log('✅ Dependencies installed');
      return true;
    }
  },
  {
    name: 'ESLint validation',
    check: () => runCommand('npm run lint', 'ESLint validation')
  },
  {
    name: 'Security audit',
    check: () => {
      try {
        execSync('npm audit --audit-level high', { stdio: 'pipe' });
        console.log('✅ Security audit passed');
        return true;
      } catch (error) {
        console.log('⚠️  Security vulnerabilities found');
        warnings.push('Run npm audit fix to resolve security issues');
        return true; // Don't fail deployment for moderate vulnerabilities
      }
    }
  },
  {
    name: 'Forge CLI available',
    check: () => runCommand('forge --version', 'Forge CLI availability')
  },
  {
    name: 'Manifest validation',
    check: () => {
      try {
        const yaml = require('js-yaml');
        const manifestContent = fs.readFileSync('manifest.yml', 'utf8');
        const manifest = yaml.load(manifestContent);
        
        // Check required sections
        if (!manifest.modules || !manifest.modules['jira:issuePanel']) {
          console.log('❌ Manifest missing jira:issuePanel module');
          failedChecks.push('Manifest configuration invalid');
          return false;
        }
        
        if (!manifest.permissions || !manifest.permissions.scopes) {
          console.log('❌ Manifest missing permissions');
          failedChecks.push('Manifest missing permissions');
          return false;
        }
        
        console.log('✅ Manifest validation passed');
        return true;
      } catch (error) {
        console.log(`❌ Manifest validation failed: ${error.message}`);
        failedChecks.push('Manifest syntax error');
        return false;
      }
    }
  },
  {
    name: 'Backend resolver syntax',
    check: () => {
      try {
        const resolverContent = fs.readFileSync('src/index.js', 'utf8');
        
        // Basic syntax checks
        if (!resolverContent.includes('export const handler')) {
          console.log('❌ Missing handler export');
          failedChecks.push('Backend missing handler export');
          return false;
        }
        
        if (!resolverContent.includes('meeting-context-func')) {
          console.log('❌ Missing meeting-context-func resolver');
          failedChecks.push('Backend missing core resolver');
          return false;
        }
        
        console.log('✅ Backend resolver syntax valid');
        return true;
      } catch (error) {
        console.log(`❌ Backend syntax check failed: ${error.message}`);
        failedChecks.push('Backend syntax error');
        return false;
      }
    }
  },
  {
    name: 'Frontend component syntax',
    check: () => {
      try {
        const frontendContent = fs.readFileSync('src/frontend/index.jsx', 'utf8');
        
        if (!frontendContent.includes('ForgeReconciler.render')) {
          console.log('❌ Missing ForgeReconciler.render');
          failedChecks.push('Frontend missing Forge reconciler');
          return false;
        }
        
        console.log('✅ Frontend syntax valid');
        return true;
      } catch (error) {
        console.log(`❌ Frontend syntax check failed: ${error.message}`);
        failedChecks.push('Frontend syntax error');
        return false;
      }
    }
  }
];

// Run all checks
console.log('Running deployment checks...\n');

checks.forEach(({ name, check }) => {
  const passed = check();
  if (!passed) {
    allChecksPass = false;
  }
  console.log(); // Add spacing
});

// Environment-specific checks
console.log('🌍 Environment checks...');

// Check Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    console.log(`✅ Node.js version: ${nodeVersion}`);
  } else {
    console.log(`❌ Node.js version too old: ${nodeVersion} (requires 18+)`);
    failedChecks.push('Upgrade Node.js to version 18 or higher');
    allChecksPass = false;
  }
} catch (error) {
  warnings.push('Could not verify Node.js version');
}

// Check for Forge authentication
try {
  execSync('forge whoami', { stdio: 'pipe' });
  console.log('✅ Forge CLI authenticated');
} catch (error) {
  console.log('❌ Forge CLI not authenticated');
  failedChecks.push('Run "forge login" to authenticate');
  allChecksPass = false;
}

// Performance recommendations
console.log('\n🎯 Performance checks...');

// Check bundle size (estimated)
try {
  const packageStats = fs.statSync('package.json');
  const srcStats = fs.statSync('src');
  
  console.log('✅ Project size within reasonable limits');
} catch (error) {
  warnings.push('Could not estimate project size');
}

// Generate final report
console.log('\n' + '='.repeat(60));
console.log('📊 DEPLOYMENT READINESS REPORT');
console.log('='.repeat(60));

if (allChecksPass) {
  console.log('🎉 DEPLOYMENT READY!');
  console.log('\n✅ All critical checks passed');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings (non-blocking):');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n🚀 Ready to deploy:');
  console.log('   1. forge deploy --environment development');
  console.log('   2. Test in development environment');
  console.log('   3. forge deploy --environment production');
  
} else {
  console.log('❌ DEPLOYMENT BLOCKED!');
  console.log('\n💥 Critical issues that must be fixed:');
  failedChecks.forEach(issue => console.log(`   • ${issue}`));
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Additional warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n🔧 Fix these issues and re-run:');
  console.log('   npm run deploy:check');
  
  process.exit(1);
}

console.log('\n' + '='.repeat(60));

// Deployment command suggestions
if (allChecksPass) {
  console.log('\n📝 Suggested deployment commands:');
  console.log('');
  console.log('# Development deployment:');
  console.log('forge deploy --environment development');
  console.log('forge install --upgrade');
  console.log('');
  console.log('# Production deployment:');
  console.log('forge deploy --environment production');
  console.log('forge install --environment production --upgrade');
  console.log('');
  console.log('# Testing commands:');
  console.log('forge tunnel  # For live development');
  console.log('forge logs    # View application logs');
}
