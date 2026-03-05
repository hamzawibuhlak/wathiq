import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';

type TabType = 'privacy' | 'terms';

interface SectionData {
    id: string;
    title: string;
    icon: string;
    content: string[];
}

const privacySections: SectionData[] = [
    {
        id: 'intro', icon: 'file-text', title: '1. المقدمة',
        content: [
            'مرحباً بك في وثيق، منصة إدارة مكاتب المحاماة الرائدة في المملكة العربية السعودية.',
            'نلتزم بحماية خصوصيتك وأمان بياناتك.',
            'البريد الإلكتروني: privacy@bewathiq.com',
            'باستخدامك لمنصة وثيق، فإنك توافق على جمع ومعالجة معلوماتك وفقاً لهذه السياسة.',
        ],
    },
    {
        id: 'collection', icon: 'database', title: '2. المعلومات التي نجمعها',
        content: [
            '• معلومات التسجيل: اسم المكتب، رقم الترخيص، العنوان',
            '• معلومات المسؤول: الاسم، البريد الإلكتروني، رقم الجوال',
            '• بيانات الاستخدام: سجلات الدخول، عنوان IP، نوع المتصفح',
            '• المعلومات المُدخلة: بيانات العملاء، القضايا، المستندات، الفواتير',
            '• معلومات الدفع: تُعالج عبر بوابات آمنة ولا نحتفظ بها',
        ],
    },
    {
        id: 'usage', icon: 'eye', title: '3. كيفية استخدام المعلومات',
        content: [
            '• تقديم الخدمة: إدارة حسابك، معالجة العمليات، إرسال إشعارات',
            '• تحسين الخدمة: تحليل الاستخدام، تطوير ميزات، إصلاح أخطاء',
            '• الأمان: حماية من اختراق، منع احتيال، امتثال قانوني',
            '• الاتصالات: تحديثات الخدمة، إشعارات أمنية',
            '⚠️ لا نستخدم بياناتك لتدريب AI خارجي بدون موافقتك.',
        ],
    },
    {
        id: 'sharing', icon: 'globe', title: '4. مشاركة المعلومات',
        content: [
            '❌ نحن لا نبيع معلوماتك أبداً.',
            '• مزودو خدمات السحابة: استضافة — منطقة الشرق الأوسط',
            '• بوابات الدفع: معالجة مدفوعات فقط',
            '• التزامات قانونية: بأمر قضائي أو لحماية المستخدمين',
            '• النقل الدولي: تشفير + اتفاقيات حماية بيانات',
        ],
    },
    {
        id: 'protection', icon: 'shield', title: '5. حماية المعلومات',
        content: [
            '• تشفير SSL/TLS لجميع الاتصالات',
            '• تشفير AES-256 للبيانات المخزنة',
            '• Bcrypt لكلمات المرور',
            '• نسخ احتياطية يومية مشفّرة',
            '• إبلاغك خلال 72 ساعة في حالة خرق أمني',
        ],
    },
    {
        id: 'retention', icon: 'clock', title: '6. الاحتفاظ بالبيانات',
        content: [
            '• البيانات النشطة: طوال فترة اشتراكك',
            '• بعد الإلغاء: 30 يوماً سماح ثم حذف دائم',
            '• البيانات المالية: 10 سنوات (متطلب قانوني)',
            '• السجلات الأمنية: سنة واحدة',
        ],
    },
    {
        id: 'rights', icon: 'user-check', title: '7. حقوقك',
        content: [
            '• الوصول: طلب نسخة من بياناتك',
            '• التصحيح: تحديث معلوماتك الشخصية',
            '• الحذف: طلب حذف حسابك (30 يوم)',
            '• النقل: نقل بياناتك لمزود آخر',
            'للممارسة: privacy@bewathiq.com',
        ],
    },
    {
        id: 'cookies', icon: 'disc', title: '8. ملفات تعريف الارتباط',
        content: [
            '• ضرورية (لا تُعطّل): تسجيل دخول، أمان، لغة',
            '• وظيفية (تُعطّل): تذكر اختيارات، أداء',
            '• تحليلية (تُعطّل): Google Analytics',
        ],
    },
    {
        id: 'children', icon: 'users', title: '9. خصوصية الأطفال',
        content: ['وثيق ليس للأطفال (<18). لا نجمع بيانات أطفال عمداً. اكتشاف = حذف فوري.'],
    },
    {
        id: 'compliance', icon: 'check-circle', title: '10. الامتثال للقوانين',
        content: [
            '• نظام حماية البيانات الشخصية السعودي',
            '• نظام مكافحة الجرائم المعلوماتية',
            '• GDPR | ISO 27001 (قيد التطبيق)',
        ],
    },
    {
        id: 'updates', icon: 'refresh-cw', title: '11. التحديثات',
        content: ['قد نحدّث السياسة. سنُعلمك بالتغييرات الجوهرية عبر بريد إلكتروني أو إشعار.'],
    },
    {
        id: 'contact', icon: 'mail', title: '12. التواصل',
        content: [
            '• الخصوصية: privacy@bewathiq.com',
            '• ساعات العمل: الأحد-الخميس 9ص - 5م',
        ],
    },
    {
        id: 'complaints', icon: 'alert-triangle', title: '13. الشكاوى',
        content: [
            '1. راسلنا أولاً: privacy@bewathiq.com',
            '2. إذا غير راضٍ → SDAIA أو الجهة المختصة',
        ],
    },
];

const termsSections: SectionData[] = [
    {
        id: 'acceptance', icon: 'file-text', title: '1. قبول الشروط',
        content: ['باستخدامك لمنصة وثيق، فإنك توافق على الالتزام بهذه الشروط. إذا لم توافق، يرجى عدم استخدام الخدمة.'],
    },
    {
        id: 'definitions', icon: 'help-circle', title: '2. تعريفات',
        content: [
            '• "المنصة": نظام وثيق لإدارة مكاتب المحاماة',
            '• "نحن": الشركة المشغّلة لوثيق',
            '• "أنت": المستخدم أو المكتب المشترك',
            '• "المحتوى": جميع البيانات المُدخلة في النظام',
        ],
    },
    {
        id: 'eligibility', icon: 'user-check', title: '3. الأهلية',
        content: [
            '• فوق 18 عاماً',
            '• محامٍ مرخص أو موظف مكتب محاماة',
            '• مكتب مرخص في المملكة العربية السعودية',
        ],
    },
    {
        id: 'account', icon: 'users', title: '4. إنشاء الحساب',
        content: [
            '• معلومات دقيقة وكاملة عند التسجيل',
            '• التحقق من البريد الإلكتروني مطلوب',
            '• أنت مسؤول عن سرية كلمة المرور',
            '• نوصي بتفعيل المصادقة الثنائية (2FA)',
            '• المكتب مسؤول عن جميع أنشطة الموظفين',
        ],
    },
    {
        id: 'subscriptions', icon: 'credit-card', title: '5. الاشتراكات والدفع',
        content: [
            '• تجربة مجانية 14 يوماً — لا يلزم بطاقة',
            '• دفع شهري أو سنوي (خصم 20%)',
            '• الأسعار لا تشمل ضريبة 15%',
            '• استرداد كامل خلال 30 يوماً من الاشتراك الأول',
            '• لا استرداد بعد 30 يوماً أو للتجديدات',
        ],
    },
    {
        id: 'service-use', icon: 'check-square', title: '6. استخدام الخدمة',
        content: [
            '✅ مصرح: إدارة قضايا، تخزين مستندات، فواتير، بحث قانوني',
            '❌ ممنوع: مشاركة حساب مع مكاتب أخرى، أنشطة غير قانونية، اختراق، فيروسات، Scraping',
        ],
    },
    {
        id: 'ip', icon: 'shield', title: '7. الملكية الفكرية',
        content: [
            '• الكود والتصميم والشعار ملك لوثيق',
            '• أنت تملك جميع بياناتك',
            '• نمنحنا ترخيصاً فقط لتقديم الخدمة',
        ],
    },
    {
        id: 'privacy-ref', icon: 'lock', title: '8. الخصوصية والأمان',
        content: ['راجع تبويب "سياسة الخصوصية" للتفاصيل الكاملة. نحمي بياناتك بأعلى المعايير.'],
    },
    {
        id: 'termination', icon: 'x-circle', title: '9. إنهاء الخدمة',
        content: [
            '• يمكنك الإلغاء في أي وقت — سماح 30 يوماً',
            '• يحق لنا الإيقاف عند: انتهاك الشروط، عدم الدفع، احتيال',
            '• بعد الإيقاف: حذف البيانات خلال 30 يوماً',
        ],
    },
    {
        id: 'disclaimer', icon: 'alert-triangle', title: '10. إخلاء المسؤولية',
        content: [
            '• الخدمة "كما هي" بدون ضمانات',
            '• الحد الأقصى لمسؤوليتنا: 3 أشهر اشتراك',
            '• لا ينطبق على الإهمال الجسيم أو الاحتيال',
        ],
    },
    {
        id: 'indemnity', icon: 'shield', title: '11. التعويض',
        content: ['توافق على تعويضنا عن أي مطالبات ناتجة عن استخدامك أو انتهاكك للشروط.'],
    },
    {
        id: 'law', icon: 'book', title: '12. القانون الواجب التطبيق',
        content: [
            '• القانون السعودي',
            '• محاكم المملكة العربية السعودية',
            '• يمكن اللجوء للتحكيم أولاً',
        ],
    },
    {
        id: 'general', icon: 'file-text', title: '13. أحكام عامة',
        content: [
            '• تعديل الشروط بإشعار 30 يوماً',
            '• بند غير قانوني = حذفه فقط والباقي ساري',
            '• هذه الشروط + الخصوصية = الاتفاق الكامل',
        ],
    },
    {
        id: 'terms-contact', icon: 'mail', title: '14. التواصل',
        content: [
            '• الشروط: legal@bewathiq.com',
            '• الدعم: support@bewathiq.com',
        ],
    },
];

function CollapsibleSection({ section, isExpanded, onToggle }: { section: SectionData; isExpanded: boolean; onToggle: () => void }) {
    return (
        <Surface style={s.section} elevation={1}>
            <TouchableOpacity style={s.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={s.sectionTitleWrap}>
                    <Icon name={section.icon} size={16} color={colors.primary} />
                    <Text style={s.sectionTitle}>{section.title}</Text>
                </View>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {isExpanded && (
                <View style={s.sectionBody}>
                    {section.content.map((line, i) => (
                        <Text key={i} style={s.bodyText}>{line}</Text>
                    ))}
                </View>
            )}
        </Surface>
    );
}

export function PrivacyTermsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>('privacy');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        const sections = activeTab === 'privacy' ? privacySections : termsSections;
        setExpanded(new Set(sections.map(s => s.id)));
    };

    const sections = activeTab === 'privacy' ? privacySections : termsSections;

    return (
        <ScrollView style={s.container}>
            {/* Tabs */}
            <View style={s.tabs}>
                <TouchableOpacity
                    style={[s.tab, activeTab === 'privacy' && s.tabActive]}
                    onPress={() => { setActiveTab('privacy'); setExpanded(new Set()); }}
                >
                    <Icon name="shield" size={16} color={activeTab === 'privacy' ? '#fff' : colors.textMuted} />
                    <Text style={[s.tabText, activeTab === 'privacy' && s.tabTextActive]}>سياسة الخصوصية</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tab, activeTab === 'terms' && s.tabActive]}
                    onPress={() => { setActiveTab('terms'); setExpanded(new Set()); }}
                >
                    <Icon name="file-text" size={16} color={activeTab === 'terms' ? '#fff' : colors.textMuted} />
                    <Text style={[s.tabText, activeTab === 'terms' && s.tabTextActive]}>شروط الاستخدام</Text>
                </TouchableOpacity>
            </View>

            {/* Info Bar */}
            <View style={s.infoBar}>
                <Icon name="eye" size={16} color={colors.primary} />
                <View>
                    <Text style={s.infoTitle}>آخر تحديث: 4 مارس 2026</Text>
                    <Text style={s.infoSub}>النسخة 1.0 — ساري المفعول</Text>
                </View>
            </View>

            {/* Expand All */}
            <TouchableOpacity style={s.expandBtn} onPress={expandAll}>
                <Text style={s.expandBtnText}>عرض الكل ↓</Text>
            </TouchableOpacity>

            {/* Sections */}
            {sections.map(section => (
                <CollapsibleSection
                    key={section.id}
                    section={section}
                    isExpanded={expanded.has(section.id)}
                    onToggle={() => toggle(section.id)}
                />
            ))}

            {/* Footer */}
            <Surface style={s.footerCard} elevation={1}>
                <View style={s.footerIconWrap}>
                    <Icon name="shield" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.footerTitle}>التزامنا بخصوصيتك</Text>
                    <Text style={s.footerText}>حماية بياناتك جزء أساسي من قيمنا.</Text>
                    <View style={s.badges}>
                        {['AES-256', 'SSL/TLS', 'نسخ احتياطية', 'GDPR'].map(b => (
                            <View key={b} style={s.badge}><Text style={s.badgeText}>✓ {b}</Text></View>
                        ))}
                    </View>
                </View>
            </Surface>

            {/* Web Link */}
            <TouchableOpacity style={s.webLink} onPress={() => Linking.openURL('https://bewathiq.com/privacy')}>
                <Text style={s.webLinkText}>عرض النسخة الكاملة على الموقع</Text>
                <Icon name="external-link" size={14} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabs: {
        flexDirection: 'row', margin: 16, marginBottom: 12,
        backgroundColor: colors.white, borderRadius: 14, padding: 4,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 10,
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    tabTextActive: { color: '#fff' },
    infoBar: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginHorizontal: 16, marginBottom: 12, padding: 14,
        backgroundColor: '#EEF2FF', borderRadius: 12, borderWidth: 1, borderColor: '#C7D2FE',
    },
    infoTitle: { fontSize: 13, fontWeight: '600', color: '#1E1B4B' },
    infoSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
    expandBtn: {
        alignSelf: 'flex-end', marginRight: 16, marginBottom: 8,
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
    },
    expandBtnText: { fontSize: 12, color: colors.textSecondary },
    section: {
        marginHorizontal: 16, marginBottom: 8, borderRadius: 12, backgroundColor: colors.white,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14,
    },
    sectionTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    sectionBody: { paddingHorizontal: 14, paddingBottom: 14 },
    bodyText: { fontSize: 13, lineHeight: 22, color: colors.textSecondary, marginBottom: 4 },
    footerCard: {
        margin: 16, padding: 16, borderRadius: 14, backgroundColor: '#EEF2FF',
        flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    },
    footerIconWrap: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    footerTitle: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 4 },
    footerText: { fontSize: 12, color: colors.primary, marginBottom: 8 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    badge: {
        paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#fff',
        borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF',
    },
    badgeText: { fontSize: 10, fontWeight: '500', color: colors.primary },
    webLink: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 16,
    },
    webLinkText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
});
