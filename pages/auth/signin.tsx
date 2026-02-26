// pages/auth/signin.tsx
// 登录/注册页面（使用 Supabase Auth）

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import { translations } from '@/lib/translations';
import { Globe, Mail, Lock } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const [lang, setLang] = useState<'en'|'zh'>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true=登录, false=注册
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/'); // 登录成功后跳转到首页
      } else {
        // 注册
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // 注册成功后通常需要验证邮箱，这里可提示用户检查邮箱
        alert('注册成功！请检查邮箱验证。');
        setIsLogin(true); // 切换到登录
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      {/* 语言切换 */}
      <button
        onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
        className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-black/20 hover:bg-pink-500/10"
      >
        <Globe size={14} className="text-pink-400" />
        <span className="text-xs font-medium tracking-widest text-pink-100">{lang === 'en' ? '中文' : 'EN'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {t.brand}
          </h1>
          <p className="text-white/50 text-sm mt-2">{t.tagline}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          {/* 切换登录/注册 */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                isLogin ? 'bg-pink-500 text-white' : 'text-white/50'
              }`}
            >
              {lang === 'en' ? 'Sign In' : '登录'}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                !isLogin ? 'bg-pink-500 text-white' : 'text-white/50'
              }`}
            >
              {lang === 'en' ? 'Sign Up' : '注册'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/50 flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-pink-500 text-white"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/50 flex items-center gap-2">
                <Lock size={14} /> {lang === 'en' ? 'Password' : '密码'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-pink-500 text-white"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? (lang === 'en' ? 'Processing...' : '处理中...')
                : isLogin
                ? (lang === 'en' ? 'Sign In' : '登录')
                : (lang === 'en' ? 'Sign Up' : '注册')}
            </button>
          </form>

          {!isLogin && (
            <p className="text-xs text-white/30 text-center mt-4">
              {lang === 'en'
                ? 'By signing up, you agree to our Terms of Service.'
                : '注册即表示同意我们的服务条款。'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}