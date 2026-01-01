import { redirect } from 'next/navigation';

import { getUser } from '@/features/account/controllers/get-user';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { getContestLimit } from '@/features/subscriptions/get-contest-limit';

import { NewContestForm } from './new-contest-form';
import { UpgradeLimitReached } from './upgrade-limit-reached';

export default async function NewContestPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const { canCreate, currentCount } = await getContestLimit(user.id);

  if (canCreate) {
    return <NewContestForm />;
  }

  // User cannot create - fetch products to get Pro pricing
  const products = await getProducts();
  const proProduct = products.find(
    (p) => (p.metadata as Record<string, string> | null)?.price_card_variant === 'pro'
  );

  const monthlyPrice = proProduct?.prices?.find(
    (price) => price.interval === 'month'
  ) ?? null;

  return <UpgradeLimitReached currentCount={currentCount} proPrice={monthlyPrice} />;
}

