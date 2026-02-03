# 🚀 Watheeq MVP - Deployment Guide

> نظام إدارة مكاتب المحاماة - دليل النشر والتشغيل

---

## 📋 المتطلبات الأساسية

### البرامج المطلوبة

| البرنامج | الإصدار | الغرض |
|----------|---------|-------|
| Docker | 24+ | تشغيل الحاويات |
| Docker Compose | 2.20+ | إدارة الخدمات |
| Node.js | 20 LTS | تطوير محلي (اختياري) |
| Git | 2.40+ | إدارة الكود |

### متطلبات الأجهزة (Production)

| المورد | الحد الأدنى | الموصى به |
|--------|-------------|-----------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB SSD | 50 GB SSD |

---

## 🏠 التطوير المحلي

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/watheeq-mvp.git
cd watheeq-mvp
```

### 2. إعداد المتغيرات البيئية

```bash
# Backend
cp backend/.env.example backend/.env
# عدّل القيم في backend/.env

# Frontend
cp frontend/.env.example frontend/.env
# عدّل القيم في frontend/.env
```

### 3. التشغيل بدون Docker

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend (في terminal جديد)
cd frontend
npm install
npm run dev
```

### 4. التشغيل مع Docker

```bash
# تشغيل جميع الخدمات
docker compose up -d

# عرض السجلات
docker compose logs -f

# إيقاف الخدمات
docker compose down
```

### الوصول للخدمات

| الخدمة | الرابط |
|--------|--------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 🏭 نشر الإنتاج

### الخطوة 1: إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# تثبيت Docker Compose
sudo apt install docker-compose-plugin -y
```

### الخطوة 2: استنساخ المشروع

```bash
git clone https://github.com/your-username/watheeq-mvp.git
cd watheeq-mvp
```

### الخطوة 3: إعداد المتغيرات البيئية

```bash
# إنشاء ملف .env للإنتاج
cat > .env << 'EOF'
# Database
POSTGRES_DB=watheeq_prod
POSTGRES_USER=watheeq_admin
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# Redis
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD

# JWT (استخدم: openssl rand -base64 64)
JWT_SECRET=CHANGE_ME_JWT_SECRET
JWT_EXPIRES_IN=7d
EOF
```

### الخطوة 4: بناء وتشغيل

```bash
# بناء الصور
docker compose -f docker-compose.prod.yml build

# تشغيل الخدمات
docker compose -f docker-compose.prod.yml up -d

# تشغيل migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### الخطوة 5: التحقق

```bash
# فحص حالة الخدمات
docker compose -f docker-compose.prod.yml ps

# فحص السجلات
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔄 تحديث التطبيق

```bash
# جلب التحديثات
git pull origin main

# إعادة بناء الصور
docker compose -f docker-compose.prod.yml build

# إعادة التشغيل مع zero downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend frontend

# تشغيل migrations إن وجدت
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## 💾 النسخ الاحتياطي والاستعادة

### نسخ قاعدة البيانات

```bash
# نسخ احتياطي
./scripts/backup.sh

# أو يدوياً
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
```

### استعادة قاعدة البيانات

```bash
# من ملف نسخة احتياطية
./scripts/restore.sh backup_20260128_120000.sql

# أو يدوياً
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### نسخ ملفات الرفع

```bash
# نسخ
docker cp watheeq_backend_prod:/app/uploads ./uploads_backup

# استعادة
docker cp ./uploads_backup/. watheeq_backend_prod:/app/uploads
```

---

## 🔧 إعدادات SSL/HTTPS

### استخدام Let's Encrypt مع Nginx Proxy

```bash
# إضافة Certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d watheeq.sa -d www.watheeq.sa
```

### تحديث nginx.conf للـ HTTPS

```nginx
server {
    listen 443 ssl http2;
    server_name watheeq.sa www.watheeq.sa;
    
    ssl_certificate /etc/letsencrypt/live/watheeq.sa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/watheeq.sa/privkey.pem;
    
    # ... باقي الإعدادات
}
```

---

## 📊 المراقبة والسجلات

### عرض السجلات

```bash
# جميع الخدمات
docker compose -f docker-compose.prod.yml logs -f

# خدمة محددة
docker compose -f docker-compose.prod.yml logs -f backend

# آخر 100 سطر
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### فحص صحة الخدمات

```bash
# حالة الحاويات
docker compose -f docker-compose.prod.yml ps

# استخدام الموارد
docker stats

# فحص API
curl http://localhost:3000/api/health
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: الحاوية لا تبدأ

```bash
# فحص السجلات
docker compose -f docker-compose.prod.yml logs backend

# إعادة البناء بدون cache
docker compose -f docker-compose.prod.yml build --no-cache backend
```

### مشكلة: خطأ في قاعدة البيانات

```bash
# فحص اتصال PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER -c '\l'

# إعادة تشغيل migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate reset --force
```

### مشكلة: الذاكرة ممتلئة

```bash
# تنظيف Docker
docker system prune -a --volumes

# تنظيف الصور غير المستخدمة
docker image prune -a
```

### مشكلة: المنفذ مستخدم

```bash
# إيجاد العملية
sudo lsof -i :80
sudo lsof -i :3000

# إنهاء العملية
sudo kill -9 PID
```

---

## 📁 هيكل الملفات

```
watheeq-mvp/
├── backend/
│   ├── Dockerfile          # بناء الإنتاج
│   ├── Dockerfile.dev      # بناء التطوير
│   ├── .env.example        # متغيرات بيئية
│   └── ...
├── frontend/
│   ├── Dockerfile          # بناء الإنتاج
│   ├── Dockerfile.dev      # بناء التطوير
│   ├── nginx.conf          # إعدادات Nginx
│   ├── .env.example        # متغيرات بيئية
│   └── ...
├── scripts/
│   ├── dev.sh              # تشغيل التطوير
│   ├── build.sh            # بناء الإنتاج
│   ├── deploy.sh           # نشر الإنتاج
│   ├── backup.sh           # نسخ احتياطي
│   └── restore.sh          # استعادة
├── docker-compose.yml      # تطوير محلي
├── docker-compose.prod.yml # إنتاج
└── DEPLOYMENT.md           # هذا الملف
```

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- 📧 البريد: support@watheeq.sa
- 📱 الهاتف: +966 XX XXX XXXX

---

**آخر تحديث:** 2026-01-28
