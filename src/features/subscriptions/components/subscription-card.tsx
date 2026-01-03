import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';
import { formatDate } from '@/utils/date-formatters';

interface SubscriptionCardProps {
  subscription: SubscriptionWithProduct | null;
  products: ProductWithPrices[];
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  past_due: 'Past Due',
  unpaid: 'Unpaid',
  paused: 'Paused',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  trialing: 'secondary',
  canceled: 'destructive',
  incomplete: 'secondary',
  incomplete_expired: 'destructive',
  past_due: 'destructive',
  unpaid: 'destructive',
  paused: 'secondary',
};

export function SubscriptionCard({ subscription, products }: SubscriptionCardProps) {
  const productId = subscription?.prices?.products?.id;
  const product = productId ? products.find((p) => p.id === productId) : null;

  const planName = product?.name ?? 'Free Plan';
  const price = subscription?.prices;
  const status = subscription?.status;

  const formatPrice = () => {
    if (!price?.unit_amount) return null;
    const amount = price.unit_amount / 100;
    const interval = price.interval === 'year' ? 'year' : 'month';
    return `$${amount.toFixed(2)}/${interval}`;
  };

  const nextBillingDate = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : null;

  return (
    <Card className="border-zinc-800 bg-zinc-800/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white">{planName}</CardTitle>
            {price && (
              <CardDescription className="mt-1 text-base text-zinc-300">
                {formatPrice()}
              </CardDescription>
            )}
          </div>
          {status && (
            <Badge variant={STATUS_VARIANTS[status] ?? 'default'}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {nextBillingDate && (
          <div className="text-sm text-zinc-400">
            <span className="text-zinc-500">Next billing:</span> {nextBillingDate}
          </div>
        )}
        {!subscription && (
          <p className="text-sm text-zinc-400">Upgrade to unlock unlimited contests</p>
        )}
      </CardContent>
      <CardFooter>
        {subscription ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href="/manage-subscription">Manage Subscription</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

