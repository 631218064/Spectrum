// lib/ai.ts
// AI 绾跨储鐢熸垚妯″潡锛岃皟鐢?DeepSeek API锛屽苟鏀寔妯℃澘鍥為€€

import { generateTemplateClues } from './clueTemplates';

export interface UserProfile {
  id: string;
  mbti?: string;
  zodiac?: string;
  pet?: string;
  interests?: string[];
  love_views?: string;
  favorite_quote?: string;
  ideal_type_tags?: string[];
  family_background?: string;
  work_industry?: string;
  financial_status?: string;
  // 鍏朵粬瀛楁鍙寜闇€娣诲姞
}

export interface Clues {
  day1: string[];
  day2: string[];
  day3: string[];
  day4: string[];
}

/**
 * 璋冪敤 DeepSeek API 鐢熸垚涓€у寲绾跨储
 */
async function generateCluesWithAI(user1: UserProfile, user2: UserProfile): Promise<Clues | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

  if (!apiKey) {
    console.warn('DeepSeek API key not configured, falling back to templates');
    return null;
  }

  // 鏋勫缓鎻愮ず璇嶏紝瑕佹眰鐢熸垚 4 鏉℃氮婕嚎绱?
  const prompt = `
  浣犳槸涓€涓搮闀挎崟鎹変汉涓庝汉涔嬮棿寰鑱旂郴鐨勬氮婕瘲浜恒€傚熀浜庝互涓嬩袱涓汉鐨勮祫鏂欙紝涓轰粬浠殑鈥滄參鎻檽鈥濈害浼氳繃绋嬬敓鎴?4 澶╃殑绾跨储锛屾瘡澶?3 鏉★紝鍏?12 鏉°€?
  姣忔潯绾跨储蹇呴』鏄竴鍙ュ厖婊¤瘲鎰忓拰鏆楃ず鐨勮瘽锛屼笉瑕佺洿鎺ラ€忛湶瀵规柟鐨勫叏閮ㄤ俊鎭紝鑰屾槸鍍忚皽璇竴鏍锋參鎱㈡彮绀轰粬浠殑鐏甸瓊銆?
  绾跨储搴旇鍒嗗埆浠庝袱涓汉鐨勮搴﹀嚭鍙戯紝浜ゆ浛鍑虹幇锛屾瘡澶╃殑涓夋潯绾跨储鍙互鍥寸粫涓€涓富棰樸€?

  鐢ㄦ埛 1 璧勬枡锛?
  MBTI: ${user1.mbti || '鏈煡'}
  鏄熷骇: ${user1.zodiac || '鏈煡'}
  瀹犵墿鍋忓ソ: ${user1.pet || '鏈煡'}
  鍏磋叮鐖卞ソ: ${user1.interests?.join(', ') || '鏈煡'}
  鐖辨儏瑙? ${user1.love_views || '鏈煡'}
  鏈€鍠滄鐨勫彞瀛? ${user1.favorite_quote || '鏈煡'}
  鐞嗘兂鍨嬫爣绛? ${user1.ideal_type_tags?.join(', ') || '鏈煡'}

  鐢ㄦ埛 2 璧勬枡锛?
  MBTI: ${user2.mbti || '鏈煡'}
  鏄熷骇: ${user2.zodiac || '鏈煡'}
  瀹犵墿鍋忓ソ: ${user2.pet || '鏈煡'}
  鍏磋叮鐖卞ソ: ${user2.interests?.join(', ') || '鏈煡'}
  鐖辨儏瑙? ${user2.love_views || '鏈煡'}
  鏈€鍠滄鐨勫彞瀛? ${user2.favorite_quote || '鏈煡'}
  鐞嗘兂鍨嬫爣绛? ${user2.ideal_type_tags?.join(', ') || '鏈煡'}

  璇蜂互 JSON 鏍煎紡杩斿洖锛屾牸寮忓涓嬶細
  {
    "day1": ["绾跨储1", "绾跨储2", "绾跨储3"],
    "day2": ["绾跨储1", "绾跨储2", "绾跨储3"],
    "day3": ["绾跨储1", "绾跨储2", "绾跨储3"],
    "day4": ["绾跨储1", "绾跨储2", "绾跨储3"]
  }
  鍙繑鍥?JSON锛屼笉瑕佸叾浠栨枃瀛椼€?
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // DeepSeek 妯″瀷鍚嶇О
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) return null;

    // 瑙ｆ瀽杩斿洖鐨?JSON
    const clues = JSON.parse(content) as Clues;
    // 绠€鍗曢獙璇?
    if (clues.day1 && clues.day2 && clues.day3 && clues.day4) {
      return clues;
    }
    return null;
  } catch (error) {
    console.error('AI generation failed:', error);
    return null;
  }
}

/**
 * 鐢熸垚姣忔棩绾跨储鐨勪富鍏ュ彛
 * @param user1 鐢ㄦ埛 1 璧勬枡
 * @param user2 鐢ㄦ埛 2 璧勬枡
 * @returns 绾跨储瀵硅薄
 */
export async function generateDailyClues(user1: UserProfile, user2: UserProfile): Promise<Clues> {
  // 濡傛灉鍚敤浜?AI 涓旀湁 API 瀵嗛挜锛屽皾璇曚娇鐢?AI 鐢熸垚
  if (process.env.AI_CLUE_ENABLED === 'true') {
    const aiClues = await generateCluesWithAI(user1, user2);
    if (aiClues) {
      return aiClues;
    }
  }

  // 鍥為€€鍒版ā鏉跨敓鎴?
  return generateTemplateClues(user1, user2);
}
