# 🎨 Watheeq Frontend

> React SPA للنظام

---

## 🚀 التشغيل

### المتطلبات

- Node.js 20+
- npm أو yarn

### التثبيت

```bash
# تثبيت الحزم
npm install

# إعداد المتغيرات البيئية
cp .env.example .env

# تشغيل التطوير
npm run dev
```

### الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل التطوير |
| `npm run build` | بناء للإنتاج |
| `npm run preview` | معاينة البناء |
| `npm run lint` | فحص الكود |

---

## 🐳 Docker

```bash
# بناء الصورة
docker build -t watheeq-frontend .

# تشغيل
docker run -p 80:80 watheeq-frontend
```

---

## 📁 الهيكل

```
src/
├── api/            # استدعاءات API
├── components/
│   ├── ui/         # مكونات Shadcn
│   ├── layout/     # Layout components
│   ├── cases/      # مكونات القضايا
│   ├── clients/    # مكونات العملاء
│   ├── hearings/   # مكونات الجلسات
│   ├── documents/  # مكونات المستندات
│   └── invoices/   # مكونات الفواتير
├── hooks/          # React Hooks
├── pages/          # صفحات التطبيق
├── stores/         # Zustand stores
├── styles/         # CSS & Tailwind
├── types/          # TypeScript types
└── lib/            # Utilities
```

---

## 📄 الصفحات

| المسار | الصفحة |
|--------|--------|
| `/` | لوحة التحكم |
| `/cases` | قائمة القضايا |
| `/cases/:id` | تفاصيل قضية |
| `/clients` | قائمة العملاء |
| `/hearings` | التقويم والجلسات |
| `/documents` | إدارة المستندات |
| `/invoices` | الفواتير |
| `/settings` | الإعدادات |

---

## 🎨 التقنيات

- **React 18** - مكتبة UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Server state
- **Zustand** - Client state
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Hook Form** - Forms
- **Zod** - Validation

---

## 📦 الحزم الرئيسية

```json
{
  "react": "^18.2.0",
  "@tanstack/react-query": "^5.x",
  "react-router-dom": "^6.x",
  "zustand": "^4.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "lucide-react": "^0.x",
  "date-fns": "^3.x"
}
```

---

## 🔐 المتغيرات البيئية

| المتغير | الوصف | مثال |
|---------|-------|------|
| VITE_API_URL | رابط API | http://localhost:3000/api |
| VITE_APP_NAME | اسم التطبيق | Watheeq |

---

## 🌙 الوضع الداكن

النظام يدعم الوضع الداكن تلقائياً من خلال:
- `ThemeProvider` في `src/providers`
- CSS variables في `globals.css`
- `dark:` classes في Tailwind
