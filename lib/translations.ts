// lib/translations.ts
// 多语言翻译配置，支持英文和简体中文
// 使用时通过当前语言代码获取对应对象

export const translations = {
  en: {
    brand: 'SPECTRUM',
    tagline: 'Emotional connection, slowly revealed.',
    toggleLang: '中文',
    getStarted: 'Begin Journey',
    steps: ['Identity', 'Values', 'Dynamics', 'Photo'],
    labels: {
      age: 'Age',
      mbti: 'MBTI Type',
      zodiac: 'Zodiac Sign',
      pet: 'Pet Preference',
      location: 'Location',
      country: 'Country',
      city: 'City',
      role: 'Identity/Role (T/P/H/None)',
      family: 'Family Background',
      loveStyle: 'Love Philosophy',
      dynamics: 'Preferred Dynamics',
      idealType: 'Ideal Type Tags',
      contact: 'WeChat ID / Contact',
      photo: 'Upload Profile Photo',
      looksFilter: 'Privacy Avatar Filter',
      matchLimit: 'Active Matches (Max 5)',
    },
    options: {
      pet: ['Cat Person', 'Dog Person', 'Other', 'Allergic'],
      family: ['Happy Family', 'Independent Upbringing', 'Complex', 'Prefer not to say'],
      loveStyle: ['Falling in love slowly', 'Instant Spark'],
      dynamics: [
        'Platonic',
        'Pillow Princess',
        'Pillow Prince',
        'Verse',
        'Soft Dom'
      ],
      roles: ['T', 'P', 'H', 'None'],
      mbti: ['INTJ','ENTJ','INTP','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'],
    },
    dashboard: {
      matches: 'Active Connections',
      clueTitle: 'Daily Clue',
      revealDay: 'Day',
      terminate: 'End Connection',
      unlocked: 'Unlocked',
      locked: 'Reveals on Day 5',
      waiting: 'Waiting for response...',
      sendMsg: 'Send Daily Message',
    },
  },
  zh: {
    brand: 'SPECTRUM',
    tagline: '慢下来，感知灵魂的温度。',
    toggleLang: 'EN',
    getStarted: '开启旅程',
    steps: ['基本信息', '价值观', '相处模式', '照片上传'],
    labels: {
      age: '年龄',
      mbti: '人格类型 (MBTI)',
      zodiac: '星座',
      pet: '宠物偏好',
      location: '所在地',
      country: '国家',
      city: '城市',
      role: '属性 (T/P/H/不定义)',
      family: '家庭背景',
      loveStyle: '爱情哲学',
      dynamics: '喜欢的相处模式',
      idealType: '理想型标签',
      contact: '微信号/联系方式',
      photo: '上传个人照片',
      looksFilter: '开启隐私头像滤镜',
      matchLimit: '活跃匹配 (上限5人)',
    },
    options: {
      pet: ['猫派', '狗派', '其他', '过敏'],
      family: ['家庭幸福', '独立成长', '情况复杂', '不想说'],
      loveStyle: ['日久生情', '一见钟情'],
      dynamics: [
        '柏拉图',
        '枕头公主',
        '枕头王子',
        '攻守兼备',
        '温柔主导'
      ],
      roles: ['T', 'P', 'H', '不定义'],
      mbti: ['INTJ','ENTJ','INTP','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'],
    },
    dashboard: {
      matches: '正在连接的灵魂',
      clueTitle: '今日线索',
      revealDay: '第',
      terminate: '结束连接',
      unlocked: '已解锁',
      locked: '将在第五天揭晓',
      waiting: '等待对方响应...',
      sendMsg: '发送今日消息',
    },
  },
};

export type Language = keyof typeof translations;
export type Translation = typeof translations.en;
export { registrationTranslations } from './registrationTranslations';

export const loginTranslations = {
  en: {
    toggleLang: '中文',
    emailLabel: 'Email',
    emailPlaceholder: 'Please input your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Please input your password',
    signIn: 'Sign In',
    processing: 'Processing...',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    genericError: 'Login failed. Please try again.',
  },
  zh: {
    toggleLang: 'EN',
    emailLabel: '邮箱',
    emailPlaceholder: '请输入邮箱',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    signIn: '登录',
    processing: '处理中...',
    noAccount: '还没有账号？',
    signUp: '注册',
    genericError: '登录失败，请重试。',
  },
} as const;
