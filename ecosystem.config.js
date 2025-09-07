module.exports = {
  apps: [{
    name: 'google-sheets-api',
    script: 'server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4500
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4500,
      watch: true,
      ignore_watch: [
        "node_modules",
        "data",
        "*.log"
      ]
    },
    // PM2 Options
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Environment variables
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
};
