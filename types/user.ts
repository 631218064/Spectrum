// types/user.ts
// 用户相关的类型定义，包含 Profile 的扩展和会话信息

import { Profile } from './database';

// 登录用户信息（包含认证和资料）
export interface UserSession {
  user: {
    id: string;
    email?: string;
  };
  profile: Profile | null;
}

// 注册表单数据类型（与 Profile 略有不同，可能包含临时字段）
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

// 登录表单数据类型
export interface SignInFormData {
  email: string;
  password: string;
}

// 更新资料请求数据类型（部分更新）
export type UpdateProfileData = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;