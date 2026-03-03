import type { Language } from './registration';

type OptionDict = Record<string, string>;

interface SectionText {
  title: string;
  description: string;
}

interface RegistrationText {
  brand: string;
  toggleLang: string;
  pageTitle: string;
  welcome: string;
  submitHint: string;
  prev: string;
  next: string;
  submit: string;
  saving: string;
  savedDraft: string;
  restoredDraft: string;
  submitSuccess: string;
  submitFailed: string;
  requiredMark: string;
  removePhoto: string;
  uploadHint: string;
  uploadDropHint: string;
  photoWallHint: string;
  uploadInvalidType: string;
  uploadInvalidSize: string;
  termsPrefix: string;
  termsUser: string;
  termsPrivacy: string;
  termsAnd: string;
  sections: SectionText[];
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  errors: Record<string, string>;
  options: {
    gender: OptionDict;
    sexual_orientation: OptionDict;
    mbti: OptionDict;
    zodiac: OptionDict;
    growth_environment: OptionDict;
    financial_status: OptionDict;
    education: OptionDict;
    pet_preference: OptionDict;
    hobbies: OptionDict;
    sound_preference: OptionDict;
    color_mood: OptionDict;
    scent_memory: OptionDict;
    ritual: OptionDict;
    food_adventure: OptionDict;
    conflict_reaction: OptionDict;
    recharge_style: OptionDict;
    valued_traits: OptionDict;
    relationship_goal: OptionDict;
  };
}

export const registrationTranslations: Record<Language, RegistrationText> = {
  zh: {
    brand: 'Spectrum',
    toggleLang: 'EN',
    pageTitle: 'Create Profile & Find My Vibe',
    welcome:
      '欢迎来到 Spectrum！在开始这段慢揭晓之旅前，请先勾勒一个立体的你。你填写得越用心，未来五天关于你的谜题就越迷人，也越容易遇见真正懂你的人。所有信息都将严格保密，只有匹配成功后，才会以每日线索的形式部分揭示。',
    submitHint:
      '点击提交后，你将成为 Spectrum 的一员。我们会尽快为你寻找调性相合的匹配对象，并在每天早晨 8:00（北京时间）解锁 3-5 条关于对方的独特线索。祝你在慢揭晓中，遇见惊喜。',
    prev: '上一步',
    next: '下一步',
    submit: '提交并创建档案',
    saving: '提交中...',
    savedDraft: '草稿已自动保存',
    restoredDraft: '已恢复上次未提交的草稿',
    submitSuccess: '提交成功，欢迎加入 Spectrum。',
    submitFailed: '提交失败，请检查表单并重试。',
    requiredMark: '必填',
    removePhoto: '删除照片',
    uploadHint: '支持 JPG / PNG / HEIC，单张不超过 10MB',
    uploadDropHint: '拖拽图片到此处，或点击选择',
    photoWallHint:
      '第一张图将作为你的主头像。匹配过程中，每天会解锁一张新照片（Day1解锁第一张，Day2解锁第二张，...，Day5解锁剩余全部）。',
    uploadInvalidType: '图片格式仅支持 JPG/PNG/HEIC',
    uploadInvalidSize: '图片大小不能超过 10MB',
    termsPrefix: '我已阅读并同意',
    termsUser: '《用户协议》',
    termsPrivacy: '《隐私政策》',
    termsAnd: '和',
    sections: [
      { title: '基础档案', description: '这一部分帮助我们构建你的基本画像，也是生成线索的底色。' },
      { title: '感官与直觉', description: '这些问题没有对错，只有你独特的感知世界的方式。它们会成为线索的灵感来源。' },
      { title: '生活仪式感与怪癖', description: '正是这些微小而确定的习惯，构成了独一无二的你。' },
      { title: '关系信念与情感模式', description: '我们对待亲密关系的方式，往往藏在一些瞬间的选择里。这部分将帮助我们寻找与你情感节奏同频的人。' },
      { title: '留给未来的 TA', description: '这是你亲手种下的彩蛋。给未来的匹配对象留一个无伤大雅的小谜题，这个问题将在第一天解锁。' },
      { title: '理想型与期待', description: '虽然我们相信真爱超越条条框框，但你的偏好能帮助我们更精准地推荐。' },
      { title: '隐私与设置', description: '只给对的人，解锁联系你的途径。' },
    ],
    labels: {
      nickname: '昵称',
      birthday: '出生日期',
      gender: '性别',
      sexual_orientation: '性取向',
      location_country: '国家',
      location_province: '省份',
      location_city: '城市',
      mbti: 'MBTI 类型',
      zodiac: '星座',
      growth_environment: '成长环境',
      financial_status: '经济情况',
      education: '学历',
      pet_preference: '宠物偏好',
      hobbies: '兴趣爱好（最多 5 项）',
      hobbies_custom: '其他兴趣',
      sound_preference: '声音偏好',
      color_mood: '色彩共鸣',
      color_mood_custom: '自定义色彩',
      scent_memory: '气味记忆',
      scent_memory_custom: '自定义气味',
      ritual: '你的微小仪式感',
      ritual_custom: '自定义仪式',
      food_adventure: '味觉冒险地图',
      conflict_reaction: '冲突之后的你',
      recharge_style: '爱的充电站',
      mystery_question: '我的谜题',
      mystery_answer: '我的答案',
      valued_traits: '最看重的三个特质',
      valued_traits_custom: '自定义特质',
      relationship_goal: '你期待在关系中收获什么（最多选两项）',
      photos: '照片墙',
      contact_info: '联系方式',
      agree_terms: '同意条款',
    },
    placeholders: {
      nickname: '请输入 1-20 字昵称',
      contact_info: '例如 wechat_abc123',
      mystery_question: '请输入你的谜题（不超过 50 字）',
      mystery_answer: '请输入谜题答案（不超过 100 字）',
      hobbies_custom: '请输入其他兴趣',
      color_mood_custom: '请输入你偏爱的色彩',
      scent_memory_custom: '请输入你的气味记忆',
      ritual_custom: '请输入你的仪式感',
      valued_traits_custom: '请输入你最看重的特质',
    },
    errors: {
      required: '该字段为必填',
      length: '长度不符合要求',
      size: '选项数量不符合要求',
      invalid: '字段格式无效',
      past_date: '生日必须是过去日期',
      adult_only: '仅支持年满 18 岁的用户注册',
      submit: '请先修正高亮字段后再提交',
    },
    options: {
      gender: {
        male: '男',
        female: '女',
        non_binary: '非二元',
        prefer_not_to_say: '不愿透露',
      },
      sexual_orientation: {
        heterosexual: '异性恋',
        homosexual: '同性恋',
        bisexual: '双性恋',
        pansexual: '泛性恋',
        queer: '酷儿',
        exploring: '其他 / 仍在探索',
      },
      mbti: { unknown: 'unknown（愿意探索）' },
      zodiac: {
        aries: '白羊座',
        taurus: '金牛座',
        gemini: '双子座',
        cancer: '巨蟹座',
        leo: '狮子座',
        virgo: '处女座',
        libra: '天秤座',
        scorpio: '天蝎座',
        sagittarius: '射手座',
        capricorn: '摩羯座',
        aquarius: '水瓶座',
        pisces: '双鱼座',
      },
      growth_environment: {
        happy_family: '家庭幸福',
        independent: '独立成长',
        complex: '情况复杂',
        prefer_not_to_say: '不想说',
      },
      financial_status: {
        student: '学生',
        employed: '上班族',
        self_employed: '自由职业',
        prefer_not_to_say: '不想说',
      },
      education: {
        high_school: '高中及以下',
        associate: '专科',
        bachelor: '本科',
        master: '硕士',
        doctor: '博士',
        prefer_not_to_say: '不想说',
      },
      pet_preference: {
        cat: '猫派',
        dog: '狗派',
        other_pet: '其他小动物派',
        no_pet_now: '目前没养，但对宠物无感',
        allergic: '对动物过敏或害怕',
      },
      hobbies: {
        reading_writing: '阅读 / 写作',
        movies_tv: '电影 / 剧集',
        music_instruments: '音乐 / 乐器',
        games: '游戏 / 桌游',
        sports_fitness: '运动 / 健身',
        travel_food: '旅行 / 探店',
        photography_art: '摄影 / 绘画',
        crafts_baking: '手工 / 烘焙',
        outdoors_camping: '户外 / 露营',
        home_relax: '宅家 / 放松',
        custom: '其他（自定义）',
      },
      sound_preference: {
        rain_fireplace: '雨天白噪音或壁炉声',
        cafe_clatter: '咖啡馆交谈与杯碟声',
        instrumental: '钢琴或小提琴纯器乐',
        livehouse_rap: 'Livehouse Rap',
      },
      color_mood: {
        warm_gold: '暖金',
        calm_blue: '静蓝',
        chaotic_gray: '混沌灰',
        mysterious_purple: '神秘紫',
        custom: '其他（自定义）',
      },
      scent_memory: {
        home_cooking: '家里做饭的味道',
        rain_grass: '雨后草地',
        old_books: '旧书页',
        pool_sea: '泳池 / 海风',
        perfume: '香水',
        not_sensitive: '不太敏感',
        custom: '其他（自定义）',
      },
      ritual: {
        wipe_cup: '喝前先擦杯沿',
        couch_5min: '回家先在沙发发呆 5 分钟',
        prepare_clothes: '睡前准备次日衣服',
        music_shower: '洗澡一定要放音乐',
        no_ritual: '没有固定仪式',
        custom: '其他（自定义）',
      },
      food_adventure: {
        safe_guard: '稳妥派',
        mild_explorer: '温和探索派',
        extreme_explorer: '极限探索派',
        survival: '能吃就行',
      },
      conflict_reaction: {
        need_space: '先冷静，需要空间',
        talk_immediately: '立刻沟通',
        pretend_fine: '表面没事',
        depends: '看情况',
      },
      recharge_style: {
        deep_talk: '深聊',
        alone_time: '独处',
        quality_time: '高质量陪伴',
        friends_social: '和朋友社交',
      },
      valued_traits: {
        humor: '幽默',
        gentle: '温柔',
        ambitious: '上进',
        intelligent: '聪明',
        independent: '独立',
        romantic: '浪漫',
        sincere: '真诚',
        patient: '耐心',
        loves_life: '热爱生活',
        good_looking: '有吸引力',
        financially_stable: '经济稳定',
        loves_animals: '喜欢动物',
        family_oriented: '重视家庭',
        custom: '其他（自定义）',
      },
      relationship_goal: {
        stable_partner: '长期稳定伴侣',
        deep_connection: '深度情感连接',
        playmate: '一起玩、一起体验',
        healing: '互相治愈',
        no_expectations: '先认识，不预设',
      },
    },
  },
  en: {
    brand: 'Spectrum',
    toggleLang: '中文',
    pageTitle: 'Create Profile & Find My Vibe',
    welcome:
      "Welcome to Spectrum! Before embarking on this slow-reveal journey, take a moment to sketch a three-dimensional portrait of yourself. The more thoughtfully you fill this out, the more intriguing your mystery clues will be over the next five days and the easier it will be to meet someone who truly understands you. All information is strictly confidential and will only be partially revealed as daily clues after a successful match.",
    submitHint:
      "After submitting, you'll become a member of Spectrum. We'll soon start matching you with like-minded individuals, and every morning at 8:00 (Beijing Time) you'll unlock 3-5 unique clues about them.",
    prev: 'Previous',
    next: 'Next',
    submit: 'Submit & Create Profile',
    saving: 'Submitting...',
    savedDraft: 'Draft saved automatically',
    restoredDraft: 'Draft restored from local storage',
    submitSuccess: 'Submitted successfully. Welcome to Spectrum.',
    submitFailed: 'Submit failed. Please review the form.',
    requiredMark: 'Required',
    removePhoto: 'Remove Photo',
    uploadHint: 'JPG / PNG / HEIC up to 10MB',
    uploadDropHint: 'Drag an image here, or click to select',
    photoWallHint:
      'The first photo will be your main avatar. During matching, one new photo will be unlocked each day (Day 1: photo 1, Day 2: photo 2, ..., Day 5: all remaining photos).',
    uploadInvalidType: 'Only JPG/PNG/HEIC are allowed',
    uploadInvalidSize: 'Image must be <= 10MB',
    termsPrefix: 'I have read and agree to',
    termsUser: 'User Agreement',
    termsPrivacy: 'Privacy Policy',
    termsAnd: 'and',
    sections: [
      { title: 'Profile & Identity', description: 'This section helps us build your basic profile-the foundation for generating clues.' },
      { title: 'Senses & Intuition', description: 'There are no right or wrong answers-only your unique way of perceiving the world. These will inspire the clues.' },
      { title: 'Rituals & Quirks', description: "It's these small, definite habits that make you uniquely you." },
      { title: 'Beliefs & Emotional Rhythm', description: 'How we approach intimacy is often revealed in split-second choices. This section helps us find someone who syncs with your emotional rhythm.' },
      { title: 'A Note for Your Future Match', description: 'This is your personal easter egg. Leave a lighthearted riddle for your future match-it will be unlocked on the first day.' },
      { title: 'Ideal Traits & Expectations', description: 'While we believe true love transcends checkboxes, your preferences help us make more accurate recommendations.' },
      { title: 'Privacy & Settings', description: 'Only for the right people, unlock the way to contact you.' },
    ],
    labels: {
      nickname: 'Nickname',
      birthday: 'Date of Birth',
      gender: 'Gender',
      sexual_orientation: 'Sexual Orientation',
      location_country: 'Country',
      location_province: 'Province/State',
      location_city: 'City',
      mbti: 'MBTI Type',
      zodiac: 'Zodiac',
      growth_environment: 'Childhood Environment',
      financial_status: 'Financial Status',
      education: 'Education',
      pet_preference: 'Pet Preference',
      hobbies: 'Hobbies (max 5)',
      hobbies_custom: 'Custom Hobby',
      sound_preference: 'Sound Preference',
      color_mood: 'Color Resonance',
      color_mood_custom: 'Custom Color',
      scent_memory: 'Scent Memory',
      scent_memory_custom: 'Custom Scent',
      ritual: 'Your Little Ritual',
      ritual_custom: 'Custom Ritual',
      food_adventure: 'Food Adventure Style',
      conflict_reaction: 'After a Conflict',
      recharge_style: 'Recharge Style',
      mystery_question: 'My Mystery Question',
      mystery_answer: 'My Answer',
      valued_traits: 'Top 3 Valued Traits',
      valued_traits_custom: 'Custom Trait',
      relationship_goal: 'What are you looking for? (max 2)',
      photos: 'Photo Wall',
      contact_info: 'Contact Info',
      agree_terms: 'Agree to Terms',
    },
    placeholders: {
      nickname: 'Enter 1-20 characters',
      contact_info: 'e.g. wechat_abc123',
      mystery_question: 'Your question (max 50 chars)',
      mystery_answer: 'Your answer (max 100 chars)',
      hobbies_custom: 'Enter your custom hobby',
      color_mood_custom: 'Enter your custom color',
      scent_memory_custom: 'Enter your custom scent memory',
      ritual_custom: 'Enter your custom ritual',
      valued_traits_custom: 'Enter your custom valued trait',
    },
    errors: {
      required: 'This field is required',
      length: 'Length does not meet requirement',
      size: 'Selection count is out of range',
      invalid: 'Invalid value',
      past_date: 'Birthday must be in the past',
      adult_only: 'Only users aged 18+ can register',
      submit: 'Please fix highlighted fields before submitting',
    },
    options: {
      gender: {
        male: 'Male',
        female: 'Female',
        non_binary: 'Non-binary',
        prefer_not_to_say: 'Prefer not to say',
      },
      sexual_orientation: {
        heterosexual: 'Heterosexual',
        homosexual: 'Homosexual',
        bisexual: 'Bisexual',
        pansexual: 'Pansexual',
        queer: 'Queer',
        exploring: 'Other / Exploring',
      },
      mbti: { unknown: 'Unknown (open to explore)' },
      zodiac: {
        aries: 'Aries',
        taurus: 'Taurus',
        gemini: 'Gemini',
        cancer: 'Cancer',
        leo: 'Leo',
        virgo: 'Virgo',
        libra: 'Libra',
        scorpio: 'Scorpio',
        sagittarius: 'Sagittarius',
        capricorn: 'Capricorn',
        aquarius: 'Aquarius',
        pisces: 'Pisces',
      },
      growth_environment: {
        happy_family: 'Happy family',
        independent: 'Independent upbringing',
        complex: 'Complex',
        prefer_not_to_say: 'Prefer not to say',
      },
      financial_status: {
        student: 'Student',
        employed: 'Employed',
        self_employed: 'Self-employed',
        prefer_not_to_say: 'Prefer not to say',
      },
      education: {
        high_school: 'High school or below',
        associate: 'Associate degree',
        bachelor: "Bachelor's degree",
        master: "Master's degree",
        doctor: 'Doctorate',
        prefer_not_to_say: 'Prefer not to say',
      },
      pet_preference: {
        cat: 'Cat person',
        dog: 'Dog person',
        other_pet: 'Other small pets',
        no_pet_now: "Don't have one now, but fine with pets",
        allergic: 'Allergic or afraid',
      },
      hobbies: {
        reading_writing: 'Reading & Writing',
        movies_tv: 'Movies & TV',
        music_instruments: 'Music & Instruments',
        games: 'Games & Board Games',
        sports_fitness: 'Sports & Fitness',
        travel_food: 'Travel & Food Hunting',
        photography_art: 'Photography & Art',
        crafts_baking: 'Crafts & Baking',
        outdoors_camping: 'Outdoors & Camping',
        home_relax: 'Staying In & Relaxing',
        custom: 'Other (custom)',
      },
      sound_preference: {
        rain_fireplace: 'Rain noise or fireplace',
        cafe_clatter: 'Cafe chatter and cup sounds',
        instrumental: 'Pure instrumental (piano/violin)',
        livehouse_rap: 'Livehouse Rap',
      },
      color_mood: {
        warm_gold: 'Warm Gold',
        calm_blue: 'Calm Blue',
        chaotic_gray: 'Chaotic Gray',
        mysterious_purple: 'Mysterious Purple',
        custom: 'Other (custom)',
      },
      scent_memory: {
        home_cooking: 'Home cooking',
        rain_grass: 'Rainy grass',
        old_books: 'Old books',
        pool_sea: 'Pool / Sea breeze',
        perfume: 'Perfume',
        not_sensitive: 'Not sensitive',
        custom: 'Other (custom)',
      },
      ritual: {
        wipe_cup: 'Wipe cup edge before drinking',
        couch_5min: 'Sit on couch for 5 mins after home',
        prepare_clothes: 'Prepare next-day clothes before sleep',
        music_shower: 'Need music in shower',
        no_ritual: 'No fixed ritual',
        custom: 'Other (custom)',
      },
      food_adventure: {
        safe_guard: 'Safe guard',
        mild_explorer: 'Mild explorer',
        extreme_explorer: 'Extreme explorer',
        survival: 'Survival mode',
      },
      conflict_reaction: {
        need_space: 'Need space first',
        talk_immediately: 'Talk immediately',
        pretend_fine: 'Pretend fine',
        depends: 'Depends',
      },
      recharge_style: {
        deep_talk: 'Deep talks',
        alone_time: 'Alone time',
        quality_time: 'Quality time together',
        friends_social: 'Friends and social',
      },
      valued_traits: {
        humor: 'Humor',
        gentle: 'Gentle',
        ambitious: 'Ambitious',
        intelligent: 'Intelligent',
        independent: 'Independent',
        romantic: 'Romantic',
        sincere: 'Sincere',
        patient: 'Patient',
        loves_life: 'Loves life',
        good_looking: 'Good looking',
        financially_stable: 'Financially stable',
        loves_animals: 'Loves animals',
        family_oriented: 'Family-oriented',
        custom: 'Other (custom)',
      },
      relationship_goal: {
        stable_partner: 'Stable partner',
        deep_connection: 'Deep connection',
        playmate: 'Playmate',
        healing: 'Healing',
        no_expectations: 'No expectations yet',
      },
    },
  },
};
