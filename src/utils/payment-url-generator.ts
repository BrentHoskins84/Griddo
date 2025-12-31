import type { Database } from '@/libs/supabase/types';

type PaymentType = Database['public']['Enums']['payment_option_type'];

export function generatePaymentUrl(
  type: PaymentType,
  handle: string
): string | null {
  switch (type) {
    case 'venmo':
      return `https://venmo.com/${handle}?txn=pay`;
    case 'paypal':
      return `https://paypal.me/${handle}`;
    case 'cashapp':
      return `https://cash.app/${handle}`;
    case 'zelle':
      return null;
  }
}

