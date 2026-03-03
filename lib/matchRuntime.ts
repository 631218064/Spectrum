import { generateDailyClues, type UserProfile } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const MATCH_WEEKLY_LIMIT = 5;

export interface QuotaInfo {
  used: number;
  total: number;
  remaining: number;
  start: string;
  end: string;
}

export function getBeijingNow(base?: Date): Date {
  const now = base ?? new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
}

export function toBeijingDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromBeijingDateTime(date: Date, hour: number, minute = 0, second = 0): Date {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+08:00`);
}

export function getMessageWindowByBeijing(serverTimeIso: string) {
  const nowBj = getBeijingNow(new Date(serverTimeIso));
  const startBj = new Date(nowBj);
  if (startBj.getHours() < 8) startBj.setDate(startBj.getDate() - 1);
  const start = fromBeijingDateTime(startBj, 8, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const key = `${toBeijingDateString(startBj)}_08:00+08`;
  return { startIso: start.toISOString(), endIso: end.toISOString(), key };
}

export function getSecondBeijingEightAfter(createdAtIso: string) {
  const createdBj = getBeijingNow(new Date(createdAtIso));
  const first = new Date(createdBj);
  if (first.getHours() >= 8) first.setDate(first.getDate() + 1);
  const firstEight = fromBeijingDateTime(first, 8, 0, 0);
  const secondEight = new Date(firstEight.getTime() + 24 * 60 * 60 * 1000);
  return secondEight.toISOString();
}

export function getNextUnlockAt(serverTimeIso: string) {
  const nowBj = getBeijingNow(new Date(serverTimeIso));
  const next = new Date(nowBj);
  if (next.getHours() >= 8) next.setDate(next.getDate() + 1);
  return fromBeijingDateTime(next, 8, 0, 0).toISOString();
}

export function isInTrialPeriod(createdAtIso: string, serverTimeIso: string) {
  const trialEndsAt = getSecondBeijingEightAfter(createdAtIso);
  return new Date(serverTimeIso).getTime() < new Date(trialEndsAt).getTime();
}

export async function ensureQuotaWindow(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('matches_used_this_week,last_match_reset')
    .eq('id', userId)
    .single();
  if (error) throw error;

  const now = new Date();
  const resetAt = profile?.last_match_reset ? new Date(profile.last_match_reset) : null;
  const expired = !resetAt || Number.isNaN(resetAt.getTime()) || now.getTime() - resetAt.getTime() >= 7 * 24 * 60 * 60 * 1000;
  if (expired) {
    const nextReset = now.toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ matches_used_this_week: 0, last_match_reset: nextReset })
      .eq('id', userId);
    if (updateError) throw updateError;
    return { used: 0, start: nextReset };
  }
  const used = Number(profile?.matches_used_this_week || 0);
  return { used, start: (resetAt as Date).toISOString() };
}

export async function getQuotaInfo(userId: string): Promise<QuotaInfo> {
  const window = await ensureQuotaWindow(userId);
  const start = new Date(window.start);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    used: window.used,
    total: MATCH_WEEKLY_LIMIT,
    remaining: Math.max(0, MATCH_WEEKLY_LIMIT - window.used),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function incrementQuotaUsage(userId: string) {
  await ensureQuotaWindow(userId);
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('matches_used_this_week')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const used = Number(profile?.matches_used_this_week || 0);
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ matches_used_this_week: used + 1 })
    .eq('id', userId);
  if (updateError) throw updateError;
}

export async function refundQuotaUsage(userId: string) {
  await ensureQuotaWindow(userId);
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('matches_used_this_week')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const used = Math.max(0, Number(profile?.matches_used_this_week || 0) - 1);
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ matches_used_this_week: used })
    .eq('id', userId);
  if (updateError) throw updateError;
}

function toAiProfile(input: any): UserProfile {
  return {
    id: input.id,
    mbti: input.mbti,
    zodiac: input.zodiac,
    pet: input.pet_preference || input.pet,
    interests: input.hobbies || input.interests || [],
    love_views: input.love_views,
    favorite_quote: input.favorite_quote,
    ideal_type_tags: input.ideal_type_tags || [],
  };
}

export async function generateCluesForMatch(matchId: string, userA: any, userB: any) {
  const clues = await generateDailyClues(toAiProfile(userA), toAiProfile(userB));
  const { error } = await supabaseAdmin
    .from('matches')
    .update({
      day1_clues: clues.day1,
      day2_clues: clues.day2,
      day3_clues: clues.day3,
      day4_clues: clues.day4,
    })
    .eq('id', matchId);
  if (error) throw error;
}

export async function createMatchAndClues(initiatorId: string, targetId: string, source: 'invite' | 'realtime' = 'invite') {
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('matches')
    .insert({
      user1_id: initiatorId,
      user2_id: targetId,
      status: 'active',
      current_day: 1,
      match_source: source,
    } as any)
    .select('*')
    .single();
  if (insertError) throw insertError;

  const [a, b] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', initiatorId).single(),
    supabaseAdmin.from('profiles').select('*').eq('id', targetId).single(),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;

  await generateCluesForMatch(inserted.id, a.data, b.data);
  await incrementQuotaUsage(initiatorId);
  return inserted.id as string;
}
