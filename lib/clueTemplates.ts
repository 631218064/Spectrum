// lib/clueTemplates.ts
// 当 AI 不可用时使用的线索模板库
// 该函数接收目标用户的资料（作为 user1），为对方生成每日线索
// user2 参数保留以兼容原有接口，实际未使用

import type { UserProfile, Clues, ClueLang } from './ai';

/**
 * 基于用户资料生成模板化线索
 * @param targetUser 当前用户所看到的对方用户资料
 * @param _ignored 保留参数，不启用
 * @returns 每日线索对象
 */
export function generateTemplateClues(targetUser: UserProfile, _ignored?: UserProfile, lang: ClueLang = 'zh'): Clues {
  if (lang === 'en') {
    const day1: string[] = [];
    const day2: string[] = [];
    const day3: string[] = [];
    const day4: string[] = [];

    day1.push(targetUser.mbti && targetUser.mbti !== 'unknown'
      ? `Their MBTI is ${targetUser.mbti}, hinting at a distinct inner world.`
      : 'Their personality type remains a mystery, waiting to be discovered.');
    day1.push(targetUser.zodiac
      ? `Their zodiac sign is ${targetUser.zodiac}, often linked to a gentle kind of romance.`
      : 'Their zodiac stays hidden, perhaps somewhere in the stars.');
    day1.push(targetUser.pet_preference
      ? 'Their pet preference reveals a soft and lively side.'
      : 'Their bond with animals is an unknown but likely lovely story.');

    day2.push(targetUser.sound_preference
      ? 'The sounds they love might quietly reveal their mood.'
      : 'They are sensitive to sound and have a favorite background tone.');
    day2.push(targetUser.color_mood_custom || targetUser.color_mood
      ? 'Their emotional color feels like a soft painting.'
      : 'Their emotional palette still has unnamed shades.');
    day2.push(targetUser.scent_memory_custom || targetUser.scent_memory
      ? 'A certain scent can instantly bring them back to an old memory.'
      : 'A hidden scent memory lingers in their story.');

    day3.push(targetUser.ritual_custom || targetUser.ritual
      ? 'They keep a tiny daily ritual only close people may notice.'
      : 'Their routines carry subtle habits only time can reveal.');
    day3.push(targetUser.food_adventure
      ? 'In food adventures, they have a clear personal style.'
      : 'Their attitude toward food may mirror how they approach life.');
    day3.push(targetUser.conflict_reaction
      ? 'When conflict appears, they have their own way to handle it.'
      : 'Their way of handling tension may surprise you.');

    day4.push(targetUser.relationship_goal?.length
      ? 'Their relationship expectations are sincere and quietly specific.'
      : 'They believe meaningful connection does not need rigid rules.');
    day4.push(targetUser.valued_traits?.length
      ? 'The qualities they value most might already reflect your silhouette.'
      : 'For them, the right person can blur every checklist.');
    day4.push('Day 5 is close: the final layer of this slow reveal is almost unlocked.');

    return {
      day1: day1.slice(0, 3),
      day2: day2.slice(0, 3),
      day3: day3.slice(0, 3),
      day4: day4.slice(0, 3),
    };
  }

  // 处理自定义字段：如果有自定义值，优先使用，否则使用选项本身
  const getCustom = (main: string | undefined, custom: string | undefined): string => {
    if (custom && custom.trim() !== '') return custom;
    return main || '未知';
  };

  // 构建每日线索数组
  const day1: string[] = [];
  const day2: string[] = [];
  const day3: string[] = [];
  const day4: string[] = [];

  // ---------- 第一天：基础印象 ----------
  // MBTI
  if (targetUser.mbti && targetUser.mbti !== 'unknown') {
    day1.push(`TA 的 MBTI 是 ${targetUser.mbti}，这个类型的人往往有着独特的内心世界。`);
  } else if (targetUser.mbti === 'unknown') {
    day1.push('TA 对 MBTI 充满好奇，也许你们可以一起探索性格的奥秘。');
  } else {
    day1.push('TA 的性格类型是个谜，等待你去发现。');
  }

  // 星座
  if (targetUser.zodiac) {
    day1.push(`TA 的星座是 ${targetUser.zodiac}，听说这个星座的人浪漫又细腻。`);
  } else {
    day1.push('TA 的星座是个秘密，但也许和星空有关。');
  }

  // 宠物偏好
  if (targetUser.pet_preference) {
    const petMap: Record<string, string> = {
      cat: '猫派，猫咪是灵魂伴侣',
      dog: '狗派，狗狗带来无限欢乐',
      other_pet: '喜欢其他小动物',
      no_pet_now: '目前没养宠物，但不排斥',
      allergic: '对宠物过敏，但依然欣赏',
    };
    const petDesc = petMap[targetUser.pet_preference] || '对小动物有特别的情感';
    day1.push(`TA 的宠物偏好：${petDesc}。`);
  } else {
    day1.push('TA 和小动物的关系，是个可爱的未知数。');
  }

  // 如果不足3条，添加备用线索
  if (day1.length < 3) {
    day1.push(`TA 的理想型里藏着一些关键词：${targetUser.valued_traits?.slice(0, 2).join('、') || '真诚与温柔'}。`);
  }

  // ---------- 第二天：感官世界 ----------
  // 声音偏好
  if (targetUser.sound_preference) {
    const soundMap: Record<string, string> = {
      rain_fireplace: '雨天的白噪音或壁炉的噼啪声',
      cafe_clatter: '咖啡馆里模糊的交谈与杯碟声',
      instrumental: '钢琴或小提琴的纯器乐',
      livehouse_rap: 'Livehouse 里听不清歌词的 Rap',
    };
    const soundDesc = soundMap[targetUser.sound_preference] || '独特的声音';
    day2.push(`TA 喜欢听：${soundDesc}，这或许能透露 TA 当下的心境。`);
  } else {
    day2.push('TA 对声音很敏感，总有自己偏爱的背景音。');
  }

  // 色彩共鸣
  const color = getCustom(targetUser.color_mood, targetUser.color_mood_custom);
  if (color && color !== 'custom') {
    const colorMap: Record<string, string> = {
      warm_gold: '温暖的金色/橙色（期待、积极）',
      calm_blue: '沉静的蓝色/绿色（平和、内省）',
      chaotic_gray: '混沌的灰色/黑色（疲惫、需要充电）',
      mysterious_purple: '神秘的紫色（充满幻想、对未知好奇）',
    };
    const colorDesc = colorMap[color] || color;
    day2.push(`TA 说现在的情绪色彩是“${colorDesc}”，像一幅温柔的画。`);
  } else {
    day2.push('TA 的情绪色彩，像调色盘上未命名的颜色，等你来定义。');
  }

  // 气味记忆
  const scent = getCustom(targetUser.scent_memory, targetUser.scent_memory_custom);
  if (scent && scent !== 'not_sensitive' && scent !== 'custom') {
    const scentMap: Record<string, string> = {
      home_cooking: '妈妈煮的饭菜香或爸爸的剃须水',
      rain_grass: '雨后泥土和青草的腥味',
      old_books: '老书或木质家具的味道',
      pool_sea: '泳池的漂白水味或海风的咸味',
      perfume: '某种香水或洗衣液的留香',
    };
    const scentDesc = scentMap[scent] || scent;
    day2.push(`有一种气味能让 TA 瞬间回到过去：${scentDesc}。`);
  } else if (scent === 'not_sensitive') {
    day2.push('TA 对气味不太敏感，但对这个问题很感兴趣。');
  } else {
    day2.push('TA 的记忆里藏着一种特别的气味，可能是某个夏天的风。');
  }

  // 如果不足3条
  if (day2.length < 3) {
    day2.push('TA 对世界的感知方式，总是充满诗意。');
  }

  // ---------- 第三天：生活仪式感与情感模式 ----------
  // 微小仪式感
  const ritual = getCustom(targetUser.ritual, targetUser.ritual_custom);
  if (ritual && ritual !== 'no_ritual' && ritual !== 'custom') {
    const ritualMap: Record<string, string> = {
      wipe_cup: '喝东西前一定要先擦一下杯口',
      couch_5min: '到家后必须在沙发上瘫 5 分钟',
      prepare_clothes: '睡前把第二天穿的衣服准备好',
      music_shower: '洗澡时一定要放音乐或播客',
    };
    const ritualDesc = ritualMap[ritual] || ritual;
    day3.push(`TA 有一个可爱的仪式感：${ritualDesc}。`);
  } else if (ritual === 'no_ritual') {
    day3.push('TA 说生活随性就好，没有特别的仪式感。');
  } else {
    day3.push('TA 的日常里藏着一些只有自己知道的小习惯。');
  }

  // 食物冒险风格
  if (targetUser.food_adventure) {
    const foodMap: Record<string, string> = {
      safe_guard: '安全区守护者，可以一直吃同样的美食',
      mild_explorer: '温和探险家，偶尔尝试新菜',
      extreme_explorer: '未知探险家，菜单上没吃过的都是目标',
      survival: '吃饭只是生存需要，不讲究',
    };
    const foodDesc = foodMap[targetUser.food_adventure] || '对食物有自己的态度';
    day3.push(`在美食世界里，TA 是：${foodDesc}。`);
  } else {
    day3.push('TA 对食物的态度，可能和对待生活一样。');
  }

  // 冲突反应
  if (targetUser.conflict_reaction) {
    const conflictMap: Record<string, string> = {
      need_space: '需要空间冷静一下，想清楚了再沟通',
      talk_immediately: '想立刻说清楚，甚至希望对方能抱抱自己',
      pretend_fine: '表面上说没事，但心里希望对方能主动',
      depends: '视情况而定，灵活应对',
    };
    const conflictDesc = conflictMap[targetUser.conflict_reaction] || '有自己的处理方式';
    day3.push(`当分歧发生时，TA 的第一反应是：${conflictDesc}。`);
  } else {
    day3.push('TA 处理矛盾的方式，也许和大多数人不太一样。');
  }

  // 如果不足3条，补充充电方式
  if (day3.length < 3 && targetUser.recharge_style) {
    const rechargeMap: Record<string, string> = {
      deep_talk: '和伴侣深度倾诉',
      alone_time: '独自看电影、打游戏或读书',
      quality_time: '和伴侣一起出门做轻松的事',
      friends_social: '找朋友一起嗨',
    };
    const rechargeDesc = rechargeMap[targetUser.recharge_style] || '以自己的方式恢复能量';
    day3.push(`疲惫时，TA 的充电方式是：${rechargeDesc}。`);
  } else if (day3.length < 3) {
    day3.push('TA 的情感模式，需要时间来慢慢了解。');
  }

  // ---------- 第四天：未来与期待 ----------
  // 关系目标
  if (targetUser.relationship_goal && targetUser.relationship_goal.length > 0) {
    const goalMap: Record<string, string> = {
      stable_partner: '长久稳定的伴侣关系',
      deep_connection: '灵魂共鸣的深度连接',
      playmate: '一起探索世界的好玩伴',
      healing: '互相治愈的情感支持',
      no_expectations: '随缘，不设限',
    };
    const goals = targetUser.relationship_goal
      .map((g) => goalMap[g] || g)
      .slice(0, 2)
      .join('、');
    day4.push(`TA 对关系的期待是：${goals}。`);
  } else {
    day4.push('TA 相信，真正的连接不需要预设太多条框。');
  }

  // 理想型特质
  if (targetUser.valued_traits && targetUser.valued_traits.length > 0) {
    const traits = targetUser.valued_traits
      .map((t) => {
        const traitMap: Record<string, string> = {
          humor: '幽默感',
          gentle: '温柔体贴',
          ambitious: '上进心',
          intelligent: '聪明',
          independent: '独立',
          romantic: '浪漫',
          sincere: '真诚',
          patient: '耐心',
          loves_life: '热爱生活',
          good_looking: '颜值在线',
          financially_stable: '经济稳定',
          loves_animals: '喜欢小动物',
          family_oriented: '家庭观念强',
        };
        return traitMap[t] || t;
      })
      .slice(0, 3)
      .join('、');
    day4.push(`在 TA 心中，最看重的三个特质是：${traits}。`);
  } else {
    day4.push('TA 觉得，对的人出现时，所有标准都会变得模糊。');
  }

  // 成长环境/经济/学历（如果用户愿意透露）
  if (targetUser.growth_environment && targetUser.growth_environment !== 'prefer_not_to_say') {
    const growthMap: Record<string, string> = {
      happy_family: '家庭幸福',
      independent: '独立成长',
      complex: '情况复杂',
    };
    const growthDesc = growthMap[targetUser.growth_environment] || targetUser.growth_environment;
    day4.push(`TA 的成长背景：${growthDesc}，这塑造了现在的 TA。`);
  } else if (targetUser.financial_status && targetUser.financial_status !== 'prefer_not_to_say') {
    const financeMap: Record<string, string> = {
      student: '学生',
      employed: '上班族',
      self_employed: '自由职业',
    };
    const financeDesc = financeMap[targetUser.financial_status] || targetUser.financial_status;
    day4.push(`目前 TA 的身份是：${financeDesc}。`);
  } else if (targetUser.education && targetUser.education !== 'prefer_not_to_say') {
    const eduMap: Record<string, string> = {
      high_school: '高中及以下',
      associate: '专科',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士',
    };
    const eduDesc = eduMap[targetUser.education] || targetUser.education;
    day4.push(`TA 的学历背景：${eduDesc}。`);
  } else {
    day4.push('TA 选择保留一些神秘感，等待你来发现。');
  }

  // 如果不足3条，补充一条通用祝福
  if (day4.length < 3) {
    day4.push('明天就是第五天，你们即将解锁彼此的联系方式。');
  }

  // 按当前产品节奏，模板回退固定每天3条
  return {
    day1: day1.slice(0, 3),
    day2: day2.slice(0, 3),
    day3: day3.slice(0, 3),
    day4: day4.slice(0, 3),
  };
}
