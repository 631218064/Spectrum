import { NextApiRequest, NextApiResponse } from 'next';
import { emptyRegistrationFormData, normalizeRegistrationData, type RegistrationFormData, validateRegistrationForm } from '@/lib/registration';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError, logApiWarn } from '@/lib/apiLogger';

export const config = {
  api: {
    bodyParser: true,
  },
};

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

function asArray(value: any): string[] {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  const parsed = parseMaybeJson(value);
  if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed', requestId });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header', requestId });
  const token = authHeader.split(' ')[1];

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    logApiWarn(req, requestId, 'Invalid token in profile API', { authError: authError?.message });
    return res.status(401).json({ error: 'Invalid token', requestId });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) {
      logApiError(req, requestId, error, { userId: user.id, phase: 'profile_get' });
      return res.status(500).json({ error: error.message || 'Failed to load profile', requestId });
    }
    if (!data) return res.status(404).json({ error: 'Profile not found', requestId });

    const location = parseMaybeJson(data.location) || {};
    const photos = asArray(data.photos);
    const hobbies = asArray(data.hobbies || data.interests);
    const valuedTraits = asArray(data.valued_traits);
    const relationshipGoal = asArray(data.relationship_goal);

    const form: RegistrationFormData = {
      ...emptyRegistrationFormData(),
      nickname: data.nickname || data.username || '',
      birthday: data.birthday || '',
      gender: data.gender || '',
      sexual_orientation: data.sexual_orientation || '',
      location: {
        country: location.country || data.country || '',
        ...(location.province || data.province ? { province: location.province || data.province } : {}),
        ...(location.city || data.city ? { city: location.city || data.city } : {}),
      },
      mbti: data.mbti || '',
      zodiac: data.zodiac || '',
      growth_environment: data.growth_environment || '',
      financial_status: data.financial_status || '',
      education: data.education || '',
      pet_preference: data.pet_preference || '',
      hobbies,
      hobbies_custom: data.hobbies_custom || '',
      sound_preference: data.sound_preference || '',
      color_mood: data.color_mood || '',
      color_mood_custom: data.color_mood_custom || '',
      scent_memory: data.scent_memory || '',
      scent_memory_custom: data.scent_memory_custom || '',
      ritual: data.ritual || '',
      ritual_custom: data.ritual_custom || '',
      food_adventure: data.food_adventure || '',
      conflict_reaction: data.conflict_reaction || '',
      recharge_style: data.recharge_style || '',
      mystery_question: data.mystery_question || '',
      mystery_answer: data.mystery_answer || '',
      valued_traits: valuedTraits,
      valued_traits_custom: data.valued_traits_custom || '',
      relationship_goal: relationshipGoal,
      photos,
      contact_info: data.contact_info || data.preferred_contact || '',
      agree_terms: Boolean(data.agree_terms),
    };

    return res.status(200).json({ success: true, form });
  }

  try {
    const incoming = req.body as RegistrationFormData;
    const normalized = normalizeRegistrationData(incoming);
    const validation = validateRegistrationForm(normalized);
    if (!validation.isValid) {
      logApiWarn(req, requestId, 'Profile validation failed', { userId: user.id, errorKeys: Object.keys(validation.errors || {}) });
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors, requestId });
    }

    const location = normalized.location || { country: '' };
    const photos = normalized.photos || [];

    const dbPayload: Record<string, any> = {
      id: user.id,
      username: normalized.nickname,
      nickname: normalized.nickname,
      birthday: normalized.birthday,
      gender: normalized.gender,
      sexual_orientation: normalized.sexual_orientation,
      location,
      country: location.country || null,
      city: location.city || null,
      mbti: normalized.mbti,
      zodiac: normalized.zodiac,
      growth_environment: normalized.growth_environment,
      financial_status: normalized.financial_status,
      education: normalized.education,
      pet_preference: normalized.pet_preference,
      hobbies: normalized.hobbies,
      hobbies_custom: normalized.hobbies_custom || null,
      interests: normalized.hobbies,
      sound_preference: normalized.sound_preference,
      color_mood: normalized.color_mood,
      color_mood_custom: normalized.color_mood_custom || null,
      scent_memory: normalized.scent_memory,
      scent_memory_custom: normalized.scent_memory_custom || null,
      ritual: normalized.ritual,
      ritual_custom: normalized.ritual_custom || null,
      food_adventure: normalized.food_adventure,
      conflict_reaction: normalized.conflict_reaction,
      recharge_style: normalized.recharge_style,
      mystery_question: normalized.mystery_question,
      mystery_answer: normalized.mystery_answer,
      valued_traits: normalized.valued_traits,
      valued_traits_custom: normalized.valued_traits_custom || null,
      relationship_goal: normalized.relationship_goal,
      photos,
      profile_photo_url: photos[0] || null,
      contact_info: normalized.contact_info,
      preferred_contact: normalized.contact_info,
      agree_terms: normalized.agree_terms,
      updated_at: new Date().toISOString(),
    };

    // Schema compatibility fallback:
    // if current database misses some columns (e.g. city/country), remove and retry.
    const payload = { ...dbPayload };
    let data: any = null;
    for (let i = 0; i < 30; i += 1) {
      const resp = await supabaseAdmin.from('profiles').upsert(payload).select('*').single();
      if (!resp.error) {
        data = resp.data;
        break;
      }
      const msg = String(resp.error.message || '');
      const match = msg.match(/Could not find the '([^']+)' column/i);
      if (!match) throw resp.error;
      const missingCol = match[1];
      delete payload[missingCol];
      if (missingCol === 'country' || missingCol === 'city') {
        // if flat location columns don't exist, keep only JSON location object.
        delete payload.country;
        delete payload.city;
      }
    }
    if (!data) throw new Error('Profile save failed due to schema mismatch');
    return res.status(200).json({ success: true, profile: data });
  } catch (err: any) {
    logApiError(req, requestId, err, { userId: user.id, phase: 'profile_post' });
    return res.status(500).json({ error: err.message || 'Profile save failed', requestId });
  }
}
