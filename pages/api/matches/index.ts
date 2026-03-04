import { NextApiRequest, NextApiResponse } from 'next';
import { getNextUnlockAt, getQuotaInfo, getSecondBeijingEightAfter, isInTrialPeriod } from '@/lib/matchRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function parseMaybeJson(value: any) {
  if (value == null) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function toName(profile: any) {
  return profile?.nickname || profile?.username || 'User';
}

function resolveViewerClues(raw: any, viewerId: string, user1Id: string, user2Id: string): string[] {
  const parsed = parseMaybeJson(raw);
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return [];

  const byViewer = parsed[viewerId];
  if (Array.isArray(byViewer)) return byViewer;

  // Backward/compat keys if present in historical data.
  if (viewerId === user1Id) {
    if (Array.isArray(parsed.user1)) return parsed.user1;
    if (Array.isArray(parsed.for_user1)) return parsed.for_user1;
  }
  if (viewerId === user2Id) {
    if (Array.isArray(parsed.user2)) return parsed.user2;
    if (Array.isArray(parsed.for_user2)) return parsed.for_user2;
  }
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  try {
    const serverTime = new Date().toISOString();
    const quota = await getQuotaInfo(user.id);
    const nowIso = new Date().toISOString();

    const [notificationsResp, matchesResp, meResp] = await Promise.all([
      supabaseAdmin
        .from('match_requests')
        .select('id,created_at,expires_at,from_user_id,to_user_id,fromUser:profiles!match_requests_from_user_id_fkey(id,nickname,username,profile_photo_url,photos)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('matches')
        .select(
          `
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('profiles').select('id,nickname,username,profile_photo_url,photos').eq('id', user.id).maybeSingle(),
    ]);

    if (notificationsResp.error) throw notificationsResp.error;
    if (matchesResp.error) throw matchesResp.error;
    if (meResp.error) throw meResp.error;

    const notifications = (notificationsResp.data || []).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      expires_at: item.expires_at,
      fromUser: {
        id: item.fromUser?.id || item.from_user_id,
        nickname: toName(item.fromUser),
        profile_photo_url: item.fromUser?.profile_photo_url || parseMaybeJson(item.fromUser?.photos)?.[0] || '',
      },
    }));

    const matches = (matchesResp.data || []).map((match: any) => {
      const isUser1 = match.user1_id === user.id;
      const otherUser = isUser1 ? match.user2 : match.user1;
      const createdAt = match.created_at || serverTime;
      const photos = parseMaybeJson(otherUser?.photos) || [];
      return {
        id: match.id,
        isDeductedSide: isUser1,
        current_day: Number(match.current_day || 1),
        created_at: createdAt,
        trial_ends_at: getSecondBeijingEightAfter(createdAt),
        isInTrialPeriod: isInTrialPeriod(createdAt, serverTime),
        next_unlock_at: match.next_unlock_at || getNextUnlockAt(serverTime),
        match_source: match.match_source || 'invite',
        day1_clues: resolveViewerClues(match.day1_clues, user.id, match.user1_id, match.user2_id),
        day2_clues: resolveViewerClues(match.day2_clues, user.id, match.user1_id, match.user2_id),
        day3_clues: resolveViewerClues(match.day3_clues, user.id, match.user1_id, match.user2_id),
        day4_clues: resolveViewerClues(match.day4_clues, user.id, match.user1_id, match.user2_id),
        day5_unlocked_at: match.day5_unlocked_at || null,
        otherUser: {
          id: otherUser?.id || '',
          nickname: toName(otherUser),
          mbti: otherUser?.mbti || '',
          sexual_orientation: otherUser?.sexual_orientation || '',
          photos,
          profile_photo_url: otherUser?.profile_photo_url || photos[0] || '',
          contact_info: otherUser?.contact_info || otherUser?.preferred_contact || '',
        },
      };
    });

    return res.status(200).json({
      serverTime,
      quota,
      me: {
        id: meResp.data?.id || user.id,
        nickname: toName(meResp.data),
        profile_photo_url: meResp.data?.profile_photo_url || parseMaybeJson(meResp.data?.photos)?.[0] || '',
        photos: parseMaybeJson(meResp.data?.photos) || [],
      },
      notifications,
      matches,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Load matches failed' });
  }
}
