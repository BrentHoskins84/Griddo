import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { hasContestAccess } from '@/features/contests/actions/verify-pin';
import { hasActiveSubscription } from '@/features/subscriptions/has-active-subscription';
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
      owner_id,
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
            The contest you&apos;re looking for doesn&apos;t exist or may have been removed.
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

  const ownerHasActiveSubscription = await hasActiveSubscription(contest.owner_id);
  const showAds = !ownerHasActiveSubscription;

  // Fetch squares for the grid only when access is granted
  const squares = hasAccess ? await getSquaresForContest(contest.id) : [];

  // Never send the actual PIN to the client
  const contestForClient = {
    id: contest.id,
    name: contest.name,
    slug: contest.slug,
    description: contest.description,
    status: contest.status,
    row_team_name: contest.row_team_name,
    col_team_name: contest.col_team_name,
    square_price: contest.square_price,
    max_squares_per_person: contest.max_squares_per_person,
    primary_color: contest.primary_color ?? 'var(--griddo-primary)',
    secondary_color: contest.secondary_color ?? 'var(--griddo-secondary)',
    hero_image_url: contest.hero_image_url,
    org_image_url: contest.org_image_url,
    requiresPin: Boolean(contest.access_pin),
  };

  return (
    <ContestPageClient
      contest={contestForClient}
      squares={squares}
      hasAccess={hasAccess}
      showAds={showAds}
    />
  );
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

