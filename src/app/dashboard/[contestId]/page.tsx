import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IoArrowBack,
  IoEye,
  IoGameController,
  IoPeople,
  IoSettings,
} from 'react-icons/io5';

import { AdPlaceholder } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SquaresGrid, Square } from '@/features/contests/components';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { getURL } from '@/utils/get-url';

import { CopyLinkButton } from './copy-link-button';
import { OpenContestButton } from './open-contest-button';

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
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    notFound();
  }

  // Fetch squares for the grid
  const { data: squares } = await supabase
    .from('squares')
    .select('id, row_index, col_index, payment_status, claimant_first_name, claimant_last_name')
    .eq('contest_id', contestId)
    .order('row_index')
    .order('col_index');

  // Calculate stats
  const squaresList = (squares || []) as Square[];
  const claimedSquares = squaresList.filter((s) => s.payment_status !== 'available');
  const paidSquares = squaresList.filter((s) => s.payment_status === 'paid');
  const revenue = paidSquares.length * Number(contest.square_price);

  const publicUrl = getURL(`/c/${contest.slug}`);

  return (
    <div className="space-y-6">
      {/* Back link - spans full width above the grid */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <IoArrowBack className="h-4 w-4" />
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

          <div className="flex flex-wrap gap-2">
            <CopyLinkButton url={publicUrl} code={contest.code} />
            <Button variant="default" size="sm" asChild>
              <Link href={`/dashboard/${contestId}/settings`}>
                <IoSettings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {/* Grid Preview */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Grid Preview</CardTitle>
            <CardDescription>10×10 squares grid • Click to manage squares</CardDescription>
          </CardHeader>
          <CardContent>
            <SquaresGrid
              squares={squaresList}
              rowTeamName={contest.row_team_name}
              colTeamName={contest.col_team_name}
              showNumbers={true}
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
              {contest.status === 'draft' && <OpenContestButton contestId={contestId} className="w-full" />}

              <Button variant="default" className="w-full" asChild>
                <Link href={`/c/${contest.slug}`} target="_blank">
                  <IoEye className="mr-2 h-4 w-4" />
                  View Public Page
                </Link>
              </Button>

              <Button variant="default" className="w-full" asChild>
                <Link href={`/dashboard/${contestId}/scores`}>
                  <IoGameController className="mr-2 h-4 w-4" />
                  Enter Scores
                </Link>
              </Button>

              <Button variant="default" className="w-full" asChild>
                <Link href={`/dashboard/${contestId}/participants`}>
                  <IoPeople className="mr-2 h-4 w-4" />
                  Manage Participants
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ad Placeholder */}
        <AdPlaceholder size="rectangle" className="mx-auto" />
      </div>
      </div>
    </div>
  );
}

