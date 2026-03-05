// pages/_app.tsx
// 鍏ㄥ眬缁勪欢锛屽寘瑁规墍鏈夐〉闈紝鎻愪緵 Supabase 浼氳瘽绠＄悊銆佸叏灞€鏍峰紡绛?

import '@/styles/globals.css'; // 瀵煎叆鍏ㄥ眬鏍峰紡锛堥渶纭繚璺緞姝ｇ‘锛?
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppProps } from 'next/app';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import AppPageLoader from '@/components/AppPageLoader';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 鑾峰彇鍒濆浼氳瘽
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 鐩戝惉璁よ瘉鐘舵€佸彉鍖?
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // 濡傛灉姝ｅ湪鍔犺浇锛屽彲浠ユ樉绀轰竴涓叏灞€鍔犺浇鍔ㄧ敾锛堝彲閫夛級
  if (loading) {
    return <AppPageLoader />;
  }

  // 灏?session 閫氳繃 pageProps 浼犻€掔粰椤甸潰缁勪欢锛堜篃鍙敤 context锛?
  return <Component {...pageProps} session={session} />;
}
