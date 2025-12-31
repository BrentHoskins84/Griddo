'use client';

import { Trophy } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/libs/supabase/types';

type Score = Database['public']['Tables']['scores']['Row'];
type GameQuarter = Database['public']['Enums']['game_quarter'];
type SportType = Database['public']['Enums']['sport_type'];

interface Square {
  id: string;
  row_index: number;
  col_index: number;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
}

interface Contest {
  sport_type: SportType;
  row_team_name: string;
  col_team_name: string;
  square_price: number;
  payout_q1_percent: number | null;
  payout_q2_percent: number | null;
  payout_q3_percent: number | null;
  payout_final_percent: number | null;
  payout_game1_percent: number | null;
  payout_game2_percent: number | null;
  payout_game3_percent: number | null;
  payout_game4_percent: number | null;
  payout_game5_percent: number | null;
  payout_game6_percent: number | null;
  payout_game7_percent: number | null;
}

interface WinnersSectionProps {
  contest: Contest;
  scores: Score[];
  squares: Square[];
}

const FOOTBALL_QUARTERS: { quarter: GameQuarter; label: string; payoutKey: keyof Contest }[] = [
  { quarter: 'q1', label: 'Q1', payoutKey: 'payout_q1_percent' },
  { quarter: 'q2', label: 'Halftime', payoutKey: 'payout_q2_percent' },
  { quarter: 'q3', label: 'Q3', payoutKey: 'payout_q3_percent' },
  { quarter: 'final', label: 'Final', payoutKey: 'payout_final_percent' },
];

const BASEBALL_GAMES: { quarter: GameQuarter; label: string; payoutKey: keyof Contest }[] = [
  { quarter: 'q1', label: 'Game 1', payoutKey: 'payout_game1_percent' },
  { quarter: 'q2', label: 'Game 2', payoutKey: 'payout_game2_percent' },
  { quarter: 'q3', label: 'Game 3', payoutKey: 'payout_game3_percent' },
  { quarter: 'final', label: 'Game 4', payoutKey: 'payout_game4_percent' },
];

function getQuarterConfig(sportType: SportType) {
  return sportType === 'football' ? FOOTBALL_QUARTERS : BASEBALL_GAMES;
}

function getWinnerName(square: Square | undefined): string {
  if (!square) return 'Unclaimed';
  if (!square.claimant_first_name) return 'Unclaimed';
  
  let name = square.claimant_first_name;
  if (square.claimant_last_name) {
    name += ` ${square.claimant_last_name}`;
  }
  return name;
}

export function WinnersSection({ contest, scores, squares }: WinnersSectionProps) {
  if (scores.length === 0) {
    return null;
  }

  const quarterConfig = getQuarterConfig(contest.sport_type);
  const totalPot = contest.square_price * 100;

  // Create a map of squares by ID for quick lookup
  const squaresMap = new Map(squares.map((sq) => [sq.id, sq]));

  // Get scores with winner info
  const scoresWithWinners = scores
    .map((score) => {
      const config = quarterConfig.find((q) => q.quarter === score.quarter);
      if (!config) return null;

      const payoutPercent = contest[config.payoutKey] as number | null;
      const payoutAmount = payoutPercent != null ? (totalPot * payoutPercent) / 100 : null;
      const winningSquare = score.winning_square_id ? squaresMap.get(score.winning_square_id) : undefined;

      return {
        quarter: score.quarter,
        label: config.label,
        homeScore: score.home_score,
        awayScore: score.away_score,
        winnerName: getWinnerName(winningSquare),
        payoutAmount,
        hasClaimed: !!winningSquare?.claimant_first_name,
      };
    })
    .filter(Boolean);

  if (scoresWithWinners.length === 0) {
    return null;
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-amber-400" />
          Winners
        </CardTitle>
        <CardDescription>Scores and winners for each {contest.sport_type === 'football' ? 'quarter' : 'game'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scoresWithWinners.map((item) => (
            <div
              key={item!.quarter}
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3"
            >
              {/* Header row: Quarter label + Payout */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{item!.label}</span>
                {item!.payoutAmount != null && (
                  <span className="text-sm font-medium text-orange-400">
                    ${item!.payoutAmount.toFixed(0)}
                  </span>
                )}
              </div>
              {/* Score */}
              <p className="mt-1 text-sm text-zinc-400">
                {contest.row_team_name} {item!.homeScore} - {contest.col_team_name} {item!.awayScore}
              </p>
              {/* Winner */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className={`text-sm ${item!.hasClaimed ? 'text-green-400' : 'text-zinc-500'}`}>
                  {item!.winnerName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

