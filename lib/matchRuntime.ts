import { generateDailyClues, translateClues, type UserProfile } from '@/lib/ai';
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

function parseMaybeJson(value: any) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asStringArray(value: any): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
  return [];
}

function toAiProfile(input: any): UserProfile {
  const location = parseMaybeJson(input.location);
  const hobbies = asStringArray(input.hobbies || input.interests);
  const valuedTraits = asStringArray(input.valued_traits);
  const relationshipGoal = asStringArray(input.relationship_goal);
  const photos = asStringArray(input.photos);

  return {
    id: input.id,
    nickname: input.nickname || input.username || '',
    birthday: input.birthday || '',
    gender: input.gender || '',
    sexual_orientation: input.sexual_orientation || '',
    location: {
      country: location?.country || input.country || '',
      province: location?.province || input.province || '',
      city: location?.city || input.city || '',
    },
    mbti: input.mbti,
    zodiac: input.zodiac,
    growth_environment: input.growth_environment || '',
    financial_status: input.financial_status || '',
    education: input.education || '',
    pet_preference: input.pet_preference || input.pet || '',
    hobbies,
    hobbies_custom: input.hobbies_custom || '',
    sound_preference: input.sound_preference || '',
    color_mood: input.color_mood || '',
    color_mood_custom: input.color_mood_custom || '',
    scent_memory: input.scent_memory || '',
    scent_memory_custom: input.scent_memory_custom || '',
    ritual: input.ritual || '',
    ritual_custom: input.ritual_custom || '',
    food_adventure: input.food_adventure || '',
    conflict_reaction: input.conflict_reaction || '',
    recharge_style: input.recharge_style || '',
    mystery_question: input.mystery_question || '',
    mystery_answer: input.mystery_answer || '',
    valued_traits: valuedTraits,
    valued_traits_custom: input.valued_traits_custom || '',
    relationship_goal: relationshipGoal,
    photos,
    contact_info: input.contact_info || input.preferred_contact || '',

    // Keep compatibility for template fallback.
    pet: input.pet_preference || input.pet,
    interests: hobbies,
    love_views: input.love_views,
    favorite_quote: input.favorite_quote,
    ideal_type_tags: asStringArray(input.ideal_type_tags),
  };
}

function buildPerUserClues(
  userAId: string,
  userBId: string,
  cluesForAZh: string[],
  cluesForAEn: string[],
  cluesForBZh: string[],
  cluesForBEn: string[]
) {
  return {
    [userAId]: { zh: cluesForAZh, en: cluesForAEn },
    [userBId]: { zh: cluesForBZh, en: cluesForBEn },
  };
}

export async function generateCluesForMatch(matchId: string, userA: any, userB: any) {
  const aiA = toAiProfile(userA);
  const aiB = toAiProfile(userB);
  // userA sees clues generated from userB profile; userB sees clues generated from userA profile.
  const [cluesForUserAZh, cluesForUserBZh] = await Promise.all([
    generateDailyClues(aiA, aiB, 'zh'),
    generateDailyClues(aiB, aiA, 'zh'),
  ]);
  const [cluesForUserAEn, cluesForUserBEn] = await Promise.all([
    translateClues(cluesForUserAZh, 'en'),
    translateClues(cluesForUserBZh, 'en'),
  ]);

  const { error } = await supabaseAdmin
    .from('matches')
    .update({
      day1_clues: buildPerUserClues(
        userA.id,
        userB.id,
        cluesForUserAZh.day1,
        cluesForUserAEn.day1,
        cluesForUserBZh.day1,
        cluesForUserBEn.day1
      ),
      day2_clues: buildPerUserClues(
        userA.id,
        userB.id,
        cluesForUserAZh.day2,
        cluesForUserAEn.day2,
        cluesForUserBZh.day2,
        cluesForUserBEn.day2
      ),
      day3_clues: buildPerUserClues(
        userA.id,
        userB.id,
        cluesForUserAZh.day3,
        cluesForUserAEn.day3,
        cluesForUserBZh.day3,
        cluesForUserBEn.day3
      ),
      day4_clues: buildPerUserClues(
        userA.id,
        userB.id,
        cluesForUserAZh.day4,
        cluesForUserAEn.day4,
        cluesForUserBZh.day4,
        cluesForUserBEn.day4
      ),
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
