#!/usr/bin/env node

/**
 * Workflow Orchestrator for Forge Plugin Development
 * Coordinates all phases of development, testing, and deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import our validation modules
const ForgeProjectValidator = require('./validate-project');
const ForgeTestSuite = require('./test-suite');
const ForgeDeploymentValidator = require('./deployment-checklist');

class ForgeWorkflowOrchestrator {
    constructor() {
        this.projectRoot = process.cwd();
        this.workflowState = {
            phase: 'initial',
            startTime: new Date(),
            phases: {
                setup: { status: 'pending', duration: null, issues: [] },
                validation: { status: 'pending', duration: null, issues: [] },
                testing: { status: 'pending', duration: null, issues: [] },
                deployment_prep: { status: 'pending', duration: null, issues: [] },
                deployment: { status: 'pending', duration: null, issues: [] }
            }
        };
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const levelIcon = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'progress': '🔄'
        }[level] || 'ℹ️';
        
        console.log(`[${timestamp}] ${levelIcon} ${message}`);
    }

    async executePhase(phaseName, phaseFunction) {
        const startTime = Date.now();
        this.workflowState.phase = phaseName;
        this.workflowState.phases[phaseName].status = 'running';
        
        this.log('progress', `Starting ${phaseName.replace('_', ' ')} phase...`);
        
        try {
            const result = await phaseFunction();
            const duration = Date.now() - startTime;
            
            this.workflowState.phases[phaseName].status = result.success ? 'completed' : 'failed';
            this.workflowState.phases[phaseName].duration = duration;
            this.workflowState.phases[phaseName].issues = result.issues || [];
            
            if (result.success) {
                this.log('success', `${phaseName.replace('_', ' ')} phase completed in ${duration}ms`);
            } else {
                this.log('error', `${phaseName.replace('_', ' ')} phase failed after ${duration}ms`);
                if (result.issues) {
                    result.issues.forEach(issue => this.log('error', `  - ${issue}`));
                }
            }
            
            return result.success;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.workflowState.phases[phaseName].status = 'failed';
            this.workflowState.phases[phaseName].duration = duration;
            this.workflowState.phases[phaseName].issues = [error.message];
            
            this.log('error', `${phaseName.replace('_', ' ')} phase failed with error: ${error.message}`);
            return false;
        }
    }

    async promptUser(message, defaultValue = 'y') {
        // In a real implementation, you'd use readline for interactive prompts
        // For now, we'll proceed with defaults for automation
        this.log('info', `${message} (proceeding with default: ${defaultValue})`);
        return defaultValue.toLowerCase() === 'y';
    }

    async setupPhase() {
        return this.executePhase('setup', async () => {
            const issues = [];
            
            // Check environment
            try {
                const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
                this.log('info', `Node.js version: ${nodeVersion}`);
            } catch (error) {
                issues.push('Node.js not found or not accessible');
            }

            try {
                const forgeVersion = execSync('npx @forge/cli --version', { encoding: 'utf8' }).trim();
                this.log('info', `Forge CLI version: ${forgeVersion}`);
            } catch (error) {
                issues.push('Forge CLI not found or not accessible');
            }

            // Check authentication
            try {
                const whoami = execSync('npx @forge/cli whoami', { encoding: 'utf8' }).trim();
                this.log('info', `Authenticated as: ${whoami}`);
            } catch (error) {
                issues.push('Not authenticated with Forge CLI - run "forge login"');
            }

            // Verify project structure
            const requiredFiles = ['manifest.yml', 'package.json', 'src'];
            requiredFiles.forEach(file => {
                if (!fs.existsSync(path.join(this.projectRoot, file))) {
                    issues.push(`Missing required file/directory: ${file}`);
                }
            });

            return { success: issues.length === 0, issues };
        });
    }

    async validationPhase() {
        return this.executePhase('validation', async () => {
            this.log('progress', 'Running project validation...');
            
            const validator = new ForgeProjectValidator();
            const success = validator.run();
            
            const issues = validator.errors.length > 0 ? validator.errors : [];
            
            if (validator.warnings.length > 0) {
                this.log('warning', `${validator.warnings.length} warnings found (not blocking)`);
            }
            
            return { success, issues };
        });
    }

    async testingPhase() {
        return this.executePhase('testing', async () => {
            this.log('progress', 'Running comprehensive test suite...');
            
            const testSuite = new ForgeTestSuite();
            const success = await testSuite.runAllTests();
            
            const issues = [];
            Object.entries(testSuite.results).forEach(([category, result]) => {
                if (result.failed > 0) {
                    issues.push(`${result.failed} ${category} tests failed`);
                }
            });
            
            return { success, issues };
        });
    }

    async deploymentPrepPhase() {
        return this.executePhase('deployment_prep', async () => {
            this.log('progress', 'Running deployment readiness checks...');
            
            const deploymentValidator = new ForgeDeploymentValidator();
            const success = await deploymentValidator.runFullValidation();
            
            const issues = [];
            if (deploymentValidator.failed > 0) {
                issues.push(`${deploymentValidator.failed} critical deployment requirements not met`);
            }
            
            return { success, issues };
        });
    }

    async deploymentPhase() {
        return this.executePhase('deployment', async () => {
            const shouldDeploy = await this.promptUser(
                'All checks passed. Proceed with deployment?', 'n'
            );
            
            if (!shouldDeploy) {
                return { success: false, issues: ['Deployment cancelled by user'] };
            }

            this.log('progress', 'Building application...');
            try {
                execSync('npm run build', { 
                    cwd: this.projectRoot,
                    stdio: 'inherit'
                });
            } catch (error) {
                return { success: false, issues: ['Build failed'] };
            }

            this.log('progress', 'Deploying to Forge cloud...');
            try {
                const environment = process.env.FORGE_ENVIRONMENT || 'development';
                execSync(`npx @forge/cli deploy --environment ${environment}`, { 
                    cwd: this.projectRoot,
                    stdio: 'inherit'
                });
                
                this.log('success', `Deployment to ${environment} completed successfully`);
                return { success: true, issues: [] };
            } catch (error) {
                return { success: false, issues: ['Deployment failed'] };
            }
        });
    }

    generateWorkflowReport() {
        const totalDuration = Date.now() - this.workflowState.startTime.getTime();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 WORKFLOW EXECUTION REPORT');
        console.log('='.repeat(60));
        console.log(`🕐 Total Duration: ${Math.round(totalDuration / 1000)}s`);
        console.log(`📅 Started: ${this.workflowState.startTime.toISOString()}`);
        console.log(`📅 Completed: ${new Date().toISOString()}\n`);

        let allSuccessful = true;
        let totalIssues = 0;

        Object.entries(this.workflowState.phases).forEach(([phase, data]) => {
            const statusIcon = {
                'pending': '⏳',
                'running': '🔄',
                'completed': '✅',
                'failed': '❌'
            }[data.status] || '❓';

            const duration = data.duration ? `(${Math.round(data.duration / 1000)}s)` : '';
            console.log(`${statusIcon} ${phase.replace('_', ' ').toUpperCase()} ${duration}`);
            
            if (data.issues && data.issues.length > 0) {
                data.issues.forEach(issue => {
                    console.log(`   🔸 ${issue}`);
                });
                totalIssues += data.issues.length;
            }
            
            if (data.status === 'failed') {
                allSuccessful = false;
            }
        });

        console.log('\n' + '='.repeat(60));
        
        if (allSuccessful) {
            console.log('🎉 WORKFLOW COMPLETED SUCCESSFULLY!');
            console.log('Your Forge application is ready for production use.');
        } else {
            console.log('❌ WORKFLOW FAILED');
            console.log(`Please address ${totalIssues} issues before proceeding.`);
        }
        
        console.log('='.repeat(60));

        // Save workflow report
        this.saveWorkflowReport();
        
        return allSuccessful;
    }

    saveWorkflowReport() {
        const report = {
            ...this.workflowState,
            endTime: new Date(),
            totalDuration: Date.now() - this.workflowState.startTime.getTime(),
            summary: {
                successful: Object.values(this.workflowState.phases).every(p => p.status === 'completed'),
                totalIssues: Object.values(this.workflowState.phases).reduce((sum, p) => sum + (p.issues?.length || 0), 0),
                phasesCompleted: Object.values(this.workflowState.phases).filter(p => p.status === 'completed').length,
                phasesTotal: Object.keys(this.workflowState.phases).length
            }
        };

        const reportPath = path.join(this.projectRoot, 'workflow-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed workflow report saved to: workflow-report.json`);
    }

    async runCompleteWorkflow() {
        console.log('🚀 Starting Complete Forge Development Workflow');
        console.log(`📁 Project: ${this.projectRoot}`);
        console.log('=' * 80);

        // Execute all phases in sequence
        const phases = [
            () => this.setupPhase(),
            () => this.validationPhase(),
            () => this.testingPhase(),
            () => this.deploymentPrepPhase(),
            () => this.deploymentPhase()
        ];

        let continueWorkflow = true;
        
        for (const phase of phases) {
            if (!continueWorkflow) break;
            
            const success = await phase();
            
            if (!success) {
                const shouldContinue = await this.promptUser(
                    'Phase failed. Continue with remaining phases anyway?', 'n'
                );
                
                if (!shouldContinue) {
                    continueWorkflow = false;
                    this.log('info', 'Workflow stopped by user');
                    break;
                }
            }
        }

        return this.generateWorkflowReport();
    }

    async runDevelopmentWorkflow() {
        console.log('🛠️ Starting Development Workflow (no deployment)');
        
        const success1 = await this.setupPhase();
        const success2 = await this.validationPhase();
        const success3 = await this.testingPhase();
        
        return this.generateWorkflowReport();
    }

    async runDeploymentWorkflow() {
        console.log('🚢 Starting Deployment Workflow');
        
        const success1 = await this.deploymentPrepPhase();
        if (success1) {
            await this.deploymentPhase();
        }
        
        return this.generateWorkflowReport();
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'complete';
    
    const orchestrator = new ForgeWorkflowOrchestrator();
    
    let workflowPromise;
    
    switch (mode) {
        case 'dev':
        case 'development':
            workflowPromise = orchestrator.runDevelopmentWorkflow();
            break;
        case 'deploy':
        case 'deployment':
            workflowPromise = orchestrator.runDeploymentWorkflow();
            break;
        case 'complete':
        case 'full':
        default:
            workflowPromise = orchestrator.runCompleteWorkflow();
            break;
    }
    
    workflowPromise.then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Workflow failed with error:', error.message);
        process.exit(1);
    });
}

module.exports = ForgeWorkflowOrchestrator;
