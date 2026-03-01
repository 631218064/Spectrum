import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translations } from '@/lib/translations';

const MatchingDashboard = dynamic(() => import('@/components/MatchingDashboard'), {
  ssr: false,
});

type View = 'landing' | 'dashboard';

const LanguageToggle = ({ lang, setLang, t }: any) => (
  <button
    onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
    className="flex items-center gap-2 rounded-full border border-pink-500/30 bg-black/20 px-3 py-1 transition-all hover:bg-pink-500/10"
  >
    <Globe size={14} className="text-pink-400" />
    <span className="text-xs font-medium tracking-widest text-pink-100">{t.toggleLang}</span>
  </button>
);

export default function Home({ session: initialSession }: any) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [view, setView] = useState<View>('landing');
  const [session, setSession] = useState(initialSession);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!session?.user?.id) {
      setView('landing');
      setLoading(false);
      return;
    }

    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      // 资料不存在时，直接进入新注册页。
      if (error || !data) {
        router.replace('/register');
        return;
      }

      setView('dashboard');
      setLoading(false);
    };

    checkProfile();
  }, [router, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500" />
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] p-6 text-white">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-pink-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/10 blur-[120px]" />

        <header className="absolute left-0 right-0 top-8 mx-auto flex w-full max-w-6xl items-center justify-between px-8">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-2xl font-black tracking-tighter text-transparent">
            {t.brand}
          </div>
          <LanguageToggle lang={lang} setLang={setLang} t={t} />
        </header>

        <div className="z-10 space-y-8 text-center">
          <h1 className="text-5xl font-light tracking-tight md:text-7xl">
            {t.tagline.split(',')[0]}
            <br />
            <span className="font-bold italic text-pink-500">{t.tagline.split(',')[1]}</span>
          </h1>
          <button
            onClick={() => router.push('/auth/signin')}
            className="group relative overflow-hidden rounded-full bg-white px-10 py-4 font-bold text-black transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative z-10 transition-colors group-hover:text-white">{t.getStarted}</span>
          </button>
        </div>
      </div>
    );
  }

  return <MatchingDashboard lang={lang} onToggleLang={() => setLang((prev) => (prev === 'en' ? 'zh' : 'en'))} />;
}
