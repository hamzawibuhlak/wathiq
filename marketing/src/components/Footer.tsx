import { Link } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = [
    {
        title: 'عن وثيق',
        links: [
            { label: 'من نحن', to: '/about' },
            { label: 'تواصل معنا', to: '/contact' },
            { label: 'الخصوصية', href: 'https://bewathiq.com/privacy' },
        ],
    },
    {
        title: 'المنتج',
        links: [
            { label: 'الأسعار', to: '/pricing' },
            { label: 'الميزات', to: '/#features' },
        ],
    },
    {
        title: 'الموارد',
        links: [
            { label: 'مركز المساعدة', href: '#' },
            { label: 'الشروط والأحكام', href: 'https://bewathiq.com/privacy?tab=terms' },
            { label: 'سياسة الخصوصية', href: 'https://bewathiq.com/privacy?tab=privacy' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-dark text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-400 rounded-xl flex items-center justify-center">
                                <Scale className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-extrabold font-heading">وثيق</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                            منصة إدارة مكاتب المحاماة الأولى في السعودية. أتمتة كاملة لمكتبك من القضايا للفواتير.
                        </p>
                        <div className="flex flex-col gap-2 text-sm text-gray-400">
                            <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> info@bewathiq.com</span>
                            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> +966 50 000 0000</span>
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> الرياض، المملكة العربية السعودية</span>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map(col => (
                        <div key={col.title}>
                            <h4 className="font-heading font-bold text-sm mb-4">{col.title}</h4>
                            <ul className="space-y-2.5">
                                {col.links.map(l => (
                                    <li key={l.label}>
                                        {'to' in l && l.to ? (
                                            <Link to={l.to} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>
                                        ) : (
                                            <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">© 2026 وثيق. جميع الحقوق محفوظة.</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                        <a href="https://bewathiq.com/privacy?tab=privacy" className="hover:text-white transition-colors">الخصوصية</a>
                        <a href="https://bewathiq.com/privacy?tab=terms" className="hover:text-white transition-colors">الشروط</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
