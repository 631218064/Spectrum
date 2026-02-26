// lib/supabase.ts
// Supabase 客户端初始化，提供数据库、认证、存储的访问实例

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in environment variables');
}
if (!supabaseAnonKey) {
  throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);