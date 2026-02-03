# 🏛️ Watheeq MVP

> نظام إدارة مكاتب المحاماة | Law Firm Management System

---

## 📋 نظرة عامة

نظام وثيق هو نظام متكامل لإدارة مكاتب المحاماة في المملكة العربية السعودية. يوفر النظام أدوات شاملة لإدارة القضايا، العملاء، الجلسات، المستندات، والفواتير.

### ✨ المميزات الرئيسية

- 📁 **إدارة القضايا** - تتبع القضايا بجميع تفاصيلها
- 👥 **إدارة العملاء** - قاعدة بيانات شاملة للعملاء
- 📅 **جدولة الجلسات** - تقويم وتذكيرات للجلسات
- 📄 **إدارة المستندات** - رفع وتنظيم الملفات
- 💰 **إدارة الفواتير** - فوترة وتتبع المدفوعات
- 📊 **لوحة التحكم** - إحصائيات وتقارير شاملة
- 🌙 **الوضع الداكن** - دعم كامل للوضع الليلي
- 🔒 **أمان متقدم** - JWT authentication + RBAC

---

## 🛠️ التقنيات المستخدمة

### Backend
| التقنية | الوصف |
|---------|-------|
| NestJS | إطار عمل Node.js |
| Prisma | ORM للتعامل مع قاعدة البيانات |
| PostgreSQL | قاعدة البيانات |
| JWT | المصادقة |
| Class-Validator | التحقق من البيانات |

### Frontend
| التقنية | الوصف |
|---------|-------|
| React 18 | مكتبة واجهة المستخدم |
| TypeScript | لغة البرمجة |
| Vite | أداة البناء |
| TanStack Query | إدارة حالة الخادم |
| Tailwind CSS | التنسيق |
| Shadcn/ui | مكونات UI |

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 20+
- PostgreSQL 15+
- npm أو yarn

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/your-username/watheeq-mvp.git
cd watheeq-mvp

# تشغيل سكريبت التطوير
./scripts/dev.sh

# أو يدوياً:

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Frontend (في terminal جديد)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### الوصول

| الخدمة | الرابط |
|--------|--------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| API Docs | http://localhost:3000/api/docs |

---

## 🐳 Docker

### التطوير المحلي

```bash
# تشغيل جميع الخدمات
docker compose up -d

# عرض السجلات
docker compose logs -f

# إيقاف الخدمات
docker compose down
```

### الإنتاج

```bash
# بناء الصور
./scripts/build.sh

# نشر للإنتاج
./scripts/deploy.sh
```

راجع [DEPLOYMENT.md](./DEPLOYMENT.md) للتفاصيل.

---

## 📁 هيكل المشروع

```
watheeq-mvp/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # المصادقة
│   │   ├── cases/          # القضايا
│   │   ├── clients/        # العملاء
│   │   ├── hearings/       # الجلسات
│   │   ├── documents/      # المستندات
│   │   ├── invoices/       # الفواتير
│   │   └── prisma/         # قاعدة البيانات
│   ├── prisma/
│   │   └── schema.prisma   # مخطط قاعدة البيانات
│   └── Dockerfile
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── api/           # استدعاءات API
│   │   ├── components/    # المكونات
│   │   ├── hooks/         # React Hooks
│   │   ├── pages/         # الصفحات
│   │   ├── stores/        # إدارة الحالة
│   │   └── styles/        # التنسيقات
│   ├── nginx.conf         # إعدادات Nginx
│   └── Dockerfile
│
├── scripts/               # سكريبتات المساعدة
│   ├── dev.sh            # تشغيل التطوير
│   ├── build.sh          # بناء الإنتاج
│   ├── deploy.sh         # نشر الإنتاج
│   ├── backup.sh         # نسخ احتياطي
│   └── restore.sh        # استعادة
│
├── docker-compose.yml     # تطوير محلي
├── docker-compose.prod.yml # إنتاج
├── DEPLOYMENT.md          # دليل النشر
└── README.md              # هذا الملف
```

---

## 🔐 الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|-----------|
| OWNER | جميع الصلاحيات + إدارة المكتب |
| ADMIN | إدارة المستخدمين + جميع العمليات |
| LAWYER | إدارة القضايا والعملاء |
| SECRETARY | القراءة + إدارة الجلسات |

---

## 📚 التوثيق

- [دليل النشر](./DEPLOYMENT.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📝 الترخيص

هذا المشروع مُرخص تحت [MIT License](LICENSE).

---

## 📞 الدعم

- 📧 support@watheeq.sa
- 📱 +966 XX XXX XXXX

---

**صُنع بـ ❤️ في المملكة العربية السعودية**
