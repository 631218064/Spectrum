// lib/ai.ts
// AI 线索生成模块，调用 DeepSeek API，并支持模板回退

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
  // 其他字段可按需添加
}

export interface Clues {
  day1: string[];
  day2: string[];
  day3: string[];
  day4: string[];
}

/**
 * 调用 DeepSeek API 生成个性化线索
 */
async function generateCluesWithAI(user1: UserProfile, user2: UserProfile): Promise<Clues | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

  if (!apiKey) {
    console.warn('DeepSeek API key not configured, falling back to templates');
    return null;
  }

  // 构建提示词，要求生成 4 条浪漫线索
  const prompt = `
  你是一个擅长捕捉人与人之间微妙联系的浪漫诗人。基于以下两个人的资料，为他们的“慢揭晓”约会过程生成 4 天的线索，每天 3 条，共 12 条。
  每条线索必须是一句充满诗意和暗示的话，不要直接透露对方的全部信息，而是像谜语一样慢慢揭示他们的灵魂。
  线索应该分别从两个人的角度出发，交替出现，每天的三条线索可以围绕一个主题。

  用户 1 资料：
  MBTI: ${user1.mbti || '未知'}
  星座: ${user1.zodiac || '未知'}
  宠物偏好: ${user1.pet || '未知'}
  兴趣爱好: ${user1.interests?.join(', ') || '未知'}
  爱情观: ${user1.love_views || '未知'}
  最喜欢的句子: ${user1.favorite_quote || '未知'}
  理想型标签: ${user1.ideal_type_tags?.join(', ') || '未知'}

  用户 2 资料：
  MBTI: ${user2.mbti || '未知'}
  星座: ${user2.zodiac || '未知'}
  宠物偏好: ${user2.pet || '未知'}
  兴趣爱好: ${user2.interests?.join(', ') || '未知'}
  爱情观: ${user2.love_views || '未知'}
  最喜欢的句子: ${user2.favorite_quote || '未知'}
  理想型标签: ${user2.ideal_type_tags?.join(', ') || '未知'}

  请以 JSON 格式返回，格式如下：
  {
    "day1": ["线索1", "线索2", "线索3"],
    "day2": ["线索1", "线索2", "线索3"],
    "day3": ["线索1", "线索2", "线索3"],
    "day4": ["线索1", "线索2", "线索3"]
  }
  只返回 JSON，不要其他文字。
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // DeepSeek 模型名称
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

    // 解析返回的 JSON
    const clues = JSON.parse(content) as Clues;
    // 简单验证
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
 * 生成每日线索的主入口
 * @param user1 用户 1 资料
 * @param user2 用户 2 资料
 * @returns 线索对象
 */
export async function generateDailyClues(user1: UserProfile, user2: UserProfile): Promise<Clues> {
  // 如果启用了 AI 且有 API 密钥，尝试使用 AI 生成
  if (process.env.AI_CLUE_ENABLED === 'true') {
    const aiClues = await generateCluesWithAI(user1, user2);
    if (aiClues) {
      return aiClues;
    }
  }

  // 回退到模板生成
  return generateTemplateClues(user1, user2);
}