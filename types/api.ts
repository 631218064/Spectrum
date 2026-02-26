// types/api.ts
// API 请求和响应的通用类型

// 通用 API 响应格式
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数（如果将来需要分页）
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 匹配列表响应（直接返回 MatchCard[]）
export type MatchesResponse = MatchCard[];

// 匹配请求响应（创建请求后）
export interface MatchRequestResponse {
  status: 'pending' | 'matched';
  matchId?: string;
}

// 上传图片响应
export interface UploadResponse {
  url: string;
}

// 每日消息发送响应
export interface SendMessageResponse {
  success: boolean;
}