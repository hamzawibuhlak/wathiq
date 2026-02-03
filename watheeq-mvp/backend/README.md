# 🔧 Watheeq Backend

> NestJS API للنظام

---

## 🚀 التشغيل

### المتطلبات

- Node.js 20+
- PostgreSQL 15+
- Redis 7+ (اختياري)

### التثبيت

```bash
# تثبيت الحزم
npm install

# إعداد المتغيرات البيئية
cp .env.example .env
# عدّل القيم في .env

# إنشاء قاعدة البيانات
npx prisma migrate dev

# تشغيل التطوير
npm run start:dev
```

### الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run start:dev` | تشغيل بوضع التطوير |
| `npm run build` | بناء للإنتاج |
| `npm run start:prod` | تشغيل الإنتاج |
| `npm run test` | تشغيل الاختبارات |
| `npm run lint` | فحص الكود |

---

## 🐳 Docker

```bash
# بناء الصورة
docker build -t watheeq-backend .

# تشغيل
docker run -p 3000:3000 --env-file .env watheeq-backend
```

---

## 📁 الهيكل

```
src/
├── auth/           # المصادقة (JWT)
├── users/          # إدارة المستخدمين
├── firms/          # إدارة المكاتب
├── cases/          # القضايا
├── clients/        # العملاء
├── hearings/       # الجلسات
├── documents/      # المستندات
├── invoices/       # الفواتير
├── prisma/         # خدمة قاعدة البيانات
└── common/         # المشترك (guards, decorators)
```

---

## 🔗 API Endpoints

### Auth
- `POST /api/auth/register` - تسجيل جديد
- `POST /api/auth/login` - تسجيل دخول
- `GET /api/auth/me` - المستخدم الحالي

### Cases
- `GET /api/cases` - جلب القضايا
- `POST /api/cases` - إنشاء قضية
- `GET /api/cases/:id` - تفاصيل قضية
- `PATCH /api/cases/:id` - تحديث قضية
- `DELETE /api/cases/:id` - حذف قضية

### Clients
- `GET /api/clients` - جلب العملاء
- `POST /api/clients` - إنشاء عميل
- `GET /api/clients/:id` - تفاصيل عميل

### Hearings
- `GET /api/hearings` - جلب الجلسات
- `POST /api/hearings` - إنشاء جلسة
- `GET /api/hearings/calendar` - عرض التقويم

### Documents
- `GET /api/documents` - جلب المستندات
- `POST /api/documents/upload` - رفع مستند
- `GET /api/documents/:id/download` - تحميل مستند

### Invoices
- `GET /api/invoices` - جلب الفواتير
- `POST /api/invoices` - إنشاء فاتورة
- `PATCH /api/invoices/:id/status` - تغيير حالة

---

## 🗄️ قاعدة البيانات

### Prisma Commands

```bash
# إنشاء migration جديد
npx prisma migrate dev --name migration_name

# تطبيق migrations
npx prisma migrate deploy

# عرض قاعدة البيانات
npx prisma studio

# إعادة توليد client
npx prisma generate
```

---

## 🔐 المتغيرات البيئية

راجع `.env.example` للقائمة الكاملة.

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| DATABASE_URL | رابط PostgreSQL | ✅ |
| JWT_SECRET | مفتاح JWT | ✅ |
| JWT_EXPIRES_IN | مدة صلاحية JWT | ✅ |
| PORT | منفذ الخادم | ❌ |
| REDIS_URL | رابط Redis | ❌ |
