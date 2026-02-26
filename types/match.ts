// types/match.ts
// 匹配相关类型，包括匹配卡片、线索、消息等

import { Profile } from './database';

// 匹配卡片（前端展示用）
export interface MatchCard {
  id: string;
  current_day: number;
  status: string;
  created_at: string;
  day1_clues: string[];
  day2_clues: string[];
  day3_clues: string[];
  day4_clues: string[];
  day5_unlocked_at?: string;
  otherUser: {
    id: string;
    username?: string;
    mbti?: string;
    role?: string;
    profile_photo_url?: string;
    preferred_contact?: string;
  };
}

// 匹配请求（前端用）
export interface MatchRequestItem {
  id: string;
  from_user: {
    id: string;
    username?: string;
    profile_photo_url?: string;
  };
  created_at: string;
  expires_at: string;
}

// 发送匹配请求的请求体
export interface SendMatchRequest {
  toUserId: string;
}

// 响应匹配请求的请求体
export interface RespondMatchRequest {
  requestId: string;
  accept: boolean;
}

// 每日消息
export interface DailyMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  day_number: number;
  created_at: string;
  sender?: {
    id: string;
    username?: string;
  };
}

// 发送消息的请求体
export interface SendMessageRequest {
  content: string;
}