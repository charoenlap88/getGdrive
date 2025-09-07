module.exports = {
  apps: [{
    name: 'google-sheets-api',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4500,
      // 🔧 เพิ่ม BASE_PATH สำหรับ subdirectory support
      BASE_PATH: '/gdrive'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4500,
      BASE_PATH: '/gdrive'
    },
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // PM2 plus settings
    pmx: true,
    
    // Error logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Advanced settings
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    merge_logs: true,
    
    // Instance settings
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
