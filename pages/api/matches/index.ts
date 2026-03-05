import { NextApiRequest, NextApiResponse } from 'next';
import { generateCluesForMatch } from '@/lib/matchRuntime';
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

function parseSnapshot(value: any) {
  const parsed = parseMaybeJson(value);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

function toName(profile: any) {
  return profile?.nickname || profile?.username || 'User';
}

function resolveViewerClues(raw: any, viewerId: string, user1Id: string, user2Id: string, lang: 'zh' | 'en'): string[] {
  const parsed = parseMaybeJson(raw);
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return [];

  const byViewer = parsed[viewerId];
  if (Array.isArray(byViewer)) return byViewer;
  if (byViewer && typeof byViewer === 'object') {
    const byLang = byViewer[lang] || byViewer.zh || byViewer.en;
    if (Array.isArray(byLang)) return byLang;
  }

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

function hasViewerClues(raw: any, viewerId: string, user1Id: string, user2Id: string, lang: 'zh' | 'en') {
  return resolveViewerClues(raw, viewerId, user1Id, user2Id, lang).length > 0;
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
    const lang = req.query.lang === 'en' ? 'en' : 'zh';
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

    // Self-heal: if clues are missing for current viewer, try regenerate once during query.
    for (const match of matchesResp.data || []) {
      const snapshotUser1 = parseSnapshot((match as any).user1_profile_snapshot);
      const snapshotUser2 = parseSnapshot((match as any).user2_profile_snapshot);
      const regenUser1 = snapshotUser1 || (match as any).user1;
      const regenUser2 = snapshotUser2 || (match as any).user2;
      const ready =
        hasViewerClues(match.day1_clues, user.id, match.user1_id, match.user2_id, lang) &&
        hasViewerClues(match.day2_clues, user.id, match.user1_id, match.user2_id, lang) &&
        hasViewerClues(match.day3_clues, user.id, match.user1_id, match.user2_id, lang) &&
        hasViewerClues(match.day4_clues, user.id, match.user1_id, match.user2_id, lang);
      if (ready) continue;
      try {
        const user1 = regenUser1;
        const user2 = regenUser2;
        if (user1?.id && user2?.id) {
          await generateCluesForMatch(match.id, user1, user2);
        }
      } catch (err) {
        console.error('clue self-heal failed', { matchId: match.id, err });
      }
    }

    // Reload matches after self-heal attempt.
    const { data: refreshedMatches, error: refreshError } = await supabaseAdmin
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
      .order('created_at', { ascending: false });
    if (refreshError) throw refreshError;

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

    const matches = (refreshedMatches || []).map((match: any) => {
      const isUser1 = match.user1_id === user.id;
      const snapshotUser1 = parseSnapshot(match.user1_profile_snapshot);
      const snapshotUser2 = parseSnapshot(match.user2_profile_snapshot);
      const resolvedUser1 = snapshotUser1 || match.user1;
      const resolvedUser2 = snapshotUser2 || match.user2;
      const otherUser = isUser1 ? resolvedUser2 : resolvedUser1;
      const createdAt = match.created_at || serverTime;
      const photos = parseMaybeJson(otherUser?.photos) || [];
      const day1 = resolveViewerClues(match.day1_clues, user.id, match.user1_id, match.user2_id, lang);
      const day2 = resolveViewerClues(match.day2_clues, user.id, match.user1_id, match.user2_id, lang);
      const day3 = resolveViewerClues(match.day3_clues, user.id, match.user1_id, match.user2_id, lang);
      const day4 = resolveViewerClues(match.day4_clues, user.id, match.user1_id, match.user2_id, lang);
      const clueStatus = day1.length && day2.length && day3.length && day4.length ? 'ready' : 'pending';
      return {
        id: match.id,
        isDeductedSide: isUser1,
        clueStatus,
        current_day: Number(match.current_day || 1),
        created_at: createdAt,
        trial_ends_at: getSecondBeijingEightAfter(createdAt),
        isInTrialPeriod: isInTrialPeriod(createdAt, serverTime),
        next_unlock_at: match.next_unlock_at || getNextUnlockAt(serverTime),
        match_source: match.match_source || 'invite',
        day1_clues: day1,
        day2_clues: day2,
        day3_clues: day3,
        day4_clues: day4,
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
