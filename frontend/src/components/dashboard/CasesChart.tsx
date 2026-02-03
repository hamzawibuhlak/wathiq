import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CasesChartProps {
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    isLoading?: boolean;
}

// Arabic translations for status
const statusLabels: Record<string, string> = {
    OPEN: 'مفتوحة',
    IN_PROGRESS: 'قيد التنفيذ',
    SUSPENDED: 'معلقة',
    CLOSED: 'مغلقة',
    ARCHIVED: 'مؤرشفة',
};

// Arabic translations for case types
const typeLabels: Record<string, string> = {
    CRIMINAL: 'جنائية',
    CIVIL: 'مدنية',
    COMMERCIAL: 'تجارية',
    LABOR: 'عمالية',
    FAMILY: 'أحوال شخصية',
    ADMINISTRATIVE: 'إدارية',
    REAL_ESTATE: 'عقارية',
    OTHER: 'أخرى',
};

// Colors for status
const statusColors: Record<string, string> = {
    OPEN: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    SUSPENDED: '#6b7280',
    CLOSED: '#22c55e',
    ARCHIVED: '#8b5cf6',
};

// Colors for types
const typeColors = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280'];

export function CasesChart({ byStatus, byType, isLoading }: CasesChartProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-card border rounded-xl p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="h-[200px] bg-muted rounded-full mx-auto w-[200px]"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const statusData = byStatus.map(item => ({
        name: statusLabels[item.status] || item.status,
        value: item.count,
        color: statusColors[item.status] || '#6b7280',
    }));

    const typeData = byType.map((item, index) => ({
        name: typeLabels[item.type] || item.type,
        value: item.count,
        color: typeColors[index % typeColors.length],
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases by Status */}
            <div className="bg-card border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">القضايا حسب الحالة</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    textAlign: 'right',
                                }}
                                formatter={(value: number) => [`${value} قضية`, '']}
                            />
                            <Legend
                                layout="horizontal"
                                align="center"
                                verticalAlign="bottom"
                                formatter={(value) => <span className="text-sm">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                    <p className="text-3xl font-bold">
                        {statusData.reduce((sum, d) => sum + d.value, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">إجمالي القضايا</p>
                </div>
            </div>

            {/* Cases by Type */}
            <div className="bg-card border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">القضايا حسب النوع</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={typeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {typeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    textAlign: 'right',
                                }}
                                formatter={(value: number) => [`${value} قضية`, '']}
                            />
                            <Legend
                                layout="horizontal"
                                align="center"
                                verticalAlign="bottom"
                                formatter={(value) => <span className="text-sm">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                    <p className="text-3xl font-bold">{typeData.length}</p>
                    <p className="text-sm text-muted-foreground">أنواع القضايا</p>
                </div>
            </div>
        </div>
    );
}

export default CasesChart;
