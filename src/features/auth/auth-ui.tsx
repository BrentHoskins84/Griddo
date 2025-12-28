'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IoLogoGoogle } from 'react-icons/io5';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';
import { zodResolver } from '@hookform/resolvers/zod';

const titleMap = {
  login: 'Login to Fundwell',
  signup: 'Join Fundwell and start hosting your game day fundraiser',
} as const;

const emailFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: EmailFormData) {
    setPending(true);
    const response = await signInWithEmail(data.email);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
    } else {
      toast({
        description: `To continue, click the link in the email sent to: ${data.email}`,
      });
    }

    reset();
    setPending(false);
  }

  async function handleOAuthClick(provider: 'google') {
    setPending(true);
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
      setPending(false);
    }
  }

  return (
    <section className='relative mt-16 flex w-full flex-col gap-12 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-fundwell-surface/80 to-fundwell-background p-8 text-center md:p-12'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 -z-10'>
        <div className='absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-fundwell-primary/10 blur-3xl' />
        <div className='absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full bg-fundwell-accent/10 blur-3xl' />
      </div>

      <div className='flex flex-col gap-4'>
        <Logo size='lg' className='m-auto' />
        <h1 className='text-2xl font-bold text-fundwell-text md:text-3xl'>{titleMap[mode]}</h1>
      </div>
      <div className='flex flex-col gap-4'>
        <Button
          variant='orange'
          size='lg'
          className='w-full gap-2 text-base font-semibold'
          onClick={() => handleOAuthClick('google')}
          disabled={pending}
        >
          <IoLogoGoogle size={20} />
          Continue with Google
        </Button>

        <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant='outline'
              size='lg'
              className='w-full text-base'
              disabled={pending}
            >
              Continue with Email
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='mt-[-2px] w-full rounded-b-md border border-t-0 border-zinc-700 bg-zinc-800/50 p-6'>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                <div className='space-y-2 text-left'>
                  <Label htmlFor='email'>Email address</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    aria-label='Enter your email'
                    autoFocus
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className='text-sm text-red-500'>{errors.email.message}</p>
                  )}
                </div>
                <div className='flex justify-end gap-2 pt-2'>
                  <Button type='button' onClick={() => setEmailFormOpen(false)} disabled={pending}>
                    Cancel
                  </Button>
                  <Button variant='orange' type='submit' disabled={pending}>
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {mode === 'signup' && (
        <span className='m-auto max-w-sm text-sm text-zinc-400'>
          By clicking continue, you agree to our{' '}
          <Link href='/terms' className='underline transition-colors hover:text-fundwell-primary'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='underline transition-colors hover:text-fundwell-primary'>
            Privacy Policy
          </Link>
          .
        </span>
      )}
    </section>
  );
}
