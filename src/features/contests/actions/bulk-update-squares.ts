'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

type PaymentStatus = Database['public']['Enums']['payment_status'];

interface BulkUpdateSquaresInput {
  contestId: string;
  squareIds: string[];
  newStatus: PaymentStatus;
}

export async function bulkUpdateSquares({
  contestId,
  squareIds,
  newStatus,
}: BulkUpdateSquaresInput): Promise<ActionResponse<{ updated: number }>> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: 'Unauthorized' } };
    }

    // Verify contest ownership
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('id')
      .eq('id', contestId)
      .eq('owner_id', user.id)
      .single();

    if (contestError || !contest) {
      return { error: { message: 'Contest not found or access denied' } };
    }

    if (squareIds.length === 0) {
      return { error: { message: 'No squares selected' } };
    }

    // Build update data based on new status
    const updateData: {
      payment_status: PaymentStatus;
      paid_at?: string | null;
    } = {
      payment_status: newStatus,
    };

    // Set paid_at timestamp when marking as paid
    if (newStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    } else if (newStatus === 'pending') {
      updateData.paid_at = null;
    }

    // Update all squares in one query
    const { error: updateError, count } = await supabase
      .from('squares')
      .update(updateData)
      .eq('contest_id', contestId)
      .in('id', squareIds);

    if (updateError) {
      return { error: { message: `Failed to update squares: ${updateError.message}` } };
    }

    return { data: { updated: count ?? squareIds.length } };
  } catch (error) {
    return { error: { message: 'An unexpected error occurred' } };
  }
}

