import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AppPageLoader from '@/components/AppPageLoader';

export default function Confirm() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConfirm = async () => {
      const { access_token, error, error_description } = router.query;

      if (error) {
        setStatus('error');
        setMessage((error_description as string) || '确认失败');
        return;
      }

      if (access_token && typeof access_token === 'string') {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: '',
          });
          if (sessionError) throw sessionError;
          setStatus('success');
          setMessage('邮箱已成功确认。');
        } catch (err: any) {
          setStatus('error');
          setMessage(err?.message || '确认失败');
        }
      } else {
        setStatus('error');
        setMessage('无效的确认链接。');
      }
    };

    if (router.isReady) {
      handleConfirm();
    }
  }, [router.isReady, router.query]);

  if (status === 'loading') {
    return <AppPageLoader />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl text-center">
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">确认成功</h2>
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
            <div className="text-red-500 text-5xl mb-4">✕</div>
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
