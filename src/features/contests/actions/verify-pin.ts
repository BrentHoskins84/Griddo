'use server';

import { cookies } from 'next/headers';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface VerifyPinInput {
  contestSlug: string;
  enteredPin: string;
}

interface VerifyPinResponse {
  data: { success: boolean } | null;
  error: { message: string } | null;
}

/**
 * Verifies a PIN for accessing a private contest.
 * If successful, sets a cookie to remember access for 7 days.
 */
export async function verifyPin(input: VerifyPinInput): Promise<VerifyPinResponse> {
  const { contestSlug, enteredPin } = input;

  if (!contestSlug || !enteredPin) {
    return {
      data: null,
      error: { message: 'Contest slug and PIN are required' },
    };
  }

  const supabase = await createSupabaseServerClient();

  // Fetch contest by slug
  const { data: contest, error: fetchError } = await supabase
    .from('contests')
    .select('access_pin')
    .eq('slug', contestSlug)
    .single();

  if (fetchError || !contest) {
    console.error('Error fetching contest:', fetchError);
    return {
      data: null,
      error: { message: 'Contest not found' },
    };
  }

  // Compare PINs (case-insensitive)
  const isCorrect = contest.access_pin?.toUpperCase() === enteredPin.toUpperCase();

  if (!isCorrect) {
    return {
      data: { success: false },
      error: { message: 'Incorrect PIN' },
    };
  }

  // Set access cookie (expires in 7 days)
  const cookieStore = await cookies();
  const cookieName = `contest_access_${contestSlug}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  cookieStore.set(cookieName, 'true', {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return {
    data: { success: true },
    error: null,
  };
}

/**
 * Checks if the user has access to a PIN-protected contest.
 * Returns true if no PIN is required or if the user has a valid access cookie.
 */
export async function hasContestAccess(contestSlug: string, accessPin: string | null): Promise<boolean> {
  // No PIN required - public access
  if (!accessPin) {
    return true;
  }

  // Check for access cookie
  const cookieStore = await cookies();
  const cookieName = `contest_access_${contestSlug}`;
  const accessCookie = cookieStore.get(cookieName);

  return accessCookie?.value === 'true';
}
