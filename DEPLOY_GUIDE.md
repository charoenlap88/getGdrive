# 🚀 **Production Deployment Guide**

## 📋 **สำหรับ Ubuntu Server**

### **1. 🔧 แก้ไขปัญหา Path บน Production:**

#### **Step 1: อัปเดตไฟล์**
```bash
# 1. อัปเดต index.html (ที่แก้ไขแล้ว)
# 2. ใช้ nginx config ที่ถูกต้อง
# 3. ใช้ PM2 config สำหรับ production
```

#### **Step 2: ใช้ nginx config ที่ถูกต้อง**
```nginx
# /etc/nginx/sites-available/smart-cs-dca.com
server {
    server_name smart-cs-dca.com www.smart-cs-dca.com;
    
    # ✅ แก้ไข: เพิ่ม trailing slash และ rewrite path
    location /gdrive/ {
        # ลบ /gdrive/ prefix และส่งไปที่ root ของแอพ
        rewrite ^/gdrive/(.*)$ /$1 break;
        proxy_pass http://localhost:4500;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Redirect HTTP ไป HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/smart-cs-dca.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smart-cs-dca.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name smart-cs-dca.com www.smart-cs-dca.com;
    return 301 https://$host$request_uri;
}
```

### **2. 🔄 Deploy Commands:**

```bash
# 1. หยุด PM2 (ถ้ามี)
pm2 stop google-sheets-api

# 2. อัปเดตไฟล์
# (copy index.html ใหม่, nginx config, etc.)

# 3. ติดตั้ง dependencies (ถ้าจำเป็น)
npm install

# 4. ตรวจสอบไฟล์จำเป็น
ls -la data/tab.json     # ต้องมีไฟล์นี้
ls -la index.html        # ต้องเป็นเวอร์ชันใหม่

# 5. รี start nginx
sudo nginx -t           # ทดสอบ config
sudo systemctl reload nginx

# 6. เริ่ม PM2 ใหม่
pm2 start ecosystem.config.js
# หรือใช้ production config
pm2 start ecosystem.production.config.js

# 7. ตรวจสอบสถานะ
pm2 status
pm2 logs google-sheets-api
```

### **3. 🧪 ทดสอบ:**

```bash
# 1. ทดสอบ API endpoints
curl https://smart-cs-dca.com/gdrive/api/sheets
curl https://smart-cs-dca.com/gdrive/api/health

# 2. ทดสอบเว็บไซต์
curl https://smart-cs-dca.com/gdrive/ | grep "ระบบค้นหาข้อมูลตารางราคา"
```

### **4. 🎯 ผลลัพธ์ที่ควรได้:**

#### **✅ Web Interface:**
- URL: `https://smart-cs-dca.com/gdrive/`
- หมวดหมู่โหลดได้ (dropdown มีข้อมูล)
- เลือกหมวดหมู่ได้ ข้อมูลแสดงผล
- ไม่มี 404 errors ใน console

#### **✅ API Endpoints:**
- `https://smart-cs-dca.com/gdrive/api/sheets` → JSON response
- `https://smart-cs-dca.com/gdrive/api/data?sheet_gid=XXX` → Data response
- `https://smart-cs-dca.com/gdrive/api/health` → Health check

### **5. 🔍 Troubleshooting:**

#### **ปัญหา: 404 Not Found**
```bash
# ตรวจสอบ nginx config
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# ตรวจสอบ PM2
pm2 logs google-sheets-api
```

#### **ปัญหา: API ไม่ตอบสนอง**
```bash
# ตรวจสอบ port
netstat -tlnp | grep 4500

# ตรวจสอบ process
ps aux | grep node
```

#### **ปัญหา: ไฟล์ไม่พบ**
```bash
# ตรวจสอบไฟล์จำเป็น
ls -la ~/getGdrive/data/tab.json
ls -la ~/getGdrive/index.html

# สิทธิ์ไฟล์
chmod 644 ~/getGdrive/data/tab.json
chmod 755 ~/getGdrive/data/
```

---

## 🚀 **สรุป:**

1. **Frontend**: แก้ไข API paths ให้รองรับ subdirectory ✅
2. **Nginx**: ใช้ config ที่มี rewrite rules ✅  
3. **PM2**: ใช้ production config ✅
4. **ทดสอบ**: ตรวจสอบ endpoints และ web interface ✅

**Result**: `https://smart-cs-dca.com/gdrive/` ควรทำงานปกติ! 🎉
