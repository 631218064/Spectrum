// lib/ai.ts
// AI 绾跨储鐢熸垚妯″潡锛岃皟鐢?DeepSeek API锛屽苟鏀寔妯℃澘鍥為€€

import { generateTemplateClues } from './clueTemplates';

export interface UserProfile {
  id: string;
  nickname?: string;
  birthday?: string;
  gender?: string;
  sexual_orientation?: string;
  location?: {
    country?: string;
    province?: string;
    city?: string;
  };
  mbti?: string;
  zodiac?: string;
  growth_environment?: string;
  education?: string;
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
  mystery_question?: string;
  mystery_answer?: string;
  valued_traits?: string[];
  valued_traits_custom?: string;
  relationship_goal?: string[];
  photos?: string[];
  contact_info?: string;
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

function isResponsesApi(url: string): boolean {
  return /\/responses(\?|$)/.test(url);
}

function extractTextFromAiResponse(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const part of content) {
        const text = part?.text || part?.output_text;
        if (typeof text === 'string' && text.trim()) {
          return text;
        }
      }
    }
  }

  const chatText = data?.choices?.[0]?.message?.content;
  if (typeof chatText === 'string' && chatText.trim()) {
    return chatText;
  }
  return '';
}

function parseCluesFromContent(content: string): Clues | null {
  try {
    const parsed = JSON.parse(content) as Clues;
    if (parsed?.day1 && parsed?.day2 && parsed?.day3 && parsed?.day4) return parsed;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as Clues;
      if (parsed?.day1 && parsed?.day2 && parsed?.day3 && parsed?.day4) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 璋冪敤 DeepSeek API 鐢熸垚涓€у寲绾跨储
 */
async function generateCluesWithAI(user1: UserProfile, user2: UserProfile): Promise<Clues | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.AI_CLUE_MODEL || 'deepseek-chat';
  const useResponses = isResponsesApi(apiUrl);

  if (!apiKey) {
    console.warn('DeepSeek API key not configured, falling back to templates');
    return null;
  }

  // 鏋勫缓鎻愮ず璇嶏紝瑕佹眰鐢熸垚 4 鏉℃氮婕嚎绱?
  const prompt = `
你是一个温柔、浪漫且富有洞察力的AI助手，为交友平台“Spectrum”生成每日线索。Spectrum采用“慢揭晓”机制：匹配成功后，双方每天解锁关于对方的神秘线索，第五天公开联系方式。你的任务是根据双方的注册资料，生成连续4天（第1天至第4天）的线索，每天3-5条，旨在激发用户的好奇心与情感连接。

### 输入数据说明
你会拿到两个用户资料。请同时参考双方信息，但输出的线索只针对“被观察对象（target）”生成。不要编造资料中不存在的事实。

字段参考：
- photos：1-10张照片URL（第一张为主头像）。可做氛围暗示，不可直白描述照片细节。
- 基础档案：nickname（不可直接使用）、birthday、gender、sexual_orientation、location、mbti、zodiac、growth_environment、financial_status、education、pet_preference、hobbies。
- 感官与直觉：sound_preference、color_mood、scent_memory（含custom）。
- 生活仪式感：ritual、food_adventure。
- 情感模式：conflict_reaction、recharge_style。
- 留给未来的TA：mystery_question（如果存在，可放在Day1作为线索之一，允许轻度润色，但不得改写原意）。
- 理想型与期待：valued_traits、relationship_goal（用于理解偏好，不必硬编码入每条线索）。
- 隐私字段：contact_info/agree_terms 不得出现在线索中。

### 任务要求
1. 基于对方真实资料，隐晦、诗意表达，避免直接透露姓名、联系方式、精确地点等隐私。
2. 覆盖不同维度，4天之间避免重复同一信息点。
3. 语言温柔、积极、正向，不做负面评价。
4. 兼顾文化敏感性，避免生僻地域梗。
5. 若无法判断语言，默认输出中文。

### 每日主题建议
- Day1：初印象与感官世界（照片氛围/声音/色彩/气味/MBTI/星座）
- Day2：生活轨迹与仪式感（宠物偏好/兴趣爱好/仪式感/食物风格/成长环境）
- Day3：情感密码与关系信念（冲突反应/充电方式/关系目标/理想特质）
- Day4：未来蓝图与隐藏彩蛋（关系目标/理想型/经济与学历的抽象暗示/谜题答案的暗示但不直给）

### 输出格式（严格）
只输出一个JSON对象，不要Markdown，不要解释文字，不要代码块。必须是以下结构：
{
  "day1": ["...", "...", "..."],
  "day2": ["...", "...", "..."],
  "day3": ["...", "...", "..."],
  "day4": ["...", "...", "..."]
}
约束：
- 每天3-5条字符串
- 4天都必须存在
- 每条不超过60个中文字符（英文不超过140字符）
- 不得使用对方昵称，统一可用“TA”

### 本次输入
source_user:
${JSON.stringify(user1, null, 2)}

target_user:
${JSON.stringify(user2, null, 2)}
`;

  try {
    const body = useResponses
      ? {
          model,
          input: prompt,
          temperature: 0.8,
          max_output_tokens: 500,
        }
      : {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('AI API non-200 response', {
        status: response.status,
        statusText: response.statusText,
        body: errBody.slice(0, 1000),
        apiUrl,
        model,
      });
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = extractTextFromAiResponse(data);
    if (!content) return null;

    return parseCluesFromContent(content);
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

