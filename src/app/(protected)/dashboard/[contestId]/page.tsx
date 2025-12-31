import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, Settings, Users } from 'lucide-react';

import { AdPlaceholder } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManageSquare } from '@/features/contests/components/manage-square-modal';
import { getContestById, getScoresForContest, getSquaresForContest } from '@/features/contests/queries';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { getURL } from '@/utils/get-url';

import { ContestStatusButton } from './contest-status-button';
import { CopyLinkButton } from './copy-link-button';
import { DashboardGridClient } from './dashboard-grid-client';
import { EnterScoresButton } from './enter-scores-button';
import { ManageNumbersButton } from './manage-numbers-button';
import { NextStepsCard } from './next-steps-card';
import { WinnersSection } from './winners-section';

type ContestStatus = Database['public']['Enums']['contest_status'];

interface ContestDetailPageProps {
  params: Promise<{ contestId: string }>;
}

const STATUS_LABELS: Record<ContestStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  locked: 'Locked',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default async function ContestDetailPage({ params }: ContestDetailPageProps) {
  const { contestId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch contest (RLS will ensure only owner can view)
  const contest = await getContestById(contestId);

  if (!contest) {
    notFound();
  }

  // Fetch squares, scores, and payment options count
  const [squares, scores, paymentOptionsResult] = await Promise.all([
    getSquaresForContest(contestId),
    getScoresForContest(contestId),
    supabase.from('payment_options').select('*', { count: 'exact', head: true }).eq('contest_id', contestId),
  ]);

  const hasPaymentOptions = (paymentOptionsResult.count ?? 0) > 0;
  const hasNumbers = contest.row_numbers !== null;

  // Extract winning square IDs from scores
  const winningSquareIds = scores
    .filter((s) => s.winning_square_id)
    .map((s) => s.winning_square_id as string);

  // Calculate stats
  const squaresList = (squares || []) as ManageSquare[];
  const claimedSquares = squaresList.filter((s) => s.payment_status !== 'available');
  const paidSquares = squaresList.filter((s) => s.payment_status === 'paid');
  const revenue = paidSquares.length * Number(contest.square_price);

  // Calculate fundraiser amount
  const totalPayoutPercent =
    contest.sport_type === 'football'
      ? (contest.payout_q1_percent ?? 0) +
        (contest.payout_q2_percent ?? 0) +
        (contest.payout_q3_percent ?? 0) +
        (contest.payout_final_percent ?? 0)
      : (contest.payout_game1_percent ?? 0) +
        (contest.payout_game2_percent ?? 0) +
        (contest.payout_game3_percent ?? 0) +
        (contest.payout_game4_percent ?? 0) +
        (contest.payout_game5_percent ?? 0) +
        (contest.payout_game6_percent ?? 0) +
        (contest.payout_game7_percent ?? 0);
  const fundraiserPercent = 100 - totalPayoutPercent;
  const totalPot = 100 * Number(contest.square_price);
  const fundraiserCurrent = revenue * (fundraiserPercent / 100);
  const fundraiserMax = totalPot * (fundraiserPercent / 100);

  const publicUrl = getURL(`/contest/${contest.slug}`);

  return (
    <div className="space-y-6">
      {/* Back link - spans full width above the grid */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,300px]">
        {/* Main Content (Left Column) */}
        <div className="space-y-6">
          {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white lg:text-3xl">{contest.name}</h1>
              <Badge variant={contest.status as ContestStatus}>{STATUS_LABELS[contest.status]}</Badge>
            </div>
            <p className="text-sm text-zinc-400">
              {contest.row_team_name} vs {contest.col_team_name}
            </p>
            {contest.description && <p className="text-sm text-zinc-500">{contest.description}</p>}
          </div>

          <div className="flex shrink-0 gap-2">
            <CopyLinkButton url={publicUrl} code={contest.access_pin} contestName={contest.name} />
            <Button variant="default" size="sm" asChild>
              <Link href={`/dashboard/${contestId}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Total Squares</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">100</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Claimed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-400">{claimedSquares.length}</p>
              <p className="text-xs text-zinc-500">{100 - claimedSquares.length} available</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Paid</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{paidSquares.length}</p>
              <p className="text-xs text-zinc-500">
                {claimedSquares.length - paidSquares.length} pending payment
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">${revenue.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">
                ${(100 * Number(contest.square_price)).toLocaleString()} max
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Fundraiser</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-400">${fundraiserCurrent.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">
                ${fundraiserMax.toLocaleString()} potential
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <NextStepsCard
          contestId={contest.id}
          status={contest.status}
          rowNumbers={contest.row_numbers}
          colNumbers={contest.col_numbers}
        />

        {/* Grid Preview */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-white">Grid Preview</CardTitle>
              <CardDescription>10×10 squares grid • Click to manage squares</CardDescription>
            </div>
            <ManageNumbersButton
              contest={{
                id: contest.id,
                status: contest.status,
                row_numbers: contest.row_numbers,
                col_numbers: contest.col_numbers,
                numbers_auto_generated: contest.numbers_auto_generated,
                row_team_name: contest.row_team_name,
                col_team_name: contest.col_team_name,
              }}
            />
          </CardHeader>
          <CardContent>
            <DashboardGridClient
              squares={squaresList}
              rowTeamName={contest.row_team_name}
              colTeamName={contest.col_team_name}
              contestId={contestId}
              squarePrice={Number(contest.square_price)}
              rowNumbers={contest.row_numbers}
              colNumbers={contest.col_numbers}
              winningSquareIds={winningSquareIds}
            />
          </CardContent>
        </Card>

      </div>

      {/* Right Sidebar */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        {/* Quick Actions */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription>Manage your contest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <ContestStatusButton
                contestId={contestId}
                currentStatus={contest.status}
                hasPaymentOptions={hasPaymentOptions}
                hasNumbers={hasNumbers}
                className="w-full justify-start"
              />

              <Button variant="default" className="w-full justify-start" asChild>
                <Link href={`/contest/${contest.slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Page
                </Link>
              </Button>

              <EnterScoresButton
                contest={{
                  id: contest.id,
                  sport_type: contest.sport_type,
                  row_team_name: contest.row_team_name,
                  col_team_name: contest.col_team_name,
                  row_numbers: contest.row_numbers,
                  col_numbers: contest.col_numbers,
                  status: contest.status,
                  square_price: Number(contest.square_price),
                  payout_q1_percent: contest.payout_q1_percent,
                  payout_q2_percent: contest.payout_q2_percent,
                  payout_q3_percent: contest.payout_q3_percent,
                  payout_final_percent: contest.payout_final_percent,
                  payout_game1_percent: contest.payout_game1_percent,
                  payout_game2_percent: contest.payout_game2_percent,
                  payout_game3_percent: contest.payout_game3_percent,
                  payout_game4_percent: contest.payout_game4_percent,
                  payout_game5_percent: contest.payout_game5_percent,
                  payout_game6_percent: contest.payout_game6_percent,
                  payout_game7_percent: contest.payout_game7_percent,
                }}
                scores={scores}
                squares={squaresList}
                className="w-full justify-start"
              />

              <Button variant="default" className="w-full justify-start" asChild>
                <Link href={`/dashboard/${contestId}/participants`}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Participants
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Winners Section */}
        <WinnersSection
          contest={{
            sport_type: contest.sport_type,
            row_team_name: contest.row_team_name,
            col_team_name: contest.col_team_name,
            square_price: Number(contest.square_price),
            payout_q1_percent: contest.payout_q1_percent,
            payout_q2_percent: contest.payout_q2_percent,
            payout_q3_percent: contest.payout_q3_percent,
            payout_final_percent: contest.payout_final_percent,
            payout_game1_percent: contest.payout_game1_percent,
            payout_game2_percent: contest.payout_game2_percent,
            payout_game3_percent: contest.payout_game3_percent,
            payout_game4_percent: contest.payout_game4_percent,
            payout_game5_percent: contest.payout_game5_percent,
            payout_game6_percent: contest.payout_game6_percent,
            payout_game7_percent: contest.payout_game7_percent,
          }}
          scores={scores}
          squares={squaresList}
        />

        {/* Ad Placeholder */}
        <AdPlaceholder size="rectangle" className="mx-auto" />
      </div>
      </div>
    </div>
  );
}

