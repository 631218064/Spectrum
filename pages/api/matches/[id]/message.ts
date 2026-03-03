import { NextApiRequest, NextApiResponse } from 'next';
import { getMessageWindowByBeijing } from '@/lib/matchRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { id: matchId } = req.query;
  const content = String(req.body?.content || '').trim();
  if (!matchId || typeof matchId !== 'string') return res.status(400).json({ error: 'Missing match id' });
  if (!content) return res.status(400).json({ error: 'Missing content' });
  if (content.length > 200) return res.status(400).json({ error: 'Content too long' });

  try {
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('id,current_day,user1_id,user2_id,status')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();
    if (matchError || !match) return res.status(404).json({ error: 'Match not found or not active' });

    const nowIso = new Date().toISOString();
    const window = getMessageWindowByBeijing(nowIso);
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_id', user.id)
      .gte('created_at', window.startIso)
      .lt('created_at', window.endIso);
    if (countError) throw countError;
    if ((count || 0) >= 1) return res.status(400).json({ error: 'Already sent a message today' });

    const { error: insertError } = await supabaseAdmin.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
      day_number: match.current_day || 1,
      message_window_key: window.key,
    } as any);
    if (insertError) throw insertError;
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Send message failed' });
  }
}
