import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];

/**
 * Fetches all payment options for a contest, ordered by sort_order
 */
export async function getPaymentOptionsForContest(contestId: string): Promise<PaymentOption[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('payment_options')
    .select('*')
    .eq('contest_id', contestId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch payment options: ${error.message}`);
  }

  return data ?? [];
}
