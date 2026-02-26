// lib/matchingAlgorithm.ts
// 传统匹配算法，用于初步筛选潜在匹配
// 可根据业务需求不断扩展和优化

export interface Candidate {
  id: string;
  mbti?: string;
  interests?: string[];
  // 可添加其他用于匹配的字段
}

/**
 * 计算两个用户之间的匹配分数（0-100）
 * 示例规则：相同 MBTI 加 10 分，每个共同兴趣加 5 分
 * 实际使用时可根据需要调整权重和添加更多规则
 */
export function calculateMatchScore(userA: Candidate, userB: Candidate): number {
  let score = 50; // 基础分

  // MBTI 匹配：相同 +10，互补（如 INTJ 和 ENFP）可自定义加分
  if (userA.mbti && userB.mbti && userA.mbti === userB.mbti) {
    score += 10;
  }

  // 共同兴趣：每个 +5
  const commonInterests = userA.interests?.filter(i => userB.interests?.includes(i)) || [];
  score += commonInterests.length * 5;

  // 限制最高 100
  return Math.min(score, 100);
}

/**
 * 从候选池中筛选出匹配分数最高的 N 个用户
 * @param currentUserId 当前用户 ID
 * @param candidates 候选用户列表（需包含除自己外的所有潜在用户）
 * @param limit 返回的最大数量
 * @returns 按分数降序排列的用户列表
 */
export function getTopMatches(
  currentUserId: string,
  candidates: Candidate[],
  limit: number = 20
): Candidate[] {
  // 排除自己并计算分数
  const scored = candidates
    .filter(c => c.id !== currentUserId)
    .map(c => ({
      user: c,
      score: calculateMatchScore(c, { id: currentUserId } as any), // 需要当前用户资料，实际应传入
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.user);

  return scored;
}