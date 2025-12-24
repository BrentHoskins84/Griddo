'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ClaimSquareModal, PinEntryModal, SquaresGrid, Square } from '@/features/contests/components';

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
  access_pin: string | null;
  primary_color: string;
  secondary_color: string;
  hero_image_url: string | null;
  org_image_url: string | null;
}

interface ContestPageClientProps {
  contest: Contest;
  squares: Square[];
  hasAccess: boolean;
}

export function ContestPageClient({ contest, squares, hasAccess }: ContestPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showPinModal, setShowPinModal] = useState(!hasAccess && !!contest.access_pin);
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
    toast({
      title: 'Square Claimed! 🎉',
      description: `You've successfully claimed Row ${selectedSquare?.row_index}, Column ${selectedSquare?.col_index}. Check your email for payment instructions.`,
    });
    setIsClaimModalOpen(false);
    setSelectedSquare(null);
    // Refresh to get updated squares
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
      <div
        className="relative border-b border-zinc-800"
        style={{
          background: `linear-gradient(135deg, ${contest.primary_color}15 0%, ${contest.secondary_color}10 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Organization Logo */}
          {contest.org_image_url && (
            <div className="mb-4">
              <img
                src={contest.org_image_url}
                alt="Organization"
                className="h-12 w-auto rounded"
              />
            </div>
          )}

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
            <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3">
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
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Message */}
        {contest.status === 'draft' && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <p className="text-amber-400">
              🔒 This contest is still in draft mode and not yet open for square claims.
            </p>
          </div>
        )}

        {contest.status === 'locked' && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <p className="text-amber-400">
              🔒 This contest is locked. No more squares can be claimed.
            </p>
          </div>
        )}

        {contest.status === 'completed' && (
          <div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
            <p className="text-blue-400">
              🏆 This contest has been completed. Check the scores below!
            </p>
          </div>
        )}

        {/* Claiming Instructions */}
        {contest.status === 'open' && (
          <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
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

      {/* Claim Square Modal */}
      {selectedSquare && (
        <ClaimSquareModal
          isOpen={isClaimModalOpen}
          onClose={handleClaimModalClose}
          square={selectedSquare}
          contestId={contest.id}
          squarePrice={contest.square_price}
          maxSquaresPerPerson={contest.max_squares_per_person}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}

