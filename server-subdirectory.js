const express = require('express');
const cors = require('cors');
const path = require('path');
const { readCSVFile } = require('./csvParser');

const app = express();
const PORT = process.env.PORT || 4500;

// 🔧 กำหนด base path สำหรับ subdirectory
const BASE_PATH = process.env.BASE_PATH || '';  // เช่น '/gdrive' สำหรับ production

console.log(`🌐 Base path: ${BASE_PATH || '(root)'}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname, {
  // 🔧 ตั้งค่า static files ให้รองรับ base path
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 🔧 API Routes with base path
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    basePath: BASE_PATH,
    port: PORT
  });
});

// API endpoints
router.get('/api/data', async (req, res) => {
  try {
    const { spreadsheet_id, sheet_gid } = req.query;
    const data = await readCSVFile(spreadsheet_id, sheet_gid);
    
    res.json({
      success: true,
      data: data,
      totalRows: data.length,
      basePath: BASE_PATH,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error reading CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔧 ใช้ router กับ base path
if (BASE_PATH) {
  app.use(BASE_PATH, router);
  // Static files สำหรับ subdirectory
  app.use(BASE_PATH, express.static(__dirname));
  
  // Root path สำหรับ subdirectory
  app.get(BASE_PATH + '/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
} else {
  app.use('/', router);
}

// 🔧 Root route
app.get('/', (req, res) => {
  if (BASE_PATH) {
    res.redirect(BASE_PATH + '/');
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}${BASE_PATH}`);
  console.log(`📊 API endpoints (with base path support):`);
  console.log(`   GET  http://localhost:${PORT}${BASE_PATH}/api/data?spreadsheet_id=ID&sheet_gid=GID`);
  console.log(`   GET  http://localhost:${PORT}${BASE_PATH}/health`);
  console.log(`🔗 Web Interface: http://localhost:${PORT}${BASE_PATH}/`);
});

module.exports = app;
