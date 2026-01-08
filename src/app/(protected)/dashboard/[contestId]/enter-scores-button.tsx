'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EnterScoresModal } from '@/features/contests/components';
import { GridSquare } from '@/features/contests/queries/get-squares';
import { Database } from '@/libs/supabase/types';

type Score = Database['public']['Tables']['scores']['Row'];
type SportType = Database['public']['Enums']['sport_type'];
type ContestStatus = Database['public']['Enums']['contest_status'];

interface Contest {
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

interface EnterScoresButtonProps {
  contest: Contest;
  scores: Score[];
  squares: GridSquare[];
  className?: string;
}

export function EnterScoresButton({ contest, scores, squares, className }: EnterScoresButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button variant="default" className={className} onClick={() => setIsModalOpen(true)}>
        <Gamepad2 className="mr-2 h-4 w-4" />
        Enter Scores
      </Button>

      <EnterScoresModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contest={contest}
        existingScores={scores}
        squares={squares}
        onSuccess={handleSuccess}
      />
    </>
  );
}

