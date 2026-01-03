import { redirect } from 'next/navigation';

import { getSubscription } from '@/features/account/controllers/get-subscription';
import { getUser } from '@/features/account/controllers/get-user';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { SubscriptionCard } from '@/features/subscriptions/components/subscription-card';
import { UsageCard } from '@/features/subscriptions/components/usage-card';
import { getContestLimit } from '@/features/subscriptions/get-contest-limit';
import { getUsageStats } from '@/features/subscriptions/queries/get-usage-stats';

export default async function BillingPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const [subscription, products, contestLimit, usageStats] = await Promise.all([
    getSubscription(),
    getProducts(),
    getContestLimit(user.id),
    getUsageStats(user.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white lg:text-3xl">Billing</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <SubscriptionCard subscription={subscription} products={products} />
        <UsageCard activeContests={usageStats.activeContests} limit={contestLimit.limit} />
      </div>
    </div>
  );
}

