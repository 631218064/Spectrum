// pages/api/profile.ts
// 保存用户资料（注册表单提交）

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: true, // 使用 JSON 解析，照片上传请使用单独接口
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 仅允许 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 获取 Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.split(' ')[1];

  // 验证用户
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = user.id;
  const profileData = req.body;

  // 必填字段验证（可根据需要调整）
  const requiredFields = ['mbti','age', 'zodiac', 'pet', 'country', 'city', 'role', 'family'];
  for (const field of requiredFields) {
    if (!profileData[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  try {
    // 插入或更新 profiles 表
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    if (profileData.age && (typeof profileData.age !== 'number' || profileData.age < 18)) {
      return res.status(400).json({ error: 'Invalid age' });
    };
    return res.status(200).json({ success: true, profile: data });
  } catch (err: any) {
    console.error('Profile save error:', err);
    return res.status(500).json({ error: err.message });
  }
}