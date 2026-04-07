import { Outlet, Link, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/common/PageTransition';

export function AuthLayout() {
    const location = useLocation();
    const isLogin = location.pathname === '/login';

    return (
        <div className="min-h-screen flex" dir="rtl">
            {/* Left side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Scale className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-primary">وثيق</span>
                    </div>

                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {isLogin ? (
                                <>
                                    ليس لديك حساب؟{' '}
                                    <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
                                        أنشئ حسابك الآن
                                    </Link>
                                </>
                            ) : (
                                <>
                                    لديك حساب بالفعل؟{' '}
                                    <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                                        تسجيل الدخول
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Form content from pages */}
                    <AnimatePresence mode="wait">
                        <PageTransition key={location.pathname}>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </div>
            </div>

            {/* Right side - Branding */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[hsl(var(--gold))]">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                    <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
                        <Scale className="w-20 h-20 mb-8" />
                        <h1 className="text-4xl font-bold text-center mb-4">
                            نظام وثيق
                        </h1>
                        <p className="text-xl text-center text-white/80 max-w-md">
                            نظام متكامل لإدارة المكاتب القانونية
                            <br />
                            قضاياك، عملاؤك، جلساتك في مكان واحد
                        </p>
                        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-3xl font-bold">100+</div>
                                <div className="text-sm text-white/70">مكتب قانوني</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">5000+</div>
                                <div className="text-sm text-white/70">قضية</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">99%</div>
                                <div className="text-sm text-white/70">رضا العملاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
