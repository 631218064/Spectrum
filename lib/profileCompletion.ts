import { emptyRegistrationFormData, type RegistrationFormData, validateRegistrationForm } from '@/lib/registration';

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

export function buildRegistrationFormFromProfileRow(data: any): RegistrationFormData {
  const location = parseMaybeJson(data?.location) || {};
  const photos = asArray(data?.photos);
  const hobbies = asArray(data?.hobbies || data?.interests);
  const valuedTraits = asArray(data?.valued_traits);
  const relationshipGoal = asArray(data?.relationship_goal);

  return {
    ...emptyRegistrationFormData(),
    nickname: data?.nickname || data?.username || '',
    birthday: data?.birthday || '',
    gender: data?.gender || '',
    sexual_orientation: data?.sexual_orientation || '',
    location: {
      country: location.country || data?.country || '',
      ...(location.province || data?.province ? { province: location.province || data?.province } : {}),
      ...(location.city || data?.city ? { city: location.city || data?.city } : {}),
    },
    mbti: data?.mbti || '',
    zodiac: data?.zodiac || '',
    growth_environment: data?.growth_environment || '',
    financial_status: data?.financial_status || '',
    education: data?.education || '',
    pet_preference: data?.pet_preference || '',
    hobbies,
    hobbies_custom: data?.hobbies_custom || '',
    sound_preference: data?.sound_preference || '',
    color_mood: data?.color_mood || '',
    color_mood_custom: data?.color_mood_custom || '',
    scent_memory: data?.scent_memory || '',
    scent_memory_custom: data?.scent_memory_custom || '',
    ritual: data?.ritual || '',
    ritual_custom: data?.ritual_custom || '',
    food_adventure: data?.food_adventure || '',
    conflict_reaction: data?.conflict_reaction || '',
    recharge_style: data?.recharge_style || '',
    valued_traits: valuedTraits,
    valued_traits_custom: data?.valued_traits_custom || '',
    relationship_goal: relationshipGoal,
    photos,
    contact_info: data?.contact_info || data?.preferred_contact || '',
    agree_terms: Boolean(data?.agree_terms),
  };
}

export function inferProfileCompleted(data: any) {
  if (!data) return false;
  if (data.profile_completed === true) return true;
  const form = buildRegistrationFormFromProfileRow(data);
  return validateRegistrationForm(form).isValid;
}
