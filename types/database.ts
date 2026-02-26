// types/database.ts
// 数据库表对应的 TypeScript 类型（与 Supabase 表结构一致）

import { User as SupabaseUser } from '@supabase/supabase-js';

// 用户认证表（Supabase Auth 内置，此处仅作参考）
export type AuthUser = SupabaseUser;

// 用户资料表（profiles）
export interface Profile {
  id: string;                              // 关联 auth.users.id
  username?: string;                       // 用户名（可选）
  language_pref: 'en' | 'zh';               // 语言偏好

  // 基本身份
  age?: number;
  mbti?: string;                            // MBTI 类型
  zodiac?: string;                          // 星座
  pet?: string;                              // 宠物偏好
  interests?: string[];                      // 兴趣爱好数组

  // 居住地
  country?: string;                          // 国家
  city?: string;                             // 城市
  accept_long_distance?: boolean;             // 是否接受异地

  // 属性
  role?: 'T' | 'P' | 'H' | 'none';           // 属性

  // 家庭背景
  family_background?: 'happy_family' | 'independent' | 'complex' | 'prefer_not_to_say';

  // 爱情模式（多选）
  love_styles?: string[];                     // 例如 ["slow", "intellectual"]

  // 相处模式（多选）
  preferred_dynamics?: string[];               // 例如 ["platonic", "pillow_princess"]

  // 理想型
  ideal_type_tags?: string[];                  // 标签数组
  ideal_type_text?: string;                     // 自由文本

  // 工作/经济
  work_industry?: string;                       // 工作行业
  financial_status?: string;                     // 经济情况
  family_views?: string;                          // 家庭观
  love_views?: string;                             // 爱情观
  favorite_quote?: string;                          // 最喜欢的一句话

  // 联系方式（第5天可见）
  preferred_contact?: string;                       // 微信号/其他
  preferred_dynamic_irl?: string;                    // 喜欢的现实相处模式

  // 照片
  profile_photo_url?: string;                         // 原始照片 URL
  cartoon_photo_url?: string;                          // 卡通化照片 URL
  looks_filter_enabled?: boolean;                       // 是否启用外貌滤镜

  // 匹配限额
  matches_used_this_week?: number;                       // 本周已用匹配数
  last_match_reset?: string;                              // 上次重置时间 (ISO 字符串)

  // 通知
  email_notifications?: boolean;                           // 是否接收邮件通知
  sms_notifications?: boolean;                             // 是否接收短信通知
  phone_number?: string;                                    // 手机号

  // 时间戳
  created_at?: string;                                      // 创建时间
  updated_at?: string;                                      // 更新时间
}

// 匹配请求表（match_requests）
export interface MatchRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

// 匹配表（matches）
export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'active' | 'completed' | 'terminated';
  current_day: number;                       // 1-5
  day1_clues: string[];                       // 第1天线索数组
  day2_clues: string[];
  day3_clues: string[];
  day4_clues: string[];
  created_at: string;
  day5_unlocked_at?: string;                   // 第5天解锁时间
  terminated_by?: string;                       // 终止者用户ID
  terminated_at?: string;                        // 终止时间
}

// 消息表（messages）
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  day_number: number;                           // 发送时处于第几天
  created_at: string;
}