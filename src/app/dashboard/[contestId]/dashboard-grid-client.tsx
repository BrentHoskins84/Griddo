'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { SquaresGrid } from '@/features/contests/components';
import { ManageSquare, ManageSquareModal } from '@/features/contests/components/manage-square-modal';

interface DashboardGridClientProps {
  squares: ManageSquare[];
  rowTeamName: string;
  colTeamName: string;
  contestId: string;
  squarePrice: number;
  rowNumbers?: number[] | null;
  colNumbers?: number[] | null;
  winningSquareIds?: string[];
}

export function DashboardGridClient({
  squares,
  rowTeamName,
  colTeamName,
  contestId,
  squarePrice,
  rowNumbers,
  colNumbers,
  winningSquareIds = [],
}: DashboardGridClientProps) {
  const router = useRouter();
  const [selectedSquare, setSelectedSquare] = useState<ManageSquare | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const handleSquareClick = (square: ManageSquare) => {
    setSelectedSquare(square);
    setIsManageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsManageModalOpen(false);
    setSelectedSquare(null);
  };

  const handleSuccess = () => {
    // Refresh the page data
    router.refresh();
  };

  return (
    <>
      <SquaresGrid
        squares={squares}
        rowTeamName={rowTeamName}
        colTeamName={colTeamName}
        onSquareClick={handleSquareClick}
        showNumbers={true}
        rowNumbers={rowNumbers}
        colNumbers={colNumbers}
        winningSquareIds={winningSquareIds}
      />

      <ManageSquareModal
        isOpen={isManageModalOpen}
        onClose={handleCloseModal}
        square={selectedSquare}
        contestId={contestId}
        squarePrice={squarePrice}
        onSuccess={handleSuccess}
      />
    </>
  );
}

