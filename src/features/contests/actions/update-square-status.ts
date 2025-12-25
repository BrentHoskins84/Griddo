'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type PaymentStatus = Database['public']['Enums']['payment_status'];

interface UpdateSquareStatusInput {
  squareId: string;
  contestId: string;
  newStatus: PaymentStatus;
}

interface UpdateSquareStatusResponse {
  data: { success: boolean } | null;
  error: { message: string } | null;
}

/**
 * Updates the payment status of a square.
 * Only contest owners can update square status.
 * When setting to 'available', clears all claimant info.
 * When setting to 'paid', sets paid_at timestamp.
 */
export async function updateSquareStatus(
  input: UpdateSquareStatusInput
): Promise<UpdateSquareStatusResponse> {
  const { squareId, contestId, newStatus } = input;

  // Validate required fields
  if (!squareId || !contestId || !newStatus) {
    return {
      data: null,
      error: { message: 'All required fields must be provided' },
    };
  }

  // Validate status value
  const validStatuses: PaymentStatus[] = ['available', 'pending', 'paid'];
  if (!validStatuses.includes(newStatus)) {
    return {
      data: null,
      error: { message: 'Invalid status value' },
    };
  }

  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: { message: 'You must be logged in to perform this action' },
    };
  }

  // Verify user owns the contest
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, owner_id')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    console.error('Error fetching contest:', contestError);
    return {
      data: null,
      error: { message: 'Contest not found' },
    };
  }

  if (contest.owner_id !== user.id) {
    return {
      data: null,
      error: { message: 'You do not have permission to manage this contest' },
    };
  }

  // Verify square belongs to contest
  const { data: square, error: squareError } = await supabase
    .from('squares')
    .select('id, contest_id, payment_status')
    .eq('id', squareId)
    .eq('contest_id', contestId)
    .single();

  if (squareError || !square) {
    console.error('Error fetching square:', squareError);
    return {
      data: null,
      error: { message: 'Square not found' },
    };
  }

  // Build update data based on new status
  type SquareUpdate = Database['public']['Tables']['squares']['Update'];
  let updateData: SquareUpdate = {
    payment_status: newStatus,
  };

  if (newStatus === 'available') {
    // Clear all claimant info when releasing square
    updateData = {
      ...updateData,
      claimant_first_name: null,
      claimant_last_name: null,
      claimant_email: null,
      claimant_venmo: null,
      claimed_at: null,
      paid_at: null,
    };
  } else if (newStatus === 'paid') {
    // Set paid_at timestamp when marking as paid
    updateData = {
      ...updateData,
      paid_at: new Date().toISOString(),
    };
  } else if (newStatus === 'pending') {
    // Clear paid_at when reverting to pending
    updateData = {
      ...updateData,
      paid_at: null,
    };
  }

  // Update the square
  const { error: updateError } = await supabase
    .from('squares')
    .update(updateData)
    .eq('id', squareId)
    .eq('contest_id', contestId);

  if (updateError) {
    console.error('Error updating square:', updateError);
    return {
      data: null,
      error: { message: 'Failed to update square status. Please try again.' },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}

