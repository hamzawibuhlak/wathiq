import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
    Search, User, Settings, LogOut, ChevronDown,
    Plus, Briefcase, Calendar, Users, FileText, Mail, Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { useMessagesUnreadCount } from '@/hooks/use-notifications';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
    isCollapsed: boolean;
}

const quickActions = [
    { label: 'قضية جديدة',  icon: Briefcase, path: '/cases/new',    color: 'text-sky-400',    bg: 'bg-sky-400/10' },
    { label: 'جلسة جديدة',  icon: Calendar,  path: '/hearings/new', color: 'text-amber-400',  bg: 'bg-amber-400/10' },
    { label: 'عميل جديد',   icon: Users,     path: '/clients/new',  color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
    { label: 'مستند جديد',  icon: FileText,  path: '/documents',    color: 'text-violet-400', bg: 'bg-violet-400/10' },
];

export function Header({ isCollapsed }: HeaderProps) {
    const [showUserMenu, setShowUserMenu]       = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showSearch, setShowSearch]           = useState(false);
    const menuRef         = useRef<HTMLDivElement>(null);
    const quickActionsRef = useRef<HTMLDivElement>(null);
    const { user }        = useAuthStore();
    const logoutMutation  = useLogout();
    const navigate        = useNavigate();
    const { slug }        = useParams<{ slug: string }>();
    const slugPrefix      = slug ? `/${slug}` : '';
    const { data: messagesUnread } = useMessagesUnreadCount();
    const messagesUnreadCount = messagesUnread?.count || 0;
    const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'م';

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setShowUserMenu(false);
            if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node))
                setShowQuickActions(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setShowSearch(true);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleLogout = () => { logoutMutation.mutate(); setShowUserMenu(false); };
    const handleQuickAction = (path: string) => { navigate(`${slugPrefix}${path}`); setShowQuickActions(false); };

    return (
        <>
            <header className={cn(
                'fixed top-0 left-0 z-30 h-16 transition-all duration-300',
                'bg-slate-900/80 backdrop-blur-xl',
                'border-b border-white/[0.07]',
                'shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
                isCollapsed ? 'right-[68px]' : 'right-64'
            )}>
                <div className="h-full px-5 flex items-center justify-between gap-4">

                    {/* ── Search ── */}
                    <div className="flex-1 max-w-sm">
                        <button
                            onClick={() => setShowSearch(true)}
                            className={cn(
                                'w-full h-9 px-3 rounded-xl flex items-center gap-2.5',
                                'bg-white/[0.05] border border-white/[0.08]',
                                'text-white/40 hover:text-white/70 hover:bg-white/[0.08] hover:border-primary/30',
                                'transition-all duration-200 text-sm'
                            )}
                        >
                            <Search className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-right text-[13px]">بحث في القضايا، العملاء...</span>
                            <span className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-white/30">
                                <Command className="w-2.5 h-2.5" />K
                            </span>
                        </button>
                    </div>

                    {/* ── Right Actions ── */}
                    <div className="flex items-center gap-1.5">

                        {/* Quick Create */}
                        <div className="relative" ref={quickActionsRef}>
                            <button
                                onClick={() => setShowQuickActions(!showQuickActions)}
                                className={cn(
                                    'flex items-center gap-2 h-9 px-3.5 rounded-xl text-[13px] font-semibold transition-all duration-200',
                                    'bg-gradient-to-l from-primary/90 to-[hsl(var(--gold))]/80 text-white',
                                    'hover:from-primary hover:to-[hsl(var(--gold))]',
                                    'shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_22px_rgba(var(--primary-rgb),0.45)]',
                                    showQuickActions && 'ring-2 ring-primary/30'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">إنشاء</span>
                                <ChevronDown className={cn('w-3.5 h-3.5 opacity-70 transition-transform', showQuickActions && 'rotate-180')} />
                            </button>

                            {showQuickActions && (
                                <div className={cn(
                                    'absolute left-0 top-full mt-2 w-52 py-2 rounded-2xl z-50',
                                    'bg-slate-900/95 backdrop-blur-xl',
                                    'border border-white/[0.08]',
                                    'shadow-[0_16px_40px_rgba(0,0,0,0.5)]',
                                    'animate-in fade-in slide-in-from-top-2'
                                )}>
                                    <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">إنشاء سريع</p>
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.path}
                                                onClick={() => handleQuickAction(action.path)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors"
                                            >
                                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', action.bg, action.color)}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-[13px] text-white/75 font-medium">{action.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-white/[0.08] mx-1" />

                        {/* Messages */}
                        <Link
                            to={`${slugPrefix}/messages`}
                            className={cn(
                                'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
                                'text-white/45 hover:text-white/90 hover:bg-white/[0.07]',
                                messagesUnreadCount > 0 && 'text-sky-400'
                            )}
                            title="الرسائل"
                        >
                            <Mail className="w-[18px] h-[18px]" />
                            {messagesUnreadCount > 0 && (
                                <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-sky-500 text-white text-[10px] font-bold border-2 border-slate-900">
                                    {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                                </span>
                            )}
                        </Link>

                        {/* Notifications */}
                        <div className="[&>button]:w-9 [&>button]:h-9 [&>button]:rounded-xl [&>button]:text-white/45 [&>button:hover]:text-white/90 [&>button:hover]:bg-white/[0.07]">
                            <NotificationsDropdown />
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-white/[0.08] mx-1" />

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={cn(
                                    'flex items-center gap-2.5 h-9 px-2.5 rounded-xl transition-all duration-200',
                                    'hover:bg-white/[0.07]',
                                    showUserMenu && 'bg-white/[0.07]'
                                )}
                            >
                                {/* Avatar */}
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-[hsl(var(--gold))]/60 flex items-center justify-center ring-1 ring-primary/30 flex-shrink-0">
                                    <span className="text-[11px] font-bold text-white">{initials}</span>
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="text-[13px] font-semibold text-white/80 leading-none">{user?.name?.split(' ')[0] || 'المستخدم'}</p>
                                </div>
                                <ChevronDown className={cn('w-3.5 h-3.5 text-white/30 transition-transform', showUserMenu && 'rotate-180')} />
                            </button>

                            {showUserMenu && (
                                <div className={cn(
                                    'absolute left-0 top-full mt-2 w-56 py-2 rounded-2xl z-50',
                                    'bg-slate-900/95 backdrop-blur-xl',
                                    'border border-white/[0.08]',
                                    'shadow-[0_16px_40px_rgba(0,0,0,0.5)]',
                                    'animate-in fade-in slide-in-from-top-2'
                                )}>
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-white/[0.07]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-[hsl(var(--gold))]/60 flex items-center justify-center ring-2 ring-primary/20">
                                                <span className="text-sm font-bold text-white">{initials}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-white/90 truncate">{user?.name || 'المستخدم'}</p>
                                                <p className="text-[11px] text-white/35 truncate">{user?.email || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1.5 space-y-0.5">
                                        <button
                                            onClick={() => { navigate(`${slugPrefix}/account/profile`); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            الملف الشخصي
                                        </button>
                                        <button
                                            onClick={() => { navigate(`${slugPrefix}/settings`); setShowUserMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            إدارة المكتب
                                        </button>
                                    </div>

                                    <div className="border-t border-white/[0.07] pt-1.5">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-rose-400 hover:bg-rose-400/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            تسجيل الخروج
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
        </>
    );
}

export default Header;
