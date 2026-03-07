import { NextApiRequest, NextApiResponse } from 'next';
import { createMatchAndClues, getQuotaInfo } from '@/lib/matchRuntime';
import { pickTopCandidate, type ProfileForMatch } from '@/lib/matchingRulesEngine';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError } from '@/lib/apiLogger';
import { getAuthorizedUser, getProfileStatus, isEmailVerified } from '@/lib/authGate';

function extractOtherUserId(row: any, me: string) {
  if (row.user1_id && row.user2_id) return row.user1_id === me ? row.user2_id : row.user1_id;
  if (row.from_user_id && row.to_user_id) return row.from_user_id === me ? row.to_user_id : row.from_user_id;
  if (row.inviter_id && row.invitee_id) return row.inviter_id === me ? row.invitee_id : row.inviter_id;
  return '';
}

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

  try {
    if (!isEmailVerified(user)) {
      return res.status(403).json({ error: 'Email not verified', requestId });
    }
    const status = await getProfileStatus(user.id);
    if (!status.profileCompleted) {
      return res.status(403).json({ error: 'Profile not completed', requestId });
    }

    const quota = await getQuotaInfo(user.id);
    if (quota.remaining <= 0) {
      return res.status(400).json({ error: 'Weekly quota reached', requestId });
    }

    const { data: me, error: meError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (meError || !me) return res.status(400).json({ error: 'Profile not found', requestId });

    const nowIso = new Date().toISOString();
    const recent30Iso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recent7Iso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [allProfilesResp, activeResp, pendingResp, terminatedResp, reverseResp, ignoredResp] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').neq('id', user.id),
      supabaseAdmin
        .from('matches')
        .select('user1_id,user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active'),
      supabaseAdmin
        .from('match_requests')
        .select('from_user_id,to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'pending')
        .gt('expires_at', nowIso),
      supabaseAdmin
        .from('matches')
        .select('user1_id,user2_id,terminated_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'terminated')
        .gte('terminated_at', recent30Iso),
      supabaseAdmin
        .from('match_requests')
        .select('id,from_user_id,to_user_id,status')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', nowIso),
      supabaseAdmin
        .from('ignored_invitations')
        .select('inviter_id,invitee_id,ignored_at')
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .gte('ignored_at', recent7Iso),
    ]);

    if (allProfilesResp.error) throw allProfilesResp.error;
    if (activeResp.error) throw activeResp.error;
    if (pendingResp.error) throw pendingResp.error;
    if (terminatedResp.error) throw terminatedResp.error;
    if (reverseResp.error) throw reverseResp.error;
    if (ignoredResp.error) throw ignoredResp.error;

    const blocked = new Set<string>();
    for (const row of activeResp.data || []) blocked.add(extractOtherUserId(row, user.id));
    for (const row of pendingResp.data || []) blocked.add(extractOtherUserId(row, user.id));
    for (const row of terminatedResp.data || []) blocked.add(extractOtherUserId(row, user.id));
    for (const row of ignoredResp.data || []) blocked.add(extractOtherUserId(row, user.id));
    blocked.delete('');

    const candidates = ((allProfilesResp.data || []) as ProfileForMatch[]).filter((p) => p.id !== user.id && !blocked.has(p.id));
    const top = pickTopCandidate(me as ProfileForMatch, candidates);
    if (!top) return res.status(404).json({ error: 'No new matches available', requestId });

    const reverse = (reverseResp.data || []).find((r) => r.from_user_id === top.profile.id);
    if (reverse) {
      const { matchId, cluesReady } = await createMatchAndClues(reverse.from_user_id, reverse.to_user_id, 'realtime');
      await supabaseAdmin.from('match_requests').delete().eq('id', reverse.id);
      return res.status(200).json({ status: 'matched', matchId, cluesReady, candidateId: top.profile.id, score: top.score });
    }

    const { error: insertError } = await supabaseAdmin
      .from('match_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: top.profile.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    if (insertError) throw insertError;

    return res.status(200).json({
      status: 'pending',
      candidateId: top.profile.id,
      score: top.score,
    });
  } catch (err: any) {
    logApiError(req, requestId, err, { userId: user.id });
    return res.status(500).json({ error: err.message || 'Request failed', requestId });
  }
}
