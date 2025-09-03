import 'dotenv/config';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { 
  findAndProcessNewLead, 
  updateLeadWithResults, 
  generateCustomizedEmail,
  markEmailSent,
  markProcessingError 
} from './sheets_integration_row_based.js';

function runScript(scriptName, leadData = null) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\n🚀 Running ${scriptName}...`));
    
    const child = spawn('node', [`scripts/${scriptName}`], {
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        LEAD_DATA: leadData ? JSON.stringify(leadData) : undefined
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${scriptName} completed successfully`));
        resolve();
      } else {
        console.error(chalk.red(`❌ ${scriptName} failed with exit code ${code}`));
        reject(new Error(`${scriptName} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(chalk.red(`❌ Error running ${scriptName}:`, error.message));
      reject(error);
    });
  });
}

async function runRowBasedWorkflow() {
  let leadData = null;
  
  try {
    console.log(chalk.cyan('🎯 Starting Row-Based Web Agency Outreach Workflow\n'));
    
    // Step 1: Find the last row in column A without a value where other columns have data
    console.log(chalk.blue('📊 Step 1: Finding new lead to process...'));
    leadData = await findAndProcessNewLead();
    
    if (!leadData) {
      console.log(chalk.yellow('⚠️  No new leads found. Workflow complete.'));
      return;
    }
    
    console.log(chalk.green(`✅ Found new lead: ${leadData.firstName} ${leadData.lastName} from ${leadData.businessName}`));
    console.log(chalk.cyan(`📧 Email: ${leadData.email}`));
    console.log(chalk.cyan(`🌐 Website: ${leadData.website}`));
    console.log(chalk.cyan(`📍 City: ${leadData.city}`));
    console.log(chalk.cyan(`📋 Row: ${leadData.rowNumber}\n`));
    
    // Step 2: Analyze the website and extract branding
    console.log(chalk.blue('🔍 Step 2: Analyzing website and extracting branding...'));
    
    // Create a single lead file for processing in CSV format (expected by score_and_assets.js)
    const fs = await import('fs');
    
    // Ensure data directories exist
    if (!fs.existsSync('data/input')) {
      fs.mkdirSync('data/input', { recursive: true });
    }
    if (!fs.existsSync('data/output')) {
      fs.mkdirSync('data/output', { recursive: true });
    }
    
    // Create CSV with header and single lead
    const csvContent = `company,domain,email,city
"${leadData.businessName}","${leadData.website}","${leadData.email}","${leadData.city}"`;
    
    fs.writeFileSync('data/input/leads.csv', csvContent);
    
    // Run analysis on this single lead
    await runScript('score_and_assets_simple.js');
    
    // Step 3: Generate preview and Vercel build
    console.log(chalk.blue('🌿 Step 3: Creating preview and Vercel build...'));
    await runScript('branches_and_previews_real.js');
    
    // Step 4: Read analysis results
    console.log(chalk.blue('📊 Step 4: Reading analysis results...'));
    
    let analysisResults = {};
    
    // Read scored results
    if (fs.existsSync('data/output/scored.json')) {
      const scoredData = JSON.parse(fs.readFileSync('data/output/scored.json', 'utf-8'));
      const result = scoredData.find(r => r.domain === leadData.website);
      if (result) {
        analysisResults = {
          score: result.score || 75,
          primaryColor: result.primaryColor || '#0ea5e9',
          secondaryColor: result.secondaryColor || '#111827',
          screenshotUrl: result.screenshotPath || '',
          notes: `Analysis completed. Performance score: ${result.score || 75}/100`
        };
      }
    }
    
    // Read preview results
    if (fs.existsSync('data/output/ready_for_email.json')) {
      const previewData = JSON.parse(fs.readFileSync('data/output/ready_for_email.json', 'utf-8'));
      const result = previewData.find(r => r.domain === leadData.website);
      if (result) {
        analysisResults.vercelBuildUrl = result.preview_url || '';
      }
    }
    
    // Step 5: Generate customized email body
    console.log(chalk.blue('📝 Step 5: Generating customized email body...'));
    analysisResults.customizedEmailBody = generateCustomizedEmail(leadData, analysisResults);
    
    // Step 6: Update Google Sheet with all results
    console.log(chalk.blue('📊 Step 6: Updating Google Sheet with analysis results...'));
    await updateLeadWithResults(leadData, analysisResults);
    
    // Step 7: Generate Instantly CSV and mark email sent
    console.log(chalk.blue('📧 Step 7: Generating Instantly import and marking email sent...'));
    
    // Create ready_for_email.json with current lead and row number
    const readyForEmail = [{
      company: leadData.businessName,
      domain: leadData.website,
      email: leadData.email,
      city: leadData.city,
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      ...analysisResults,
      preview_url: analysisResults.vercelBuildUrl,
      slug: leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      rowNumber: leadData.rowNumber
    }];
    
    fs.writeFileSync('data/output/ready_for_email.json', JSON.stringify(readyForEmail, null, 2));
    
    // Run the Instantly CSV builder (which will mark email as sent)
    await runScript('build_instantly_csv.js');
    
    console.log(chalk.green('\n🎉 Row-based workflow completed successfully!'));
    console.log(chalk.cyan('\n📋 What was accomplished:'));
    console.log(chalk.white(`  • Processed lead: ${leadData.firstName} ${leadData.lastName}`));
    console.log(chalk.white(`  • Added today's date to column A (row ${leadData.rowNumber})`));
    console.log(chalk.white(`  • Analyzed website: ${leadData.website}`));
    console.log(chalk.white(`  • Generated score: ${analysisResults.score}/100`));
    console.log(chalk.white(`  • Extracted colors: ${analysisResults.primaryColor}, ${analysisResults.secondaryColor}`));
    console.log(chalk.white(`  • Created screenshot and preview`));
    console.log(chalk.white(`  • Generated customized email proposal`));
    console.log(chalk.white(`  • Updated Google Sheet with all results`));
    console.log(chalk.white(`  • Created Instantly.ai import CSV`));
    console.log(chalk.white(`  • Marked status as "email sent" in column B`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Row-based workflow failed:'), error.message);
    
    // Mark error in Google Sheet if we have lead data
    if (leadData && leadData.rowNumber) {
      try {
        await markProcessingError(leadData, error.message);
        console.log(chalk.red(`❌ Marked row ${leadData.rowNumber} with error status`));
      } catch (sheetError) {
        console.error(chalk.red('❌ Failed to update error status in sheet:'), sheetError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run the workflow
runRowBasedWorkflow();