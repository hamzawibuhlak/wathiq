import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { GlobalSearch } from './GlobalSearch';
import { UserAvatar } from '@/components/ui';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
    isCollapsed: boolean;
}

export function Header({ isCollapsed }: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user } = useAuthStore();
    const logoutMutation = useLogout();
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
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
                            className="w-full h-10 px-4 rounded-lg border bg-background text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            <span className="flex-1 text-right">بحث...</span>
                            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <NotificationsDropdown />

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <UserAvatar
                                    name={user?.name || 'مستخدم'}
                                    avatar={user?.avatar}
                                    size="sm"
                                />
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium">{user?.name || 'المستخدم'}</p>
                                    <p className="text-xs text-muted-foreground">{user?.role || 'مالك'}</p>
                                </div>
                                <ChevronDown className={cn(
                                    'w-4 h-4 text-muted-foreground transition-transform',
                                    showUserMenu && 'rotate-180'
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border py-1 animate-in fade-in slide-in-from-top-2">
                                    <button
                                        onClick={() => {
                                            navigate('/settings');
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        الملف الشخصي
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/settings');
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        الإعدادات
                                    </button>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        تسجيل الخروج
                                    </button>
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
