export type Language = 'zh' | 'en';

export interface LocationValue {
  country: string;
  province?: string;
  city?: string;
}

export interface RegistrationFormData {
  nickname: string;
  birthday: string;
  gender: string;
  sexual_orientation: string;
  location: LocationValue;
  mbti: string;
  zodiac: string;
  growth_environment: string;
  financial_status: string;
  education: string;
  pet_preference: string;
  hobbies: string[];
  hobbies_custom: string;
  sound_preference: string;
  color_mood: string;
  color_mood_custom: string;
  scent_memory: string;
  scent_memory_custom: string;
  ritual: string;
  ritual_custom: string;
  food_adventure: string;
  conflict_reaction: string;
  recharge_style: string;
  mystery_question: string;
  mystery_answer: string;
  valued_traits: string[];
  valued_traits_custom: string;
  relationship_goal: string[];
  photos: string[];
  contact_info: string;
  agree_terms: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const HOBBIES_MAX = 5;
export const VALUED_TRAITS_MAX = 3;
export const RELATIONSHIP_GOAL_MAX = 2;
export const PHOTOS_MIN_COUNT = 1;
export const PHOTOS_MAX_COUNT = 10;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
export const PHOTO_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

const REQUIRED_STRING_FIELDS: Array<keyof RegistrationFormData> = [
  'nickname',
  'birthday',
  'gender',
  'sexual_orientation',
  'mbti',
  'zodiac',
  'growth_environment',
  'financial_status',
  'education',
  'pet_preference',
  'sound_preference',
  'color_mood',
  'scent_memory',
  'ritual',
  'food_adventure',
  'conflict_reaction',
  'recharge_style',
  'mystery_question',
  'mystery_answer',
  'contact_info',
];

export function emptyRegistrationFormData(): RegistrationFormData {
  return {
    nickname: '',
    birthday: '',
    gender: '',
    sexual_orientation: '',
    location: { country: '' },
    mbti: '',
    zodiac: '',
    growth_environment: '',
    financial_status: '',
    education: '',
    pet_preference: '',
    hobbies: [],
    hobbies_custom: '',
    sound_preference: '',
    color_mood: '',
    color_mood_custom: '',
    scent_memory: '',
    scent_memory_custom: '',
    ritual: '',
    ritual_custom: '',
    food_adventure: '',
    conflict_reaction: '',
    recharge_style: '',
    mystery_question: '',
    mystery_answer: '',
    valued_traits: [],
    valued_traits_custom: '',
    relationship_goal: [],
    photos: [],
    contact_info: '',
    agree_terms: false,
  };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function getBeijingNow(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
}

function parseIsoDateParts(input: string): { year: number; month: number; day: number } | null {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function isPastDateInBeijing(input: string): boolean {
  if (!parseIsoDateParts(input)) return false;
  const todayBj = getBeijingNow();
  const todayStr = `${todayBj.getFullYear()}-${String(todayBj.getMonth() + 1).padStart(2, '0')}-${String(todayBj.getDate()).padStart(2, '0')}`;
  return input < todayStr;
}

export function getAgeInBeijing(input: string): number | null {
  const birth = parseIsoDateParts(input);
  if (!birth) return null;
  const now = getBeijingNow();
  let age = now.getFullYear() - birth.year;
  const monthDiff = now.getMonth() + 1 - birth.month;
  const dayDiff = now.getDate() - birth.day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function isAdultInBeijing(input: string): boolean {
  const age = getAgeInBeijing(input);
  return age !== null && age >= 18;
}

export function normalizeRegistrationData(input: RegistrationFormData): RegistrationFormData {
  return {
    ...input,
    nickname: input.nickname.trim(),
    birthday: input.birthday.trim(),
    location: {
      country: input.location.country.trim(),
      ...(input.location.province ? { province: input.location.province.trim() } : {}),
      ...(input.location.city ? { city: input.location.city.trim() } : {}),
    },
    hobbies_custom: input.hobbies_custom.trim(),
    color_mood_custom: input.color_mood_custom.trim(),
    scent_memory_custom: input.scent_memory_custom.trim(),
    ritual_custom: input.ritual_custom.trim(),
    mystery_question: input.mystery_question.trim(),
    mystery_answer: input.mystery_answer.trim(),
    valued_traits_custom: input.valued_traits_custom.trim(),
    contact_info: input.contact_info.trim(),
  };
}

export function validateRegistrationForm(input: RegistrationFormData): ValidationResult {
  const data = normalizeRegistrationData(input);
  const errors: Record<string, string> = {};

  for (const key of REQUIRED_STRING_FIELDS) {
    if (!hasText(data[key] as string)) {
      errors[key] = 'required';
    }
  }

  if (!data.agree_terms) {
    errors.agree_terms = 'required';
  }

  if (!hasText(data.location.country)) {
    errors.location = 'required';
  }

  const isChina = data.location.country === 'CN';
  if (isChina) {
    if (!hasText(data.location.province || '')) errors.location_province = 'required';
    if (!hasText(data.location.city || '')) errors.location_city = 'required';
  } else if (data.location.province || data.location.city) {
    errors.location = 'invalid';
  }

  if (data.nickname.length < 1 || data.nickname.length > 20) {
    errors.nickname = 'length';
  }

  if (!isPastDateInBeijing(data.birthday)) {
    errors.birthday = 'past_date';
  } else if (!isAdultInBeijing(data.birthday)) {
    errors.birthday = 'adult_only';
  }

  if (data.hobbies.length < 1 || data.hobbies.length > HOBBIES_MAX) {
    errors.hobbies = 'size';
  }

  if (data.hobbies.includes('custom') && !hasText(data.hobbies_custom)) {
    errors.hobbies_custom = 'required';
  }

  if (data.color_mood === 'custom' && !hasText(data.color_mood_custom)) {
    errors.color_mood_custom = 'required';
  }

  if (data.scent_memory === 'custom' && !hasText(data.scent_memory_custom)) {
    errors.scent_memory_custom = 'required';
  }

  if (data.ritual === 'custom' && !hasText(data.ritual_custom)) {
    errors.ritual_custom = 'required';
  }

  if (data.valued_traits.length < 1 || data.valued_traits.length > VALUED_TRAITS_MAX) {
    errors.valued_traits = 'size';
  }

  if (data.valued_traits.includes('custom') && !hasText(data.valued_traits_custom)) {
    errors.valued_traits_custom = 'required';
  }

  if (data.relationship_goal.length < 1 || data.relationship_goal.length > RELATIONSHIP_GOAL_MAX) {
    errors.relationship_goal = 'size';
  }

  if (data.mystery_question.length > 50) {
    errors.mystery_question = 'length';
  }

  if (data.mystery_answer.length > 100) {
    errors.mystery_answer = 'length';
  }

  if (data.photos.length < PHOTOS_MIN_COUNT || data.photos.length > PHOTOS_MAX_COUNT) {
    errors.photos = 'size';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
