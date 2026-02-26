// lib/clueTemplates.ts
// 当 AI 不可用时使用的线索模板库

import type { UserProfile, Clues } from './ai';

/**
 * 基于用户资料生成模板化线索
 * 可以根据实际需求扩展模板的随机性和多样性
 */
export function generateTemplateClues(user1: UserProfile, user2: UserProfile): Clues {
  // 为每天生成三条模板线索（可随机组合或固定模板）
  return {
    day1: [
      `ta 的 MBTI 是 ${user1.mbti || '神秘型'}，也许你们能完美互补。`,
      `ta 喜欢 ${user1.pet || '小动物'}，你是不是也偷偷云吸猫？`,
      `ta 的理想型包含：${user1.ideal_type_tags?.slice(0, 2).join('、') || '有趣的灵魂'}`,
    ],
    day2: [
      `对方可能是一个 ${user2.mbti || '富有魅力'} 的人。`,
      `ta 的星座是 ${user2.zodiac || '未知'}，据说和你的星座很配哦。`,
      `ta 的兴趣有：${user2.interests?.slice(0, 2).join('、') || '探索未知'}`,
    ],
    day3: [
      `ta 相信：${user1.love_views || '爱情需要慢慢来'}`,
      `ta 最喜欢的一句话是：“${user1.favorite_quote || '活在当下'}”`,
      `ta 的家庭背景：${user1.family_background || '未知'}`,
    ],
    day4: [
      `ta 的工作行业：${user2.work_industry || '未知'}`,
      `ta 的经济情况：${user2.financial_status || '未知'}`,
      `ta 的爱情观：${user2.love_views || '随缘'}`,
    ],
  };
}