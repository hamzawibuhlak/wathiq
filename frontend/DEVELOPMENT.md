# 🛠️ Watheeq Frontend - Development Guide

> دليل التطوير للـ Frontend

---

## 📁 هيكل المشروع

```
src/
├── api/                 # API calls (axios)
│   ├── cases.api.ts
│   ├── clients.api.ts
│   └── ...
│
├── components/
│   ├── ui/              # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/          # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── cases/           # Case-specific components
│   ├── clients/         # Client-specific components
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── use-cases.ts
│   ├── use-clients.ts
│   └── ...
│
├── pages/               # Route pages
│   ├── auth/
│   ├── cases/
│   ├── clients/
│   └── ...
│
├── stores/              # Zustand stores
│   ├── auth.store.ts
│   └── theme.store.ts
│
├── styles/              # Global styles
│   └── globals.css
│
├── types/               # TypeScript types
│   └── index.ts
│
├── lib/                 # Utilities
│   └── utils.ts
│
├── App.tsx              # Main app with routes
└── main.tsx             # Entry point
```

---

## 🧩 إنشاء Component جديد

### 1. Component Structure

```tsx
// src/components/cases/CaseCard.tsx

// 1. Imports
import { useState, useCallback } from 'react';
import { Case } from '@/types';
import { Button, Card } from '@/components/ui';

// 2. Types
interface CaseCardProps {
  case: Case;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// 3. Component
export function CaseCard({ case, onEdit, onDelete }: CaseCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // Handlers
  const handleEdit = useCallback(() => {
    onEdit?.(case.id);
  }, [case.id, onEdit]);

  // Render
  return (
    <Card className="p-4">
      <h3>{case.title}</h3>
      <Button onClick={handleEdit}>تعديل</Button>
    </Card>
  );
}
```

### 2. Hook Pattern

```tsx
// src/hooks/use-cases.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '@/api';
import toast from 'react-hot-toast';

export function useCases(filters?: CaseFilters) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: () => casesApi.getAll(filters),
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: casesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('تم إنشاء القضية بنجاح');
    },
    onError: () => {
      toast.error('فشل في إنشاء القضية');
    },
  });
}
```

### 3. API Pattern

```tsx
// src/api/cases.api.ts

import axios from './axios';
import { Case, CreateCaseDto, PaginatedResponse } from '@/types';

export const casesApi = {
  getAll: (filters?: CaseFilters) => 
    axios.get<PaginatedResponse<Case>>('/cases', { params: filters }),
  
  getById: (id: string) => 
    axios.get<Case>(`/cases/${id}`),
  
  create: (data: CreateCaseDto) => 
    axios.post<Case>('/cases', data),
  
  update: (id: string, data: Partial<CreateCaseDto>) => 
    axios.patch<Case>(`/cases/${id}`, data),
  
  delete: (id: string) => 
    axios.delete(`/cases/${id}`),
};
```

---

## 📝 إنشاء Page جديدة

### 1. Page Structure

```tsx
// src/pages/cases/CasesListPage.tsx

export default function CasesListPage() {
  // 1. Hooks
  const [filters, setFilters] = useState<CaseFilters>({});
  const { data, isLoading, error } = useCases(filters);
  
  // 2. Loading state
  if (isLoading) {
    return <SkeletonGrid count={6} />;
  }
  
  // 3. Error state
  if (error) {
    return <EmptyState type="error" />;
  }
  
  // 4. Empty state
  if (!data?.data?.length) {
    return <EmptyState type="cases" />;
  }
  
  // 5. Render
  return (
    <div className="p-6 animate-in-up">
      {/* Filters */}
      {/* List */}
    </div>
  );
}
```

### 2. إضافة Route

```tsx
// src/App.tsx

const CasesListPage = lazy(() => import('@/pages/cases/CasesListPage'));

// في Routes:
<Route path="/cases" element={<CasesListPage />} />
```

---

## 🎨 Styling Guidelines

### Tailwind Classes

```tsx
// ✅ صحيح - استخدام Tailwind
<div className="flex items-center gap-4 p-6 rounded-xl bg-card">

// ❌ خطأ - لا تستخدم inline styles
<div style={{ display: 'flex', padding: '24px' }}>
```

### RTL Support

```tsx
// استخدم logical properties
<div className="ms-4 me-2 ps-4 pe-2">  // ✅ margin-start, margin-end
<div className="ml-4 mr-2 pl-4 pr-2">  // ⚠️ يعمل لكن الأفضل logical

// للأيقونات
<ChevronLeft className="flip-rtl" />
```

### Dark Mode

```tsx
// CSS variables تتغير تلقائياً
<div className="bg-background text-foreground">

// أو صريحاً
<div className="bg-white dark:bg-gray-900">
```

---

## 🧪 Testing

```bash
# تشغيل الاختبارات
npm run test

# مع coverage
npm run test:coverage

# watch mode
npm run test:watch
```

---

## 📦 الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | تشغيل التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run preview` | معاينة البناء |
| `npm run lint` | فحص الكود |
| `npm run lint:fix` | إصلاح تلقائي |

---

## 🔧 إضافة Shadcn Component

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

---

## 📌 Best Practices

1. **Components صغيرة ومركزة** - كل component يفعل شيء واحد
2. **Hooks للـ logic** - افصل الـ logic عن الـ UI
3. **Types لكل شيء** - لا `any`
4. **Loading/Error/Empty states** - لكل صفحة
5. **Toast للـ feedback** - نجاح وفشل
6. **RTL-first** - فكر بالـ RTL من البداية
