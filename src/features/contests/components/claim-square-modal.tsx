'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, Copy, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

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
import { logger } from '@/utils/logger';
import { generatePaymentUrl } from '@/utils/payment-url-generator';
import { zodResolver } from '@hookform/resolvers/zod';

import { claimSquare } from '../actions/claim-square';
import { PaymentOption } from '../types';
import { Player } from '../types/player';
import { getPaymentConfig } from '../utils/payment-helpers';
import { ClaimSquareFormData, claimSquareSchema } from '../validation';

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
  enablePlayerTracking?: boolean;
  players?: Player[];
  referredByPlayer?: Player | null;
}

function PaymentOptionItem({ option }: { option: PaymentOption }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(option.handle_or_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('claim-square-modal', err);
    }
  };

  const paymentUrl = generatePaymentUrl(option.type, option.handle_or_link);

  const { color, Icon } = getPaymentConfig(option.type);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${color}`}>
          <Icon className="h-5 w-5" />
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
  enablePlayerTracking,
  players,
  referredByPlayer,
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
      referredBySlug: referredByPlayer?.slug || '',
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
          referredBySlug: referredByPlayer?.slug || data.referredBySlug || undefined,
        });

        if (result?.error) {
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

              {/* Referral (Player Tracking) */}
              {enablePlayerTracking && (
                <div className="space-y-2">
                  <Label htmlFor="referredBy" className="text-zinc-200">
                    Who sent you? <span className="text-zinc-500">(optional)</span>
                  </Label>
                  {referredByPlayer ? (
                    <Input
                      id="referredBy"
                      value={referredByPlayer.name}
                      readOnly
                      disabled
                      className="bg-zinc-700 text-zinc-300"
                    />
                  ) : (
                    <select
                      {...register('referredBySlug')}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                    >
                      <option value="">No one / Found it myself</option>
                      {players?.map((player) => (
                        <option key={player.slug} value={player.slug}>
                          {player.name}{player.number ? ` #${player.number}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

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
