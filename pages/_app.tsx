// pages/_app.tsx
// 全局组件，包裹所有页面，提供 Supabase 会话管理、全局样式等

import '@/styles/globals.css'; // 导入全局样式（需确保路径正确）
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // 如果正在加载，可以显示一个全局加载动画（可选）
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  // 将 session 通过 pageProps 传递给页面组件（也可用 context）
  return <Component {...pageProps} session={session} />;
}