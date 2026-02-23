import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const email = (location.state as any)?.email || '';

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [countdown, setCountdown] = useState(COOLDOWN_SECONDS);
    const [verified, setVerified] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect if no email in state
    useEffect(() => {
        if (!email) {
            navigate('/register', { replace: true });
        }
    }, [email, navigate]);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Focus first input on mount
    useEffect(() => {
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }, []);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 650);
    };

    const handleVerify = useCallback(async (code: string) => {
        if (code.length !== OTP_LENGTH || isVerifying) return;

        setIsVerifying(true);
        setError('');

        try {
            const { data } = await api.post('/auth/verify-email', { email, code });

            setVerified(true);
            toast.success(data.message || 'تم التحقق بنجاح!');

            // Auto-login with returned tokens
            if (data.accessToken && data.user) {
                login(data.user, data.accessToken);
                setTimeout(() => {
                    navigate(data.redirectTo || '/dashboard', { replace: true });
                }, 1200);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'حدث خطأ. حاول مرة أخرى.';
            setError(msg);
            triggerShake();
            // Clear OTP inputs
            setOtp(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } finally {
            setIsVerifying(false);
        }
    }, [email, isVerifying, login, navigate]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // numbers only

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // take last digit
        setOtp(newOtp);
        setError('');

        // Auto-advance to next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit on last digit
        const fullCode = newOtp.join('');
        if (fullCode.length === OTP_LENGTH) {
            handleVerify(fullCode);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;

        const newOtp = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((char, i) => {
            newOtp[i] = char;
        });
        setOtp(newOtp);

        // Focus the last filled input or submit
        const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
        inputRefs.current[lastIndex]?.focus();

        if (pasted.length === OTP_LENGTH) {
            handleVerify(pasted);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || isResending) return;

        setIsResending(true);
        setError('');

        try {
            const { data } = await api.post('/auth/resend-otp', { email });

            if (data.waitSeconds && data.waitSeconds > 0) {
                setCountdown(data.waitSeconds);
                toast(`يرجى الانتظار ${data.waitSeconds} ثانية قبل إعادة الإرسال`);
            } else {
                setCountdown(COOLDOWN_SECONDS);
                toast.success('تم إرسال رمز جديد إلى بريدك الإلكتروني');
            }

            // Clear OTP inputs
            setOtp(Array(OTP_LENGTH).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'فشل إعادة الإرسال';
            setError(msg);
        } finally {
            setIsResending(false);
        }
    };

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={cn(
                            'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500',
                            verified
                                ? 'bg-emerald-500/20 ring-4 ring-emerald-500/30'
                                : 'bg-indigo-500/20 ring-4 ring-indigo-500/30'
                        )}>
                            {verified ? (
                                <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
                            ) : (
                                <Mail className="w-10 h-10 text-indigo-400" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-white mb-2">
                        {verified ? 'تم التحقق بنجاح! ✅' : 'تحقق من بريدك الإلكتروني'}
                    </h1>
                    <p className="text-sm text-center text-slate-400 mb-1">
                        {verified
                            ? 'جاري تحويلك إلى لوحة التحكم...'
                            : 'أدخل الرمز المكون من 6 أرقام المرسل إلى'}
                    </p>
                    {!verified && (
                        <p className="text-sm text-center text-indigo-400 font-medium mb-8" dir="ltr">
                            {email}
                        </p>
                    )}

                    {/* OTP Inputs */}
                    {!verified && (
                        <>
                            <div
                                className={cn(
                                    'flex justify-center gap-3 mb-6 transition-transform',
                                    shake && 'animate-[shake_0.65s_ease-in-out]'
                                )}
                                dir="ltr"
                                onPaste={handlePaste}
                            >
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => { inputRefs.current[idx] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        disabled={isVerifying}
                                        className={cn(
                                            'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200',
                                            'bg-white/5 text-white placeholder-slate-600',
                                            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/10',
                                            error
                                                ? 'border-red-500/60'
                                                : digit
                                                    ? 'border-indigo-500/50'
                                                    : 'border-white/10',
                                            isVerifying && 'opacity-50 cursor-not-allowed'
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                    <p className="text-red-400 text-sm text-center">{error}</p>
                                </div>
                            )}

                            {/* Verify button */}
                            <Button
                                onClick={() => handleVerify(otp.join(''))}
                                disabled={otp.join('').length < OTP_LENGTH || isVerifying}
                                className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 mb-6"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                        جاري التحقق...
                                    </>
                                ) : (
                                    'تأكيد الرمز'
                                )}
                            </Button>

                            {/* Resend section */}
                            <div className="flex flex-col items-center gap-3">
                                {countdown > 0 ? (
                                    <p className="text-slate-500 text-sm">
                                        إعادة الإرسال متاحة بعد{' '}
                                        <span className="text-indigo-400 font-mono font-bold">
                                            {formatCountdown(countdown)}
                                        </span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isResending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        إعادة إرسال الرمز
                                    </button>
                                )}

                                <Link
                                    to="/register"
                                    className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                                >
                                    <ArrowRight className="w-3 h-3" />
                                    بريد خاطئ؟ العودة للتسجيل
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Shake animation keyframes */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 50%, 90% { transform: translateX(-6px); }
                    30%, 70% { transform: translateX(6px); }
                }
            `}</style>
        </div>
    );
}
