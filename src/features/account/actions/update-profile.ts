'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { logger } from '@/utils/logger';

import { UpdateProfileFormData, updateProfileSchema } from '../validation/profile-schema';

export async function updateProfile(input: UpdateProfileFormData): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (authError) {
      logger.warn('updateProfile', 'Authentication failed', { error: authError.message });
    }
    return { data: null, error: { message: 'You must be logged in to update your profile' } };
  }

  // Validate input
  const validationResult = updateProfileSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      data: null,
      error: {
        message: 'Invalid profile data',
        details: validationResult.error.flatten().fieldErrors,
      },
    };
  }

  const data = validationResult.data;

  // Update user profile
  const { error: updateError } = await supabase
    .from('users')
    .update({ full_name: data.fullName })
    .eq('id', user.id);

  if (updateError) {
    logger.error('updateProfile', updateError, {
      code: updateError.code,
      userId: user.id,
    });

    return {
      data: null,
      error: { message: 'Failed to update profile. Please try again.' },
    };
  }

  return { data: null, error: null };
}

