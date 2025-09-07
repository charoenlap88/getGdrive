const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Default Google Sheets configuration
const DEFAULT_SPREADSHEET_ID = '174dcynBTIagtj0JckoVh248dXXncdi0I';
const DEFAULT_SHEET_GID = '1618426698';

// Generate CSV URL based on spreadsheet and sheet IDs
function generateCSVUrl(spreadsheetId, sheetGid) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}&single=true&output=csv`;
}

// Generate file path based on spreadsheet and sheet IDs
function generateFilePath(spreadsheetId, sheetGid) {
  return path.join(__dirname, 'data', `sheets-${spreadsheetId}-${sheetGid}.csv`);
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('📁 Data directory ready');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Download CSV file from Google Sheets with parameters
async function downloadCSV(spreadsheetId = DEFAULT_SPREADSHEET_ID, sheetGid = DEFAULT_SHEET_GID) {
  try {
    // Validate parameters
    if (!spreadsheetId || !sheetGid) {
      throw new Error('❌ Missing required parameters: spreadsheetId and sheetGid');
    }

    const csvUrl = generateCSVUrl(spreadsheetId, sheetGid);
    const filePath = generateFilePath(spreadsheetId, sheetGid);

    console.log('🔄 Downloading CSV from Google Sheets...');
    console.log('📋 Spreadsheet ID:', spreadsheetId);
    console.log('📋 Sheet GID:', sheetGid);
    console.log('📋 URL:', csvUrl);

    const response = await axios.get(csvUrl, {
      responseType: 'text',
      maxRedirects: 5,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv,application/csv,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8'
      }
    });

    // Check if response is actually CSV and not HTML redirect
    if (response.data.includes('<HTML>') || response.data.includes('<html>') || response.data.includes('<!DOCTYPE')) {
      throw new Error('Received HTML redirect instead of CSV data. Check if the sheet is publicly accessible.');
    }

    // Check if response is empty or too short
    if (!response.data || response.data.length < 10) {
      throw new Error('Received empty or invalid CSV data');
    }

    console.log(`📊 Downloaded ${response.data.length} characters`);
    console.log(`📋 Data lines: ${response.data.split('\n').length}`);

    // Ensure data directory exists
    await ensureDataDirectory();

    // Save CSV file
    await fs.writeFile(filePath, response.data, 'utf8');
    
    console.log('✅ CSV file saved successfully!');
    console.log('📁 File path:', filePath);
    
    // Show preview of data
    const lines = response.data.split('\n').slice(0, 3);
    console.log('\n📄 Data preview:');
    lines.forEach((line, i) => {
      console.log(`${i + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });

    return {
      success: true,
      spreadsheetId,
      sheetGid,
      filePath,
      csvUrl,
      dataLength: response.data.length,
      dataLines: response.data.split('\n').length,
      downloadTime: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error downloading CSV:', error.message);
    throw error;
  }
}

// Main function - for testing with default values
async function main() {
  try {
    console.log('🚀 Running with default spreadsheet configuration...');
    const result = await downloadCSV();
    console.log('\n🎉 Download completed successfully!');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('💥 Download failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  downloadCSV,
  generateCSVUrl,
  generateFilePath,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_GID,
  ensureDataDirectory
};

// Run if called directly
if (require.main === module) {
  main();
}
