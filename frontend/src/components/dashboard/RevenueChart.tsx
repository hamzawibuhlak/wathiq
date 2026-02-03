import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueChartProps {
    data: { month: string; monthName: string; total: number; count: number }[];
    isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
    if (isLoading) {
        return (
            <div className="bg-card border rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-[250px] bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    // Calculate trend
    const currentMonth = data[data.length - 1]?.total || 0;
    const previousMonth = data[data.length - 2]?.total || 0;
    const trend = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
    const isPositive = trend >= 0;

    return (
        <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">الإيرادات الشهرية</h3>
                    <p className="text-sm text-muted-foreground">آخر 6 أشهر</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            </div>

            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="monthName"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                textAlign: 'right',
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']}
                            labelFormatter={(label) => label}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#revenueGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                        {currentMonth.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">هذا الشهر (ر.س)</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold">
                        {data.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">إجمالي 6 أشهر</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold">
                        {data.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">عدد الفواتير</p>
                </div>
            </div>
        </div>
    );
}

export default RevenueChart;
