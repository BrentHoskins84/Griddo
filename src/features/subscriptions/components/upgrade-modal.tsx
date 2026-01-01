'use client';

import { useState } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { Check, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createCheckoutAction } from '@/features/pricing/actions/create-checkout-action';
import type { Price } from '@/features/pricing/types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  proPrice: Price | null;
  currentCount: number;
}

export function UpgradeModal({ isOpen, onClose, proPrice, currentCount }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!proPrice) return;
    setIsLoading(true);
    try {
      await createCheckoutAction({ price: proPrice });
    } catch (error) {
      // redirect() throws a special error that Next.js handles - re-throw it
      if (isRedirectError(error)) {
        throw error;
      }
      // Handle actual errors - consider adding toast notification here
      console.error('Checkout failed:', error);
      setIsLoading(false);
    }
  };

  const formatPrice = () => {
    if (!proPrice?.unit_amount) return '';
    return `$${proPrice.unit_amount / 100}/${proPrice.interval}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='border-zinc-800 bg-zinc-900'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-white'>
            <Zap className='h-5 w-5 text-orange-500' />
            Upgrade to Create More Contests
          </DialogTitle>
          <DialogDescription className='text-zinc-400'>
            You&apos;ve reached the limit for free accounts (1 contest)
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-4 py-4'>
          {/* Free Plan */}
          <div className='space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4'>
            <h3 className='font-medium text-zinc-400'>Free Plan</h3>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2 text-zinc-400'>
                <X className='h-4 w-4 text-red-500' />1 active contest ({currentCount}/1)
              </li>
              <li className='flex items-center gap-2 text-zinc-400'>
                <X className='h-4 w-4 text-red-500' />
                Ads displayed
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className='space-y-3 rounded-lg border border-orange-500/50 bg-zinc-950 p-4'>
            <h3 className='font-medium text-white'>Pro Plan</h3>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2 text-zinc-300'>
                <Check className='h-4 w-4 text-green-500' />
                Unlimited contests
              </li>
              <li className='flex items-center gap-2 text-zinc-300'>
                <Check className='h-4 w-4 text-green-500' />
                No ads
              </li>
              <li className='flex items-center gap-2 text-zinc-300'>
                <Check className='h-4 w-4 text-green-500' />
                Priority support
              </li>
            </ul>
          </div>
        </div>

        {proPrice && <p className='text-center text-lg font-semibold text-white'>{formatPrice()}</p>}

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='ghost' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant='orange' onClick={handleUpgrade} disabled={isLoading || !proPrice}>
            {isLoading ? 'Redirecting...' : 'Upgrade to Pro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
