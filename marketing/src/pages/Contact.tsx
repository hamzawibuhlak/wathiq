import { useState } from 'react';
import { Reveal } from '../components/Reveal';
import { Mail, Phone, MessageCircle, MapPin, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';

const contactMethods = [
    { icon: Mail, title: 'البريد الإلكتروني', value: 'info@bewathiq.com', sub: 'نرد خلال 24 ساعة', href: 'mailto:info@bewathiq.com', btn: 'أرسل إيميل', color: 'from-blue-500 to-blue-600' },
    { icon: Phone, title: 'الهاتف', value: '+966 50 000 0000', sub: 'الأحد-الخميس 9ص - 5م', href: 'tel:+966500000000', btn: 'اتصل الآن', color: 'from-emerald-500 to-emerald-600' },
    { icon: MessageCircle, title: 'واتساب', value: '+966 50 000 0000', sub: 'متاح 24/7', href: 'https://wa.me/966500000000', btn: 'ابدأ محادثة', color: 'from-green-500 to-green-600' },
];

const inquiryTypes = ['استفسار عام', 'طلب عرض تجريبي', 'دعم فني', 'شراكات', 'اقتراحات', 'أخرى'];

const faqs = [
    { q: 'كم يستغرق الرد على الاستفسارات؟', a: 'نرد على جميع الاستفسارات خلال 24 ساعة عمل كحد أقصى. عادةً نرد خلال ساعات.' },
    { q: 'هل الدعم الفني مجاني؟', a: 'نعم! الدعم الفني مجاني ومشمول في جميع الباقات.' },
    { q: 'ما ساعات عمل الدعم الفني؟', a: 'الأحد إلى الخميس من 9 صباحاً إلى 5 مساءً بتوقيت السعودية. واتساب متاح 24/7.' },
    { q: 'كيف أحجز عرض توضيحي؟', a: 'اختر "طلب عرض تجريبي" من النموذج وسنتواصل معك خلال يوم عمل.' },
    { q: 'هل واتساب متاح للدعم؟', a: 'نعم! واتساب متاح على مدار الساعة للاستفسارات السريعة والدعم.' },
];

export default function Contact() {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', office: '', type: '', message: '', agree: false });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = 'الاسم مطلوب';
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) e.email = 'بريد إلكتروني صالح مطلوب';
        if (!formData.type) e.type = 'اختر نوع الاستفسار';
        if (!formData.message.trim()) e.message = 'الرسالة مطلوبة';
        if (!formData.agree) e.agree = 'يجب الموافقة على سياسة الخصوصية';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (validate()) setSubmitted(true);
    };

    const set = (k: string, v: string | boolean) => setFormData(p => ({ ...p, [k]: v }));

    return (
        <main>
            {/* ═══ HERO ═══ */}
            <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 bg-gradient-to-b from-primary-light to-white text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <Reveal>
                        <h1 className="text-3xl sm:text-4xl font-black font-heading mb-4">نحن هنا <span className="text-gradient">لمساعدتك</span></h1>
                        <p className="text-gray text-base sm:text-lg">تواصل معنا بأي طريقة تناسبك — فريقنا جاهز لخدمتك</p>
                    </Reveal>
                </div>
            </section>

            {/* ═══ CONTACT METHODS ═══ */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-5">
                    {contactMethods.map((m, i) => (
                        <Reveal key={m.title} delay={i * 0.1} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all text-center">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center mx-auto mb-4 shadow-md`}>
                                <m.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-bold font-heading mb-1">{m.title}</h3>
                            <p className="text-sm font-medium text-primary mb-0.5" dir="ltr">{m.value}</p>
                            <p className="text-xs text-gray mb-4">{m.sub}</p>
                            <a href={m.href} target="_blank" rel="noopener noreferrer" className="inline-block px-5 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{m.btn}</a>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ═══ FORM ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-2xl mx-auto px-4">
                    <Reveal className="text-center mb-10">
                        <h2 className="text-2xl font-black font-heading mb-2">أرسل لنا رسالة</h2>
                        <p className="text-gray text-sm">سنرد خلال 24 ساعة عمل</p>
                    </Reveal>

                    {submitted ? (
                        <Reveal className="text-center p-10 bg-white rounded-2xl border border-emerald-200">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold font-heading text-emerald-700 mb-2">شكراً لتواصلك!</h3>
                            <p className="text-gray text-sm">تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.</p>
                        </Reveal>
                    ) : (
                        <Reveal>
                            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">الاسم الكامل *</label>
                                        <input value={formData.name} onChange={e => set('name', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`} />
                                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني *</label>
                                        <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`} />
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">رقم الجوال</label>
                                        <input value={formData.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">اسم المكتب</label>
                                        <input value={formData.office} onChange={e => set('office', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">نوع الاستفسار *</label>
                                    <select value={formData.type} onChange={e => set('type', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${errors.type ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}>
                                        <option value="">اختر...</option>
                                        {inquiryTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">الرسالة *</label>
                                    <textarea rows={4} value={formData.message} onChange={e => set('message', e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`} />
                                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                                </div>
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.agree} onChange={e => set('agree', e.target.checked)} className="mt-1 rounded" />
                                    <span className="text-xs text-gray">أوافق على <a href="https://bewathiq.com/privacy" target="_blank" className="text-primary underline">سياسة الخصوصية</a> *</span>
                                </label>
                                {errors.agree && <p className="text-xs text-red-500">{errors.agree}</p>}
                                <button type="submit" className="w-full py-3 bg-gradient-to-l from-primary to-primary-dark text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">إرسال الرسالة</button>
                            </form>
                        </Reveal>
                    )}
                </div>
            </section>

            {/* ═══ LOCATION ═══ */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-2 gap-8 items-center">
                    <Reveal>
                        <h2 className="text-xl font-black font-heading mb-4">موقعنا</h2>
                        <div className="space-y-3 text-sm text-gray">
                            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> الرياض، المملكة العربية السعودية</p>
                            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> الأحد - الخميس: 9 صباحاً - 5 مساءً</p>
                            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> info@bewathiq.com</p>
                        </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                        <div className="h-64 bg-gray-100 rounded-2xl overflow-hidden">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d463876.05381!2d46.52!3d24.71!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f03890d489399%3A0xba974d1c98e79fd5!2z2KfZhNix2YrYp9i2!5e0!3m2!1sar!2ssa!4v1" width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="موقعنا" />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className="py-20 bg-light">
                <div className="max-w-2xl mx-auto px-4">
                    <Reveal className="text-center mb-10">
                        <h2 className="text-2xl font-black font-heading mb-2">أسئلة شائعة</h2>
                    </Reveal>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <Reveal key={i} delay={i * 0.05}>
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
        </main>
    );
}
