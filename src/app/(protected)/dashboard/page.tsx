import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ContestCard } from '@/features/contests/components/contest-card';
import { listContestsForOwner } from '@/features/contests/queries';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

function ContestCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-800/50 p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-zinc-700" />
          <div className="h-5 w-32 rounded bg-zinc-700" />
        </div>
        <div className="h-5 w-16 rounded-full bg-zinc-700" />
      </div>
      <div className="h-4 w-40 rounded bg-zinc-700/50 mb-4" />
      <div className="border-t border-zinc-700/50 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 rounded bg-zinc-700/50" />
          <div className="h-4 w-16 rounded bg-zinc-700/50" />
        </div>
        <div className="h-3 w-20 rounded bg-zinc-700/50" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700/50">
        <PlusCircle className="h-8 w-8 text-zinc-400" />
      </div>
      <p className="text-zinc-400">You haven&apos;t created any contests yet.</p>
      <p className="mt-2 text-sm text-zinc-500">
        Create your first game day squares contest to get started!
      </p>
      <Button variant="orange" asChild className="mt-6">
        <Link href="/dashboard/new">Create Your First Contest</Link>
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <ContestCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch contests with claimed squares count
  const contests = await listContestsForOwner(user.id);

  // Calculate claimed counts for each contest
  const contestsWithCounts = contests.map((contest) => {
    const claimedCount = contest.squares?.filter(
      (sq) => sq.payment_status !== 'available'
    ).length ?? 0;
    return { ...contest, claimedCount };
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white lg:text-3xl">My Contests</h1>
        <Button variant="orange" asChild>
          <Link href="/dashboard/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Contest
          </Link>
        </Button>
      </div>

      {contestsWithCounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contestsWithCounts.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              claimedCount={contest.claimedCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
