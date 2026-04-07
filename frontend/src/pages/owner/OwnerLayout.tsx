import { useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import {
    Building2, Users, Link2, GitBranch, CreditCard,
    LayoutDashboard, Headset, Ticket, Scale, ArrowLeft,
    ChevronDown, Settings, Mail,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

interface NavItem {
    href: string;
    label: string;
    icon: any;
    exact?: boolean;
}

interface NavGroup {
    id: string;
    title: string;
    icon: any;
    items: NavItem[];
}

function getNavGroups(slug: string): NavGroup[] {
    const s = `/${slug}`;
    return [
        {
            id: 'overview',
            title: 'نظرة عامة',
            icon: LayoutDashboard,
            items: [
                { href: `${s}/owner`, label: 'لوحة المالك', icon: LayoutDashboard, exact: true },
            ],
        },
        {
            id: 'settings',
            title: 'الإعدادات',
            icon: Settings,
            items: [
                { href: `${s}/owner/company`, label: 'ملف الشركة', icon: Building2 },
                { href: `${s}/owner/roles-users`, label: 'الأدوار والمستخدمين', icon: Users },
                { href: `${s}/owner/integrations`, label: 'الربط والتكاملات', icon: Link2 },
                { href: `${s}/owner/workflows`, label: 'سير العمل', icon: GitBranch },
                { href: `${s}/owner/billing`, label: 'الاشتراكات والفوترة', icon: CreditCard },
            ],
        },
        {
            id: 'support',
            title: 'الدعم الفني',
            icon: Headset,
            items: [
                { href: `${s}/owner/support`, label: 'التواصل مع الدعم', icon: Headset },
                { href: `${s}/owner/tickets`, label: 'التذاكر', icon: Ticket },
                { href: `${s}/owner/support/email`, label: 'إرسال بريد إلكتروني', icon: Mail },
            ],
        },
    ];
}

export default function OwnerLayout() {
    const location = useLocation();
    const { slug } = useParams<{ slug: string }>();
    const user = useAuthStore((s) => s.user);

    const navGroups = getNavGroups(slug || '');

    // Auto-expand the group containing the active path
    const getInitialExpanded = (): Set<string> => {
        const expanded = new Set<string>();
        for (const group of navGroups) {
            for (const item of group.items) {
                const active = item.exact
                    ? location.pathname === item.href
                    : location.pathname.startsWith(item.href);
                if (active) {
                    expanded.add(group.id);
                    break;
                }
            }
        }
        return expanded;
    };

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(getInitialExpanded);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return location.pathname === href;
        return location.pathname === href || location.pathname.startsWith(href + '/');
    };

    return (
        <div className="flex h-screen bg-slate-50" dir="rtl">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm">
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">صفحة الشركة</p>
                            <p className="text-primary text-xs">{user?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">

                    {/* Collapsible Groups */}
                    {navGroups.map((group) => {
                        const isExpanded = expandedGroups.has(group.id);
                        const GroupIcon = group.icon;
                        const hasActiveItem = group.items.some(item => isActive(item.href, item.exact));

                        return (
                            <div key={group.id} className="space-y-0.5">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-gray-50 ${hasActiveItem
                                        ? 'text-primary font-semibold'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <GroupIcon className={`w-[18px] h-[18px] ${hasActiveItem ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="flex-1 text-right">{group.title}</span>
                                    <ChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''
                                            }`}
                                    />
                                </button>

                                {/* Group Items */}
                                <div
                                    className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="mr-4 pr-3 border-r-2 border-gray-100 space-y-0.5 py-1">
                                        {group.items.map((item, idx) => {
                                            const active = isActive(item.href, item.exact);
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={`${item.href}-${idx}`}
                                                    to={item.href}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${active
                                                        ? 'bg-primary text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom: Go back to personal page */}
                <div className="p-3 border-t border-gray-100">
                    <Link
                        to={`/${slug || ''}/dashboard`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-l from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-700 hover:from-emerald-500/20 hover:to-teal-500/20"
                    >
                        <ArrowLeft className="w-[18px] h-[18px]" />
                        الذهاب إلى الصفحة الشخصية
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
