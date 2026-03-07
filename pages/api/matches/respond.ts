import { NextApiRequest, NextApiResponse } from 'next';
import { createMatchAndClues } from '@/lib/matchRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError } from '@/lib/apiLogger';
import { getAuthorizedUser, getProfileStatus, isEmailVerified } from '@/lib/authGate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', requestId });

  const auth = await getAuthorizedUser(req, requestId);
  if (auth.error === 'Invalid authorization header') {
    return res.status(401).json({ error: auth.error, requestId });
  }
  const user = auth.user;
  if (auth.error || !user) {
    return res.status(401).json({ error: 'Invalid token', requestId });
  }

  const { requestId: matchRequestId, accept } = req.body || {};
  if (!matchRequestId || typeof accept !== 'boolean') return res.status(400).json({ error: 'Missing requestId or accept', requestId });

  try {
    if (!isEmailVerified(user)) {
      return res.status(403).json({ error: 'Email not verified', requestId });
    }
    const status = await getProfileStatus(user.id);
    if (!status.profileCompleted) {
      return res.status(403).json({ error: 'Profile not completed', requestId });
    }

    const { data: request, error } = await supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('id', matchRequestId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single();
    if (error || !request) return res.status(404).json({ error: 'Request not found', requestId });

    if (!accept) {
      const ignoredAt = new Date().toISOString();
      const { error: ignoreLogError } = await supabaseAdmin.from('ignored_invitations').insert({
        inviter_id: request.from_user_id,
        invitee_id: request.to_user_id,
        ignored_at: ignoredAt,
      });
      if (ignoreLogError) {
        logApiError(req, requestId, ignoreLogError, { userId: user.id, phase: 'ignored_invitations_insert' });
        return res.status(500).json({ error: ignoreLogError.message || 'Failed to record ignore event', requestId });
      }
      await supabaseAdmin.from('match_requests').update({ status: 'expired' }).eq('id', matchRequestId);
      return res.status(200).json({ status: 'rejected' });
    }

    const { matchId, cluesReady } = await createMatchAndClues(request.from_user_id, request.to_user_id, 'invite');
    await supabaseAdmin.from('match_requests').delete().eq('id', requestId);
    return res.status(200).json({ status: 'matched', matchId, cluesReady });
  } catch (err: any) {
    logApiError(req, requestId, err, { userId: user.id });
    return res.status(500).json({ error: err.message || 'Respond failed', requestId });
  }
}
