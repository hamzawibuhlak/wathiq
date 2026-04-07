---
description: Deploy Watheeq to production server (76.13.254.7)
---

# خطوات النشر على السيرفر

**السيرفر:** `root@76.13.254.7`
**بدون كلمة مرور (SSH Key)**
**المسار على السيرفر:** `/root/watheeq-mvp/`

---

## الخطوة 1: ضغط الملفات محلياً

// turbo
```bash
cd "/Users/hamzabuhlakq/Downloads/succes-mark/projects-2026/wathiq system projec/watheeq-mvp" && tar -czf deploy-package.tar.gz \
  backend/src \
  frontend/src \
  backend/prisma/schema.prisma \
  backend/package.json \
  frontend/package.json
```

## الخطوة 2: رفع الملف المضغوط للسيرفر

```bash
scp "/Users/hamzabuhlakq/Downloads/succes-mark/projects-2026/wathiq system projec/watheeq-mvp/deploy-package.tar.gz" root@76.13.254.7:/root/watheeq-mvp/
```

## الخطوة 3: فك الضغط + البناء + التشغيل (أمر واحد)

```bash
ssh root@76.13.254.7 "
cd /root/watheeq-mvp

# فك الضغط
tar -xzf deploy-package.tar.gz

# إعادة البناء والتشغيل
docker compose -f docker-compose.prod.yml build --no-cache backend frontend 2>&1 | tail -20
docker compose -f docker-compose.prod.yml up -d --force-recreate backend frontend 2>&1

# تنظيف
rm deploy-package.tar.gz
"
```
> ⏱️ يستغرق ~2-5 دقائق

## الخطوة 4: تحديث قاعدة البيانات (فقط عند تغيير schema.prisma)

```bash
ssh root@76.13.254.7 "
cd /root/watheeq-mvp
docker compose -f docker-compose.prod.yml exec -T backend npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
"
```

## الخطوة 5: التحقق

```bash
ssh root@76.13.254.7 "
cd /root/watheeq-mvp
docker compose -f docker-compose.prod.yml ps 2>&1
echo '---LOGS---'
docker compose -f docker-compose.prod.yml logs --tail=15 backend 2>&1
"
```
> تأكد أن جميع الحاويات بحالة **healthy**

## الخطوة 6: تنظيف محلي

// turbo
```bash
rm -f "/Users/hamzabuhlakq/Downloads/succes-mark/projects-2026/wathiq system projec/watheeq-mvp/deploy-package.tar.gz"
```

---

## ملاحظات:
- **لا تنسخ** `node_modules` أو `dist` - يتم بناؤها داخل Docker
- الخطوة 4 (Prisma `db push`) **فقط** عند تغيير `schema.prisma`
- إذا غيرت `package.json` أضفه للخطوة 1
- **لا تستخدم** `-o StrictHostKeyChecking=no` أو أي خيارات SSH إضافية - استخدم الأوامر النظيفة فقط
