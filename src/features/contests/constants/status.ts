/**
 * Contest status values used throughout the application.
 * These match the database enum `contest_status`.
 */
export const ContestStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type ContestStatusType = (typeof ContestStatus)[keyof typeof ContestStatus];

/**
 * Payment status values for squares.
 * These match the database enum `payment_status`.
 */
export const PaymentStatus = {
  AVAILABLE: 'available',
  PENDING: 'pending',
  PAID: 'paid',
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * Game quarter values for scores.
 * These match the database enum `game_quarter`.
 */
export const GameQuarter = {
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  FINAL: 'final',
  // Baseball games
  GAME1: 'game1',
  GAME2: 'game2',
  GAME3: 'game3',
  GAME4: 'game4',
  GAME5: 'game5',
  GAME6: 'game6',
  GAME7: 'game7',
} as const;

export type GameQuarterType = (typeof GameQuarter)[keyof typeof GameQuarter];

/**
 * Display names for quarters/games
 */
export const QuarterDisplayNames: Record<GameQuarterType, string> = {
  q1: 'Q1',
  q2: 'Halftime',
  q3: 'Q3',
  final: 'Final',
  game1: 'Game 1',
  game2: 'Game 2',
  game3: 'Game 3',
  game4: 'Game 4',
  game5: 'Game 5',
  game6: 'Game 6',
  game7: 'Game 7',
};

