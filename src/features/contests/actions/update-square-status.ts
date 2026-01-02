'use server';

import { PaymentStatus, PaymentStatusType } from '@/features/contests/constants';
import { ContestErrors } from '@/features/contests/constants/error-messages';
import { sendEmailSafe } from '@/features/emails/send-email-safe';
import { paymentConfirmedEmail } from '@/features/emails/templates/payment-confirmed-email';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';
import { getCurrentISOString } from '@/utils/date-formatters';
import { getURL } from '@/utils/get-url';

import { NotFoundError, withContestOwnership } from '../middleware/auth-middleware';

interface UpdateSquareStatusInput {
  squareId: string;
  contestId: string;
  newStatus: PaymentStatusType;
}

/**
 * Updates the payment status of a square.
 * Only contest owners can update square status.
 * When setting to 'available', clears all claimant info.
 * When setting to 'paid', sets paid_at timestamp.
 */
export async function updateSquareStatus(
  input: UpdateSquareStatusInput
): Promise<ActionResponse<{ success: boolean }>> {
  const { squareId, contestId, newStatus } = input;

  // Validate required fields
  if (!squareId || !contestId || !newStatus) {
    return {
      data: null,
      error: { message: ContestErrors.ALL_FIELDS_REQUIRED },
    };
  }

  // Validate status value
  const validStatuses: PaymentStatusType[] = [
    PaymentStatus.AVAILABLE,
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
  ];
  if (!validStatuses.includes(newStatus)) {
    return {
      data: null,
      error: { message: ContestErrors.INVALID_STATUS },
    };
  }

  return withContestOwnership<{ success: boolean }>(contestId, async (user, supabase, contest) => {
    // Verify square belongs to contest
    const { data: square, error: squareError } = await supabase
      .from('squares')
      .select('id, contest_id, payment_status, claimant_email, claimant_first_name, row_index, col_index')
      .eq('id', squareId)
      .eq('contest_id', contestId)
      .single();

    if (squareError || !square) {
      throw new NotFoundError(ContestErrors.SQUARE_NOT_FOUND);
    }

    // Build update data based on new status
    type SquareUpdate = Database['public']['Tables']['squares']['Update'];
    let updateData: SquareUpdate = {
      payment_status: newStatus,
    };

    if (newStatus === PaymentStatus.AVAILABLE) {
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
    } else if (newStatus === PaymentStatus.PAID) {
      // Set paid_at timestamp when marking as paid
      updateData = {
        ...updateData,
        paid_at: getCurrentISOString(),
      };
    } else if (newStatus === PaymentStatus.PENDING) {
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
      throw new NotFoundError(ContestErrors.SQUARE_NOT_FOUND);
    }

    // Send confirmation email when marking as paid (don't block on failure)
    if (newStatus === PaymentStatus.PAID && square.claimant_email) {
      const contestUrl = `${getURL()}/contest/${contest.slug}`;

      sendEmailSafe({
        to: square.claimant_email,
        template: paymentConfirmedEmail({
          participantName: square.claimant_first_name || 'there',
          contestName: contest.name,
          rowTeamName: contest.row_team_name,
          colTeamName: contest.col_team_name,
          rowIndex: square.row_index,
          colIndex: square.col_index,
          contestUrl,
        }),
        contestId,
        squareId: square.id,
        emailType: 'payment_confirmed',
      });
    }

    return { success: true };
  })();
}
