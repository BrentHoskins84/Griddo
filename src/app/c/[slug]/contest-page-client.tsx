'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';

import { MarketingFooter } from '@/components/layout/marketing-footer';
import { AdPlaceholder } from '@/components/shared/ad-placeholder';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ClaimSquareModal, PinEntryModal, Square, SquaresGrid } from '@/features/contests/components';
import { useRealtimeSquares } from '@/hooks/use-realtime-squares';
import { Database } from '@/libs/supabase/types';
import { cn } from '@/utils/cn';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];
type Score = Database['public']['Tables']['scores']['Row'];
type GameQuarter = Database['public']['Enums']['game_quarter'];

interface Contest {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  sport_type: 'football' | 'baseball';
  row_team_name: string;
  col_team_name: string;
  square_price: number;
  max_squares_per_person: number | null;
  primary_color: string;
  secondary_color: string;
  hero_image_url: string | null;
  org_image_url: string | null;
  requiresPin: boolean;
  row_numbers: number[] | null;
  col_numbers: number[] | null;
  // Payout percentages
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

interface ContestPageClientProps {
  contest: Contest;
  squares: Square[];
  scores: Score[];
  hasAccess: boolean;
  showAds: boolean;
  paymentOptions: PaymentOption[];
}

// Map quarter names for display
const quarterDisplayNames: Record<GameQuarter, string> = {
  q1: 'Q1',
  q2: 'Halftime',
  q3: 'Q3',
  final: 'Final',
};

export function ContestPageClient({ contest, squares, scores, hasAccess, showAds, paymentOptions }: ContestPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPinModal, setShowPinModal] = useState(!hasAccess && contest.requiresPin);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const realtimeSquares = useRealtimeSquares(contest.id, squares);

  // Get winning square IDs for highlighting
  const winningSquareIds = scores
    .filter((score) => score.winning_square_id)
    .map((score) => score.winning_square_id as string);

  // Calculate total pot
  const claimedSquaresCount = realtimeSquares.filter((s) => s.payment_status !== 'available').length;
  const totalPot = claimedSquaresCount * contest.square_price;

  // Check if we have winners to show
  const hasWinners = scores.length > 0 && scores.some((s) => s.winning_square_id);
  const showSidebar = showAds || hasWinners;

  // Get payout percentage for a quarter
  const getPayoutPercent = (quarter: GameQuarter): number => {
    const payoutMap: Record<GameQuarter, number | null> = {
      q1: contest.payout_q1_percent,
      q2: contest.payout_q2_percent,
      q3: contest.payout_q3_percent,
      final: contest.payout_final_percent,
    };
    return payoutMap[quarter] ?? 0;
  };

  // Get winner info from square
  const getWinnerInfo = (squareId: string): { name: string; row: number; col: number } | null => {
    const square = realtimeSquares.find((s) => s.id === squareId);
    if (!square) return null;
    
    const hasName = square.claimant_first_name || square.claimant_last_name;
    const name = hasName 
      ? `${square.claimant_first_name || ''} ${square.claimant_last_name || ''}`.trim()
      : `Row ${square.row_index}, Col ${square.col_index}`;
    
    return { name, row: square.row_index, col: square.col_index };
  };

  // Generate initials from contest name
  const getInitials = () => {
    return contest.name
      .split(' ')
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

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
    // Real-time subscription handles updates automatically
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
      <div className="relative">
        {/* Hero Banner */}
        <div className="relative h-48 w-full md:h-64">
          {contest.hero_image_url ? (
            <Image
              src={contest.hero_image_url}
              alt={contest.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${contest.primary_color} 0%, ${contest.secondary_color} 100%)`,
              }}
            />
          )}
          {/* Dark gradient overlay at bottom for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        </div>

        {/* Circle Logo Overlay */}
        <div className="absolute -bottom-10 left-4 md:-bottom-14 md:left-8">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-zinc-900 shadow-xl md:h-28 md:w-28"
            style={{ backgroundColor: contest.primary_color }}
          >
            {contest.org_image_url ? (
              <Image
                src={contest.org_image_url}
                alt="Organization logo"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white md:text-3xl">
                {getInitials()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content with padding to account for overlapping logo */}
      <div className="pt-14 px-4 md:pt-20">
        <div className="mx-auto max-w-6xl">
          {/* Contest Name & Status */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{contest.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
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

          {/* Team Matchup */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3 backdrop-blur-sm">
              <span className="text-lg font-semibold text-white">{contest.row_team_name}</span>
              <span className="text-zinc-500">vs</span>
              <span className="text-lg font-semibold text-white">{contest.col_team_name}</span>
            </div>
          </div>

          {/* Description */}
          {contest.description && (
            <p className="mt-3 max-w-2xl text-zinc-400">{contest.description}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 lg:px-8">
        <div
          className={cn(
            'space-y-6',
            showSidebar && 'lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start lg:space-y-0'
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
                squares={realtimeSquares}
                rowTeamName={contest.row_team_name}
                colTeamName={contest.col_team_name}
                showNumbers={true}
                disabled={contest.status !== 'open'}
                onSquareClick={contest.status === 'open' ? handleSquareClick : undefined}
                rowNumbers={contest.row_numbers}
                colNumbers={contest.col_numbers}
                winningSquareIds={winningSquareIds}
              />
            </div>
          </div>

          {/* Right Sidebar: Winners + Ad */}
          {showSidebar && (
          <div className="space-y-4">
            {/* Winners Section */}
            {hasWinners && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Winners</h2>
                </div>
                <div className="space-y-3">
                  {scores
                    .filter((score) => score.winning_square_id)
                    .map((score) => {
                      const winnerInfo = getWinnerInfo(score.winning_square_id!);
                      const payoutPercent = getPayoutPercent(score.quarter);
                      const payoutAmount = (totalPot * payoutPercent) / 100;

                      return (
                        <div
                          key={score.id}
                          className="rounded-lg bg-zinc-800/50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-amber-400 text-sm">
                              {quarterDisplayNames[score.quarter]}
                            </span>
                            {payoutPercent > 0 && (
                              <span className="text-sm font-bold text-green-400">
                                ${payoutAmount.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            {contest.row_team_name} {score.home_score} - {contest.col_team_name} {score.away_score}
                          </p>
                          {winnerInfo && (
                            <p className="text-sm text-white mt-1 font-medium">
                              {winnerInfo.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Ad */}
            {showAds && (
              <AdPlaceholder size="rectangle" className="mx-auto lg:mx-0" />
            )}
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


