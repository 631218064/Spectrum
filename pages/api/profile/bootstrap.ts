import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureProfileShell, getAuthorizedUser } from '@/lib/authGate';
import { getRequestId, logApiError } from '@/lib/apiLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', requestId });

  const auth = await getAuthorizedUser(req, requestId);
  if (auth.error === 'Invalid authorization header') {
    return res.status(401).json({ error: auth.error, requestId });
  }
  if (auth.error || !auth.user) {
    return res.status(401).json({ error: 'Invalid token', requestId });
  }

  try {
    const profile = await ensureProfileShell(auth.user.id);
    return res.status(200).json({
      success: true,
      profileCompleted: Boolean((profile as any)?.profile_completed),
    });
  } catch (error: any) {
    logApiError(req, requestId, error, { userId: auth.user.id, phase: 'profile_bootstrap' });
    return res.status(500).json({ error: error?.message || 'Profile bootstrap failed', requestId });
  }
}
