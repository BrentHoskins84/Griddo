'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { MarketingFooter } from '@/components/layout/marketing-footer';
import { AdPlaceholder } from '@/components/shared/ad-placeholder';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ClaimSquareModal, PinEntryModal, Square, SquaresGrid } from '@/features/contests/components';
import { Database } from '@/libs/supabase/types';
import { cn } from '@/utils/cn';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];

interface Contest {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  row_team_name: string;
  col_team_name: string;
  square_price: number;
  max_squares_per_person: number | null;
  primary_color: string;
  secondary_color: string;
  hero_image_url: string | null;
  org_image_url: string | null;
  requiresPin: boolean;
}

interface ContestPageClientProps {
  contest: Contest;
  squares: Square[];
  hasAccess: boolean;
  showAds: boolean;
  paymentOptions: PaymentOption[];
}

export function ContestPageClient({ contest, squares, hasAccess, showAds, paymentOptions }: ContestPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPinModal, setShowPinModal] = useState(!hasAccess && contest.requiresPin);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const handlePinSuccess = () => {
    setShowPinModal(false);
    // Refresh the page to get updated server state with cookie
    router.refresh();
  };

  const handleSquareClick = (square: Square) => {
    // Only allow claiming available squares when contest is open
    if (contest.status !== 'open') {
      return;
    }

    if (square.payment_status !== 'available') {
      toast({
        title: 'Square Unavailable',
        description: 'This square has already been claimed.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedSquare(square);
    setIsClaimModalOpen(true);
  };

  const handleClaimSuccess = () => {
    // Just refresh the squares - the modal will show payment instructions
    // and handle its own closing when user clicks "Done"
    router.refresh();
  };

  const handleClaimModalClose = () => {
    setIsClaimModalOpen(false);
    setSelectedSquare(null);
  };

  // Status badge styling
  const getStatusBadge = () => {
    switch (contest.status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">Draft</Badge>;
      case 'open':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Open for Claims</Badge>;
      case 'locked':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">Locked</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Game in Progress</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Completed</Badge>;
      default:
        return null;
    }
  };

  // Show PIN modal if needed
  if (showPinModal) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <PinEntryModal
          isOpen={true}
          contestName={contest.name}
          contestSlug={contest.slug}
          onSuccess={handlePinSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Hero Section */}
      <div className="relative min-h-[280px] border-b border-zinc-800 sm:min-h-[320px]">
        {/* Background: Hero image or gradient */}
        <div className="absolute inset-0 overflow-hidden">
          {contest.hero_image_url ? (
            <>
              <Image
                src={contest.hero_image_url}
                alt={contest.name}
                fill
                className="object-cover"
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-zinc-900/40" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-griddo-background via-griddo-surface to-griddo-background" />
              <div className="absolute right-0 top-0 h-48 w-64 rounded-full bg-griddo-primary/20 blur-3xl sm:h-64 sm:w-80 lg:h-72 lg:w-96" />
              <div className="absolute bottom-0 left-0 h-40 w-52 rounded-full bg-griddo-accent/15 blur-3xl sm:h-56 sm:w-72" />
            </>
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Contest Name & Status */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{contest.name}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: `${contest.primary_color}20`,
                    color: contest.primary_color,
                  }}
                >
                  ${contest.square_price} per square
                </Badge>
              </div>
            </div>
          </div>

          {/* Team Matchup */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3 backdrop-blur-sm">
              <span className="text-lg font-semibold text-white">{contest.row_team_name}</span>
              <span className="text-zinc-500">vs</span>
              <span className="text-lg font-semibold text-white">{contest.col_team_name}</span>
            </div>
          </div>

          {/* Description */}
          {contest.description && (
            <p className="mt-4 max-w-2xl text-zinc-400">{contest.description}</p>
          )}
        </div>

        {/* Overlapping Circle Logo */}
        <div className="absolute -bottom-20 left-0 right-0 z-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-500 shadow-lg">
              {contest.org_image_url ? (
                <Image
                  src={contest.org_image_url}
                  alt="Organization"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white sm:text-5xl">
                  {contest.name
                    .split(' ')
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-8 sm:px-6 lg:px-8">
        <div
          className={cn(
            'space-y-6',
            showAds && 'lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start lg:space-y-0'
          )}
        >
          <div className="space-y-6">
            {/* Status Message */}
            {contest.status === 'draft' && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <p className="text-amber-400">
                  🔒 This contest is still in draft mode and not yet open for square claims.
                </p>
              </div>
            )}

            {contest.status === 'locked' && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <p className="text-amber-400">
                  🔒 This contest is locked. No more squares can be claimed.
                </p>
              </div>
            )}

            {contest.status === 'completed' && (
              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                <p className="text-blue-400">
                  🏆 This contest has been completed. Check the scores below!
                </p>
              </div>
            )}

            {/* Claiming Instructions */}
            {contest.status === 'open' && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                <p className="text-green-400">
                  ✨ Click on any available square to claim it!
                  {contest.max_squares_per_person && (
                    <span className="ml-2 text-green-300">
                      (Limit: {contest.max_squares_per_person} square{contest.max_squares_per_person > 1 ? 's' : ''} per person)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Squares Grid */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50">
              <SquaresGrid
                squares={squares}
                rowTeamName={contest.row_team_name}
                colTeamName={contest.col_team_name}
                showNumbers={true}
                disabled={contest.status !== 'open'}
                onSquareClick={contest.status === 'open' ? handleSquareClick : undefined}
              />
            </div>
          </div>

          {showAds && (
            <div className="mt-4 hidden space-y-4 lg:mt-0 lg:block">
              <AdPlaceholder size="rectangle" className="mx-auto lg:mx-0" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Ad */}
      {showAds && (
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <AdPlaceholder size="banner" />
          </div>
        </div>
      )}

      {/* Footer (shared styling from marketing pages) */}
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <MarketingFooter />
      </div>

      {/* Claim Square Modal */}
      {selectedSquare && (
        <ClaimSquareModal
          isOpen={isClaimModalOpen}
          onClose={handleClaimModalClose}
          square={selectedSquare}
          contestId={contest.id}
          squarePrice={contest.square_price}
          maxSquaresPerPerson={contest.max_squares_per_person}
          paymentOptions={paymentOptions}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}


