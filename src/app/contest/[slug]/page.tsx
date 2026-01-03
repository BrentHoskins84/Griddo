import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { hasContestAccess } from '@/features/contests/actions/verify-pin';
import { requireAuth } from '@/features/contests/middleware/auth-middleware';
import {
  getContestPin,
  getPaymentOptionsForContest,
  getScoresForContest,
  getSquaresForContest,
} from '@/features/contests/queries';
import { getPublicContestBySlug } from '@/features/contests/queries/get-contest-safe';
import { hasActiveSubscription } from '@/features/subscriptions/has-active-subscription';

import { ContestPageClient } from './contest-page-client';

interface ContestPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContestPage({ params }: ContestPageProps) {
  const { slug } = await params;

  const contest = await getPublicContestBySlug(slug);

  if (!contest) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-white'>Contest Not Found</h1>
          <p className='mt-4 text-zinc-400'>
            The contest you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link href='/'>
            <Button className='mt-6'>← Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch access PIN separately (not included in PublicContest for security)
  const accessPin = await getContestPin(contest.slug);

  // Check if user has access (either no PIN required or valid cookie)
  const hasAccess = await hasContestAccess(contest.slug, accessPin);

  // Check if current user is the contest owner
  let isOwner = false;
  try {
    const { user } = await requireAuth();
    isOwner = user.id === contest.owner_id;
  } catch {
    // User is not authenticated
    isOwner = false;
  }

  const ownerHasActiveSubscription = await hasActiveSubscription(contest.owner_id);
  const showAds = !ownerHasActiveSubscription;

  // Fetch squares, payment options, and scores only when access is granted
  const [squares, paymentOptions, scores] = hasAccess
    ? await Promise.all([
        getSquaresForContest(contest.id),
        getPaymentOptionsForContest(contest.id),
        getScoresForContest(contest.id),
      ])
    : [[], [], []];

  // Only include access_pin for contest owners (for share modal)
  const contestForClient = {
    id: contest.id,
    name: contest.name,
    slug: contest.slug,
    description: contest.description,
    status: contest.status,
    sport_type: contest.sport_type,
    row_team_name: contest.row_team_name,
    col_team_name: contest.col_team_name,
    square_price: contest.square_price,
    max_squares_per_person: contest.max_squares_per_person,
    primary_color: contest.primary_color ?? '#F97316',
    secondary_color: contest.secondary_color ?? '#D97706',
    hero_image_url: contest.hero_image_url,
    org_image_url: contest.org_image_url,
    requiresPin: Boolean(accessPin),
    access_pin: isOwner ? accessPin : null,
    row_numbers: contest.row_numbers,
    col_numbers: contest.col_numbers,
    // Payout percentages for winner display
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
    // Prize settings
    prize_type: contest.prize_type,
    prize_q1_text: contest.prize_q1_text,
    prize_q2_text: contest.prize_q2_text,
    prize_q3_text: contest.prize_q3_text,
    prize_final_text: contest.prize_final_text,
  };

  return (
    <ContestPageClient
      contest={contestForClient}
      squares={squares}
      scores={scores}
      hasAccess={hasAccess}
      showAds={showAds}
      paymentOptions={paymentOptions}
    />
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: ContestPageProps) {
  const { slug } = await params;
  const contest = await getPublicContestBySlug(slug);

  if (!contest) {
    return {
      title: 'Contest Not Found | Fundwell',
    };
  }

  return {
    title: `${contest.name} | Fundwell`,
    description: contest.description || `Join ${contest.name} - ${contest.row_team_name} vs ${contest.col_team_name}`,
  };
}
