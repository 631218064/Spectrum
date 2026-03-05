import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loginTranslations } from '@/lib/translations';
import { useGlobalLanguage } from '@/hooks/useGlobalLanguage';

export default function SignIn() {
  const router = useRouter();
  const { lang, toggleLang } = useGlobalLanguage('zh');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = loginTranslations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      setError(err?.message || login.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#F5F0E8_0%,#E8F0F8_100%)] text-[#2E3B4E]">
      <button
        onClick={toggleLang}
        className="absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#2E3B4E] backdrop-blur"
      >
        <Globe size={14} />
        <span>{login.toggleLang}</span>
      </button>

      <div className="pointer-events-none absolute inset-0 z-0">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className="login-particle absolute block h-[4px] w-[4px] rounded-full bg-[#A8D5E5]/30"
            style={
              {
                left: `${8 + ((i * 13) % 84)}%`,
                top: `${6 + ((i * 17) % 86)}%`,
                animationDelay: `${(i % 7) * 0.7}s`,
                animationDuration: `${6 + (i % 5)}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-[90%] max-w-[400px] rounded-[24px] border border-white/50 bg-white/70 p-8 shadow-[0_8px_32px_rgba(70,88,225,0.1)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] max-sm:p-6">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block">
              <h1 className="login-logo text-[32px] font-bold tracking-[1px] max-sm:text-[28px]">Spectrum</h1>
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2E3B4E]">{login.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={login.emailPlaceholder}
                className="login-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#2E3B4E]">{login.passwordLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={login.passwordPlaceholder}
                  className="login-input w-full pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8C9D] hover:text-[#4658E1]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit w-full rounded-[40px] bg-[#4658E1] py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? login.processing : login.signIn}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#7E8C9D]">
            {login.noAccount}{' '}
            <Link href="/register" className="text-[#FF9AA2] hover:underline">
              {login.signUp}
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        .login-logo {
          background: linear-gradient(90deg, #d1599a, #9d61ec);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .login-input {
          border: 1px solid #e0e7ed;
          border-radius: 12px;
          background: #ffffff;
          height: 48px;
          color: #2e3b4e;
          font-size: 16px;
          padding: 0 16px;
          box-shadow: none;
          outline: none;
        }
        .login-input::placeholder {
          color: #d3d3d3;
          font-size: 16px;
        }
        .login-input:focus {
          border-color: #4658e1;
          box-shadow: 0 0 0 3px rgba(70, 88, 225, 0.1);
        }
        .login-submit {
          transition: all 0.2s ease;
        }
        .login-submit:hover:not(:disabled) {
          background: #3a4bc7;
          box-shadow: 0 4px 16px rgba(70, 88, 225, 0.4);
          transform: scale(1.02);
        }
        .login-submit:active:not(:disabled) {
          background: #2f44b5;
          transform: scale(1);
          box-shadow: none;
        }
        .login-particle {
          animation-name: floatParticle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @keyframes floatParticle {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.18;
          }
          50% {
            transform: translateY(-9px);
            opacity: 0.32;
          }
        }
      `}</style>
    </div>
  );
}
