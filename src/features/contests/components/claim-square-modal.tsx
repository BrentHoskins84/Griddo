'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, Copy, DollarSign, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database } from '@/libs/supabase/types';
import { generatePaymentUrl } from '@/utils/payment-url-generator';
import { zodResolver } from '@hookform/resolvers/zod';

import { claimSquare } from '../actions/claim-square';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];
type PaymentOptionType = Database['public']['Enums']['payment_option_type'];

const claimSquareSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  venmoHandle: z.string().max(32, 'Handle is too long').optional(),
});

type ClaimSquareFormData = z.infer<typeof claimSquareSchema>;

interface ClaimSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
  square: {
    id: string;
    row_index: number;
    col_index: number;
  };
  contestId: string;
  squarePrice: number;
  maxSquaresPerPerson?: number | null;
  paymentOptions: PaymentOption[];
  onSuccess?: () => void;
}

// Payment option icons
function getPaymentIcon(type: PaymentOptionType) {
  switch (type) {
    case 'venmo':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3c.9 1.5 1.3 3 1.3 5 0 5.5-4.7 12.7-8.5 17H5.4L3 3.6l6-.6 1.3 10.8c1.2-2 2.7-5.2 2.7-7.4 0-1.9-.3-3.2-.9-4.2L19.5 3z" />
        </svg>
      );
    case 'paypal':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.85a.773.773 0 0 1 .763-.65h6.936c2.287 0 4.068.607 5.134 1.75.962 1.032 1.393 2.484 1.282 4.317l-.015.218c-.547 3.523-2.986 5.515-6.631 5.515H9.872a.773.773 0 0 0-.763.65L7.076 21.337zm12.147-13.69l.014-.158c.068-.736-.018-1.27-.299-1.727-.478-.779-1.442-1.162-2.942-1.162h-1.553c-.233 0-.44.155-.494.382l-.806 4.25c-.046.243.14.465.395.465h.843c1.614 0 2.877-.59 3.444-1.613.291-.525.44-1.193.398-1.868v-.57z" />
        </svg>
      );
    case 'cashapp':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.59 3.475a5.1 5.1 0 0 0-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 0 0-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 0 0 3.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 0 0 3.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 0 1-.67.01 5 5 0 0 0-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 4.06v1.86a.5.5 0 0 1-.5.5h-1.4a.5.5 0 0 1-.5-.5v-1.9a6.35 6.35 0 0 1-4.07-1.77.5.5 0 0 1 0-.69l.97-.97a.5.5 0 0 1 .67-.01 5.02 5.02 0 0 0 3.37 1.28c1.59 0 2.45-.64 2.45-1.42 0-.9-1.04-1.27-2.43-1.8-2.17-.76-3.67-1.7-3.67-3.48 0-2.14 1.87-3.62 4.2-3.9V5.28a.5.5 0 0 1 .5-.5h1.4a.5.5 0 0 1 .5.5v1.85c1.32.18 2.5.63 3.38 1.34a.5.5 0 0 1 .04.7z" />
        </svg>
      );
    case 'zelle':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.559 24h-2.406a.67.67 0 0 1-.665-.592l-.339-3.252h-5.11l-.339 3.252a.67.67 0 0 1-.665.592H1.63a.666.666 0 0 1-.664-.74l2.34-15.836a.667.667 0 0 1 .665-.592h4.882a.667.667 0 0 1 .665.592l2.34 15.836a.666.666 0 0 1-.664.74h-.635zm-1.707-5.834l-1.515-9.988H9.92l-1.515 9.988h3.447zm8.63 5.834h-2.406a.67.67 0 0 1-.665-.592l-.339-3.252h-1.71a.667.667 0 0 1-.665-.74l1.755-11.88a.667.667 0 0 1 .665-.593h4.882a.667.667 0 0 1 .665.593l1.755 11.88a.666.666 0 0 1-.665.74h-1.71l-.339 3.252a.67.67 0 0 1-.665.592h-.558zm-.149-5.834l-.916-7.988h-.417l-.916 7.988h2.249z" />
        </svg>
      );
    default:
      return <DollarSign className="h-5 w-5" />;
  }
}

function getPaymentColor(type: PaymentOptionType) {
  switch (type) {
    case 'venmo':
      return 'text-blue-400';
    case 'paypal':
      return 'text-blue-500';
    case 'cashapp':
      return 'text-green-400';
    case 'zelle':
      return 'text-purple-400';
    default:
      return 'text-zinc-400';
  }
}

function PaymentOptionItem({ option }: { option: PaymentOption }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(option.handle_or_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const paymentUrl = generatePaymentUrl(option.type, option.handle_or_link);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${getPaymentColor(option.type)}`}>
          {getPaymentIcon(option.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white capitalize">{option.type}</span>
            {option.display_name && (
              <span className="text-sm text-zinc-400">({option.display_name})</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-zinc-300 truncate">{option.handle_or_link}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 p-1 rounded hover:bg-zinc-700 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-zinc-400" />
              )}
            </button>
          </div>
          {/* Venmo: Show last 4 digits */}
          {option.type === 'venmo' && option.account_last_4_digits && (
            <p className="text-xs text-amber-400 mt-1">
              Verify last 4: {option.account_last_4_digits}
            </p>
          )}
        </div>

        {/* QR Code */}
        {option.qr_code_url && (
          <div className="flex-shrink-0 text-center">
            {/* Mobile: Wrap in link */}
            {paymentUrl ? (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block md:hidden"
              >
                <Image
                  src={option.qr_code_url}
                  alt={`${option.type} QR code`}
                  width={64}
                  height={64}
                  className="rounded border border-zinc-600"
                />
              </a>
            ) : (
              <Image
                src={option.qr_code_url}
                alt={`${option.type} QR code`}
                width={64}
                height={64}
                className="rounded border border-zinc-600 md:hidden"
              />
            )}
            {/* Desktop: Just show image */}
            <Image
              src={option.qr_code_url}
              alt={`${option.type} QR code`}
              width={64}
              height={64}
              className="rounded border border-zinc-600 hidden md:block"
            />
            {/* Zelle helper text */}
            {option.type === 'zelle' && (
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[64px] leading-tight">
                Scan from your bank&apos;s app
              </p>
            )}
          </div>
        )}
      </div>
      {option.instructions && (
        <p className="text-sm text-zinc-400 pl-8">{option.instructions}</p>
      )}
    </div>
  );
}

export function ClaimSquareModal({
  isOpen,
  onClose,
  square,
  contestId,
  squarePrice,
  maxSquaresPerPerson,
  paymentOptions,
  onSuccess,
}: ClaimSquareModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClaimSquareFormData>({
    resolver: zodResolver(claimSquareSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      venmoHandle: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    setStep(1);
    onClose();
  };

  const onSubmit = (data: ClaimSquareFormData) => {
    setServerError(null);

    startTransition(async () => {
      try {
        const result = await claimSquare({
          squareId: square.id,
          contestId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          venmoHandle: data.venmoHandle,
        });

        if (result.error) {
          setServerError(result.error.message);
          return;
        }

        // Move to step 2 on success
        setStep(2);
        onSuccess?.();
      } catch (error) {
        setServerError('An unexpected error occurred. Please try again.');
      }
    });
  };

  const handleDone = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Claim Your Square</DialogTitle>
              <DialogDescription>
                Fill in your details to claim this square.
              </DialogDescription>
            </DialogHeader>

            {/* Square Info */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Position</span>
                <span className="font-medium text-white">
                  Row {square.row_index}, Column {square.col_index}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Price</span>
                <span className="font-semibold text-orange-400">${squarePrice}</span>
              </div>
              {maxSquaresPerPerson && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Limit</span>
                  <span className="text-sm text-zinc-300">{maxSquaresPerPerson} squares per person</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-zinc-200">
                  First Name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-zinc-200">
                  Last Name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">
                  Email <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Venmo Handle (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="venmoHandle" className="text-zinc-200">
                  Venmo handle <span className="text-zinc-500">(optional)</span>
                </Label>
                <Input
                  id="venmoHandle"
                  type="text"
                  placeholder="@username"
                  {...register('venmoHandle')}
                  className={errors.venmoHandle ? 'border-red-500' : ''}
                />
                {errors.venmoHandle && (
                  <p className="text-sm text-red-500">{errors.venmoHandle.message}</p>
                )}
                <p className="text-xs text-zinc-500">
                  If you win, we&apos;ll use this to send your payout. No Venmo? We&apos;ll email you to ask how you&apos;d like to be paid.
                </p>
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3">
                  <p className="text-sm text-red-400">{serverError}</p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    'Claim Square'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                Your square is reserved. Please complete payment to secure it.
              </DialogDescription>
            </DialogHeader>

            {/* Claimed Square Info */}
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                <span className="font-medium text-green-400">Square Claimed!</span>
              </div>
              <div className="flex items-center justify-between pl-7">
                <span className="text-sm text-zinc-400">Position</span>
                <span className="font-medium text-white">
                  Row {square.row_index}, Column {square.col_index}
                </span>
              </div>
              <div className="flex items-center justify-between pl-7">
                <span className="text-sm text-zinc-400">Amount Due</span>
                <span className="font-semibold text-orange-400">${squarePrice}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">Payment Options</h4>
              {paymentOptions.length > 0 ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {paymentOptions.map((option) => (
                    <PaymentOptionItem key={option.id} option={option} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
                  <p className="text-sm text-zinc-400">
                    Contact the contest organizer for payment instructions.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleDone} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
