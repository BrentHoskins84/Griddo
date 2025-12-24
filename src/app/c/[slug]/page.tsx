import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { hasContestAccess } from '@/features/contests/actions/verify-pin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { ContestPageClient } from './contest-page-client';

interface ContestPageProps {
  params: Promise<{ slug: string }>;
}

async function getContestBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data: contest, error } = await supabase
    .from('contests')
    .select(
      `
      id,
      name,
      slug,
      description,
      status,
      row_team_name,
      col_team_name,
      square_price,
      max_squares_per_person,
      access_pin,
      primary_color,
      secondary_color,
      hero_image_url,
      org_image_url
    `
    )
    .eq('slug', slug)
    .single();

  if (error || !contest) {
    return null;
  }

  return contest;
}

async function getSquaresForContest(contestId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: squares } = await supabase
    .from('squares')
    .select('id, row_index, col_index, payment_status, claimant_first_name, claimant_last_name')
    .eq('contest_id', contestId)
    .order('row_index')
    .order('col_index');

  return squares || [];
}

export default async function ContestPage({ params }: ContestPageProps) {
  const { slug } = await params;

  const contest = await getContestBySlug(slug);

  if (!contest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Contest Not Found</h1>
          <p className="mt-4 text-zinc-400">
            The contest you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/">
            <Button className="mt-6">← Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has access (either no PIN required or valid cookie)
  const hasAccess = await hasContestAccess(contest.slug, contest.access_pin);

  // Fetch squares for the grid
  const squares = await getSquaresForContest(contest.id);

  return <ContestPageClient contest={contest} squares={squares} hasAccess={hasAccess} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: ContestPageProps) {
  const { slug } = await params;
  const contest = await getContestBySlug(slug);

  if (!contest) {
    return {
      title: 'Contest Not Found | Griddo',
    };
  }

  return {
    title: `${contest.name} | Griddo`,
    description: contest.description || `Join ${contest.name} - ${contest.row_team_name} vs ${contest.col_team_name}`,
  };
}

