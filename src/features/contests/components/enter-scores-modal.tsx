'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, Settings, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/libs/supabase/types';

import { saveScores } from '../actions/save-scores';
import { FOOTBALL_QUARTER_LABELS } from '../constants';
import { ContestPrizeFields } from '../types';
import { getPrizeText } from '../utils';

type Score = Database['public']['Tables']['scores']['Row'];
type GameQuarter = Database['public']['Enums']['game_quarter'];
type SportType = Database['public']['Enums']['sport_type'];
type ContestStatus = Database['public']['Enums']['contest_status'];

interface Square {
  id: string;
  row_index: number;
  col_index: number;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
}

interface Contest extends ContestPrizeFields {
  id: string;
  sport_type: SportType;
  row_team_name: string;
  col_team_name: string;
  row_numbers: number[] | null;
  col_numbers: number[] | null;
  status: ContestStatus;
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

interface EnterScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest;
  existingScores: Score[];
  squares: Square[];
  onSuccess?: () => void;
}

interface ScoreEntry {
  quarter: GameQuarter;
  label: string;
  homeScore: string;
  awayScore: string;
  payoutPercent: number | null;
}

const FOOTBALL_QUARTERS = FOOTBALL_QUARTER_LABELS.map((q) => ({
  quarter: q.key as GameQuarter,
  label: q.label,
  payoutKey: q.dbField as keyof Contest,
}));

const BASEBALL_GAMES: { quarter: GameQuarter; label: string; payoutKey: keyof Contest }[] = [
  { quarter: 'q1', label: 'Game 1', payoutKey: 'payout_game1_percent' },
  { quarter: 'q2', label: 'Game 2', payoutKey: 'payout_game2_percent' },
  { quarter: 'q3', label: 'Game 3', payoutKey: 'payout_game3_percent' },
  { quarter: 'final', label: 'Game 4', payoutKey: 'payout_game4_percent' },
];

function getQuarterConfig(sportType: SportType) {
  return sportType === 'football' ? FOOTBALL_QUARTERS : BASEBALL_GAMES;
}

function calculateWinningSquare(
  homeScore: number,
  awayScore: number,
  rowNumbers: number[],
  colNumbers: number[],
  squares: Square[]
): Square | null {
  const homeLastDigit = homeScore % 10;
  const awayLastDigit = awayScore % 10;

  // Find the index in row_numbers where the value matches homeLastDigit
  const winningRowIndex = rowNumbers.indexOf(homeLastDigit);
  // Find the index in col_numbers where the value matches awayLastDigit
  const winningColIndex = colNumbers.indexOf(awayLastDigit);

  if (winningRowIndex === -1 || winningColIndex === -1) {
    return null;
  }

  return (
    squares.find(
      (sq) => sq.row_index === winningRowIndex && sq.col_index === winningColIndex
    ) || null
  );
}

function getWinnerDisplay(
  homeScore: string,
  awayScore: string,
  rowNumbers: number[] | null,
  colNumbers: number[] | null,
  squares: Square[]
): { text: string; isWinner: boolean } {
  const home = parseInt(homeScore, 10);
  const away = parseInt(awayScore, 10);

  if (isNaN(home) || isNaN(away)) {
    return { text: 'Enter scores', isWinner: false };
  }

  if (!rowNumbers || !colNumbers) {
    return { text: 'Numbers not assigned', isWinner: false };
  }

  const winningSquare = calculateWinningSquare(home, away, rowNumbers, colNumbers, squares);

  if (!winningSquare) {
    return { text: 'No matching square', isWinner: false };
  }

  if (winningSquare.claimant_first_name) {
    let name = winningSquare.claimant_first_name;
    if (winningSquare.claimant_last_name) {
      name += ` ${winningSquare.claimant_last_name}`;
    }
    return { text: name, isWinner: true };
  }

  return {
    text: `Row ${winningSquare.row_index}, Col ${winningSquare.col_index}`,
    isWinner: true,
  };
}

export function EnterScoresModal({
  isOpen,
  onClose,
  contest,
  existingScores,
  squares,
  onSuccess,
}: EnterScoresModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [scoreEntries, setScoreEntries] = useState<ScoreEntry[]>([]);

  const quarterConfig = getQuarterConfig(contest.sport_type);
  const totalPot = contest.square_price * 100;

  // Initialize score entries from existing scores
  useEffect(() => {
    const entries = quarterConfig.map(({ quarter, label, payoutKey }) => {
      const existingScore = existingScores.find((s) => s.quarter === quarter);
      return {
        quarter,
        label,
        homeScore: existingScore?.home_score?.toString() ?? '',
        awayScore: existingScore?.away_score?.toString() ?? '',
        payoutPercent: contest[payoutKey] as number | null,
      };
    });
    setScoreEntries(entries);
  }, [existingScores, quarterConfig, contest]);

  const handleScoreChange = (
    index: number,
    field: 'homeScore' | 'awayScore',
    value: string
  ) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    setScoreEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const handleSave = () => {
    // Filter to only entries with both scores filled
    const scoresToSave = scoreEntries
      .filter((entry) => entry.homeScore !== '' && entry.awayScore !== '')
      .map((entry) => ({
        quarter: entry.quarter,
        homeScore: parseInt(entry.homeScore, 10),
        awayScore: parseInt(entry.awayScore, 10),
      }));

    if (scoresToSave.length === 0) {
      toast({
        title: 'No scores to save',
        description: 'Please enter at least one complete score.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveScores(contest.id, scoresToSave);

        if (result?.error) {
          toast({
            title: 'Error saving scores',
            description: result.error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Scores saved!',
          description: `${scoresToSave.length} score(s) updated successfully.`,
        });

        onSuccess?.();
        onClose();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  // Status check - show message if not in progress
  if (contest.status !== 'in_progress') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Scores</DialogTitle>
            <DialogDescription>Scores can only be entered during the game.</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3">
            <p className="text-sm text-amber-200">
              Change contest status to &ldquo;In Progress&rdquo; to enter scores.
            </p>
            <Link href={`/dashboard/${contest.id}/settings`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Go to Settings
              </Button>
            </Link>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Scores</DialogTitle>
          <DialogDescription>
            Enter the scores for each {contest.sport_type === 'football' ? 'quarter' : 'game'}.
            Winners are calculated automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Team Labels */}
        <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-2 items-center text-sm font-medium text-zinc-400 px-1">
          <div></div>
          <div className="text-center">{contest.row_team_name} (Home)</div>
          <div className="text-center">{contest.col_team_name} (Away)</div>
          <div className="text-center">Winner</div>
        </div>

        {/* Score Entry Rows */}
        <div className="space-y-3">
          {scoreEntries.map((entry, index) => {
            const winner = getWinnerDisplay(
              entry.homeScore,
              entry.awayScore,
              contest.row_numbers,
              contest.col_numbers,
              squares
            );

            const payoutAmount =
              entry.payoutPercent != null ? (totalPot * entry.payoutPercent) / 100 : null;
            const prizeText = getPrizeText(contest.prize_type, entry.quarter, contest);

            return (
              <div
                key={entry.quarter}
                className="grid grid-cols-[120px_1fr_1fr_1fr] gap-2 items-center"
              >
                {/* Quarter Label with Payout */}
                <div className="space-y-0.5">
                  <Label className="text-zinc-200 font-medium">{entry.label}</Label>
                  {contest.prize_type === 'custom' && prizeText ? (
                    <p className="text-xs text-orange-400">{prizeText}</p>
                  ) : payoutAmount != null ? (
                    <p className="text-xs text-orange-400">${payoutAmount.toFixed(0)} payout</p>
                  ) : null}
                </div>

                {/* Home Score Input */}
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={entry.homeScore}
                  onChange={(e) => handleScoreChange(index, 'homeScore', e.target.value)}
                  className="text-center text-lg font-semibold"
                />

                {/* Away Score Input */}
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={entry.awayScore}
                  onChange={(e) => handleScoreChange(index, 'awayScore', e.target.value)}
                  className="text-center text-lg font-semibold"
                />

                {/* Winner Display */}
                <div
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm ${
                    winner.isWinner
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {winner.isWinner && <Trophy className="h-3.5 w-3.5" />}
                  <span className="truncate">{winner.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Scores'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

