'use client';

import { Fragment } from 'react';
import { Trophy } from 'lucide-react';

import { cn } from '@/utils/cn';

import { GridSquare } from '../queries/get-squares';

interface SquaresGridProps<T extends GridSquare = GridSquare> {
  squares: T[];
  rowTeamName: string;
  colTeamName: string;
  onSquareClick?: (square: T) => void;
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
function getSquareTooltip(square: GridSquare): string {
  if (square.payment_status === 'available') {
    return 'Available';
  }
  const name = `${square.claimant_first_name || ''} ${square.claimant_last_name || ''}`.trim();
  const status = square.payment_status === 'paid' ? 'Paid' : 'Pending Payment';
  return `${name} (${status})`;
}

export function SquaresGrid<T extends GridSquare = GridSquare>({
  squares,
  rowTeamName,
  colTeamName,
  onSquareClick,
  disabled = false,
  showNumbers = true,
  rowNumbers,
  colNumbers,
  winningSquareIds = [],
}: SquaresGridProps<T>) {
  // Use provided numbers or default to 0-9
  const displayRowNumbers = rowNumbers ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const displayColNumbers = colNumbers ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const hasAssignedNumbers = rowNumbers !== null && rowNumbers !== undefined;
  
  // Create 10x10 grid from squares array
  const grid: (T | null)[][] = Array.from({ length: 10 }, () => Array(10).fill(null));
  squares.forEach((square) => {
    if (square.row_index >= 0 && square.row_index <= 9 && square.col_index >= 0 && square.col_index <= 9) {
      grid[square.row_index][square.col_index] = square;
    }
  });

  const isClickable = !!onSquareClick && !disabled;

  // Grid column template based on whether numbers are shown
  // Using fixed sizes to prevent collapse on mobile - grid will scroll horizontally
  // On lg+ screens, use larger squares for better desktop experience
  const gridColsClass = showNumbers
    ? 'grid-cols-[24px_repeat(10,40px)] sm:grid-cols-[28px_repeat(10,44px)] md:grid-cols-[32px_repeat(10,48px)] lg:grid-cols-[36px_repeat(10,56px)]'
    : 'grid-cols-[repeat(10,40px)] sm:grid-cols-[repeat(10,44px)] md:grid-cols-[repeat(10,48px)] lg:grid-cols-[repeat(10,56px)]';

  return (
    <div className="relative">
      {/* Scroll shadow indicators - hint that content is scrollable (mobile only) */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-zinc-800 to-transparent opacity-50 lg:hidden" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-zinc-800 to-transparent opacity-50 lg:hidden" />
      
      {/* Scrollable container on mobile, centered on desktop */}
      <div className="overflow-x-auto lg:overflow-visible lg:flex lg:justify-center">
        {/* Fixed minimum width container - prevents grid collapse on mobile, centers on desktop */}
        <div className="min-w-[480px] w-max p-3 sm:p-4 lg:min-w-0">
          {/* Main layout: Row team label + Grid */}
          <div className="flex gap-1 lg:gap-2">
            {/* Row team label - vertical, outside the grid */}
            <div className="flex w-5 flex-shrink-0 items-center justify-center sm:w-6 lg:w-8">
              <span
                className="whitespace-nowrap text-[10px] font-medium text-zinc-400 sm:text-xs lg:text-sm"
                style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
              >
                {rowTeamName}
              </span>
            </div>

            {/* Grid container */}
            <div>
              {/* Column team header */}
              <div className={cn(
                'mb-1.5 text-center text-[10px] font-medium text-zinc-400 sm:mb-2 sm:text-xs lg:text-sm lg:mb-3',
                showNumbers && 'pl-6 sm:pl-7 md:pl-8 lg:pl-9'
              )}>
                {colTeamName}
              </div>

              {/* Unified CSS Grid for numbers and squares */}
              <div className={cn('grid gap-1 lg:gap-1.5', gridColsClass)}>
                {/* Row 0: Empty corner cell + Column numbers */}
                {showNumbers && (
                  <>
                    {/* Empty top-left corner */}
                    <div className="h-6 sm:h-7 md:h-8 lg:h-9" />
                    
                    {/* Column numbers */}
                    {displayColNumbers.map((num, i) => (
                      <div
                        key={`col-${i}`}
                        className={cn(
                          'flex h-6 items-center justify-center text-xs font-medium sm:h-7 sm:text-sm md:h-8 lg:h-9',
                          hasAssignedNumbers ? 'text-orange-400' : 'text-zinc-500'
                        )}
                      >
                        {hasAssignedNumbers ? num : '?'}
                      </div>
                    ))}
                  </>
                )}

                {/* Rows 1-10: Row number + 10 squares */}
                {grid.map((row, rowIndex) => (
                  <Fragment key={`row-${rowIndex}`}>
                    {/* Row number */}
                    {showNumbers && (
                      <div
                        className={cn(
                          'flex h-10 items-center justify-center text-xs font-medium sm:h-11 sm:text-sm md:h-12 lg:h-14',
                          hasAssignedNumbers ? 'text-orange-400' : 'text-zinc-500'
                        )}
                      >
                        {hasAssignedNumbers ? displayRowNumbers[rowIndex] : '?'}
                      </div>
                    )}

                    {/* 10 squares for this row */}
                    {row.map((square, colIndex) => {
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
                            // Base styles - fixed height to match grid columns
                            'h-10 rounded-sm font-medium transition-all flex items-center justify-center relative select-none',
                            'text-xs sm:h-11 sm:text-sm md:h-12 lg:h-14 lg:rounded',
                            // Touch feedback
                            isClickable && 'active:scale-95 active:opacity-80',
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
                            <Trophy className="h-4 w-4 text-amber-400 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                          ) : (
                            square?.payment_status !== 'available' && initials
                          )}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-400">
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
    </div>
  );
}
