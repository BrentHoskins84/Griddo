'use server';

import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'crypto';

import { getContestPin } from '@/features/contests/queries';

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

  // Fetch contest access PIN
  const accessPin = await getContestPin(contestSlug);

  if (accessPin === null) {
    return {
      data: null,
      error: { message: 'Contest not found' },
    };
  }

  // Compare PINs (case-insensitive, timing-safe)
  const normalizedCorrect = accessPin.toUpperCase();
  const normalizedEntered = enteredPin.toUpperCase();

  // Convert to buffers for timing-safe comparison
  const correctBuffer = Buffer.from(normalizedCorrect);
  const enteredBuffer = Buffer.from(normalizedEntered);

  // Pad shorter buffer to match longer to prevent timing leaks
  const maxLength = Math.max(correctBuffer.length, enteredBuffer.length);
  const paddedCorrect = Buffer.alloc(maxLength);
  const paddedEntered = Buffer.alloc(maxLength);
  correctBuffer.copy(paddedCorrect, 0);
  enteredBuffer.copy(paddedEntered, 0);

  const isCorrect = timingSafeEqual(paddedCorrect, paddedEntered);

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
  const pinHash = createHash('sha256').update(accessPin).digest('hex');

  cookieStore.set(cookieName, pinHash, {
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

  const pinHash = createHash('sha256').update(accessPin).digest('hex');

  return accessCookie?.value === pinHash;
}
