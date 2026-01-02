'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

interface ContestErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ContestError({ error, reset }: ContestErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10'>
          <AlertTriangle className='h-8 w-8 text-red-500' />
        </div>

        <h2 className='mb-2 text-2xl font-bold text-white'>Unable to Load Contest</h2>
        <p className='mb-6 text-zinc-400'>
          We couldn&apos;t load this contest. It may have been removed or there was a temporary issue.
        </p>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button onClick={reset} variant='default' className='gap-2'>
            <RefreshCcw className='h-4 w-4' />
            Try Again
          </Button>
          <Button asChild variant='outline' className='gap-2'>
            <Link href='/'>
              <Home className='h-4 w-4' />
              Go Home
            </Link>
          </Button>
        </div>

        {error.digest && <p className='mt-6 text-xs text-zinc-600'>Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
