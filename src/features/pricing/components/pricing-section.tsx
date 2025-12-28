import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className="relative overflow-hidden rounded-lg bg-black py-8">
      {/* Gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-griddo-background via-griddo-surface to-griddo-background" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-griddo-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-griddo-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]">
        <HeadingLevel className="max-w-4xl bg-gradient-to-br from-white to-neutral-200 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-6xl">
          Predictable pricing for every use case.
        </HeadingLevel>
        <p className="text-center text-xl text-zinc-300">
          Find a plan that fits you. Upgrade at any time to enable additional features.
        </p>
        <p className="mx-auto mb-8 max-w-2xl text-center text-zinc-400">
          We offer a free plan so anyone can run a fundraiser—you&apos;ll see a few small ads and can
          host one contest at a time. Our paid plans remove ads and unlock more features. We price
          them to cover our costs, not to maximize profit, because our goal is keeping Griddo
          accessible for everyone.
        </p>
        <div className="flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:gap-8">
          {products.map((product) => {
            return <PricingCard key={product.id} product={product} createCheckoutAction={createCheckoutAction} />;
          })}
        </div>
      </div>
    </section>
  );
}
