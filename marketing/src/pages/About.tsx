import { Reveal } from '../components/Reveal';
import { Target, Shield, Zap, Handshake, Flag, ArrowLeft, Linkedin } from 'lucide-react';

const values = [
    { icon: Target, title: 'التركيز على العميل', desc: 'كل قرار نتخذه يبدأ بسؤال: كيف نخدم المحامي بشكل أفضل؟', color: 'text-blue-600 bg-blue-50' },
    { icon: Shield, title: 'الأمان والخصوصية', desc: 'بيانات عملائك أمانة. نحميها بأعلى معايير التشفير العالمية.', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Zap, title: 'الابتكار المستمر', desc: 'نطوّر ميزات جديدة كل أسبوع ونستمع لملاحظات عملائنا.', color: 'text-amber-600 bg-amber-50' },
    { icon: Handshake, title: 'الشفافية', desc: 'أسعار واضحة وشروط مفهومة — بدون مفاجآت أو رسوم مخفية.', color: 'text-purple-600 bg-purple-50' },
    { icon: Flag, title: 'محلي أولاً', desc: 'نفهم النظام القانوني السعودي ونصمم حلولنا لتناسبه.', color: 'text-rose-600 bg-rose-50' },
];

const timeline = [
    { year: '2023', title: 'البداية', desc: 'انطلقت فكرة وثيق من حاجة حقيقية لمكاتب محاماة سعودية.' },
    { year: '2024', title: 'النمو', desc: 'وصلنا إلى 200 مكتب وأضفنا الذكاء الاصطناعي والسنترال.' },
    { year: '2025', title: 'التوسع', desc: 'أصبحنا الخيار الأول لمكاتب المحاماة في المملكة.' },
    { year: '2026', title: 'اليوم', desc: '500+ مكتب يثقون بنا لإدارة عملهم القانوني يومياً.' },
];

const team = [
    { name: 'محمد الأحمد', role: 'المؤسس والرئيس التنفيذي' },
    { name: 'سارة القحطاني', role: 'مديرة المنتج' },
    { name: 'عبدالله الشهري', role: 'كبير المهندسين' },
    { name: 'فاطمة الحربي', role: 'مصممة UX' },
    { name: 'خالد المالكي', role: 'مهندس Full-Stack' },
    { name: 'ريم العنزي', role: 'مديرة نجاح العملاء' },
];

const partners = ['Amazon Web Services', 'Microsoft Azure', 'Anthropic', 'CITC', 'وزارة التجارة'];

export default function About() {
    return (
        <main>
            {/* ═══ HERO ═══ */}
            <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 bg-gradient-to-b from-primary-light to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Reveal>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading mb-5">نساعد المحامين على التركيز على <span className="text-gradient">ما يهم</span></h1>
                        <p className="text-base sm:text-lg text-gray max-w-2xl mx-auto mb-10">بدأنا وثيق لأننا آمنّا أن المحامي يجب أن يقضي وقته في القانون — لا في الإدارة.</p>
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                            <div className="text-center"><div className="text-2xl font-black text-primary">2023</div><div className="text-xs text-gray">سنة التأسيس</div></div>
                            <div className="text-center"><div className="text-2xl font-black text-primary">15+</div><div className="text-xs text-gray">عضو فريق</div></div>
                            <div className="text-center"><div className="text-2xl font-black text-primary">500+</div><div className="text-xs text-gray">عميل</div></div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ TIMELINE ═══ */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">قصة وثيق</h2>
                        <p className="text-gray">رحلة من الفكرة إلى المنصة الأولى في السعودية</p>
                    </Reveal>
                    <div className="relative">
                        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />
                        <div className="space-y-8">
                            {timeline.map((t, i) => (
                                <Reveal key={t.year} delay={i * 0.1} className="flex gap-5 items-start">
                                    <div className="relative z-10 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold font-heading text-sm shadow-md flex-shrink-0">{t.year}</div>
                                    <div className="pb-6">
                                        <h3 className="font-bold font-heading text-lg mb-1">{t.title}</h3>
                                        <p className="text-sm text-gray leading-relaxed">{t.desc}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ VALUES ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">قيمنا</h2>
                        <p className="text-gray">المبادئ التي توجّه كل ما نفعله</p>
                    </Reveal>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-5xl mx-auto">
                        {values.map((v, i) => (
                            <Reveal key={v.title} delay={i * 0.07} className="text-center p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mx-auto mb-3`}><v.icon className="w-6 h-6" /></div>
                                <h3 className="text-sm font-bold font-heading mb-1">{v.title}</h3>
                                <p className="text-xs text-gray leading-relaxed">{v.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TEAM ═══ */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-3">فريقنا</h2>
                        <p className="text-gray">خبراء تقنية وقانون يعملون لتطوير تجربتك</p>
                    </Reveal>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 max-w-5xl mx-auto">
                        {team.map((m, i) => (
                            <Reveal key={m.name} delay={i * 0.06} className="text-center p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{m.name.charAt(0)}</span>
                                </div>
                                <h4 className="text-sm font-bold">{m.name}</h4>
                                <p className="text-xs text-gray mt-0.5">{m.role}</p>
                                <Linkedin className="w-3.5 h-3.5 text-gray mx-auto mt-2 hover:text-primary cursor-pointer transition-colors" />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PARTNERS ═══ */}
            <section className="py-16 bg-light">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <Reveal>
                        <p className="text-sm text-gray mb-6 font-medium">شركاؤنا في التقنية</p>
                        <div className="flex flex-wrap items-center justify-center gap-8">
                            {partners.map(p => (
                                <span key={p} className="text-sm font-bold text-gray/40 hover:text-gray transition-colors cursor-default">{p}</span>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="py-20 bg-gradient-to-br from-primary via-primary-dark to-dark text-white">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <Reveal>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading mb-4">انضم إلى 500+ مكتب يثقون بوثيق</h2>
                        <p className="text-blue-100 mb-8">ابدأ تجربتك المجانية اليوم — 14 يوماً بجميع الميزات</p>
                        <a href="https://bewathiq.com/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                            ابدأ تجربتك المجانية <ArrowLeft className="w-4 h-4" />
                        </a>
                    </Reveal>
                </div>
            </section>
        </main>
    );
}
