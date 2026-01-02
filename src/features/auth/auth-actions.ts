'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';
import { logger } from '@/utils/logger';

import { getUserFriendlyErrorMessage } from './auth-error-types';

export async function signInWithOAuth(
  provider: 'google',
  redirectTo?: string | null
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const callbackUrl = redirectTo
    ? `${getURL('/auth/callback')}?next=${encodeURIComponent(redirectTo)}`
    : getURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    logger.error('auth', error);
    const friendlyError = getUserFriendlyErrorMessage(error);
    return { data: null, error: { message: friendlyError.message, code: friendlyError.type } };
  }

  return redirect(data.url);
}

export async function signInWithEmail(email: string): Promise<ActionResponse<{ email: string }>> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    logger.error('auth', error);
    const friendlyError = getUserFriendlyErrorMessage(error);
    return { data: null, error: { message: friendlyError.message, code: friendlyError.type } };
  }

  return { data: { email }, error: null };
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error('auth', error);
    const friendlyError = getUserFriendlyErrorMessage(error);
    return { data: null, error: { message: friendlyError.message, code: friendlyError.type } };
  }

  redirect('/');
}

export async function resendMagicLink(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    logger.error('auth', error);
    const friendlyError = getUserFriendlyErrorMessage(error);
    return { data: null, error: { message: friendlyError.message, code: friendlyError.type } };
  }

  return { data: null, error: null };
}
