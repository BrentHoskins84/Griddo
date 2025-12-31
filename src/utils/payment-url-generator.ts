import type { Database } from '@/libs/supabase/types';

type PaymentType = Database['public']['Enums']['payment_option_type'];

/**
 * Validates and sanitizes a payment handle.
 * Returns the sanitized handle or null if invalid.
 */
function sanitizeHandle(handle: string): string | null {
  const trimmed = handle.trim();

  // Reject empty handles
  if (!trimmed) {
    return null;
  }

  // Reject handles with control characters, slashes, or other URL-unsafe patterns
  // Allow: alphanumeric, @, $, -, _, .
  if (/[\/\\<>"\x00-\x1f]/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function generatePaymentUrl(
  type: PaymentType,
  handle: string
): string | null {
  const sanitized = sanitizeHandle(handle);

  if (!sanitized) {
    return null;
  }

  const encoded = encodeURIComponent(sanitized);

  switch (type) {
    case 'venmo':
      return `https://venmo.com/${encoded}?txn=pay`;
    case 'paypal':
      return `https://paypal.me/${encoded}`;
    case 'cashapp':
      return `https://cash.app/${encoded}`;
    case 'zelle':
      return null;
  }
}

