'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';

/**
 * Uploads a QR code image to Supabase Storage for a payment option.
 * Returns the public URL of the uploaded image.
 */
export async function uploadPaymentQr(
  contestId: string,
  paymentOptionId: string,
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  // Verify user owns the contest
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, owner_id')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    return { data: null, error: { message: 'Contest not found' } };
  }

  if (contest.owner_id !== user.id) {
    return { data: null, error: { message: 'You do not own this contest' } };
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return { data: null, error: { message: 'No file provided' } };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { data: null, error: { message: 'Invalid file type. Use JPEG, PNG, or WebP.' } };
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { data: null, error: { message: 'File too large. Maximum size is 2MB.' } };
  }

  // Generate file path: {user_id}/{contest_id}/{payment_option_id}_{timestamp}.{ext}
  const ext = file.name.split('.').pop() || 'png';
  const timestamp = Date.now();
  const filePath = `${user.id}/${contestId}/${paymentOptionId}_${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-qr-codes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: { message: `Upload failed: ${uploadError.message}` } };
  }

  const { data: urlData } = supabase.storage.from('payment-qr-codes').getPublicUrl(filePath);

  return { data: { url: urlData.publicUrl }, error: null };
}

/**
 * Deletes a QR code image from Supabase Storage.
 */
export async function deletePaymentQr(qrCodeUrl: string): Promise<ActionResponse<null>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  const bucketUrl = '/payment-qr-codes/';
  const pathIndex = qrCodeUrl.indexOf(bucketUrl);

  if (pathIndex === -1) {
    return { data: null, error: { message: 'Invalid QR code URL' } };
  }

  const filePath = qrCodeUrl.substring(pathIndex + bucketUrl.length);

  // Verify user owns this file (path starts with their user ID)
  if (!filePath.startsWith(user.id)) {
    return { data: null, error: { message: 'You do not have permission to delete this image' } };
  }

  const { error: deleteError } = await supabase.storage.from('payment-qr-codes').remove([filePath]);

  if (deleteError) {
    return { data: null, error: { message: `Delete failed: ${deleteError.message}` } };
  }

  return { data: null, error: null };
}

