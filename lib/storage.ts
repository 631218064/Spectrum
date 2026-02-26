// lib/storage.ts
// 文件上传辅助函数，封装 Supabase Storage 操作

import { supabase } from './supabase';

/**
 * 上传用户头像到 Supabase Storage
 * @param file 要上传的文件对象（File 或 Blob）
 * @param userId 当前用户 ID，用于组织文件路径
 * @returns 上传后的公开 URL，如果失败则抛出错误
 */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  // 生成唯一文件名：时间戳 + 原始文件名（避免冲突）
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // 移除特殊字符
  const filePath = `profiles/${userId}/${timestamp}-${safeFileName}`;

  // 上传到 Supabase Storage 的 'profiles' 存储桶
  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // 不覆盖同名文件
    });

  if (uploadError) {
    throw new Error(`上传失败: ${uploadError.message}`);
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * 删除用户头像（可选，用于替换或清理）
 * @param filePath 文件的存储路径
 */
export async function deleteProfilePhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('profiles')
    .remove([filePath]);

  if (error) {
    console.error('删除文件失败:', error.message);
    // 不抛出错误，因为删除失败通常不影响主要流程
  }
}