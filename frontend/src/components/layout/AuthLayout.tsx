import { Outlet, Link, useLocation } from 'react-router-dom';
import { Scale, Shield, Users, BarChart3 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/common/PageTransition';
import { cn } from '@/lib/utils';

export function AuthLayout() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';

    const features = [
        { icon: Shield, label: 'أمان عالي', desc: 'تشفير بيانات متقدم' },
        { icon: Users, label: '+100 مكتب', desc: 'يثقون بوسم الثقة' },
        { icon: BarChart3, label: 'تحليلات ذكية', desc: 'لأداء مكتبك' },
    ];

    return (
        <div className="min-h-screen flex bg-[hsl(222,47%,8%)]" dir="rtl">
            {/* Left side — Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-28 relative">
                {/* Subtle glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

                <div className="relative mx-auto w-full max-w-sm">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center',
                            'bg-gradient-to-br from-primary/90 to-[hsl(var(--gold))]/80',
                            'shadow-[0_0_20px_rgba(var(--primary-rgb),0.35)]'
                        )}>
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">وسم الثقة</span>
                    </div>

                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white">
                            {isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
                        </h2>
                        <p className="mt-2 text-[15px] text-white/45">
                            {isLogin ? (
                                <>
                                    ليس لديك حساب؟{' '}
                                    <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                        أنشئه الآن
                                    </Link>
                                </>
                            ) : (
                                <>
                                    لديك حساب؟{' '}
                                    <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                        سجّل دخولك
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Form */}
                    <div className={cn(
                        'p-7 rounded-2xl',
                        'bg-slate-900/60 backdrop-blur-xl',
                        'border border-white/[0.07]',
                        'shadow-[0_8px_40px_rgba(0,0,0,0.4)]'
                    )}>
                        <AnimatePresence mode="wait">
                            <PageTransition key={location.pathname}>
                                <Outlet />
                            </PageTransition>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Right side — Branding */}
            <div className="hidden lg:flex relative w-0 flex-1 flex-col items-center justify-center p-14 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 via-transparent to-[hsl(var(--gold))]/10" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />

                {/* Glow orbs */}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-[hsl(var(--gold))]/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative text-center">
                    <div className={cn(
                        'w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center',
                        'bg-gradient-to-br from-primary/90 to-[hsl(var(--gold))]/80',
                        'shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)]'
                    )}>
                        <Scale className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4">وسم الثقة</h1>
                    <p className="text-lg text-white/50 max-w-xs leading-relaxed">
                        نظام متكامل لإدارة المكاتب القانونية
                    </p>

                    {/* Feature Cards */}
                    <div className="mt-12 flex flex-col gap-3 text-right">
                        {features.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className={cn(
                                'flex items-center gap-4 px-5 py-4 rounded-xl',
                                'bg-white/[0.04] border border-white/[0.06]',
                                'backdrop-blur-sm'
                            )}>
                                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-white/80">{label}</p>
                                    <p className="text-[12px] text-white/35">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
