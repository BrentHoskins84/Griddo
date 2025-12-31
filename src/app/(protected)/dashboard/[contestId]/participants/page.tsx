import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestById, getParticipantsForContest } from '@/features/contests/queries';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { ParticipantsTableClient } from './participants-table-client';

interface ParticipantsPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
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

  // Fetch participants (claimed squares)
  const participants = await getParticipantsForContest(contestId);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/${contestId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contest
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">Manage Participants</h1>
          <p className="text-sm text-zinc-400">
            {contest.name} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Participants Table Card */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-400" />
            <div>
              <CardTitle className="text-white">Participants</CardTitle>
              <CardDescription>
                View and manage all participants who have claimed squares
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ParticipantsTableClient
            participants={participants}
            contestId={contestId}
            contestName={contest.name}
            squarePrice={Number(contest.square_price)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

