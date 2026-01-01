'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crown, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Price } from '@/features/pricing/types';
import { UpgradeModal } from '@/features/subscriptions/components/upgrade-modal';

interface UpgradeLimitReachedProps {
  currentCount: number;
  proPrice: Price | null;
}

export function UpgradeLimitReached({ currentCount, proPrice }: UpgradeLimitReachedProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Upgrade Required</h1>
        <p className="mt-2 text-zinc-400">You&apos;ve reached your contest limit</p>
      </div>

      {/* Card */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="flex flex-col items-center p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
            <Crown className="h-8 w-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-xl font-semibold text-white">Free Plan Limit Reached</h2>
          <p className="mb-6 max-w-md text-zinc-400">
            You currently have {currentCount} active contest{currentCount !== 1 ? 's' : ''}. 
            Free accounts can have 1 active contest at a time.
          </p>

          {/* Options */}
          <ul className="mb-8 space-y-3 text-left text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-500">•</span>
              Delete an existing contest to create a new one
            </li>
            <li className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              Or upgrade to Pro for unlimited contests and no ads
            </li>
          </ul>

          {/* Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="orange" onClick={() => setShowModal(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
            <Button variant="default" asChild>
              <Link href="/dashboard">View My Contests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        proPrice={proPrice}
        currentCount={currentCount}
      />
    </div>
  );
}

