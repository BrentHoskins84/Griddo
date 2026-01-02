'use server';

import { ContestStatus, QuarterDisplayNames } from '@/features/contests/constants';
import { ContestErrors } from '@/features/contests/constants/error-messages';
import { sendEmailSafe } from '@/features/emails/send-email-safe';
import { winnerEmail } from '@/features/emails/templates/winner-email';
import { ActionResponse } from '@/types/action-response';
import { getCurrentISOString } from '@/utils/date-formatters';
import { getURL } from '@/utils/get-url';

import { withContestOwnership } from '../middleware/auth-middleware';
import { GameQuarter } from '../types';

interface ScoreInput {
  quarter: GameQuarter;
  homeScore: number;
  awayScore: number;
}

interface WinnerInfo {
  quarter: GameQuarter;
  homeScore: number;
  awayScore: number;
  winningSquareId: string | null;
  winnerName: string | null;
  winnerEmail: string | null;
}

interface SaveScoresResult {
  winners: WinnerInfo[];
}

/**
 * Saves game scores for a contest and calculates winning squares.
 * Only the contest owner can save scores, and the contest must be in 'in_progress' status.
 */
export async function saveScores(contestId: string, scores: ScoreInput[]): Promise<ActionResponse<SaveScoresResult>> {
  return withContestOwnership<SaveScoresResult>(contestId, async (user, supabase, contest) => {

    // Verify contest is in progress
    if (contest.status !== ContestStatus.IN_PROGRESS) {
      throw new Error(ContestErrors.SCORES_ONLY_IN_PROGRESS);
    }

    // Verify row and column numbers are assigned
    if (!contest.row_numbers || !contest.col_numbers) {
      throw new Error(ContestErrors.NUMBERS_REQUIRED);
    }

    // Fetch all squares for this contest
    const { data: squares, error: squaresError } = await supabase
      .from('squares')
      .select('id, row_index, col_index, claimant_first_name, claimant_last_name, claimant_email')
      .eq('contest_id', contestId);

    if (squaresError) {
      throw new Error('Failed to fetch squares');
    }

    // Fetch existing scores to determine which quarters are new
    const { data: existingScores } = await supabase
      .from('scores')
      .select('quarter, winning_square_id')
      .eq('contest_id', contestId);

    const existingScoreMap = new Map(existingScores?.map((s) => [s.quarter, s.winning_square_id]) || []);

    const winners: WinnerInfo[] = [];

    // Process each score entry
    for (const score of scores) {
      // Calculate winning position based on last digit of scores
      const homeLastDigit = score.homeScore % 10;
      const awayLastDigit = score.awayScore % 10;

      // Find the index in row_numbers where the value matches homeLastDigit
      // This index is the winning row
      const winningRowIndex = contest.row_numbers.indexOf(homeLastDigit);

      // Find the index in col_numbers where the value matches awayLastDigit
      // This index is the winning column
      const winningColIndex = contest.col_numbers.indexOf(awayLastDigit);

      // Find the square at the intersection
      let winningSquare = null;
      if (winningRowIndex !== -1 && winningColIndex !== -1) {
        winningSquare = squares?.find((sq) => sq.row_index === winningRowIndex && sq.col_index === winningColIndex);
      }

      const winningSquareId = winningSquare?.id || null;

      // Upsert the score (update if quarter exists, insert if not)
      const { error: upsertError } = await supabase.from('scores').upsert(
        {
          contest_id: contestId,
          quarter: score.quarter,
          home_score: score.homeScore,
          away_score: score.awayScore,
          winning_square_id: winningSquareId,
          entered_at: getCurrentISOString(),
        },
        {
          onConflict: 'contest_id,quarter',
        }
      );

      if (upsertError) {
        throw new Error(`Failed to save score for ${score.quarter}`);
      }

      // Build winner name if square was claimed
      let winnerName: string | null = null;
      if (winningSquare?.claimant_first_name) {
        winnerName = winningSquare.claimant_first_name;
        if (winningSquare.claimant_last_name) {
          winnerName += ` ${winningSquare.claimant_last_name}`;
        }
      }

      winners.push({
        quarter: score.quarter,
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        winningSquareId,
        winnerName,
        winnerEmail: winningSquare?.claimant_email || null,
      });

      // Send winner notification email if this is a new winner
      const previousWinningSquareId = existingScoreMap.get(score.quarter);
      const isNewWinner = winningSquareId && winningSquareId !== previousWinningSquareId;

      if (isNewWinner && winningSquare?.claimant_email) {
        // Calculate prize amount based on payout percentage
        const payoutPercentKey = `payout_${score.quarter}_percent` as keyof typeof contest;
        const payoutPercent = (contest[payoutPercentKey] as number | null) || 0;
        const gridSize = contest.row_numbers.length * contest.col_numbers.length;
        const totalPot = contest.square_price * gridSize;
        const prizeAmount = (totalPot * payoutPercent) / 100;

        sendEmailSafe({
          to: winningSquare.claimant_email,
          template: winnerEmail({
            participantName: winningSquare.claimant_first_name || 'Winner',
            contestName: contest.name,
            quarterName: QuarterDisplayNames[score.quarter] || score.quarter,
            homeTeamName: contest.row_team_name,
            awayTeamName: contest.col_team_name,
            homeScore: score.homeScore,
            awayScore: score.awayScore,
            prizeAmount,
            contestUrl: `${getURL()}/contest/${contest.slug}`,
          }),
          contestId,
          squareId: winningSquare.id,
          emailType: 'winner_notification',
        });
      }
    }

    return { winners };
  })();
}
