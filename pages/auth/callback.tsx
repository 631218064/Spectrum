import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import AppPageLoader from '@/components/AppPageLoader';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        router.push('/auth/signin?error=callback');
      } else {
        router.push('/');
      }
    };
    handleCallback();
  }, [router]);

  return <AppPageLoader />;
}
