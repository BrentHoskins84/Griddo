'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';

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
export async function saveScores(
  contestId: string,
  scores: ScoreInput[]
): Promise<ActionResponse<SaveScoresResult>> {
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
    .select('id, owner_id, status, row_numbers, col_numbers')
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
      winningSquare = squares?.find(
        (sq) => sq.row_index === winningRowIndex && sq.col_index === winningColIndex
      );
    }

    const winningSquareId = winningSquare?.id || null;

    // Upsert the score (update if quarter exists, insert if not)
    const { error: upsertError } = await supabase
      .from('scores')
      .upsert(
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
  }

  return {
    data: { winners },
    error: null,
  };
}

