'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
  const response = await authService.login(email, password);

  const user = response.data.user;
  const token = response.data.access_token;

  if (!user || !token) {
    throw new Error('Invalid login response');
  }
    // حفظ التوكن في كوكي (لـ middleware)
  document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
  // حفظ المستخدم في localStorage
  localStorage.setItem('user', JSON.stringify(user));

  setUser(user);

  router.push('/dashboard');
} catch (err: any) {
  console.error(err);
  setError(
    err.response?.data?.message ||
      'فشل تسجيل الدخول'
  );
} finally {
  setLoading(false);
}

};

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      dir="rtl"
    >
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            نظام إدارة مكاتب المحاماة
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            تسجيل الدخول إلى حسابك
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-white bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
