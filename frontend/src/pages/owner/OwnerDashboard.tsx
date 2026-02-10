import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { Users, Briefcase, UserCheck, Link2, GitBranch, TrendingUp } from 'lucide-react';

export default function OwnerDashboard() {
    const { data: stats } = useQuery({
        queryKey: ['owner-dashboard'],
        queryFn: ownerApi.getDashboard,
    });

    const { data: usage } = useQuery({
        queryKey: ['owner-usage'],
        queryFn: ownerApi.getUsage,
    });

    const cards = [
        { label: 'المستخدمون النشطون', value: stats?.usersCount || 0, icon: Users, color: 'bg-blue-500', lightColor: 'bg-blue-50' },
        { label: 'القضايا', value: stats?.casesCount || 0, icon: Briefcase, color: 'bg-emerald-500', lightColor: 'bg-emerald-50' },
        { label: 'العملاء', value: stats?.clientsCount || 0, icon: UserCheck, color: 'bg-purple-500', lightColor: 'bg-purple-50' },
        { label: 'التكاملات المفعّلة', value: stats?.activeIntegrations || 0, icon: Link2, color: 'bg-amber-500', lightColor: 'bg-amber-50' },
        { label: 'سير العمل النشط', value: stats?.activeWorkflows || 0, icon: GitBranch, color: 'bg-rose-500', lightColor: 'bg-rose-50' },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">👑 لوحة المالك</h1>
                <p className="text-gray-500 mt-1">إدارة إعدادات الشركة والمستخدمين والتكاملات</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${card.lightColor} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
                                </div>
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Usage Meters */}
            {usage && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">📊 استخدام الموارد</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <UsageMeter label="المستخدمون" used={usage.users?.used || 0} limit={usage.users?.limit || 0} color="blue" />
                        <UsageMeter label="القضايا" used={usage.cases?.used || 0} limit={usage.cases?.limit || 0} color="emerald" />
                        <UsageMeter label="التخزين" used={usage.storage?.usedGB || 0} limit={usage.storage?.limitGB || 0} color="purple" unit="GB" />
                        <UsageMeter label="العملاء" used={usage.clients?.used || 0} limit={usage.clients?.limit || 0} color="amber" />
                    </div>
                </div>
            )}
        </div>
    );
}

function UsageMeter({ label, used, limit, color, unit = '' }: {
    label: string;
    used: number;
    limit: number;
    color: string;
    unit?: string;
}) {
    const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
    const isUnlimited = limit === -1 || limit === 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-xs text-gray-500">
                    {used}{unit} / {isUnlimited ? '∞' : `${limit}${unit}`}
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all bg-${color}-500`}
                    style={{ width: isUnlimited ? '5%' : `${percentage}%` }}
                />
            </div>
            {!isUnlimited && percentage >= 80 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ اقتربت من الحد الأقصى</p>
            )}
        </div>
    );
}
