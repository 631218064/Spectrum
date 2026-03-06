// pages/api/upload.ts
// 处理用户头像上传（需使用 formidable 解析 multipart/form-data）

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { uploadProfilePhoto } from '@/lib/storage';
import formidable, { type Fields, type Files } from 'formidable';
import fs from 'fs';
import { getRequestId, logApiError, logApiWarn } from '@/lib/apiLogger';

export const config = {
  api: {
    bodyParser: false, // 禁用内置 bodyParser 以使用 formidable
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization', requestId });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Invalid authorization header', requestId });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    logApiWarn(req, requestId, 'Invalid token in upload API', { authError: authError?.message });
    return res.status(401).json({ error: 'Invalid token', requestId });
  }

  const form = formidable({ multiples: false });
  form.parse(req, async (err: Error | null, _fields: Fields, files: Files) => {
    if (err) {
      logApiError(req, requestId, err, { userId: user.id, phase: 'form_parse' });
      return res.status(500).json({ error: 'Upload parse error', requestId });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded', requestId });
    }

    try {
      // 读取文件内容
      const fileBuffer = fs.readFileSync(file.filepath);
      // 上传到 Supabase Storage
      const publicUrl = await uploadProfilePhoto(
        {
          buffer: fileBuffer,
          originalFilename: file.originalFilename || 'upload.jpg',
          mimetype: file.mimetype || 'application/octet-stream',
        } as any,
        user.id,
        true
      );

      // 更新用户资料的 profile_photo_url
      await supabaseAdmin
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id);

      return res.status(200).json({ url: publicUrl });
    } catch (uploadErr: any) {
      logApiError(req, requestId, uploadErr, { userId: user.id, phase: 'upload_to_storage' });
      return res.status(500).json({ error: uploadErr.message, requestId });
    }
  });
}
