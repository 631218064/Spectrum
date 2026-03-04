import type { MatchCard } from './match';
// types/api.ts
// API 璇锋眰鍜屽搷搴旂殑閫氱敤绫诲瀷

// 閫氱敤 API 鍝嶅簲鏍煎紡
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 鍒嗛〉鍙傛暟锛堝鏋滃皢鏉ラ渶瑕佸垎椤碉級
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 鍒嗛〉鍝嶅簲
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 鍖归厤鍒楄〃鍝嶅簲锛堢洿鎺ヨ繑鍥?MatchCard[]锛?
export type MatchesResponse = MatchCard[];

// 鍖归厤璇锋眰鍝嶅簲锛堝垱寤鸿姹傚悗锛?
export interface MatchRequestResponse {
  status: 'pending' | 'matched';
  matchId?: string;
}

// 涓婁紶鍥剧墖鍝嶅簲
export interface UploadResponse {
  url: string;
}

// 姣忔棩娑堟伅鍙戦€佸搷搴?
export interface SendMessageResponse {
  success: boolean;
}
