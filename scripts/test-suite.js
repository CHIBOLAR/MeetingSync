#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 MeetingSync Test Suite');
console.log('='.repeat(30));

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testCommand) {
  try {
    console.log(`Running: ${testName}...`);
    execSync(testCommand, { stdio: 'inherit' });
    console.log(`✅ ${testName} passed\n`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName} failed\n`);
    testsFailed++;
  }
}

// Run test suite
runTest('Project Structure Validation', 'node scripts/validate-project.js');
runTest('ESLint Code Quality', 'npm run lint');
runTest('Security Audit', 'npm audit --audit-level moderate');

// Test results
console.log('='.repeat(30));
console.log('📊 Test Results:');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Ready for development.');
} else {
  console.log('\n💥 Some tests failed. Fix issues before proceeding.');
  process.exit(1);
}
