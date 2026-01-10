'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { authService } from '@/lib/api/auth';

export default function TopBar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
  logout();
};

  return (
    <div className="bg-white shadow-sm border-b border-gray-200" dir="rtl">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            مرحباً، {user?.name}
          </h2>
          <p className="text-sm text-gray-500">{user?.role?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
