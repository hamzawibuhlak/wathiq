'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { isClient, canManageCases, canManageClients, canManageUsers } from '@/lib/utils/permissions';

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const navigation = [
    {
      name: 'لوحة التحكم',
      href: isClient(user) ? '/client/dashboard' : '/dashboard',
      icon: '📊',
      show: true,
    },
    {
      name: 'القضايا',
      href: '/cases',
      icon: '⚖️',
      show: !isClient(user),
    },
    {
      name: 'قضاياي',
      href: '/client/cases',
      icon: '⚖️',
      show: isClient(user),
    },
    {
      name: 'العملاء',
      href: '/clients',
      icon: '👥',
      show: canManageClients(user),
    },
    {
      name: 'الدردشة',
      href: '/chat',
      icon: '💬',
      show: true,
    },
    {
      name: 'المستخدمون',
      href: '/users',
      icon: '👤',
      show: canManageUsers(user),
    },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen" dir="rtl">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">نظام المحاماة</h1>
        <nav className="space-y-2">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>
      </div>
    </div>
  );
}
