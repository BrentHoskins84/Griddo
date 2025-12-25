'use client';

import { Trophy } from 'lucide-react';

import { cn } from '@/utils/cn';

export interface Square {
  id: string;
  row_index: number;
  col_index: number;
  payment_status: 'available' | 'pending' | 'paid';
  claimant_first_name: string | null;
  claimant_last_name: string | null;
}

interface SquaresGridProps {
  squares: Square[];
  rowTeamName: string;
  colTeamName: string;
  onSquareClick?: (square: Square) => void;
  disabled?: boolean;
  showNumbers?: boolean;
  rowNumbers?: number[] | null;
  colNumbers?: number[] | null;
  winningSquareIds?: string[];
}

/**
 * Gets initials from first and last name
 * e.g., "Brent Hoskins" → "BH"
 */
function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  return `${first}${last}`;
}

/**
 * Gets the tooltip text for a square
 */
function getSquareTooltip(square: Square): string {
  if (square.payment_status === 'available') {
    return 'Available';
  }
  const name = `${square.claimant_first_name || ''} ${square.claimant_last_name || ''}`.trim();
  const status = square.payment_status === 'paid' ? 'Paid' : 'Pending Payment';
  return `${name} (${status})`;
}

export function SquaresGrid({
  squares,
  rowTeamName,
  colTeamName,
  onSquareClick,
  disabled = false,
  showNumbers = true,
  rowNumbers,
  colNumbers,
  winningSquareIds = [],
}: SquaresGridProps) {
  // Use provided numbers or default to 0-9
  const displayRowNumbers = rowNumbers ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const displayColNumbers = colNumbers ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const hasAssignedNumbers = rowNumbers !== null && rowNumbers !== undefined;
  // Create 10x10 grid from squares array
  const grid: (Square | null)[][] = Array.from({ length: 10 }, () => Array(10).fill(null));
  squares.forEach((square) => {
    if (square.row_index >= 0 && square.row_index <= 9 && square.col_index >= 0 && square.col_index <= 9) {
      grid[square.row_index][square.col_index] = square;
    }
  });

  const isClickable = !!onSquareClick && !disabled;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px] p-4">
        {/* Column team header */}
        <div className={cn('mb-2 text-center text-sm font-medium text-zinc-400', showNumbers ? 'ml-16' : 'ml-8')}>
          {colTeamName}
        </div>

        <div className="flex">
          {/* Row team label - vertical */}
          <div className="flex w-8 flex-shrink-0 items-center justify-center">
            <span
              className="whitespace-nowrap text-sm font-medium text-zinc-400"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
            >
              {rowTeamName}
            </span>
          </div>

          <div className="flex-1">
            {/* Column numbers row */}
            {showNumbers && (
              <div className="mb-1 ml-8 grid grid-cols-10 gap-1">
                {displayColNumbers.map((num, i) => (
                  <div
                    key={`col-${i}`}
                    className={cn(
                      'flex aspect-square items-center justify-center text-xs font-medium',
                      hasAssignedNumbers ? 'text-orange-400' : 'text-zinc-500'
                    )}
                  >
                    {hasAssignedNumbers ? num : '?'}
                  </div>
                ))}
              </div>
            )}

            <div className="flex">
              {/* Row numbers column */}
              {showNumbers && (
                <div className="mr-1 grid grid-rows-10 gap-1">
                  {displayRowNumbers.map((num, i) => (
                    <div
                      key={`row-${i}`}
                      className={cn(
                        'flex aspect-square w-6 items-center justify-center text-xs font-medium',
                        hasAssignedNumbers ? 'text-orange-400' : 'text-zinc-500'
                      )}
                    >
                      {hasAssignedNumbers ? num : '?'}
                    </div>
                  ))}
                </div>
              )}

              {/* Main grid */}
              <div className="flex-1">
                <div className="grid grid-cols-10 gap-1">
                  {grid.map((row, rowIndex) =>
                    row.map((square, colIndex) => {
                      const initials = square ? getInitials(square.claimant_first_name, square.claimant_last_name) : '';
                      const tooltip = square ? getSquareTooltip(square) : 'Loading...';
                      const isWinner = square && winningSquareIds.includes(square.id);

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          type="button"
                          disabled={!isClickable || !square}
                          onClick={() => {
                            if (isClickable && square) {
                              onSquareClick(square);
                            }
                          }}
                          className={cn(
                            'aspect-square rounded-sm text-xs font-medium transition-colors flex items-center justify-center relative',
                            // Winner highlight
                            isWinner && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900',
                            // Available
                            square?.payment_status === 'available' && [
                              'bg-zinc-700',
                              isClickable && 'hover:bg-zinc-600 cursor-pointer',
                            ],
                            // Pending
                            square?.payment_status === 'pending' && [
                              'bg-yellow-500/30 text-yellow-200',
                              isClickable && 'hover:bg-yellow-500/40 cursor-pointer',
                            ],
                            // Paid
                            square?.payment_status === 'paid' && [
                              'bg-green-500/30 text-green-200',
                              isClickable && 'hover:bg-green-500/40 cursor-pointer',
                            ],
                            // Loading/null state
                            !square && 'bg-zinc-800',
                            // Disabled state
                            disabled && 'opacity-50 cursor-not-allowed'
                          )}
                          title={isWinner ? `🏆 WINNER! ${tooltip}` : tooltip}
                        >
                          {isWinner ? (
                            <Trophy className="h-3 w-3 text-amber-400" />
                          ) : (
                            square?.payment_status !== 'available' && initials
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={cn('mt-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-400', showNumbers ? 'ml-16' : 'ml-8')}>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-zinc-700" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-yellow-500/30" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500/30" />
            <span>Paid</span>
          </div>
          {winningSquareIds.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-zinc-700 ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-900 flex items-center justify-center">
                <Trophy className="h-2 w-2 text-amber-400" />
              </div>
              <span>Winner</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

