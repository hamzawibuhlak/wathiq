import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, User, Settings, LogOut, ChevronDown, Plus, Briefcase, Calendar, Users, FileText, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { useMessagesUnreadCount } from '@/hooks/use-notifications';
import { GlobalSearch } from './GlobalSearch';
import { UserAvatar } from '@/components/ui';
import { NotificationsDropdown } from './NotificationsDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
    isCollapsed: boolean;
}

interface QuickAction {
    label: string;
    icon: typeof Briefcase;
    path: string;
    color: string;
}

const quickActions: QuickAction[] = [
    { label: 'قضية جديدة', icon: Briefcase, path: '/cases/new', color: 'text-blue-600' },
    { label: 'جلسة جديدة', icon: Calendar, path: '/hearings/new', color: 'text-amber-600' },
    { label: 'عميل جديد', icon: Users, path: '/clients/new', color: 'text-emerald-600' },
    { label: 'مستند جديد', icon: FileText, path: '/documents', color: 'text-purple-600' },
];

export function Header({ isCollapsed }: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const quickActionsRef = useRef<HTMLDivElement>(null);
    const { user } = useAuthStore();
    const logoutMutation = useLogout();
    const navigate = useNavigate();
    const { data: messagesUnread } = useMessagesUnreadCount();
    const messagesUnreadCount = messagesUnread?.count || 0;

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
                setShowQuickActions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut for search
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

    const handleLogout = () => {
        logoutMutation.mutate();
        setShowUserMenu(false);
    };

    const handleQuickAction = (path: string) => {
        navigate(path);
        setShowQuickActions(false);
    };

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 left-0 z-30 h-16 bg-card/95 backdrop-blur border-b transition-all duration-300',
                    isCollapsed ? 'right-16' : 'right-64'
                )}
            >
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Search Trigger */}
                    <div className="flex-1 max-w-md">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="w-full h-10 px-4 rounded-xl border bg-background/50 text-sm text-muted-foreground hover:bg-muted hover:border-primary/20 transition-all flex items-center gap-3"
                        >
                            <Search className="h-4 w-4" />
                            <span className="flex-1 text-right">بحث في القضايا، العملاء، الجلسات...</span>
                            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-[10px] font-mono">
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Quick Actions Button */}
                        <div className="relative" ref={quickActionsRef}>
                            <button
                                onClick={() => setShowQuickActions(!showQuickActions)}
                                className={cn(
                                    'flex items-center gap-2 h-10 px-4 rounded-xl font-medium transition-all',
                                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
                                    showQuickActions && 'ring-2 ring-primary/20'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">إنشاء</span>
                                <ChevronDown className={cn(
                                    'w-4 h-4 transition-transform',
                                    showQuickActions && 'rotate-180'
                                )} />
                            </button>

                            {/* Quick Actions Dropdown */}
                            {showQuickActions && (
                                <div className="absolute left-0 top-full mt-2 w-56 bg-card rounded-xl shadow-lg border py-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-3 py-2 border-b mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">إنشاء سريع</p>
                                    </div>
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.path}
                                                onClick={() => handleQuickAction(action.path)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                            >
                                                <div className={cn('w-8 h-8 rounded-lg bg-muted flex items-center justify-center', action.color)}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">{action.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-border mx-2" />

                        {/* Messages */}
                        <Link to="/messages">
                            <Button variant="ghost" size="icon" className="relative">
                                <Mail className="w-5 h-5" />
                                {messagesUnreadCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="absolute -top-1 -end-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-blue-500 text-white"
                                    >
                                        {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>

                        {/* Notifications */}
                        <NotificationsDropdown />

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={cn(
                                    'flex items-center gap-2 p-2 hover:bg-muted rounded-xl transition-colors',
                                    showUserMenu && 'bg-muted'
                                )}
                            >
                                <UserAvatar
                                    name={user?.name || 'مستخدم'}
                                    avatar={user?.avatar}
                                    size="sm"
                                />
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium">{user?.name || 'المستخدم'}</p>
                                </div>
                                <ChevronDown className={cn(
                                    'w-4 h-4 text-muted-foreground transition-transform',
                                    showUserMenu && 'rotate-180'
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute left-0 top-full mt-2 w-52 bg-card rounded-xl shadow-lg border py-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b">
                                        <p className="text-sm font-medium">{user?.name || 'المستخدم'}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                navigate('/settings/profile');
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                        >
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            الملف الشخصي
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/settings');
                                                setShowUserMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            الإعدادات
                                        </button>
                                    </div>
                                    <div className="border-t pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

            {/* Global Search Modal */}
            <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
        </>
    );
}

export default Header;
