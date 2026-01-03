'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { validateImageFile } from '@/utils/file-validators';
import { logger } from '@/utils/logger';

export async function uploadAvatar(formData: FormData): Promise<ActionResponse<{ url: string }>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (authError) {
      logger.warn('uploadAvatar', 'Authentication failed', { error: authError.message });
    }
    return { data: null, error: { message: 'You must be logged in to upload an avatar' } };
  }

  // Get file from form data
  const file = formData.get('file') as File | null;

  if (!file) {
    return { data: null, error: { message: 'No file provided' } };
  }

  // Validate file type (MIME)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { data: null, error: { message: 'Invalid file type. Use JPEG, PNG, or WebP.' } };
  }

  // Validate actual file content
  const contentValidation = await validateImageFile(file);
  if (!contentValidation.valid) {
    return { data: null, error: { message: contentValidation.error! } };
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { data: null, error: { message: 'File too large. Maximum size is 2MB.' } };
  }

  // Generate file path: {userId}/avatar.{ext}
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${user.id}/avatar.${ext}`;

  // Upload to storage (upsert to replace existing avatar)
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    logger.error('uploadAvatar', uploadError, {
      userId: user.id,
    });
    return { data: null, error: { message: `Upload failed: ${uploadError.message}` } };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Update users table with new avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    logger.error('uploadAvatar', updateError, {
      code: updateError.code,
      userId: user.id,
    });
    return { data: null, error: { message: 'Failed to update avatar URL. Please try again.' } };
  }

  return { data: { url: publicUrl }, error: null };
}

