# Google Sheets to JSON API (v2.0)

API ที่สร้างด้วย Node.js เพื่อดาวน์โหลด CSV จาก Google Sheets และแปลงเป็น JSON format แบบ local storage

## ✨ Features

- ✅ ดาวน์โหลด CSV file จาก Google Sheets และเก็บเป็น local file
- ✅ แปลงข้อมูล CSV เป็น JSON แบบ real-time (1ms processing time!)
- ✅ Custom CSV parser ที่รองรับ multiline fields ใน quoted text
- ✅ API endpoints ครบครัน รวมถึง refresh และ info
- ✅ CORS support สำหรับ frontend integration
- ✅ Error handling และ comprehensive logging
- ✅ Caching mechanism เพื่อประสิทธิภาพสูงสุด

## 🎨 Web Interface

### **เข้าถึงหน้าเว็บ:**
```
http://localhost:3000/index.html
```

### **ฟีเจอร์หน้าเว็บ:**
- 📋 **เลือกหมวดหมู่** - เลือกจาก 49 หมวดหมู่สินค้า
- 🔍 **ค้นหาแบบเรียลไทม์** - ค้นหาตามรหัสสินค้าหรือรายละเอียด
- 📊 **แสดงราคาตามปริมาณ** - เปรียบเทียบราคา 100-300, 301-500, 501-1000 ชิ้น
- 📱 **Responsive Design** - ใช้งานได้ทั้งมือถือและคอมพิวเตอร์
- ⚡ **โหลดเร็ว** - ใช้ cache system และ jQuery

**📖 คู่มือการใช้งานหน้าเว็บ:** [`FRONTEND_GUIDE.md`](./FRONTEND_GUIDE.md)

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Download CSV Data
```bash
node downloadCSV.js
```

### 3. Start Server
```bash
npm start
```

## 📊 API Endpoints

### GET `/api/data`
ดึงข้อมูลจาก local CSV file และแปลงเป็น JSON

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "totalRows": 8,
  "lastUpdated": "2024-01-27T10:30:00.000Z",
  "source": "Local CSV File",
  "sourceFile": "sheets-data.csv",
  "fileSize": 4713,
  "processingTime": "1ms"
}
```

### POST `/api/refresh`
ดาวน์โหลดข้อมูลใหม่จาก Google Sheets และอัปเดต local CSV file

**Response:**
```json
{
  "success": true,
  "message": "CSV data refreshed successfully",
  "totalRows": 8,
  "refreshTime": "2024-01-27T10:35:00.000Z"
}
```

### GET `/api/info`
แสดงข้อมูลเกี่ยวกับ CSV file และ cache status

### GET `/health`
ตรวจสอบสถานะของ API

### GET `/`
แสดงข้อมูลพื้นฐานและ endpoints ที่มี

## 🗂️ Project Structure

```
gdrive/
├── server.js          # Main API server
├── downloadCSV.js     # CSV download utility
├── csvParser.js       # Custom CSV parser
├── package.json       # Project dependencies
├── data/             # Local data storage
│   └── sheets-data.csv
└── README.md
```

## ⚙️ Configuration

- **Spreadsheet ID:** `174dcynBTIagtj0JckoVh248dXXncdi0I`
- **Sheet GID:** `1618426698`
- **CSV URL:** https://docs.google.com/spreadsheets/d/174dcynBTIagtj0JckoVh248dXXncdi0I/export?format=csv&gid=1618426698&single=true&output=csv

## 🔧 Usage Examples

### JavaScript/Fetch API
```javascript
// Get data from API
fetch('http://localhost:3000/api/data')
  .then(response => response.json())
  .then(data => {
    console.log(`Got ${data.totalRows} rows in ${data.processingTime}`);
    console.log(data.data); // Array of rows from Google Sheets
  })
  .catch(error => console.error('Error:', error));

// Refresh data from Google Sheets
fetch('http://localhost:3000/api/refresh', { method: 'POST' })
  .then(response => response.json())
  .then(result => {
    console.log('Data refreshed:', result.message);
  });
```

### cURL Commands
```bash
# Get data
curl http://localhost:3000/api/data

# Refresh data
curl -X POST http://localhost:3000/api/refresh

# Get file info
curl http://localhost:3000/api/info

# Health check
curl http://localhost:3000/health
```

## 🎯 Performance Benefits

| Feature | Old Approach | New Approach |
|---------|--------------|--------------|
| **Data Source** | Google Sheets API | Local CSV File |
| **Processing Time** | ~2-5 seconds | ~1ms |
| **Network Requests** | Every API call | Only on refresh |
| **Reliability** | Depends on Google | High (local file) |
| **Parsing** | csv-parser library | Custom parser |
| **Multiline Support** | Limited | Full support |

## 📋 Data Format

API ส่งคืนข้อมูลจาก **ตารางราคา อัพเดจ 27-1-65.xlsx** ที่มี:

- **Row 1:** Header - ตารางราคา Pure Soft products
- **Row 2:** Column headers (NO, รูปภาพ, รหัสสินค้า, รายละเอียด, etc.)  
- **Row 3:** Price range headers (1-99, 100-300, 301-500, 501-1000)
- **Rows 4-8:** Product data
  - Pure Soft (APS-02) - 50ml
  - Pure Soft (APS-08) - 20ml  
  - Pure Soft (SP-07) - 40ml
  - Pure Soft (1ลิตร) - 1 liter
  - Pure Soft (5ลิตร) - 5 liter

## 🔄 Data Workflow

1. **Download Phase:** `node downloadCSV.js` downloads fresh CSV from Google Sheets
2. **Storage:** CSV saved to `./data/sheets-data.csv`
3. **Parsing:** Custom parser handles multiline quoted fields correctly
4. **Serving:** API serves parsed JSON data instantly from local file
5. **Refresh:** POST `/api/refresh` updates local file with fresh data

## 🛠️ Environment Variables

- `PORT` - พอร์ตที่เซิร์ฟเวอร์จะใช้ (default: 3000)

## 🚨 Important Notes

- ✅ CSV file จะถูกดาวน์โหลดมาเก็บใน `./data/sheets-data.csv`
- ✅ Google Sheets ต้องเป็น public หรือมี sharing permissions
- ✅ ใช้ POST `/api/refresh` เพื่ออัปเดตข้อมูลจาก Google Sheets
- ✅ API จะทำงานแบบ offline หลังจากดาวน์โหลด CSV แล้ว
- ✅ รองรับ multiline text ใน CSV cells อย่างสมบูรณ์