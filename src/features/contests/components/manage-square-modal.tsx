'use client';

import { useTransition } from 'react';
import { AlertTriangle, Calendar, Loader2, Mail, Phone, User, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/utils/date-formatters';

import { updateSquareStatus } from '../actions/update-square-status';
import { PaymentStatus } from '../types';

export interface ManageSquare {
  id: string;
  row_index: number;
  col_index: number;
  payment_status: PaymentStatus;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  claimant_email: string | null;
  claimant_venmo: string | null;
  claimed_at: string | null;
  paid_at: string | null;
  referred_by: string | null;
}

interface ManageSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
  square: ManageSquare | null;
  contestId: string;
  squarePrice: number;
  onSuccess?: () => void;
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case 'available':
      return (
        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
          Available
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
          Pending Payment
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
          Paid
        </Badge>
      );
  }
}

export function ManageSquareModal({
  isOpen,
  onClose,
  square,
  contestId,
  squarePrice,
  onSuccess,
}: ManageSquareModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!square) return null;

  const handleUpdateStatus = (newStatus: PaymentStatus) => {
    startTransition(async () => {
      const result = await updateSquareStatus({
        squareId: square.id,
        contestId,
        newStatus,
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      const messages: Record<PaymentStatus, string> = {
        available: 'Square has been released and is now available',
        pending: 'Payment status set to pending',
        paid: 'Square marked as paid',
      };

      toast({
        title: 'Success',
        description: messages[newStatus],
      });

      onSuccess?.();
      onClose();
    });
  };

  const claimantName = [square.claimant_first_name, square.claimant_last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Square</DialogTitle>
          <DialogDescription>
            Row {square.row_index}, Column {square.col_index}
          </DialogDescription>
        </DialogHeader>

        {/* Square Status */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="space-y-1">
            <span className="text-sm text-zinc-400">Status</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={square.payment_status} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-zinc-400">Price</span>
            <p className="font-semibold text-orange-400">${squarePrice}</p>
          </div>
        </div>

        {/* Available State */}
        {square.payment_status === 'available' && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6 text-center">
            <p className="text-zinc-400">This square is available</p>
            <p className="mt-1 text-sm text-zinc-500">No claimant information to display</p>
          </div>
        )}

        {/* Claimant Info */}
        {square.payment_status !== 'available' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-300">Claimant Information</h4>
            
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              {/* Name */}
              {claimantName && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span className="text-white">{claimantName}</span>
                </div>
              )}
              
              {/* Email */}
              {square.claimant_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <a
                    href={`mailto:${square.claimant_email}`}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {square.claimant_email}
                  </a>
                </div>
              )}
              
              {/* Venmo Handle (as phone/contact alternative) */}
              {square.claimant_venmo && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-300">{square.claimant_venmo}</span>
                </div>
              )}

              {/* Referred By */}
              {square.referred_by && (
                <div className="flex items-center gap-3">
                  <UserPlus className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Referred by {square.referred_by}</span>
                </div>
              )}
              
              {/* Claimed Date */}
              {square.claimed_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">
                    Claimed {formatDateTime(square.claimed_at)}
                  </span>
                </div>
              )}

              {/* Paid Date */}
              {square.paid_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-400">
                    Paid {formatDateTime(square.paid_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {square.payment_status === 'available' && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          )}

          {square.payment_status === 'pending' && (
            <>
              <Button
                variant="orange"
                onClick={() => handleUpdateStatus('paid')}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Mark as Paid
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('available')}
                disabled={isPending}
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Release Square
              </Button>
            </>
          )}

          {square.payment_status === 'paid' && (
            <>
              <Button
                variant="default"
                onClick={() => handleUpdateStatus('pending')}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Mark as Pending
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('available')}
                disabled={isPending}
                className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Release Square
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

