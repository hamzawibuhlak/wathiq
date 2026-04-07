import { Reveal } from '../components/Reveal';
import {
    Briefcase, Users, Calendar, CreditCard, Phone, Bot,
    Shield, Zap, Flag, TrendingUp, Star, ChevronLeft,
    FileX, Clock, Search, FileText, CheckCircle, ArrowLeft,
} from 'lucide-react';

/* ── Stats ── */
const stats = [
    { value: '500+', label: 'مكتب محاماة' },
    { value: '10,000+', label: 'قضية مُدارة' },
    { value: '99.9%', label: 'وقت التشغيل' },
    { value: '24/7', label: 'دعم فني' },
];

/* ── Problems / Solutions ── */
const problems = [
    { icon: FileX, text: 'ملفات متناثرة في أماكن مختلفة' },
    { icon: Clock, text: 'ضياع مواعيد الجلسات' },
    { icon: Search, text: 'صعوبة تتبع القضايا' },
    { icon: FileText, text: 'فواتير يدوية وبطيئة' },
];
const solutions = [
    { icon: Briefcase, text: 'كل شيء في مكان واحد' },
    { icon: Calendar, text: 'تنبيهات تلقائية للمواعيد' },
    { icon: TrendingUp, text: 'متابعة لحظية للقضايا' },
    { icon: CreditCard, text: 'فوترة فورية إلكترونية' },
];

/* ── Features ── */
const features = [
    { icon: Briefcase, title: 'إدارة القضايا', desc: 'تتبع جميع القضايا ومراحلها — من التسجيل حتى الحكم النهائي.', color: 'from-blue-500 to-blue-600' },
    { icon: Users, title: 'إدارة العملاء', desc: 'ملفات شاملة لعملائك مع سجل القضايا والمراسلات.', color: 'from-emerald-500 to-emerald-600' },
    { icon: Calendar, title: 'الجلسات والمواعيد', desc: 'تقويم ذكي مع تنبيهات قبل الجلسات وربط تلقائي.', color: 'from-amber-500 to-amber-600' },
    { icon: CreditCard, title: 'الفواتير والمدفوعات', desc: 'إنشاء فواتير احترافية ومتابعة المستحقات تلقائياً.', color: 'from-purple-500 to-purple-600' },
    { icon: Phone, title: 'السنترال الذكي', desc: 'تتبع المكالمات وربطها بالقضايا والعملاء تلقائياً.', color: 'from-rose-500 to-rose-600' },
    { icon: Bot, title: 'الذكاء الاصطناعي', desc: 'بحث قانوني ذكي وتحليل مستندات بقوة AI.', color: 'from-indigo-500 to-indigo-600' },
];

/* ── Why Wathiq ── */
const whyUs = [
    { icon: Shield, title: 'الأمان أولاً', desc: 'تشفير AES-256 ونسخ يومية — بياناتك في أمان كامل.', color: 'text-blue-600 bg-blue-50' },
    { icon: Zap, title: 'سريع وسهل', desc: 'واجهة بسيطة تتعلمها في دقائق — بدون تعقيد.', color: 'text-amber-600 bg-amber-50' },
    { icon: Flag, title: 'سعودي 100%', desc: 'مصمم خصيصاً للنظام القانوني السعودي والمحاكم المحلية.', color: 'text-emerald-600 bg-emerald-50' },
    { icon: TrendingUp, title: 'قابل للنمو', desc: 'ابدأ صغيراً وانمُ بلا حدود — من 1 محامي إلى 100.', color: 'text-purple-600 bg-purple-50' },
];

/* ── Pricing Preview ── */
const plans = [
    { name: 'الأساسية', price: '1,500', features: ['100 قضية', '5 مستخدمين', '10 GB', 'تقارير أساسية'], popular: false },
    { name: 'الاحترافية', price: '1,875', features: ['500 قضية', '15 مستخدم', '50 GB', 'السنترال + واتساب'], popular: true },
    { name: 'المؤسسية', price: '2,500', features: ['غير محدود', 'مستخدمين لا محدود', 'تخزين لا محدود', 'AI + دعم 24/7'], popular: false },
];

/* ── Testimonials ── */
const testimonials = [
    { name: 'أ. سالم العتيبي', role: 'مالك مكتب — الرياض', text: 'وثيق غيّر طريقة عملنا بالكامل. أصبحت إدارة 200+ قضية أسهل بكثير.', stars: 5 },
    { name: 'أ. نورة الشمري', role: 'محامية — جدة', text: 'التنبيهات التلقائية للجلسات وفّرت علينا ساعات من المتابعة اليومية.', stars: 5 },
    { name: 'أ. فهد الدوسري', role: 'مدير مكتب — الدمام', text: 'الفوترة الإلكترونية والتقارير المالية حسّنت تدفقاتنا النقدية 40%.', stars: 5 },
];

export default function Home() {
    return (
        <main className="overflow-hidden">
            {/* ═══ HERO ═══ */}
            <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-b from-primary-light via-white to-white">
                {/* Decorative blobs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                            منصة سعودية 100% — موثوقة من 500+ مكتب
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading leading-tight mb-5">
                            <span className="text-gradient">وثيق</span> — منصة إدارة مكاتب المحاماة الأولى في السعودية
                        </h1>
                        <p className="text-base sm:text-lg text-gray leading-relaxed mb-8 max-w-2xl mx-auto">
                            أتمتة كاملة لمكتبك من القضايا للفواتير في منصة واحدة. وفّر وقتك وركّز على ما يهم — عملاؤك.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="https://bewathiq.com/register" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-l from-primary to-primary-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                                ابدأ تجربتك المجانية <ArrowLeft className="inline w-4 h-4 mr-1" />
                            </a>
                            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary-light transition-all">
                                شاهد الميزات
                            </a>
                        </div>
                    </Reveal>

                    {/* Stats */}
                    <Reveal delay={0.3}>
                        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {stats.map(s => (
                                <div key={s.label} className="text-center p-4 rounded-2xl bg-white shadow-sm border border-gray-100">
                                    <div className="text-2xl sm:text-3xl font-black font-heading text-primary">{s.value}</div>
                                    <div className="text-xs text-gray mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ PROBLEM ↔ SOLUTION ═══ */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">من الفوضى إلى النظام</h2>
                        <p className="text-gray max-w-xl mx-auto">قل وداعاً للمشاكل القديمة وابدأ عصراً جديداً من الإنتاجية</p>
                    </Reveal>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Problems */}
                        <Reveal className="p-6 sm:p-8 rounded-2xl bg-red-50/60 border border-red-100">
                            <h3 className="text-lg font-bold font-heading text-red-700 mb-5">❌ قبل وثيق</h3>
                            <div className="space-y-4">
                                {problems.map(p => (
                                    <div key={p.text} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                                        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <p.icon className="w-4 h-4 text-red-500" />
                                        </div>
                                        <span className="text-sm font-medium text-dark">{p.text}</span>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                        {/* Solutions */}
                        <Reveal delay={0.15} className="p-6 sm:p-8 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                            <h3 className="text-lg font-bold font-heading text-emerald-700 mb-5">✅ مع وثيق</h3>
                            <div className="space-y-4">
                                {solutions.map(s => (
                                    <div key={s.text} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <s.icon className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-sm font-medium text-dark">{s.text}</span>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES ═══ */}
            <section id="features" className="py-20 bg-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">كل ما يحتاجه مكتبك</h2>
                        <p className="text-gray max-w-xl mx-auto">ميزات متكاملة صُممت خصيصاً لمكاتب المحاماة السعودية</p>
                    </Reveal>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 0.08} className="group p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                                    <f.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-base font-bold font-heading mb-2">{f.title}</h3>
                                <p className="text-sm text-gray leading-relaxed">{f.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ WHY US ═══ */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">لماذا وثيق؟</h2>
                        <p className="text-gray max-w-xl mx-auto">أكثر من مجرد نظام — شريك حقيقي لنجاح مكتبك</p>
                    </Reveal>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                        {whyUs.map((w, i) => (
                            <Reveal key={w.title} delay={i * 0.08} className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className={`w-14 h-14 rounded-2xl ${w.color} flex items-center justify-center mx-auto mb-4`}>
                                    <w.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold font-heading mb-2">{w.title}</h3>
                                <p className="text-sm text-gray leading-relaxed">{w.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PRICING PREVIEW ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">باقات تناسب الجميع</h2>
                        <p className="text-gray max-w-xl mx-auto">ابدأ مجاناً لمدة 14 يوماً — بدون بطاقة ائتمانية</p>
                    </Reveal>

                    <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
                        {plans.map((p, i) => (
                            <Reveal key={p.name} delay={i * 0.1} className={`relative p-6 rounded-2xl border-2 transition-all ${p.popular ? 'border-primary bg-white shadow-xl scale-[1.03]' : 'border-gray-100 bg-white hover:shadow-md'}`}>
                                {p.popular && (
                                    <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">الأكثر طلباً ⭐</div>
                                )}
                                <h3 className="text-lg font-bold font-heading mb-1">{p.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-black text-primary">{p.price}</span>
                                    <span className="text-sm text-gray">ر.س/شهر</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {p.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" />{f}</li>
                                    ))}
                                </ul>
                                <a href="/pricing" className={`block text-center py-2.5 rounded-xl text-sm font-bold transition-all ${p.popular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}>
                                    عرض التفاصيل <ChevronLeft className="inline w-4 h-4" />
                                </a>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">ماذا يقول عملاؤنا؟</h2>
                        <p className="text-gray">مكاتب محاماة حقيقية تشارك تجربتها مع وثيق</p>
                    </Reveal>

                    <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
                        {testimonials.map((t, i) => (
                            <Reveal key={t.name} delay={i * 0.1} className="p-6 bg-light rounded-2xl border border-gray-100">
                                <div className="flex gap-0.5 mb-3">
                                    {Array.from({ length: t.stars }).map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-secondary fill-secondary" />
                                    ))}
                                </div>
                                <p className="text-sm text-dark leading-relaxed mb-4">"{t.text}"</p>
                                <div>
                                    <div className="text-sm font-bold">{t.name}</div>
                                    <div className="text-xs text-gray">{t.role}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA ═══ */}
            <section className="py-20 bg-gradient-to-br from-primary via-primary-dark to-dark text-white">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <Reveal>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading mb-4">ابدأ رحلتك الرقمية اليوم</h2>
                        <p className="text-blue-100 text-base sm:text-lg mb-8">14 يوماً تجربة مجانية — بدون بطاقة ائتمانية — إلغاء في أي وقت</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="https://bewathiq.com/register" className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-base">
                                ابدأ تجربتك المجانية
                            </a>
                            <a href="/contact" className="w-full sm:w-auto px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-base">
                                تحدث مع مستشار
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
        </main>
    );
}
