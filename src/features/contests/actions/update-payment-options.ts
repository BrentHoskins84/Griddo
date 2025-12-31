'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

type PaymentOptionInsert = Database['public']['Tables']['payment_options']['Insert'];
type PaymentOptionType = Database['public']['Enums']['payment_option_type'];

interface PaymentOptionInput {
  type: PaymentOptionType;
  handle_or_link: string;
  display_name?: string | null;
  instructions?: string | null;
  sort_order: number;
  account_last_4_digits?: string | null;
  qr_code_url?: string | null;
}

/**
 * Updates payment options for a contest.
 * Deletes all existing options and inserts the new array.
 */
export async function updatePaymentOptions(
  contestId: string,
  options: PaymentOptionInput[]
): Promise<ActionResponse<null>> {
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
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

  // Delete all existing payment options for this contest
  const { error: deleteError } = await supabase.from('payment_options').delete().eq('contest_id', contestId);

  if (deleteError) {
    return { data: null, error: { message: `Failed to update: ${deleteError.message}` } };
  }

  // Insert new payment options if any
  if (options.length > 0) {
    const insertData: PaymentOptionInsert[] = options.map((opt) => ({
      contest_id: contestId,
      type: opt.type,
      handle_or_link: opt.handle_or_link,
      display_name: opt.display_name || null,
      instructions: opt.instructions || null,
      sort_order: opt.sort_order,
      account_last_4_digits: opt.account_last_4_digits || null,
      qr_code_url: opt.qr_code_url || null,
    }));

    const { error: insertError } = await supabase.from('payment_options').insert(insertData);

    if (insertError) {
      return { data: null, error: { message: `Failed to save: ${insertError.message}` } };
    }
  }

  return { data: null, error: null };
}
