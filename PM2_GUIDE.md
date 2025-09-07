# 🚀 PM2 Deployment Guide

## 📋 Overview

This project is now configured to run with PM2 (Process Manager 2) on port 4500 for production deployment.

## 🛠️ Installation

### Install PM2 globally
```bash
npm install -g pm2
```

### Install project dependencies
```bash
npm install
```

## 🚀 PM2 Commands

### Start the application
```bash
npm run pm2:start
```

### Stop the application
```bash
npm run pm2:stop
```

### Restart the application
```bash
npm run pm2:restart
```

### Reload the application (zero-downtime)
```bash
npm run pm2:reload
```

### Delete the application from PM2
```bash
npm run pm2:delete
```

### View logs
```bash
npm run pm2:logs
```

### Monitor application
```bash
npm run pm2:monit
```

## 📊 PM2 Configuration

### Port Configuration
- **Production Port**: 4500
- **Development Port**: 4500 (with watch mode)

### Environment Variables
```bash
# Production
NODE_ENV=production
PORT=4500

# Development
NODE_ENV=development
PORT=4500
```

## 📁 Project Structure
```
gdrive/
├── server.js              # Main application file
├── ecosystem.config.js     # PM2 configuration
├── package.json           # Dependencies and scripts
├── logs/                  # PM2 log files
│   ├── err.log           # Error logs
│   ├── out.log           # Output logs
│   └── combined.log      # Combined logs
└── data/                 # CSV data files
```

## 🔧 PM2 Features

### Auto-restart
- Automatically restarts on crash
- Max 10 restarts with 10s minimum uptime

### Memory Management
- Auto-restart when memory usage exceeds 1GB

### Logging
- Separate error, output, and combined logs
- Timestamped log entries
- Log rotation and management

### Clustering
- Single instance mode (can be changed to cluster mode)
- Graceful shutdown support

## 📱 API Endpoints

### Base URL
```
http://localhost:4500
```

### Available Endpoints
```
GET    /                           # Web interface
GET    /api/data                   # Get sheet data
POST   /api/refresh                # Refresh data
GET    /api/info                   # Sheet info
GET    /api/sheets                 # List all sheets
POST   /api/download-config        # Download config
DELETE /api/cache                  # Clear cache
```

## 🔍 Monitoring

### PM2 Status
```bash
pm2 status
```

### Real-time Monitoring
```bash
pm2 monit
```

### View Specific Logs
```bash
pm2 logs google-sheets-api --lines 100
```

### Flush Logs
```bash
pm2 flush
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 4500
lsof -i :4500

# Kill the process
kill -9 <PID>
```

### PM2 Not Starting
```bash
# Check PM2 status
pm2 list

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

### Memory Issues
```bash
# Check memory usage
pm2 monit

# Restart specific app
npm run pm2:restart
```

## 📈 Production Checklist

- [ ] PM2 installed globally
- [ ] Dependencies installed (`npm install`)
- [ ] Logs directory created
- [ ] Port 4500 available
- [ ] Environment variables set
- [ ] Application started with PM2
- [ ] Monitoring setup
- [ ] Auto-startup configured (optional)

### Auto-startup Configuration (Optional)
```bash
# Generate startup script
pm2 startup

# Save current PM2 processes
pm2 save
```

## 🎯 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start with PM2
npm run pm2:start

# 3. Check status
pm2 status

# 4. View logs
npm run pm2:logs

# 5. Access application
curl http://localhost:4500
```

## 🔗 Useful Links

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Ecosystem File Reference](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Monitoring](https://pm2.keymetrics.io/docs/usage/monitoring/)
