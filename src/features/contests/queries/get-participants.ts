import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type PaymentStatus = Database['public']['Enums']['payment_status'];

export interface Participant {
  id: string;
  row_index: number;
  col_index: number;
  payment_status: PaymentStatus;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  claimant_email: string | null;
  claimant_venmo: string | null;
  claimed_at: string | null;
  paid_at: string | null;
  referred_by: string | null;
}

/**
 * Fetches all claimed squares (participants) for a contest
 * Returns squares where payment_status is not 'available'
 */
export async function getParticipantsForContest(contestId: string): Promise<Participant[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('squares')
    .select(
      'id, row_index, col_index, payment_status, claimant_first_name, claimant_last_name, claimant_email, claimant_venmo, claimed_at, paid_at, referred_by'
    )
    .eq('contest_id', contestId)
    .neq('payment_status', 'available')
    .order('claimed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`);
  }

  return data ?? [];
}
