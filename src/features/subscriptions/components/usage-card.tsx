import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface UsageCardProps {
  activeContests: number;
  limit: number | null;
}

export function UsageCard({ activeContests, limit }: UsageCardProps) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : limit > 0 ? Math.min(100, (activeContests / limit) * 100) : 0;
  const isNearLimit = !isUnlimited && limit > 0 && activeContests >= limit * 0.8;
  const isAtLimit = !isUnlimited && limit > 0 && activeContests >= limit;

  const displayCount = isUnlimited ? `${activeContests} / ∞` : `${activeContests} / ${limit}`;

  return (
    <Card
      className={cn(
        'border-zinc-800 bg-zinc-900',
        isAtLimit && 'border-amber-500/50 bg-amber-500/10',
        isNearLimit && !isAtLimit && 'border-orange-500/30'
      )}
    >
      <CardHeader className="pb-2">
        <CardDescription className="text-zinc-500">Active Contests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={cn('text-3xl font-bold', isAtLimit ? 'text-amber-400' : 'text-white')}>
          {displayCount}
        </p>
        {!isUnlimited && (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isAtLimit ? 'bg-amber-500' : 'bg-orange-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {isAtLimit && (
              <p className="text-xs text-amber-400">Limit reached</p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-orange-400">Approaching limit</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

