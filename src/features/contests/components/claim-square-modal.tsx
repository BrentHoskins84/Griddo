'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
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
import { zodResolver } from '@hookform/resolvers/zod';

import { claimSquare } from '../actions/claim-square';

const claimSquareSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().max(20, 'Phone number is too long').optional(),
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
  onSuccess?: () => void;
}

export function ClaimSquareModal({
  isOpen,
  onClose,
  square,
  contestId,
  squarePrice,
  maxSquaresPerPerson,
  onSuccess,
}: ClaimSquareModalProps) {
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
      phone: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
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
          phone: data.phone,
        });

        if (result.error) {
          setServerError(result.error.message);
          return;
        }

        reset();
        onSuccess?.();
        handleClose();
      } catch (error) {
        setServerError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
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

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-200">
              Phone <span className="text-zinc-500">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
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
      </DialogContent>
    </Dialog>
  );
}

