'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Shield, Star, Zap } from 'lucide-react';

import { SexyBorder } from '@/components/sexy-border';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

import { PriceCardVariant, productMetadataSchema } from '../models/product-metadata';
import { BillingInterval, Price, ProductWithPrices } from '../types';

export function PricingCard({
  product,
  price,
  createCheckoutAction,
  isLoggedIn = false,
}: {
  product: ProductWithPrices;
  price?: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
  isLoggedIn?: boolean;
}) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    price ? (price.interval as BillingInterval) : 'month'
  );

  // Determine the price to render
  const currentPrice = useMemo(() => {
    // If price is passed in we use that one. This is used on the account page when showing the user their current subscription.
    if (price) return price;

    // If no price provided we need to find the right one to render for the product.
    // First check if the product has a price - in the case of our enterprise product, no price is included.
    // We'll return null and handle that case when rendering.
    if (product.prices.length === 0) return null;

    // Next determine if the product is a one time purchase - in these cases it will only have a single price.
    if (product.prices.length === 1) return product.prices[0];

    // Lastly we can assume the product is a subscription one with a month and year price, so we get the price according to the select billingInterval
    return product.prices.find((price) => price.interval === billingInterval);
  }, [billingInterval, price, product.prices]);

  const monthPrice = product.prices.find((price) => price.interval === 'month')?.unit_amount;
  const yearPrice = product.prices.find((price) => price.interval === 'year')?.unit_amount;
  const isBillingIntervalYearly = billingInterval === 'year';
  const metadata = productMetadataSchema.parse(product.metadata);
  const buttonVariantMap = {
    free: 'default',
    pro: 'sexy',
  } as const;

  function handleBillingIntervalChange(billingInterval: BillingInterval) {
    setBillingInterval(billingInterval);
  }

  const isPro = metadata.priceCardVariant === 'pro';

  // Format price display - handle $0 as a valid price
  const displayPrice = () => {
    if (yearPrice != null && isBillingIntervalYearly) {
      return yearPrice / 100;
    }
    if (monthPrice != null) {
      return monthPrice / 100;
    }
    return 'Custom';
  };

  return (
    <WithSexyBorder variant={metadata.priceCardVariant} className='w-full flex-1'>
      <div className={cn(
        'flex w-full flex-col rounded-md border bg-black p-4 lg:p-8',
        isPro ? 'border-orange-500/30' : 'border-zinc-800'
      )}>

        <div className='p-4 pt-6'>
          <div className='mb-2 text-center font-alt text-2xl font-bold text-white'>{product.name}</div>
          
          {/* Price Display */}
          <div className='mb-2 flex flex-col items-center gap-1'>
            <div className='flex items-baseline justify-center gap-1'>
              <span className='text-4xl font-bold text-white'>
                ${displayPrice()}
              </span>
              <span className='text-lg text-zinc-400'>
                {yearPrice != null && isBillingIntervalYearly ? '/year' : monthPrice != null ? '/month' : null}
              </span>
            </div>
            
          </div>

          <p className='text-center text-sm text-zinc-400'>{product.description}</p>
        </div>

        {/* Billing Interval Switch */}
        {!Boolean(price) && product.prices.length > 1 && <PricingSwitch onChange={handleBillingIntervalChange} />}

        {/* Features List */}
        <div className='m-auto flex w-full flex-1 flex-col gap-3 px-4 py-6'>
          {isPro ? (
            <>
              <CheckItem icon={Zap} text="Unlimited active contests" />
              <CheckItem icon={Shield} text="No ads on your contests" />
              <CheckItem icon={Star} text="Custom branding & colors" />
              <CheckItem icon={Crown} text="Priority email support" />
            </>
          ) : (
            <>
              <CheckItem 
                text={metadata.activeContests === '1' ? '1 active contest at a time' : 'Unlimited contests'}
              />
              <CheckItem text={metadata.hasAds ? 'Non-obtrusive ads' : 'No ads'} />
              <CheckItem text="Custom branding & colors" />
            </>
          )}
        </div>

        {/* CTA Button */}
        {createCheckoutAction && (
          <div className='py-4'>
            {currentPrice && currentPrice.unit_amount !== 0 ? (
              <Button
                variant={buttonVariantMap[metadata.priceCardVariant]}
                className='w-full text-base font-semibold'
                onClick={() => createCheckoutAction({ price: currentPrice })}
              >
                {isPro ? (
                  <>
                    <Zap className='mr-2 h-5 w-5' />
                    {isLoggedIn ? 'Upgrade to Pro' : 'Sign up to subscribe'}
                  </>
                ) : (
                  isLoggedIn ? 'Get Started' : 'Get started free'
                )}
              </Button>
            ) : !currentPrice ? (
              <Button variant={buttonVariantMap[metadata.priceCardVariant]} className='w-full' asChild>
                <Link href='/contact'>Contact Us</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className='w-full border-zinc-700 text-zinc-400'
                disabled
              >
                Current Plan
              </Button>
            )}
          </div>
        )}
      </div>
    </WithSexyBorder>
  );
}

function CheckItem({ text, icon: Icon }: { text: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className='flex items-center gap-3'>
      {Icon ? (
        <div className='flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20'>
          <Icon className='h-3 w-3 text-orange-400' />
        </div>
      ) : (
        <Check className='h-5 w-5 flex-shrink-0 text-green-500' />
      )}
      <p className='text-sm font-medium text-zinc-300'>{text}</p>
    </div>
  );
}

export function WithSexyBorder({
  variant,
  className,
  children,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant: PriceCardVariant }) {
  if (variant === 'pro') {
    return (
      <SexyBorder className={className} offset={150}>
        {children}
      </SexyBorder>
    );
  } else {
    return (
      <div className={cn('rounded-md border-2 border-zinc-800', className)}>
        {children}
      </div>
    );
  }
}

function PricingSwitch({ onChange }: { onChange: (value: BillingInterval) => void }) {
  return (
    <Tabs
      defaultValue='month'
      className='flex items-center'
      onValueChange={(newBillingInterval) => onChange(newBillingInterval as BillingInterval)}
    >
      <TabsList className='m-auto'>
        <TabsTrigger value='month'>Monthly</TabsTrigger>
        <TabsTrigger value='year'>Yearly</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
