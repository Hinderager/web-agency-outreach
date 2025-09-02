import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import chalk from 'chalk';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Track running processes to prevent concurrent runs
let isRunning = false;
let lastRunTime = null;
let lastRunStatus = null;

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Web Agency Outreach Webhook Server',
    isRunning,
    lastRunTime,
    lastRunStatus,
    endpoints: {
      trigger: '/webhook/trigger',
      status: '/webhook/status'
    }
  });
});

// Webhook trigger endpoint
app.post('/webhook/trigger', async (req, res) => {
  console.log(chalk.blue('🎯 Webhook triggered!'));
  
  if (isRunning) {
    console.log(chalk.yellow('⚠️ Workflow already running, skipping...'));
    return res.json({
      success: false,
      message: 'Workflow is already running',
      isRunning: true,
      lastRunTime
    });
  }
  
  // Start the workflow
  isRunning = true;
  lastRunTime = new Date().toISOString();
  lastRunStatus = 'running';
  
  res.json({
    success: true,
    message: 'Workflow started',
    startTime: lastRunTime
  });
  
  try {
    console.log(chalk.cyan('🚀 Starting full workflow...'));
    
    const child = spawn('node', ['scripts/run_full_workflow.js'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error(text.trim());
    });
    
    child.on('close', (code) => {
      isRunning = false;
      lastRunStatus = code === 0 ? 'success' : 'failed';
      
      if (code === 0) {
        console.log(chalk.green('🎉 Workflow completed successfully via webhook!'));
      } else {
        console.log(chalk.red(`❌ Workflow failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      isRunning = false;
      lastRunStatus = 'error';
      console.error(chalk.red('❌ Workflow error:'), error.message);
    });
    
  } catch (error) {
    isRunning = false;
    lastRunStatus = 'error';
    console.error(chalk.red('❌ Failed to start workflow:'), error.message);
  }
});

// Status endpoint
app.get('/webhook/status', (req, res) => {
  res.json({
    isRunning,
    lastRunTime,
    lastRunStatus,
    uptime: process.uptime()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.green(`🚀 Webhook server running on port ${PORT}`));
  console.log(chalk.cyan(`📡 Trigger URL: http://localhost:${PORT}/webhook/trigger`));
  console.log(chalk.cyan(`📊 Status URL: http://localhost:${PORT}/webhook/status`));
  console.log(chalk.yellow('💡 To make this accessible from Google Sheets, you\'ll need to use a service like ngrok'));
});

export default app;
