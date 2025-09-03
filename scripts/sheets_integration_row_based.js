import 'dotenv/config';
import fs from 'fs';
import { google } from 'googleapis';
import chalk from 'chalk';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';

// Load or request authorization
async function authorize() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error('No credentials.json found');
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (!fs.existsSync(TOKEN_PATH)) {
      throw new Error('No token.json found. Please run OAuth setup first.');
    }

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    
    return oAuth2Client;
  } catch (error) {
    console.error(chalk.red('❌ Authorization failed:'), error.message);
    throw error;
  }
}

// Find and process new lead from Google Sheets
export async function findAndProcessNewLead() {
  try {
    console.log(chalk.blue('🔍 Looking for new lead to process...'));
    
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1YwEs0drvCjqLsBYSL_2drDF-S72AVi66CzCosCUr8TY';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'A:O', // Read all relevant columns
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log(chalk.yellow('⚠️  No data found in sheet'));
      return null;
    }
    
    // Find the first row where column A is empty but other columns have data
    let targetRow = null;
    let targetRowIndex = 0;
    
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const columnA = row[0] || '';
      const hasOtherData = row.slice(1).some(cell => cell && cell.trim());
      
      if (!columnA.trim() && hasOtherData) {
        targetRow = row;
        targetRowIndex = i + 1; // 1-based index for sheets
        break;
      }
    }
    
    if (!targetRow) {
      console.log(chalk.yellow('⚠️  No new leads found (no rows with empty column A but other data)'));
      return null;
    }
    
    console.log(chalk.green(`✅ Found new lead in row ${targetRowIndex}`));
    
    // Extract lead data from the row
    const leadData = {
      rowNumber: targetRowIndex,
      dateAdded: '', // Will be filled with today's date
      status: targetRow[1] || '',
      firstName: targetRow[2] || '',
      lastName: targetRow[3] || '',
      email: targetRow[4] || '',
      city: targetRow[5] || '',
      businessName: targetRow[6] || '',
      website: targetRow[7] || '',
      score: targetRow[8] || '',
      primaryColor: targetRow[9] || '',
      secondaryColor: targetRow[10] || '',
      screenshot: targetRow[11] || '',
      vercelBuild: targetRow[12] || '',
      customizedEmailBody: targetRow[13] || '',
      notes: targetRow[14] || ''
    };
    
    // Add today's date to column A
    const today = new Date().toLocaleDateString('en-US');
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `A${targetRowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[today]]
      }
    });
    
    console.log(chalk.blue('📋 Processing lead:'));
    console.log(chalk.white(`   Name: ${leadData.firstName} ${leadData.lastName}`));
    console.log(chalk.white(`   Email: ${leadData.email}`));
    console.log(chalk.white(`   City: ${leadData.city}`));
    console.log(chalk.white(`   Website: ${leadData.website}`));
    console.log(chalk.white(`   Row: ${leadData.rowNumber}`));
    
    return leadData;
    
  } catch (error) {
    console.error(chalk.red('❌ Error finding new lead:'), error.message);
    throw error;
  }
}

// Update the processed lead with all analysis results
export async function updateLeadWithResults(leadData, analysisResults) {
  try {
    console.log(chalk.blue('📝 Updating Google Sheet with analysis results...'));
    
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = '1YwEs0drvCjqLsBYSL_2drDF-S72AVi66CzCosCUr8TY';
    const rowNumber = leadData.rowNumber;
    
    // Prepare updates for each column
    const updates = [];
    
    // Column B - Status (update to "processing" initially)
    updates.push({
      range: `B${rowNumber}`,
      values: [['processing']]
    });
    
    // Column I - Score
    if (analysisResults.score) {
      updates.push({
        range: `I${rowNumber}`,
        values: [[analysisResults.score]]
      });
    }
    
    // Column J - Primary Color
    if (analysisResults.primaryColor) {
      updates.push({
        range: `J${rowNumber}`,
        values: [[analysisResults.primaryColor]]
      });
    }
    
    // Column K - Secondary Color
    if (analysisResults.secondaryColor) {
      updates.push({
        range: `K${rowNumber}`,
        values: [[analysisResults.secondaryColor]]
      });
    }
    
    // Column L - Screenshot URL
    if (analysisResults.screenshotUrl) {
      updates.push({
        range: `L${rowNumber}`,
        values: [[analysisResults.screenshotUrl]]
      });
    }
    
    // Column M - Vercel Build URL
    if (analysisResults.vercelBuildUrl) {
      updates.push({
        range: `M${rowNumber}`,
        values: [[analysisResults.vercelBuildUrl]]
      });
    }
    
    // Column N - Customized Email Body
    if (analysisResults.customizedEmailBody) {
      updates.push({
        range: `N${rowNumber}`,
        values: [[analysisResults.customizedEmailBody]]
      });
    }
    
    // Column O - Notes
    if (analysisResults.notes) {
      updates.push({
        range: `O${rowNumber}`,
        values: [[analysisResults.notes]]
      });
    }
    
    // Batch update all columns
    if (updates.length > 0) {
      const batchUpdateRequest = {
        spreadsheetId: spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      };
      
      await sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);
      
      console.log(chalk.green(`✅ Updated ${updates.length} columns in row ${rowNumber}`));
      updates.forEach(update => {
        const column = update.range.match(/[A-Z]+/)[0];
        const value = update.values[0][0];
        const truncated = value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(chalk.white(`   ${column}: ${truncated}`));
      });
    }
    
    return true;
    
  } catch (error) {
    console.error(chalk.red('❌ Error updating sheet with results:'), error.message);
    throw error;
  }
}

// Generate customized email body
export function generateCustomizedEmail(leadData, analysisResults) {
  const emailBody = `Hi ${leadData.firstName},

I came across ${leadData.businessName} and was impressed by your work in ${leadData.city}. Your website at ${leadData.website} shows great potential, and I noticed some opportunities that could help you stand out even more in your market.

Based on my analysis of your site, I've identified several areas where we could enhance your online presence:

• **Design Optimization**: Your current branding uses ${analysisResults.primaryColor} as a primary color, which works well. We could explore complementing this with ${analysisResults.secondaryColor} for better visual hierarchy.

• **Performance Score**: Your site currently scores ${analysisResults.score}/100 on our analysis. We typically help businesses like yours achieve 90+ scores, which directly impacts search rankings and user experience.

• **Local Market Advantage**: Being based in ${leadData.city}, you have a unique opportunity to dominate local search results with the right SEO strategy.


**Additional Observations**: ${analysisResults.notes}


I'd love to show you exactly how we could transform your online presence. Would you be open to a 15-minute call this week to discuss how we've helped similar businesses in your industry increase their leads by 40-60%?

I've prepared a custom preview of what your enhanced website could look like - I'd be happy to share it during our call.

Best regards,
[Your Name]

P.S. I'm only taking on 3 new clients this month, so if this interests you, let's connect soon.`;

  return emailBody;
}

// Update status to "email sent" after successful Instantly campaign addition
export async function markEmailSent(leadData) {
  try {
    console.log(chalk.blue('📧 Marking email as sent in Google Sheet...'));
    
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = '1YwEs0drvCjqLsBYSL_2drDF-S72AVi66CzCosCUr8TY';
    const rowNumber = leadData.rowNumber;
    
    // Update Column B - Status to "email sent"
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `B${rowNumber}`,
      valueInputOption: 'RAW',
      resource: {
        values: [['email sent']]
      }
    });
    
    console.log(chalk.green(`✅ Status updated to "email sent" for row ${rowNumber}`));
    return true;
    
  } catch (error) {
    console.error(chalk.red('❌ Error updating email sent status:'), error.message);
    throw error;
  }
}

// Update status to "error" if something fails
export async function markProcessingError(leadData, errorMessage) {
  try {
    console.log(chalk.red('❌ Marking processing error in Google Sheet...'));
    
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = '1YwEs0drvCjqLsBYSL_2drDF-S72AVi66CzCosCUr8TY';
    const rowNumber = leadData.rowNumber;
    
    // Update Column B - Status to "error" and Column O - Notes with error
    const updates = [
      {
        range: `B${rowNumber}`,
        values: [['error']]
      },
      {
        range: `O${rowNumber}`,
        values: [[`Error: ${errorMessage.substring(0, 200)}...`]]
      }
    ];
    
    const batchUpdateRequest = {
      spreadsheetId: spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data: updates
      }
    };
    
    await sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);
    
    console.log(chalk.red(`❌ Status updated to "error" for row ${rowNumber}`));
    return true;
    
  } catch (error) {
    console.error(chalk.red('❌ Error updating error status:'), error.message);
    return false;
  }
}