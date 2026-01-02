'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { validateImageFile } from '@/utils/file-validators';

import { requireAuth } from '../middleware/auth-middleware';

type ImageType = 'hero' | 'logo';

/**
 * Uploads an image to Supabase Storage for a contest.
 * Returns the public URL of the uploaded image.
 */
export async function uploadContestImage(
  contestId: string,
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  const authResult = await requireAuth();
  const { user, supabase } = authResult;

  // Get file from form data
  const file = formData.get('file') as File | null;
  const imageType = formData.get('imageType') as ImageType | null;

  if (!file) {
    return { data: null, error: { message: 'No file provided' } };
  }

  if (!imageType || !['hero', 'logo'].includes(imageType)) {
    return { data: null, error: { message: 'Invalid image type' } };
  }

  // Validate file type (MIME)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { data: null, error: { message: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' } };
  }

  // Validate actual file content
  const contentValidation = await validateImageFile(file);
  if (!contentValidation.valid) {
    return { data: null, error: { message: contentValidation.error! } };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { data: null, error: { message: 'File too large. Maximum size is 5MB.' } };
  }

  // Generate file path: {user_id}/{contest_id}/{type}_{timestamp}.{ext}
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const filePath = `${user.id}/${contestId}/${imageType}_${timestamp}.${ext}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage.from('contest-images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    return { data: null, error: { message: `Upload failed: ${uploadError.message}` } };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('contest-images').getPublicUrl(filePath);

  return { data: { url: urlData.publicUrl }, error: null };
}

/**
 * Deletes an image from Supabase Storage.
 */
export async function deleteContestImage(imageUrl: string): Promise<ActionResponse<null>> {
  // Verify user is authenticated
  const authResult = await requireAuth();
  const { user, supabase } = authResult;

  // Extract file path from URL
  const bucketUrl = '/contest-images/';
  const pathIndex = imageUrl.indexOf(bucketUrl);

  if (pathIndex === -1) {
    return { data: null, error: { message: 'Invalid image URL' } };
  }

  const filePath = imageUrl.substring(pathIndex + bucketUrl.length);

  // Verify user owns this file (path starts with their user ID)
  if (!filePath.startsWith(user.id)) {
    return { data: null, error: { message: 'You do not have permission to delete this image' } };
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage.from('contest-images').remove([filePath]);

  if (deleteError) {
    return { data: null, error: { message: `Delete failed: ${deleteError.message}` } };
  }

  return { data: null, error: null };
}
