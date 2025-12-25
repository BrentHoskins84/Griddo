'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { deleteContest } from '@/features/contests/actions/delete-contest';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];

interface DangerZoneSectionProps {
  contest: Contest;
}

export function DangerZoneSection({ contest }: DangerZoneSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const isConfirmationValid = confirmationText === contest.name;

  const handleDelete = () => {
    if (!isConfirmationValid) return;

    startTransition(async () => {
      const result = await deleteContest(contest.id);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Contest deleted',
        description: 'Your contest has been permanently deleted.',
      });

      setIsDialogOpen(false);
      router.push('/dashboard');
    });
  };

  const handleOpenDialog = () => {
    setConfirmationText('');
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="border-red-500/30 bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-500/20 bg-red-950/20 p-4">
            <div className="flex-1">
              <h4 className="font-medium text-white">Delete Contest</h4>
              <p className="mt-1 text-sm text-zinc-400">
                Deleting a contest is permanent and cannot be undone. All squares and participant
                data will be removed.
              </p>
            </div>
            <Button variant="destructive" onClick={handleOpenDialog}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Contest
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Contest
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All contest data, squares, and participant information
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-3">
              <p className="text-sm text-zinc-300">
                To confirm, type <span className="font-mono font-bold text-white">{contest.name}</span>{' '}
                below:
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation" className="sr-only">
                Contest name confirmation
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type contest name to confirm"
                className="border-zinc-700 bg-zinc-800"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmationValid || isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

