import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type ContestStatus = Database['public']['Enums']['contest_status'];

function getNextStep(
  status: ContestStatus,
  hasPaymentOptions: boolean,
  hasNumbers: boolean
): string | null {
  if (status === 'in_progress' || status === 'completed') return null;

  if (status === 'draft') {
    return !hasPaymentOptions
      ? 'Add payment options so participants can pay for their squares'
      : 'Open your contest to allow participants to claim squares';
  }

  if (status === 'open') {
    return !hasNumbers
      ? 'Enter numbers or let them auto-generate when you lock the contest'
      : 'Lock the contest to prevent new claims and prepare for game day';
  }

  if (status === 'locked') {
    return !hasNumbers
      ? 'Enter numbers before starting the game'
      : 'Start the game to begin tracking scores';
  }

  return null;
}

function getActionLink(message: string, contestId: string): string | null {
  if (message.includes('payment')) return `/dashboard/${contestId}/settings`;
  return null;
}

interface NextStepsCardProps {
  contestId: string;
  status: ContestStatus;
  rowNumbers: number[] | null;
  colNumbers: number[] | null;
}

export async function NextStepsCard({
  contestId,
  status,
  rowNumbers,
}: NextStepsCardProps) {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from('payment_options')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  const hasPaymentOptions = (count ?? 0) > 0;
  const hasNumbers = rowNumbers !== null;
  const nextStep = getNextStep(status, hasPaymentOptions, hasNumbers);

  if (!nextStep) return null;

  const actionLink = getActionLink(nextStep, contestId);

  return (
    <Card className="border-zinc-800 border-l-2 border-l-orange-400 bg-zinc-900">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            Next Step
            <ArrowRight className="h-4 w-4 text-orange-400" />
          </CardTitle>
          <CardDescription>{nextStep}</CardDescription>
        </div>
        {actionLink && (
          <Button variant="outline" size="sm" asChild>
            <Link href={actionLink}>Go to Settings</Link>
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}
