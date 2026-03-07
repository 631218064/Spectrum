import { NextApiRequest, NextApiResponse } from 'next';
import { normalizeRegistrationData, type RegistrationFormData, validateRegistrationForm } from '@/lib/registration';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError, logApiWarn } from '@/lib/apiLogger';
import { getBearerToken } from '@/lib/authGate';
import { buildRegistrationFormFromProfileRow, inferProfileCompleted } from '@/lib/profileCompletion';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed', requestId });

  const token = getBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Invalid authorization header', requestId });

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

    const form: RegistrationFormData = buildRegistrationFormFromProfileRow(data);
    return res.status(200).json({ success: true, form, profileCompleted: inferProfileCompleted(data) });
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
      valued_traits: normalized.valued_traits,
      valued_traits_custom: normalized.valued_traits_custom || null,
      relationship_goal: normalized.relationship_goal,
      photos,
      profile_photo_url: photos[0] || null,
      contact_info: normalized.contact_info,
      preferred_contact: normalized.contact_info,
      agree_terms: normalized.agree_terms,
      profile_completed: true,
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
