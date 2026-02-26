// pages/auth/confirm.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Confirm() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirm = async () => {
      const { access_token, type, error, error_description } = router.query;

      // 如果有错误参数，直接显示错误
      if (error) {
        setStatus('error');
        setMessage(error_description as string || '确认失败');
        return;
      }

      // 如果是访问令牌验证（根据 Supabase 回调类型，可能是 access_token）
      if (access_token && typeof access_token === 'string') {
        try {
          // 使用 access_token 设置会话
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: '', // 如果需要刷新令牌，可以从 query 中获取
          });
          if (error) throw error;
          setStatus('success');
          setMessage('邮箱已成功确认！');
        } catch (err: any) {
          setStatus('error');
          setMessage(err.message || '确认失败');
        }
      } else {
        // 如果没有 access_token，可能是其他情况（如 magic link）
        setStatus('error');
        setMessage('无效的确认链接');
      }
    };

    if (router.isReady) {
      handleConfirm();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-white/70">正在确认邮箱...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">确认成功！</h2>
            <p className="text-white/70 mb-6">{message}</p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              去登录
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2">确认失败</h2>
            <p className="text-white/70 mb-6">{message}</p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
            >
              返回登录
            </Link>
          </>
        )}
      </div>
    </div>
  );
}