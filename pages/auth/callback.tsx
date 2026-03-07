import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import AppPageLoader from '@/components/AppPageLoader';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const handleCallback = async () => {
      const nextParam = typeof router.query.next === 'string' ? router.query.next : '';
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData.session) {
        router.push('/auth/signin?error=callback');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const confirmed = Boolean((userData.user as any)?.email_confirmed_at || (userData.user as any)?.confirmed_at);
      if (!confirmed) {
        const email = userData.user?.email || '';
        router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
        return;
      }

      const token = sessionData.session.access_token;
      await fetch('/api/profile/bootstrap', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileResp = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResp.ok) {
        const body = (await profileResp.json()) as { profileCompleted?: boolean };
        router.push(body.profileCompleted ? '/' : nextParam || '/register?resume=1&step=1');
        return;
      }

      router.push(nextParam || '/register?resume=1&step=1');
    };

    handleCallback();
  }, [router, router.isReady, router.query.next]);

  return <AppPageLoader />;
}
