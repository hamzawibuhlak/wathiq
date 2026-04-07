'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { casesService } from '@/lib/api/cases';
import type { Case } from '@/types';

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await casesService.getAll();
      setCases(data);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.status === 'Open' || c.status === 'In Progress').length;
  const closedCases = cases.filter((c) => c.status === 'Closed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي القضايا</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {totalCases}
                    </p>
                  </div>
                  <div className="text-4xl">⚖️</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">القضايا النشطة</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {activeCases}
                    </p>
                  </div>
                  <div className="text-4xl">📂</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">القضايا المغلقة</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {closedCases}
                    </p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            </div>

            {/* Recent Cases */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  القضايا الأخيرة
                </h2>
              </div>
              <div className="p-6">
                {cases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    لا توجد قضايا حالياً
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cases.slice(0, 5).map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {caseItem.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {caseItem.description?.substring(0, 100)}...
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full ${
                            caseItem.status === 'Open'
                              ? 'bg-blue-100 text-blue-800'
                              : caseItem.status === 'In Progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {caseItem.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
