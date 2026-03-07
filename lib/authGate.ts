import type { NextApiRequest } from 'next';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logApiWarn } from '@/lib/apiLogger';
import { inferProfileCompleted } from '@/lib/profileCompletion';

export function getBearerToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

export function isEmailVerified(user: User | null | undefined) {
  const candidate = user as User & { email_confirmed_at?: string | null; confirmed_at?: string | null };
  return Boolean(candidate?.email_confirmed_at || candidate?.confirmed_at);
}

export async function getAuthorizedUser(req: NextApiRequest, requestId: string) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return { token: '', user: null, error: 'Invalid authorization header' as const };

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    logApiWarn(req, requestId, 'Invalid token', { authError: error?.message });
    return { token, user: null, error: 'Invalid token' as const };
  }

  return { token, user, error: null };
}

export async function getProfileStatus(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return {
    exists: Boolean(data?.id),
    profileCompleted: inferProfileCompleted(data),
  };
}

export async function ensureProfileShell(userId: string) {
  const payload: Record<string, unknown> = {
    id: userId,
    profile_completed: false,
    updated_at: new Date().toISOString(),
  };

  for (let i = 0; i < 5; i += 1) {
    const resp = await supabaseAdmin.from('profiles').upsert(payload).select('id,profile_completed').maybeSingle();
    if (!resp.error) return resp.data;
    const missingCol = String(resp.error.message || '').match(/Could not find the '([^']+)' column/i)?.[1];
    if (!missingCol) throw resp.error;
    delete payload[missingCol];
  }

  throw new Error('Failed to ensure profile shell');
}
