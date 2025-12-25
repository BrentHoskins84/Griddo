'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ManageSquare, ManageSquareModal } from '@/features/contests/components/manage-square-modal';
import { SquaresGrid } from '@/features/contests/components';

interface DashboardGridClientProps {
  squares: ManageSquare[];
  rowTeamName: string;
  colTeamName: string;
  contestId: string;
  squarePrice: number;
}

export function DashboardGridClient({
  squares,
  rowTeamName,
  colTeamName,
  contestId,
  squarePrice,
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

