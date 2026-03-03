import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

type UploadInput =
  | File
  | {
      name?: string;
      originalname?: string;
      originalFilename?: string;
      type?: string;
      mimetype?: string;
      buffer?: Buffer | Uint8Array | ArrayBuffer;
      arrayBuffer?: () => Promise<ArrayBuffer>;
    };

function getUploadName(file: UploadInput) {
  const rawName =
    ('name' in file && file.name) ||
    ('originalname' in file && file.originalname) ||
    ('originalFilename' in file && file.originalFilename) ||
    'upload.bin';
  return String(rawName).replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function getUploadBody(file: UploadInput) {
  if (typeof File !== 'undefined' && file instanceof File) return file;
  if ('buffer' in file && file.buffer) return file.buffer;
  if ('arrayBuffer' in file && typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  throw new Error('Unsupported upload file type');
}

function getContentType(file: UploadInput) {
  return ('type' in file && file.type) || ('mimetype' in file && file.mimetype) || undefined;
}

export async function uploadProfilePhoto(file: UploadInput, userId: string, useAdminClient = false): Promise<string> {
  const timestamp = Date.now();
  const safeFileName = getUploadName(file);
  const filePath = `profiles/${userId}/${timestamp}-${safeFileName}`;
  const uploadBody = await getUploadBody(file);
  const storage = (useAdminClient ? supabaseAdmin : supabase).storage;

  const { error: uploadError } = await storage.from('profiles').upload(filePath, uploadBody as any, {
    cacheControl: '3600',
    contentType: getContentType(file),
    upsert: false,
  });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: urlData } = storage.from('profiles').getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function deleteProfilePhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from('profiles').remove([filePath]);
  if (error) {
    // best-effort cleanup
    // eslint-disable-next-line no-console
    console.error('Delete file failed:', error.message);
  }
}
