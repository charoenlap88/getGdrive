const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { parseCSV } = require('./csvParser');
const { 
  downloadCSV, 
  generateFilePath, 
  DEFAULT_SPREADSHEET_ID, 
  DEFAULT_SHEET_GID 
} = require('./downloadCSV');

const app = express();
const PORT = process.env.PORT || 4500;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Cache for multiple CSV data
const csvDataCache = new Map(); // Key: "spreadsheetId-sheetGid", Value: { data, timestamp }
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to read and parse CSV file with parameters
async function readCSVFile(spreadsheetId = DEFAULT_SPREADSHEET_ID, sheetGid = DEFAULT_SHEET_GID) {
  try {
    const cacheKey = `${spreadsheetId}-${sheetGid}`;
    const filePath = generateFilePath(spreadsheetId, sheetGid);
    
    console.log('📖 Reading CSV file...');
    console.log('📋 Spreadsheet ID:', spreadsheetId);
    console.log('📋 Sheet GID:', sheetGid);
    console.log('📁 File path:', filePath);

    // Check cache first
    const cachedData = csvDataCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('🔄 Using cached data');
      return cachedData.data;
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.log('📁 CSV file not found, downloading...');
      await downloadCSV(spreadsheetId, sheetGid);
    }

    // Read the file
    const csvData = await fs.readFile(filePath, 'utf8');
    console.log(`📊 Read ${csvData.length} characters from CSV file`);

    // Parse CSV data
    const parsedData = parseCSV(csvData);
    
    // Update cache
    csvDataCache.set(cacheKey, {
      data: parsedData,
      timestamp: Date.now()
    });
    
    return parsedData;

  } catch (error) {
    console.error('❌ Error reading CSV file:', error.message);
    throw error;
  }
}

// API endpoint to get data from local CSV file with parameters
app.get('/api/data', async (req, res) => {
  try {
    // Get parameters from query string
    const spreadsheetId = req.query.spreadsheet_id || req.query.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const sheetGid = req.query.sheet_gid || req.query.sheetGid || DEFAULT_SHEET_GID;

    // Validate parameters
    if (!spreadsheetId || !sheetGid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Please provide spreadsheet_id and sheet_gid parameters',
        example: '/api/data?spreadsheet_id=YOUR_SPREADSHEET_ID&sheet_gid=YOUR_SHEET_GID'
      });
    }

    console.log('🔄 Fetching data from local CSV file...');
    console.log(`📋 Parameters: spreadsheetId=${spreadsheetId}, sheetGid=${sheetGid}`);
    
    const startTime = Date.now();
    const jsonData = await readCSVFile(spreadsheetId, sheetGid);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Successfully converted ${jsonData.length} rows to JSON`);
    console.log(`⏱️ Processing time: ${processingTime}ms`);

    // Get file stats
    const filePath = generateFilePath(spreadsheetId, sheetGid);
    const stats = await fs.stat(filePath);

    // Return JSON response
    res.json({
      success: true,
      data: jsonData,
      totalRows: jsonData.length,
      lastUpdated: new Date().toISOString(),
      source: 'Local CSV File',
      sourceFile: path.basename(filePath),
      fileSize: stats.size,
      fileModified: stats.mtime.toISOString(),
      processingTime: `${processingTime}ms`,
      spreadsheetId: spreadsheetId,
      sheetGid: sheetGid
    });

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to read CSV file. Try refreshing the data first.',
      suggestion: 'POST to /api/refresh to download fresh data'
    });
  }
});

// API endpoint to refresh CSV data from Google Sheets
app.post('/api/refresh', async (req, res) => {
  try {
    // Get parameters from query string or body
    const spreadsheetId = req.query.spreadsheet_id || req.body.spreadsheet_id || 
                         req.query.spreadsheetId || req.body.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const sheetGid = req.query.sheet_gid || req.body.sheet_gid || 
                     req.query.sheetGid || req.body.sheetGid || DEFAULT_SHEET_GID;

    console.log('🔄 Refreshing CSV data from Google Sheets...');
    console.log(`📋 Parameters: spreadsheetId=${spreadsheetId}, sheetGid=${sheetGid}`);
    
    const downloadResult = await downloadCSV(spreadsheetId, sheetGid);
    console.log('✅ CSV downloaded successfully');
    
    // Clear cache for this specific sheet
    const cacheKey = `${spreadsheetId}-${sheetGid}`;
    csvDataCache.delete(cacheKey);
    
    // Parse the new data
    const jsonData = await readCSVFile(spreadsheetId, sheetGid);
    
    res.json({
      success: true,
      message: 'CSV data refreshed successfully',
      download: downloadResult,
      totalRows: jsonData.length,
      refreshTime: new Date().toISOString(),
      spreadsheetId: spreadsheetId,
      sheetGid: sheetGid
    });

  } catch (error) {
    console.error('❌ Error refreshing CSV data:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to refresh CSV data from Google Sheets'
    });
  }
});

// API endpoint to get file info with parameters
app.get('/api/info', async (req, res) => {
  try {
    // Get parameters from query string
    const spreadsheetId = req.query.spreadsheet_id || req.query.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const sheetGid = req.query.sheet_gid || req.query.sheetGid || DEFAULT_SHEET_GID;
    
    let fileExists = false;
    let fileStats = null;
    
    const filePath = generateFilePath(spreadsheetId, sheetGid);
    const cacheKey = `${spreadsheetId}-${sheetGid}`;
    
    try {
      fileStats = await fs.stat(filePath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist
    }

    const cachedData = csvDataCache.get(cacheKey);

    res.json({
      success: true,
      parameters: {
        spreadsheetId: spreadsheetId,
        sheetGid: sheetGid
      },
      csvFile: {
        exists: fileExists,
        path: filePath,
        fileName: path.basename(filePath),
        size: fileStats?.size || 0,
        modified: fileStats?.mtime?.toISOString() || null
      },
      cache: {
        hasData: cachedData !== undefined,
        rowCount: cachedData?.data?.length || 0,
        lastLoaded: cachedData ? new Date(cachedData.timestamp).toISOString() : null,
        totalCachedSheets: csvDataCache.size
      },
      googleSheets: {
        spreadsheetId: spreadsheetId,
        sheetGid: sheetGid,
        csvUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}&single=true&output=csv`
      }
    });

  } catch (error) {
    console.error('❌ Error getting file info:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to download tab.json to data folder
app.post('/api/download-config', async (req, res) => {
  try {
    console.log('📥 Downloading tab.json to data folder...');
    
    // Read the tab.json file from root directory
    const tabJsonPath = path.join(__dirname, 'tab.json');
    const targetPath = path.join(__dirname, 'data', 'tab.json');
    
    // Check if source file exists
    try {
      await fs.access(tabJsonPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'tab.json file not found in root directory',
        sourcePath: tabJsonPath
      });
    }
    
    // Read the source file
    const tabData = await fs.readFile(tabJsonPath, 'utf8');
    console.log(`📊 Read ${tabData.length} characters from tab.json`);
    
    // Parse JSON to validate and get info
    const tabConfig = JSON.parse(tabData);
    console.log(`📋 Found ${tabConfig.SHEETS?.length || 0} sheets for spreadsheet: ${tabConfig.SPREADSHEET_ID}`);
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Write to target location
    await fs.writeFile(targetPath, tabData, 'utf8');
    
    // Get file stats
    const stats = await fs.stat(targetPath);
    
    console.log('✅ tab.json copied successfully!');
    console.log('📁 Target path:', targetPath);
    
    res.json({
      success: true,
      message: 'tab.json downloaded to data folder successfully',
      file: {
        sourcePath: tabJsonPath,
        targetPath: targetPath,
        fileName: 'tab.json',
        size: stats.size,
        created: stats.mtime.toISOString()
      },
      config: {
        spreadsheetId: tabConfig.SPREADSHEET_ID,
        totalSheets: tabConfig.SHEETS?.length || 0,
        sheets: tabConfig.SHEETS?.slice(0, 5).map(sheet => ({
          name: sheet.name,
          gid: sheet.gid
        })) || [],
        note: tabConfig.SHEETS?.length > 5 ? `... and ${tabConfig.SHEETS.length - 5} more sheets` : null
      },
      downloadTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error downloading tab.json:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to download tab.json to data folder'
    });
  }
});

// API endpoint to list available sheets from tab.json
app.get('/api/sheets', async (req, res) => {
  try {
    const tabJsonPath = path.join(__dirname, 'data', 'tab.json');
    
    // Check if file exists in data folder
    try {
      await fs.access(tabJsonPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'tab.json not found in data folder',
        message: 'Use POST /api/download-config to download tab.json first',
        targetPath: tabJsonPath
      });
    }
    
    // Read and parse the file
    const tabData = await fs.readFile(tabJsonPath, 'utf8');
    const tabConfig = JSON.parse(tabData);
    
    res.json({
      success: true,
      spreadsheetId: tabConfig.SPREADSHEET_ID,
      totalSheets: tabConfig.SHEETS?.length || 0,
      sheets: tabConfig.SHEETS || [],
      lastModified: (await fs.stat(tabJsonPath)).mtime.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error reading sheets config:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to read sheets configuration'
    });
  }
});

// API endpoint to clear cache
app.delete('/api/cache', (req, res) => {
  try {
    const cacheSize = csvDataCache.size;
    csvDataCache.clear();
    
    res.json({
      success: true,
      message: `Cleared cache for ${cacheSize} sheet(s)`,
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Google Sheets CSV API',
    cache: {
      totalCachedSheets: csvDataCache.size,
      cacheEntries: Array.from(csvDataCache.keys())
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Google Sheets CSV to JSON API with Parameters',
    usage: {
      data: 'GET /api/data?spreadsheet_id=YOUR_ID&sheet_gid=YOUR_GID',
      refresh: 'POST /api/refresh?spreadsheet_id=YOUR_ID&sheet_gid=YOUR_GID',
      info: 'GET /api/info?spreadsheet_id=YOUR_ID&sheet_gid=YOUR_GID',
      downloadConfig: 'POST /api/download-config - Download tab.json to data folder',
      sheets: 'GET /api/sheets - List available sheets from tab.json',
      clearCache: 'DELETE /api/cache',
      health: 'GET /health'
    },
    parameters: {
      spreadsheet_id: 'Google Sheets document ID (optional, has default)',
      sheet_gid: 'Sheet tab ID (optional, has default)'
    },
    defaults: {
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      sheetGid: DEFAULT_SHEET_GID
    },
    version: '2.1.0'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 API endpoints (with parameters support):`);
  console.log(`   GET  http://localhost:${PORT}/api/data?spreadsheet_id=ID&sheet_gid=GID`);
  console.log(`   POST http://localhost:${PORT}/api/refresh?spreadsheet_id=ID&sheet_gid=GID`);
  console.log(`   GET  http://localhost:${PORT}/api/info?spreadsheet_id=ID&sheet_gid=GID`);
  console.log(`   POST http://localhost:${PORT}/api/download-config`);
  console.log(`   GET  http://localhost:${PORT}/api/sheets`);
  console.log(`   DELETE http://localhost:${PORT}/api/cache`);
  console.log(`🔗 Default Sheet: ${DEFAULT_SPREADSHEET_ID}/${DEFAULT_SHEET_GID}`);
  
  // Try to load existing default CSV on startup
  try {
    const data = await readCSVFile();
    console.log(`✅ Loaded ${data.length} rows from default CSV file`);
  } catch (error) {
    console.log(`⚠️  No default CSV file found. Use POST /api/refresh to download data.`);
  }
});

module.exports = app;