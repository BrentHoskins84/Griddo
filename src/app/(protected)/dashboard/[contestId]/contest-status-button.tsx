'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LucideIcon,Play, PlayCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/libs/supabase/types';

import { updateContestStatus } from './actions';

type ContestStatus = Database['public']['Enums']['contest_status'];

interface ButtonConfig {
  label: string;
  nextStatus: ContestStatus;
  icon: LucideIcon;
}

function getButtonConfig(currentStatus: ContestStatus): ButtonConfig | null {
  switch (currentStatus) {
    case 'draft':
      return { label: 'Open Contest', nextStatus: 'open', icon: Play };
    case 'open':
      return { label: 'Lock Contest', nextStatus: 'locked', icon: Lock };
    case 'locked':
      return { label: 'Start Game', nextStatus: 'in_progress', icon: PlayCircle };
    default:
      return null;
  }
}

interface ContestStatusButtonProps {
  contestId: string;
  currentStatus: ContestStatus;
  hasPaymentOptions: boolean;
  hasNumbers: boolean;
  className?: string;
}

export function ContestStatusButton({
  contestId,
  currentStatus,
  hasPaymentOptions,
  hasNumbers,
  className,
}: ContestStatusButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const config = getButtonConfig(currentStatus);

  if (!config) return null;

  const Icon = config.icon;

  async function handleStatusChange() {
    if (!config) return;
    
    setIsLoading(true);
    try {
      const result = await updateContestStatus(contestId, config.nextStatus);

      if (!result || result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result?.error?.message ?? 'Failed to update contest status',
        });
      } else {
        toast({
          title: 'Status Updated!',
          description: `Contest status changed to ${config.nextStatus}.`,
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="orange" onClick={handleStatusChange} disabled={isLoading} className={className}>
      <Icon className="mr-2 h-4 w-4" />
      {isLoading ? 'Updating...' : config.label}
    </Button>
  );
}
