'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { resendMagicLink } from '@/features/auth/auth-actions';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleResend() {
    if (!email) return;

    startTransition(async () => {
      const response = await resendMagicLink(email);

      if (response?.error) {
        toast({
          variant: 'destructive',
          description: response.error.message,
        });
      } else {
        toast({
          description: 'Magic link sent! Check your email.',
        });
        setCanResend(false);
        setCountdown(60);
      }
    });
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <div className='relative mt-16 flex w-full flex-col gap-8 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-fundwell-surface/80 to-fundwell-background p-8 text-center md:p-12'>
        {/* Background decorative elements */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-fundwell-primary/10 blur-3xl' />
          <div className='absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full bg-fundwell-accent/10 blur-3xl' />
        </div>

        <div className='flex flex-col gap-4'>
          <Logo size='lg' className='m-auto' />
          <h1 className='text-2xl font-bold text-fundwell-text md:text-3xl'>Check your email</h1>
          <p className='text-zinc-400'>
            We sent a magic link to <span className='font-medium text-fundwell-text'>{email}</span>.
            Click the link in the email to continue.
          </p>
        </div>

        <ul className='space-y-2 text-left text-sm text-zinc-400'>
          <li className='flex items-start gap-2'>
            <span className='text-fundwell-primary'>•</span>
            The link expires in 1 hour
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-fundwell-primary'>•</span>
            Check your spam folder if you don&apos;t see it
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-fundwell-primary'>•</span>
            You can close this page after clicking the link
          </li>
        </ul>

        <div className='flex flex-col gap-4'>
          <Button
            variant='orange'
            size='lg'
            className='w-full text-base font-semibold'
            onClick={handleResend}
            disabled={!canResend || isPending || !email}
          >
            {canResend ? 'Resend email' : `Resend email in ${countdown}s`}
          </Button>

          <Link
            href='/login'
            className='text-sm text-zinc-400 underline transition-colors hover:text-fundwell-primary'
          >
            Back to login
          </Link>
        </div>
      </div>
    </section>
  );
}

