import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loginTranslations } from '@/lib/translations';
import { useGlobalLanguage } from '@/hooks/useGlobalLanguage';

function formatText(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce((acc, [key, value]) => acc.replace(`{${key}}`, String(value)), template);
}

async function resolveVerifiedRoute() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  await fetch('/api/profile/bootstrap', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const profileResp = await fetch('/api/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (profileResp.ok) {
    const profileBody = (await profileResp.json()) as { profileCompleted?: boolean };
    return profileBody.profileCompleted ? '/' : '/register?resume=1&step=1';
  }

  return '/register?resume=1&step=1';
}

export default function VerifyPendingPage() {
  const router = useRouter();
  const { lang, toggleLang } = useGlobalLanguage('zh');
  const login = loginTranslations[lang];
  const email = typeof router.query.email === 'string' ? router.query.email : '';
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const checkingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = window.setInterval(async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const { data } = await supabase.auth.getUser();
        const confirmed = Boolean((data.user as any)?.email_confirmed_at || (data.user as any)?.confirmed_at);
        if (confirmed) {
          const next = await resolveVerifiedRoute();
          if (next) {
            router.replace(next);
          } else if (email) {
            router.replace(`/auth/signin?email=${encodeURIComponent(email)}&verified=1`);
          }
        }
      } finally {
        checkingRef.current = false;
      }
    }, 5000);
    return () => window.clearInterval(poll);
  }, [router]);

  const handleResend = async () => {
    if (!email || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent('/register?resume=1&step=1')}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setSecondsLeft(60);
      setMessage(login.resendSuccess);
    } catch (error: any) {
      setMessage(error?.message || login.resendError);
    } finally {
      setBusy(false);
    }
  };

  const handleCheckVerified = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push(`/auth/signin?email=${encodeURIComponent(email)}&verified=1`);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const confirmed = Boolean((data.user as any)?.email_confirmed_at || (data.user as any)?.confirmed_at);
      if (!confirmed) {
        setMessage(login.unverifiedRedirect);
        return;
      }
      const next = await resolveVerifiedRoute();
      if (next) {
        router.replace(next);
        return;
      }
      router.push(`/auth/signin?email=${encodeURIComponent(email)}&verified=1`);
    } finally {
      setBusy(false);
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

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[520px] rounded-[28px] border border-white/50 bg-white/72 p-8 text-center shadow-[0_18px_52px_rgba(70,88,225,0.12)] backdrop-blur-[10px]">
          <h1 className="mb-3 text-[34px] font-bold tracking-tight text-[#2E3B4E]">Spectrum</h1>
          <p className="mb-3 text-lg font-semibold text-[#2E3B4E]">{login.verifyPendingTitle}</p>
          <p className="mx-auto max-w-[420px] text-sm leading-7 text-[#64748B]">
            {formatText(login.verifyPendingBody, { email: email || 'your inbox' })}
          </p>

          <div className="mx-auto mt-10 flex h-[180px] w-[180px] items-center justify-center rounded-full border border-[#c8d6f0] bg-[radial-gradient(circle,#ffffff_0%,#eef4fb_60%,transparent_100%)]">
            <div className="h-[68px] w-[68px] rounded-full border-[2px] border-[#d5def0] border-t-[#4658E1] animate-spin" />
          </div>

          <p className="mt-8 text-xs text-[#98A3B7]">{login.verifyPendingHint}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCheckVerified}
              disabled={busy}
              className="rounded-full bg-[#4658E1] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {login.checkVerified}
            </button>
            {secondsLeft > 0 ? (
              <span className="text-sm text-[#7E8C9D]">{formatText(login.resendCountdown, { seconds: secondsLeft })}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={busy}
                className="rounded-full border border-[#C7D6EA] bg-white px-5 py-2.5 text-sm font-semibold text-[#4658E1] disabled:opacity-60"
              >
                {login.resend}
              </button>
            )}
          </div>

          {message ? <p className="mt-4 text-sm text-[#64748B]">{message}</p> : null}

          <div className="mt-6 text-sm text-[#7E8C9D]">
            <Link href="/auth/signin" className="hover:underline">
              {login.backToSignIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
