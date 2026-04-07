import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Scale } from 'lucide-react';

const links = [
    { to: '/', label: 'الرئيسية' },
    { to: '/about', label: 'من نحن' },
    { to: '/pricing', label: 'الأسعار' },
    { to: '/contact', label: 'تواصل معنا' },
];

export function Header() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const loc = useLocation();

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    useEffect(() => { setOpen(false); }, [loc.pathname]);

    return (
        <header className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-extrabold font-heading text-gradient">وثيق</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {links.map(l => (
                            <Link
                                key={l.to}
                                to={l.to}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loc.pathname === l.to ? 'text-primary bg-primary-light' : 'text-gray hover:text-dark hover:bg-gray-50'}`}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <a href="https://bewathiq.com/login" className="text-sm font-medium text-gray hover:text-primary transition-colors">تسجيل دخول</a>
                        <a href="https://bewathiq.com/register" className="px-5 py-2.5 bg-gradient-to-l from-primary to-primary-dark text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                            ابدأ مجاناً
                        </a>
                    </div>

                    {/* Mobile toggle */}
                    <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-white border-t shadow-lg animate-in slide-in-from-top">
                    <div className="px-4 py-4 space-y-1">
                        {links.map(l => (
                            <Link key={l.to} to={l.to} className={`block px-4 py-3 rounded-xl text-sm font-medium ${loc.pathname === l.to ? 'text-primary bg-primary-light' : 'text-gray hover:bg-gray-50'}`}>
                                {l.label}
                            </Link>
                        ))}
                        <div className="pt-3 border-t mt-3 space-y-2">
                            <a href="https://bewathiq.com/login" className="block text-center py-2.5 text-sm font-medium text-gray">تسجيل دخول</a>
                            <a href="https://bewathiq.com/register" className="block text-center py-3 bg-primary text-white text-sm font-bold rounded-xl">ابدأ مجاناً</a>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
