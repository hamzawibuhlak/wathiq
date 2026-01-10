'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

export default function TopBar() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const logout = () => {
  document.cookie = 'access_token=; Max-Age=0; path=/';
  localStorage.removeItem('user');
  setUser(null);
  router.replace('/login');
};


  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6">
      <span>مرحبًا، {user?.name}</span>

      <button onClick={logout}>
  تسجيل الخروج
</button>

    </div>
  );
}
