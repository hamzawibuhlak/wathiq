import { useState } from 'react';
import { Reveal } from '../components/Reveal';
import { CheckCircle, X, ChevronDown, ChevronUp, ArrowLeft, HardDrive, Users, Headphones, GraduationCap, Settings } from 'lucide-react';

const plans = [
    {
        name: 'الأساسية', price: { monthly: 1500, yearly: 14400 }, popular: false,
        features: ['100 قضية', '5 مستخدمين', '10 GB تخزين', 'إدارة القضايا', 'إدارة العملاء', 'الجلسات', 'الفواتير', 'التقارير الأساسية', 'دعم فني'],
        color: 'border-gray-200',
    },
    {
        name: 'الاحترافية', price: { monthly: 1875, yearly: 22500 }, popular: true,
        features: ['500 قضية', '15 مستخدم', '50 GB تخزين', 'كل مميزات الأساسية', 'السنترال الذكي', 'واتساب متكامل', 'النماذج الذكية', 'API Access', 'دعم أولوية'],
        color: 'border-primary',
    },
    {
        name: 'المؤسسية', price: { monthly: 2500, yearly: 24000 }, popular: false,
        features: ['غير محدود — قضايا', 'غير محدود — مستخدمين', 'غير محدود — تخزين', 'كل مميزات الاحترافية', 'البحث القانوني AI', 'تحليل مستندات AI', 'مدير حساب مخصص', 'تدريب مخصص', 'SLA 99.9% + دعم 24/7'],
        color: 'border-secondary',
    },
];

const comparison = [
    { feature: 'القضايا', basic: '100', pro: '500', enterprise: 'غير محدود' },
    { feature: 'المستخدمين', basic: '5', pro: '15', enterprise: 'غير محدود' },
    { feature: 'التخزين', basic: '10 GB', pro: '50 GB', enterprise: 'غير محدود' },
    { feature: 'إدارة القضايا', basic: true, pro: true, enterprise: true },
    { feature: 'إدارة العملاء', basic: true, pro: true, enterprise: true },
    { feature: 'الجلسات والمواعيد', basic: true, pro: true, enterprise: true },
    { feature: 'الفواتير', basic: true, pro: true, enterprise: true },
    { feature: 'التقارير', basic: 'أساسية', pro: 'متقدمة', enterprise: 'شاملة + AI' },
    { feature: 'السنترال الذكي', basic: false, pro: true, enterprise: true },
    { feature: 'واتساب', basic: false, pro: true, enterprise: true },
    { feature: 'النماذج الذكية', basic: false, pro: true, enterprise: true },
    { feature: 'API Access', basic: false, pro: true, enterprise: true },
    { feature: 'بحث AI', basic: false, pro: false, enterprise: true },
    { feature: 'تحليل مستندات AI', basic: false, pro: false, enterprise: true },
    { feature: 'مدير حساب', basic: false, pro: false, enterprise: true },
    { feature: 'SLA', basic: '99%', pro: '99.5%', enterprise: '99.9%' },
    { feature: 'الدعم', basic: 'بريد', pro: 'أولوية', enterprise: '24/7' },
];

const addons = [
    { icon: HardDrive, title: 'تخزين إضافي', desc: '+50 GB', price: '99 ر.س/شهر' },
    { icon: Users, title: 'مستخدمين إضافيين', desc: '+5 مستخدمين', price: '199 ر.س/شهر' },
    { icon: Headphones, title: 'دعم متميز', desc: '24/7 مع أولوية', price: '599 ر.س/شهر' },
    { icon: GraduationCap, title: 'تدريب مخصص', desc: 'جلسة تدريبية', price: '499 ر.س/جلسة' },
    { icon: Settings, title: 'استشارة تقنية', desc: 'ساعة واحدة', price: '299 ر.س/ساعة' },
];

const faqs = [
    { q: 'هل التجربة المجانية حقاً مجانية؟', a: 'نعم! 14 يوماً بجميع الميزات بدون أي رسوم أو بطاقة ائتمانية.' },
    { q: 'هل أحتاج بطاقة ائتمانية للتجربة؟', a: 'لا، يمكنك البدء فوراً بدون أي معلومات دفع.' },
    { q: 'ماذا يحدث بعد انتهاء التجربة؟', a: 'ستختار باقة مناسبة. إذا لم تختر، ستنتقل تلقائياً للباقة الأساسية.' },
    { q: 'هل يمكنني الترقية أو التخفيض؟', a: 'نعم! يمكنك تغيير باقتك في أي وقت. التغيير يتم فوراً.' },
    { q: 'ما طرق الدفع المتاحة؟', a: 'بطاقات ائتمان (Visa, MC, mada)، تحويل بنكي، Apple Pay.' },
    { q: 'هل هناك عقد طويل الأمد؟', a: 'لا! الاشتراك شهري ويمكنك الإلغاء في أي وقت.' },
    { q: 'هل هناك رسوم إعداد؟', a: 'لا رسوم إعداد. ابدأ فوراً بعد التسجيل.' },
    { q: 'كيف يُحسب عدد المستخدمين؟', a: 'كل حساب مسجّل يُحسب كمستخدم واحد.' },
    { q: 'ماذا لو تجاوزت حد القضايا؟', a: 'سننبهك مسبقاً ويمكنك ترقية الباقة بسهولة.' },
    { q: 'هل هناك خصم للاشتراك السنوي؟', a: 'نعم! وفّر حتى 20% عند الاشتراك السنوي.' },
];

export default function Pricing() {
    const [yearly, setYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const fmt = (n: number) => n.toLocaleString('ar-SA');

    return (
        <main>
            {/* ═══ HERO ═══ */}
            <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 bg-gradient-to-b from-primary-light to-white text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <Reveal>
                        <h1 className="text-3xl sm:text-4xl font-black font-heading mb-4">باقات مرنة <span className="text-gradient">لكل الأحجام</span></h1>
                        <p className="text-gray text-base sm:text-lg mb-8">ابدأ مجاناً، وترقّى حسب نموك</p>

                        {/* Toggle */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                            <span className={`text-sm font-medium ${!yearly ? 'text-primary' : 'text-gray'}`}>شهري</span>
                            <button onClick={() => setYearly(!yearly)} className={`w-12 h-6 rounded-full p-0.5 transition-colors ${yearly ? 'bg-primary' : 'bg-gray-300'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${yearly ? '-translate-x-6' : ''}`} />
                            </button>
                            <span className={`text-sm font-medium ${yearly ? 'text-primary' : 'text-gray'}`}>سنوي <span className="text-xs text-success font-bold">وفر 20%</span></span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-gray">
                            <span>✓ 14 يوم مجاني</span>
                            <span>✓ بدون بطاقة</span>
                            <span>✓ إلغاء بأي وقت</span>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ PRICING CARDS ═══ */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-5">
                    {plans.map((p, i) => (
                        <Reveal key={p.name} delay={i * 0.1} className={`relative p-6 rounded-2xl border-2 ${p.color} transition-all ${p.popular ? 'shadow-xl scale-[1.03] bg-white' : 'bg-white hover:shadow-md'}`}>
                            {p.popular && <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">الأكثر طلباً ⭐</div>}
                            <h3 className="text-lg font-bold font-heading mb-1">{p.name}</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-3xl font-black text-primary">{fmt(yearly ? Math.round(p.price.yearly / 12) : p.price.monthly)}</span>
                                <span className="text-sm text-gray">ر.س/شهر</span>
                            </div>
                            {yearly && <p className="text-xs text-success font-medium mb-3">{fmt(p.price.yearly)} ر.س/سنة</p>}
                            {!yearly && <div className="h-4" />}
                            <ul className="space-y-2.5 mb-6">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-success flex-shrink-0" />{f}</li>
                                ))}
                            </ul>
                            {p.name === 'المؤسسية' ? (
                                <a href="/contact" className="block text-center py-3 rounded-xl text-sm font-bold bg-gradient-to-l from-secondary to-amber-500 text-white hover:shadow-md transition-all">تواصل مع المبيعات</a>
                            ) : (
                                <a href="https://bewathiq.com/register" className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${p.popular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}>
                                    ابدأ تجربتك المجانية
                                </a>
                            )}
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ═══ COMPARISON TABLE ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-5xl mx-auto px-4">
                    <Reveal className="text-center mb-10">
                        <h2 className="text-2xl font-black font-heading mb-2">مقارنة شاملة</h2>
                    </Reveal>
                    <Reveal>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
                            <table className="w-full min-w-[600px] text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-right p-4 font-bold">الميزة</th>
                                        <th className="p-4 font-bold text-center">الأساسية</th>
                                        <th className="p-4 font-bold text-center text-primary">الاحترافية ⭐</th>
                                        <th className="p-4 font-bold text-center">المؤسسية 💎</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparison.map((r, i) => (
                                        <tr key={r.feature} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                                            <td className="p-3.5 font-medium">{r.feature}</td>
                                            {(['basic', 'pro', 'enterprise'] as const).map(k => {
                                                const v = r[k];
                                                return (
                                                    <td key={k} className="p-3.5 text-center">
                                                        {v === true ? <CheckCircle className="w-4 h-4 text-success mx-auto" /> : v === false ? <X className="w-4 h-4 text-gray-300 mx-auto" /> : <span className="text-xs">{v}</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ ADD-ONS ═══ */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <Reveal className="text-center mb-10">
                        <h2 className="text-2xl font-black font-heading mb-2">إضافات اختيارية</h2>
                        <p className="text-sm text-gray">خصص باقتك حسب احتياجك</p>
                    </Reveal>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {addons.map((a, i) => (
                            <Reveal key={a.title} delay={i * 0.06} className="p-4 rounded-xl border border-gray-100 text-center hover:shadow-md transition-all">
                                <a.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                                <h4 className="text-sm font-bold mb-0.5">{a.title}</h4>
                                <p className="text-xs text-gray mb-2">{a.desc}</p>
                                <span className="text-xs font-bold text-primary">{a.price}</span>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-2xl mx-auto px-4">
                    <Reveal className="text-center mb-10">
                        <h2 className="text-2xl font-black font-heading mb-2">أسئلة شائعة عن الأسعار</h2>
                    </Reveal>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <Reveal key={i} delay={i * 0.03}>
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-right text-sm font-bold hover:bg-gray-50 transition-colors">
                                        {f.q}
                                        {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray flex-shrink-0" />}
                                    </button>
                                    {openFaq === i && <div className="px-4 pb-4 text-sm text-gray leading-relaxed">{f.a}</div>}
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
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-4">جرّب وثيق مجاناً لمدة 14 يوماً</h2>
                        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm text-blue-100">
                            <span>✓ بدون بطاقة</span><span>✓ جميع الميزات</span><span>✓ إلغاء بأي وقت</span><span>✓ دعم كامل</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="https://bewathiq.com/register" className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                                ابدأ تجربتك المجانية <ArrowLeft className="inline w-4 h-4 mr-1" />
                            </a>
                            <a href="/contact" className="w-full sm:w-auto px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                                تحدث مع مستشار
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
        </main>
    );
}
