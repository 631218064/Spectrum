interface LocationValue {
  country?: string;
  province?: string;
  city?: string;
}

export interface ProfileForMatch {
  id: string;
  birthday?: string;
  gender?: string;
  sexual_orientation?: string;
  location?: LocationValue;
  mbti?: string;
  zodiac?: string;
  growth_environment?: string;
  pet_preference?: string;
  hobbies?: string[];
  hobbies_custom?: string;
  sound_preference?: string;
  color_mood?: string;
  color_mood_custom?: string;
  scent_memory?: string;
  scent_memory_custom?: string;
  ritual?: string;
  ritual_custom?: string;
  food_adventure?: string;
  conflict_reaction?: string;
  recharge_style?: string;
  relationship_goal?: string[];
}

interface ScoredCandidate {
  profile: ProfileForMatch;
  score: number;
}

const FULL_GENDER_SET = ['male', 'female', 'non_binary', 'prefer_not_to_say'];

function parseBirthdayYear(birthday?: string): number | null {
  if (!birthday) return null;
  const m = birthday.match(/^(\d{4})-\d{2}-\d{2}$/);
  return m ? Number(m[1]) : null;
}

function getAgeByYear(birthday?: string): number | null {
  const year = parseBirthdayYear(birthday);
  if (!year) return null;
  return new Date().getFullYear() - year;
}

function orientationAllowedGenders(orientation?: string): string[] {
  switch (orientation) {
    case 'heterosexual':
      return ['male', 'female'];
    case 'homosexual':
      return ['male', 'female'];
    case 'bisexual':
      return ['male', 'female'];
    case 'pansexual':
    case 'queer':
    case 'exploring':
      return FULL_GENDER_SET;
    default:
      return [];
  }
}

function orientationAllowsPair(selfGender?: string, selfOrientation?: string, otherGender?: string) {
  if (!selfGender || !otherGender || !selfOrientation) return false;
  if (selfGender === 'prefer_not_to_say') {
    return true;
  }
  if (selfOrientation === 'heterosexual') {
    return (selfGender === 'male' && otherGender === 'female') || (selfGender === 'female' && otherGender === 'male');
  }
  if (selfOrientation === 'homosexual') {
    return (selfGender === 'male' && otherGender === 'male') || (selfGender === 'female' && otherGender === 'female');
  }
  const allowed = orientationAllowedGenders(selfOrientation);
  return allowed.includes(otherGender);
}

function isPetCompatible(a?: string, b?: string) {
  if (!a || !b) return true;
  const petSet = new Set(['cat', 'dog', 'other_pet']);
  if (a === 'allergic' && petSet.has(b)) return false;
  if (b === 'allergic' && petSet.has(a)) return false;
  return true;
}

function locationScore(a?: LocationValue, b?: LocationValue) {
  if (!a?.country || !b?.country) return 0;
  if (a.country !== b.country) return 0;
  if (a.province && b.province && a.province === b.province) {
    if (a.city && b.city && a.city === b.city) return 8;
    return 5;
  }
  return 2;
}

function exactScore(a?: string, b?: string, weight = 0) {
  return a && b && a === b ? weight : 0;
}

function customExactScore(a?: string, b?: string, aCustom?: string, bCustom?: string, weight = 0) {
  if (!a || !b) return 0;
  if (a !== b) return 0;
  if (a !== 'custom') return weight;
  return aCustom && bCustom && aCustom === bCustom ? weight : 0;
}

function overlapScore(a: string[] = [], b: string[] = [], perItem: number, maxScore: number) {
  const setB = new Set(b);
  const overlap = a.filter((x) => setB.has(x)).length;
  return Math.min(maxScore, overlap * perItem);
}

function hobbiesScore(a: ProfileForMatch, b: ProfileForMatch) {
  const aList = a.hobbies || [];
  const bList = b.hobbies || [];
  const aSet = new Set(aList);
  let overlap = 0;
  for (const item of bList) {
    if (!aSet.has(item)) continue;
    if (item === 'custom') {
      if (a.hobbies_custom && b.hobbies_custom && a.hobbies_custom === b.hobbies_custom) overlap += 1;
    } else {
      overlap += 1;
    }
  }
  return Math.min(10, overlap * 2);
}

function ritualScore(a: ProfileForMatch, b: ProfileForMatch) {
  if (!a.ritual || !b.ritual) return 0;
  if (a.ritual === b.ritual) {
    if (a.ritual !== 'custom') return 4;
    return a.ritual_custom && b.ritual_custom && a.ritual_custom === b.ritual_custom ? 4 : 0;
  }
  if ((a.ritual === 'no_ritual' && b.ritual !== 'no_ritual') || (b.ritual === 'no_ritual' && a.ritual !== 'no_ritual')) return 2;
  if (a.ritual === 'no_ritual' && b.ritual === 'no_ritual') return 3;
  return 0;
}

function foodAdventureScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  if (a === b) return 4;
  if (a === 'survival' || b === 'survival') return 1;
  const order = ['safe_guard', 'mild_explorer', 'extreme_explorer'];
  const ai = order.indexOf(a);
  const bi = order.indexOf(b);
  if (ai >= 0 && bi >= 0) {
    const diff = Math.abs(ai - bi);
    if (diff === 1) return 2;
    if (diff >= 2) return 1;
  }
  return 0;
}

function conflictScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  if (a === b) return 8;
  if ((a === 'need_space' && b === 'talk_immediately') || (a === 'talk_immediately' && b === 'need_space')) return 4;
  return 2;
}

function rechargeScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  if (a === b) return 7;
  if ((a === 'alone_time' && b === 'quality_time') || (a === 'quality_time' && b === 'alone_time')) return 4;
  return 2;
}

function relationshipGoalScore(a: string[] = [], b: string[] = []) {
  const overlap = a.filter((x) => b.includes(x)).length;
  let score = Math.min(10, overlap * 5);
  if (a.includes('no_expectations') || b.includes('no_expectations')) score += 3;
  return Math.min(10, score);
}

function petScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  if (a === b) {
    if (a === 'no_pet_now' || a === 'allergic') return 4;
    return 5;
  }
  if ((a === 'no_pet_now' && ['cat', 'dog', 'other_pet'].includes(b)) || (b === 'no_pet_now' && ['cat', 'dog', 'other_pet'].includes(a))) return 3;
  return 2;
}

function mbtiScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  if (a === b && a !== 'unknown') return 6;
  if (a === 'unknown' || b === 'unknown') return 2;
  return 0;
}

function ageScore(aAge: number, bAge: number) {
  return Math.max(0, 10 - Math.abs(aAge - bAge));
}

export function scoreCompatibility(a: ProfileForMatch, b: ProfileForMatch) {
  const ageA = getAgeByYear(a.birthday);
  const ageB = getAgeByYear(b.birthday);
  if (ageA === null || ageB === null) return -1;
  if (Math.abs(ageA - ageB) > 5) return -1;
  if (!orientationAllowsPair(a.gender, a.sexual_orientation, b.gender)) return -1;
  if (!orientationAllowsPair(b.gender, b.sexual_orientation, a.gender)) return -1;
  if (!isPetCompatible(a.pet_preference, b.pet_preference)) return -1;

  let score = 0;
  score += ageScore(ageA, ageB);
  score += locationScore(a.location, b.location);
  score += mbtiScore(a.mbti, b.mbti);
  score += exactScore(a.zodiac, b.zodiac, 4);
  score += exactScore(a.growth_environment, b.growth_environment, 5);
  score += petScore(a.pet_preference, b.pet_preference);
  score += hobbiesScore(a, b);
  score += exactScore(a.sound_preference, b.sound_preference, 3);
  score += customExactScore(a.color_mood, b.color_mood, a.color_mood_custom, b.color_mood_custom, 3);
  score += customExactScore(a.scent_memory, b.scent_memory, a.scent_memory_custom, b.scent_memory_custom, 3);
  score += ritualScore(a, b);
  score += foodAdventureScore(a.food_adventure, b.food_adventure);
  score += conflictScore(a.conflict_reaction, b.conflict_reaction);
  score += rechargeScore(a.recharge_style, b.recharge_style);
  score += relationshipGoalScore(a.relationship_goal || [], b.relationship_goal || []);
  return score;
}

export function pickTopCandidate(me: ProfileForMatch, candidates: ProfileForMatch[]) {
  const scored: ScoredCandidate[] = [];
  for (const profile of candidates) {
    const score = scoreCompatibility(me, profile);
    if (score < 0) continue;
    scored.push({ profile, score });
  }
  scored.sort((x, y) => (y.score === x.score ? Math.random() - 0.5 : y.score - x.score));
  return scored[0] || null;
}
