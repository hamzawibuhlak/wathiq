# Contributing to Watheeq

شكراً لاهتمامك بالمساهمة في مشروع وثيق! 🎉

## 📋 جدول المحتويات

- [قواعد السلوك](#قواعد-السلوك)
- [كيفية المساهمة](#كيفية-المساهمة)
- [إعداد بيئة التطوير](#إعداد-بيئة-التطوير)
- [معايير الكود](#معايير-الكود)
- [Pull Requests](#pull-requests)

---

## قواعد السلوك

- احترم جميع المساهمين
- كن بنّاءً في التعليقات والمراجعات
- ركز على الحلول بدلاً من الانتقاد

---

## كيفية المساهمة

### الإبلاغ عن الأخطاء

1. تأكد أن الخطأ غير مُبلغ عنه مسبقاً
2. افتح Issue جديد مع:
   - وصف واضح للمشكلة
   - خطوات إعادة إنتاج الخطأ
   - السلوك المتوقع vs الفعلي
   - Screenshots إن أمكن

### اقتراح ميزات جديدة

1. افتح Issue مع label `enhancement`
2. اشرح الميزة والفائدة منها
3. انتظر الموافقة قبل البدء

### المساهمة بالكود

1. Fork المشروع
2. أنشئ branch: `git checkout -b feature/amazing-feature`
3. اكتب الكود مع الاختبارات
4. Commit: `git commit -m 'feat: add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. افتح Pull Request

---

## إعداد بيئة التطوير

```bash
# Clone
git clone https://github.com/your-username/watheeq-mvp.git
cd watheeq-mvp

# Setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install
cd backend && npm install
cd ../frontend && npm install

# Run
./scripts/dev.sh
```

---

## معايير الكود

### TypeScript

- استخدم TypeScript بشكل صارم
- لا `any` إلا للضرورة
- أضف types لجميع الـ props والـ returns

### التسمية

| النوع | المعيار | مثال |
|-------|---------|------|
| Components | PascalCase | `CaseCard.tsx` |
| Hooks | camelCase + use | `useCases.ts` |
| Variables | camelCase | `caseList` |
| Constants | SCREAMING_SNAKE | `API_URL` |
| Files | kebab-case أو PascalCase | `use-cases.ts`, `CaseCard.tsx` |

### Commit Messages

نستخدم [Conventional Commits](https://conventionalcommits.org/):

```
feat: add client search
fix: resolve login issue
docs: update README
style: format code
refactor: simplify case logic
test: add unit tests
chore: update deps
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

---

## Pull Requests

### قبل الفتح

- [ ] الكود يمر lint بدون أخطاء
- [ ] الكود يبني بنجاح
- [ ] الاختبارات تمر (إن وجدت)
- [ ] التوثيق محدث

### العنوان

```
feat(cases): add advanced filtering
fix(auth): resolve token expiry issue
```

### الوصف

```markdown
## التغييرات
- إضافة فلتر حسب التاريخ
- تحسين أداء البحث

## Screenshots
[إن كان تغيير UI]

## Checklist
- [x] Lint passes
- [x] Build passes
- [ ] Tests added
```

---

## 📞 الدعم

- 📧 dev@watheeq.sa
- 💬 Discord: [رابط]

---

**شكراً لمساهمتك! 🙏**
