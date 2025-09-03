import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'fs';

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  const token = JSON.parse(fs.readFileSync('token.json'));
  oAuth2Client.setCredentials(token);
  
  return oAuth2Client;
}

async function clearRowA() {
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1YwEs0drvCjqLsBYSL_2drDF-S72AVi66CzCosCUr8TY';
    
    console.log('🧹 Clearing column A row 2 to make it available for processing...');
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'A2',
      valueInputOption: 'RAW',
      resource: {
        values: [['']]
      }
    });
    
    console.log('✅ Column A row 2 cleared - ready for processing!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearRowA();
