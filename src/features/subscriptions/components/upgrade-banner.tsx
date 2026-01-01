'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'upgrade-banner-dismissed';

interface UpgradeBannerProps {
  activeContestCount?: number;
}

export function UpgradeBanner({ activeContestCount }: UpgradeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-6 rounded-lg border border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-start gap-4 pr-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              You&apos;re on the Free plan{' '}
              {activeContestCount !== undefined && `(${activeContestCount}/1 contests used)`}
            </p>
            <p className="text-xs text-zinc-300">
              Upgrade to Pro for unlimited contests and no ads
            </p>
          </div>
        </div>

        <Button asChild variant="orange" size="sm" className="shrink-0">
          <Link href="/pricing">
            <Zap className="mr-1.5 h-4 w-4" />
            Upgrade to Pro
          </Link>
        </Button>
      </div>
    </div>
  );
}

