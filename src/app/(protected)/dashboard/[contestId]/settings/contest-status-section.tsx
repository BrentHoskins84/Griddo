'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Lock, Play, Unlock, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];
type ContestStatus = Database['public']['Enums']['contest_status'];

const STATUS_CONFIG: Record<ContestStatus, {
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  draft: {
    label: 'Draft',
    description: 'Contest is not visible to participants',
    variant: 'secondary',
  },
  open: {
    label: 'Open',
    description: 'Participants can claim squares',
    variant: 'default',
  },
  locked: {
    label: 'Locked',
    description: 'Square claiming is paused',
    variant: 'outline',
  },
  in_progress: {
    label: 'In Progress',
    description: 'Game is being played, scores can be entered',
    variant: 'default',
  },
  completed: {
    label: 'Completed',
    description: 'Contest has ended, winners determined',
    variant: 'secondary',
  },
};

interface StatusTransition {
  targetStatus: ContestStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  setPublic?: boolean;
}

const STATUS_TRANSITIONS: Record<ContestStatus, StatusTransition[]> = {
  draft: [
    {
      targetStatus: 'open',
      label: 'Open Contest',
      description: 'This will make your contest visible to participants and allow them to claim squares.',
      icon: <Users className="mr-2 h-4 w-4" />,
      setPublic: true,
    },
  ],
  open: [
    {
      targetStatus: 'locked',
      label: 'Lock Contest',
      description: 'This will prevent participants from claiming new squares. You can reopen it later.',
      icon: <Lock className="mr-2 h-4 w-4" />,
      variant: 'outline',
    },
  ],
  locked: [
    {
      targetStatus: 'open',
      label: 'Reopen Contest',
      description: 'This will allow participants to claim squares again.',
      icon: <Unlock className="mr-2 h-4 w-4" />,
      variant: 'outline',
    },
    {
      targetStatus: 'in_progress',
      label: 'Start Game',
      description: 'This indicates the game has started. You can begin entering scores.',
      icon: <Play className="mr-2 h-4 w-4" />,
    },
  ],
  in_progress: [
    {
      targetStatus: 'completed',
      label: 'Complete Contest',
      description: 'This will mark the contest as finished. This action cannot be undone.',
      icon: <CheckCircle className="mr-2 h-4 w-4" />,
      variant: 'destructive',
    },
  ],
  completed: [],
};

interface ContestStatusSectionProps {
  contest: Contest;
}

export function ContestStatusSection({ contest }: ContestStatusSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<StatusTransition | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const currentStatus = contest.status as ContestStatus;
  const statusConfig = STATUS_CONFIG[currentStatus];
  const availableTransitions = STATUS_TRANSITIONS[currentStatus];

  const handleTransition = (transition: StatusTransition) => {
    setConfirmDialog(transition);
  };

  const confirmTransition = () => {
    if (!confirmDialog) return;

    startTransition(async () => {
      const updates: Partial<Contest> = {
        status: confirmDialog.targetStatus,
      };

      if (confirmDialog.setPublic) {
        updates.is_public = true;
      }

      const result = await updateContest(contest.id, updates);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        setConfirmDialog(null);
        return;
      }

      toast({
        title: 'Status updated',
        description: `Contest is now ${STATUS_CONFIG[confirmDialog.targetStatus].label.toLowerCase()}.`,
      });

      setConfirmDialog(null);
      router.refresh();
    });
  };

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Contest Status</CardTitle>
          <CardDescription>Manage your contest lifecycle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge variant={currentStatus}>{statusConfig.label}</Badge>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{statusConfig.description}</p>
            </div>
          </div>

          {/* Available Transitions */}
          {availableTransitions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300">Available Actions</p>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map((transition) => (
                  <Button
                    key={transition.targetStatus}
                    variant={transition.variant ?? 'default'}
                    onClick={() => handleTransition(transition)}
                    disabled={isPending}
                  >
                    {transition.icon}
                    {transition.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-zinc-400">
                This contest has ended. No further status changes are available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.variant ?? 'default'}
              onClick={confirmTransition}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmDialog?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

