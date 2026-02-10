import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { Link2, CheckCircle, XCircle, Play, Power } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IntegrationsPage() {
    const queryClient = useQueryClient();

    const { data: integrations = [], isLoading } = useQuery({
        queryKey: ['owner-integrations'],
        queryFn: ownerApi.getIntegrations,
    });

    const testMutation = useMutation({
        mutationFn: (type: string) => ownerApi.testIntegration(type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-integrations'] });
            toast.success('تم اختبار التكامل بنجاح');
        },
        onError: () => toast.error('فشل اختبار التكامل'),
    });

    const toggleMutation = useMutation({
        mutationFn: (type: string) => ownerApi.toggleIntegration(type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-integrations'] });
            toast.success('تم تحديث حالة التكامل');
        },
    });

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-amber-600" />
                    الارتباطات والتكاملات
                </h1>
                <p className="text-sm text-gray-500 mt-1">ربط النظام بالخدمات الخارجية</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.map((int: any) => (
                        <div key={int.type} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{int.icon}</span>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{int.name}</p>
                                        <p className="text-xs text-gray-400">{int.type.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                                {int.isConfigured && (
                                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${int.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {int.isActive ? (
                                            <><CheckCircle className="w-3 h-3" /> مفعّل</>
                                        ) : (
                                            <><XCircle className="w-3 h-3" /> معطّل</>
                                        )}
                                    </div>
                                )}
                            </div>

                            {int.lastTestedAt && (
                                <div className="mb-3 text-xs text-gray-400">
                                    آخر اختبار: {new Date(int.lastTestedAt).toLocaleDateString('ar-SA')}
                                    {int.lastTestOk ? ' ✅' : ' ❌'}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {int.isConfigured ? (
                                    <>
                                        <button
                                            onClick={() => testMutation.mutate(int.type)}
                                            disabled={testMutation.isPending}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-gray-200 rounded-xl hover:bg-gray-50"
                                        >
                                            <Play className="w-3 h-3" />
                                            اختبار
                                        </button>
                                        <button
                                            onClick={() => toggleMutation.mutate(int.type)}
                                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-xl ${int.isActive
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                        >
                                            <Power className="w-3 h-3" />
                                            {int.isActive ? 'تعطيل' : 'تفعيل'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full px-3 py-2 text-xs text-center text-gray-400 bg-gray-50 rounded-xl">
                                        قريباً — سيتم دعم هذا التكامل
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
