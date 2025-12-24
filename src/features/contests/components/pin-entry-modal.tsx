'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2,Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';

import { verifyPin } from '../actions/verify-pin';

const pinSchema = z.object({
  pin: z
    .string()
    .min(1, 'PIN is required')
    .max(6, 'PIN must be 6 characters or less')
    .regex(/^[A-Za-z0-9]+$/, 'PIN must be alphanumeric'),
});

type PinFormData = z.infer<typeof pinSchema>;

interface PinEntryModalProps {
  isOpen: boolean;
  contestName: string;
  contestSlug: string;
  onSuccess: () => void;
}

export function PinEntryModal({ isOpen, contestName, contestSlug, onSuccess }: PinEntryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: '',
    },
  });

  const onSubmit = (data: PinFormData) => {
    setServerError(null);

    startTransition(async () => {
      const result = await verifyPin({
        contestSlug,
        enteredPin: data.pin,
      });

      if (result.error) {
        setServerError(result.error.message);
        return;
      }

      if (result.data?.success) {
        reset();
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
            <Lock className="h-6 w-6 text-orange-500" />
          </div>
          <DialogTitle className="text-xl">{contestName}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This contest is private. Enter the PIN to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-zinc-200">
              Enter PIN to continue
            </Label>
            <Input
              id="pin"
              type="text"
              maxLength={6}
              placeholder="Enter 6-character PIN"
              autoComplete="off"
              autoFocus
              {...register('pin')}
              className="text-center font-mono text-lg tracking-widest uppercase"
            />
            {errors.pin && <p className="text-sm text-red-500">{errors.pin.message}</p>}
            {serverError && <p className="text-sm text-red-500">{serverError}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Enter Contest'
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

