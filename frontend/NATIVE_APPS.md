# تطبيقات Native — وسم الثقة

نفس الـ React app يعمل في 4 منصات: متصفح، iOS، Android، سطح المكتب.

## البنية

```
frontend/
├── src/              # React app (يُستخدم في الجميع)
├── dist/             # build (نسخة الإنتاج)
├── ios/              # مشروع Xcode (Capacitor)
├── android/          # مشروع Android Studio (Capacitor)
├── src-tauri/        # مشروع Tauri (سطح المكتب)
└── capacitor.config.ts
```

التطبيقات النيتيف تتصل بـ `https://bewathiq.com/api` — يجب أن يكون السيرفر الإنتاجي يعمل قبل اختبار التطبيقات.

---

## iOS

### المتطلبات
- Mac مع Xcode 26+
- Apple Developer account ($99/سنة) — للنشر على App Store فقط
- CocoaPods (مثبّت)

### الاختبار في Simulator
```bash
cd frontend
npm run ios:run
```

### الفتح في Xcode للتعديل
```bash
npm run ios
```
ثم:
1. اختر Team من Signing & Capabilities
2. اضغط Run

### النشر على App Store
1. في Xcode: Product → Archive
2. Distribute App → App Store Connect → Upload
3. Test in TestFlight أولاً
4. Submit for Review (1-2 أيام)

**Bundle ID:** `sa.bewathiq.app`

---

## Android

### المتطلبات
- Android Studio (مثبّت)
- JDK 17 (Capacitor 8 يدعم Java 17)
- Google Play Console ($25 لمرة واحدة) — للنشر فقط

### الاختبار
```bash
cd frontend
npm run android:run
```

### الفتح في Android Studio
```bash
npm run android
```

### بناء signed APK/AAB
```bash
# في Android Studio:
# Build → Generate Signed Bundle / APK
# اختر AAB لـ Play Store
```

### النشر على Play Store
1. Play Console → Create Release
2. ارفع AAB
3. Submit for Review (ساعات إلى يوم)

**Application ID:** `sa.bewathiq.app`

---

## Desktop (Tauri)

### المتطلبات
- Rust/Cargo (مثبّت)
- على Windows: MSVC + WebView2
- على Linux: webkit2gtk + libgtk-3

### التشغيل في وضع التطوير
```bash
cd frontend
npm run tauri:dev
```
هذا يفتح نافذة تطبيق مع hot reload.

### بناء installer للإنتاج
```bash
npm run tauri:build
```
المخرجات:
- **macOS:** `src-tauri/target/release/bundle/dmg/وسم الثقة_1.0.0_*.dmg`
- **Windows:** `src-tauri/target/release/bundle/msi/وسم الثقة_1.0.0_x64_en-US.msi`
- **Linux:** `src-tauri/target/release/bundle/deb/wasm-altheeqa_1.0.0_amd64.deb`

### التوقيع الرقمي (اختياري)
- **macOS:** يحتاج Apple Developer للتوقيع + notarization
- **Windows:** يحتاج شهادة Code Signing من DigiCert/Sectigo
- **Linux:** غير مطلوب

---

## التحديث بعد تعديل الويب

أي تعديل في `src/` يجب أن ينتقل للتطبيقات:

```bash
npm run cap:sync       # iOS + Android
npm run tauri:build    # Desktop
```

أو تلقائياً عند الـ run:

```bash
npm run ios:run         # يبني + ينسخ + يشغّل
npm run android:run     # نفس الشيء
npm run tauri:dev       # hot reload للتطوير
```

---

## ⚠️ ملاحظات حرجة

1. **VITE_NATIVE_API_URL** — افتراضياً `https://bewathiq.com/api`. لتغيير الـ endpoint للتطبيقات النيتيف، أضف في `.env`:
   ```
   VITE_NATIVE_API_URL=https://your-api.example.com/api
   ```

2. **CORS** — الـ backend يجب أن يسمح بـ origin من:
   - `capacitor://localhost` (iOS)
   - `http://localhost` (Android)
   - `tauri://localhost` (Tauri على بعض الإصدارات)

3. **WebSocket** — إذا الباكند يستخدم Socket.IO، تأكد من تكوين CORS له بشكل منفصل.

4. **Push Notifications** — تتطلب:
   - iOS: APNs certificate من Apple Developer
   - Android: Firebase Cloud Messaging (مجاناً)
   - Capacitor plugin: `npm install @capacitor/push-notifications`

5. **Deep Links** — لربط الإيميلات/الواتساب بالتطبيق، يحتاج تكوين Universal Links (iOS) و App Links (Android).
