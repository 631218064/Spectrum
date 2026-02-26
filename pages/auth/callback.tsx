// pages/auth/callback.tsx
// OAuth 回调处理页面，用于处理第三方登录后的重定向

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error('Callback error:', error.message);
        router.push('/auth/signin?error=callback');
      } else {
        router.push('/'); // 成功则跳转到首页
      }
    };
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-white/50">处理中，请稍候...</p>
      </div>
    </div>
  );
}