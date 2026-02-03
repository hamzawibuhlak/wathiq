# 📡 Watheeq API Documentation

> RESTful API للنظام - الإصدار 1.0

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication

جميع الـ endpoints (ما عدا `/auth/login` و `/auth/register`) تتطلب Bearer Token.

```http
Authorization: Bearer <token>
```

---

## 📌 Endpoints

### Auth

| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/auth/register` | تسجيل مكتب جديد |
| POST | `/auth/login` | تسجيل الدخول |
| GET | `/auth/me` | المستخدم الحالي |
| POST | `/auth/refresh` | تجديد التوكن |

#### POST /auth/register

```json
// Request
{
  "name": "مكتب المحامي",
  "email": "admin@lawfirm.sa",
  "password": "SecurePass123",
  "firmName": "مكتب المحامي للمحاماة"
}

// Response 201
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "...", "role": "OWNER" }
}
```

#### POST /auth/login

```json
// Request
{
  "email": "admin@lawfirm.sa",
  "password": "SecurePass123"
}

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "name": "...", "role": "OWNER" }
}
```

---

### Cases (القضايا)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/cases` | جلب القضايا (مع فلاتر) |
| POST | `/cases` | إنشاء قضية |
| GET | `/cases/:id` | تفاصيل قضية |
| PATCH | `/cases/:id` | تحديث قضية |
| DELETE | `/cases/:id` | حذف قضية |

#### GET /cases

**Query Parameters:**

| Parameter | Type | الوصف |
|-----------|------|-------|
| search | string | بحث بالعنوان أو الرقم |
| status | enum | ACTIVE, PENDING, CLOSED, ARCHIVED |
| type | enum | CIVIL, CRIMINAL, COMMERCIAL, LABOR, FAMILY, ADMINISTRATIVE |
| clientId | uuid | فلتر بالعميل |
| assigneeId | uuid | فلتر بالمحامي |
| page | number | رقم الصفحة (default: 1) |
| limit | number | عدد النتائج (default: 10) |

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "title": "قضية تجارية",
      "caseNumber": "CASE-2026-001",
      "status": "ACTIVE",
      "type": "COMMERCIAL",
      "client": { "id": "uuid", "name": "شركة ABC" },
      "assignee": { "id": "uuid", "name": "المحامي أحمد" },
      "createdAt": "2026-01-28T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### POST /cases

```json
// Request
{
  "title": "قضية تجارية جديدة",
  "description": "وصف القضية...",
  "type": "COMMERCIAL",
  "status": "ACTIVE",
  "clientId": "uuid",
  "assigneeId": "uuid",
  "courtName": "محكمة الرياض التجارية"
}

// Response 201
{
  "id": "uuid",
  "caseNumber": "CASE-2026-002",
  ...
}
```

---

### Clients (العملاء)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/clients` | جلب العملاء |
| POST | `/clients` | إنشاء عميل |
| GET | `/clients/:id` | تفاصيل عميل |
| PATCH | `/clients/:id` | تحديث عميل |
| DELETE | `/clients/:id` | حذف عميل |

#### POST /clients

```json
// Request
{
  "name": "شركة ABC",
  "type": "COMPANY",
  "email": "info@abc.sa",
  "phone": "+966501234567",
  "idNumber": "1234567890",
  "address": "الرياض"
}

// Response 201
{
  "id": "uuid",
  "name": "شركة ABC",
  ...
}
```

---

### Hearings (الجلسات)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/hearings` | جلب الجلسات |
| GET | `/hearings/calendar` | عرض التقويم |
| POST | `/hearings` | إنشاء جلسة |
| GET | `/hearings/:id` | تفاصيل جلسة |
| PATCH | `/hearings/:id` | تحديث جلسة |
| DELETE | `/hearings/:id` | حذف جلسة |

#### GET /hearings/calendar

**Query Parameters:**

| Parameter | Type | الوصف |
|-----------|------|-------|
| startDate | ISO date | بداية الفترة |
| endDate | ISO date | نهاية الفترة |

```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "title": "جلسة استماع",
      "date": "2026-02-15T10:00:00Z",
      "courtName": "محكمة الرياض",
      "status": "SCHEDULED",
      "case": { "id": "uuid", "title": "قضية تجارية" }
    }
  ]
}
```

---

### Documents (المستندات)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/documents` | جلب المستندات |
| POST | `/documents/upload` | رفع مستند |
| GET | `/documents/:id` | تفاصيل مستند |
| GET | `/documents/:id/download` | تحميل مستند |
| DELETE | `/documents/:id` | حذف مستند |

#### POST /documents/upload

```http
Content-Type: multipart/form-data
```

| Field | Type | الوصف |
|-------|------|-------|
| file | File | الملف (max 10MB) |
| title | string | عنوان المستند |
| type | enum | CONTRACT, EVIDENCE, COURT_DOCUMENT, OTHER |
| caseId | uuid | معرف القضية (اختياري) |
| clientId | uuid | معرف العميل (اختياري) |

---

### Invoices (الفواتير)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/invoices` | جلب الفواتير |
| POST | `/invoices` | إنشاء فاتورة |
| GET | `/invoices/:id` | تفاصيل فاتورة |
| PATCH | `/invoices/:id` | تحديث فاتورة |
| PATCH | `/invoices/:id/status` | تغيير حالة الدفع |
| DELETE | `/invoices/:id` | حذف فاتورة |
| GET | `/invoices/stats` | إحصائيات الفواتير |

#### POST /invoices

```json
// Request
{
  "clientId": "uuid",
  "caseId": "uuid",
  "items": [
    { "description": "استشارة قانونية", "amount": 500 },
    { "description": "تمثيل أمام المحكمة", "amount": 2000 }
  ],
  "dueDate": "2026-02-28",
  "notes": "ملاحظات..."
}

// Response 201
{
  "id": "uuid",
  "invoiceNumber": "INV-2026-001",
  "total": 2500,
  "status": "PENDING",
  ...
}
```

---

### Users (المستخدمين)

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/users` | جلب المستخدمين |
| POST | `/users` | إنشاء مستخدم |
| GET | `/users/:id` | تفاصيل مستخدم |
| PATCH | `/users/:id` | تحديث مستخدم |
| DELETE | `/users/:id` | حذف مستخدم |
| PATCH | `/users/:id/toggle-active` | تفعيل/تعطيل |

---

## 🔢 HTTP Status Codes

| Code | الوصف |
|------|-------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | خطأ في البيانات |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 500 | خطأ في الخادم |

---

## ⚠️ Error Response Format

```json
{
  "statusCode": 400,
  "message": "البريد الإلكتروني مستخدم مسبقاً",
  "error": "Bad Request"
}
```

---

## 📊 Pagination Format

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```
