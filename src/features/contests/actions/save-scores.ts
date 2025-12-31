'use server';

import { sendEmail } from '@/features/emails/send-email';
import { winnerEmail } from '@/features/emails/templates/winner-email';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

type GameQuarter = Database['public']['Enums']['game_quarter'];

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
  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'You must be logged in' } };
  }

  // Fetch contest and verify ownership
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select(
      `id, owner_id, status, row_numbers, col_numbers, name, slug, square_price,
       row_team_name, col_team_name,
       payout_q1_percent, payout_q2_percent, payout_q3_percent, payout_final_percent,
       payout_game1_percent, payout_game2_percent, payout_game3_percent, payout_game4_percent,
       payout_game5_percent, payout_game6_percent, payout_game7_percent`
    )
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    return { data: null, error: { message: 'Contest not found' } };
  }

  if (contest.owner_id !== user.id) {
    return { data: null, error: { message: 'You do not own this contest' } };
  }

  // Verify contest is in progress
  if (contest.status !== 'in_progress') {
    return {
      data: null,
      error: {
        message: 'Scores can only be entered when the contest is in progress',
      },
    };
  }

  // Verify row and column numbers are assigned
  if (!contest.row_numbers || !contest.col_numbers) {
    return {
      data: null,
      error: {
        message: 'Grid numbers must be assigned before entering scores',
      },
    };
  }

  // Fetch all squares for this contest
  const { data: squares, error: squaresError } = await supabase
    .from('squares')
    .select('id, row_index, col_index, claimant_first_name, claimant_last_name, claimant_email')
    .eq('contest_id', contestId);

  if (squaresError) {
    return {
      data: null,
      error: { message: `Failed to fetch squares: ${squaresError.message}` },
    };
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
        entered_at: new Date().toISOString(),
      },
      {
        onConflict: 'contest_id,quarter',
      }
    );

    if (upsertError) {
      return {
        data: null,
        error: { message: `Failed to save score for ${score.quarter}: ${upsertError.message}` },
      };
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
      try {
        const quarterNames: Record<string, string> = {
          q1: 'Q1',
          q2: 'Halftime',
          q3: 'Q3',
          final: 'Final',
          game1: 'Game 1',
          game2: 'Game 2',
          game3: 'Game 3',
          game4: 'Game 4',
          game5: 'Game 5',
          game6: 'Game 6',
          game7: 'Game 7',
        };

        // Calculate prize amount based on payout percentage
        const payoutPercentKey = `payout_${score.quarter}_percent` as keyof typeof contest;
        const payoutPercent = (contest[payoutPercentKey] as number | null) || 0;
        const totalPot = contest.square_price * 100;
        const prizeAmount = (totalPot * payoutPercent) / 100;

        const { subject, html } = winnerEmail({
          participantName: winningSquare.claimant_first_name || 'Winner',
          contestName: contest.name,
          quarterName: quarterNames[score.quarter] || score.quarter,
          homeTeamName: contest.row_team_name,
          awayTeamName: contest.col_team_name,
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          prizeAmount,
          contestUrl: `${getURL()}/contest/${contest.slug}`,
        });

        await sendEmail({
          to: winningSquare.claimant_email,
          subject,
          html,
          contestId,
          squareId: winningSquare.id,
          emailType: 'winner_notification',
        });
      } catch (emailError) {
        // Log error but don't fail the score save
        console.error('Failed to send winner notification email:', emailError);
      }
    }
  }

  return {
    data: { winners },
    error: null,
  };
}
