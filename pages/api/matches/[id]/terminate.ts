import { NextApiRequest, NextApiResponse } from 'next';
import { isInTrialPeriod, refundQuotaUsage } from '@/lib/matchRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError } from '@/lib/apiLogger';
import { getAuthorizedUser, getProfileStatus, isEmailVerified } from '@/lib/authGate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed', requestId });

  const auth = await getAuthorizedUser(req, requestId);
  if (auth.error === 'Invalid authorization header') {
    return res.status(401).json({ error: auth.error, requestId });
  }
  const user = auth.user;
  if (auth.error || !user) {
    return res.status(401).json({ error: 'Invalid token', requestId });
  }

  const { id: matchId } = req.query;
  if (!matchId || typeof matchId !== 'string') return res.status(400).json({ error: 'Missing match id', requestId });

  try {
    if (!isEmailVerified(user)) {
      return res.status(403).json({ error: 'Email not verified', requestId });
    }
    const status = await getProfileStatus(user.id);
    if (!status.profileCompleted) {
      return res.status(403).json({ error: 'Profile not completed', requestId });
    }

    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();
    if (matchError || !match) return res.status(404).json({ error: 'Match not found or not active', requestId });

    const nowIso = new Date().toISOString();
    const inTrial = isInTrialPeriod(match.created_at, nowIso);
    if (inTrial && match.user1_id) {
      await refundQuotaUsage(match.user1_id);
    }

    const { error: updateError } = await supabaseAdmin
      .from('matches')
      .update({
        status: 'terminated',
        terminated_by: user.id,
        terminated_at: nowIso,
      })
      .eq('id', matchId);
    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      refunded: inTrial,
      refundedUserId: inTrial ? match.user1_id : null,
    });
  } catch (err: any) {
    logApiError(req, requestId, err, { userId: user.id, matchId });
    return res.status(500).json({ error: err.message || 'Terminate failed', requestId });
  }
}
