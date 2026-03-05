import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield, FileText, Lock, Eye, ChevronDown, ChevronUp,
  Globe, Database, UserCheck, Cookie, Baby,
  Scale, RefreshCw, Mail, AlertTriangle, CreditCard,
  Users, Gavel, XCircle, HelpCircle, ArrowRight
} from 'lucide-react';

type TabType = 'privacy' | 'terms';

interface SectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function Section({ id, title, icon: Icon, children, isExpanded, onToggle }: SectionProps) {
  return (
    <div className="legal-section" id={id}>
      <button onClick={onToggle} className="legal-section-header">
        <div className="legal-section-title-wrap">
          <Icon className="legal-section-icon" />
          <h2>{title}</h2>
        </div>
        {isExpanded ? <ChevronUp className="legal-chevron" /> : <ChevronDown className="legal-chevron" />}
      </button>
      {isExpanded && <div className="legal-section-body">{children}</div>}
    </div>
  );
}

export function PrivacyPolicyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'privacy'
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['intro']));

  useEffect(() => {
    setSearchParams({ tab: activeTab });
    setExpandedSections(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const toggle = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = activeTab === 'privacy'
      ? ['intro', 'collection', 'usage', 'sharing', 'protection', 'retention', 'rights', 'cookies', 'children', 'compliance', 'updates', 'contact', 'complaints']
      : ['acceptance', 'definitions', 'eligibility', 'account', 'subscriptions', 'service-use', 'ip', 'privacy-security', 'termination', 'disclaimer', 'indemnity', 'law', 'general', 'terms-contact'];
    setExpandedSections(new Set(all));
  };

  const isExp = (id: string) => expandedSections.has(id);

  const currentDate = '4 مارس 2026';

  return (
    <div className="legal-page" dir="rtl">
      <style>{`
        .legal-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
        }
        .legal-hero {
          background: linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%);
          padding: 3.5rem 1.5rem 5rem;
          text-align: center;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .legal-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -30%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
          border-radius: 50%;
        }
        .legal-hero h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 0.75rem; position: relative; }
        .legal-hero p { font-size: 1.1rem; opacity: 0.85; position: relative; }
        .legal-hero .logo-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }
        .legal-hero .logo-link:hover { color: #fff; }
        .legal-hero .logo-link img { width: 28px; height: 28px; border-radius: 6px; }
        .legal-container { max-width: 860px; margin: 0 auto; padding: 0 1rem; }
        .legal-tabs {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 6px;
          display: flex;
          gap: 6px;
          margin-top: -2rem;
          position: relative;
          z-index: 10;
          margin-bottom: 1.5rem;
        }
        .legal-tab {
          flex: 1;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s ease;
          background: transparent;
          color: #64748b;
        }
        .legal-tab:hover { background: #f1f5f9; }
        .legal-tab.active {
          background: linear-gradient(135deg, #4338ca, #6366f1);
          color: #fff;
          box-shadow: 0 2px 12px rgba(99,102,241,0.3);
        }
        .legal-tab svg { width: 18px; height: 18px; }
        .legal-info-bar {
          background: linear-gradient(135deg, #eff6ff, #eef2ff);
          border: 1px solid #c7d2fe;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .legal-info-icon {
          width: 44px;
          height: 44px;
          background: #e0e7ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .legal-info-icon svg { width: 20px; height: 20px; color: #4338ca; }
        .legal-info-text h4 { font-weight: 600; color: #1e1b4b; font-size: 0.95rem; margin: 0; }
        .legal-info-text p { font-size: 0.8rem; color: #4338ca; margin: 0.15rem 0 0; }
        .legal-toolbar { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
        .legal-toolbar button {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 0.5rem 1rem; font-size: 0.8rem; cursor: pointer; color: #475569;
          transition: all 0.2s;
        }
        .legal-toolbar button:hover { background: #f8fafc; border-color: #cbd5e1; }
        .legal-section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          transition: box-shadow 0.2s;
        }
        .legal-section:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .legal-section-header {
          width: 100%;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }
        .legal-section-header:hover { background: #fafbfc; }
        .legal-section-title-wrap { display: flex; align-items: center; gap: 0.75rem; }
        .legal-section-icon { width: 20px; height: 20px; color: #6366f1; }
        .legal-section-header h2 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
        .legal-chevron { width: 18px; height: 18px; color: #94a3b8; }
        .legal-section-body {
          padding: 0 1.25rem 1.25rem;
          font-size: 0.9rem;
          line-height: 1.75;
          color: #475569;
        }
        .legal-section-body p { margin: 0.5rem 0; }
        .legal-section-body strong { color: #1e293b; }
        .legal-section-body h3 { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 1.25rem 0 0.5rem; }
        .legal-section-body ul { padding-right: 1.25rem; margin: 0.5rem 0; }
        .legal-section-body ul li { margin: 0.3rem 0; }
        .legal-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin: 1rem 0; }
        .legal-card {
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid transparent;
        }
        .legal-card h4 { font-size: 0.85rem; font-weight: 700; margin: 0 0 0.5rem; }
        .legal-card ul { padding-right: 1rem; margin: 0; font-size: 0.8rem; }
        .legal-card ul li { margin: 0.15rem 0; }
        .legal-card.indigo { background: #eef2ff; border-color: #c7d2fe; }
        .legal-card.indigo h4 { color: #312e81; }
        .legal-card.green { background: #f0fdf4; border-color: #bbf7d0; }
        .legal-card.green h4 { color: #14532d; }
        .legal-card.red { background: #fef2f2; border-color: #fecaca; }
        .legal-card.red h4 { color: #7f1d1d; }
        .legal-card.purple { background: #faf5ff; border-color: #e9d5ff; }
        .legal-card.purple h4 { color: #581c87; }
        .legal-card.amber { background: #fffbeb; border-color: #fde68a; }
        .legal-card.amber h4 { color: #78350f; }
        .legal-highlight {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
        }
        .legal-highlight p { margin: 0; font-size: 0.85rem; color: #92400e; }
        .legal-highlight strong { color: #78350f; }
        .legal-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin: 0.75rem 0;
        }
        .legal-box p, .legal-box li { font-size: 0.85rem; }
        .legal-footer-notice {
          background: linear-gradient(135deg, #eef2ff, #faf5ff);
          border: 2px solid #c7d2fe;
          border-radius: 16px;
          padding: 1.5rem;
          margin: 2rem 0;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .legal-footer-icon {
          width: 48px; height: 48px; background: #4338ca; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .legal-footer-icon svg { width: 24px; height: 24px; color: #fff; }
        .legal-footer-content h3 { font-size: 1rem; font-weight: 700; color: #1e1b4b; margin: 0 0 0.5rem; }
        .legal-footer-content p { font-size: 0.875rem; color: #4338ca; margin: 0 0 0.75rem; }
        .legal-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .legal-badge {
          padding: 0.3rem 0.75rem;
          background: #fff;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #4338ca;
          border: 1px solid #e0e7ff;
        }
        .legal-back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 0 3rem;
        }
        .legal-back-link a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.2s;
        }
        .legal-back-link a:hover { color: #4338ca; }
        @media (max-width: 640px) {
          .legal-hero h1 { font-size: 1.5rem; }
          .legal-hero { padding: 2.5rem 1rem 4rem; }
          .legal-card-grid { grid-template-columns: 1fr; }
          .legal-footer-notice { flex-direction: column; }
        }
        @media print {
          .legal-hero { background: #312e81 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 2rem 1rem; }
          .legal-tabs, .legal-toolbar { display: none !important; }
          .legal-section { break-inside: avoid; page-break-inside: avoid; border: 1px solid #ccc; }
          .legal-section-body { display: block !important; }
          .legal-page { background: #fff; }
          .legal-back-link { display: none; }
        }
      `}</style>

      {/* Hero */}
      <div className="legal-hero">
        <a href="https://bewathiq.com" className="logo-link">
          <img src="/logo.png" alt="وثيق" />
          <span>وثيق — إدارة مكاتب المحاماة</span>
        </a>
        <h1>الشروط والخصوصية</h1>
        <p>نلتزم بحماية خصوصيتك وشفافية التعامل معك</p>
      </div>

      <div className="legal-container">
        {/* Tabs */}
        <div className="legal-tabs">
          <button
            className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield /> سياسة الخصوصية
          </button>
          <button
            className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText /> شروط الاستخدام
          </button>
        </div>

        {/* Info Bar */}
        <div className="legal-info-bar">
          <div className="legal-info-icon"><Eye /></div>
          <div className="legal-info-text">
            <h4>آخر تحديث: {currentDate}</h4>
            <p>النسخة 1.0 — ساري المفعول من تاريخ النشر</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="legal-toolbar">
          <button onClick={expandAll}>عرض الكل ↓</button>
        </div>

        {/* ============ PRIVACY POLICY ============ */}
        {activeTab === 'privacy' && (
          <>
            <Section id="intro" title="1. المقدمة" icon={FileText} isExpanded={isExp('intro')} onToggle={() => toggle('intro')}>
              <p>مرحباً بك في <strong>وثيق</strong>، منصة إدارة مكاتب المحاماة الرائدة في المملكة العربية السعودية. نحن نلتزم بحماية خصوصيتك وأمان بياناتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.</p>
              <div className="legal-box">
                <p><strong>الجهة المشغّلة:</strong></p>
                <ul>
                  <li>البريد الإلكتروني: privacy@bewathiq.com</li>
                  <li>الموقع: bewathiq.com</li>
                </ul>
              </div>
              <p><strong>باستخدامك لمنصة وثيق، فإنك توافق على جمع ومعالجة معلوماتك وفقاً لهذه السياسة.</strong></p>
            </Section>

            <Section id="collection" title="2. المعلومات التي نجمعها" icon={Database} isExpanded={isExp('collection')} onToggle={() => toggle('collection')}>
              <h3>2.1 معلومات التسجيل</h3>
              <ul>
                <li><strong>معلومات المكتب:</strong> اسم المكتب، رقم الترخيص، العنوان</li>
                <li><strong>معلومات المسؤول:</strong> الاسم الكامل، البريد الإلكتروني، رقم الجوال</li>
                <li><strong>معلومات الحساب:</strong> اسم المستخدم، كلمة المرور المشفّرة</li>
              </ul>
              <h3>2.2 بيانات الاستخدام</h3>
              <ul>
                <li>سجلات الدخول والخروج</li>
                <li>عنوان IP والموقع التقريبي</li>
                <li>نوع المتصفح والجهاز</li>
                <li>الصفحات المزارة والميزات المستخدمة</li>
                <li>مدة الجلسات</li>
              </ul>
              <h3>2.3 المعلومات المُدخلة في النظام</h3>
              <ul>
                <li><strong>بيانات العملاء:</strong> الأسماء، الهويات، العناوين، أرقام الاتصال</li>
                <li><strong>بيانات القضايا:</strong> تفاصيل القضايا، المستندات، الجلسات</li>
                <li><strong>المعاملات المالية:</strong> الفواتير، المدفوعات، المصروفات</li>
                <li><strong>المستندات:</strong> الملفات المرفوعة من PDF، Word، الصور</li>
              </ul>
              <h3>2.4 معلومات الدفع</h3>
              <p>تفاصيل البطاقة الائتمانية <strong>لا نحتفظ بها</strong> — تُعالج عبر بوابات دفع آمنة.</p>
            </Section>

            <Section id="usage" title="3. كيفية استخدام المعلومات" icon={Eye} isExpanded={isExp('usage')} onToggle={() => toggle('usage')}>
              <div className="legal-card-grid">
                <div className="legal-card indigo"><h4>✦ تقديم الخدمة</h4><ul><li>إنشاء وإدارة حسابك</li><li>معالجة العمليات</li><li>تخزين واسترجاع بياناتك</li><li>إرسال إشعارات الخدمة</li></ul></div>
                <div className="legal-card green"><h4>✦ تحسين الخدمة</h4><ul><li>تحليل استخدام الميزات</li><li>تطوير ميزات جديدة</li><li>إصلاح الأخطاء التقنية</li><li>تحسين الأداء</li></ul></div>
                <div className="legal-card red"><h4>✦ الأمان</h4><ul><li>حماية من الاختراق</li><li>منع الاحتيال</li><li>الامتثال القانوني</li></ul></div>
                <div className="legal-card purple"><h4>✦ الاتصالات</h4><ul><li>تحديثات الخدمة</li><li>إشعارات الأمان</li><li>الرد على الاستفسارات</li></ul></div>
              </div>
              <div className="legal-highlight"><p><strong>⚠️ ملاحظة:</strong> لا نستخدم بياناتك لتدريب نماذج الذكاء الاصطناعي الخارجية دون موافقتك الصريحة.</p></div>
            </Section>

            <Section id="sharing" title="4. مشاركة المعلومات" icon={Globe} isExpanded={isExp('sharing')} onToggle={() => toggle('sharing')}>
              <div className="legal-highlight"><p><strong>نحن لا نبيع معلوماتك الشخصية أبداً.</strong></p></div>
              <h3>مزودو الخدمات</h3>
              <ul>
                <li><strong>خدمات السحابة:</strong> استضافة البيانات — منطقة الشرق الأوسط</li>
                <li><strong>بوابات الدفع:</strong> معالجة المدفوعات — تفاصيل الدفع فقط</li>
                <li><strong>خدمات البريد:</strong> إشعارات — عنوان البريد والاسم فقط</li>
                <li><strong>الذكاء الاصطناعي:</strong> الاستفسارات فقط دون بيانات حساسة</li>
              </ul>
              <h3>الالتزامات القانونية</h3>
              <p>قد نكشف عن معلوماتك إذا طُلب بموجب قانون أو أمر قضائي أو لحماية سلامة المستخدمين.</p>
              <h3>نقل البيانات الدولي</h3>
              <p>نضمن أن جميع عمليات نقل البيانات تتم بموجب اتفاقيات حماية البيانات القياسية مع التشفير الكامل.</p>
            </Section>

            <Section id="protection" title="5. حماية المعلومات" icon={Lock} isExpanded={isExp('protection')} onToggle={() => toggle('protection')}>
              <div className="legal-card-grid">
                <div className="legal-card indigo"><h4>🔐 التشفير</h4><ul><li>SSL/TLS لجميع الاتصالات</li><li>AES-256 للبيانات المخزنة</li><li>bcrypt لكلمات المرور</li></ul></div>
                <div className="legal-card green"><h4>🛡️ أمان الشبكة</h4><ul><li>جدران حماية</li><li>حماية DDoS</li><li>رصد الاختراقات 24/7</li></ul></div>
                <div className="legal-card purple"><h4>🔒 أمان التطبيق</h4><ul><li>مصادقة ثنائية (2FA)</li><li>جلسات محددة الوقت</li><li>حماية SQL/XSS</li></ul></div>
                <div className="legal-card amber"><h4>💾 النسخ الاحتياطي</h4><ul><li>نسخ يومية مشفّرة</li><li>تخزين متعدد المواقع</li><li>استعادة خلال 24 ساعة</li></ul></div>
              </div>
              <h3>الإبلاغ عن خرق</h3>
              <p>في حالة حدوث خرق أمني: سنبلغك خلال <strong>72 ساعة</strong> ونتخذ إجراءات فورية لإيقاف الخرق.</p>
            </Section>

            <Section id="retention" title="6. الاحتفاظ بالبيانات" icon={Database} isExpanded={isExp('retention')} onToggle={() => toggle('retention')}>
              <ul>
                <li><strong>البيانات النشطة:</strong> طوال فترة اشتراكك</li>
                <li><strong>بعد الإلغاء:</strong> 30 يوماً فترة سماح ثم حذف دائم</li>
                <li><strong>البيانات المالية:</strong> 10 سنوات (متطلب قانوني)</li>
                <li><strong>السجلات الأمنية:</strong> سنة واحدة</li>
              </ul>
              <p>عند الحذف: حذف من جميع الخوادم والنسخ الاحتياطية بشكل دائم وغير قابل للاستعادة.</p>
            </Section>

            <Section id="rights" title="7. حقوقك" icon={UserCheck} isExpanded={isExp('rights')} onToggle={() => toggle('rights')}>
              <div className="legal-card-grid">
                <div className="legal-card indigo"><h4>📋 الوصول</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>طلب نسخة من جميع بياناتك (JSON/CSV) خلال 7 أيام عمل</p></div>
                <div className="legal-card green"><h4>✏️ التصحيح</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>تحديث وتصحيح معلوماتك الشخصية</p></div>
                <div className="legal-card red"><h4>🗑️ الحذف</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>طلب حذف حسابك بالكامل خلال 30 يوماً</p></div>
                <div className="legal-card purple"><h4>📦 النقل</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>نقل بياناتك لمزود آخر بتنسيق قابل للقراءة</p></div>
              </div>
              <div className="legal-box">
                <p><strong>لممارسة حقوقك:</strong> راسلنا على privacy@bewathiq.com أو من إعدادات الحساب → الخصوصية</p>
              </div>
            </Section>

            <Section id="cookies" title="8. ملفات تعريف الارتباط (Cookies)" icon={Cookie} isExpanded={isExp('cookies')} onToggle={() => toggle('cookies')}>
              <ul>
                <li><strong>ضرورية (لا يمكن تعطيلها):</strong> تسجيل الدخول، الأمان، تفضيلات اللغة</li>
                <li><strong>وظيفية (يمكن تعطيلها):</strong> تذكر اختياراتك، تحسين الأداء</li>
                <li><strong>تحليلية (يمكن تعطيلها):</strong> Google Analytics، تحليل الاستخدام</li>
              </ul>
              <p>يمكنك تعطيل أو حذف Cookies من إعدادات المتصفح.</p>
            </Section>

            <Section id="children" title="9. خصوصية الأطفال" icon={Baby} isExpanded={isExp('children')} onToggle={() => toggle('children')}>
              <p><strong>وثيق ليس موجهاً للأطفال.</strong> لا نجمع معلومات من أشخاص دون 18 عاماً عمداً. إذا اكتشفنا جمع بيانات طفل، نحذفها فوراً.</p>
            </Section>

            <Section id="compliance" title="10. الامتثال للقوانين" icon={Scale} isExpanded={isExp('compliance')} onToggle={() => toggle('compliance')}>
              <h3>القوانين السعودية</h3>
              <ul>
                <li>نظام حماية البيانات الشخصية السعودي</li>
                <li>نظام مكافحة الجرائم المعلوماتية</li>
                <li>أنظمة هيئة الاتصالات وتقنية المعلومات</li>
              </ul>
              <h3>المعايير الدولية</h3>
              <ul>
                <li>اللائحة العامة لحماية البيانات (GDPR)</li>
                <li>ISO 27001 (قيد التطبيق)</li>
              </ul>
            </Section>

            <Section id="updates" title="11. التحديثات على السياسة" icon={RefreshCw} isExpanded={isExp('updates')} onToggle={() => toggle('updates')}>
              <p>قد نحدّث هذه السياسة من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر إشعار بالبريد الإلكتروني أو في التطبيق. استمرارك في استخدام الخدمة بعد التحديث يعني موافقتك.</p>
            </Section>

            <Section id="contact" title="12. التواصل معنا" icon={Mail} isExpanded={isExp('contact')} onToggle={() => toggle('contact')}>
              <div className="legal-card-grid">
                <div className="legal-card indigo">
                  <h4>📧 استفسارات الخصوصية</h4>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>privacy@bewathiq.com</p>
                </div>
                <div className="legal-card green">
                  <h4>🕐 ساعات العمل</h4>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>الأحد - الخميس: 9ص - 5م (توقيت السعودية)</p>
                </div>
              </div>
            </Section>

            <Section id="complaints" title="13. الشكاوى" icon={AlertTriangle} isExpanded={isExp('complaints')} onToggle={() => toggle('complaints')}>
              <p>إذا كنت تعتقد أننا انتهكنا حقوقك:</p>
              <ol>
                <li>راسلنا أولاً على privacy@bewathiq.com</li>
                <li>إذا لم تكن راضياً: تقدّم بشكوى إلى <strong>الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA)</strong></li>
              </ol>
            </Section>
          </>
        )}

        {/* ============ TERMS OF SERVICE ============ */}
        {activeTab === 'terms' && (
          <>
            <Section id="acceptance" title="1. قبول الشروط" icon={FileText} isExpanded={isExp('acceptance')} onToggle={() => toggle('acceptance')}>
              <p>باستخدامك لمنصة وثيق، فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق، يرجى عدم استخدام الخدمة.</p>
            </Section>

            <Section id="definitions" title="2. تعريفات" icon={HelpCircle} isExpanded={isExp('definitions')} onToggle={() => toggle('definitions')}>
              <ul>
                <li><strong>"المنصة" أو "الخدمة":</strong> نظام وثيق لإدارة مكاتب المحاماة</li>
                <li><strong>"نحن" أو "وثيق":</strong> الشركة المشغّلة</li>
                <li><strong>"أنت" أو "المستخدم":</strong> الشخص أو الكيان المستخدم</li>
                <li><strong>"المكتب":</strong> مكتب المحاماة المشترك</li>
                <li><strong>"المحتوى":</strong> جميع البيانات المُدخلة في النظام</li>
              </ul>
            </Section>

            <Section id="eligibility" title="3. الأهلية" icon={UserCheck} isExpanded={isExp('eligibility')} onToggle={() => toggle('eligibility')}>
              <ul>
                <li>يجب أن تكون فوق 18 عاماً</li>
                <li>يجب أن تكون محامياً مرخصاً أو موظفاً في مكتب محاماة</li>
                <li>يجب أن يكون المكتب مرخصاً في المملكة العربية السعودية</li>
              </ul>
            </Section>

            <Section id="account" title="4. إنشاء الحساب" icon={Users} isExpanded={isExp('account')} onToggle={() => toggle('account')}>
              <h3>4.1 التسجيل</h3>
              <ul>
                <li>يجب تقديم معلومات دقيقة وكاملة</li>
                <li>يجب التحقق من البريد الإلكتروني</li>
                <li>كل مكتب له حساب واحد فقط</li>
              </ul>
              <h3>4.2 أمان الحساب</h3>
              <ul>
                <li>أنت مسؤول عن الحفاظ على سرية كلمة المرور</li>
                <li>يجب إخطارنا فوراً بأي استخدام غير مصرح</li>
                <li>نوصي بتفعيل المصادقة الثنائية (2FA)</li>
              </ul>
              <h3>4.3 حسابات الموظفين</h3>
              <p>المالك يمنح الصلاحيات للموظفين. المكتب مسؤول عن جميع الأنشطة.</p>
            </Section>

            <Section id="subscriptions" title="5. الاشتراكات والدفع" icon={CreditCard} isExpanded={isExp('subscriptions')} onToggle={() => toggle('subscriptions')}>
              <h3>5.1 الفترة التجريبية</h3>
              <p>14 يوماً مجاناً لجميع الميزات — لا يلزم بطاقة ائتمانية — الإلغاء في أي وقت.</p>
              <h3>5.2 الدفع</h3>
              <ul>
                <li>الدفع الشهري أو السنوي (خصم 20%)</li>
                <li>التجديد التلقائي (يمكن إلغاؤه)</li>
                <li>الأسعار لا تشمل ضريبة القيمة المضافة (15%)</li>
              </ul>
              <h3>5.3 الاسترداد</h3>
              <ul>
                <li>استرداد كامل خلال 30 يوماً من الاشتراك الأول</li>
                <li>لا استرداد بعد 30 يوماً أو للتجديدات</li>
              </ul>
            </Section>

            <Section id="service-use" title="6. استخدام الخدمة" icon={Gavel} isExpanded={isExp('service-use')} onToggle={() => toggle('service-use')}>
              <h3>6.1 الاستخدام المصرح</h3>
              <p>إدارة القضايا، تخزين المستندات، إدارة الجلسات، إصدار الفواتير، البحث القانوني بالذكاء الاصطناعي.</p>
              <h3>6.2 الاستخدام الممنوع</h3>
              <div className="legal-highlight">
                <ul style={{ margin: 0 }}>
                  <li>مشاركة الحساب مع مكاتب أخرى</li>
                  <li>استخدام الخدمة لأنشطة غير قانونية</li>
                  <li>محاولة اختراق أو عكس هندسة النظام</li>
                  <li>تحميل فيروسات أو برمجيات ضارة</li>
                  <li>كشط البيانات (Scraping)</li>
                  <li>انتحال شخصية آخرين</li>
                </ul>
              </div>
            </Section>

            <Section id="ip" title="7. الملكية الفكرية" icon={Shield} isExpanded={isExp('ip')} onToggle={() => toggle('ip')}>
              <ul>
                <li><strong>ملكية المنصة:</strong> جميع الحقوق محفوظة لوثيق — الكود والتصميم والشعار</li>
                <li><strong>ملكية المحتوى:</strong> أنت تملك جميع بياناتك — نمنحنا ترخيصاً فقط لتقديم الخدمة</li>
                <li><strong>لا نملك محتواك ولن نستخدمه لأغراض أخرى</strong></li>
              </ul>
            </Section>

            <Section id="privacy-security" title="8. الخصوصية والأمان" icon={Lock} isExpanded={isExp('privacy-security')} onToggle={() => toggle('privacy-security')}>
              <p>راجع <button onClick={() => setActiveTab('privacy')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>سياسة الخصوصية</button> الكاملة. الخلاصة: نحمي بياناتك بأعلى المعايير، لا نبيعها، تشفير كامل، نسخ احتياطية يومية.</p>
            </Section>

            <Section id="termination" title="9. إنهاء الخدمة" icon={XCircle} isExpanded={isExp('termination')} onToggle={() => toggle('termination')}>
              <h3>9.1 الإلغاء من جانبك</h3>
              <p>يمكنك الإلغاء في أي وقت. فترة سماح 30 يوماً لاستعادة البيانات ثم حذف دائم.</p>
              <h3>9.2 الإيقاف من جانبنا</h3>
              <p>يحق لنا الإيقاف في حال: انتهاك الشروط، عدم الدفع، استخدام احتيالي، أو بأمر قضائي.</p>
            </Section>

            <Section id="disclaimer" title="10. إخلاء المسؤولية" icon={AlertTriangle} isExpanded={isExp('disclaimer')} onToggle={() => toggle('disclaimer')}>
              <p>الخدمة مُقدمة "كما هي" دون ضمانات.  لا نضمن عدم الانقطاع أو خلو النظام من الأخطاء.</p>
              <p><strong>الحد الأقصى لمسؤوليتنا:</strong> قيمة اشتراكك لـ 3 أشهر.</p>
              <p>لا ينطبق إخلاء المسؤولية على الإهمال الجسيم أو الاحتيال من جانبنا.</p>
            </Section>

            <Section id="indemnity" title="11. التعويض" icon={Scale} isExpanded={isExp('indemnity')} onToggle={() => toggle('indemnity')}>
              <p>أنت توافق على تعويضنا عن أي مطالبات ناتجة عن استخدامك للخدمة أو انتهاكك لهذه الشروط أو حقوق الآخرين.</p>
            </Section>

            <Section id="law" title="12. القانون الواجب التطبيق" icon={Gavel} isExpanded={isExp('law')} onToggle={() => toggle('law')}>
              <ul>
                <li>تخضع هذه الشروط للقانون السعودي</li>
                <li>الاختصاص القضائي: محاكم المملكة العربية السعودية</li>
                <li>يمكن اللجوء للتحكيم أولاً</li>
              </ul>
            </Section>

            <Section id="general" title="13. أحكام عامة" icon={FileText} isExpanded={isExp('general')} onToggle={() => toggle('general')}>
              <ul>
                <li><strong>التعديلات:</strong> يمكننا تعديل الشروط بإشعار 30 يوماً — استمرارك = موافقة</li>
                <li><strong>الانفصال:</strong> إذا كان بند غير قانوني يُحذف فقط والباقي يبقى سارياً</li>
                <li><strong>الشروط الكاملة:</strong> هذه الشروط + سياسة الخصوصية = الاتفاق الكامل</li>
              </ul>
            </Section>

            <Section id="terms-contact" title="14. التواصل" icon={Mail} isExpanded={isExp('terms-contact')} onToggle={() => toggle('terms-contact')}>
              <div className="legal-card-grid">
                <div className="legal-card indigo"><h4>⚖️ الشروط القانونية</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>legal@bewathiq.com</p></div>
                <div className="legal-card green"><h4>🎧 دعم العملاء</h4><p style={{ fontSize: '0.8rem', margin: 0 }}>support@bewathiq.com</p></div>
              </div>
            </Section>
          </>
        )}

        {/* Footer Notice */}
        <div className="legal-footer-notice">
          <div className="legal-footer-icon"><Shield /></div>
          <div className="legal-footer-content">
            <h3>التزامنا بخصوصيتك</h3>
            <p>حماية بياناتك ليست مجرد التزام قانوني، بل هي جزء أساسي من قيمنا. نحن نستثمر باستمرار في تحسين أمان وخصوصية منصتنا.</p>
            <div className="legal-badges">
              <span className="legal-badge">✓ تشفير AES-256</span>
              <span className="legal-badge">✓ SSL/TLS</span>
              <span className="legal-badge">✓ نسخ احتياطية يومية</span>
              <span className="legal-badge">✓ مطابق للقوانين السعودية</span>
              <span className="legal-badge">✓ GDPR</span>
            </div>
          </div>
        </div>

        {/* Acceptance Notice */}
        <div className="legal-box" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>بقبولك لهذه الشروط وسياسة الخصوصية، فإنك تؤكد:</p>
          <p style={{ fontSize: '0.875rem' }}>✓ قرأت وفهمت جميع الشروط &nbsp;|&nbsp; ✓ توافق على الالتزام بها &nbsp;|&nbsp; ✓ أنت مخول قانوناً بالموافقة</p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>النسخة 1.0 — {currentDate}</p>
        </div>

        <div className="legal-back-link">
          <a href="https://bewathiq.com">
            <ArrowRight style={{ width: 16, height: 16 }} />
            العودة إلى وثيق
          </a>
        </div>
      </div>
    </div>
  );
}
